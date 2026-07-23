// oxlint-disable unicorn/consistent-function-scoping
import { describe, expect, it, vi } from "vitest";

import { createEngine } from "../src/createEngine";
import type { VNode } from "../src/lib/types";

function setup(buildTree: () => VNode | VNode[]) {
  const container = document.createElement("div");
  const engine = createEngine(buildTree);
  engine.mount(container);
  return { container, engine };
}

describe("Engine", () => {
  it("dispatches a command via ref", () => {
    const { container, engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "input", ref: "search", actions: { focus: (el) => el.focus() } }],
    }));
    const focusSpy = vi.spyOn(container.querySelector("input")!, "focus");
    engine.dispatch("search", "focus");
    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it("applies SVG attributes", () => {
    const { container } = setup(() => ({ tag: "svg", attrs: { cx: "50" } }));
    expect(container.querySelector("svg")?.getAttribute("cx")).toBe("50");
  });

  it("throws on unknown ref", () => {
    const { engine } = setup(() => ({ tag: "div", children: [{ tag: "input", ref: "search" }] }));
    expect(() => engine.dispatch("search", "focus")).toThrow('Ref "search" not found');
  });

  it("throws on unknown command", () => {
    const { engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "input", ref: "search", actions: { focus: (el) => el.focus() } }],
    }));
    expect(() => engine.dispatch("search", "blur")).toThrow('Unknown command "blur"');
  });

  it("reuses the DOM node when only text changes", () => {
    let bool = true;
    const { container, engine } = setup(() => ({
      tag: "div",
      children: [{ tag: "h2", ref: "msg", children: bool ? "ololade" : "james" }],
    }));
    bool = false;
    engine.render();
    expect(container.querySelector("h2")?.textContent).toBe("james");
  });

  it("updates a changed attribute", () => {
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

  it("removes a stale attribute not present in the new tree", () => {
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

  it("rebuilds the element on a tag mismatch", () => {
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

  it("update string child to a new node", () => {
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

  it("update node child to a string child", () => {
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
        : {
            tag: "div",
            attrs: { className: "newNode" },
            children: "hello",
          },
    );
    bool = false;
    engine.render();
    console.log(container.querySelector(".newNode")?.childNodes);
    expect(container.querySelector(".newNode")?.textContent).toBe("hello");
  });

  it("confirm if array VNode are handled properly", () => {
    const { container } = setup(() => [
      { tag: "div", children: "hello" },
      { tag: "section", attrs: { className: "node2" }, children: "hello" },
    ]);
    expect(container.querySelector(".node2")?.tagName).toBe("SECTION");
  });

  it("warns when the same attrs object is reused across renders", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sharedAttrs = { className: "element" };

    const { engine } = setup(() => ({
      tag: "div",
      ref: "box",
      attrs: sharedAttrs, // same reference every call
    }));

    sharedAttrs.className = "mutated"; // mutate in place, don't reassign
    engine.render();

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('ref: "box"');

    warnSpy.mockRestore();
  });

  it("does not warn when attrs are rebuilt fresh each render", () => {
    const warnSpy = vi.spyOn(console, "warn");
    let bool = false;

    const { engine } = setup(() => ({
      tag: "div",
      ref: "box",
      attrs: { className: bool ? "b" : "a" }, // fresh object every call
    }));

    bool = true;
    engine.render();

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
