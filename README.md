# Brainrot Cipher

## 1. Nama dan Deskripsi Program

**Brainrot Cipher** adalah algoritma block cipher yang memakai struktur Substitution-Permutation Network (SPN), ukuran blok dan kunci 128 bit (16 byte), serta 10 putaran.

Program mendukung mode ECB, CBC, CFB, OFB, dan CTR. 

## 2. Teknologi yang Digunakan (Tech Stack)

- **Go:** bahasa pemrograman untuk algoritma cipher, mode operasi, dan analisis.
- **Go Modules:** pengelolaan modul project melalui `src/go.mod`.
- **React**
- **Vite.js**
- 


## 3. Dependensi

- **Go versi 1.23 atau lebih baru**, dengan perintah `go` tersedia pada `PATH`.
- **Terminal**, seperti PowerShell, Command Prompt, atau terminal Linux/macOS.



## 4. How to Run

Buka terminal pada direktori utama repository 

Pastikan Go sudah terpasang:

```sh
go version
```

Untuk mencoba enkripsi dan dekripsi teks melalui PowerShell, gunakan kunci sepanjang 32 karakter heksadesimal (16 byte):

```powershell
$key = "00112233445566778899aabbccddeeff"
```

```powershell
$ciphertext = go -C src run -work ./cmd/crypt -op encrypt -mode CBC -key-hex $key -input "Halo Brainrot"
$ciphertext
```

```powershell
go -C src run -work ./cmd/crypt -op decrypt -mode CBC -key-hex $key -input $ciphertext
```

Enkripsi menyimpan hasil hex ke variabel `$ciphertext`; baris `$ciphertext` menampilkannya di terminal. Dekripsi menggunakan hasil tersebut dan menampilkan teks awal, yaitu `Halo Brainrot`.

Mode default adalah CBC. Ganti `-mode CBC` dengan `-mode ECB`, `-mode CFB`, `-mode OFB`, atau `-mode CTR` pada kedua perintah untuk mencoba mode lain. Gunakan kunci dan mode yang sama saat dekripsi. Untuk mode selain ECB, IV dibuat otomatis dan disertakan di depan ciphertext sehingga tidak perlu dimasukkan secara terpisah.

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
