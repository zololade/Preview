import { SVG_TAGS } from "./svg";
import type { BuiltEl, DOMBuilderEl, Engine, Registry, VNode } from "./types";

function buildDOM(incomingObject: unknown, registry: Registry): BuiltEl {
  // Handle Text Nodes immediately
  if (!isObject(incomingObject)) {
    return document.createTextNode(String(incomingObject));
  }

  // Destructure properties with safe fallbacks
  const { tag, children, attrs = {}, props = {}, actions, ref, onMount } = incomingObject;

  // Create the element with correct namespace
  const el = (
    SVG_TAGS.has(tag)
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag)
  ) as DOMBuilderEl;

  // Register refs and actions
  if (ref !== undefined && actions !== undefined) {
    registry.set(ref, { dom: el, actions });
  }

  // Trigger onMount hook
  if (onMount) {
    onMount(el);
  }

  // Apply element properties safely
  Object.entries(props).forEach(([key, value]) => {
    if (key === "xmlns") return;
    if (el instanceof SVGElement) {
      el.setAttribute(key, String(value));
    } else {
      (el as Record<string, any>)[key] = value;
    }
  });

  // Apply standard attributes
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, String(value));
  });

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

function createEngine(buildTree: () => VNode): Engine {
  const registry: Registry = new Map();
  // Track internal state across renders
  let currentVNode: VNode | null = null;
  let rootContainer: HTMLElement | null = null;
  let rootDOMElement: BuiltEl | null = null;

  return {
    mount(container: HTMLElement) {
      registry.clear();
      rootContainer = container;

      // Generate the initial tree representation
      currentVNode = buildTree();
      rootDOMElement = buildDOM(currentVNode, registry);

      container.innerHTML = ""; // Clear existing fallback HTML
      container.appendChild(rootDOMElement);
    },

    render() {
      if (!rootContainer || !currentVNode || !rootDOMElement) {
        throw new Error("Engine must be mounted before rendering updates.");
      }
      // Generate the fresh virtual tree
      // const nextVNode = buildTree();
      // Patch the live DOM and update the tree tracking pointer
      // rootDOMElement = patch(currentVNode, nextVNode, rootDOMElement, registry);
      // currentVNode = nextVNode;
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

function isObject(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { createEngine };
