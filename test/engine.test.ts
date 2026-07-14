// oxlint-disable unicorn/consistent-function-scoping
import { describe, expect, it, vi } from "vitest";

import { createEngine } from "../src/createEngine";
import type { VNode } from "../src/lib/types";

describe("Engine", () => {
  it("mounts a tree and dispatches a command to an action", () => {
    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "svg",
        children: [
          {
            tag: "input",
            ref: "search",
            actions: {
              focus: (el) => el.focus(),
            },
          },
          {
            tag: "input",
            attrs: {
              className: "hello",
            },
          },
        ],
      };
    };

    const engine = createEngine(root);

    engine.mount(container);

    const input = container.querySelector("input")!;
    const focusSpy = vi.spyOn(input, "focus");

    engine.dispatch("search", "focus");

    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it("test svg element", () => {
    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "svg",
        attrs: {
          cx: "50",
        },
      };
    };

    const engine = createEngine(root);
    engine.mount(container);

    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("cx")).toBe("50");
  });

  it("throws when dispatching an unknown command", () => {
    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "div",
        children: [{ tag: "input", ref: "search" }],
      };
    };
    const engine = createEngine(root);

    engine.mount(container);

    expect(() => engine.dispatch("search", "focus")).toThrow('Ref "search" not found');
  });

  it("throws when dispatching an unknown command on an existing ref", () => {
    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "div",
        children: [
          {
            tag: "input",
            ref: "search",
            actions: { focus: (el) => el.focus() },
          },
        ],
      };
    };

    const engine = createEngine(root);

    engine.mount(container);
    expect(() => engine.dispatch("search", "blur")).toThrow('Unknown command "blur"');
  });

  it("verifies patch function reuse existing DOM", () => {
    const state = {
      name: "ololade",
    };
    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "div",
        children: [
          { tag: "h2", ref: "msg", children: state.name, actions: { focus: (el) => el.focus() } },
        ],
      };
    };

    const engine = createEngine(root);
    engine.mount(container);

    const cont = container.querySelector("h2");
    const focusSpy = vi.spyOn(cont!, "focus");
    engine.dispatch("msg", "focus");

    expect(focusSpy).toHaveBeenCalledOnce();
    expect(cont?.textContent).toBe("ololade");
    state.name = "World";
    engine.render();
    expect(cont?.textContent).toBe("World");
  });
});
