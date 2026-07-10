import { SVG_TAGS } from "./svg";
import type { BuiltEl, DOMBuilderEl, Engine, Registry, VNode } from "./types";

function buildDOM(incomingObject: VNode, registry: Registry): BuiltEl {
  let tag: VNode["tag"], children: VNode["children"], el: DOMBuilderEl;

  if (isObject(incomingObject)) {
    let attrs: VNode["attrs"], props: VNode["props"], actions: VNode["actions"], ref: VNode["ref"];
    ({ tag, children, attrs = {}, props = {}, actions, ref } = incomingObject);

    el = (
      SVG_TAGS.has(tag)
        ? document.createElementNS("http://www.w3.org/2000/svg", tag)
        : document.createElement(tag)
    ) as DOMBuilderEl;

    if (ref !== undefined && actions !== undefined) {
      registry.set(ref, { dom: el, actions: actions });
    }

    if (incomingObject.onMount) {
      incomingObject.onMount(el);
    }

    // Apply props safely using object indexing mapping
    Object.entries(props).forEach(([key, value]) => {
      if (key === "xmlns") return;
      if (el instanceof SVGElement) {
        el.setAttribute(key, String(value));
        return;
      }
      (el as Record<string, any>)[key] = value;
    });

    // Apply attributes safely via setAttribute
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
  } else {
    return document.createTextNode(String(incomingObject));
  }

  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach((data) => {
      el.appendChild(buildDOM(data, registry));
    });
  }

  return el;
}

function createEngine(): Engine {
  const registry: Registry = new Map();
  return {
    mount(container: HTMLElement, rootVNode: VNode) {
      registry.clear();
      const root = buildDOM(rootVNode, registry);
      container.appendChild(root);
    },
    dispatch(ref: string, command: string) {
      const meta = registry.get(ref);
      if (!meta) throw new Error(`Ref "${ref}" not found`);
      const action = meta.actions[command];
      if (!action) throw new Error(`Unknown command "${command}"`);
      action(meta.dom);
    },
    render() {
      // Implementation for diff/patch
    },
  };
}

function isObject(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { createEngine };
