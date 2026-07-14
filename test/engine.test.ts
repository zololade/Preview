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
    let bool = true;
    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "div",
        children: [
          {
            tag: "h2",
            ref: "msg",
            children: bool ? "ololade" : "james",
            actions: { focus: (el) => el.focus() },
          },
        ],
      };
    };

    const engine = createEngine(root);
    engine.mount(container);
    bool = false;

    engine.render();
    const cont = container.querySelector("h2");
    expect(cont?.textContent).toBe("james");
  });

  it("verifies patch function updates attributes", () => {
    let bool = false;
    const attributes = { className: "james" };
    const replacement = { className: "ololade" };

    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "div",
        children: [
          {
            tag: "h2",
            ref: "msg",
            attrs: !bool ? attributes : replacement,
            children: "ololade",
            actions: { focus: (el) => el.focus() },
          },
        ],
      };
    };

    const engine = createEngine(root);
    engine.mount(container);
    const h2 = container.querySelector("h2");
    bool = true;
    engine.render();

    const cls = h2?.className;
    expect(cls).toBe("ololade");
  });

  it("ensures stale attributes is removed and new one added", () => {
    let bool = false;
    const attributes = { className: "james" };
    const replacement = { id: "james" };

    const container = document.createElement("div");
    const root = (): VNode => {
      return {
        tag: "div",
        children: [
          {
            tag: "h2",
            ref: "msg",
            attrs: !bool ? attributes : replacement,
            children: "ololade",
            actions: { focus: (el) => el.focus() },
          },
        ],
      };
    };

    const engine = createEngine(root);
    engine.mount(container);
    const h2 = container.querySelector("h2");
    bool = true;
    engine.render();

    const cls = h2?.className;
    expect(cls).toBe("");
  });
});
