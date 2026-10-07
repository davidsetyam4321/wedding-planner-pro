import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlowerMark } from "@/components/Decor";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { CalendarDays, Heart, Loader2, PiggyBank, Target } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

type Props = {
  /** Data awal (bawaan) — dipakai sebagai nilai awal bentuk. */
  defaultNames: { one: string; two: string };
  defaultDate: number;
  defaultTarget: number;
};

/**
 * Onboarding sekali jalan: pengguna baru langsung mengisi nama, tanggal, dan
 * target dana sebelum memakai aplikasi — tidak perlu membuka Pengaturan.
 * Tampil bila `wedding.onboarded` belum true.
 */
export function OnboardingDialog({
  defaultNames,
  defaultDate,
  defaultTarget,
}: Props) {
  const updateSettings = useMutation(api.wedding.updateSettings);
  const completeOnboarding = useMutation(api.wedding.completeOnboarding);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [one, setOne] = useState(defaultNames.one);
  const [two, setTwo] = useState(defaultNames.two);
  const [date, setDate] = useState(toDateInputValue(defaultDate));
  const [target, setTarget] = useState(
    defaultTarget > 0 ? String(defaultTarget) : "",
  );

  const isLast = step === 2;

  const next = () => {
    if (step === 0 && (!one.trim() || !two.trim())) {
      toast.error("Isi nama kalian berdua dulu.");
      return;
    }
    if (step === 1 && !date) {
      toast.error("Pilih tanggal pernikahan.");
      return;
    }
    if (isLast) {
      void finish();
      return;
    }
    setStep((value) => value + 1);
  };

  const finish = async () => {
    setBusy(true);
    try {
      await updateSettings({
        partnerOneName: one,
        partnerTwoName: two,
        weddingDate: fromDateInputValue(date),
        fundTarget: Number(target) || 0,
      });
      bloom();
      toast.success("Selamat datang! Ruang kerja kalian siap. 🤍");
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    try {
      await completeOnboarding({});
      toast.info("Onboarding dilewati — lengkapi kapan saja di Pengaturan.");
    } catch {
      toast.error("Gagal melewati onboarding.");
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    {
      icon: Heart,
      title: "Siapa kalian berdua?",
      desc: "Nama ini tampil di seluruh aplikasi dan dashboard.",
    },
    {
      icon: CalendarDays,
      title: "Kapan hari bahagianya?",
      desc: "Hitung mundur, rundown, dan pengingat dihitung dari tanggal ini.",
    },
    {
      icon: Target,
      title: "Berapa target dananya?",
      desc: "Patokan budget, tabungan, dan progres keuangan kalian.",
    },
  ];
  const Current = steps[step].icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-md" />
      <div className="clay relative w-full max-w-sm overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-tint-mint">
            <FlowerMark className="size-6 text-primary" />
          </span>
          <span className="flex gap-1.5" aria-hidden>
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={`h-1.5 rounded-full transition-all ${
                  index <= step ? "w-6 bg-primary" : "w-2.5 bg-border"
                }`}
              />
            ))}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Current className="size-4 text-primary" />
          <p className="label text-muted-foreground">
            Langkah {step + 1} dari {steps.length}
          </p>
        </div>
        <h2 className="h-page mt-1">{steps[step].title}</h2>
        <p className="meta mt-1">{steps[step].desc}</p>

        <div className="mt-5 space-y-3">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="onb-one">Nama Anda</Label>
                <Input
                  id="onb-one"
                  value={one}
                  onChange={(event) => setOne(event.target.value)}
                  placeholder="cth. Andra"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onb-two">Nama pasangan</Label>
                <Input
                  id="onb-two"
                  value={two}
                  onChange={(event) => setTwo(event.target.value)}
                  placeholder="cth. Rina"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="onb-date">Tanggal pernikahan</Label>
              <Input
                id="onb-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                autoFocus
              />
              <p className="meta">Bisa diubah kapan saja di Pengaturan.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1.5">
              <Label htmlFor="onb-target">Target dana (Rp)</Label>
              <Input
                id="onb-target"
                type="number"
                min={0}
                step={1000000}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder="64000000"
                autoFocus
                inputMode="numeric"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[30_000_000, 64_000_000, 100_000_000, 150_000_000].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTarget(String(value))}
                      className={`chip ${
                        target === String(value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {value / 1_000_000} jt
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-2xl text-muted-foreground"
            disabled={busy}
            onClick={() => void skip()}
          >
            Lewati
          </Button>
          <Button className="flex-1 rounded-2xl" disabled={busy} onClick={next}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isLast ? (
              <>
                <PiggyBank className="size-4" /> Mulai rencanakan
              </>
            ) : (
              "Lanjut"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
