// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.hoisted(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" || query === "(prefers-reduced-motion)",
      media: query, onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent() { return true; },
    }),
  });
  class Observer {
    observe() {} unobserve() {} disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

import { EmptyState, PageSkeleton, Stagger, StaggerItem } from "../components/Shared";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import CountUp from "../components/CountUp";
import FadeContent from "../components/FadeContent";
import AnimatedContent from "../components/AnimatedContent";
import BlurText from "../components/BlurText";

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
async function render(node: React.ReactNode) {
  await act(async () => root.render(node));
}

describe("UI polish through rendered controls", () => {
  it("renders SVG empty states and an operable action", async () => {
    const onAction = vi.fn();
    await render(createElement(EmptyState, {
      emoji: "💸", title: "Belum ada pengeluaran", description: "Catat biaya pertama.",
      actionLabel: "Catat pengeluaran", onAction,
    }));
    expect(container.querySelector("svg[aria-hidden=true]")).not.toBeNull();
    expect(container.textContent).not.toContain("💸");
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("Catat pengeluaran");
    await act(async () => button.click());
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("keeps count values accurate on updates and skips motion when requested", async () => {
    await render(createElement(CountUp, { to: 12500, separator: "." }));
    expect(container.querySelector(".sr-only")?.textContent).toBe("12.500");
    expect(container.querySelector("[aria-hidden=true]")?.textContent).toBe("12.500");
    await render(createElement(CountUp, { to: 19000, separator: "." }));
    expect(container.querySelector("[aria-hidden=true]")?.textContent).toBe("19.000");
    await render(createElement(CountUp, { to: 12.5, separator: "." }));
    expect(container.querySelector(".sr-only")?.textContent).toBe("12.5");
  });

  it("reveals GSAP and blurred content immediately for reduced motion", async () => {
    await render(createElement("div", null,
      createElement(FadeContent, { blur: true, children: "Judul undangan" }),
      createElement(AnimatedContent, null, "Nama pasangan"),
      createElement(BlurText, { text: "Rencanakan bersama" }),
    ));
    expect(container.textContent).toContain("Judul undangan");
    expect(container.textContent).toContain("Nama pasangan");
    expect(container.textContent).toContain("Rencanakan bersama");
    expect(container.querySelector(".invisible")).toBeNull();
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
    expect(container.querySelector('[style*="blur(10px)"]')).toBeNull();
  });

  it("preserves a focused keyed row during reordering and removes deleted rows", async () => {
    const list = (ids: string[]) => createElement(Stagger, {
      className: "rows",
      children: ids.map((id) => createElement(StaggerItem, {
        key: id, children: createElement("button", { "data-id": id }, id),
      })),
    });
    await render(list(["A", "B"]));
    const button = container.querySelector<HTMLButtonElement>('[data-id="A"]')!;
    button.focus();
    await render(list(["B", "A", "C"]));
    expect(document.activeElement).toBe(button);
    expect(Array.from(container.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["B", "A", "C"]);
    await render(list(["B", "C"]));
    expect(container.querySelector('[data-id="A"]')).toBeNull();
  });

  it("provides a named loading status without empty state content", async () => {
    await render(createElement(PageSkeleton));
    const status = container.querySelector('[role="status"]')!;
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-label")).toBe("Memuat data perencanaan");
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(5);
  });

  it("keeps disabled buttons non-operable and sets numeric keyboard hints", async () => {
    const onClick = vi.fn();
    await render(createElement("div", null,
      createElement(Button, { disabled: true, onClick }, "Simpan"),
      createElement(Input, { type: "number", "aria-label": "Nominal" }),
    ));
    container.querySelector("button")!.click();
    expect(onClick).not.toHaveBeenCalled();
    expect(container.querySelector("input")!.inputMode).toBe("decimal");
    await render(createElement(Input, { type: "number", inputMode: "numeric" }));
    expect(container.querySelector("input")!.inputMode).toBe("numeric");
  });

  it("opens and closes a dialog with the Indonesian close label", async () => {
    await render(createElement(Dialog, null,
      createElement(DialogTrigger, null, "Tambah biaya"),
      createElement(DialogContent, { "aria-describedby": undefined },
        createElement(DialogTitle, null, "Biaya baru"),
      ),
    ));
    await act(async () => container.querySelector("button")!.click());
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Biaya baru");
    const close = document.querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')!;
    expect(close.textContent).toBe("Tutup dialog");
    await act(async () => close.click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
