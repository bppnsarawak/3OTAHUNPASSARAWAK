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

/* =========================================================
   MAJLIS MAKAN MALAM 30 TAHUN PAS SARAWAK 2026
   GOOGLE APPS SCRIPT BACKEND
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {

  // Google Spreadsheet
  SPREADSHEET_ID:
    "1l8YpXmc-UuK6HOtSlqP4hq06QyD9SBf_c2k9Jm_eJjs",

  SHEET_NAME:
    "Pendaftaran",


  // Google Drive - Folder Simpan Resit
  RECEIPT_FOLDER_ID:
    "1_ca2ekCbPvlv7WHWPUcQOahTsCtoPM6M",


  // Google Drive - Folder Simpan PDF
  PDF_FOLDER_ID:
    "1-fVeDhKRsMyzw-P3Zouk3wRp-JM4kzE2",


  // Harga
  TABLE_PRICE:
    2000,

  CHAIR_PRICE:
    200,


  // Saiz maksimum fail
  MAX_FILE_BYTES:
    5 * 1024 * 1024,


  // Maklumat program
  EVENT_TITLE:
    "MAJLIS MAKAN MALAM 30 TAHUN PAS SARAWAK 2026",

  EVENT_SUBTITLE:
    "TABUNG PILIHANRAYA PAS SARAWAK"

};


/* =========================================================
   GET
   Digunakan untuk test URL Apps Script
========================================================= */

