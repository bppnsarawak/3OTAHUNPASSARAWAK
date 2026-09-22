/* ================================
   CONFIG
================================ */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOvIPDswxYM_czosphJrtKGHPK0YM7VfFax2oTIaQB7kGN2pV5TIshceOMeHSJu2Nf/exec";

const TABLE_PRICE = 2000;
const CHAIR_PRICE = 200;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* ================================
   ELEMENTS
================================ */
const $ = (id) => document.getElementById(id);

const form = $("registrationForm");
const statusEl = $("status");
const mejaEl = $("bilanganMeja");
const kerusiEl = $("bilanganKerusi");
const hadirEl = $("jumlahHadir");
const infaqEl = $("jumlahInfaqHadir");

const paymentSection = $("paymentSection");
const loadingSection = $("loadingSection");
const successSection = $("successSection");

const submitBtn = $("submitBtn");
const continueBtn = $("continueBtn");

/* ================================
   HELPERS
================================ */

function money(value) {
  return "RM" + Number(value || 0).toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function integerValue(el) {
  const n = parseInt(el.value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function calculateTotal() {
  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);

  return (meja * TABLE_PRICE) + (kerusi * CHAIR_PRICE);
}

function updateSummary() {
  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);
  const hadir = integerValue(hadirEl);
  const total = calculateTotal();

  $("summaryMeja").textContent = `${meja} × RM2,000`;
  $("summaryKerusi").textContent = `${kerusi} × RM200`;
  $("summaryTotal").textContent = money(total);

  $("reviewMeja").textContent = meja;
  $("reviewKerusi").textContent = kerusi;
  $("reviewHadir").textContent = `${hadir} orang`;
  $("reviewTotal").textContent = money(total);

  $("paymentTotal").textContent = money(total);
  $("successTotal").textContent = money(total);
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

/* ================================
   VALIDATION SEBELUM PEMBAYARAN
================================ */

function validateMain() {

  /*
    PENTING:
    Jangan gunakan form.checkValidity() di sini.

    Sebab #resit berada dalam borang yang sama
    dan mempunyai required. Akibatnya browser
    akan menganggap borang belum lengkap walaupun
    kita baru hendak masuk ke bahagian pembayaran.
  */

  const mainFields = [
    $("nama"),
    $("telefon"),
    $("status"),
    $("jenisKehadiran")
  ];

  /* Semak medan utama sahaja */
  for (const field of mainFields) {

    if (!field) continue;

    if (!field.checkValidity()) {
      field.reportValidity();
      field.focus();
      return false;
    }
  }

  /* Semak jawatan jika status memerlukan */
  if (statusEl.value === "Jawatan / Organisasi") {

    const jawatanEl = $("jawatan");

    if (!jawatanEl.value.trim()) {
      alert("Sila masukkan jawatan / organisasi.");
      jawatanEl.focus();
      return false;
    }
  }

  /* Semak sekurang-kurangnya 1 meja atau kerusi */
  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);

  if (meja === 0 && kerusi === 0) {
    alert("Sila masukkan sekurang-kurangnya 1 meja atau 1 kerusi.");
    mejaEl.focus();
    return false;
  }

  /* Semak pengesahan */
  if (!$("pengesahan").checked) {
    alert("Sila tandakan pengesahan maklumat.");
    $("pengesahan").focus();
    return false;
  }

  /* Semak jumlah hadir / infaq */
  const hadir = integerValue(hadirEl);
  const infaq = integerValue(infaqEl);

  if ((hadir + infaq) === 0) {
    alert("Sila masukkan jumlah orang yang hadir atau diinfaqkan.");
    hadirEl.focus();
    return false;
  }

  return true;
}

/* ================================
   STATUS / JAWATAN
================================ */

statusEl.addEventListener("change", () => {

  const wrap = $("jawatanWrap");
  const jawatanEl = $("jawatan");

  if (statusEl.value === "Jawatan / Organisasi") {

    wrap.classList.remove("hidden");
    jawatanEl.required = true;

  } else {

    wrap.classList.add("hidden");
    jawatanEl.required = false;
    jawatanEl.value = "";
  }
});

/* ================================
   LIVE SUMMARY
================================ */

[mejaEl, kerusiEl, hadirEl, infaqEl].forEach((el) => {

  el.addEventListener("input", updateSummary);
  el.addEventListener("change", updateSummary);

});

/* ================================
   TERUSKAN KE PEMBAYARAN
================================ */

continueBtn.addEventListener("click", function () {

  console.log("Butang TERUSKAN KE PEMBAYARAN ditekan.");

  if (!validateMain()) {
    return;
  }

  /* Paparkan bahagian pembayaran */
  show(paymentSection);

  /* Kira jumlah terkini */
  $("paymentTotal").textContent = money(calculateTotal());

  /* Scroll ke bahagian pembayaran */
  paymentSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* ================================
   SUBMIT PENDAFTARAN
================================ */

submitBtn.addEventListener("click", submitRegistration);

async function submitRegistration() {

  $("formError").textContent = "";

  const fileInput = $("resit");
  const file = fileInput.files[0];

  /* ================================
     SEMAK RESIT
  ================================= */

  if (!file) {

    $("formError").textContent =
      "Sila pilih bukti pembayaran.";

    fileInput.focus();

    return;
  }

  /* Format yang dibenarkan */
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (!allowed.includes(file.type)) {

    $("formError").textContent =
      "Format fail tidak dibenarkan. Sila gunakan PDF, JPG atau PNG.";

    fileInput.value = "";

    return;
  }

  /* Saiz maksimum 5MB */
  if (file.size > MAX_FILE_SIZE) {

    $("formError").textContent =
      "Saiz fail maksimum ialah 5MB.";

    fileInput.value = "";

    return;
  }

  /* Semak URL Apps Script */
  if (
    !APPS_SCRIPT_URL ||
    APPS_SCRIPT_URL.includes("PASTE_YOUR")
  ) {

    $("formError").textContent =
      "URL Google Apps Script belum ditetapkan.";

    return;
  }

  /* ================================
     MULA PROSES
  ================================= */

  submitBtn.disabled = true;
  submitBtn.textContent = "MEMPROSES...";

  hide(paymentSection);
  show(loadingSection);

  try {

    const base64 = await fileToBase64(file);

    const payload = {

      nama: $("nama").value.trim(),

      telefon: $("telefon").value.trim(),

      status: $("status").value,

      jawatan: $("jawatan").value.trim(),

      bilanganMeja: integerValue(mejaEl),

      bilanganKerusi: integerValue(kerusiEl),

      jenisKehadiran: $("jenisKehadiran").value,

      jumlahHadir: integerValue(hadirEl),

      jumlahInfaqHadir: integerValue(infaqEl),

      clientTotal: calculateTotal(),

      fileName: file.name,

      fileType: file.type,

      fileBase64: base64,

      parentOrigin: window.location.origin
    };

    console.log("Data dihantar ke Apps Script.");

    postToAppsScript(payload);

  } catch (err) {

    hide(loadingSection);
    show(paymentSection);

    submitBtn.disabled = false;
    submitBtn.textContent = "HANTAR PENDAFTARAN";

    $("formError").textContent =
      "Gagal membaca fail: " + err.message;
  }
}

/* ================================
   FILE → BASE64
================================ */

function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const result = String(reader.result);

      const comma = result.indexOf(",");

      resolve(
        comma >= 0
          ? result.substring(comma + 1)
          : result
      );
    };

    reader.onerror = () => {

      reject(
        new Error("Fail tidak dapat dibaca.")
      );
    };

    reader.readAsDataURL(file);
  });
}

