import { Button } from "@/components/ui/button";
import { Egg, FileText, Image, MessageCircle, QrCode, Wifi } from "lucide-react";

export function UndanganPage() {
  return (
    <div className="space-y-4">
      <BackLink />

      {/* Bespoke Suite */}
      <section className="clay overflow-hidden">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#39503f] via-[#425a49] to-[#5c7460] p-5 shadow-[0_20px_50px_-12px_rgba(41,58,47,0.45)]">
          <div className="pointer-events-none absolute -right-10 -top-14 size-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-tint-butter/25 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#e9c176]">
                <Egg className="size-3.5" />
                Bespoke Suite
              </span>
              <h2 className="mt-2 font-serif text-[1.5rem] font-semibold leading-tight text-white">
                Undangan Andi &amp; Rina
              </h2>
              <p className="mt-1 text-[13px] text-white/80">
                Undangan digital &amp; cetak terpadu untuk keluarga dan tamu.
              </p>
            </div>
            <div className="flex-shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-md border border-white/20">
              🔒 Sandi Aktif
            </div>
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/15">
            <span className="label text-white/80">Tautan publik</span>
            <div className="flex flex-1 min-w-0 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
              <code className="truncate text-[12px] text-white/90">satujanji.com/andi-rina</code>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl"
              
            >
              <span className="sr-only">Salin</span>
              <FileText className="size-3.5" />
              Salin
            </Button>
          </div>

          <div className="relative z-10 mt-3 flex flex-wrap gap-2">
            <Button
              className="flex-1 rounded-2xl bg-white/15 text-white backdrop-blur-sm border border-white/20"
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({ title: "Undangan Andi & Rina", url: window.location.href });
                }
              }}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 7 20 12 14 17" /><line x1="16" y1="12" x2="16" y2="12" /></svg>
              Kirim WhatsApp
            </Button>
            
          </div>

          
        </div>
      </section>

      {/* Pratinjau */}
      <section className="clay">
        <div className="flex items-center justify-between">
          <p className="label">PRATINJAU LANGSUNG</p>
          <span className="meta">Layar Penuh <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-lg">
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-b from-[#39503f] to-[#425a49]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#5a7360_0%,transparent_50%),radial-gradient(circle_at_70%_60%,#775a19_0%,transparent_50%)] opacity-20" />
            <div className="relative flex flex-col justify-center px-5 py-6 text-white">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
                <span className="flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /></svg> Undangan</span>
                <span>Sabtu, 18 Oktober 2025</span>
              </div>
              <div className="mt-3 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 p-1.5 backdrop-blur-sm border border-white/30">
                  <div className="w-full h-full rounded-full bg-white/30 p-1">
                    <div className="w-3/4 h-full rounded-full bg-white/40" />
                  </div>
                </div>
              </div>
              <p className="mt-3 font-serif text-xl font-bold text-center">THE WEDDING OF</p>
              <p className="text-center font-serif text-lg font-semibold">Andi &amp; Rina</p>
              <div className="mt-3 flex justify-center gap-2 text-xs text-white/70">
                <span className="flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg></span>
                <span>148 HARI</span>
              </div>
              <div className="mt-2 flex justify-center gap-2 text-xs text-white/70">
                <span className="flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg></span>
                <span>12 JAM</span>
              </div>
              <div className="mt-2 flex justify-center gap-2 text-xs text-white/70">
                <span className="flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg></span>
                <span>45 MENIT</span>
              </div>
              <div className="mt-4 flex justify-center">
                <Button size="sm" className="rounded-full bg-white text-[#425a49]">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 19-7z" /></svg>
                  Buka Undangan
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
          </div>
          <p className="px-4 pb-4 text-center text-[11px] text-muted-foreground">
            Tampilan responsif disesuaikan untuk perangkat mobile &amp; desktop.
          </p>
        </div>
      </section>

      {/* Kelola Fitur Digital */}
      <section>
        <SectionHeader
          title="Kelola Fitur Digital"
          action={<span className="meta">4 fitur</span>}
        />

        {/* Musik Latar */}
        <div className="clay clay-press rounded-3xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-tint-mint-foreground">
                <Wifi className="size-5" />
              </div>
              <div>
                <h3 className="h-card">Musik Latar</h3>
                <p className="meta">Autoplay saat tamu klik "Buka Undangan"</p>
              </div>
            </div>
            
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { icon: "🎵", name: "Payung Teduh - Akad", tag: "Utama" },
              { icon: "🎶", name: "Christina Perri - A Thousand Years", tag: "Cadangan" },
              { icon: "🎹", name: "Kuku Balinese - Mepeda Seden", tag: "Cadangan" },
            ].map((song) => (
              <div key={song.name} className="clay-inset flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
                <span className="text-lg">{song.icon}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{song.name}</span>
                <span className="meta shrink-0">{song.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Galeri & Kisah Cinta */}
        <div className="clay clay-press rounded-3xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-tint-mint-foreground">
                <Image className="size-5" />
              </div>
              <div>
                <h3 className="h-card">Galeri &amp; Kisah Cinta</h3>
                <p className="meta">6 Foto Prewedding Terpilih</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="rounded-xl">
              Kelola
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <img src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=120&h=120&fit=crop" alt="Couple" className="aspect-square rounded-xl object-cover" />
            <img src="https://images.unsplash.com/photo-1600891964092-67197f8e52bf?w=120&h=120&fit=crop" alt="Rings" className="aspect-square rounded-xl object-cover" />
            <div className="flex aspect-square items-center justify-center rounded-xl bg-tint-sage/60 border border-white/80">
              <span className="text-2xl">+4</span>
            </div>
          </div>
        </div>

        {/* Buku Tamu Online */}
        <div className="clay clay-press rounded-3xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-tint-mint-foreground">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h3 className="h-card">Buku Tamu Online</h3>
                <p className="meta">84 Ucapan Doa Masuk</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="rounded-xl bg-tint-sage text-tint-sage-foreground">
              <Users className="size-3.5" />
              Semua Rapi
            </Button>
          </div>
          <div className="mt-3 clay-inset rounded-2xl px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-white/70 text-xs font-bold">KD</div>
                <p className="text-sm font-semibold">Keluarga Dimas Prasetya</p>
              </div>
              <span className="meta">10 Menit lalu</span>
            </div>
            <p className="mt-1.5 text-sm italic text-muted-foreground">
              "Selamat ya Andi &amp; Rina! Selamat berharap kepada Allah SWT...
            </p>
          </div>
        </div>

        {/* Amplop Digital & QRIS */}
        <div className="clay clay-press rounded-3xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-tint-mint-foreground">
                <QrCode className="size-5" />
              </div>
              <div>
                <h3 className="h-card">Amplop Digital &amp; QRIS</h3>
                <p className="meta">BCA, Mandiri &amp; QRIS Statis</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-tint-sage/60 px-2.5 py-1 text-[10px] font-bold text-tint-sage-foreground">
              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Terverifikasi
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="clay-inset rounded-2xl p-3">
              <p className="label text-muted-foreground">BCA</p>
              <p className="num text-sm font-bold">8831-294-110</p>
              <div className="mt-1 flex items-center gap-1">
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="text-[10px] font-bold text-tint-sage-foreground">Terverifikasi</span>
              </div>
            </div>
            <div className="clay-inset rounded-2xl p-3">
              <p className="label text-muted-foreground">Mandiri</p>
              <p className="num text-sm font-bold">1370-001-982</p>
              <div className="mt-1 flex items-center gap-1">
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="text-[10px] font-bold text-tint-sage-foreground">Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
