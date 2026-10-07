import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { workspaceUserId } from "./workspace";

export type Reminder = {
  kind: "task" | "vendor";
  id: string;
  label: string;
  dueDate: number;
  /** True bila tenggat sudah lewat. */
  overdue: boolean;
  /** Hari menuju tenggat (negatif = sudah lewat). */
  daysLeft: number;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Pengingat lintas fitur: tugas yang belum selesai dan vendor yang belum
 * lunas, keduanya harus punya tenggat. Diurutkan dari yang paling mendesak.
 * `now` dikirim dari klien supaya query tetap deterministik.
 */
export const list = query({
  args: { now: v.number() },
  handler: async (ctx, { now }): Promise<Reminder[]> => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);

    const items = await ctx.db
      .query("checklistItem")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const reminders: Reminder[] = [];
    for (const item of items) {
      if (item.done || !item.dueDate) continue;
      reminders.push({
        kind: "task",
        id: item._id,
        label: item.label,
        dueDate: item.dueDate,
        overdue: item.dueDate < todayStart,
        daysLeft: Math.round((item.dueDate - todayStart) / DAY),
      });
    }
    for (const vendor of vendors) {
      if (vendor.status === "lunas" || !vendor.dueDate) continue;
      reminders.push({
        kind: "vendor",
        id: vendor._id,
        label:
          vendor.status === "dp"
            ? `Pelunasan ${vendor.name}`
            : `DP ${vendor.name}`,
        dueDate: vendor.dueDate,
        overdue: vendor.dueDate < todayStart,
        daysLeft: Math.round((vendor.dueDate - todayStart) / DAY),
      });
    }

    reminders.sort((a, b) => a.dueDate - b.dueDate);
    return reminders;
  },
});

// ── Pengingat harian (dijalankan crons.ts) ────────────────────────────────
//
// Tiga tahap, masing-masing pendek agar bisa diulang dengan aman:
//   1. `scanDue`       — cari tugas/vendor H-3, H-1, atau sudah lewat, lalu
//                        tulis ke antrean `reminderOutbox` dan tandai
//                        `lastRemindedAt` supaya tidak dobel di hari yang sama.
//   2. `deliverPending` — kirim isi antrean lewat email.
//   3. `markSent` / `markFailed` — tandai hasil kirim.
//
// Pengiriman email butuh dua env var Convex (diisi lewat `npx convex env set`):
//   VLY_INTEGRATION_KEY          — kunci gateway yang sama dengan OTP
//   VLY_REMINDER_EMAIL_ENDPOINT  — endpoint kirim email gateway
// Selama keduanya belum ada, antrean hanya menumpuk dan tidak ada email yang
// dikirim; begitu diisi, cron berikutnya langsung mengirim antrean tersebut.

/** Tenggat yang layak diingatkan: H-3, H-1, dan semua yang sudah lewat. */
function isReminderDay(daysLeft: number): boolean {
  return daysLeft === 3 || daysLeft === 1 || daysLeft < 0;
}

/** Awal hari (waktu lokal server) — dipakai untuk membandingkan “hari ini”. */
function startOfDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Sudah pernah diingatkan hari ini? Mencegah kiriman dobel saat cron diulang. */
function remindedToday(lastRemindedAt: number | undefined, todayStart: number) {
  return lastRemindedAt !== undefined && startOfDay(lastRemindedAt) === todayStart;
}

export const scanDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = startOfDay(now);
    let queued = 0;

    const items = await ctx.db.query("checklistItem").collect();
    for (const item of items) {
      if (item.done || !item.dueDate) continue;
      const daysLeft = Math.round((item.dueDate - todayStart) / DAY);
      if (!isReminderDay(daysLeft)) continue;
      if (remindedToday(item.lastRemindedAt, todayStart)) continue;

      await ctx.db.patch(item._id, { lastRemindedAt: now });
      await ctx.db.insert("reminderOutbox", {
        userId: item.userId,
        kind: "task",
        label: item.label,
        dueDate: item.dueDate,
        daysLeft,
        createdAt: now,
      });
      queued++;
    }

    const vendors = await ctx.db.query("vendor").collect();
    for (const vendor of vendors) {
      if (vendor.status === "lunas" || !vendor.dueDate) continue;
      const daysLeft = Math.round((vendor.dueDate - todayStart) / DAY);
      if (!isReminderDay(daysLeft)) continue;
      if (remindedToday(vendor.lastRemindedAt, todayStart)) continue;

      await ctx.db.patch(vendor._id, { lastRemindedAt: now });
      await ctx.db.insert("reminderOutbox", {
        userId: vendor.userId,
        kind: "vendor",
        label:
          vendor.status === "dp"
            ? `Pelunasan ${vendor.name}`
            : `DP ${vendor.name}`,
        dueDate: vendor.dueDate,
        daysLeft,
        createdAt: now,
      });
      queued++;
    }

    return { queued };
  },
});

