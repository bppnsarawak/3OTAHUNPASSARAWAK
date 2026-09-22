# Majlis Makan Malam 30 Tahun PAS Sarawak 2026

## Struktur

- index.html
- style.css
- script.js
- Code.gs
- images/logo.png
- images/payment-qr.png

## Setup Google Apps Script

1. Buat Google Spreadsheet.
2. Salin Spreadsheet ID.
3. Buat folder Google Drive untuk RESIT.
4. Buat folder Google Drive untuk PDF A4.
5. Buka Google Apps Script.
6. Masukkan `Code.gs`.
7. Isi:
   - `SPREADSHEET_ID`
   - `RECEIPT_FOLDER_ID`
   - `PDF_FOLDER_ID`
8. Deploy > New deployment > Web app.
9. Execute as: Me.
10. Who has access: Anyone.
11. Salin Web App URL.
12. Masukkan URL tersebut ke `APPS_SCRIPT_URL` dalam `script.js`.
13. Letakkan logo di `images/logo.png`.
14. Letakkan QR pembayaran di `images/payment-qr.png`.
15. Upload fail GitHub Pages.

## Nota

Sistem mengira jumlah di server sekali lagi. Nilai daripada browser tidak digunakan sebagai sumber autoriti.

Bukti pembayaran disimpan ke Google Drive dan status awal ialah `Menunggu Semakan`.

PDF pengesahan dijana dalam A4 menggunakan temporary Google Spreadsheet dan kemudian fail temporary tersebut dipadam.

## Penting

Jangan masukkan Spreadsheet ID atau Folder ID ke dalam fail GitHub. Ia hanya berada dalam `Code.gs`.
