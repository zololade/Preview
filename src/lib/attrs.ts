import { SVG_PROP_KEYS } from "./svg";
import type { DOMBuilderEl } from "./types";

const SVG_NS = "http://www.w3.org/2000/svg";

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

function removeAttrs(el: DOMBuilderEl, attrs: Record<string, unknown>) {
  const isSvg = el.namespaceURI === SVG_NS;

  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === "class" || key === "className") {
      el.removeAttribute("class");
      continue;
    }

    if (isSvg) {
      if (SVG_PROP_KEYS.has(key)) {
        Reflect.set(el, key, "");
      } else {
        el.removeAttribute(key);
      }
      continue;
    }

    if (key in el) {
      Reflect.set(el, key, "");
    } else {
      el.removeAttribute(key);
    }
  }
}

export { applyAttrs, removeAttrs };