/** Maksimal percobaan kirim sebelum baris dianggap gagal permanen. */
const MAX_ATTEMPTS = 5;

/**
 * Antrean yang belum terkirim, dikelompokkan per pemilik workspace beserta
 * alamat emailnya. Pemilik anonim (belum punya email) dilewati — pengingatnya
 * tetap terlihat di lonceng dalam aplikasi.
 */
export const pendingOutbox = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("reminderOutbox")
      .withIndex("by_sent", (q) => q.eq("sentAt", undefined))
      .collect();

    type PendingItem = {
      id: string;
      kind: "task" | "vendor";
      label: string;
      dueDate: number;
      daysLeft: number;
    };
    const groups = new Map<
      string,
      { userId: string; email: string; items: PendingItem[] }
    >();

    for (const row of rows) {
      if ((row.attempts ?? 0) >= MAX_ATTEMPTS) continue;
      const user = await ctx.db.get(row.userId);
      const email = user?.email;
      if (!email) continue;
      const key = row.userId as string;
      const group = groups.get(key) ?? { userId: key, email, items: [] };
      group.items.push({
        id: row._id as string,
        kind: row.kind,
        label: row.label,
        dueDate: row.dueDate,
        daysLeft: row.daysLeft,
      });
      groups.set(key, group);
    }

    return [...groups.values()];
  },
});

export const markSent = internalMutation({
  args: { ids: v.array(v.id("reminderOutbox")) },
  handler: async (ctx, { ids }) => {
    const now = Date.now();
    for (const id of ids) await ctx.db.patch(id, { sentAt: now });
    return ids.length;
  },
});

export const markFailed = internalMutation({
  args: { ids: v.array(v.id("reminderOutbox")), error: v.string() },
  handler: async (ctx, { ids, error }) => {
    for (const id of ids) {
      const row = await ctx.db.get(id);
      if (!row) continue;
      await ctx.db.patch(id, {
        attempts: (row.attempts ?? 0) + 1,
        lastError: error.slice(0, 300),
      });
    }
    return ids.length;
  },
});

/** Susunan email pengingat dalam bentuk teks biasa. */
function reminderEmail(
  items: { label: string; dueDate: number; daysLeft: number }[],
): string {
  const lines = items.map((item) => {
    const when =
      item.daysLeft < 0
        ? `terlambat ${Math.abs(item.daysLeft)} hari`
        : item.daysLeft === 0
          ? "hari ini"
          : `H-${item.daysLeft}`;
    return `• ${item.label} — ${when}`;
  });
  return [
    "Halo,",
    "",
    "Ini pengingat dari SatuJanji. Yang perlu segera ditangani:",
    "",
    ...lines,
    "",
    "Buka SatuJanji untuk menandai tugas selesai atau mengubah tenggatnya.",
  ].join("\n");
}

/** Baris antrean per pemilik workspace, hasil `pendingOutbox`. */
type PendingGroup = {
  userId: string;
  email: string;
  items: {
    id: string;
    kind: "task" | "vendor";
    label: string;
    dueDate: number;
    daysLeft: number;
  }[];
};

/** Hasil `deliverPending` — ditulis eksplisit supaya tidak ada siklus tipe. */
type DeliveryResult = { sent: number; groups: number; reason?: string };

/**
 * Mengirim antrean lewat gateway email. Tanpa konfigurasi gateway, antrean
 * dibiarkan utuh (tidak ada yang ditandai terkirim) sehingga bisa dikirim
 * menyusul setelah env var diisi.
 */
export const deliverPending = internalAction({
  args: {},
  handler: async (ctx): Promise<DeliveryResult> => {
    const endpoint = process.env.VLY_REMINDER_EMAIL_ENDPOINT;
    const key = process.env.VLY_INTEGRATION_KEY;
    const groups: PendingGroup[] = await ctx.runQuery(
      internal.reminders.pendingOutbox,
      {},
    );

    if (!endpoint || !key) {
      return {
        sent: 0,
        groups: groups.length,
        reason:
          "Gateway email belum dikonfigurasi (VLY_REMINDER_EMAIL_ENDPOINT / VLY_INTEGRATION_KEY).",
      };
    }

    let sent = 0;
    for (const group of groups) {
      const ids = group.items.map((item) => item.id) as never[];
      const subject = `Pengingat SatuJanji: ${group.items.length} hal mendekati tenggat`;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            to: group.email,
            subject,
            text: reminderEmail(group.items),
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await ctx.runMutation(internal.reminders.markSent, { ids });
        sent += ids.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await ctx.runMutation(internal.reminders.markFailed, { ids, error: message });
      }
    }

    return { sent, groups: groups.length };
  },
});
