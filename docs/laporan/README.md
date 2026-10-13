# Laporan Tugas 2 IF4020 — Brainrot Cipher

Kerangka laporan mengikuti bagian **Laporan** pada
[`Tugas2-IF4020-2026.md`](../../Tugas2-IF4020-2026.md).
Format A4, footer mata kuliah, dan pembagian berkas bab dipertahankan dari
template sebelumnya. Konten, data, gambar GUI, tanda tangan, serta hasil
pemrosesan citra IF4073 telah dikeluarkan dari laporan aktif. Halaman
pernyataan dari tugas lama juga tidak digunakan karena tidak diminta oleh
spesifikasi tugas ini.

Teks awal rancangan dan implementasi berasal dari kode saat penyiapan
template dan diperbarui untuk Brainrot; tinjau kembali jika kode berubah.
Tabel, histogram, demonstrasi HTTP, dan pembahasan perancangan/keamanan
sudah terisi berdasarkan kode dan pengujian. Kesimpulan masih berupa isian.
`---` pada tabel berarti **belum diisi**, bukan nol atau lulus.
Seluruh identitas anggota memakai placeholder sesuai permintaan.

## Mulai menulis

1. Isi [`identitas.tex`](identitas.tex): nama/NIM tiga anggota, nomor kelompok,
   judul, dan pranala repositori. Aktifkan `\EmpatAnggotatrue` jika ada anggota
   keempat; sampul dan tabel pembagian tugas akan menyesuaikan.
2. Masukkan foto seluruh anggota ke `gambar/foto-kelompok.png`. Sampul memakai
   foto kelompok sebagai pengganti logo sesuai spesifikasi. Foto belum tersedia
   tetap ditampilkan sebagai kotak isian.
3. Lengkapi bab pada `bagian/`. Cari `\Isi{` untuk petunjuk penulisan dan `---`
   untuk tabel hasil. Ganti placeholder dengan teks atau bukti aktual.
4. Tambahkan grafik dan tangkapan terminal ke `gambar/`. Diagram alur enkripsi
   sudah tersedia dalam TikZ; tidak perlu mengekspor gambar untuk diagram itu.
5. Isi kontribusi anggota dan release/commit di lampiran. Lengkapi atau hapus
   isian video/API jika bonus tersebut tidak diambil.

| Berkas | Isi |
| --- | --- |
| [`main.tex`](main.tex) | Format, sampul, daftar isi/gambar/tabel, urutan bab |
| [`identitas.tex`](identitas.tex) | Seluruh identitas dan konfigurasi anggota |
| [`bagian/1_pendahuluan.tex`](bagian/1_pendahuluan.tex) | Latar belakang, cipher pembanding, gagasan rancangan |
| [`bagian/2_dasar_teori.tex`](bagian/2_dasar_teori.tex) | Teori ringkas dan definisi ukuran statistik |
| [`bagian/3_perancangan.tex`](bagian/3_perancangan.tex) | State, S-box, permutasi, matriks, enkripsi/dekripsi, kunci putaran |
| [`bagian/4_implementasi_simulasi.tex`](bagian/4_implementasi_simulasi.tex) | CLI, lima mode, padding, simulasi teks/biner, integritas |
| [`bagian/5_analisis_keamanan.tex`](bagian/5_analisis_keamanan.tex) | Metode, avalanche blok/mode, entropi, histogram, keterbatasan |
| [`bagian/6_kesimpulan.tex`](bagian/6_kesimpulan.tex) | Kesimpulan dan saran pengembangan |
| [`bagian/7_pustaka.tex`](bagian/7_pustaka.tex) | Referensi dengan `thebibliography`; tidak memerlukan BibTeX |
| [`bagian/8_lampiran.tex`](bagian/8_lampiran.tex) | Repositori, bonus, pembagian tugas, cara menjalankan |

## Temuan kode yang perlu diperhatikan saat menulis

| Ketentuan / bukti | Kondisi kode saat template disiapkan |
| --- | --- |
| Cipher dan kunci minimal 64 bit | Brainrot memakai blok/kunci 128 bit, 10 putaran, dan 21 subkunci |
| Substitusi, permutasi, operasi tambahan | S-box dari permutasi matriks 16×16 selama 67 iterasi, pergeseran baris, MixColumns, BPT revisi, FCM putaran genap, penjumlahan modulo, dan XOR |
| Rancangan baru dan penjelasan komponen | Struktur dan key schedule menyerupai AES-128; jelaskan asal ide dan perubahan yang dibuat terhadap pembanding |
| Lima mode operasi | ECB, CBC, CFB-128, OFB, CTR tersedia di `src/modes` |
| Padding | PKCS#7 untuk ECB/CBC; CFB/OFB/CTR memproses sisa byte tanpa padding |
| Masukan/keluaran teks dan berkas biner | API mode menerima byte; `crypt` hanya menerima argumen teks/hex. CLI analisis membaca berkas uji, tetapi belum menjadi antarmuka enkripsi/dekripsi berkas |
| Verifikasi hasil dekripsi | Analisis memeriksa `bytes.Equal`; belum ada autentikasi/tag integritas pada cipherteks |
| Avalanche, entropi, histogram semua mode | Tabel, grafik, dan pembahasan dari JSON Brainrot tersedia di Bab V |
| Bukti pengujian | Vektor independen, subkunci, 66 snapshot, invers, batas difusi, pengujian 256 nilai S-box, serta pengujian lima mode/statistik tersedia; XOR uji dipertahankan untuk chaining |

