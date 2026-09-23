/* ================================
   CONFIG
================================ */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz2upbhGL900JN2KnOO4P1DRn5NhKG00pbJkuAo9tGxyqPFNJQMNCdlRC0AuBNA4hUx/exec";

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

  return Number.isFinite(n) && n > 0 ? n : 0;
}


function calculateTotal() {
  const meja = integerValue(mejaEl);
  const kerusi = integerValue(kerusiEl);

  return (
    meja * TABLE_PRICE +
    kerusi * CHAIR_PRICE
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
   VALIDATION UTAMA
================================ */

function validateMain() {

  const mainFields = [
    $("nama"),
    $("telefon"),
    $("status"),
    $("jenisKehadiran")
  ];

  for (const field of mainFields) {

    if (!field) {
      continue;
    }

    if (!field.checkValidity()) {

      field.reportValidity();
      field.focus();

      return false;
    }
  }


  /* JAWATAN / ORGANISASI */

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


  /* MEJA / KERUSI */

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


  /* PENGESAHAN */

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


  /* KEHADIRAN */

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


/* ================================
   STATUS / JAWATAN
================================ */

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

          jawatanEl.value = "";
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
].forEach(function (el) {

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


      updateSummary();


      show(paymentSection);


      if ($("paymentTotal")) {

        $("paymentTotal").textContent =
          money(
            calculateTotal()
          );
      }


      if (paymentSection) {

        paymentSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
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

  console.log(
    "Proses penghantaran bermula."
  );


  const formError =
    $("formError");


  if (formError) {
    formError.textContent = "";
  }


  const fileInput =
    $("resit");


  if (!fileInput) {

    alert(
      "Ralat: ruangan bukti pembayaran tidak dijumpai."
    );

    return;
  }


  const file =
    fileInput.files &&
    fileInput.files[0];


  /* ================================
     SEMAK FAIL
  ================================= */

  if (!file) {

    if (formError) {

      formError.textContent =
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

    if (formError) {

      formError.textContent =
        "Format fail tidak dibenarkan. Sila gunakan PDF, JPG atau PNG.";
    }

    fileInput.value = "";

    return;
  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    if (formError) {

      formError.textContent =
        "Saiz fail maksimum ialah 5MB.";
    }

    fileInput.value = "";

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
     PAPAR LOADING
  ================================= */

  if (submitBtn) {

    submitBtn.disabled = true;

    submitBtn.textContent =
      "MEMPROSES...";
  }


  hide(paymentSection);

  show(loadingSection);


  /* ================================
     BACA FAIL
  ================================= */

  try {

    console.log(
      "Membaca fail pembayaran..."
    );


    const base64 =
      await fileToBase64(file);


    console.log(
      "Fail berjaya dibaca."
    );


    /* ================================
       BINA DATA
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
        integerValue(mejaEl),

      bilanganKerusi:
        integerValue(kerusiEl),

      jenisKehadiran:
        $("jenisKehadiran")
          ? $("jenisKehadiran").value
          : "",

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
      "Data pendaftaran disediakan."
    );


    /* ================================
       HANTAR KE APPS SCRIPT
    ================================= */

    postToAppsScript(
      payload
    );


    console.log(
      "Data telah dihantar ke Apps Script."
    );


    /*
      Jangan terus paparkan berjaya.
      Kita tunggu response daripada
      Apps Script melalui iframe.
    */


  } catch (err) {

    console.error(
      "Ralat:",
      err
    );


    hide(loadingSection);

    show(paymentSection);


    if (submitBtn) {

      submitBtn.disabled =
        false;

      submitBtn.textContent =
        "HANTAR PENDAFTARAN";
    }


    if (formError) {

      formError.textContent =
        "Gagal membaca fail: " +
        (
          err.message ||
          err
        );
    }
  }
}


/* ================================
   FILE → BASE64
================================ */

function fileToBase64(file) {

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
            result.indexOf(",");


          if (
            comma >= 0
          ) {

            resolve(
              result.substring(
                comma + 1
              )
            );

          } else {

            resolve(
              result
            );
          }
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


/* ================================
   POST KE GOOGLE APPS SCRIPT
================================ */

function postToAppsScript(
  data
) {

  console.log(
    "Mencari iframe response..."
  );


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


  /*
    Masukkan semua data
    ke dalam hidden input.
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


      /*
        Semua nilai dihantar
        sebagai string.
      */

      input.value =
        String(
          value === undefined ||
          value === null
            ? ""
            : value
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
    "Menghantar POST ke Apps Script..."
  );


  tempForm.submit();


  /*
    Form boleh dibuang selepas submit.
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
    1000
  );
}


/* ================================
   RESPONSE DARIPADA APPS SCRIPT
================================ */

window.addEventListener(
  "message",
  function (event) {

    console.log(
      "Response diterima:",
      event.data
    );


    if (
      !event.data ||
      event.data.type !==
        "MMS30_RESULT"
    ) {

      return;
    }


    /* ================================
       HILANGKAN LOADING
    ================================= */

    hide(
      loadingSection
    );


    /* ================================
       BERJAYA
    ================================= */

    if (
      event.data.ok === true
    ) {

      console.log(
        "Pendaftaran berjaya."
      );


      hide(
        paymentSection
      );


      show(
        successSection
      );


      /*
        No. rujukan
      */

      if (
        $("referenceNumber")
      ) {

        $("referenceNumber")
          .textContent =
            event.data.reference ||
            "-";
      }


      /*
        Jumlah
      */

      if (
        $("successTotal")
      ) {

        $("successTotal")
          .textContent =
            money(
              event.data.total ||
              calculateTotal()
            );
      }


      /*
        Jika HTML mempunyai
        ruangan nama
      */

      if (
        $("successNama") &&
        event.data.nama
      ) {

        $("successNama")
          .textContent =
            event.data.nama;
      }


      /*
        Jika HTML mempunyai
        ruangan meja
      */

      if (
        $("successMeja") &&
        event.data.bilanganMeja !==
          undefined
      ) {

        $("successMeja")
          .textContent =
            event.data.bilanganMeja;
      }


      /*
        Jika HTML mempunyai
        ruangan kerusi
      */

      if (
        $("successKerusi") &&
        event.data.bilanganKerusi !==
          undefined
      ) {

        $("successKerusi")
          .textContent =
            event.data.bilanganKerusi;
      }


      /*
        Jika HTML mempunyai
        ruangan jumlah hadir
      */

      if (
        $("successHadir") &&
        event.data.jumlahHadir !==
          undefined
      ) {

        $("successHadir")
          .textContent =
            event.data.jumlahHadir;
      }


      /*
        Jika HTML mempunyai
        ruangan infaq
      */

      if (
        $("successInfaq") &&
        event.data.jumlahInfaqHadir !==
          undefined
      ) {

        $("successInfaq")
          .textContent =
            event.data.jumlahInfaqHadir;
      }


      /*
        Pautan PDF
      */

      const pdf =
        $("pdfLink");


      if (
        pdf &&
        event.data.pdfUrl
      ) {

        pdf.href =
          event.data.pdfUrl;

        pdf.target =
          "_blank";

        pdf.rel =
          "noopener noreferrer";

        pdf.style.display =
          "inline-flex";

      } else if (pdf) {

        pdf.style.display =
          "none";
      }


      /*
        Reset butang
      */

      if (submitBtn) {

        submitBtn.disabled =
          false;

        submitBtn.textContent =
          "HANTAR PENDAFTARAN";
      }


      /*
        Scroll ke bahagian berjaya
      */

      if (
        successSection
      ) {

        successSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      } else {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }


      return;
    }


    /* ================================
       GAGAL
    ================================= */

    console.error(
      "Apps Script memulangkan ralat:",
      event.data.message
    );


    show(
      paymentSection
    );


    if (submitBtn) {

      submitBtn.disabled =
        false;

      submitBtn.textContent =
        "HANTAR PENDAFTARAN";
    }


    const formError =
      $("formError");


    if (formError) {

      formError.textContent =
        event.data.message ||
        "Ralat tidak diketahui berlaku.";
    }


    if (
      paymentSection
    ) {

      paymentSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }
);


/* ================================
   INITIAL
================================ */

updateSummary();
