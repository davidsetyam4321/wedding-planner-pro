import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

type VisualStyle = "unlumen" | "classic";
type VisualStyleContextValue = {
  style: VisualStyle;
  setStyle: (style: VisualStyle) => void;
};

const STORAGE_KEY = "satujanji.visual-style";
const VisualStyleContext = createContext<VisualStyleContextValue | null>(null);

function getInitialStyle(): VisualStyle {
  if (typeof window === "undefined") return "unlumen";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "classic" ? "classic" : "unlumen";
  } catch {
    return "unlumen";
  }
}

export function VisualStyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<VisualStyle>(getInitialStyle);

  useLayoutEffect(() => {
    document.documentElement.dataset.visualStyle = style;
    document.documentElement.dataset.effects = style === "classic" ? "off" : "on";
    try {
      window.localStorage.setItem(STORAGE_KEY, style);
    } catch {
      // The visual setting still applies for this session when storage is unavailable.
    }
  }, [style]);

  return (
    <VisualStyleContext.Provider value={{ style, setStyle }}>
      {children}
    </VisualStyleContext.Provider>
  );
}

export function useVisualStyle() {
  const context = useContext(VisualStyleContext);
  if (!context) throw new Error("useVisualStyle must be used inside VisualStyleProvider");
  return context;
}