function doGet() {

  return HtmlService
    .createHtmlOutput(
      "<!doctype html>" +
      "<html>" +
      "<head>" +
      "<meta charset='UTF-8'>" +
      "<title>MMS30 Backend</title>" +
      "</head>" +
      "<body style='font-family:Arial,sans-serif;padding:30px'>" +

      "<h2>Majlis Makan Malam 30 Tahun PAS Sarawak 2026</h2>" +

      "<p style='color:green;font-weight:bold'>" +
      "Google Apps Script backend aktif." +
      "</p>" +

      "<p>Endpoint sedia menerima data pendaftaran.</p>" +

      "</body>" +
      "</html>"
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/* =========================================================
   POST
   Terima data daripada GitHub Pages
========================================================= */

function doPost(e) {

  let result = {

    type:
      "MMS30_RESULT",

    ok:
      false,

    message:
      "Ralat tidak diketahui."

  };


  try {

    validateConfig_();


    if (!e || !e.parameter) {

      throw new Error(
        "Data borang tidak diterima."
      );

    }


    const p =
      e.parameter;


    /* -----------------------------------------------------
       Ambil data
    ----------------------------------------------------- */

    const data = {

      nama:
        clean_(p.nama),

      telefon:
        clean_(p.telefon),

      status:
        clean_(p.status),

      jawatan:
        clean_(p.jawatan),

      bilanganMeja:
        positiveInt_(p.bilanganMeja),

      bilanganKerusi:
        positiveInt_(p.bilanganKerusi),

      jenisKehadiran:
        clean_(p.jenisKehadiran),

      jumlahHadir:
        positiveInt_(p.jumlahHadir),

      jumlahInfaqHadir:
        positiveInt_(p.jumlahInfaqHadir),

      fileName:
        clean_(p.fileName),

      fileType:
        clean_(p.fileType),

      fileBase64:
        p.fileBase64 || "",

      parentOrigin:
        clean_(p.parentOrigin)

    };


    /* -----------------------------------------------------
       Validasi
    ----------------------------------------------------- */

    validateData_(
      data
    );


    /* -----------------------------------------------------
       Kira jumlah di SERVER
       Jangan percaya jumlah daripada browser
    ----------------------------------------------------- */

    const total =
      (
        data.bilanganMeja *
        CONFIG.TABLE_PRICE
      ) +
      (
        data.bilanganKerusi *
        CONFIG.CHAIR_PRICE
      );


    if (total <= 0) {

      throw new Error(
        "Jumlah sumbangan mestilah lebih daripada RM0."
      );

    }


    /* -----------------------------------------------------
       LOCK
       Elakkan nombor rujukan bertindih
    ----------------------------------------------------- */

    const lock =
      LockService.getScriptLock();


    lock.waitLock(
      30000
    );


    let ref;


    try {

      ref =
        generateReference_();


      saveRegistration_(
        data,
        total,
        ref
      );

    } finally {

      lock.releaseLock();

    }


    /* -----------------------------------------------------
       Simpan resit
    ----------------------------------------------------- */

    const receiptFile =
      saveReceipt_(
        data,
        ref
      );


    /* -----------------------------------------------------
       Jana PDF
    ----------------------------------------------------- */

    const pdfFile =
      createA4Pdf_(
        data,
        total,
        ref
      );


    /* -----------------------------------------------------
       Update link dalam Sheet
    ----------------------------------------------------- */

    updateFileLinks_(
      ref,
      receiptFile.getUrl(),
      pdfFile.getUrl()
    );


    /* -----------------------------------------------------
       BERJAYA
    ----------------------------------------------------- */

    result = {

      type:
        "MMS30_RESULT",

      ok:
        true,

      reference:
        ref,

      total:
        total,

      pdfUrl:
        pdfFile.getUrl()

    };


  } catch (err) {

    console.error(
      err
    );


    result = {

      type:
        "MMS30_RESULT",

      ok:
        false,

      message:
        err &&
        err.message
          ? err.message
          : String(err)

    };

  }


  return responseHtml_(
    result
  );

}


/* =========================================================
   VALIDATE CONFIG
========================================================= */

function validateConfig_() {

  const values = [

    CONFIG.SPREADSHEET_ID,

    CONFIG.RECEIPT_FOLDER_ID,

    CONFIG.PDF_FOLDER_ID

  ];


  const invalid =
    values.some(function(value) {

      return (
        !value ||
        String(value)
          .indexOf("PASTE_") === 0
      );

    });


  if (invalid) {

    throw new Error(
      "CONFIG Code.gs belum lengkap. Sila semak Spreadsheet ID dan Folder ID."
    );

  }

}


/* =========================================================
   VALIDATE DATA
========================================================= */

function validateData_(d) {

  if (!d.nama) {

    throw new Error(
      "Nama wajib diisi."
    );

  }


  if (!d.telefon) {

    throw new Error(
      "No. telefon wajib diisi."
    );

  }


  if (!d.status) {

    throw new Error(
      "Status wajib dipilih."
    );

  }


  if (
    d.status ===
      "Jawatan / Organisasi" &&
    !d.jawatan
  ) {

    throw new Error(
      "Sila isi jawatan / organisasi."
    );

  }


  if (
    d.bilanganMeja === 0 &&
    d.bilanganKerusi === 0
  ) {

    throw new Error(
      "Sila pilih sekurang-kurangnya satu meja atau kerusi."
    );

  }


  if (!d.jenisKehadiran) {

    throw new Error(
      "Jenis kehadiran wajib dipilih."
    );

  }


  if (
    (
      d.jumlahHadir +
      d.jumlahInfaqHadir
    ) === 0
  ) {

    throw new Error(
      "Sila masukkan jumlah kehadiran."
    );

  }


  if (!d.fileBase64) {

    throw new Error(
      "Bukti pembayaran tidak diterima."
    );

  }


  const allowedTypes = [

    "application/pdf",

    "image/jpeg",

    "image/png"

  ];


  if (
    allowedTypes.indexOf(
      d.fileType
    ) === -1
  ) {

    throw new Error(
      "Format bukti pembayaran tidak dibenarkan."
    );

  }

}


/* =========================================================
   SAVE REGISTRATION
========================================================= */

function saveRegistration_(
  d,
  total,
  ref
) {

  const ss =
    SpreadsheetApp.openById(
      CONFIG.SPREADSHEET_ID
    );


  let sheet =
    ss.getSheetByName(
      CONFIG.SHEET_NAME
    );


  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEET_NAME
      );

  }


  ensureHeaders_(
    sheet
  );


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

    d.bilanganMeja *
      CONFIG.TABLE_PRICE,

    d.bilanganKerusi *
      CONFIG.CHAIR_PRICE,

    total,

    "Menunggu Semakan",

    "",

    "",

    "",

    new Date()

  ]);

}


