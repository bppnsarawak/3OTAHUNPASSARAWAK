const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyOvIPDswxYM_czosphJrtKGHPK0YM7VfFax2oTIaQB7kGN2pV5TIshceOMeHSJu2Nf/exec";

const TABLE_PRICE = 2500;
const CHAIR_PRICE = 250;

const $ = (id) => document.getElementById(id);

const form = $("registrationForm");
const paymentSection = $("paymentSection");
const loadingSection = $("loadingSection");
const successSection = $("successSection");

const submitBtn = $("submitBtn");
const paymentBtn = $("paymentBtn");

const telefonEl = $("telefon");
const telefonSahEl = $("telefonSah");

function show(el) {
  if (el) el.style.display = "";
}

function hide(el) {
  if (el) el.style.display = "none";
}

function money(value) {
  return "RM" + Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getNumber(id) {
  const el = $(id);
  if (!el) return 0;

  const value = parseInt(el.value, 10);
  return Number.isFinite(value) ? value : 0;
}

function calculateTotal() {
  const meja = getNumber("meja");
  const kerusi = getNumber("kerusi");

  return meja * TABLE_PRICE + kerusi * CHAIR_PRICE;
}

function updateTotal() {
  const meja = getNumber("meja");
  const kerusi = getNumber("kerusi");

  const mejaTotal = meja * TABLE_PRICE;
  const kerusiTotal = kerusi * CHAIR_PRICE;
  const total = mejaTotal + kerusiTotal;

  const mejaSummary = $("mejaSummary");
  const kerusiSummary = $("kerusiSummary");
  const totalSummary = $("totalSummary");

  if (mejaSummary) {
    mejaSummary.textContent =
      `${meja} × RM2,500 = ${money(mejaTotal)}`;
  }

  if (kerusiSummary) {
    kerusiSummary.textContent =
      `${kerusi} × RM250 = ${money(kerusiTotal)}`;
  }

  if (totalSummary) {
    totalSummary.textContent = money(total);
  }

  updateReview();
}

function updateReview() {
  const nama = $("nama");
  const telefon = $("telefon");
  const status = $("status");
  const jawatan = $("jawatan");
  const meja = $("meja");
  const kerusi = $("kerusi");
  const jenisKehadiran = $("jenisKehadiran");
  const hadir = $("hadir");

  const reviewNama = $("reviewNama");
  const reviewTelefon = $("reviewTelefon");
  const reviewStatus = $("reviewStatus");
  const reviewJawatan = $("reviewJawatan");
  const reviewMeja = $("reviewMeja");
  const reviewKerusi = $("reviewKerusi");
  const reviewJenisKehadiran = $("reviewJenisKehadiran");
  const reviewHadir = $("reviewHadir");
  const reviewInfaq = $("reviewInfaq");
  const reviewTotal = $("reviewTotal");

  if (reviewNama) {
    reviewNama.textContent = nama ? nama.value || "-" : "-";
  }

  if (reviewTelefon) {
    reviewTelefon.textContent = telefon ? telefon.value || "-" : "-";
  }

  if (reviewStatus) {
    reviewStatus.textContent = status ? status.value || "-" : "-";
  }

  if (reviewJawatan) {
    reviewJawatan.textContent = jawatan ? jawatan.value || "-" : "-";
  }

  if (reviewMeja) {
    reviewMeja.textContent = meja
      ? `${getNumber("meja")} meja`
      : "-";
  }

  if (reviewKerusi) {
    reviewKerusi.textContent = kerusi
      ? `${getNumber("kerusi")} kerusi`
      : "-";
  }

  if (reviewJenisKehadiran) {
    reviewJenisKehadiran.textContent =
      jenisKehadiran ? jenisKehadiran.value || "-" : "-";
  }

  if (reviewHadir) {
    reviewHadir.textContent =
      hadir ? hadir.value || "-" : "-";
  }

  if (reviewInfaq) {
    reviewInfaq.textContent =
      `${getNumber("meja")} × RM2,500 + ${getNumber("kerusi")} × RM250`;
  }

  if (reviewTotal) {
    reviewTotal.textContent = money(calculateTotal());
  }
}

function validateMain() {
  if (!form) return false;

  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  const telefon = telefonEl ? telefonEl.value.trim() : "";
  const telefonSah = telefonSahEl ? telefonSahEl.value.trim() : "";

  if (telefon !== telefonSah) {
    alert(
      "No. telefon tidak sepadan.\n\n" +
      "Sila semak semula No. Telefon dan Sahkan No. Telefon."
    );

    if (telefonSahEl) {
      telefonSahEl.focus();
    }

    return false;
  }

  const meja = getNumber("meja");
  const kerusi = getNumber("kerusi");

  if (meja < 0 || kerusi < 0) {
    alert("Jumlah meja atau kerusi tidak sah.");
    return false;
  }

  if (meja === 0 && kerusi === 0) {
    alert("Sila pilih sekurang-kurangnya satu meja atau kerusi.");
    return false;
  }

  return true;
}

function showPaymentSection() {
  hide(loadingSection);
  hide(successSection);
  show(paymentSection);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function resetSubmitButton() {
  if (!submitBtn) return;

  submitBtn.disabled = false;
  submitBtn.textContent = "HANTAR PENDAFTARAN";
}

function showSubmitError(message) {
  hide(loadingSection);
  show(paymentSection);

  resetSubmitButton();

  const formError = $("formError");

  if (formError) {
    formError.textContent =
      message || "Berlaku ralat semasa menghantar pendaftaran.";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function postToAppsScript(data) {
  const iframe = $("gasResponseFrame");

  if (!iframe) {
    throw new Error(
      "gasResponseFrame tidak dijumpai dalam HTML."
    );
  }

  const tempForm = document.createElement("form");

  tempForm.method = "POST";
  tempForm.action = APPS_SCRIPT_URL;
  tempForm.target = iframe.name;
  tempForm.enctype =
    "application/x-www-form-urlencoded";

  Object.keys(data).forEach((key) => {
    const input = document.createElement("input");

    input.type = "hidden";
    input.name = key;
    input.value =
      data[key] === undefined || data[key] === null
        ? ""
        : data[key];

    tempForm.appendChild(input);
  });

  document.body.appendChild(tempForm);

  tempForm.submit();

  tempForm.remove();
}

function getSelectedFile() {
  const fileInput = $("buktiBayaran");

  if (!fileInput || !fileInput.files || !fileInput.files.length) {
    return null;
  }

  return fileInput.files[0];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result || "";

      const base64 =
        String(result).split(",")[1] || "";

      resolve(base64);
    };

    reader.onerror = () => {
      reject(
        new Error("Fail bukti bayaran gagal dibaca.")
      );
    };

    reader.readAsDataURL(file);
  });
}

async function buildPayload() {
  const file = getSelectedFile();

  let buktiBase64 = "";
  let buktiNama = "";
  let buktiJenis = "";

  if (file) {
    buktiBase64 = await fileToBase64(file);
    buktiNama = file.name;
    buktiJenis = file.type || "";
  }

  return {
    nama: $("nama") ? $("nama").value.trim() : "",
    telefon: telefonEl ? telefonEl.value.trim() : "",
    telefonSah: telefonSahEl
      ? telefonSahEl.value.trim()
      : "",

    status: $("status")
      ? $("status").value.trim()
      : "",

    jawatan: $("jawatan")
      ? $("jawatan").value.trim()
      : "",

    organisasi: $("organisasi")
      ? $("organisasi").value.trim()
      : "",

    meja: getNumber("meja"),
    kerusi: getNumber("kerusi"),

    jenisKehadiran: $("jenisKehadiran")
      ? $("jenisKehadiran").value
      : "",

    hadir: $("hadir")
      ? $("hadir").value
      : "",

    jumlah: calculateTotal(),

    buktiBayaran: buktiBase64,
    buktiNama: buktiNama,
    buktiJenis: buktiJenis
  };
}

function generateUserPdf(result) {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(
        "Fungsi PDF pengguna belum tersedia. " +
        "Sila pastikan sambungan internet aktif dan cuba lagi."
      );

      return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const reference =
      result.reference || "TIADA-RUJUKAN";

    const nama =
      result.nama ||
      ($("nama") ? $("nama").value.trim() : "-");

    const telefon =
      result.telefon ||
      ($("telefon") ? $("telefon").value.trim() : "-");

    const status =
      result.status ||
      ($("status") ? $("status").value.trim() : "-");

    const jawatan =
      result.jawatan ||
      ($("jawatan") ? $("jawatan").value.trim() : "");

    const meja =
      Number(result.meja ?? getNumber("meja"));

    const kerusi =
      Number(result.kerusi ?? getNumber("kerusi"));

    const jenisKehadiran =
      result.jenisKehadiran ||
      ($("jenisKehadiran")
        ? $("jenisKehadiran").value
        : "-");

    const hadir =
      result.hadir ||
      ($("hadir") ? $("hadir").value : "-");

    const total =
      Number(result.total || calculateTotal());

    let y = 20;

    doc.setFontSize(16);
    doc.text(
      "PENGESAHAN PENYERTAAN",
      20,
      y
    );

    y += 10;

    doc.setFontSize(12);
    doc.text(
      "Majlis Makan Malam 30 Tahun PAS Sarawak 2026",
      20,
      y
    );

    y += 12;

    doc.setFontSize(10);

    const lines = [
      ["No. Rujukan", reference],
      [
        "Tarikh / Masa",
        new Date().toLocaleString("ms-MY")
      ],
      ["Nama", nama],
      ["No. Telefon", telefon],
      ["Status", status]
    ];

    if (jawatan) {
      lines.push(["Jawatan / Organisasi", jawatan]);
    }

    lines.push(
      ["Jumlah Meja", String(meja)],
      ["Jumlah Kerusi", String(kerusi)],
      ["Jenis Kehadiran", jenisKehadiran],
      ["Jumlah Hadir", String(hadir)],
      ["Jumlah Sumbangan", money(total)]
    );

    lines.forEach((item) => {
      doc.text(`${item[0]}:`, 20, y);
      doc.text(String(item[1] || "-"), 75, y);

      y += 7;
    });

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

    y += 15;

    doc.setFontSize(9);

    doc.text(
      "Sila simpan dokumen ini sebagai rekod penyertaan.",
      20,
      y
    );

    const filename =
      `${reference} - Pengesahan.pdf`;

    doc.save(filename);
  } catch (error) {
    console.error(
      "Ralat jana PDF pengguna:",
      error
    );

    alert(
      "PDF pengguna tidak dapat dijana.\n\n" +
      "Sila cuba semula."
    );
  }
}

