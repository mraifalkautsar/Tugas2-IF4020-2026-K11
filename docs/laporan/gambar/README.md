# Gambar laporan IF4020

Tambahkan gambar untuk laporan ini di folder ini. Gambar yang belum tersedia
ditampilkan sebagai kotak isian agar dokumen tetap dapat dikompilasi.

- `foto-kelompok.png`: foto seluruh anggota kelompok untuk sampul (3–4 orang).
  Nama berkas dapat diubah lewat `\FotoKelompok` di `identitas.tex`.
- `histogram-semua-mode.png`: histogram plainteks dan cipherteks ECB, CBC,
  CFB, OFB, serta CTR untuk teks pada v2, dibangkitkan dari JSON seed 42.
- `histogram-biner.png`: grafik yang sama untuk fixture biner v2, seed 42.
  Bangkitkan ulang keduanya dengan `scripts/render_brainrot_results.py`.
- Tambahkan tangkapan terminal, grafik avalanche, dan diagram tambahan
  sesuai hasil aktual, lalu rujuk melalui `figure` dan `\label`/`\ref`.

Diagram enkripsi pada Bab III digambar langsung dengan TikZ sehingga tidak
memerlukan berkas gambar eksternal. Foto dan tanda tangan dari tugas lama
tidak dipakai sebagai identitas kelompok saat ini.
