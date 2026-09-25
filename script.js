/* =====================================================
   MAJLIS MAKAN MALAM 30 TAHUN PAS SARAWAK 2026
   SCRIPT.JS - VERSI 7
===================================================== */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz2upbhGL900JN2KnOO4P1DRn5NhKG00pbJkuAo9tGxyqPFNJQMNCdlRC0AuBNA4hUx/exec";

const TABLE_PRICE = 2500;
const CHAIR_PRICE = 250;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const $ = (id) => document.getElementById(id);

let latestRegistrationResult = null;

function money(value) {
  return "RM" + Number(value || 0).toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function numberValue(id) {
  const el = $(id);
  if (!el) return 0;

  const n = parseInt(el.value, 10);

  return Number.isFinite(n) && n > 0 ? n : 0;
}

function calculateTotal() {
  return (
    numberValue("bilanganMeja") * TABLE_PRICE +
    numberValue("bilanganKerusi") * CHAIR_PRICE
  );
}

function show(el) {
  if (el) {
    el.classList.remove("hidden");
  }
}

function hide(el) {
  if (el) {
    el.classList.add("hidden");
  }
}

function updateSummary() {
  const meja = numberValue("bilanganMeja");
  const kerusi = numberValue("bilanganKerusi");
  const hadir = numberValue("jumlahHadir");
  const infaq = numberValue("jumlahInfaqHadir");
  const total = calculateTotal();

  const summaryMeja = $("summaryMeja");
  const summaryKerusi = $("summaryKerusi");
  const summaryTotal = $("summaryTotal");

  if (summaryMeja) {
    summaryMeja.textContent =
      `${meja} × RM2,500`;
  }

  if (summaryKerusi) {
    summaryKerusi.textContent =
      `${kerusi} × RM250`;
  }

  if (summaryTotal) {
    summaryTotal.textContent =
      money(total);
  }

  const review = {
    reviewNama:
      $("nama")?.value.trim() || "-",

    reviewTelefon:
      $("telefon")?.value.trim() || "-",

    reviewStatus:
      $("status")?.value || "-",

    reviewJawatan:
      $("jawatan")?.value.trim() || "-",

    reviewMeja:
      String(meja),

    reviewKerusi:
      String(kerusi),

    reviewJenisKehadiran:
      $("jenisKehadiran")?.value || "-",

    reviewHadir:
      `${hadir} orang`,

    reviewInfaq:
      `${infaq} orang`,

    reviewTotal:
      money(total)
  };

  Object.entries(review).forEach(
    ([id, value]) => {
      const el = $(id);

      if (el) {
        el.textContent = value;
      }
    }
  );

  const paymentTotal = $("paymentTotal");

  if (paymentTotal) {
    paymentTotal.textContent =
      money(total);
  }
}

function setupStatus() {
  const status = $("status");
  const wrap = $("jawatanWrap");
  const jawatan = $("jawatan");

  if (!status) return;

  function refreshJawatan() {
    const isAJK =
      status.value === "Ahli Jawatankuasa" ||
      status.value === "Jawatan / Organisasi";

    if (isAJK) {
      show(wrap);

      if (jawatan) {
        jawatan.required = true;
      }
    } else {
      hide(wrap);

      if (jawatan) {
        jawatan.required = false;
        jawatan.value = "";
      }
    }

    updateSummary();
  }

  status.addEventListener(
    "change",
    refreshJawatan
  );

  refreshJawatan();
}

function validateBeforePayment() {
  const requiredIds = [
    "nama",
    "telefon",
    "telefonSah",
    "status",
    "jenisKehadiran"
  ];

  for (const id of requiredIds) {
    const el = $(id);

    if (el && !el.checkValidity()) {
      el.reportValidity();
      el.focus();

      return false;
    }
  }

  const telefon =
    $("telefon")?.value.trim() || "";

  const telefonSah =
    $("telefonSah")?.value.trim() || "";

  if (telefon !== telefonSah) {
    alert(
      "No. Telefon dan Sahkan No. Telefon tidak sama. Sila semak semula."
    );

    $("telefonSah")?.focus();

    return false;
  }

  if (
    $("status")?.value ===
      "Ahli Jawatankuasa" ||
    $("status")?.value ===
      "Jawatan / Organisasi"
  ) {
    const jawatan = $("jawatan");

    if (!jawatan || !jawatan.value.trim()) {
      alert(
        "Sila masukkan jawatan / unit / organisasi."
      );

      show($("jawatanWrap"));

      jawatan?.focus();

      return false;
    }
  }

  const meja =
    numberValue("bilanganMeja");

  const kerusi =
    numberValue("bilanganKerusi");

  if (meja === 0 && kerusi === 0) {
    alert(
      "Sila masukkan sekurang-kurangnya 1 meja atau 1 kerusi."
    );

    $("bilanganMeja")?.focus();

    return false;
  }

  const pengesahan =
    $("pengesahan");

  if (
    pengesahan &&
    !pengesahan.checked
  ) {
    alert(
      "Sila tandakan kotak pengesahan bahawa semua maklumat adalah benar."
    );

    pengesahan.focus();

    pengesahan.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    return false;
  }

  return true;
}

function fileToBase64(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const result =
          String(reader.result || "");

        const comma =
          result.indexOf(",");

        resolve(
          comma >= 0
            ? result.substring(
                comma + 1
              )
            : result
        );
      };

      reader.onerror = () =>
        reject(
          new Error(
            "Fail bukti pembayaran gagal dibaca."
          )
        );

      reader.readAsDataURL(file);
    }
  );
}