/* =========================================================
   ENSURE SHEET HEADERS
========================================================= */

function ensureHeaders_(
  sheet
) {

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


  if (
    sheet.getLastRow() === 0
  ) {

    sheet.appendRow(
      headers
    );


    sheet.setFrozenRows(
      1
    );


    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setFontWeight(
        "bold"
      );

  }

}


/* =========================================================
   GENERATE REFERENCE NUMBER
========================================================= */

function generateReference_() {

  const ss =
    SpreadsheetApp.openById(
      CONFIG.SPREADSHEET_ID
    );


  let sheet =
    ss.getSheetByName(
      CONFIG.SHEET_NAME
    );


  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.SHEET_NAME
      );

  }


  ensureHeaders_(
    sheet
  );


  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {

    return "MMS30-2026-0001";

  }


  const values =
    sheet
      .getRange(
        2,
        2,
        lastRow - 1,
        1
      )
      .getValues()
      .flat();


  let max =
    0;


  values.forEach(
    function(value) {

      const match =
        String(value).match(
          /MMS30-2026-(\d+)/
        );


      if (match) {

        max =
          Math.max(
            max,
            Number(
              match[1]
            )
          );

      }

    }
  );


  return (
    "MMS30-2026-" +
    String(
      max + 1
    ).padStart(
      4,
      "0"
    )
  );

}


/* =========================================================
   SAVE RECEIPT TO GOOGLE DRIVE
========================================================= */

function saveReceipt_(
  d,
  ref
) {

  const bytes =
    Utilities.base64Decode(
      d.fileBase64
    );


  if (
    bytes.length >
    CONFIG.MAX_FILE_BYTES
  ) {

    throw new Error(
      "Saiz fail melebihi had 5MB."
    );

  }


  const folder =
    DriveApp.getFolderById(
      CONFIG.RECEIPT_FOLDER_ID
    );


  const safeName =
    sanitizeFileName_(
      d.nama
    );


  const extension =
    extensionFromMime_(
      d.fileType
    );


  const fileName =
    ref +
    " - " +
    safeName +
    " - Resit" +
    extension;


  const blob =
    Utilities.newBlob(
      bytes,
      d.fileType,
      fileName
    );


  return folder.createFile(
    blob
  );

}


/* =========================================================
   CREATE PDF
========================================================= */

function createA4Pdf_(
  d,
  total,
  ref
) {

  const temp =
    SpreadsheetApp.create(
      "TEMP - " + ref
    );


  try {

    const sheet =
      temp.getSheets()[0];


    sheet.setName(
      "Pengesahan"
    );


    buildPdfSheet_(
      sheet,
      d,
      total,
      ref
    );


    SpreadsheetApp.flush();


    Utilities.sleep(
      1500
    );


    const pdfBlob =
      exportSheetAsPdf_(
        temp.getId(),
        sheet.getSheetId()
      );


    const folder =
      DriveApp.getFolderById(
        CONFIG.PDF_FOLDER_ID
      );


    const pdfName =
      ref +
      " - " +
      sanitizeFileName_(
        d.nama
      ) +
      ".pdf";


    return folder.createFile(
      pdfBlob.setName(
        pdfName
      )
    );


  } finally {

    DriveApp
      .getFileById(
        temp.getId()
      )
      .setTrashed(
        true
      );

  }

}


/* =========================================================
   BUILD PDF SHEET
========================================================= */