/* ================================
   POST KE GOOGLE APPS SCRIPT
================================ */

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

  tempForm.style.display = "none";

  Object.entries(data).forEach(([key, value]) => {

    const input =
      document.createElement("input");

    input.type = "hidden";

    input.name = key;

    input.value =
      typeof value === "string"
        ? value
        : JSON.stringify(value);

    tempForm.appendChild(input);
  });

  document.body.appendChild(tempForm);

  tempForm.submit();

  tempForm.remove();
}

/* ================================
   RESPONSE DARIPADA APPS SCRIPT
================================ */

window.addEventListener("message", (event) => {

  if (
    !event.data ||
    event.data.type !== "MMS30_RESULT"
  ) {
    return;
  }

  hide(loadingSection);

  /* ================================
     BERJAYA
  ================================= */

  if (event.data.ok) {

    hide(paymentSection);

    show(successSection);

    $("referenceNumber").textContent =
      event.data.reference || "-";

    $("successTotal").textContent =
      money(
        event.data.total ||
        calculateTotal()
      );

    const pdf = $("pdfLink");

    if (event.data.pdfUrl) {

      pdf.href = event.data.pdfUrl;

      pdf.style.display = "inline-flex";

    } else {

      pdf.style.display = "none";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    return;
  }

  /* ================================
     RALAT
  ================================= */

  show(paymentSection);

  submitBtn.disabled = false;

  submitBtn.textContent =
    "HANTAR PENDAFTARAN";

  $("formError").textContent =
    event.data.message ||
    "Ralat tidak diketahui.";

  paymentSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* ================================
   INITIAL
================================ */

updateSummary();
