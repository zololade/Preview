import { initializeEvents, type HandlersByEvent } from "./lib/eventDelegator";
import { SVG_PROP_KEYS, SVG_TAGS } from "./lib/svg";
import type { BuiltEl, DOMBuilderEl, Engine, Registry, VNode } from "./lib/types";

const SVG_NS = "http://www.w3.org/2000/svg";

function buildDOM(incomingObject: unknown, registry: Registry): BuiltEl {
  // Handle Text Nodes immediately
  if (!isObject(incomingObject)) {
    return document.createTextNode(String(incomingObject));
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

function patch(oldVNode: VNode, newVNode: VNode, _dom: BuiltEl, registry: Registry): BuiltEl {
  if (isObject(oldVNode) && isObject(newVNode) && oldVNode.tag === newVNode.tag) {
  }
  const newDom = buildDOM(newVNode, registry);
  return newDom;
}

function createEngine(buildTree: () => VNode): Engine {
  const registry: Registry = new Map();

  // Track internal state across renders
  let currentVNode: VNode | null = null;
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

//helper
function applyAttrs(el: DOMBuilderEl, attrs: Record<string, unknown>) {
  const isSvg = el.namespaceURI === SVG_NS;

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === "class" || key === "className") {
      el.setAttribute("class", String(value));
      continue;
    }

    if (isSvg) {
      if (SVG_PROP_KEYS.has(key)) {
        Reflect.set(el, key, value);
      } else {
        el.setAttribute(key, String(value));
      }
      continue;
    }

    if (key in el) {
      Reflect.set(el, key, value);
    } else {
      el.setAttribute(key, String(value));
    }
  }
}

function isObject(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { createEngine };
