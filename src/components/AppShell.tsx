import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { countdownLabel, formatDateID, formatRupiahShort, fromDateInputValue, toDateInputValue } from "@/lib/format";
import { Bell, Loader2, LogOut, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

const DEMO_DURATION_MS = 4 * 60_000;

/** Runs ensureSetup once per mount; the mutation itself is idempotent. */
function useEnsureSetup() {
  const ensureSetup = useMutation(api.wedding.ensureSetup);
  const [state, setState] = useState<"pending" | "done" | "error">("pending");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    ensureSetup({})
      .then(() => setState("done"))
      .catch(() => setState("error"));
  }, [ensureSetup]);

  return state;
}

function DemoBanner({
  claimed,
  onClaim,
  claiming,
}: {
  claimed: boolean;
  onClaim: () => void;
  claiming: boolean;
}) {
  const [remainingMs, setRemainingMs] = useState(DEMO_DURATION_MS);

  useEffect(() => {
    if (claimed) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setRemainingMs(Math.max(0, DEMO_DURATION_MS - (Date.now() - startedAt)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [claimed]);

  const clock =
    String(Math.floor(remainingMs / 60_000)).padStart(2, "0") +
    ":" +
    String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, "0");

  if (claimed) {
    return (
      <div className="mb-3 flex items-center gap-2 border border-primary/40 bg-accent px-3 py-2 text-xs text-accent-foreground">
        <Timer className="size-3.5 shrink-0" />
        <span className="flex-1">Bonus demo sudah diklaim — selamat menata rencana!</span>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-3 border border-amber-custom/60 bg-amber-custom/20 px-3 py-2">
      <Timer className="size-3.5 shrink-0 text-amber-custom-foreground" />
      <div className="flex-1 leading-tight">
        <p className="text-xs font-medium text-amber-custom-foreground">
          Demo premium aktif · sisa {clock}
        </p>
        <p className="text-[11px] text-amber-custom-foreground/70">
          Semua fitur terbuka selama demo berlangsung.
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0 border border-amber-custom-foreground/30 bg-amber-custom text-amber-custom-foreground hover:bg-amber-custom/80"
        onClick={onClaim}
        disabled={claiming}
      >
        {claiming ? <Loader2 className="size-3.5 animate-spin" /> : "Klaim 79rb"}
      </Button>
    </div>
  );
}

function NotificationBell({
  wedding,
}: {
  wedding:
    | {
        partnerOneName: string;
        partnerTwoName: string;
        weddingDate: number;
        fundClaimed?: boolean;
      }
    | null
    | undefined;
}) {
  const checklist = useQuery(api.checklist.list);
  const openCount = checklist?.filter((item) => !item.done).length ?? 0;

  const notes = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    if (wedding) {
      list.push({
        id: "countdown",
        label: `Hitung mundur: ${countdownLabel(wedding.weddingDate)} · ${formatDateID(wedding.weddingDate)}`,
      });
      list.push({
        id: "checklist",
        label:
          openCount === 0
            ? "Semua tugas checklist selesai. 🎉"
            : `${openCount} tugas checklist masih terbuka.`,
      });
      list.push({
        id: "fund",
        label: wedding.fundClaimed
          ? "Bonus demo sudah masuk ke tabungan."
          : "Bonus demo Rp 79rb menunggu diklaim.",
      });
    }
    return list;
  }, [wedding, openCount]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-9 border-border bg-card text-foreground hover:bg-muted"
          aria-label="Notifikasi"
        >
          <Bell className="size-4" />
          {openCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-primary-foreground">
              {openCount > 9 ? "9+" : openCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="panel-header">Notifikasi</div>
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="px-3 py-2 text-xs leading-relaxed">
              <span className="text-primary">&gt; </span>
              {note.label}
            </li>
          ))}
          {notes.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Memuat…</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function OnboardingDialog({
  wedding,
}: {
  wedding: {
    partnerOneName: string;
    partnerTwoName: string;
    weddingDate: number;
    fundTarget: number;
  };
}) {
  const updateSettings = useMutation(api.wedding.updateSettings);
  const [partnerOne, setPartnerOne] = useState(wedding.partnerOneName);
  const [partnerTwo, setPartnerTwo] = useState(wedding.partnerTwoName);
  const [dateValue, setDateValue] = useState(toDateInputValue(wedding.weddingDate));
  const [targetValue, setTargetValue] = useState(String(wedding.fundTarget));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
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
        fundTarget: Number(targetValue) || 0,
        setupComplete: true,
      });
      toast.success("Profil pernikahan tersimpan.");
    } catch {
      toast.error("Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="font-semibold">Selamat datang!</DialogTitle>
          <DialogDescription>
            Isi data pernikahan kalian dulu, ya. Semua bisa diubah nanti di menu Lainnya.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-p1">Nama kamu</Label>
            <Input
              id="ob-p1"
              value={partnerOne}
              onChange={(event) => setPartnerOne(event.target.value)}
              placeholder="cth. Andra"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-p2">Nama pasangan</Label>
            <Input
              id="ob-p2"
              value={partnerTwo}
              onChange={(event) => setPartnerTwo(event.target.value)}
              placeholder="cth. Rina"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-date">Tanggal pernikahan</Label>
            <Input
              id="ob-date"
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-target">Target dana (Rp)</Label>
            <Input
              id="ob-target"
              type="number"
              min={0}
              step={100000}
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              placeholder="64000000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Mulai merencanakan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell() {
  const { isLoading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const setupState = useEnsureSetup();
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const claimFundBonus = useMutation(api.wedding.claimFundBonus);
  const [claiming, setClaiming] = useState(false);

  const setupReady =
    setupState !== "pending" || (wedding !== undefined && wedding !== null);

  const savingsTotal = savings?.reduce((sum, deposit) => sum + deposit.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const progressPct = fundTarget > 0 ? Math.min(100, (savingsTotal / fundTarget) * 100) : 0;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const result = await claimFundBonus({});
      if (result.claimed) {
        toast.success("Bonus Rp 79.000 masuk ke tabungan!");
      } else {
        toast.info("Bonus sudah pernah diklaim.");
      }
    } catch {
      toast.error("Gagal mengklaim bonus demo.");
    } finally {
      setClaiming(false);
    }
  };

  if (isLoading || !setupReady) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="scanline-top border-b border-border bg-secondary/70">
        <div className="mx-auto max-w-md px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center border border-primary/40 bg-card text-primary">
                <span className="text-sm font-bold">PW</span>
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {wedding
                    ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
                    : "…"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {wedding ? formatDateID(wedding.weddingDate) : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell wedding={wedding} />
              <Button
                variant="outline"
                size="icon"
                className="size-9 border-border bg-card text-foreground hover:bg-muted"
                onClick={handleSignOut}
                aria-label="Keluar"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <span className="border border-border bg-card px-1.5 py-0.5 font-semibold text-foreground">
              {wedding ? countdownLabel(wedding.weddingDate) : "H-…"}
            </span>
            <span className="flex-1" />
            <span className="text-muted-foreground">Terkumpul</span>
            <span className="font-semibold text-primary">
              {formatRupiahShort(savingsTotal)}
            </span>
            <span className="text-muted-foreground">
              / {formatRupiahShort(fundTarget)}
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full border border-border bg-card">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-3">
        <DemoBanner claimed={wedding?.fundClaimed ?? false} onClaim={handleClaim} claiming={claiming} />
      </div>

      <main className="mx-auto max-w-md px-4 pt-1">
        <Outlet />
      </main>

      {wedding && !wedding.setupComplete && <OnboardingDialog wedding={wedding} />}

      <BottomNav />
    </div>
  );
}
