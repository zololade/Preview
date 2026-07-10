import { describe, expect, it } from "vitest";

import { createEngine } from "../src/engine/createEngine"; // this doesn't exist yet

describe("Engine", () => {
  it("mounts and updates text content", () => {
    // 1. Create a container (like <div id="app"></div>)
    const container = document.createElement("div");
    document.body.appendChild(container); // optional, but good practice

    // 2. Create engine and mount
    const engine = createEngine();
    engine.mount(container);

    // 3. First update: create a new element with a ref
    engine.update("title", { tag: "h2", content: "Hello" });

    // 4. Assert that the container now has an <h2>Hello</h2>
    const h2 = container.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2!.textContent).toBe("Hello");

    // 5. Store the element reference for later comparison
    const originalElement = h2!;

    // 6. Second update: change only the content
    engine.update("title", { content: "World" });

    // 7. Assert that the same DOM element is still there (no re-creation)
    const updatedH2 = container.querySelector("h2");
    expect(updatedH2).toBe(originalElement); // Same object reference
    expect(updatedH2!.textContent).toBe("World");

    // 8. Clean up
    document.body.removeChild(container);
  });
});
