import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
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
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

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

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const sendCode = async () => {
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      toast.error("Masukkan alamat email yang valid.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn("email-otp", { email: cleaned });
      if (result.signingIn) {
        setStage("code");
        toast.success(`Kode 6 digit dikirim ke ${cleaned}.`);
      }
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
      toast.success("Berhasil masuk. Data kamu tersinkron antar perangkat.");
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
      await joinMutation({ code: joinCode });
      bloom();
      toast.success("Berhasil bergabung dengan workspace pasangan!");
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
      toast.success("Kamu keluar dari workspace bersama.");
    } catch {
      toast.error("Gagal keluar dari workspace.");
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
            <h2 className="h-card">Masuk dengan Email</h2>
            <p className="meta">Simpan data selamanya & buka dari HP mana saja</p>
          </div>
        </div>

        {stage === "email" ? (
          <div className="mt-3 space-y-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="account-email">Alamat email</Label>
              <Input
                id="account-email"
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
              Kami kirim kode 6 digit ke emailmu. Tanpa password, tanpa ribet.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="account-code">Kode dari email</Label>
              <Input
                id="account-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
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
                className="meta underline-offset-2 hover:underline"
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
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            void signOut();
            toast.success("Kamu telah keluar.");
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
            Semua perubahan kalian berdua langsung tampil di perangkat
            masing-masing.
          </p>
          {!isOwner ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-xl"
              disabled={busy}
              onClick={() => void leave()}
            >
              Keluar dari workspace
            </Button>
          ) : (
            <p className="meta mt-2">
              Untuk memutus, pasanganmu menekan "Keluar dari workspace" di
              app-nya.
            </p>
          )}
        </div>
      ) : isOwner ? (
        <div className="clay-inset mt-3 rounded-2xl px-3 py-2.5">
          <p className="label text-muted-foreground">Kode pasangan</p>
          {shareCode ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="num text-xl font-extrabold tracking-[0.25em]">
                {shareCode}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Salin kode"
                  className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-primary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
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
            Minta pasanganmu masuk dengan emailnya, lalu masukkan kode ini di
            app-nya.
          </p>
        </div>
      ) : (
        <div className="clay-inset mt-3 space-y-2.5 rounded-2xl px-3 py-2.5">
          <p className="label text-muted-foreground">Gabung pakai kode</p>
          <div className="flex items-center gap-2">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              maxLength={6}
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
            Kamu sedang melihat workspace sendiri. Masukkan kode dari
            pasanganmu untuk berbagi.
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
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              maxLength={6}
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
            Punya kode dari pasanganmu? Masukkan di sini untuk berbagi satu
            workspace.
          </p>
        </div>
      )}
    </section>
  );
}
