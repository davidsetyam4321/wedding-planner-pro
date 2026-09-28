import type { Id } from "@/convex/_generated/dataModel";

/**
 * The anonymous (silent) user id of this device, remembered in localStorage
 * while the session is anonymous. After signing in with an email, AppShell
 * hands this id to `ensureSetup`, which adopts the anonymous workspace
 * atomically on the server (one-time, guarded).
 */
export const ANON_ID_KEY = "planner-wedding:anonymous-user-id";

/** Tracks this device's CURRENT anonymous user id (overwrites stale ones). */
export function trackAnonymousUser(userId: string | undefined): void {
  if (!userId) return;
  localStorage.setItem(ANON_ID_KEY, userId);
}

/** The stored anonymous user id of this device, if any. */
export function readStoredAnonymousUser(): Id<"users"> | undefined {
  return (
    (localStorage.getItem(ANON_ID_KEY) as Id<"users"> | null) ?? undefined
  );
}
