/* ================================
   CONFIG
================================ */
const APPS_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

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
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function validateMain() {
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);

  if (meja === 0 && kerusi === 0) {
    alert("Sila masukkan sekurang-kurangnya 1 meja atau 1 kerusi.");
    return false;
  }

  if (!$("pengesahan").checked) {
    alert("Sila tandakan pengesahan maklumat.");
    return false;
  }

  const hadir = integerValue(hadirEl);
  const infaq = integerValue(infaqEl);

  if ((hadir + infaq) === 0) {
    alert("Sila masukkan jumlah orang yang hadir atau diinfaqkan.");
    return false;
  }

  return true;
}

/* ================================
   FORM EVENTS
================================ */
statusEl.addEventListener("change", () => {
  const wrap = $("jawatanWrap");
  if (statusEl.value === "Jawatan / Organisasi") {
    wrap.classList.remove("hidden");
    $("jawatan").required = true;
  } else {
    wrap.classList.add("hidden");
    $("jawatan").required = false;
    $("jawatan").value = "";
  }
});

[mejaEl, kerusiEl, hadirEl, infaqEl].forEach(el => {
  el.addEventListener("input", updateSummary);
  el.addEventListener("change", updateSummary);
});

continueBtn.addEventListener("click", () => {
  if (!validateMain()) return;

  show(paymentSection);
  $("paymentTotal").textContent = money(calculateTotal());
  paymentSection.scrollIntoView({behavior:"smooth", block:"start"});
});

submitBtn.addEventListener("click", submitRegistration);

/* ================================
   SUBMISSION
   Uses a hidden iframe + normal HTML POST.
   This avoids browser CORS problems with
   GitHub Pages -> Apps Script.
================================ */
async function submitRegistration() {
  $("formError").textContent = "";

  const file = $("resit").files[0];

  if (!file) {
    $("formError").textContent = "Sila pilih bukti pembayaran.";
    return;
  }

  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (!allowed.includes(file.type)) {
    $("formError").textContent = "Format fail tidak dibenarkan.";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    $("formError").textContent = "Saiz fail maksimum ialah 5MB.";
    return;
  }

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    $("formError").textContent = "URL Google Apps Script belum ditetapkan.";
    return;
  }

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

    postToAppsScript(payload);
  } catch (err) {
    hide(loadingSection);
    show(paymentSection);
    submitBtn.disabled = false;
    submitBtn.textContent = "HANTAR PENDAFTARAN";
    $("formError").textContent = "Gagal membaca fail: " + err.message;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.substring(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Fail tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

function postToAppsScript(data) {
  const iframe = $("gasResponseFrame");

  const tempForm = document.createElement("form");
  tempForm.method = "POST";
  tempForm.action = APPS_SCRIPT_URL;
  tempForm.target = iframe.name;
  tempForm.enctype = "application/x-www-form-urlencoded";
  tempForm.style.display = "none";

  Object.entries(data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = typeof value === "string" ? value : JSON.stringify(value);
    tempForm.appendChild(input);
  });

  document.body.appendChild(tempForm);
  tempForm.submit();
  tempForm.remove();
}

/* Apps Script response page sends this message back to GitHub */
window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "MMS30_RESULT") return;

  hide(loadingSection);

  if (event.data.ok) {
    hide(paymentSection);
    show(successSection);

    $("referenceNumber").textContent = event.data.reference || "-";
    $("successTotal").textContent = money(event.data.total || calculateTotal());

    const pdf = $("pdfLink");
    if (event.data.pdfUrl) {
      pdf.href = event.data.pdfUrl;
      pdf.style.display = "inline-flex";
    } else {
      pdf.style.display = "none";
    }

    window.scrollTo({top:0, behavior:"smooth"});
  } else {
    show(paymentSection);
    submitBtn.disabled = false;
    submitBtn.textContent = "HANTAR PENDAFTARAN";
    $("formError").textContent = event.data.message || "Ralat tidak diketahui.";
  }
});

/* initial */
updateSummary();
