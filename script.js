/* ================================
   CONFIG
================================ */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz2upbhGL900JN2KnOO4P1DRn5NhKG00pbJkuAa9tGxyqPFNJQMNCdlRC0AuBNA4hUx/exec";

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

  if (!el) return 0;

  const n = parseInt(el.value, 10);

  return Number.isFinite(n) && n > 0
    ? n
    : 0;

}


function calculateTotal() {

  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);

  return (
    (meja * TABLE_PRICE) +
    (kerusi * CHAIR_PRICE)
  );

}


function updateSummary() {

  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);
  const hadir = integerValue(hadirEl);
  const total = calculateTotal();

  if ($("summaryMeja")) {
    $("summaryMeja").textContent =
      `${meja} × RM2,000`;
  }

  if ($("summaryKerusi")) {
    $("summaryKerusi").textContent =
      `${kerusi} × RM200`;
  }

  if ($("summaryTotal")) {
    $("summaryTotal").textContent =
      money(total);
  }

  if ($("reviewMeja")) {
    $("reviewMeja").textContent =
      meja;
  }

  if ($("reviewKerusi")) {
    $("reviewKerusi").textContent =
      kerusi;
  }

  if ($("reviewHadir")) {
    $("reviewHadir").textContent =
      `${hadir} orang`;
  }

  if ($("reviewTotal")) {
    $("reviewTotal").textContent =
      money(total);
  }

  if ($("paymentTotal")) {
    $("paymentTotal").textContent =
      money(total);
  }

  if ($("successTotal")) {
    $("successTotal").textContent =
      money(total);
  }

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

  const mainFields = [
    $("nama"),
    $("telefon"),
    $("status"),
    $("jenisKehadiran")
  ];


  for (const field of mainFields) {

    if (!field) continue;

    if (!field.checkValidity()) {

      field.reportValidity();
      field.focus();

      return false;
    }

  }


  /* Jawatan / organisasi */

  if (
    statusEl &&
    statusEl.value === "Jawatan / Organisasi"
  ) {

    const jawatanEl = $("jawatan");

    if (
      jawatanEl &&
      !jawatanEl.value.trim()
    ) {

      alert(
        "Sila masukkan jawatan / organisasi."
      );

      jawatanEl.focus();

      return false;
    }

  }


  /* Meja / kerusi */

  const meja =
    integerValue(mejaEl);

  const kerusi =
    integerValue(kerusiEl);


  if (
    meja === 0 &&
    kerusi === 0
  ) {

    alert(
      "Sila masukkan sekurang-kurangnya 1 meja atau 1 kerusi."
    );

    mejaEl.focus();

    return false;
  }


  /* Pengesahan */

  const pengesahan =
    $("pengesahan");


  if (
    pengesahan &&
    !pengesahan.checked
  ) {

    alert(
      "Sila tandakan pengesahan maklumat."
    );

    pengesahan.focus();

    return false;
  }


  /* Kehadiran */

  const hadir =
    integerValue(hadirEl);

  const infaq =
    integerValue(infaqEl);


  if (
    (hadir + infaq) === 0
  ) {

    alert(
      "Sila masukkan jumlah orang yang hadir atau diinfaqkan."
    );

    hadirEl.focus();

    return false;
  }


  return true;

}


/* ================================
   STATUS / JAWATAN
================================ */

if (statusEl) {

  statusEl.addEventListener(
    "change",
    () => {

      const wrap =
        $("jawatanWrap");

      const jawatanEl =
        $("jawatan");


      if (
        statusEl.value ===
        "Jawatan / Organisasi"
      ) {

        if (wrap) {
          wrap.classList.remove(
            "hidden"
          );
        }

        if (jawatanEl) {
          jawatanEl.required = true;
        }

      } else {

        if (wrap) {
          wrap.classList.add(
            "hidden"
          );
        }

        if (jawatanEl) {

          jawatanEl.required =
            false;

          jawatanEl.value =
            "";

        }

      }

    }
  );

}


/* ================================
   LIVE SUMMARY
================================ */

[
  mejaEl,
  kerusiEl,
  hadirEl,
  infaqEl
].forEach((el) => {

  if (!el) return;

  el.addEventListener(
    "input",
    updateSummary
  );

  el.addEventListener(
    "change",
    updateSummary
  );

});


