// oxlint-disable unicorn/consistent-function-scoping
import { describe, expect, it, vi } from "vitest";

import { createEngine } from "../src/createEngine";
import type { VNode } from "../src/lib/types";

function setup(buildTree: () => VNode) {
  const container = document.createElement("div");
  const engine = createEngine(buildTree);
  engine.mount(container);
  return { container, engine };
}

describe("Engine — dispatch", () => {
  it("invokes a registered action by ref", () => {
    const { container, engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "input", ref: "search", actions: { focus: (el) => el.focus() } }],
    }));
    const focusSpy = vi.spyOn(container.querySelector("input")!, "focus");
    engine.dispatch("search", "focus");
    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it("throws when ref is not registered", () => {
    const { engine } = setup(() => ({ tag: "div", children: [{ tag: "input", ref: "search" }] }));
    expect(() => engine.dispatch("search", "focus")).toThrow('Ref "search" not found');
  });

  it("throws when command is not found on ref", () => {
    const { engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "input", ref: "search", actions: { focus: (el) => el.focus() } }],
    }));
    expect(() => engine.dispatch("search", "blur")).toThrow('Unknown command "blur"');
  });
});

describe("Engine — buildDOM", () => {
  it("applies SVG attributes on creation", () => {
    const { container } = setup(() => ({ tag: "svg", attrs: { cx: "50" } }));
    expect(container.querySelector("svg")?.getAttribute("cx")).toBe("50");
  });
});

describe("Engine — patch: tag mismatch", () => {
  it("replaces the element when tag changes", () => {
    let bool = false;
    const { container, engine } = setup(() =>
      bool
        ? { tag: "div", attrs: { className: "element" } }
        : { tag: "section", attrs: { className: "element" } },
    );
    bool = true;
    engine.render();
    expect(container.querySelector(".element")?.tagName).toBe("DIV");
  });
});

describe("Engine — patch: attributes", () => {
  it("updates a changed attribute value", () => {
    let bool = false;
    const a = { className: "james" };
    const b = { className: "ololade" };
    const { container, engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "h2", ref: "msg", attrs: bool ? b : a, children: "x" }],
    }));
    bool = true;
    engine.render();
    expect(container.querySelector("h2")?.className).toBe("ololade");
  });

  it("removes an attribute absent from the new tree", () => {
    let bool = false;
    const a = { className: "james" };
    const b = { id: "james" };
    const { container, engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "h2", ref: "msg", attrs: bool ? b : a, children: "x" }],
    }));
    bool = true;
    engine.render();
    expect(container.querySelector("h2")?.className).toBe("");
  });

  it("warns when the same attrs object is reused across renders", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sharedAttrs = { className: "element" };
    const { engine } = setup(() => ({ tag: "div", ref: "box", attrs: sharedAttrs }));
    sharedAttrs.className = "mutated";
    engine.render();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain("Same attrs object reused for <div>");
    warnSpy.mockRestore();
  });

  it("does not warn when attrs are rebuilt fresh each render", () => {
    const warnSpy = vi.spyOn(console, "warn");
    let bool = false;
    const { engine } = setup(() => ({
      tag: "div",
      ref: "box",
      attrs: { className: bool ? "b" : "a" },
    }));
    bool = true;
    engine.render();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("Engine — patch: children (cases A\u{2013}F)", () => {
  it("case A: string -> same string, DOM node reused", () => {
    let bool = true;
    const { container, engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "h2", ref: "msg", children: bool ? "ololade" : "james" }],
    }));
    bool = false;
    engine.render();
    expect(container.querySelector("h2")?.textContent).toBe("james");
  });

  it("case D: undefined -> array, children are built and appended", () => {
    let bool = true;
    const { container, engine } = setup(() =>
      bool
        ? { tag: "div" }
        : {
            tag: "div",
            attrs: { className: "newNode" },
            children: [
              { tag: "p", children: "hello" },
              { tag: "p", children: "hello" },
            ],
          },
    );
    bool = false;
    engine.render();
    expect(container.querySelector(".newNode")?.childNodes.length).toBe(2);
  });

  it("case C: array -> undefined, all children removed", () => {
    let bool = true;
    const { container, engine } = setup(() =>
      bool
        ? {
            tag: "div",
            children: [
              { tag: "p", children: "hello" },
              { tag: "p", children: "hello" },
            ],
          }
        : { tag: "div", attrs: { className: "newNode" } },
    );
    bool = false;
    engine.render();
    expect(container.querySelector(".newNode")?.childNodes.length).toBe(0);
  });

  it("case E: string -> array, string content replaced by built children", () => {
    let bool = true;
    const { container, engine } = setup(() =>
      bool
        ? { tag: "div", children: "hello" }
        : {
            tag: "div",
            children: [{ tag: "p", attrs: { className: "newNode" }, children: "hello" }],
          },
    );
    bool = false;
    engine.render();
    expect(container.querySelector(".newNode")?.tagName).toBe("P");
  });

  it("case F: array -> string, all children replaced by a single text node", () => {
    let bool = true;
    const { container, engine } = setup(() =>
      bool
        ? {
            tag: "div",
            children: [
              { tag: "p", children: "hello" },
              { tag: "p", children: "hello" },
            ],
          }
        : { tag: "div", attrs: { className: "newNode" }, children: "hello" },
    );
    bool = false;
    engine.render();
    const el = container.querySelector(".newNode");
    expect(el?.textContent).toBe("hello");
    expect(el?.childNodes.length).toBe(1);
    expect(el?.querySelector("p")).toBeNull();
  });
});