function postToAppsScript(data) {
  const iframe =
    $("gasResponseFrame");

  if (!iframe) {
    throw new Error(
      "gasResponseFrame tidak dijumpai dalam index.html."
    );
  }

  iframe.name =
    "gasResponseFrame";

  iframe.style.display =
    "none";

  iframe.src =
    "about:blank";

  const tempForm =
    document.createElement(
      "form"
    );

  tempForm.method =
    "POST";

  tempForm.action =
    APPS_SCRIPT_URL;

  tempForm.target =
    "gasResponseFrame";

  tempForm.enctype =
    "application/x-www-form-urlencoded";

  tempForm.style.display =
    "none";

  Object.entries(data).forEach(
    ([key, value]) => {
      const input =
        document.createElement(
          "input"
        );

      input.type =
        "hidden";

      input.name =
        key;

      input.value =
        value == null
          ? ""
          : String(value);

      tempForm.appendChild(
        input
      );
    }
  );

  document.body.appendChild(
    tempForm
  );

  tempForm.submit();

  tempForm.remove();
}

function resetSubmitButton() {
  const btn =
    $("submitBtn");

  if (!btn) return;

  btn.disabled =
    false;

  btn.textContent =
    "HANTAR PENDAFTARAN";
}

function showSubmitError(
  message
) {
  hide(
    $("loadingSection")
  );

  show(
    $("paymentSection")
  );

  resetSubmitButton();

  const error =
    $("formError");

  if (error) {
    error.textContent =
      message ||
      "Berlaku ralat semasa proses pendaftaran.";
  }

  $("paymentSection")?.scrollIntoView(
    {
      behavior: "smooth",
      block: "start"
    }
  );
}