function buildPdfSheet_(
  sheet,
  d,
  total,
  ref
) {

  const rows = [

    [
      CONFIG.EVENT_TITLE
    ],

    [
      CONFIG.EVENT_SUBTITLE
    ],

    [
      "BORANG PENYERTAAN & PENGESAHAN SUMBANGAN"
    ],

    [""],

    [
      "NO. RUJUKAN",
      ref
    ],

    [
      "NAMA",
      d.nama
    ],

    [
      "NO. TELEFON",
      d.telefon
    ],

    [
      "STATUS",
      d.status
    ],

    [
      "JAWATAN / ORGANISASI",
      d.jawatan || "-"
    ],

    [""],

    [
      "BUTIRAN SUMBANGAN",
      ""
    ],

    [
      "BILANGAN MEJA",
      d.bilanganMeja +
        " × RM2,000"
    ],

    [
      "BILANGAN KERUSI",
      d.bilanganKerusi +
        " × RM200"
    ],

    [
      "JUMLAH KEHADIRAN",
      String(
        d.jumlahHadir +
        d.jumlahInfaqHadir
      ) +
        " orang"
    ],

    [
      "INFAQ UNTUK ORANG LAIN",
      String(
        d.jumlahInfaqHadir
      ) +
        " orang"
    ],

    [
      "JUMLAH DIPERSETUJUI",
      "RM" +
        formatMoney_(
          total
        )
    ],

    [""],

    [
      "STATUS PEMBAYARAN",
      "Menunggu Semakan"
    ],

    [
      "TARIKH PENDAFTARAN",
      formatDate_(
        new Date()
      )
    ],

    [""],

    [
      "PENGESAHAN"
    ],

    [
      "Terima kasih atas penyertaan dan sumbangan yang diberikan."
    ],

    [
      "Dokumen ini dijana secara automatik oleh sistem pendaftaran."
    ],

    [""],

    [
      "No. Rujukan",
      ref
    ]

  ];


  sheet
    .getRange(
      1,
      1,
      rows.length,
      2
    )
    .setValues(
      rows
    );


  sheet.setColumnWidth(
    1,
    210
  );


  sheet.setColumnWidth(
    2,
    330
  );


  // Tajuk

  sheet
    .getRange("A1:B1")
    .merge()
    .setFontSize(16)
    .setFontWeight("bold")
    .setHorizontalAlignment(
      "center"
    );


  sheet
    .getRange("A2:B2")
    .merge()
    .setFontSize(12)
    .setFontWeight("bold")
    .setHorizontalAlignment(
      "center"
    );


  sheet
    .getRange("A3:B3")
    .merge()
    .setFontSize(11)
    .setFontWeight("bold")
    .setHorizontalAlignment(
      "center"
    );


  // Heading

  sheet
    .getRange("A11:B11")
    .setFontWeight(
      "bold"
    );


  sheet
    .getRange("A21:B21")
    .setFontWeight(
      "bold"
    );


  // Jumlah

  sheet
    .getRange("A16:B16")
    .setFontWeight(
      "bold"
    )
    .setFontSize(14);


  // Format umum

  sheet
    .getRange(
      1,
      1,
      rows.length,
      2
    )
    .setVerticalAlignment(
      "middle"
    )
    .setWrap(
      true
    );


  sheet
    .getRange(
      5,
      1,
      rows.length - 4,
      1
    )
    .setFontWeight(
      "bold"
    );


  sheet
    .getRange(
      1,
      1,
      rows.length,
      2
    )
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true
    );


  sheet.setRowHeight(
    1,
    30
  );


  sheet.setRowHeight(
    2,
    24
  );


  sheet.setRowHeight(
    3,
    24
  );


  for (
    let r = 1;
    r <= rows.length;
    r++
  ) {

    if (
      r !== 1 &&
      r !== 2 &&
      r !== 3
    ) {

      sheet.setRowHeight(
        r,
        23
      );

    }

  }

}


/* =========================================================
   EXPORT GOOGLE SHEET TO PDF
========================================================= */

function exportSheetAsPdf_(
  spreadsheetId,
  sheetId
) {

  const token =
    ScriptApp.getOAuthToken();


  const url =
    "https://docs.google.com/spreadsheets/d/" +
    spreadsheetId +
    "/export" +

    "?format=pdf" +

    "&gid=" +
    sheetId +

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


  const response =
    UrlFetchApp.fetch(
      url,
      {
        headers: {
          Authorization:
            "Bearer " +
            token
        },

        muteHttpExceptions:
          true
      }
    );


  const responseCode =
    response.getResponseCode();


  if (
    responseCode !== 200
  ) {

    throw new Error(
      "PDF gagal dijana. HTTP " +
      responseCode
    );

  }


  return response
    .getBlob()
    .setContentType(
      "application/pdf"
    );

}


