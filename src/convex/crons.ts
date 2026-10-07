import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 01:00 UTC = 08:00 WIB — kumpulkan tugas & vendor yang jatuh tempo H-3, H-1,
// atau sudah lewat ke antrean `reminderOutbox` (sekali per item per hari).
crons.daily(
  "pengingat-harian-scan",
  { hourUTC: 1, minuteUTC: 0 },
  internal.reminders.scanDue,
  {},
);

// 01:10 UTC — kirim isi antrean lewat email. Tanpa env var gateway, antrean
// tetap tersimpan untuk dikirim menyusul (lihat `deliverPending`).
crons.daily(
  "pengingat-harian-kirim",
  { hourUTC: 1, minuteUTC: 10 },
  internal.reminders.deliverPending,
  {},
);

export default crons;
