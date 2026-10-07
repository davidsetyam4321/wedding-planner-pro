# Rotasi Kunci & Bersihkan Repo

Dokumen ini mencatat langkah-langkah yang **harus dijalankan sendiri** (di
mesin Anda, dengan akses repo), karena agen tidak memiliki akses ke git,
GitHub, maupun dashboard gateway.

Urutan penting: **cabut dulu kunci lama, baru bersihkan repo.** Selama kunci
lama masih aktif, menghapus file dari riwayat tidak menambah keamanan apa pun.

---

## 1. Cabut kunci OTP lama di gateway

1. Buka dashboard gateway integrasi (Freebuff/Vly) → bagian kunci/integration key.
2. Cari kunci yang dipakai proyek ini, lalu **revoke / rotate**.
3. Salin kunci baru — hanya ditampilkan sekali.

Kunci lama sudah ter-commit di riwayat publik, jadi anggap bocor.

## 2. Pasang kunci baru sebagai env var Convex (bukan di repo)

```bash
npx convex env set VLY_INTEGRATION_KEY "<kunci-baru>"
npx convex env list          # pastikan sudah terpasang, nilainya tidak dicetak
```

- Jangan mengubah `.env.local` / `.env.keys` untuk produksi.
- **Jangan pakai ulang `DOTENV_PRIVATE_KEY_LOCAL`** di lingkungan produksi;
  kunci itu khusus untuk dekripsi `.env.keys` di mesin lokal.
- Simpan kunci baru di password manager tim, bukan di file yang di-commit.

## 3. Hentikan pelacakan `.env.keys`

`.env.keys` sudah ada di `.gitignore` tetapi terlanjur ter-commit.

```bash
git rm --cached .env.keys
git commit -m "chore: stop tracking .env.keys"
git push
```

Cek sisa file sensitif yang masih terlacak:

```bash
git ls-files | grep -iE "\.env|secret|key"
```

Harapan: tidak ada `.env*` yang muncul (`.env.example` boleh ada, asalkan
hanya berisi nama variabel tanpa nilai).

## 4. (Opsional) Bersihkan riwayat

Tidak wajib kalau kunci sudah dirotasi di langkah 1. Kalau tetap ingin
riwayat bersih, pakai `git filter-repo` (bukan `filter-branch`):

```bash
git filter-repo --path .env.keys --invert-paths
git push --force-with-lease
```

Koordinasikan dulu dengan siapa pun yang punya clone repo ini.

## 5. Scan kebocoran dengan gitleaks

```bash
# lewat Docker, tanpa memasang apa pun
docker run --rm -v "$(pwd):/repo" zricethezav/gitleaks:latest detect \
  --source=/repo --redact --verbose

# atau lewat binary
brew install gitleaks   # atau unduh rilis dari GitHub
gitleaks detect --source . --redact --verbose
```

Kalau ada temuan selain `.env.keys`, perlakukan temuan itu sebagai kunci
bocor: cabut, ganti, lalu baru bersihkan.

## 6. Lindungi ke depannya

- Aktifkan Secret Scanning + Push Protection di pengaturan repo GitHub
  (Settings → Code security). Push Protection akan menolak push berisi kunci.
- Jalankan `gitleaks` sebagai salah satu langkah CI (`.github/workflows/ci.yml`);
  langkah itu sudah disiapkan dan berjalan otomatis kalau binary tersedia.
- Kegagalan OTP setelah rotasi biasanya berarti `VLY_INTEGRATION_KEY` salah
  atau belum dipasang di deployment Convex yang benar:
  `npx convex env list --prod`.

## Checklist

- [ ] Kunci OTP lama dicabut di gateway
- [ ] Kunci baru dipasang via `npx convex env set VLY_INTEGRATION_KEY ...`
- [ ] `git rm --cached .env.keys` + commit + push
- [ ] `git ls-files | grep -iE "\.env|secret|key"` bersih
- [ ] `gitleaks detect` bersih (atau temuan sudah dirotasi)
- [ ] Secret scanning + push protection aktif di GitHub
