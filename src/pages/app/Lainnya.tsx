import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
import {
  ChevronRight,
  FolderHeart,
  Receipt,
  Settings,
  Users,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

type ToolItem = {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  count: string;
};

/** Lainnya: pintu masuk ke semua alat tambahan + pengaturan. */
export function LainnyaPage() {
  const guests = useQuery(api.guests.list);
  const vendors = useQuery(api.vendors.list);
  const rundown = useQuery(api.rundown.list);
  const photos = useQuery(api.moodboard.listPhotos);

  const totalPax = (guests ?? []).reduce((sum, g) => sum + g.pax, 0);
  const vendorPaid = (vendors ?? []).filter((v) => v.status === "lunas").length;

  const TOOLS: ToolItem[] = [
    {
      to: "/app/moodboard",
      label: "Mood Board",
      desc: "Referensi dekorasi, baju & makeup",
      icon: FolderHeart,
      count: `${(photos ?? []).length} foto`,
    },
    {
      to: "/app/tamu",
      label: "Daftar Tamu",
      desc: "Undangan, jumlah orang, dan RSVP",
      icon: Users,
      count: `${(guests ?? []).length} tamu · ${totalPax} orang`,
    },
    {
      to: "/app/vendor",
      label: "Vendor",
      desc: "Kontak, biaya, dan status pembayaran",
      icon: Receipt,
      count: `${(vendors ?? []).length} vendor · ${vendorPaid} lunas`,
    },
    {
      to: "/app/rundown",
      label: "Rundown Acara",
      desc: "Susunan acara hari-H",
      icon: CalendarClock,
      count: `${(rundown ?? []).length} agenda`,
    },
  ];

  return (
    <div className="space-y-4">
      <section className="clay p-5">
        <h1 className="text-lg font-extrabold">Lainnya</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Semua alat tambahan ada di sini — dari papan referensi sampai daftar
          tamu dan susunan acara.
        </p>
      </section>

      <section className="space-y-3">
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="clay clay-press block p-4">
            <div className="flex items-center gap-3">
              <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
                <tool.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{tool.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{tool.desc}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-primary">{tool.count}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold">Jalan pintas</h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.filter(
            (feature) => feature.to !== "/app" && !TOOLS.some((t) => t.to === feature.to),
          ).map((feature) => (
            <Link key={feature.to} to={feature.to} className="clay clay-press p-4">
              <feature.icon className="size-4 text-primary" />
              <p className="mt-2 text-sm font-bold">{feature.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {feature.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Link to="/app/pengaturan" className="clay clay-press block p-4">
        <div className="flex items-center gap-3">
          <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
            <Settings className="size-5 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Pengaturan</p>
            <p className="text-[11px] text-muted-foreground">
              Nama, tanggal pernikahan, venue & target dana
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </Link>
    </div>
  );
}
