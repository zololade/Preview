import { applyAttrs, removeAttrs } from "./lib/attrs";
import { initializeEvents, type HandlersByEvent } from "./lib/eventDelegator";
import { SVG_TAGS } from "./lib/svg";
import type { BuiltEl, DOMBuilderEl, Engine, Registry, VNode } from "./lib/types";

const SVG_NS = "http://www.w3.org/2000/svg";

function buildDOM(incomingObject: VNode | VNode[], registry: Registry): BuiltEl {
  if (Array.isArray(incomingObject)) {
    const el = document.createDocumentFragment();
    incomingObject.forEach((child) => {
      el.appendChild(buildDOM(child, registry));
    });
    return el;
  }

  // Destructure properties with safe fallbacks
  const { tag, children, attrs = {}, actions, ref, onMount } = incomingObject;

  // Create the element with correct namespace
  const el = (
    SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag)
  ) as DOMBuilderEl;

  // Register refs and actions
  if (ref !== undefined && actions !== undefined) {
    registry.set(ref, { dom: el, actions });
  }

  // Trigger onMount hook
  if (onMount) {
    (onMount as (el: DOMBuilderEl) => void | Promise<void>)(el);
  }

  // Apply element properties safely
  applyAttrs(el, attrs);

  // Process children inside the object scope context
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach((child) => {
      el.appendChild(buildDOM(child, registry));
    });
  }

  return el;
}

function patch(
  oldVNode: VNode | VNode[],
  newVNode: VNode | VNode[],
  dom: BuiltEl,
  registry: Registry,
) {
  if (Array.isArray(oldVNode) && Array.isArray(newVNode)) {
    return;
  }
  if (Array.isArray(oldVNode) || Array.isArray(newVNode)) {
    return;
  }

  const oldChild = oldVNode.children;
  const newChild = newVNode.children;

  // patch:tag change
  if (oldVNode.tag !== newVNode.tag) {
    const parentContainer = dom.parentElement;
    parentContainer?.replaceChild(buildDOM(newVNode, registry), dom);
    return;
  }

  // patch:update attributes
  if (oldVNode.attrs && newVNode.attrs && oldVNode.attrs === newVNode.attrs) {
    console.warn(
      `Same attrs object reused for <${newVNode.tag}>${newVNode.ref ? ` (ref: "${newVNode.ref}")` : ""}:`,
      newVNode.attrs,
    );
  }
  if (newVNode.attrs) {
    // add attribute
    for (const [key, value] of Object.entries(newVNode.attrs)) {
      // in old and old has key
      if (oldVNode.attrs && Object.hasOwn(oldVNode.attrs, key)) {
        if ((oldVNode.attrs as Record<string, unknown>)[key] === value) continue;
      }
      applyAttrs(dom as DOMBuilderEl, { [key]: value });
      continue;
    }
  }
  if (oldVNode.attrs) {
    // remove attribute
    for (const [key, value] of Object.entries(oldVNode.attrs)) {
      if (!newVNode.attrs || !Object.hasOwn(newVNode.attrs, key)) {
        removeAttrs(dom as DOMBuilderEl, { [key]: value });
      }
    }
  }

  // patch:children branch
  // start:base cases
  if (oldChild === undefined && newChild === undefined) return;
  // handle string
  if (typeof oldChild === "string" && typeof newChild === "string") {
    if (oldChild !== newChild) dom.textContent = newChild;
    return;
  }
  // end:base cases

  // handle oldChild undefined and new child Array or string, and vice versa
  if (typeof oldChild !== "undefined" && typeof newChild === "undefined") {
    if (isProperNode(dom)) {
      dom.replaceChildren();
    } else {
      dom.textContent = "";
    }
    return;
  }

  if (typeof oldChild === "undefined" && typeof newChild !== "undefined") {
    if (typeof newChild === "string") {
      dom.textContent = newChild;
      return;
    }
    dom.appendChild(buildDOM(newChild, registry));
    return;
  }

  // handle oldChild is string and newChild is Array or, and vice versa
  if (typeof oldChild === "string" && Array.isArray(newChild)) {
    const textNode = dom.firstChild;
    if (textNode) dom.replaceChild(buildDOM(newChild, registry), textNode);
    return;
  }

  if (Array.isArray(oldChild) && typeof newChild === "string") {
    const textNode = document.createTextNode(newChild);

    if (isProperNode(dom)) {
      dom.replaceChildren(textNode);
    } else {
      dom.textContent = newChild;
    }
    return;
  }

  // dive deeper into each child node
  if (Array.isArray(oldChild) && Array.isArray(newChild)) {
    //  explore old and new child together
    oldChild.forEach((_value, index) => {
      if (oldChild && newChild)
        patch(oldChild[index]!, newChild[index]!, dom.childNodes[index] as BuiltEl, registry);
      //remove assertion when individual cases have been handled
    });
    return;
  }
}

function createEngine(buildTree: () => VNode | VNode[]): Engine {
  const registry: Registry = new Map();

  // Track internal state across renders
  let currentVNode: VNode | VNode[] | null = null;
  let rootContainer: HTMLElement | null = null;
  let rootDOMElement: BuiltEl | null = null;

  return {
    mount(container: HTMLElement) {
      if (rootContainer) {
        throw new Error("This engine is already mounted.");
      }

      registry.clear();
      rootContainer = container;

      // Generate the initial tree representation
      currentVNode = buildTree();
      rootDOMElement = buildDOM(currentVNode, registry);

      container.innerHTML = ""; // Clear existing fallback HTML
      container.appendChild(rootDOMElement);

      return {
        link(handlers: HandlersByEvent) {
          initializeEvents(handlers, container);
        },
      };
    },

    render() {
      if (!rootContainer || !currentVNode || !rootDOMElement) {
        throw new Error("Engine must be mounted before rendering updates.");
      }

      // Generate the fresh virtual tree
      const nextVNode = buildTree();

      // Patch the live DOM and update the tree tracking pointer
      patch(currentVNode, nextVNode, rootDOMElement, registry);
      currentVNode = nextVNode;
    },

    dispatch(ref: string, command: string) {
      const meta = registry.get(ref);
      if (!meta) throw new Error(`Ref "${ref}" not found`);
      const action = meta.actions[command];
      if (!action) throw new Error(`Unknown command "${command}"`);
      action(meta.dom);
    },
  };
}

// helper
function isProperNode(el: BuiltEl): el is Exclude<BuiltEl, Text> {
  if (el instanceof HTMLElement || el instanceof SVGElement || el instanceof DocumentFragment) {
    return true;
  } else {
    return false;
  }
}
export { createEngine };
