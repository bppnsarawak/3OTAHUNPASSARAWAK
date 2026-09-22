/*******************************************************
 * MAJLIS MAKAN MALAM 30 TAHUN PAS SARAWAK 2026
 * TABUNG PILIHANRAYA PAS SARAWAK
 *
 * BACKEND: Google Apps Script
 *
 * 1. Buat Google Spreadsheet.
 * 2. Buat 2 folder Google Drive:
 *    - RECEIPT_FOLDER
 *    - PDF_FOLDER
 * 3. Isi ID dalam CONFIG di bawah.
 * 4. Deploy sebagai Web App:
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Salin URL Web App ke script.js.
 *******************************************************/

const CONFIG = {
  SPREADSHEET_ID: "PASTE_GOOGLE_SHEET_ID_HERE",
  SHEET_NAME: "Pendaftaran",

  RECEIPT_FOLDER_ID: "PASTE_RECEIPT_FOLDER_ID_HERE",
  PDF_FOLDER_ID: "PASTE_PDF_FOLDER_ID_HERE",

  TABLE_PRICE: 2000,
  CHAIR_PRICE: 200,

  MAX_FILE_BYTES: 5 * 1024 * 1024,

  EVENT_TITLE: "MAJLIS MAKAN MALAM 30 TAHUN PAS SARAWAK 2026",
  EVENT_SUBTITLE: "TABUNG PILIHANRAYA PAS SARAWAK"
};


/**
 * GET = health check.
 */
function doGet() {
  return HtmlService
    .createHtmlOutput(
      "<h3>Majlis Makan Malam 30 Tahun PAS Sarawak 2026</h3>" +
      "<p>Google Apps Script backend aktif.</p>"
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * POST menerima data daripada GitHub Pages.
 */
function doPost(e) {
  let result = {
    type: "MMS30_RESULT",
    ok: false,
    message: "Ralat tidak diketahui."
  };

  try {
    validateConfig_();

    if (!e || !e.parameter) {
      throw new Error("Data borang tidak diterima.");
    }

    const p = e.parameter;

    const data = {
      nama: clean_(p.nama),
      telefon: clean_(p.telefon),
      status: clean_(p.status),
      jawatan: clean_(p.jawatan),
      bilanganMeja: positiveInt_(p.bilanganMeja),
      bilanganKerusi: positiveInt_(p.bilanganKerusi),
      jenisKehadiran: clean_(p.jenisKehadiran),
      jumlahHadir: positiveInt_(p.jumlahHadir),
      jumlahInfaqHadir: positiveInt_(p.jumlahInfaqHadir),
      fileName: clean_(p.fileName),
      fileType: clean_(p.fileType),
      fileBase64: p.fileBase64 || "",
      parentOrigin: clean_(p.parentOrigin)
    };

    validateData_(data);

    // Kira semula di server. Jangan percaya clientTotal.
    const total =
      data.bilanganMeja * CONFIG.TABLE_PRICE +
      data.bilanganKerusi * CONFIG.CHAIR_PRICE;

    if (total <= 0) {
      throw new Error("Jumlah sumbangan mestilah lebih daripada RM0.");
    }

    // Elak dua pengguna mendapat nombor rujukan yang sama.
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    let ref;
    try {
      ref = generateReference_();
      saveRegistration_(data, total, ref);
    } finally {
      lock.releaseLock();
    }

    const receiptFile = saveReceipt_(data, ref);
    const pdfFile = createA4Pdf_(data, total, ref);

    updateFileLinks_(ref, receiptFile.getUrl(), pdfFile.getUrl());

    result = {
      type: "MMS30_RESULT",
      ok: true,
      reference: ref,
      total: total,
      pdfUrl: pdfFile.getUrl()
    };

  } catch (err) {
    result = {
      type: "MMS30_RESULT",
      ok: false,
      message: err && err.message ? err.message : String(err)
    };
  }

  return responseHtml_(result);
}


/**
 * Semak konfigurasi.
 */
function validateConfig_() {
  const bad = [
    CONFIG.SPREADSHEET_ID,
    CONFIG.RECEIPT_FOLDER_ID,
    CONFIG.PDF_FOLDER_ID
  ].some(v => !v || String(v).indexOf("PASTE_") === 0);

  if (bad) {
    throw new Error("CONFIG Code.gs belum lengkap. Sila isi Spreadsheet ID dan Folder ID.");
  }
}


/**
 * Validasi data.
 */
function validateData_(d) {
  if (!d.nama) throw new Error("Nama wajib diisi.");
  if (!d.telefon) throw new Error("No. telefon wajib diisi.");
  if (!d.status) throw new Error("Status wajib dipilih.");

  if (d.status === "Jawatan / Organisasi" && !d.jawatan) {
    throw new Error("Sila isi jawatan / organisasi.");
  }

  if (d.bilanganMeja === 0 && d.bilanganKerusi === 0) {
    throw new Error("Sila pilih sekurang-kurangnya satu meja atau kerusi.");
  }

  if (!d.jenisKehadiran) {
    throw new Error("Jenis kehadiran wajib dipilih.");
  }

  if ((d.jumlahHadir + d.jumlahInfaqHadir) === 0) {
    throw new Error("Sila masukkan jumlah kehadiran.");
  }

  if (!d.fileBase64) {
    throw new Error("Bukti pembayaran tidak diterima.");
  }

  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (allowed.indexOf(d.fileType) === -1) {
    throw new Error("Format bukti pembayaran tidak dibenarkan.");
  }
}


/**
 * Simpan data ke Google Sheets.
 */
function saveRegistration_(d, total, ref) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  ensureHeaders_(sheet);

  sheet.appendRow([
    new Date(),
    ref,
    d.nama,
    d.telefon,
    d.status,
    d.jawatan,
    d.bilanganMeja,
    d.bilanganKerusi,
    d.jenisKehadiran,
    d.jumlahHadir,
    d.jumlahInfaqHadir,
    d.bilanganMeja * CONFIG.TABLE_PRICE,
    d.bilanganKerusi * CONFIG.CHAIR_PRICE,
    total,
    "Menunggu Semakan",
    "",
    "",
    "",
    ""
  ]);
}


/**
 * Header Sheet.
 */
function ensureHeaders_(sheet) {
  const headers = [
    "Timestamp",
    "No. Rujukan",
    "Nama",
    "No. Telefon",
    "Status",
    "Jawatan / Organisasi",
    "Bilangan Meja",
    "Bilangan Kerusi",
    "Jenis Kehadiran",
    "Jumlah Hadir",
    "Jumlah Infaq Untuk Orang Lain",
    "Jumlah Meja (RM)",
    "Jumlah Kerusi (RM)",
    "Jumlah Dipersetujui (RM)",
    "Status Pembayaran",
    "Nama Fail Resit",
    "URL Resit",
    "URL PDF A4",
    "Tarikh Proses"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}


/**
 * Jana nombor rujukan.
 */
function generateReference_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  ensureHeaders_(sheet);

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return "MMS30-2026-0001";
  }

  const values = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .getValues()
    .flat();

  let max = 0;

  values.forEach(v => {
    const match = String(v).match(/MMS30-2026-(\d+)/);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  });

  return "MMS30-2026-" + String(max + 1).padStart(4, "0");
}


