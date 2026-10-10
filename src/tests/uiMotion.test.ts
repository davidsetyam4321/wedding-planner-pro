// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.hoisted(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent() { return true; },
    }),
  });
  class Observer {
    private callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe(target: Element) {
      this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    unobserve() {} disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

import CountUp from "../components/CountUp";
import { Stagger, StaggerItem } from "../components/Shared";
import ClickSpark from "../components/reactbits/ClickSpark";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
async function render(node: React.ReactNode) { await act(async () => root.render(node)); }
async function settle() { await act(async () => new Promise((resolve) => setTimeout(resolve, 350))); }

describe("Normal motion", () => {
  it("finishes numeric updates correctly and cancels a stale target", async () => {
    await render(createElement(CountUp, { to: 100, duration: 0.1 }));
    await settle();
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe("100");
    await render(createElement(CountUp, { to: 200, duration: 0.1 }));
    await render(createElement(CountUp, { to: 42, duration: 0.1 }));
    await settle();
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe("42");
    expect(container.querySelector(".sr-only")?.textContent).toBe("42");
  });

  it("makes departing rows inert and removes them after the exit", async () => {
    const list = (ids: string[]) => createElement(Stagger, {
      children: ids.map((id) => createElement(StaggerItem, {
        key: id, children: createElement("button", { "data-id": id }, id),
      })),
    });
    await render(list(["A", "B"]));
    await settle();
    await render(list(["B", "C"]));
    const removed = container.querySelector('[data-id="A"]')!;
    expect(removed.parentElement?.hasAttribute("inert")).toBe(true);
    expect(removed.parentElement?.getAttribute("aria-hidden")).toBe("true");
    await settle();
    expect(container.querySelector('[data-id="A"]')).toBeNull();
    expect(Array.from(container.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["B", "C"]);
  });

  it("does not create spark nodes when interacting with ordinary form controls", async () => {
    await render(createElement("div", null,
      createElement(ClickSpark), createElement("input", { "aria-label": "Nama" }),
    ));
    const nodes = document.body.childElementCount;
    const event = new MouseEvent("pointerdown", { bubbles: true, button: 0 });
    Object.defineProperty(event, "isPrimary", { value: true });
    await act(async () => {
      container.querySelector("input")!.dispatchEvent(event);
    });
    expect(document.body.childElementCount).toBe(nodes);
  });

  it("creates a small burst only for marked actions and cleans it up on unmount", async () => {
    const animate = vi.fn();
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
    try {
      await render(createElement("div", null,
        createElement(ClickSpark, { sparks: 5, duration: 320 }),
        createElement("button", { "data-celebrate": "true" }, "Mulai"),
      ));
      const nodes = document.body.childElementCount;
      const event = new MouseEvent("pointerdown", { bubbles: true, button: 0 });
      Object.defineProperty(event, "isPrimary", { value: true });
      await act(async () => container.querySelector("button")!.dispatchEvent(event));
      expect(animate).toHaveBeenCalledTimes(5);
      expect(document.body.childElementCount).toBe(nodes + 1);
      await render(null);
      expect(document.body.childElementCount).toBe(nodes);
    } finally {
      Reflect.deleteProperty(Element.prototype, "animate");
    }
  });
});
