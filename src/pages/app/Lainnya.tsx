import { SectionHeader } from "@/components/Shared";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
import { TOOL_NAV } from "@/lib/nav";
import { ChevronRight, Settings } from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

/** Lainnya: pintu masuk ke semua alat tambahan + pengaturan. */
export function LainnyaPage() {
  const guests = useQuery(api.guests.list);
  const vendors = useQuery(api.vendors.list);
  const rundown = useQuery(api.rundown.list);
  const categories = useQuery(api.moodboard.listCategories);

  const loading =
    guests === undefined ||
    vendors === undefined ||
    rundown === undefined ||
    categories === undefined;

  const counts: Record<string, string> = {
    "/app/moodboard": `${(categories ?? []).length} kategori`,
    "/app/tamu": `${(guests ?? []).length} tamu`,
    "/app/vendor": `${(vendors ?? []).length} vendor`,
    "/app/rundown": `${(rundown ?? []).length} agenda`,
  };

  const tools = TOOL_NAV.map((tool) => ({
    ...tool,
    count: counts[tool.to] ?? "",
  }));

  const shortcuts = FEATURES.filter(
    (feature) =>
      feature.to !== "/app" && !TOOL_NAV.some((tool) => tool.to === feature.to),
  );

  return (
    <div className="space-y-4">
      <section className="clay p-5">
        <div className="flex items-center gap-3">
          <div className="clay-sm flex size-12 items-center justify-center rounded-2xl bg-tint-rose text-2xl text-tint-rose-foreground">
            🌷
          </div>
          <div>
            <p className="label text-muted-foreground">Alat tambahan</p>
            <p className="meta mt-1">
              Semua modul perencanaan dalam satu tempat
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Alat perencanaan"
          action={<span className="meta">4 alat</span>}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="clay clay-press group flex items-center gap-3 p-3.5"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`clay-sm flex size-11 shrink-0 cursor-default items-center justify-center rounded-2xl text-lg ${tool.surface}`}
                  >
                    {tool.emoji}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{tool.desc}</TooltipContent>
              </Tooltip>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-tight">
                  {tool.label}
                </p>
                <p className="meta truncate">{tool.desc}</p>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              ) : (
                <Badge
                  className={`shrink-0 border-transparent ${tool.surface}`}
                >
                  {tool.count}
                </Badge>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Jalan pintas"
          action={<span className="meta">3 pintasan</span>}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
              <p className="mt-2.5 text-sm font-extrabold leading-tight">
                {feature.label}
              </p>
              <p className="mt-1 text-[11px] leading-snug opacity-80">
                {feature.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/app/pengaturan"
        className="clay clay-press flex items-center gap-3 p-3.5"
      >
        <span className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-lavender text-lg text-tint-lavender-foreground">
          ⚙️
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-tight">
            Pengaturan
          </p>
          <p className="meta truncate">
            Nama, tanggal, venue, target dana & akun
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 border-transparent">
          Akun & data
        </Badge>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <p className="meta pb-2 text-center">
        <Settings className="mr-1 inline size-3" />
        Planner Wedding · Perencana pernikahan untuk berdua
      </p>
    </div>
  );
}
