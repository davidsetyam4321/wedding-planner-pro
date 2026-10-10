import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import { requestSetupRefresh } from "@/lib/session";
import { useAuth } from "@/hooks/use-auth";
import {
  Check,
  Copy,
  Link2,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/**
 * Remembers the OTP flow step so navigating away (e.g. to open the email app)
 * doesn't lose the code input when coming back to Pengaturan.
 */
const OTP_FLOW_KEY = "planner-wedding:otp-flow";

function loadOtpFlow(): { email: string; stage: "email" | "code" } {
  try {
    const raw = sessionStorage.getItem(OTP_FLOW_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { email?: string; stage?: string };
      if (
        typeof parsed.email === "string" &&
        (parsed.stage === "email" || parsed.stage === "code")
      ) {
        return { email: parsed.email, stage: parsed.stage };
      }
    }
  } catch {
    // Ignore unreadable storage; fall back to the email step.
  }
  return { email: "", stage: "email" };
}

/**
 * Account management for the couple: sign in with an email (OTP code) so the
 * workspace follows you to any device, then share it with your partner via a
 * 6-character invite code. Convex keeps both devices in real time.
 */
export function AccountSection() {
  const { user, isLoading } = useAuth();
  const { signIn, signOut } = useAuthActions();
  const workspace = useQuery(api.workspace.status);
  const joinMutation = useMutation(api.workspace.joinByInviteCode);
  const leaveMutation = useMutation(api.workspace.leaveWorkspace);
  const revealMutation = useMutation(api.workspace.revealInviteCode);

  const savedFlow = useMemo(() => loadOtpFlow(), []);
  const [email, setEmail] = useState(savedFlow.email);
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">(savedFlow.stage);

  useEffect(() => {
    try {
      sessionStorage.setItem(OTP_FLOW_KEY, JSON.stringify({ email, stage }));
    } catch {
      // Best-effort persistence only.
    }
  }, [email, stage]);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const sendCode = async () => {
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      toast.error("Masukkan alamat email yang valid.");
      return;
    }
    setBusy(true);
    try {
      await signIn("email-otp", { email: cleaned });
      setStage("code");
      toast.success(`Kode 6 digit dikirim ke ${cleaned}.`);
    } catch {
      toast.error("Gagal mengirim kode. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    const cleaned = code.replace(/\D/g, "");
    if (cleaned.length !== 6) {
      toast.error("Masukkan 6 digit kode dari email.");
      return;
    }
    setBusy(true);
    try {
      await signIn("email-otp", {
        email: email.trim().toLowerCase(),
        code: cleaned,
      });
      bloom();
      // Re-run ensureSetup right away: the fresh email account adopts this
      // device's anonymous workspace and every query re-syncs live.
      requestSetupRefresh();
      toast.success("Berhasil masuk. Data Anda tersinkron di semua perangkat.");
      setEmail("");
      setCode("");
      setStage("email");
    } catch {
      toast.error("Kode salah atau kedaluwarsa.");
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      const result = await joinMutation({ code: joinCode });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      bloom();
      toast.success("Berhasil bergabung dengan ruang kerja pasangan!");
      setJoinCode("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal bergabung. Coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await leaveMutation({});
      setConfirmLeave(false);
      toast.success("Anda telah keluar dari ruang kerja bersama.");
    } catch {
      toast.error("Gagal keluar dari ruang kerja.");
    } finally {
      setBusy(false);
    }
  };

  const regenerateCode = async () => {
    setBusy(true);
    try {
      await revealMutation({ regenerate: true });
      toast.success("Kode baru dibuat.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat kode.",
      );
    } finally {
      setBusy(false);
    }
  };

  const createCode = async () => {
    setBusy(true);
    try {
      await revealMutation({ regenerate: false });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat kode.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="clay-inset flex h-20 items-center justify-center rounded-2xl">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAnon = user?.isAnonymous ?? false;
  const isOwner = workspace?.isOwner ?? true;
  const connectedEmail = workspace?.connectedEmail ?? null;
  const shareCode = workspace?.inviteCode ?? null;

  // ── Not signed in with an email yet ──────────────────────────────────────
  if (isAnon || !user?.email) {
    return (
      <section className="clay p-4">
        <div className="flex items-center gap-2">
          <span className="clay-sm flex size-9 items-center justify-center rounded-xl bg-tint-lavender text-tint-lavender-foreground">
            <Mail className="size-4" />
          </span>
          <div>
            <h2 className="h-card">Masuk dengan Email</h2>              <p className="meta">Agar tersimpan permanen dan bisa dibuka dari perangkat lain</p>
          </div>
        </div>

        {stage === "email" ? (
          <div className="mt-3 space-y-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="account-email">Alamat email</Label>
              <Input
                id="account-email"
                autoComplete="email"
                required
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendCode();
                }}
              />
            </div>
            <Button
              className="w-full rounded-2xl"
              disabled={busy}
              onClick={() => void sendCode()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Kirim kode verifikasi"
              )}
            </Button>
            <p className="meta">
              Kami mengirimkan kode 6 digit ke email Anda. Tanpa kata sandi,
              tanpa kerumitan.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="account-code">Kode dari email</Label>
              <Input
                id="account-code"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="______"
                className="num text-center text-lg tracking-[0.4em]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") void verifyCode();
                }}
              />
            </div>
            <Button
              className="w-full rounded-2xl"
              disabled={busy}
              onClick={() => void verifyCode()}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Verifikasi"}
            </Button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={busy}
                className="meta underline-offset-2 hover:underline disabled:opacity-50"
                onClick={() => setStage("email")}
              >
                Ganti email
              </button>
              <button
                type="button"
                className="meta underline-offset-2 hover:underline"
                disabled={busy}
                onClick={() => void sendCode()}
              >
                Kirim ulang kode
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ── Signed in with email: partner sharing ────────────────────────────────
  return (
    <section className="clay p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="clay-sm flex size-9 items-center justify-center rounded-xl bg-tint-mint text-tint-mint-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h2 className="h-card">Akun tersinkron</h2>
            <p className="meta">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Keluar"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={async () => {
            try {
              await signOut();
              toast.success("Anda telah keluar.");
            } catch {
              toast.error("Gagal keluar. Coba lagi.");
            }
          }}
        >
          <LogOut className="size-4" />
        </button>
      </div>

      {connectedEmail ? (
        <div className="clay-inset mt-3 rounded-2xl px-3 py-2.5">
          <p className="label text-muted-foreground">Terhubung dengan</p>
          <p className="num mt-0.5 text-sm font-bold">{connectedEmail}</p>
          <p className="meta mt-1">
            Setiap perubahan Anda dan pasangan langsung tampil di kedua
            perangkat.
          </p>
          {!isOwner ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl"
              disabled={busy}
              onClick={() => setConfirmLeave(true)}
            >
              Keluar dari ruang kerja
            </Button>
          ) : (
            <p className="meta mt-2">
              Untuk memutus, pasangan Anda menekan "Keluar dari ruang kerja"
              di aplikasinya.
            </p>
          )}
        </div>
      ) : isOwner ? (
        <div className="clay-inset mt-3 rounded-2xl px-3 py-2.5">
          <p className="label text-muted-foreground">Kode pasangan</p>
          {shareCode ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p
                className="num text-xl font-extrabold tracking-[0.25em]"
                aria-label={`Kode undangan ${shareCode}`}
              >
                {shareCode}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Salin kode"
                  className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-primary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareCode);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                      toast.success("Kode undangan disalin.");
                    } catch {
                      toast.error("Gagal menyalin kode. Salin kode secara manual.");
                    }
                  }}
                >
                  {copied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Buat kode baru"
                  className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-primary"
                  disabled={busy}
                  onClick={() => void regenerateCode()}
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 rounded-xl"
              disabled={busy}
              onClick={() => void createCode()}
            >
              <Link2 className="size-4" /> Buat kode pasangan
            </Button>
          )}
          <p className="meta mt-1.5">
            Minta pasangan Anda masuk dengan emailnya, lalu masukkan kode ini
            di aplikasinya.
          </p>
        </div>
      ) : (
        <div className="clay-inset mt-3 space-y-2.5 rounded-2xl px-3 py-2.5">
          <p className="label text-muted-foreground">Gabung pakai kode</p>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Kode undangan pasangan"
              autoComplete="off"
              maxLength={6}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !busy && joinCode.length === 6) {
                  void join();
                }
              }}
              value={joinCode}
              onChange={(event) =>
                setJoinCode(
                  [...event.target.value.toUpperCase()]
                    .filter((character) =>
                      "ABCDEFGHJKMNPQRSTUVWXYZ23456789".includes(character),
                    )
                    .slice(0, 6)
                    .join(""),
                )
              }
              placeholder="ABC123"
              className="num flex-1 tracking-[0.25em]"
            />
            <Button
              size="sm"
              className="rounded-xl"
              disabled={busy || joinCode.length !== 6}
              onClick={() => void join()}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Gabung"}
            </Button>
          </div>
          <p className="meta">
            Anda sedang melihat ruang kerja sendiri. Masukkan kode dari
            pasangan Anda untuk berbagi.
          </p>
        </div>
      )}

      {/* Owner without a partner can also join someone else's workspace —
          useful when the partner set everything up first. */}
      {isOwner && !connectedEmail && (
        <div className="clay-inset mt-2.5 space-y-2.5 rounded-2xl px-3 py-2.5">
          <p className="label text-muted-foreground">Gabung pakai kode</p>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Kode undangan pasangan"
              autoComplete="off"
              maxLength={6}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !busy && joinCode.length === 6) {
                  void join();
                }
              }}
              value={joinCode}
              onChange={(event) =>
                setJoinCode(
                  [...event.target.value.toUpperCase()]
                    .filter((character) =>
                      "ABCDEFGHJKMNPQRSTUVWXYZ23456789".includes(character),
                    )
                    .slice(0, 6)
                    .join(""),
                )
              }
              placeholder="ABC123"
              className="num flex-1 tracking-[0.25em]"
            />
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl"
              disabled={busy || joinCode.length !== 6}
              onClick={() => void join()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="size-4" /> Gabung
                </>
              )}
            </Button>
          </div>
          <p className="meta">
            Punya kode dari pasangan Anda? Masukkan di sini untuk berbagi satu
            ruang kerja.
          </p>
        </div>
      )}
      <AlertDialog
        open={confirmLeave}
        onOpenChange={(open) => {
          if (!busy) setConfirmLeave(open);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari workspace bersama?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda kembali ke workspace pribadi yang kosong. Data pasangan tetap
              berada di workspace pemilik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={busy}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={() => void leave()}
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