function bindEvents() {
  [
    "nama",
    "telefon",
    "telefonSah",
    "status",
    "jawatan",
    "organisasi",
    "meja",
    "kerusi",
    "jenisKehadiran",
    "hadir"
  ].forEach((id) => {
    const el = $(id);

    if (!el) return;

    el.addEventListener("input", updateReview);
    el.addEventListener("change", updateReview);
  });

  const meja = $("meja");
  const kerusi = $("kerusi");

  if (meja) {
    meja.addEventListener("input", updateTotal);
    meja.addEventListener("change", updateTotal);
  }

  if (kerusi) {
    kerusi.addEventListener("input", updateTotal);
    kerusi.addEventListener("change", updateTotal);
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateMain()) {
        return;
      }

      const file = getSelectedFile();

      if (!file) {
        alert(
          "Sila muat naik bukti pembayaran terlebih dahulu."
        );

        return;
      }

      try {
        hide(paymentSection);
        hide(successSection);
        show(loadingSection);

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "SEDANG MEMPROSES...";
        }

        const payload =
          await buildPayload();

        postToAppsScript(payload);
      } catch (error) {
        console.error(error);

        showSubmitError(
          error.message ||
          "Berlaku ralat semasa menghantar pendaftaran."
        );
      }
    });
  }

  if (paymentBtn) {
    paymentBtn.addEventListener(
      "click",
      () => {
        if (!validateMain()) return;

        showPaymentSection();
      }
    );
  }

  const pdfLink = $("pdfLink");

  if (pdfLink) {
    pdfLink.addEventListener(
      "click",
      (event) => {
        event.preventDefault();

        if (window.latestRegistrationResult) {
          generateUserPdf(
            window.latestRegistrationResult
          );
        }
      }
    );
  }

  updateTotal();
  updateReview();
}

window.addEventListener(
  "message",
  (event) => {
    if (
      !event.data ||
      event.data.type !== "MMS30_RESULT"
    ) {
      return;
    }

    hide(loadingSection);

    const result = event.data;

    if (result.ok) {
      hide(paymentSection);
      show(successSection);

      window.latestRegistrationResult = result;

      const referenceNumber =
        $("referenceNumber");

      if (referenceNumber) {
        referenceNumber.textContent =
          result.reference || "-";
      }

      const successTotal =
        $("successTotal");

      if (successTotal) {
        successTotal.textContent =
          money(
            result.total ||
            calculateTotal()
          );
      }

      const pdf = $("pdfLink");

      if (pdf) {
        pdf.href = "#";
        pdf.style.display = "inline-flex";
        pdf.textContent =
          "MUAT TURUN PDF PENGESAHAN";
      }

      resetSubmitButton();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    show(paymentSection);

    resetSubmitButton();

    const formError =
      $("formError");

    if (formError) {
      formError.textContent =
        result.message ||
        "Ralat tidak diketahui.";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  },
  false
);

document.addEventListener(
  "DOMContentLoaded",
  bindEvents
);