/* =========================================================
   UPDATE LINKS DALAM GOOGLE SHEET
========================================================= */

function updateFileLinks_(
  ref,
  receiptUrl,
  pdfUrl
) {

  const ss =
    SpreadsheetApp.openById(
      CONFIG.SPREADSHEET_ID
    );


  const sheet =
    ss.getSheetByName(
      CONFIG.SHEET_NAME
    );


  if (!sheet) {

    throw new Error(
      "Sheet Pendaftaran tidak dijumpai."
    );

  }


  const lastRow =
    sheet.getLastRow();


  if (lastRow < 2) {
    return;
  }


  const refs =
    sheet
      .getRange(
        2,
        2,
        lastRow - 1,
        1
      )
      .getValues();


  for (
    let i = 0;
    i < refs.length;
    i++
  ) {

    if (
      String(
        refs[i][0]
      ) === ref
    ) {

      const row =
        i + 2;


      // Nama fail resit

      const receiptFileId =
        extractDriveId_(
          receiptUrl
        );


      const receiptFile =
        DriveApp.getFileById(
          receiptFileId
        );


      sheet
        .getRange(
          row,
          16
        )
        .setValue(
          receiptFile.getName()
        );


      // URL resit

      sheet
        .getRange(
          row,
          17
        )
        .setValue(
          receiptUrl
        );


      // URL PDF

      sheet
        .getRange(
          row,
          18
        )
        .setValue(
          pdfUrl
        );


      // Tarikh proses

      sheet
        .getRange(
          row,
          19
        )
        .setValue(
          new Date()
        );


      break;

    }

  }

}


/* =========================================================
   EXTRACT DRIVE FILE ID
========================================================= */

function extractDriveId_(
  url
) {

  const match =
    String(url).match(
      /[-\w]{25,}/
    );


  if (!match) {

    throw new Error(
      "ID fail Drive tidak dapat dikenal pasti."
    );

  }


  return match[0];

}


/* =========================================================
   SEND RESPONSE BACK TO GITHUB PAGE
========================================================= */

function responseHtml_(
  result
) {

  const json =
    JSON.stringify(
      result
    )
    .replace(
      /</g,
      "\\u003c"
    )
    .replace(
      />/g,
      "\\u003e"
    )
    .replace(
      /&/g,
      "\\u0026"
    );


  return HtmlService
    .createHtmlOutput(

      "<!doctype html>" +

      "<html>" +

      "<head>" +

      "<meta charset='UTF-8'>" +

      "</head>" +

      "<body>" +

      "<script>" +

      "window.parent.postMessage(" +

      json +

      ", '*');" +

      "</script>" +

      "<p style='font-family:Arial,sans-serif'>" +

      "Proses selesai. Anda boleh kembali ke laman pendaftaran." +

      "</p>" +

      "</body>" +

      "</html>"

    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/* =========================================================
   HELPERS
========================================================= */

function clean_(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .slice(
      0,
      500
    );

}


function positiveInt_(
  value
) {

  const n =
    parseInt(
      value,
      10
    );


  return (
    Number.isFinite(n) &&
    n > 0
  )
    ? n
    : 0;

}


function sanitizeFileName_(
  name
) {

  return String(
    name ||
      "Penyumbang"
  )
    .replace(
      /[\\\/:*?"<>|#%]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .slice(
      0,
      100
    );

}


function extensionFromMime_(
  mime
) {

  const map = {

    "application/pdf":
      ".pdf",

    "image/jpeg":
      ".jpg",

    "image/png":
      ".png"

  };


  return (
    map[mime] ||
    ""
  );

}


function formatMoney_(
  value
) {

  return Number(
    value || 0
  ).toLocaleString(
    "ms-MY",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2
    }
  );

}


function formatDate_(
  date
) {

  return Utilities
    .formatDate(
      date,

      Session
        .getScriptTimeZone(),

      "dd/MM/yyyy HH:mm"
    );

}
