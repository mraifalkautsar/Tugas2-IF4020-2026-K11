# Brainrot Cipher

## 1. Nama dan Deskripsi Program

**Brainrot Cipher** adalah algoritma block cipher yang memakai struktur Substitution-Permutation Network (SPN), ukuran blok dan kunci 128 bit (16 byte), serta 10 putaran.

Program mendukung mode ECB, CBC, CFB, OFB, dan CTR. 

## 2. Teknologi yang Digunakan (Tech Stack)

- **Go:** bahasa pemrograman untuk algoritma cipher, mode operasi, dan analisis.
- **Go Modules:** pengelolaan modul project melalui `src/go.mod`.


## 3. Dependensi

- **Go versi 1.23 atau lebih baru**, dengan perintah `go` tersedia pada `PATH`.
- **Terminal**, seperti PowerShell, Command Prompt, atau terminal Linux/macOS.



## 4. How to Run

Buka terminal pada direktori utama repository 

Pastikan Go sudah terpasang:

```sh
go version
```

Jalankan program analisis dengan konfigurasi default:

```sh
go -C src run -work ./cmd/analyze
```

Program menggunakan Brainrot Cipher, membaca data contoh dari `src/testdata/fixtures/`, lalu menjalankan analisis pada kelima mode dengan 256 percobaan. Ringkasan muncul di terminal dan laporan lengkap disimpan ke `reports/brainrot.json`. Folder `reports/` dibuat otomatis.

Opsi `-work` mempertahankan direktori build sementara untuk menghindari kegagalan pembersihan executable yang terkunci di Windows.

Untuk memilih mode dan kunci sendiri, gunakan contoh berikut. Kunci harus terdiri dari 32 karakter heksadesimal, setara dengan 16 byte:

```sh
go -C src run -work ./cmd/analyze -cipher brainrot -modes CBC -key-hex 00112233445566778899aabbccddeeff
```

Untuk menjalankan analisis tanpa menyimpan laporan:

```sh
go -C src run -work ./cmd/analyze -output=
```
