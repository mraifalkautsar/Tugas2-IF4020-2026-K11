# Brainrot Cipher API

Dokumentasi interaktif menggunakan **Swagger UI** dan spesifikasi **OpenAPI 3.0.3**.
Jalankan backend dari root repositori:

```sh
go -C src run ./cmd/server
```

- Swagger UI: [http://localhost:8000/docs/](http://localhost:8000/docs/)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- Sumber spesifikasi: [openapi.json](../src/apidocs/static/openapi.json)

Port dapat diubah dengan `-port 8080` atau variabel lingkungan `PORT`.
Pilih **Try it out**, ubah parameter, lalu **Execute**. Contoh menggunakan
kunci dan IV pengujian yang sama agar hasilnya dapat diulang. Dokumentasi
dan seluruh aset Swagger disertakan dalam executable Go; tidak memerlukan
Node.js, CDN, atau layanan validator eksternal saat digunakan.

## Endpoint

| Metode | Path | Kegunaan |
| --- | --- | --- |
| GET | `/healthz`, `/api/health` | Memeriksa backend; respons `{"status":"ok"}` |
| POST | `/api/cipher/process` | Enkripsi/dekripsi teks JSON atau berkas multipart |
| POST | `/api/cipher/trace` | S-box, 21 subkunci, dan state enkripsi satu blok |
| POST | `/api/cipher/avalanche` | Perubahan satu bit plainteks/kunci pada sepuluh putaran |

API tidak meminta token autentikasi. Batas badan permintaan adalah 32 MiB,
termasuk overhead multipart. Respons API berbentuk JSON.

## Parameter enkripsi/dekripsi

| Parameter | Format dan perilaku |
| --- | --- |
| `action` | `encrypt` atau `decrypt`; default `encrypt` |
| `mode` | `ECB`, `CBC`, `CFB`, `OFB`, atau `CTR`; default `CBC` |
| `key` | Wajib: 16 byte UTF-8 atau 32 karakter hex tanpa awalan `0x` |
| `iv` | 16 byte UTF-8 atau 32 karakter hex; diabaikan oleh ECB |
| `padding` | `PKCS7` (default), `ANSI_X923`, atau `Zero`; hanya digunakan ECB/CBC |
| `payload` | Teks UTF-8 untuk enkripsi JSON; hex/base64 cipherteks untuk dekripsi JSON |
| `data_format` | Field kompatibilitas yang saat ini diabaikan; jenis badan permintaan menentukan teks/berkas |
| `file` | Wajib untuk multipart: byte berkas mentah; menggantikan `payload` |

`action`, `mode`, dan `padding` tidak membedakan huruf besar/kecil. Untuk
kompatibilitas, `action` selain nilai kosong/`encrypt` diperlakukan sebagai
dekripsi; padding yang tidak dikenal diperlakukan sebagai PKCS7.
Gunakan nilai yang didokumentasikan agar maksud permintaan jelas.

Saat dekripsi JSON, backend mencoba `payload` sebagai hex, lalu base64,
lalu byte teks mentah. Gunakan `output_hex` dari hasil enkripsi agar tidak
ambigu. Masukan kosong diperbolehkan: ECB/CBC dengan PKCS7 menghasilkan
satu blok padding, sedangkan CFB/OFB/CTR menghasilkan keluaran kosong.

**Simpan IV, mode, dan padding bersama cipherteks.** Keluaran API hanya
memuat badan cipherteks. Jika IV dikosongkan untuk mode selain ECB,
backend menghasilkan IV acak tetapi belum mengembalikannya; selalu
isi IV eksplisit agar dekripsi dapat mengembalikan data semula. Gunakan
IV baru yang tidak dapat diprediksi untuk CBC/CFB dan IV/blok pencacah
unik untuk OFB/CTR pada pesan berbeda dengan kunci yang sama. IV dalam
contoh berikut hanya untuk pengujian.

## Contoh teks

Contoh `curl` berikut menggunakan sintaks Bash. Enkripsi:

```sh
curl http://localhost:8000/api/cipher/process \
  -H 'Content-Type: application/json' \
  -d '{"action":"encrypt","mode":"CBC","key":"00112233445566778899aabbccddeeff","iv":"000102030405060708090a0b0c0d0e0f","padding":"PKCS7","payload":"Halo Brainrot"}'
```

Respons memuat `status`, `output_hex`, `output_base64`, `entropy`, dan
`elapsed_ms`. Dua field keluaran merepresentasikan byte yang sama.
`entropy` adalah entropi empiris keluaran dalam bit/byte; `elapsed_ms`
adalah waktu pemrosesan yang berubah tiap permintaan. Untuk contoh ini,
`output_hex` adalah `5bfb0e4535dad1b36014799ee71488eb`.

Dekripsi dengan kunci, IV, mode, dan padding yang sama:

```sh
curl http://localhost:8000/api/cipher/process \
  -H 'Content-Type: application/json' \
  -d '{"action":"decrypt","mode":"CBC","key":"00112233445566778899aabbccddeeff","iv":"000102030405060708090a0b0c0d0e0f","padding":"PKCS7","payload":"5bfb0e4535dad1b36014799ee71488eb"}'
```

Hex hasil dekripsi adalah `48616c6f20427261696e726f74`, yaitu `Halo Brainrot`.

## Contoh berkas biner

Unggah berkas menggunakan multipart; biarkan `curl` menetapkan header
`Content-Type` beserta boundary. Enkripsi dan simpan respons JSON:

```sh
curl http://localhost:8000/api/cipher/process \
  -F action=encrypt -F mode=CBC -F padding=PKCS7 \
  -F key=00112233445566778899aabbccddeeff \
  -F iv=000102030405060708090a0b0c0d0e0f \
  -F file=@src/testdata/fixtures/byte-pattern.bin \
  -o encrypted.json
python3 -c 'import base64,json,pathlib; r=json.load(open("encrypted.json")); pathlib.Path("encrypted.bin").write_bytes(base64.b64decode(r["output_base64"]))'
```

Untuk dekripsi, unggah byte cipherteks hasil decoding, bukan JSON:

```sh
curl http://localhost:8000/api/cipher/process \
  -F action=decrypt -F mode=CBC -F padding=PKCS7 \
  -F key=00112233445566778899aabbccddeeff \
  -F iv=000102030405060708090a0b0c0d0e0f \
  -F file=@encrypted.bin -o recovered.json
python3 -c 'import base64,json,pathlib; r=json.load(open("recovered.json")); pathlib.Path("recovered.bin").write_bytes(base64.b64decode(r["output_base64"]))'
cmp src/testdata/fixtures/byte-pattern.bin recovered.bin
```

`cmp` tidak mengeluarkan pesan jika berkas identik. Zero padding dapat
menghilangkan byte nol asli pada akhir berkas; gunakan PKCS7 untuk ECB/CBC.
CFB, OFB, dan CTR tidak menambahkan padding.

## Trace dan avalanche

Kedua endpoint menerima tepat satu blok 16 byte, tanpa IV, mode, atau padding:

```sh
curl http://localhost:8000/api/cipher/trace \
  -H 'Content-Type: application/json' \
  -d '{"key_hex":"00112233445566778899aabbccddeeff","block_hex":"456d6261726b206174206461776e210a"}'
curl http://localhost:8000/api/cipher/avalanche \
  -H 'Content-Type: application/json' \
  -d '{"target":"plaintext","key_hex":"00112233445566778899aabbccddeeff","block_hex":"456d6261726b206174206461776e210a","flip_bit_index":0}'
```

Trace mengembalikan `sbox` (16×16), `round_keys` (21 matriks 4×4), dan
`rounds` (10 putaran). Setiap putaran memuat `start_state`, `after_sub_bytes`,
`after_shift_rows`, `after_mix_columns`, dan `after_add_round_key`.
Matriks memakai bilangan desimal 0–255; byte ke-i berada pada baris `i % 4`,
kolom `i / 4` dengan pembagian bulat. State BPT, FCM, dan penjumlahan
tidak ditampilkan terpisah, tetapi efeknya tercakup pada `after_add_round_key`.
Field `action` pada trace diabaikan; endpoint selalu menelusuri enkripsi.

Avalanche memakai `target=plaintext` atau `key`. `flip_bit_index` berada
pada 0–127: bit 0 adalah MSB byte pertama. Respons memuat dua cipherteks,
`flipped_bit`, `round_progression`, dan `total_avalanche_percentage`, yaitu
persentase perubahan pada putaran terakhir. Ini satu percobaan bit-flip,
bukan rata-rata pengujian statistik CLI atau bukti keamanan cipher.

## Kesalahan dan batas integritas

HTTP 400 mencakup JSON tidak valid, ukuran kunci/IV/blok yang salah, mode
tidak dikenal, padding/cipherteks yang tidak valid, indeks bit di luar
rentang, dan kegagalan upload. Contoh:

```json
{"status":"error","message":"invalid key: must be 16 bytes or 32 hex characters"}
```

HTTP 500 pada pemrosesan berarti pembangkitan IV acak gagal. Metode HTTP
yang tidak sesuai menghasilkan 405 dari router, dan path tidak dikenal
menghasilkan 404; respons router tersebut bukan JSON API.

Cipher ini untuk pembelajaran. Belum ada MAC/tag autentikasi pada hasil;
respons sukses dan padding valid tidak menjamin cipherteks belum diubah.

## Publikasi dokumentasi bonus

Folder [src/apidocs/static](../src/apidocs/static/) siap diunggah ke hosting
statis, termasuk GitHub Pages, tanpa proses build tambahan. Semua tautan
aset dan spesifikasi relatif terhadap `index.html`. Saat dibuka terpisah
dari backend, pilih server **Alternate backend / standalone documentation**
dan isi `apiOrigin`; halaman HTTPS memerlukan backend HTTPS untuk mencoba
permintaan dari browser. Dokumentasi tetap dapat dibaca tanpa backend aktif.

Setelah dipublikasikan, cantumkan URL Swagger UI publik pada README dan
lampiran laporan. URL `localhost` hanya untuk menjalankan dokumentasi lokal.

Spesifikasi ditulis langsung agar mengikuti perilaku controller, bukan
dibangkitkan dari anotasi. Perbarui spesifikasi saat kontrak API berubah.
Pengujian server memeriksa URL dokumentasi, contoh JSON, respons contoh
CBC, dan pemulihan upload biner:

```sh
go -C src test ./cmd/server
```
