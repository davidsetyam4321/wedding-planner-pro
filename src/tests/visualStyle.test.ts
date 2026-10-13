// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});
import { act, createElement, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VisualStyleProvider, useVisualStyle } from "../components/VisualStyleProvider";

function StyleControls() {
  const { style, setStyle } = useVisualStyle();
  useLayoutEffect(() => {
    document.documentElement.dataset.visualStyle = style;
  }, [style]);
  return createElement("div", null,
    createElement("span", { "data-testid": "style" }, style),
    createElement("button", { onClick: () => setStyle("classic") }, "Kembali ke tampilan lama"),
    createElement("button", { onClick: () => setStyle("unlumen") }, "Aktifkan Unlumen"),
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("global visual style", () => {
  it("starts with Unlumen and persists the classic rollback selection", async () => {
    await act(async () => root.render(createElement(VisualStyleProvider, null, createElement(StyleControls))));
    expect(container.querySelector("[data-testid=style]")?.textContent).toBe("unlumen");
    expect(document.documentElement.dataset.visualStyle).toBe("unlumen");

    await act(async () => container.querySelectorAll("button")[0].click());
    expect(container.querySelector("[data-testid=style]")?.textContent).toBe("classic");
    expect(document.documentElement.dataset.visualStyle).toBe("classic");
    expect(window.localStorage.getItem("satujanji.visual-style")).toBe("classic");

    await act(async () => container.querySelectorAll("button")[1].click());
    expect(document.documentElement.dataset.visualStyle).toBe("unlumen");
  });
});
