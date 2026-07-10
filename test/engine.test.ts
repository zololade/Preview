import { describe, expect, it, vi } from "vitest";

import { createEngine } from "../src/engine/createEngine";

describe("Engine", () => {
  it("mounts a tree and dispatches a command to an action", () => {
    const container = document.createElement("div");
    const engine = createEngine();

    engine.mount(container, {
      tag: "div",
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
          props: {
            className: "hello",
          },
        },
      ],
    });

    const input = container.querySelector("input")!;
    const focusSpy = vi.spyOn(input, "focus");

    engine.dispatch("search", "focus");

    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it("throws when dispatching an unknown command", () => {
    const container = document.createElement("div");
    const engine = createEngine();

    engine.mount(container, {
      tag: "div",
      children: [{ tag: "input", ref: "search" }],
    });

    expect(() => engine.dispatch("search", "focus")).toThrow('Ref "search" not found');
  });

  it("throws when dispatching an unknown command on an existing ref", () => {
    const container = document.createElement("div");
    const engine = createEngine();
    engine.mount(container, {
      tag: "div",
      children: [
        {
          tag: "input",
          ref: "search",
          actions: { focus: (el) => el.focus() },
        },
      ],
    });
    expect(() => engine.dispatch("search", "blur")).toThrow('Unknown command "blur"');
  });
});