async function submitRegistration() {
  const error =
    $("formError");

  if (error) {
    error.textContent =
      "";
  }

  const fileInput =
    $("resit");

  if (!fileInput) {
    showSubmitError(
      "Ruangan bukti pembayaran tidak dijumpai."
    );

    return;
  }

  const file =
    fileInput.files?.[0];

  if (!file) {
    if (error) {
      error.textContent =
        "Sila pilih bukti pembayaran.";
    }

    fileInput.focus();

    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {
    if (error) {
      error.textContent =
        "Format fail tidak dibenarkan. Sila gunakan PDF, JPG atau PNG.";
    }

    fileInput.value =
      "";

    return;
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    if (error) {
      error.textContent =
        "Saiz fail maksimum ialah 5MB.";
    }

    fileInput.value =
      "";

    return;
  }

  const submitBtn =
    $("submitBtn");

  if (submitBtn) {
    submitBtn.disabled =
      true;

    submitBtn.textContent =
      "MEMPROSES...";
  }

  hide(
    $("paymentSection")
  );

  hide(
    $("successSection")
  );

  show(
    $("loadingSection")
  );

  $("loadingSection")?.scrollIntoView(
    {
      behavior: "smooth",
      block: "start"
    }
  );

  try {
    const base64 =
      await fileToBase64(
        file
      );

    const payload = {
      nama:
        $("nama")?.value.trim() ||
        "",

      telefon:
        $("telefon")?.value.trim() ||
        "",

      telefonSah:
        $("telefonSah")?.value.trim() ||
        "",

      status:
        $("status")?.value ||
        "",

      jawatan:
        $("jawatan")?.value.trim() ||
        "",

      bilanganMeja:
        numberValue(
          "bilanganMeja"
        ),

      bilanganKerusi:
        numberValue(
          "bilanganKerusi"
        ),

      jenisKehadiran:
        $("jenisKehadiran")?.value ||
        "",

      jumlahHadir:
        numberValue(
          "jumlahHadir"
        ),

      jumlahInfaqHadir:
        numberValue(
          "jumlahInfaqHadir"
        ),

      clientTotal:
        calculateTotal(),

      fileName:
        file.name,

      fileType:
        file.type,

      fileBase64:
        base64,

      parentOrigin:
        window.location.origin
    };

    postToAppsScript(
      payload
    );
  } catch (err) {
    console.error(err);

    showSubmitError(
      err?.message ||
      String(err)
    );
  }
}

function generateUserPdf(
  result
) {
  try {
    if (
      !window.jspdf?.jsPDF
    ) {
      alert(
        "Fungsi PDF pengguna belum tersedia. Sila semak sambungan internet dan cuba lagi."
      );

      return;
    }

    const {
      jsPDF
    } =
      window.jspdf;

    const doc =
      new jsPDF();

    const reference =
      result.reference ||
      "TIADA-RUJUKAN";

    const nama =
      result.nama ||
      $("nama")?.value.trim() ||
      "-";

    const telefon =
      result.telefon ||
      $("telefon")?.value.trim() ||
      "-";

    const status =
      result.status ||
      $("status")?.value ||
      "-";

    const jawatan =
      result.jawatan ||
      $("jawatan")?.value.trim() ||
      "";

    const meja =
      Number(
        result.bilanganMeja ??
        numberValue(
          "bilanganMeja"
        )
      );

    const kerusi =
      Number(
        result.bilanganKerusi ??
        numberValue(
          "bilanganKerusi"
        )
      );

    const jenis =
      result.jenisKehadiran ||
      $("jenisKehadiran")?.value ||
      "-";

    const hadir =
      Number(
        result.jumlahHadir ??
        numberValue(
          "jumlahHadir"
        )
      );

    const infaq =
      Number(
        result.jumlahInfaqHadir ??
        numberValue(
          "jumlahInfaqHadir"
        )
      );

    const total =
      Number(
        result.total ??
        result.clientTotal ??
        calculateTotal()
      );

    let y = 20;

    doc.setFontSize(
      16
    );

    doc.text(
      "PENGESAHAN PENYERTAAN",
      20,
      y
    );

    y += 9;

    doc.setFontSize(
      11
    );

    doc.text(
      "Majlis Makan Malam 30 Tahun PAS Sarawak 2026",
      20,
      y
    );

    y += 12;

    doc.setFontSize(
      10
    );

    const rows = [
      [
        "No. Rujukan",
        reference
      ],

      [
        "Tarikh / Masa",
        new Date().toLocaleString(
          "ms-MY"
        )
      ],

      [
        "Nama",
        nama
      ],

      [
        "No. Telefon",
        telefon
      ],

      [
        "Status",
        status
      ]
    ];

    if (jawatan) {
      rows.push([
        "Jawatan / Unit / Organisasi",
        jawatan
      ]);
    }

    rows.push(
      [
        "Jumlah Meja",
        String(meja)
      ],

      [
        "Jumlah Kerusi",
        String(kerusi)
      ],

      [
        "Jenis Kehadiran",
        jenis
      ],

      [
        "Jumlah Kehadiran",
        String(hadir)
      ],

      [
        "Infaq Untuk Orang Lain",
        String(infaq)
      ],

      [
        "Jumlah Sumbangan",
        money(total)
      ]
    );

    rows.forEach(
      ([label, value]) => {
        doc.text(
          `${label}:`,
          20,
          y
        );

        doc.text(
          String(
            value || "-"
          ),
          80,
          y
        );

        y += 7;
      }
    );

    y += 5;

    doc.text(
      "Bukti pembayaran: Telah dimuat naik untuk semakan.",
      20,
      y
    );

    y += 7;

    doc.text(
      "Status pembayaran: Menunggu Semakan",
      20,
      y
    );

    y += 14;

    doc.setFontSize(
      9
    );

    doc.text(
      "Sila simpan dokumen ini sebagai rekod penyertaan.",
      20,
      y
    );

    doc.save(
      `${reference} - Pengesahan.pdf`
    );

  } catch (err) {
    console.error(
      "Ralat PDF pengguna:",
      err
    );

    alert(
      "PDF pengguna tidak dapat dijana. Sila cuba semula."
    );
  }
}

function init() {
  const form =
    $("registrationForm");

  const continueBtn =
    $("continueBtn");

  const submitBtn =
    $("submitBtn");

  [
    "nama",
    "telefon",
    "telefonSah",
    "status",
    "jawatan",
    "bilanganMeja",
    "bilanganKerusi",
    "jenisKehadiran",
    "jumlahHadir",
    "jumlahInfaqHadir"
  ].forEach(
    (id) => {
      const el = $(id);

      if (!el) return;

      el.addEventListener(
        "input",
        updateSummary
      );

      el.addEventListener(
        "change",
        updateSummary
      );
    }
  );

  setupStatus();

  updateSummary();

  if (continueBtn) {
    continueBtn.addEventListener(
      "click",
      () => {
        updateSummary();

        if (
          !validateBeforePayment()
        ) {
          return;
        }

        show(
          $("paymentSection")
        );

        $("paymentSection")?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start"
          }
        );
      }
    );
  }

  if (submitBtn) {
    submitBtn.addEventListener(
      "click",
      submitRegistration
    );
  }

  if (form) {
    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
      }
    );
  }

  const pdfLink =
    $("pdfLink");

  if (pdfLink) {
    pdfLink.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        if (
          latestRegistrationResult
        ) {
          generateUserPdf(
            latestRegistrationResult
          );
        }
      }
    );
  }
}

window.addEventListener(
  "message",
  (event) => {
    if (
      !event.data ||
      event.data.type !==
        "MMS30_RESULT"
    ) {
      return;
    }

    const result =
      event.data;

    latestRegistrationResult =
      result;

    hide(
      $("loadingSection")
    );

    if (
      result.ok === true
    ) {
      hide(
        $("paymentSection")
      );

      show(
        $("successSection")
      );

      if (
        $("referenceNumber")
      ) {
        $("referenceNumber").textContent =
          result.reference ||
          "-";
      }

      if (
        $("successTotal")
      ) {
        $("successTotal").textContent =
          money(
            result.total ||
            calculateTotal()
          );
      }

      const pdf =
        $("pdfLink");

      if (pdf) {
        pdf.href =
          "#";

        pdf.style.display =
          "inline-flex";

        pdf.textContent =
          "MUAT TURUN PDF PENGESAHAN";
      }

      resetSubmitButton();

      $("successSection")?.scrollIntoView(
        {
          behavior: "smooth",
          block: "start"
        }
      );

      return;
    }

    showSubmitError(
      result.message ||
      "Pendaftaran tidak berjaya. Sila cuba semula."
    );
  }
);

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );
} else {
  init();
}
