/* =====================================================
   MAJLIS MAKAN MALAM 30 TAHUN PAS SARAWAK 2026
   SCRIPT.JS - VERSI AKHIR
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz2upbhGL900JN2KnOO4P1DRn5NhKG00pbJkuAo9tGxyqPFNJQMNCdlRC0AuBNA4hUx/exec";

const TABLE_PRICE = 1000;
const CHAIR_PRICE = 250;
const MAX_FILE_SIZE = 5 * 1024 * 1024;


/* =====================================================
   ELEMENT HELPER
===================================================== */

const $ = (id) => document.getElementById(id);


/* =====================================================
   ELEMENTS
===================================================== */

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

const responseFrame = $("gasResponseFrame");


/* =====================================================
   HELPER - DUIT
===================================================== */

function money(value) {

  return "RM" +
    Number(value || 0).toLocaleString(
      "ms-MY",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}


/* =====================================================
   HELPER - INTEGER
===================================================== */

function integerValue(el) {

  if (!el) {
    return 0;
  }

  const n =
    parseInt(
      el.value,
      10
    );

  return Number.isFinite(n) && n > 0
    ? n
    : 0;
}


/* =====================================================
   KIRA JUMLAH
===================================================== */

function calculateTotal() {

  const meja =
    integerValue(mejaEl);

  const kerusi =
    integerValue(kerusiEl);

  return (
    meja * TABLE_PRICE
  ) + (
    kerusi * CHAIR_PRICE
  );
}


/* =====================================================
   UPDATE RINGKASAN
===================================================== */

function updateSummary() {

  const meja =
    integerValue(mejaEl);

  const kerusi =
    integerValue(kerusiEl);

  const hadir =
    integerValue(hadirEl);

  const total =
    calculateTotal();


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


/* =====================================================
   SHOW
===================================================== */

function show(el) {

  if (el) {

    el.classList.remove(
      "hidden"
    );
  }
}


/* =====================================================
   HIDE
===================================================== */

function hide(el) {

  if (el) {

    el.classList.add(
      "hidden"
    );
  }
}


/* =====================================================
   RESET BUTTON
===================================================== */

function resetSubmitButton() {

  if (!submitBtn) {
    return;
  }

  submitBtn.disabled =
    false;

  submitBtn.textContent =
    "HANTAR PENDAFTARAN";
}


/* =====================================================
   VALIDASI UTAMA
===================================================== */

function validateMain() {

  const mainFields = [

    $("nama"),

    $("telefon"),

    $("status"),

    $("jenisKehadiran")
  ];


  for (
    const field
    of mainFields
  ) {

    if (!field) {
      continue;
    }


    if (!field.checkValidity()) {

      field.reportValidity();

      field.focus();

      return false;
    }
  }


  /* ================================
     JAWATAN / ORGANISASI
  ================================= */

  if (
    statusEl &&
    statusEl.value ===
      "Jawatan / Organisasi"
  ) {

    const jawatanEl =
      $("jawatan");


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


  /* ================================
     MEJA / KERUSI
  ================================= */

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

    if (mejaEl) {
      mejaEl.focus();
    }

    return false;
  }


  /* ================================
     PENGESAHAN
  ================================= */

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


  /* ================================
     KEHADIRAN
  ================================= */

  const hadir =
    integerValue(hadirEl);

  const infaq =
    integerValue(infaqEl);


  if (
    hadir + infaq === 0
  ) {

    alert(
      "Sila masukkan jumlah orang yang hadir atau diinfaqkan."
    );

    if (hadirEl) {
      hadirEl.focus();
    }

    return false;
  }


  return true;
}


/* =====================================================
   STATUS / JAWATAN
===================================================== */

if (statusEl) {

  statusEl.addEventListener(
    "change",
    function () {

      const wrap =
        $("jawatanWrap");

      const jawatanEl =
        $("jawatan");


      if (
        this.value ===
        "Jawatan / Organisasi"
      ) {

        if (wrap) {

          wrap.classList.remove(
            "hidden"
          );
        }


        if (jawatanEl) {

          jawatanEl.required =
            true;
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


/* =====================================================
   LIVE SUMMARY
===================================================== */

[
  mejaEl,
  kerusiEl,
  hadirEl,
  infaqEl

].forEach(
  function (el) {

    if (!el) {
      return;
    }


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


/* =====================================================
   TERUSKAN KE PEMBAYARAN
===================================================== */

if (continueBtn) {

  continueBtn.addEventListener(
    "click",
    function () {

      console.log(
        "TERUSKAN KE PEMBAYARAN ditekan."
      );


      if (!validateMain()) {
        return;
      }


      updateSummary();


      show(
        paymentSection
      );


      if (paymentSection) {

        paymentSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  );
}


/* =====================================================
   SUBMIT BUTTON
===================================================== */

if (submitBtn) {

  submitBtn.addEventListener(
    "click",
    submitRegistration
  );
}


/* =====================================================
   SUBMIT PENDAFTARAN
===================================================== */

async function submitRegistration() {

  console.log(
    "Mula proses pendaftaran..."
  );


  const formError =
    $("formError");


  if (formError) {

    formError.textContent =
      "";
  }


  /* ================================
     SEMAK FAIL INPUT
  ================================= */

  const fileInput =
    $("resit");


  if (!fileInput) {

    if (formError) {

      formError.textContent =
        "Ralat: ruangan bukti pembayaran tidak dijumpai.";
    }

    return;
  }


  const file =
    fileInput.files &&
    fileInput.files[0];


  if (!file) {

    if (formError) {

      formError.textContent =
        "Sila pilih bukti pembayaran.";
    }

    fileInput.focus();

    return;
  }


  /* ================================
     FORMAT FAIL
  ================================= */

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

    if (formError) {

      formError.textContent =
        "Format fail tidak dibenarkan. Sila gunakan PDF, JPG atau PNG.";
    }

    fileInput.value =
      "";

    return;
  }


  /* ================================
     SAIZ FAIL
  ================================= */

  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    if (formError) {

      formError.textContent =
        "Saiz fail maksimum ialah 5MB.";
    }

    fileInput.value =
      "";

    return;
  }


  /* ================================
     SEMAK URL APPS SCRIPT
  ================================= */

  if (
    !APPS_SCRIPT_URL ||
    APPS_SCRIPT_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    if (formError) {

      formError.textContent =
        "URL Google Apps Script belum ditetapkan.";
    }

    return;
  }


  /* ================================
     LOCK BUTTON
  ================================= */

  submitBtn.disabled =
    true;

  submitBtn.textContent =
    "MEMPROSES...";


  /* ================================
     PAPAR LOADING
  ================================= */

  hide(
    paymentSection
  );

  hide(
    successSection
  );

  show(
    loadingSection
  );


  /* ================================
     SCROLL KE LOADING
  ================================= */

  if (loadingSection) {

    loadingSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  try {

    console.log(
      "Membaca fail pembayaran..."
    );


    const base64 =
      await fileToBase64(
        file
      );


    console.log(
      "Fail berjaya dibaca."
    );


    /* ================================
       BINA PAYLOAD
    ================================= */

    const payload = {

      nama:
        $("nama")
          ? $("nama").value.trim()
          : "",


      telefon:
        $("telefon")
          ? $("telefon").value.trim()
          : "",


      status:
        $("status")
          ? $("status").value
          : "",


      jawatan:
        $("jawatan")
          ? $("jawatan").value.trim()
          : "",


      bilanganMeja:
        integerValue(
          mejaEl
        ),


      bilanganKerusi:
        integerValue(
          kerusiEl
        ),


      jenisKehadiran:
        $("jenisKehadiran")
          ? $("jenisKehadiran").value
          : "",


      jumlahHadir:
        integerValue(
          hadirEl
        ),


      jumlahInfaqHadir:
        integerValue(
          infaqEl
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


    console.log(
      "Data siap dihantar."
    );


    /* ================================
       RESET IFRAME
    ================================= */

    if (responseFrame) {

      responseFrame.style.display =
        "none";

      responseFrame.src =
        "about:blank";
    }


    /* ================================
       HANTAR KE APPS SCRIPT
    ================================= */

    postToAppsScript(
      payload
    );


    console.log(
      "POST berjaya dihantar ke Apps Script."
    );


  } catch (err) {

    console.error(
      "Ralat submit:",
      err
    );


    showSubmitError(
      err &&
      err.message
        ? err.message
        : String(err)
    );
  }
}


/* =====================================================
   FILE → BASE64
===================================================== */

function fileToBase64(
  file
) {

  return new Promise(
    function (
      resolve,
      reject
    ) {

      const reader =
        new FileReader();


      reader.onload =
        function () {

          const result =
            String(
              reader.result
            );


          const comma =
            result.indexOf(
              ","
            );


          resolve(

            comma >= 0

              ? result.substring(
                  comma + 1
                )

              : result
          );
        };


      reader.onerror =
        function () {

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


/* =====================================================
   POST KE GOOGLE APPS SCRIPT
===================================================== */

function postToAppsScript(
  data
) {

  if (!responseFrame) {

    throw new Error(
      "gasResponseFrame tidak dijumpai dalam index.html."
    );
  }


  /*
    Pastikan iframe mempunyai
    nama sasaran.
  */

  responseFrame.name =
    "gasResponseFrame";


  /*
    Iframe sengaja DISEMBUNYIKAN.
    Ia hanya menjadi saluran response.
  */

  responseFrame.style.display =
    "none";


  /*
    Buang iframe lama jika ada
    dan bina form POST baharu.
  */

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


  /*
    Masukkan semua data.
  */

  Object.entries(
    data
  ).forEach(
    function (
      entry
    ) {

      const key =
        entry[0];

      const value =
        entry[1];


      const input =
        document.createElement(
          "input"
        );


      input.type =
        "hidden";


      input.name =
        key;


      input.value =
        value === undefined ||
        value === null

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


  console.log(
    "POST dihantar ke Apps Script."
  );


  /*
    Hantar.
  */

  tempForm.submit();


  /*
    Jangan terus buang form terlalu cepat.
    Biarkan browser menyelesaikan submission.
  */

  setTimeout(
    function () {

      if (
        tempForm.parentNode
      ) {

        tempForm.parentNode.removeChild(
          tempForm
        );
      }

    },
    3000
  );
}


/* =====================================================
   TERIMA RESPONSE DARIPADA APPS SCRIPT
===================================================== */

window.addEventListener(
  "message",
  function (event) {

    console.log(
      "Message diterima:",
      event.data
    );


    /*
      Pastikan response mempunyai
      format MMS30_RESULT.
    */

    if (
      !event.data ||
      event.data.type !==
        "MMS30_RESULT"
    ) {

      return;
    }


    const result =
      event.data;


    /* ================================
       PROSES SUDAH SELESAI
    ================================= */

    hide(
      loadingSection
    );


    /* ================================
       JIKA BERJAYA
    ================================= */

    if (
      result.ok === true
    ) {

      hide(
        paymentSection
      );


      show(
        successSection
      );


      /*
        NOMBOR RUJUKAN
      */

      const referenceEl =
        $("referenceNumber");


      if (referenceEl) {

        referenceEl.textContent =
          result.reference ||
          "-";
      }


      /*
        JUMLAH
      */

      const successTotalEl =
        $("successTotal");


      if (successTotalEl) {

        successTotalEl.textContent =
          money(
            result.total ||
            calculateTotal()
          );
      }


      /*
        PAUTAN PDF
      */

      const pdf =
        $("pdfLink");


      if (
        pdf &&
        result.pdfUrl
      ) {

        pdf.href =
          result.pdfUrl;

        pdf.style.display =
          "inline-flex";

        pdf.target =
          "_blank";

        pdf.rel =
          "noopener";
      }


      /*
        RESET BUTTON
      */

      resetSubmitButton();


      /*
        SCROLL KE SUCCESS
      */

      if (successSection) {

        successSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }


      console.log(
        "Pendaftaran berjaya:",
        result.reference
      );


      return;
    }


    /* ================================
       JIKA GAGAL
    ================================= */

    showSubmitError(
      result.message ||
      "Pendaftaran tidak berjaya. Sila cuba semula."
    );

  }
);


/* =====================================================
   PAPAR RALAT
===================================================== */

function showSubmitError(
  message
) {

  hide(
    loadingSection
  );


  show(
    paymentSection
  );


  resetSubmitButton();


  const formError =
    $("formError");


  if (formError) {

    formError.textContent =
      message ||
      "Ralat tidak diketahui.";
  }


  if (paymentSection) {

    paymentSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  console.error(
    "Ralat pendaftaran:",
    message
  );
}


/* =====================================================
   INITIAL
===================================================== */

updateSummary();


console.log(
  "script.js versi akhir dimuatkan."
);