/**
 * Simpan resit ke Drive.
 */
function saveReceipt_(d, ref) {
  const bytes = Utilities.base64Decode(d.fileBase64);

  if (bytes.length > CONFIG.MAX_FILE_BYTES) {
    throw new Error("Saiz fail melebihi had 5MB.");
  }

  const folder = DriveApp.getFolderById(CONFIG.RECEIPT_FOLDER_ID);

  const safeName = sanitizeFileName_(d.nama);
  const ext = extensionFromMime_(d.fileType);

  const fileName =
    ref + " - " + safeName + " - Resit" + ext;

  const blob = Utilities.newBlob(
    bytes,
    d.fileType,
    fileName
  );

  return folder.createFile(blob);
}


/**
 * Jana PDF A4 menggunakan temporary Google Spreadsheet.
 */
function createA4Pdf_(d, total, ref) {
  const temp = SpreadsheetApp.create("TEMP - " + ref);

  try {
    const sheet = temp.getSheets()[0];
    sheet.setName("Pengesahan");

    buildPdfSheet_(sheet, d, total, ref);

    SpreadsheetApp.flush();
    Utilities.sleep(1200);

    const pdfBlob = exportSheetAsPdf_(temp.getId(), sheet.getSheetId());

    const folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);

    const pdfName =
      ref + " - " + sanitizeFileName_(d.nama) + ".pdf";

    return folder.createFile(
      pdfBlob.setName(pdfName)
    );

  } finally {
    DriveApp.getFileById(temp.getId()).setTrashed(true);
  }
}


/**
 * Format helaian PDF.
 */