Pembentukan S-box menggunakan indeks 0–15 dan tidak memakai tabel AES.
Inversnya dibentuk dengan `inverse[sbox[x]] = x`. Pergeseran memindahkan
posisi byte, bukan memutar bit di dalam byte. Penjelasan lengkap ada pada
subbagian SubBytes67 di Bab III. Cipherteks dari S-box lama tidak kompatibel;
vektor referensi dan pengukuran laporan diperbarui untuk kode hasil merge.

Analisis bawaan dapat dijalankan dari root repositori:

```sh
go -C src test ./...
go -C src run ./cmd/analyze -cipher brainrot -modes all \
  -trials 256 -seed 42 -output ../reports/brainrot/text-seed42.json
```

Gunakan `-input testdata/...` untuk berkas lain; path masukan relatif terhadap
`src` ketika memakai `go -C src`. Ukuran berkas analisis dibatasi 1 MiB.
Gunakan nama laporan berbeda untuk tiap berkas agar hasil tidak tertimpa.
`reports/toy.json` adalah hasil infrastruktur cipher XOR, bukan hasil Brainrot.
JSON dan pesan terminal menandai eksperimen; nilai statistik bukan bukti
keamanan kriptografis. Metode lengkap ada di [`../methodology.md`](../methodology.md).

Demonstrasi endpoint HTTP, padding, kesamaan byte/hash, serta perubahan
data di Bab IV dapat diulang dengan
`go -C src run ../scripts/report_demonstration.go`. Hasilnya tersimpan di
`reports/brainrot/document-demo.json`. Bukti ini menunjukkan pemulihan data
yang diuji, sekaligus memperlihatkan bahwa autentikasi integritas belum tersedia.

Spesifikasi Brainrot tersedia di [`../../addition.md`](../../addition.md).
Cipherteks lama tidak kompatibel dan format hex CLI belum memuat penanda versi.
Hasil yang direkam, benchmark, dan manifest ada di
[`../../reports/brainrot/README.md`](../../reports/brainrot/README.md).
Tabel terbangkitkan di `data/brainrot/` dan histogram di `gambar/` dapat diperbarui
dengan `python3 scripts/render_brainrot_results.py` dari root repositori
(memerlukan matplotlib untuk rendering). PDF memakai berkas yang sudah
termasuk di folder laporan, sehingga kompilasi tidak memerlukan Python.

## Kompilasi

Gunakan **XeLaTeX** (atau LuaLaTeX), bukan pdfLaTeX. Jalankan dari folder
`docs/laporan/` agar path `\input` dan gambar dapat ditemukan:

```sh
make
```

Perintah ini memerlukan `make`, `latexmk`, XeLaTeX, dan paket TeX pada
`main.tex` (termasuk `babel` Indonesian, `fontspec`, `titlesec`, `titletoc`,
`listings`, `url`, dan TikZ). Berkas sementara masuk `.build/`; PDF pratinjau
disalin ke `draf-laporan.pdf`. Keduanya diabaikan Git. `make clean` menghapus
hasil build dan PDF pratinjau.

Tanpa `make` atau `latexmk`, jalankan:

```sh
xelatex -interaction=nonstopmode -halt-on-error main.tex
xelatex -interaction=nonstopmode -halt-on-error main.tex
xelatex -interaction=nonstopmode -halt-on-error main.tex
```

Hasilnya `main.pdf`. Ulangi jika nomor halaman atau rujukan belum stabil.
Di Overleaf, unggah isi folder ini dan pilih XeLaTeX sebagai compiler.
Font utama memakai Times New Roman jika tersedia (font sistem atau empat
berkas `times*.ttf` pada `fonts/`); jika tidak tersedia, template memakai
TeX Gyre Termes agar tetap dapat dikompilasi.

## PDF pengumpulan

Setelah seluruh isian selesai, salin PDF dengan nama sesuai spesifikasi:

```text
NIM1_NIM2_NIM3_Tugas2_IF4020.pdf
NIM1_NIM2_NIM3_NIM4_Tugas2_IF4020.pdf  (jika empat anggota)
```

Pastikan nama algoritma dan foto semua anggota ada pada sampul, simulasi
teks/biner dan analisis mencakup lima mode, bukti padding/integritas tersedia,
rujukan terisi, serta pembagian tugas lengkap. Tambahkan PDF akhir ke
repositori/release dengan nama di atas; jangan mengumpulkan PDF placeholder.
