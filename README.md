# Brainrot Cipher (BRC-128)

> **Implementasi Algoritma Block Cipher SPN 128-bit dengan Mode Operasi Lengkap & Visualisasi Interaktif Neo-Brutalist**  
> *Tugas 2 IF4020 Kriptografi • Semester II Tahun Ajaran 2025/2026 • Kelompok 11 (K11)*

<br>

<div align="center">
  <p align="center">
    <a href="https://golang.org/"><img src="https://img.shields.io/badge/Go_1.23-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript_7-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  </p>
</div>

---

### Daftar Isi
- [Anggota Kelompok](#anggota-kelompok)
- [1. Nama dan Deskripsi Program](#1-nama-dan-deskripsi-program)
  - [1.1 Gambaran Umum](#11-gambaran-umum)
  - [1.2 Karakteristik & Parameter Cipher](#12-karakteristik--parameter-cipher)
  - [1.3 Mode Operasi](#13-mode-operasi)
  - [1.4 Visualisasi & Analisis Kriptografi](#14-visualisasi--analisis-kriptografi)
- [2. Teknologi yang Digunakan (Tech Stack)](#2-teknologi-yang-digunakan-tech-stack)
  - [2.1 Backend Engine (`src/`)](#21-backend-engine-src)
  - [2.2 Frontend Studio (`frontend/`)](#22-frontend-studio-frontend)
  - [2.3 Container & Deployment](#23-container--deployment)
- [3. Dependensi](#3-dependensi)
  - [3.1 Menjalankan via Docker (Rekomendasi)](#31-menjalankan-via-docker-rekomendasi)
  - [3.2 Menjalankan secara Lokal / Manual](#32-menjalankan-secara-lokal--manual)
- [4. Tata Cara Menjalankan Program](#4-tata-cara-menjalankan-program)
  - [4.1 Metode 1: Menggunakan Docker Compose (All-in-One)](#41-metode-1-menggunakan-docker-compose-all-in-one)
  - [4.2 Metode 2: Menjalankan Manual (Local Development)](#42-metode-2-menjalankan-manual-local-development)
  - [4.3 Metode 3: Command Line Interface (CLI Crypt)](#43-metode-3-command-line-interface-cli-crypt)
  - [4.4 Metode 4: Pengujian Analisis Kriptografi CLI (`cmd/analyze`)](#44-metode-4-pengujian-analisis-kriptografi-cli-cmdanalyze)
  - [4.5 Metode 5: Unit Testing & Benchmark](#45-metode-5-unit-testing--benchmark)
- [5. Struktur Direktori](#5-struktur-direktori)
- [Ucapan Terima Kasih](#ucapan-terima-kasih)

---

### Anggota Kelompok

<div align="center" id="contributor">
  <h3>Kelompok 11 (K11)</h3>
  <table>
    <thead>
      <tr align="center">
        <th>Foto</th>
        <th>Nama</th>
        <th>NIM</th>
        <th>Peran & Kontribusi Utama</th>
        <th>GitHub</th>
      </tr>
    </thead>
    <tbody>
      <tr align="center">
        <td>
          <a href="https://github.com/mraifalkautsar">
            <img src="https://avatars.githubusercontent.com/u/96478279?v=4" width="56px" style="border-radius:50%;" alt="Muhammad Raif Al Kautsar" />
          </a>
        </td>
        <td><b>Muhammad Raif Al Kautsar</b></td>
        <td>13523002</td>
        <td align="left">Perancangan arsitektur inti cipher, ekspansi subkunci (key schedule), pengujian performa benchmark, penulisan laporan analisis keamanan LaTeX.</td>
        <td><a href="https://github.com/mraifalkautsar"><b>@mraifalkautsar</b></a></td>
      </tr>
      <tr align="center">
        <td>
          <a href="https://github.com/Kurondt">
            <img src="https://avatars.githubusercontent.com/u/68522463?v=4" width="56px" style="border-radius:50%;" alt="Muhammad Aditya Rahmadeni" />
          </a>
        </td>
        <td><b>Muhammad Aditya Rahmadeni</b></td>
        <td>13523028</td>
        <td align="left">Pengembangan antarmuka Web Neo-Brutalist (React + TypeScript + Tailwind), visualisasi metrik analitik (Avalanche, Entropi, Histogram), arsitektur REST API & routing HTTP, kontainerisasi Docker & CI/CD deployment.</td>
        <td><a href="https://github.com/Kurondt"><b>@Kurondt</b></a></td>
      </tr>
      <tr align="center">
        <td>
          <a href="https://github.com/FityatulhaqRosyidi">
            <img src="https://avatars.githubusercontent.com/u/164185496?v=4" width="56px" style="border-radius:50%;" alt="Fityatulhaq Rosyidi" />
          </a>
        </td>
        <td><b>Fityatulhaq Rosyidi</b></td>
        <td>13523030</td>
        <td align="left">Implementasi transformasi cipher (generasi tabel S-Box dinamis & ShiftRows), utilitas pengujian Command Line Interface (CLI Crypt), integrasi layanan enkripsi/dekripsi, penyusunan dokumentasi dasar teori.</td>
        <td><a href="https://github.com/FityatulhaqRosyidi"><b>@FityatulhaqRosyidi</b></a></td>
      </tr>
    </tbody>
  </table>
</div>

<br>

---

## 1. Nama dan Deskripsi Program

### 1.1 Gambaran Umum
**Brainrot Cipher** (*BRC-128*) adalah sebuah algoritma block cipher simetris eksperimental yang dirancang dengan struktur **Substitution-Permutation Network (SPN)**. Algoritma ini memadukan konsep difusi linear dan konfusi non-linear tingkat tinggi dengan pendekatan modern yang terinspirasi dari standar Advanced Encryption Standard (AES), namun memperkenalkan karakteristik unik berupa pergeseran dinamis serta pembangkitan S-Box berbasis permutasi parsial bertingkat.

Program ini dilengkapi dengan:
1. **Mesin Inti Kriptografi (Go Engine):** Eksekusi enkripsi dan dekripsi deterministik berkecepatan tinggi dengan alokasi memori efisien.
2. **Utilitas CLI:** Alat pengujian instan pada terminal untuk enkripsi, dekripsi teks/berkas, dan batch analysis.
3. **Studio Web Interaktif (Neo-Brutalist UI):** Platform komprehensif untuk pengujian visual, simulasi avalanche effect, pengukuran Shannon entropy, dan visualisasi distribusi histogram byte.

### 1.2 Karakteristik & Parameter Cipher
Berikut adalah spesifikasi teknis dari Brainrot Cipher:

| Parameter | Spesifikasi | Keterangan |
| :--- | :--- | :--- |
| **Struktur Algoritma** | Substitution-Permutation Network (SPN) | Transformasi berbasis substitusi dan permutasi reversibel |
| **Ukuran Blok** | 128 bit (16 byte) | Dipetakan ke dalam matriks state berukuran $4 \times 4$ byte (column-major) |
| **Panjang Kunci Utama** | 128 bit (16 byte) | 32 digit karakter heksadesimal |
| **Jumlah Putaran** | 10 Putaran | 1 putaran whitening awal + 10 putaran inti |
| **Subkunci (Round Keys)** | 21 Subkunci ($Q_0$ s.d. $Q_{20}$) | Dihasilkan melalui prosedur ekspansi kunci (*Key Schedule*) terarah |
| **Dinamika Putaran** | Putaran Ganjil vs. Genap | Putaran ganjil menerapkan 6 operasi, putaran genap menerapkan 7 operasi |
| **SubBytes67** | S-Box Non-Linear Reversibel | Dibangkitkan melalui permutasi dan pergeseran siklik $16 \times 16$ diulang sebanyak 67 kali |
| **ShiftRows67** | Permutasi Baris | Pergeseran siklik horizontal pada baris state untuk difusi byte |
| **MixColumns67** | Difusi Kolom Linear | Perkalian matriks dengan branch-number optimal untuk penyebaran bit vertikal |
| **Padding Standar** | PKCS#7 | Memastikan panjang data kelipatan 16 byte pada mode berbasis blok |

### 1.3 Mode Operasi
Program mendukung lima mode operasi block cipher standar:
1. **ECB (Electronic Codebook):** Memproses setiap blok secara independen. Cocok untuk perbandingan pola deterministik.
2. **CBC (Cipher Block Chaining):** Setiap blok di-XOR dengan ciphertext blok sebelumnya sebelum dienkripsi. Menggunakan Initialization Vector (IV) acak 128-bit untuk mencegah kebocoran pola.
3. **CFB (Cipher Feedback):** Mengubah block cipher menjadi self-synchronizing stream cipher dengan mengenkripsi register feedback.
4. **OFB (Output Feedback):** Membangkitkan synchronous keystream independen dari plaintext melalui enkripsi berulang terhadap IV.
5. **CTR (Counter):** Menghasilkan keystream secara paralel dengan mengenkripsi nilai nonce dan counter yang terus bertambah.

> [!NOTE]  
> Pada mode **CBC, CFB, OFB, dan CTR**, IV sepanjang 16 byte (32 karakter heksadesimal) dibuat secara otomatis secara kriptografis (menggunakan `crypto/rand`) dan diposisikan di awal ciphertext yang dihasilkan.

### 1.4 Visualisasi & Analisis Kriptografi
Antarmuka web menyediakan modul analitik terintegrasi untuk mengevaluasi kualitas sandi secara empiris:
- **Avalanche Effect Benchmark:** Mengukur persentase perubahan bit ciphertext ketika 1 bit plaintext atau 1 bit kunci dibalik (*flipped*). Nilai ideal berada di kisaran ~50% (Strict Avalanche Criterion).
- **Shannon Entropy Gauge:** Mengukur tingkat keacakan keluaran sandi dalam satuan bit/byte (skala 0.00 hingga 8.00 bit/byte, di mana nilai mendekati 8.0 menandakan distribusi pseudorandom yang baik).
- **Byte Frequency Histogram:** Grafik interaktif distribusi frekuensi 256 nilai byte (0x00 - 0xFF) untuk membandingkan perataan frekuensi antara plaintext dan ciphertext.

---

## 2. Teknologi yang Digunakan (Tech Stack)

### 2.1 Backend Engine (`src/`)
- **[Go (Golang) v1.23](https://golang.org/):** Bahasa pemrograman utama berorientasi konkurensi dan performa tinggi untuk mengimplementasikan algoritma cipher, manipulasi bitwise, penghitungan matriks, simulasi statistik, dan HTTP API server.
- **Go Standard Library:** Murni menggunakan modul standar bawaan Go tanpa dependensi pihak ketiga (`net/http`, `crypto/rand`, `encoding/hex`, `encoding/base64`, `math/bits`) guna menjaga portabilitas dan keamanan.
- **Go Modules:** Pengelolaan paket modular melalui `src/go.mod`.

### 2.2 Frontend Studio (`frontend/`)
- **[React 19](https://react.dev/):** Library UI modern untuk rekayasa antarmuka reaktif dan komponen modular.
- **[TypeScript 7](https://www.typescriptlang.org/):** Static typing untuk menjamin konsistensi payload data heksadesimal, base64, dan buffer biner.
- **[Vite 8](https://vitejs.dev/):** Build tool berkecepatan tinggi dengan Hot Module Replacement (HMR).
- **[Tailwind CSS 4](https://tailwindcss.com/):** Framework utility-first yang dikustomisasi dengan estetika **Neo-Brutalist** (kontras tinggi, garis tepi tebal, drop-shadow solid, dan font monospace).
- **[Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/):** Visualisasi histogram distribusi byte dinamis.
- **[Lucide React](https://lucide.dev/):** Set ikon antarmuka bersih dan konsisten.
- **[Axios](https://axios-http.com/):** HTTP client untuk komunikasi asinkronus dengan REST API backend.
- **[Framer Motion](https://www.framer.com/motion/):** Animasi transisi elemen antarmuka yang halus.

### 2.3 Container & Deployment
- **[Docker](https://www.docker.com/):** Multi-stage build terisolasi untuk backend biner Go dan aset statis frontend Nginx.
- **[Docker Compose](https://docs.docker.com/compose/):** Orkestrasi layanan ganda (backend port `8000`, frontend port `8080`) dalam jaringan privat terisolasi (`brainrot-net`).
- **Nginx (Alpine):** Reverse proxy performa tinggi untuk melayani aset web dan meneruskan panggilan `/api` ke backend.
- **Hardened Security Profile:** Menjalankan non-root user (`user: 10001:10001` pada backend, `101:101` pada frontend), sistem berkas `read_only: true`, `cap_drop: ALL`, serta pemanfaatan `tmpfs`.

---

## 3. Dependensi

### 3.1 Menjalankan via Docker (Rekomendasi)
Jika menjalankan program menggunakan kontainer Docker, seluruh dependensi internal akan diinstalasi secara otomatis:
- **Docker Engine:** Versi `24.0.0` atau lebih baru.
- **Docker Compose:** Versi `v2.20.0` atau lebih baru.
- **Web Browser Modern:** Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari.

### 3.2 Menjalankan secara Lokal / Manual
Untuk menjalankan program langsung di lingkungan host pengembang:
- **Go Compiler:** Versi `1.23` atau lebih baru (pastikan perintah `go` telah terdaftar di `PATH`).
- **Node.js:** Versi `v20.x` atau `v22.x` (LTS direkomendasikan).
- **npm:** Versi `10.x` atau lebih baru.
- **Terminal Shell:** Bash/Zsh (Linux/macOS), Windows PowerShell, atau WSL2.

---

## 4. Tata Cara Menjalankan Program

### 4.1 Metode 1: Menggunakan Docker Compose (All-in-One)
Metode ini adalah cara tercepat untuk menjalankan seluruh ekosistem Brainrot Cipher (Frontend Web + Backend REST API) dalam satu langkah:

1. **Clone repository:**
   ```bash
   git clone https://github.com/mraifalkautsar/Tugas2-IF4020-2026-K11.git
   cd Tugas2-IF4020-2026-K11
   ```

2. **Jalankan layanan dengan Docker Compose:**
   ```bash
   # Opsi A: Menggunakan npm script di root
   npm run dev

   # Opsi B: Langsung memanggil docker compose
   docker compose up -d --build
   ```

3. **Buka aplikasi pada peramban:**
   - **Frontend Web Studio:** [http://localhost:8080](http://localhost:8080)
   - **Backend API Health Check:** [http://localhost:8000/healthz](http://localhost:8000/healthz)

4. **Menghentikan layanan:**
   ```bash
   npm run down
   # atau
   docker compose down
   ```

---

### 4.2 Metode 2: Menjalankan Manual (Local Development)
Gunakan metode ini jika Anda ingin mengembangkan atau men-debug kode secara langsung.

#### Langkah A: Jalankan Backend Server
1. Masuk ke direktori `src/`:
   ```bash
   cd src
   ```
2. Jalankan server HTTP:
   ```bash
   go run ./cmd/server
   ```
   *Server backend akan aktif pada port `8000` (`http://localhost:8000`).*

#### Langkah B: Jalankan Frontend Web
1. Buka terminal baru dan masuk ke direktori `frontend/`:
   ```bash
   cd frontend
   ```
2. Pasang dependensi JavaScript:
   ```bash
   npm install
   ```
3. Jalankan server pengembang Vite:
   ```bash
   npm run dev
   ```
   *Buka URL lokal yang muncul pada terminal (biasanya `http://localhost:5173`).*

4. *(Opsional)* Membangun dan menjalankan versi produksi frontend:
   ```bash
   npm run build
   npm run start
   ```
   *Aplikasi versi produksi akan disajikan pada `http://localhost:3000`.*

---

### 4.3 Metode 3: Command Line Interface (CLI Crypt)
Program menyediakan antarmuka CLI mandiri melalui paket `cmd/crypt` untuk melakukan enkripsi dan dekripsi langsung dari terminal.

> [!TIP]  
> Kunci yang dimasukkan harus berupa string heksadesimal 32 karakter (16 byte).

#### Penggunaan pada Linux / macOS / WSL (Bash/Zsh):
```bash
# Tentukan kunci heksadesimal 128-bit
KEY="00112233445566778899aabbccddeeff"

# 1. Enkripsi teks
CIPHERTEXT=$(go -C src run -work ./cmd/crypt -op encrypt -mode CBC -key-hex $KEY -input "Halo Brainrot")
echo "Hasil Ciphertext: $CIPHERTEXT"

# 2. Dekripsi teks
PLAINTEXT=$(go -C src run -work ./cmd/crypt -op decrypt -mode CBC -key-hex $KEY -input "$CIPHERTEXT")
echo "Hasil Plaintext: $PLAINTEXT"
```

#### Penggunaan pada Windows (PowerShell):
```powershell
# Tentukan kunci
$key = "00112233445566778899aabbccddeeff"

# 1. Enkripsi
$ciphertext = go -C src run -work ./cmd/crypt -op encrypt -mode CBC -key-hex $key -input "Halo Brainrot"
$ciphertext

# 2. Dekripsi
go -C src run -work ./cmd/crypt -op decrypt -mode CBC -key-hex $key -input $ciphertext
```

#### Pilihan Mode Operasi:
Ganti opsi `-mode CBC` dengan salah satu mode berikut:
- `-mode ECB`
- `-mode CBC`
- `-mode CFB`
- `-mode OFB`
- `-mode CTR`

---

### 4.4 Metode 4: Pengujian Analisis Kriptografi CLI (`cmd/analyze`)
Program dilengkapi runner evaluasi empiris untuk menganalisis sifat statistik dari Brainrot Cipher:

1. **Menjalankan analisis default (256 trials pada seluruh mode):**
   ```bash
   go -C src run -work ./cmd/analyze
   ```
   Program akan memproses berkas sampel dari `src/testdata/fixtures/`, menghitung metrik difusi, dan menghasilkan laporan terperinci dalam format JSON di `reports/brainrot.json`.

2. **Menjalankan analisis dengan mode dan kunci khusus:**
   ```bash
   go -C src run -work ./cmd/analyze -cipher brainrot -modes CBC -key-hex 00112233445566778899aabbccddeeff
   ```

3. **Menjalankan analisis cepat tanpa menyimpan berkas laporan:**
   ```bash
   go -C src run -work ./cmd/analyze -output=
   ```

---

### 4.5 Metode 5: Unit Testing & Benchmark
Untuk memvalidasi kebenaran matematis transformasi cipher, uji vektor, dan kecepatan pemrosesan:

```bash
# Berpindah ke direktori src
cd src

# 1. Jalankan unit test transformasi dan cipher
go test -v ./cipher/brainrot/

# 2. Jalankan unit test seluruh mode operasi
go test -v ./modes/...

# 3. Jalankan pengujian analisis statistik
go test -v ./tests/...

# 4. Jalankan benchmark performa eksekusi
go test -bench=. ./cipher/brainrot/
```

---

## 5. Struktur Direktori

```plaintext
.
├── .github/                 # Konfigurasi otomasi CI/CD GitHub Actions
├── docker-compose.yml       # Konfigurasi orkestrasi kontainer terisolasi
├── Dockerfile               # Spesifikasi build kontainer
├── docs/                    # Berkas sumber laporan akademik dan LaTeX
│   └── laporan/             # Naskah laporan ilmiah Tugas 2 IF4020
├── frontend/                # Sumber antarmuka Web Neo-Brutalist
│   ├── public/              # Berkas statis & favicon
│   ├── src/
│   │   ├── api/             # HTTP client integrasi REST API backend
│   │   ├── components/      # Komponen antarmuka modular (Studio, Form, Card)
│   │   │   ├── analytics/   # Visualizer Avalanche, Entropy Gauge, Histogram
│   │   │   ├── common/      # Komponen dasar (Button, Modal, Input)
│   │   │   └── main-page/   # Panel konfigurasi cipher & kartu hasil
│   │   ├── pages/           # LandingPage dan MainPage Studio
│   │   └── types/           # Definisi antarmuka TypeScript
│   ├── nginx.conf           # Konfigurasi web server produksi Nginx
│   └── package.json         # Dependensi dan script frontend
├── reports/                 # Output komparasi analisis dan file benchmark JSON
├── scripts/                 # Utilitas skrip demonstrasi dan reporting
├── src/                     # Mesin Kriptografi Go (Backend)
│   ├── analysis/            # Komputasi statistik (Avalanche, entropy, frekuensi)
│   ├── cipher/              # Abstraksi antarmuka block cipher
│   │   └── brainrot/        # Implementasi SPN BRC-128 (S-Box, ShiftRows, MixColumns)
│   ├── cmd/                 # Entry point aplikasi Go
│   │   ├── analyze/         # CLI runner evaluasi keamanan empiris
│   │   ├── crypt/           # CLI utilitas enkripsi & dekripsi langsung
│   │   └── server/          # REST API server HTTP
│   ├── controller/          # Handler endpoint REST API dan validasi request
│   ├── modes/               # Implementasi mode operasi (ECB, CBC, CFB, OFB, CTR)
│   ├── testdata/            # Fixture dan dataset pengujian
│   └── tests/               # Unit testing dan integration testing
└── README.md                # Dokumentasi utama proyek
```

---

## Ucapan Terima Kasih

Ucapan terima kasih disampaikan kepada:
- **Dosen Pengampu Mata Kuliah IF4020 Kriptografi**, atas bimbingan materi, prinsip perancangan block cipher, dan dasar-dasar kriptanalisis modern.
- **Tim Asisten Mata Kuliah IF4020**, atas perumusan spesifikasi tugas, template pengujian, dan arahan selama pengerjaan.
- **Rekan-rekan Mahasiswa Teknik Informatika ITB**, atas diskusi kritis seputar pengujian difusi dan mode operasi block cipher.

<br>

<div align="center">
  <sub>Brainrot Cipher (BRC-128) • IF4020 Kriptografi 2026 • Institut Teknologi Bandung</sub>
</div>