function buildPdfSheet_(sheet, d, total, ref) {
  const rows = [
    [CONFIG.EVENT_TITLE],
    [CONFIG.EVENT_SUBTITLE],
    ["BORANG PENYERTAAN & PENGESAHAN SUMBANGAN"],
    [""],
    ["NO. RUJUKAN", ref],
    ["NAMA", d.nama],
    ["NO. TELEFON", d.telefon],
    ["STATUS", d.status],
    ["JAWATAN / ORGANISASI", d.jawatan || "-"],
    [""],
    ["BUTIRAN SUMBANGAN", ""],
    ["BILANGAN MEJA", d.bilanganMeja + " × RM2,000"],
    ["BILANGAN KERUSI", d.bilanganKerusi + " × RM200"],
    ["JUMLAH KEHADIRAN", String(d.jumlahHadir) + " orang"],
    ["INFAQ UNTUK ORANG LAIN", String(d.jumlahInfaqHadir) + " orang"],
    ["JUMLAH DIPERSETUJUI", "RM" + formatMoney_(total)],
    [""],
    ["STATUS PEMBAYARAN", "Menunggu Semakan"],
    ["TARIKH PENDAFTARAN", formatDate_(new Date())],
    [""],
    ["PENGESAHAN"],
    ["Terima kasih atas penyertaan dan sumbangan yang diberikan."],
    ["Dokumen ini dijana secara automatik oleh sistem pendaftaran."],
    [""],
    ["No. Rujukan", ref]
  ];

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);

  sheet.setColumnWidth(1, 210);
  sheet.setColumnWidth(2, 330);

  sheet.getRange("A1:B1")
    .merge()
    .setFontSize(16)
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  sheet.getRange("A2:B2")
    .merge()
    .setFontSize(12)
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  sheet.getRange("A3:B3")
    .merge()
    .setFontSize(11)
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  sheet.getRange("A11:B11")
    .setFontWeight("bold");

  sheet.getRange("A16:B16")
    .setFontWeight("bold")
    .setFontSize(14);

  sheet.getRange("A21:B21")
    .setFontWeight("bold");

  sheet.getRange(1, 1, rows.length, 2)
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.getRange(5, 1, rows.length - 4, 1)
    .setFontWeight("bold");

  sheet.getRange(1, 1, rows.length, 2)
    .setBorder(true, true, true, true, true, true);

  sheet.setRowHeight(1, 30);
  sheet.setRowHeight(2, 24);
  sheet.setRowHeight(3, 24);

  for (let r = 1; r <= rows.length; r++) {
    if (r !== 1 && r !== 2 && r !== 3) {
      sheet.setRowHeight(r, 23);
    }
  }

  // Print settings helper cell content is intentionally not used.
}


/**
 * Export Sheet sebagai PDF A4.
 */
function exportSheetAsPdf_(spreadsheetId, sheetId) {
  const token = ScriptApp.getOAuthToken();

  const url =
    "https://docs.google.com/spreadsheets/d/" +
    spreadsheetId +
    "/export?format=pdf" +
    "&gid=" + sheetId +
    "&size=A4" +
    "&portrait=true" +
    "&fitw=true" +
    "&sheetnames=false" +
    "&printtitle=false" +
    "&pagenumbers=false" +
    "&gridlines=false" +
    "&fzr=false" +
    "&top_margin=0.30" +
    "&bottom_margin=0.30" +
    "&left_margin=0.30" +
    "&right_margin=0.30";

  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: "Bearer " + token
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();

  if (code !== 200) {
    throw new Error(
      "PDF gagal dijana. HTTP " + code
    );
  }

  return response.getBlob().setContentType("application/pdf");
}


/**
 * Update URL fail pada row berdasarkan reference.
 */
function updateFileLinks_(ref, receiptUrl, pdfUrl) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  const refs = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .getValues();

  for (let i = 0; i < refs.length; i++) {
    if (String(refs[i][0]) === ref) {
      const row = i + 2;

      sheet.getRange(row, 16).setValue(
        DriveApp.getFileById(
          extractDriveId_(receiptUrl)
        ).getName()
      );

      sheet.getRange(row, 17).setValue(receiptUrl);
      sheet.getRange(row, 18).setValue(pdfUrl);
      sheet.getRange(row, 19).setValue(new Date());

      break;
    }
  }
}


/**
 * Dapatkan file ID daripada Drive URL.
 */
function extractDriveId_(url) {
  const match = String(url).match(/[-\w]{25,}/);

  if (!match) {
    throw new Error("ID fail Drive tidak dapat dikenal pasti.");
  }

  return match[0];
}


/**
 * Response HTML yang menghantar postMessage
 * kembali ke GitHub parent window.
 */
function responseHtml_(result) {
  const json = JSON.stringify(result)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return HtmlService
    .createHtmlOutput(
      "<!doctype html><html><body>" +
      "<script>" +
      "window.parent.postMessage(" +
      json +
      ", '*');" +
      "</script>" +
      "<p>Proses selesai. Anda boleh kembali ke laman pendaftaran.</p>" +
      "</body></html>"
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Helpers.
 */
function clean_(value) {
  return String(value || "").trim().slice(0, 500);
}

function positiveInt_(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sanitizeFileName_(name) {
  return String(name || "Penyumbang")
    .replace(/[\\\/:*?"<>|#%]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function extensionFromMime_(mime) {
  const map = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png"
  };
  return map[mime] || "";
}

function formatMoney_(value) {
  return Number(value || 0).toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm"
  );
}
