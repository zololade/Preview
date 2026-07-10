import type { Engine, Registry, VNode } from "./types";

//recursiv dom builder
function buildDOM(
  incomingObject: VNode,
  registry: Registry,
): HTMLElement | DocumentFragment | SVGSVGElement | SVGPathElement | Text {
  let tag: string;
  let children: string | VNode[] | undefined;
  let el: HTMLElement | DocumentFragment | SVGSVGElement | SVGPathElement;
  let attrs: Record<string, string>;
  let props: VNode["props"];
  let actions: VNode["actions"];
  let ref: VNode["ref"];

  if (isObject(incomingObject)) {
    ({ tag, children, attrs = {}, props = {}, actions, ref } = incomingObject);
    el =
      tag === "svg" || tag === "path"
        ? document.createElementNS("http://www.w3.org/2000/svg", tag)
        : document.createElement(tag);

    // register actions
    if (ref !== undefined && actions !== undefined && el instanceof HTMLElement) {
      registry.set(ref, { dom: el, actions: actions });
    }
    if (incomingObject.onMount && el instanceof HTMLElement) {
      incomingObject.onMount(el);
    }

    // Apply props
    Object.entries(props).forEach(([key, value]) => {
      if (key === "xmlns") return;
      if (el instanceof SVGElement) {
        el.setAttribute(key, String(value));
        return;
      }
      (el as any)[key] = value;
    });

    // Apply attrs (always safe via setAttribute)
    Object.entries(attrs).forEach(([key, value]) => {
      (el as HTMLElement).setAttribute(key, String(value));
    });
  } else if (Array.isArray(incomingObject)) {
    children = incomingObject;
    el = document.createDocumentFragment();
  } else {
    return document.createTextNode(String(incomingObject));
  }

  if (typeof children === "string") {
    (el as HTMLElement).textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach((data) => {
      el.appendChild(buildDOM(data, registry));
    });
  }

  return el;
}

function createEngine(): Engine {
  const registry: Registry = new Map();
  // internal maps will go here later
  return {
    mount(container: HTMLElement, rootVNode: VNode) {
      // will build DOM, set up delegation, register refs/actions
      const root = buildDOM(rootVNode, registry);
      container.appendChild(root);
    },
    dispatch(ref: string, command: string) {
      // will look up ref, find action, call it; throw if not found
      const meta = registry.get(ref);
      if (!meta) throw new Error(`Ref "${ref}" not found`);
      const action = meta.actions[command];
      if (!action) throw new Error("unknown command");
      action(meta.dom);
    },
    render() {
      // will call buildTree, diff, patch
    },
  };
}

//HELPER
function isObject(value: unknown): value is VNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { createEngine };
