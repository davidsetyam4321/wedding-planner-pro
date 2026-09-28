import { FlowerMark } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { bloom } from "@/lib/bloom";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Pengaturan: identitas pernikahan dan target dana. */
export function PengaturanPage() {
  const wedding = useQuery(api.wedding.get);
  const updateSettings = useMutation(api.wedding.updateSettings);
  const [saving, setSaving] = useState(false);

  const [partnerOne, setPartnerOne] = useState("");
  const [partnerTwo, setPartnerTwo] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [venue, setVenue] = useState("");
  const [target, setTarget] = useState("");
  const [seeded, setSeeded] = useState(false);

  // Seed the form once the document arrives, without an effect.
  if (wedding && !seeded) {
    setSeeded(true);
    setPartnerOne(wedding.partnerOneName);
    setPartnerTwo(wedding.partnerTwoName);
    setDateValue(toDateInputValue(wedding.weddingDate));
    setVenue(wedding.venueName ?? "");
    setTarget(String(wedding.fundTarget));
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerOne.trim() || !partnerTwo.trim() || !dateValue) {
      toast.error("Nama dan tanggal pernikahan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        partnerOneName: partnerOne,
        partnerTwoName: partnerTwo,
        weddingDate: fromDateInputValue(dateValue),
        fundTarget: Number(target) || 0,
        venueName: venue,
      });
      bloom();
      toast.success("Pengaturan tersimpan.");
    } catch {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/app/lainnya"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" /> Lainnya
      </Link>

      <section className="clay grad-warm relative overflow-hidden p-5">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 text-primary/20" />
        <div className="relative flex items-center gap-3">
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-tint-rose text-lg">
            ⚙️
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Pengaturan</h1>
            <p className="text-[11px] text-muted-foreground">
              Data ini dipakai di seluruh halaman
            </p>
          </div>
        </div>
      </section>

      <form className="clay space-y-3 p-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="set-p1">Nama kamu</Label>
          <Input
            id="set-p1"
            value={partnerOne}
            onChange={(e) => setPartnerOne(e.target.value)}
            placeholder="cth. Andra"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-p2">Nama pasangan</Label>
          <Input
            id="set-p2"
            value={partnerTwo}
            onChange={(e) => setPartnerTwo(e.target.value)}
            placeholder="cth. Rina"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-date">Tanggal pernikahan</Label>
          <Input
            id="set-date"
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-venue">Venue (opsional)</Label>
          <Input
            id="set-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="cth. Gedung Kartika"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-target">Target dana (Rp)</Label>
          <Input
            id="set-target"
            type="number"
            min={0}
            step={100000}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="64000000"
          />
        </div>
        <Button type="submit" className="w-full rounded-2xl" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4" /> Simpan pengaturan
            </>
          )}
        </Button>
      </form>

      <section className="clay p-4">
        <h2 className="text-sm font-bold">8 fitur siap dipakai</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {FEATURES.map((feature) => (
            <li
              key={feature.to}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${feature.surface}`}
            >
              <feature.icon className="size-3.5 shrink-0" />
              <span className="text-[11px] font-bold">{feature.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