/* ================================
   TERUSKAN KE PEMBAYARAN
================================ */

if (continueBtn) {

  continueBtn.addEventListener(
    "click",
    function () {

      console.log(
        "Butang TERUSKAN KE PEMBAYARAN ditekan."
      );


      if (!validateMain()) {
        return;
      }


      show(paymentSection);


      if ($("paymentTotal")) {

        $("paymentTotal").textContent =
          money(
            calculateTotal()
          );

      }


      paymentSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );

}


/* ================================
   SUBMIT PENDAFTARAN
================================ */

if (submitBtn) {

  submitBtn.addEventListener(
    "click",
    submitRegistration
  );

}


async function submitRegistration() {

  if ($("formError")) {
    $("formError").textContent = "";
  }


  const fileInput =
    $("resit");


  const file =
    fileInput &&
    fileInput.files
      ? fileInput.files[0]
      : null;


  /* ================================
     SEMAK RESIT
  ================================= */

  if (!file) {

    if ($("formError")) {

      $("formError").textContent =
        "Sila pilih bukti pembayaran.";

    }

    if (fileInput) {
      fileInput.focus();
    }

    return;
  }


  /* Format */

  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];


  if (
    !allowed.includes(
      file.type
    )
  ) {

    if ($("formError")) {

      $("formError").textContent =
        "Format fail tidak dibenarkan. Sila gunakan PDF, JPG atau PNG.";

    }

    fileInput.value = "";

    return;
  }


  /* Saiz */

  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    if ($("formError")) {

      $("formError").textContent =
        "Saiz fail maksimum ialah 5MB.";

    }

    fileInput.value = "";

    return;
  }


  /* URL */

  if (
    !APPS_SCRIPT_URL ||
    APPS_SCRIPT_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    if ($("formError")) {

      $("formError").textContent =
        "URL Google Apps Script belum ditetapkan.";

    }

    return;
  }


  /* ================================
     MULA PROSES
  ================================= */

  submitBtn.disabled = true;

  submitBtn.textContent =
    "MEMPROSES...";


  hide(paymentSection);

  show(loadingSection);


  try {

    const base64 =
      await fileToBase64(file);


    const payload = {

      nama:
        $("nama").value.trim(),

      telefon:
        $("telefon").value.trim(),

      status:
        $("status").value,

      jawatan:
        $("jawatan")
          ? $("jawatan").value.trim()
          : "",

      bilanganMeja:
        integerValue(mejaEl),

      bilanganKerusi:
        integerValue(kerusiEl),

      jenisKehadiran:
        $("jenisKehadiran").value,

      jumlahHadir:
        integerValue(hadirEl),

      jumlahInfaqHadir:
        integerValue(infaqEl),

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


    console.log(
      "Data dihantar ke Apps Script."
    );


    postToAppsScript(
      payload
    );


  } catch (err) {

    hide(loadingSection);

    show(paymentSection);


    submitBtn.disabled =
      false;

    submitBtn.textContent =
      "HANTAR PENDAFTARAN";


    if ($("formError")) {

      $("formError").textContent =
        "Gagal membaca fail: " +
        err.message;

    }

  }

}


/* ================================
   FILE → BASE64
================================ */

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        const result =
          String(
            reader.result
          );


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


      reader.onerror = () => {

        reject(
          new Error(
            "Fail tidak dapat dibaca."
          )
        );

      };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* ================================
   POST KE GOOGLE APPS SCRIPT
================================ */

function postToAppsScript(
  data
) {

  const iframe =
    $("gasResponseFrame");


  if (!iframe) {

    throw new Error(
      "gasResponseFrame tidak dijumpai dalam HTML."
    );

  }


  /*
    Pastikan iframe mempunyai nama.
  */

  if (!iframe.name) {

    iframe.name =
      "gasResponseFrame";

  }


  const tempForm =
    document.createElement(
      "form"
    );


  tempForm.method =
    "POST";


  tempForm.action =
    APPS_SCRIPT_URL;


  tempForm.target =
    iframe.name;


  tempForm.enctype =
    "application/x-www-form-urlencoded";


  tempForm.style.display =
    "none";


  Object.entries(data)
    .forEach(
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
          typeof value === "string"

            ? value

            : JSON.stringify(
                value
              );


        tempForm.appendChild(
          input
        );

      }
    );


  document.body.appendChild(
    tempForm
  );


  console.log(
    "Menghantar data ke:",
    APPS_SCRIPT_URL
  );


  tempForm.submit();


  /*
    Jangan terus remove terlalu cepat.
    Beri browser sedikit masa untuk
    memulakan POST.
  */

  setTimeout(
    () => {

      if (
        tempForm.parentNode
      ) {

        tempForm.parentNode.removeChild(
          tempForm
        );

      }

    },
    1000
  );

}


