import { FlowerMark } from "@/components/Decor";
import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
import {
  CalendarClock,
  ChevronRight,
  FolderHeart,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

/** Lainnya: pintu masuk ke semua alat tambahan + pengaturan. */
export function LainnyaPage() {
  const guests = useQuery(api.guests.list);
  const vendors = useQuery(api.vendors.list);
  const rundown = useQuery(api.rundown.list);
  const categories = useQuery(api.moodboard.listCategories);

  const totalPax = (guests ?? []).reduce((sum, g) => sum + g.pax, 0);
  const vendorPaid = (vendors ?? []).filter((v) => v.status === "lunas").length;

  const TOOLS = [
    {
      to: "/app/moodboard",
      label: "Mood Board",
      desc: "Referensi dekorasi, baju & makeup",
      icon: FolderHeart,
      count: `${(categories ?? []).length} kategori`,
      surface: "bg-tint-rose text-tint-rose-foreground",
      grad: "grad-rose",
      emoji: "🎨",
    },
    {
      to: "/app/tamu",
      label: "Daftar Tamu",
      desc: "Undangan, jumlah orang, dan RSVP",
      icon: Users,
      count: `${(guests ?? []).length} tamu · ${totalPax} orang`,
      surface: "bg-tint-sky text-tint-sky-foreground",
      grad: "grad-sky",
      emoji: "💌",
    },
    {
      to: "/app/vendor",
      label: "Vendor",
      desc: "Kontak, biaya, dan status pembayaran",
      icon: Receipt,
      count: `${(vendors ?? []).length} vendor · ${vendorPaid} lunas`,
      surface: "bg-tint-butter text-tint-butter-foreground",
      grad: "grad-butter",
      emoji: "📋",
    },
    {
      to: "/app/rundown",
      label: "Rundown Acara",
      desc: "Susunan acara hari-H",
      icon: CalendarClock,
      count: `${(rundown ?? []).length} agenda`,
      surface: "bg-tint-sage text-tint-sage-foreground",
      grad: "grad-sage",
      emoji: "⏰",
    },
  ];

  const shortcuts = FEATURES.filter(
    (feature) => feature.to !== "/app" && !TOOLS.some((tool) => tool.to === feature.to),
  );

  return (
    <div className="space-y-4">
      <section className="clay grad-warm relative overflow-hidden p-5">
        <FlowerMark className="sway pointer-events-none absolute -right-4 -top-4 size-24 text-primary/15" />
        <div className="relative flex items-center gap-3">
          <div className="clay-sm flex size-12 items-center justify-center rounded-2xl bg-tint-rose text-2xl">
            🌷
          </div>
          <div>
            <h1 className="h-page">Lainnya</h1>
            <p className="meta mt-0.5">Alat tambahan & pengaturan</p>
          </div>
        </div>
        <p className="meta relative mt-3 text-xs leading-relaxed">
          Semua alat tambahan ada di sini — dari papan referensi sampai daftar
          tamu dan susunan acara.
        </p>
      </section>

      <section className="space-y-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className={`clay clay-press relative overflow-hidden p-4 ${tool.grad} ${tool.surface}`}
          >
            <FlowerMark className="pointer-events-none absolute -bottom-4 -right-4 size-16 opacity-20" />
            <div className="relative flex items-center gap-3">
              <div className="clay-sm flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl">
                {tool.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="h-card">{tool.label}</p>
                <p className="truncate text-[11px] leading-snug opacity-80">
                  {tool.desc}
                </p>
                <p className="num mt-0.5 text-[11px] font-bold">{tool.count}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 opacity-70" />
            </div>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="h-card mb-2">Jalan pintas</h2>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              className={`clay clay-press p-4 ${feature.surface}`}
            >
              <div className="flex items-center justify-between">
                <feature.icon className="size-5" />
                <span className="text-lg">{feature.emoji}</span>
              </div>
              <p className="h-card mt-2">{feature.label}</p>
              <p className="mt-1 text-[11px] leading-snug opacity-80">
                {feature.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/app/pengaturan"
        className="clay clay-press grad-lavender block p-4 text-tint-lavender-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="clay-sm flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl">
            ⚙️
          </div>
          <div className="flex-1">
            <p className="h-card">Pengaturan</p>
            <p className="text-[11px] leading-snug opacity-80">
              Nama, tanggal pernikahan, venue & target dana
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 opacity-70" />
        </div>
      </Link>

      <p className="meta pb-2 text-center">
        <Settings className="mr-1 inline size-3" />
        Planner Wedding · dibuat dengan hati
      </p>
    </div>
  );
}
