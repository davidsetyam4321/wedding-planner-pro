import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
// Lapis palet (maroon · sage · emas · peach · blush) — harus setelah index.css
// supaya token & gradien yang di-override di sini menang.
import "./palette.css";

// Lazy load route components for better code splitting
const AppShell = lazy(() =>
  import("./components/AppShell.tsx").then((m) => ({ default: m.AppShell })),
);
const HomePage = lazy(() =>
  import("./pages/app/Home.tsx").then((m) => ({ default: m.HomePage })),
);
const BudgetPage = lazy(() =>
  import("./pages/app/Budget.tsx").then((m) => ({ default: m.BudgetPage })),
);
const TabunganPage = lazy(() =>
  import("./pages/app/Tabungan.tsx").then((m) => ({ default: m.TabunganPage })),
);
const ChecklistPage = lazy(() =>
  import("./pages/app/Checklist.tsx").then((m) => ({ default: m.ChecklistPage })),
);
const MoodboardPage = lazy(() =>
  import("./pages/app/Moodboard.tsx").then((m) => ({ default: m.MoodboardPage })),
);
const TamuPage = lazy(() =>
  import("./pages/app/Tamu.tsx").then((m) => ({ default: m.TamuPage })),
);
const VendorPage = lazy(() =>
  import("./pages/app/Vendor.tsx").then((m) => ({ default: m.VendorPage })),
);
const RundownPage = lazy(() =>
  import("./pages/app/Rundown.tsx").then((m) => ({ default: m.RundownPage })),
);
const PengaturanPage = lazy(() =>
  import("./pages/app/Pengaturan.tsx").then((m) => ({ default: m.PengaturanPage })),
);
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const LandingPage = lazy(() =>
  import("./pages/Landing.tsx").then((m) => ({ default: m.LandingPage })),
);

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="clay px-5 py-3 text-sm text-muted-foreground">Memuat…</div>
    </div>
  );
}

/**
 * There is no sign-in screen: the workspace belongs to whoever opens the app,
 * so we create (or reuse) a silent session automatically. The session token
 * lives in this browser, so the couple's data stays attached to this device.
 */
function AutoSession({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const triedRef = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || error || triedRef.current) return;
    triedRef.current = true;
    signIn("anonymous").catch(() => {
      triedRef.current = false;
      setError(true);
    });
  }, [isLoading, isAuthenticated, error, signIn]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="clay max-w-sm p-6 text-center">
          <p className="text-sm font-semibold">Gagal menyiapkan ruang kerja</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Periksa koneksi internet Anda, lalu coba lagi.
          </p>
          <Button className="mt-4" onClick={() => setError(false)}>
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="clay px-5 py-3 text-sm text-muted-foreground">
          Menyiapkan Planner Wedding…
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 break-words text-xs text-muted-foreground">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 max-h-40 overflow-auto rounded border border-border/60 p-2 text-left text-[10px] leading-4 text-muted-foreground/80">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);


function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


/**
 * Service worker (mode offline) hanya didaftarkan pada build produksi. Di
 * lingkungan dev/preview service worker sengaja tidak aktif supaya aset yang
 * di-cache tidak menutupi perubahan kode terbaru.
 */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("[PWA] Service worker gagal didaftarkan:", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <AutoSession>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="budget" element={<BudgetPage />} />
                  <Route path="tabungan" element={<TabunganPage />} />
                  <Route path="checklist" element={<ChecklistPage />} />
                  <Route path="moodboard" element={<MoodboardPage />} />
                  <Route path="tamu" element={<TamuPage />} />
                  <Route path="vendor" element={<VendorPage />} />
                  <Route path="rundown" element={<RundownPage />} />
                  <Route path="pengaturan" element={<PengaturanPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AutoSession>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