/* ================================
   POPUP BERJAYA
================================ */

function showSuccessPopup(
  data
) {

  /*
    Buang popup lama jika ada.
  */

  const oldPopup =
    document.getElementById(
      "mms30SuccessPopup"
    );


  if (oldPopup) {
    oldPopup.remove();
  }


  const nama =
    $("nama")
      ? $("nama").value.trim()
      : "-";


  const telefon =
    $("telefon")
      ? $("telefon").value.trim()
      : "-";


  const meja =
    integerValue(
      mejaEl
    );


  const kerusi =
    integerValue(
      kerusiEl
    );


  const hadir =
    integerValue(
      hadirEl
    );


  const infaq =
    integerValue(
      infaqEl
    );


  const jumlahHadir =
    hadir + infaq;


  const total =
    Number(
      data.total ||
      calculateTotal()
    );


  const reference =
    data.reference ||
    "-";


  /*
    Overlay
  */

  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "mms30SuccessPopup";


  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;


  /*
    Kotak popup
  */

  const box =
    document.createElement(
      "div"
    );


  box.style.cssText = `
    width: min(520px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: #ffffff;
    border-radius: 18px;
    padding: 28px;
    box-sizing: border-box;
    box-shadow: 0 20px 60px rgba(0,0,0,0.30);
    font-family: Arial, sans-serif;
    text-align: left;
  `;


  /*
    Tajuk
  */

  const title =
    document.createElement(
      "div"
    );


  title.innerHTML = `
    <div style="
      width:64px;
      height:64px;
      border-radius:50%;
      background:#e8f7ee;
      color:#07883f;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:34px;
      font-weight:bold;
      margin:0 auto 14px;
    ">✓</div>

    <div style="
      text-align:center;
      color:#07883f;
      font-size:24px;
      font-weight:800;
      margin-bottom:8px;
    ">
      PENDAFTARAN BERJAYA
    </div>

    <div style="
      text-align:center;
      color:#444;
      font-size:15px;
      line-height:1.5;
      margin-bottom:22px;
    ">
      Maklumat pendaftaran dan bukti pembayaran
      telah berjaya diterima dan disimpan dalam sistem.
    </div>
  `;


  box.appendChild(
    title
  );


  /*
    Maklumat
  */

  const info =
    document.createElement(
      "div"
    );


  info.style.cssText = `
    border: 1px solid #d9eadf;
    background: #f5fbf7;
    border-radius: 12px;
    overflow: hidden;
  `;


  const rows = [

    [
      "Nama",
      nama
    ],

    [
      "No. Rujukan",
      reference
    ],

    [
      "No. Telefon",
      telefon
    ],

    [
      "Bilangan Meja",
      meja
    ],

    [
      "Bilangan Kerusi",
      kerusi
    ],

    [
      "Jumlah Kehadiran",
      `${jumlahHadir} orang`
    ],

    [
      "Jumlah Bayaran",
      money(total)
    ]

  ];


  rows.forEach(
    ([label, value]) => {

      const row =
        document.createElement(
          "div"
        );


      row.style.cssText = `
        display:flex;
        justify-content:space-between;
        gap:20px;
        padding:11px 14px;
        border-bottom:1px solid #e2eee6;
        font-size:14px;
      `;


      row.innerHTML = `
        <span style="
          color:#555;
        ">
          ${escapeHtml(label)}
        </span>

        <strong style="
          color:#222;
          text-align:right;
        ">
          ${escapeHtml(String(value))}
        </strong>
      `;


      info.appendChild(
        row
      );

    }
  );


  box.appendChild(
    info
  );


  /*
    Status resit
  */

  const receiptStatus =
    document.createElement(
      "div"
    );


  receiptStatus.innerHTML = `
    <div style="
      margin-top:16px;
      padding:12px 14px;
      border-radius:10px;
      background:#eef8f1;
      color:#087b3c;
      font-size:14px;
      line-height:1.5;
    ">
      ✓ <strong>Bukti pembayaran telah diterima.</strong><br>
      Pendaftaran telah direkodkan dalam sistem.
    </div>
  `;


  box.appendChild(
    receiptStatus
  );


  /*
    PDF
  */

  if (data.pdfUrl) {

    const pdfWrap =
      document.createElement(
        "div"
      );


    pdfWrap.style.cssText = `
      text-align:center;
      margin-top:18px;
    `;


    const pdfLink =
      document.createElement(
        "a"
      );


    pdfLink.href =
      data.pdfUrl;


    pdfLink.target =
      "_blank";


    pdfLink.rel =
      "noopener noreferrer";


    pdfLink.textContent =
      "📄 LIHAT / SIMPAN PDF PENGESAHAN";


    pdfLink.style.cssText = `
      display:inline-block;
      background:#07883f;
      color:#ffffff;
      text-decoration:none;
      padding:12px 18px;
      border-radius:8px;
      font-weight:bold;
      font-size:14px;
    `;


    pdfWrap.appendChild(
      pdfLink
    );


    box.appendChild(
      pdfWrap
    );

  }


  /*
    Nota
  */

  const note =
    document.createElement(
      "div"
    );


  note.innerHTML = `
    <div style="
      margin-top:18px;
      text-align:center;
      color:#666;
      font-size:13px;
      line-height:1.5;
    ">
      Sila simpan <strong>${escapeHtml(reference)}</strong>
      untuk tujuan semakan pada masa akan datang.
    </div>
  `;


  box.appendChild(
    note
  );


  /*
    Butang tutup
  */

  const closeWrap =
    document.createElement(
      "div"
    );


  closeWrap.style.cssText = `
    text-align:center;
    margin-top:20px;
  `;


  const closeBtn =
    document.createElement(
      "button"
    );


  closeBtn.type =
    "button";


  closeBtn.textContent =
    "TUTUP";


  closeBtn.style.cssText = `
    border:0;
    background:#eeeeee;
    color:#333333;
    padding:11px 28px;
    border-radius:8px;
    font-weight:bold;
    cursor:pointer;
    font-size:14px;
  `;


  closeBtn.addEventListener(
    "click",
    () => {

      overlay.remove();

    }
  );


  closeWrap.appendChild(
    closeBtn
  );


  box.appendChild(
    closeWrap
  );


  overlay.appendChild(
    box
  );


  document.body.appendChild(
    overlay
  );


  /*
    Scroll ke atas
  */

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ================================
   ESCAPE HTML
================================ */

function escapeHtml(
  value
) {

  return String(
    value
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* ================================
   RESPONSE DARIPADA APPS SCRIPT
================================ */

window.addEventListener(
  "message",
  (event) => {

    console.log(
      "Response diterima daripada Apps Script:",
      event.data
    );


    if (
      !event.data ||
      event.data.type !==
        "MMS30_RESULT"
    ) {

      return;

    }


    /*
      Hentikan paparan memproses.
    */

    hide(
      loadingSection
    );


    /* ================================
       BERJAYA
    ================================= */

    if (
      event.data.ok === true
    ) {

      /*
        Pulihkan butang.
      */

      submitBtn.disabled =
        false;

      submitBtn.textContent =
        "HANTAR PENDAFTARAN";


      /*
        Paparkan popup.
      */

      showSuccessPopup(
        event.data
      );


      /*
        Jika successSection lama
        masih ada, sembunyikan.
      */

      hide(
        successSection
      );


      return;

    }


    /* ================================
       RALAT
    ================================= */

    show(
      paymentSection
    );


    submitBtn.disabled =
      false;


    submitBtn.textContent =
      "HANTAR PENDAFTARAN";


    const message =
      event.data.message ||
      "Ralat tidak diketahui.";


    if ($("formError")) {

      $("formError").textContent =
        message;

    }


    paymentSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
);


/* ================================
   INITIAL
================================ */

updateSummary();
