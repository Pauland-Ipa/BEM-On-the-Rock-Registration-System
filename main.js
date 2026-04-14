/* ═══════════════════════════════════════════════
   BEM On The Rock — main.js
═══════════════════════════════════════════════ */

"use strict";

// ── DOM Ready ──────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  buildYearDropdown();
  buildBaptismYearPicker();
  setFooterYear();
  loadDraft();
  bindEvents();
  bindPhotoUpload();
  bindMaritalStatus();
  bindKomselValidation();
  initBehalfMode();
});

// ═══════════════════════════════════════════════
// 1. YEAR DROPDOWN — 2001 to current year (descending)
// ═══════════════════════════════════════════════
function buildYearDropdown() {
  const select = document.getElementById("yearJoining");
  if (!select) return;
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2001; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

// ═══════════════════════════════════════════════
// 1b. BAPTISM YEAR GRID PICKER (1920 → current year)
// ═══════════════════════════════════════════════
let baptismPickerPage = 0; // page of 12 years
const BAPTISM_START = 1920;

function buildBaptismYearPicker() {
  const currentYear = new Date().getFullYear();
  const totalYears  = currentYear - BAPTISM_START + 1;
  const totalPages  = Math.ceil(totalYears / 12);
  baptismPickerPage = totalPages - 1; // start at most recent page

  const display  = document.getElementById("baptismYearDisplay");
  const dropdown = document.getElementById("baptismYearDropdown");
  if (!display || !dropdown) return;

  display.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    display.classList.toggle("open");
    renderBaptismYearGrid();
  });

  document.getElementById("baptismYearPrev")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (baptismPickerPage > 0) { baptismPickerPage--; renderBaptismYearGrid(); }
  });

  document.getElementById("baptismYearNext")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const total = Math.ceil((new Date().getFullYear() - BAPTISM_START + 1) / 12);
    if (baptismPickerPage < total - 1) { baptismPickerPage++; renderBaptismYearGrid(); }
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
    display.classList.remove("open");
  });
}

function renderBaptismYearGrid() {
  const grid    = document.getElementById("baptismYearGrid");
  const navLabel= document.getElementById("baptismYearNavLabel");
  const currentYear = new Date().getFullYear();
  if (!grid) return;

  const start = BAPTISM_START + baptismPickerPage * 12;
  const end   = Math.min(start + 11, currentYear);
  navLabel.textContent = `${start} – ${end}`;

  grid.innerHTML = "";
  for (let y = start; y <= start + 11; y++) {
    const div = document.createElement("div");
    div.className = "year-grid-item" + (y > currentYear ? " future" : "");
    div.textContent = y;
    const saved = document.getElementById("baptismYear")?.value;
    if (saved && parseInt(saved) === y) div.classList.add("selected");
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("baptismYear").value = y;
      document.getElementById("baptismYearLabel").textContent = y;
      document.getElementById("baptismYearDropdown").classList.remove("open");
      document.getElementById("baptismYearDisplay").classList.remove("open");
      grid.querySelectorAll(".year-grid-item").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      saveDraft();
      checkNextButton();
    });
    grid.appendChild(div);
  }
}

// ═══════════════════════════════════════════════
// 1c. FOOTER YEAR
// ═══════════════════════════════════════════════
function setFooterYear() {
  const el = document.getElementById("footerYear");
  if (el) el.textContent = new Date().getFullYear();
}

// ═══════════════════════════════════════════════
// 1d. PHOTO UPLOAD
// ═══════════════════════════════════════════════
let photoDataURL = null;

function bindPhotoUpload() {
  const input   = document.getElementById("photoUpload");
  const preview = document.getElementById("photoPreviewImg");
  const previewWrap = document.getElementById("photoPreviewWrap");
  const label   = document.getElementById("photoUploadLabel");
  const changeBtn = document.getElementById("photoChangeBtn");
  const errEl   = document.getElementById("err-photo");
  if (!input) return;

  input.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      errEl.textContent = "Saiz fail melebihi 2MB / File size exceeds 2MB";
      return;
    }
    errEl.textContent = "";
    const reader = new FileReader();
    reader.onload = (e) => {
      photoDataURL = e.target.result;
      preview.src  = photoDataURL;
      previewWrap.classList.add("visible");
      label.style.display = "none";
      saveDraft();
    };
    reader.readAsDataURL(file);
  });

  changeBtn?.addEventListener("click", () => {
    photoDataURL = null;
    preview.src  = "";
    previewWrap.classList.remove("visible");
    label.style.display = "";
    input.value = "";
  });
}

// ═══════════════════════════════════════════════
// 1e. MARITAL STATUS CONDITIONALS
// ═══════════════════════════════════════════════
function bindMaritalStatus() {
  const select = document.getElementById("maritalStatus");
  if (!select) return;
  select.addEventListener("change", function() {
    const partnerField     = document.getElementById("partnerNameField");
    const latePartnerField = document.getElementById("latePartnerNameField");
    const v = this.value;
    partnerField?.classList.toggle("visible",     v === "engaged" || v === "married");
    latePartnerField?.classList.toggle("visible", v === "widowed");
    if (v !== "engaged" && v !== "married") document.getElementById("partnerName").value = "";
    if (v !== "widowed") document.getElementById("latePartnerName").value = "";
    saveDraft();
    checkNextButton();
  });
}

// ═══════════════════════════════════════════════
// 1f. VALID CELL GROUP CODES
// ═══════════════════════════════════════════════
const VALID_CELL_CODES = (() => {
  const codes = [];
  const add = (prefix, max) => {
    for (let i = 1; i <= max; i++) codes.push(prefix + i);
  };
  add("SN", 15); add("ZV", 13); add("ZPA", 7); add("ZPB", 8);
  add("ZPC", 5); add("ZPD", 9); add("ZT", 15); add("SA", 10);
  add("SB", 9);  add("ZC", 5);
  return codes;
})();

function normaliseKomsel(val) {
  return val.toUpperCase().replace(/\s+/g, "");
}

function isValidKomsel(val) {
  const norm = normaliseKomsel(val);
  return VALID_CELL_CODES.some(c => normaliseKomsel(c) === norm);
}

function bindKomselValidation() {
  const input = document.getElementById("komselCode");
  const badge = document.getElementById("komselValidBadge");
  if (!input || !badge) return;
  input.addEventListener("input", function() {
    this.value = this.value.toUpperCase();
    const val  = this.value.trim();
    if (!val) { badge.className = "komsel-valid-badge"; return; }
    if (isValidKomsel(val)) {
      badge.className = "komsel-valid-badge valid";
      badge.textContent = "✓ Kod sah / Valid code";
    } else {
      badge.className = "komsel-valid-badge invalid";
      badge.textContent = "✗ Kod tidak sah / Invalid code";
    }
    saveDraft();
    checkNextButton();
  });
}

// ═══════════════════════════════════════════════
// 1g. UNIQUE ID GENERATION
// Format: Initials-Last4IC-YearJoinedShort
// ═══════════════════════════════════════════════
function generateUniqueID(fullName, icNo, yearJoining) {
  const names    = (fullName || "").trim().split(/\s+/).filter(Boolean);
  const initials = names.map(n => n[0].toUpperCase()).join("");
  const ic       = (icNo || "").replace(/-/g, "");
  const last4    = ic.length >= 4 ? ic.slice(-4) : ic.padStart(4, "0");
  const yr       = String(yearJoining || "").slice(-2);
  return `${initials}-${last4}-${yr}`;
}

// ═══════════════════════════════════════════════
// 1h. BEHALF MODE — conditional rendering
// ═══════════════════════════════════════════════
const IS_BEHALF_MODE = new URLSearchParams(window.location.search).get("mode") === "behalf";

function initBehalfMode() {
  if (!IS_BEHALF_MODE) return;

  const behalfSections = document.getElementById("behalfSections");
  if (behalfSections) behalfSections.style.display = "block";

  // Show registrant info
  const regIC   = sessionStorage.getItem("behalf_registrant_ic")   || "";
  const regName = sessionStorage.getItem("behalf_registrant_name") || "";
  const display = document.getElementById("behalfRegistrantDisplay");
  if (display) display.textContent = regName ? `${regName} (${regIC})` : regIC;

  // Change Full Name label
  const lbl = document.getElementById("fullNameLabel");
  if (lbl) lbl.innerHTML = `Nama Penuh Yang Ingin Didaftar <span class="label-en">/ Name Of The One To Be Registered</span>`;

  // Change header subtitle
  const subtitle = document.querySelector(".church-subtitle");
  if (subtitle) subtitle.textContent = "Pendaftaran Bagi Pihak Orang Lain / Registration On Others' Behalf";

  // Behalf reason — show/hide "other reason" field
  document.querySelectorAll('input[name="behalfReason"]').forEach(r => {
    r.addEventListener("change", function() {
      const otherField = document.getElementById("behalfOtherReasonField");
      if (this.value === "others") {
        otherField.classList.add("visible");
      } else {
        otherField.classList.remove("visible");
        const inp = document.getElementById("behalfOtherReason");
        if (inp) inp.value = "";
      }
    });
  });
}


function parseICToDOB(ic) {
  // Remove dashes
  const clean = ic.replace(/-/g, "");
  if (clean.length < 6) return null;

  const yy = clean.substring(0, 2);
  const mm = clean.substring(2, 4);
  const dd = clean.substring(4, 6);

  // Determine century: if yy > current 2-digit year, assume 1900s
  const currentYY = new Date().getFullYear() % 100;
  const year = parseInt(yy) > currentYY ? `19${yy}` : `20${yy}`;

  // Validate month and day ranges
  const month = parseInt(mm);
  const day = parseInt(dd);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Return in YYYY-MM-DD format for <input type="date">
  return `${year}-${mm}-${dd}`;
}

// Auto-format IC as user types (adds dashes: XXXXXX-XX-XXXX)
function formatIC(value) {
  const digits = value.replace(/\D/g, "");
  let formatted = digits;
  if (digits.length > 6) formatted = digits.substring(0, 6) + "-" + digits.substring(6);
  if (digits.length > 8) formatted = formatted.substring(0, 9) + "-" + digits.substring(8);
  return formatted.substring(0, 14); // max 14 chars with dashes
}

// ═══════════════════════════════════════════════
// 3. BIND ALL EVENTS
// ═══════════════════════════════════════════════
function bindEvents() {

  // ── IC Input: auto-format + DOB + gender auto-detect ──
  const icInput = document.getElementById("icNo");
  if (icInput) {
    icInput.addEventListener("input", function () {
      const formatted = formatIC(this.value);
      this.value = formatted;

      // Auto-fill DOB
      const dob = parseICToDOB(formatted);
      const dobField = document.getElementById("dob");
      if (dob && dobField) dobField.value = dob;

      // Auto-detect gender from last digit (odd = male, even = female)
      const clean = formatted.replace(/-/g, "");
      if (clean.length === 12) {
        const lastDigit = parseInt(clean[11]);
        const genderMale   = document.getElementById("genderMale");
        const genderFemale = document.getElementById("genderFemale");
        if (genderMale && genderFemale && !genderMale.checked && !genderFemale.checked) {
          if (lastDigit % 2 !== 0) genderMale.checked   = true;
          else                      genderFemale.checked = true;
        }
      }
      saveDraft();
      checkNextButton();
    });
  }

  // ── Phone: auto-insert dash after first 3 digits ──
  const phoneInput = document.getElementById("phoneNumber");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      let digits = this.value.replace(/\D/g, "");
      if (digits.length > 3) digits = digits.substring(0, 3) + "-" + digits.substring(3);
      this.value = digits.substring(0, 12);
      saveDraft();
      checkNextButton();
    });
  }

  // ── Baptism Status: show/hide year picker ──
  const baptismRadios = document.querySelectorAll('input[name="baptismStatus"]');
  baptismRadios.forEach(radio => {
    radio.addEventListener("change", function () {
      const dateField = document.getElementById("baptismDateField");
      if (this.value === "baptised") {
        dateField.classList.add("visible");
      } else {
        dateField.classList.remove("visible");
        const hid = document.getElementById("baptismYear");
        if (hid) hid.value = "";
        const lbl = document.getElementById("baptismYearLabel");
        if (lbl) lbl.textContent = "-- Pilih Tahun / Select Year --";
        clearError("baptismDate");
      }
      saveDraft();
      checkNextButton();
    });
  });

  // ── Citizenship: show/hide country field ──
  const citizenshipRadios = document.querySelectorAll('input[name="citizenship"]');
  citizenshipRadios.forEach(radio => {
    radio.addEventListener("change", function () {
      const countryField = document.getElementById("countryField");
      if (this.value === "nonCitizen") {
        countryField.classList.add("visible");
      } else {
        countryField.classList.remove("visible");
        const co = document.getElementById("countryOfOrigin");
        if (co) co.value = "";
        clearError("countryOfOrigin");
      }
      saveDraft();
      checkNextButton();
    });
  });

  // ── Auto-save on any section-a input ──
  const allInputs = document.querySelectorAll("#section-a input, #section-a select, #section-a textarea");
  allInputs.forEach(input => {
    input.addEventListener("change", () => { saveDraft(); checkNextButton(); });
    input.addEventListener("input",  () => checkNextButton());
  });

  // ── Next Button — unrestricted for testing ──
  const btnNext = document.getElementById("btnNext");
  if (btnNext) {
    btnNext.disabled = false;
    btnNext.addEventListener("click", () => {
      saveDraft();
      navigateTo("b");
    });
  }

  // ── Step Navigator clicks ──
  document.querySelectorAll(".step").forEach(step => {
    step.addEventListener("click", function () {
      navigateTo(this.dataset.section);
    });
  });

  // Run once on load in case draft was restored
  checkNextButton();
}

// ═══════════════════════════════════════════════
// 3b. CHECK IF REQUIRED FIELDS ARE FILLED — TEMPORARILY BYPASSED
// TODO: Re-enable once all sections A–E are complete
// ═══════════════════════════════════════════════
function checkNextButton() {
  // Temporarily disabled for cross-section testing
  const btn = document.getElementById("btnNext");
  if (btn) btn.disabled = false;
}

// ═══════════════════════════════════════════════
// 4. LOCALSTORAGE DRAFT SAVING & LOADING
// ═══════════════════════════════════════════════
const DRAFT_KEY = "bem_otr_draft_sectionA";

function collectSectionAData() {
  return {
    fullName:        document.getElementById("fullName")?.value || "",
    icNo:            document.getElementById("icNo")?.value || "",
    gender:          document.querySelector('input[name="gender"]:checked')?.value || "",
    dob:             document.getElementById("dob")?.value || "",
    race:            document.getElementById("race")?.value || "",
    maritalStatus:   document.getElementById("maritalStatus")?.value || "",
    partnerName:     document.getElementById("partnerName")?.value || "",
    latePartnerName: document.getElementById("latePartnerName")?.value || "",
    baptismStatus:   document.querySelector('input[name="baptismStatus"]:checked')?.value || "",
    baptismYear:     document.getElementById("baptismYear")?.value || "",
    citizenship:     document.querySelector('input[name="citizenship"]:checked')?.value || "",
    countryOfOrigin: document.getElementById("countryOfOrigin")?.value || "",
    originalChurch:  document.getElementById("originalChurch")?.value || "",
    yearJoining:     document.getElementById("yearJoining")?.value || "",
    komselCode:      document.getElementById("komselCode")?.value || "",
    occupation:      document.getElementById("occupation")?.value || "",
    phoneNumber:     document.getElementById("phoneNumber")?.value || "",
    currentAddress:  document.getElementById("currentAddress")?.value || "",
    memberRole:      document.querySelector('input[name="memberRole"]:checked')?.value || "",
    savedAt:         new Date().toISOString(),
  };
}

function saveDraft() {
  const data = collectSectionAData();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    // Simple text/select fields
    const fieldMap = [
      "fullName", "icNo", "dob", "race",
      "maritalStatus", "baptismDate", "countryOfOrigin",
      "originalChurch", "yearJoining", "komselCode",
      "occupation", "phoneNumber", "currentAddress"
    ];
    fieldMap.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id]) el.value = data[id];
    });

    // Radio: Gender
    if (data.gender) {
      const radio = document.querySelector(`input[name="gender"][value="${data.gender}"]`);
      if (radio) radio.checked = true;
    }

    // Radio: Member Role
    if (data.memberRole) {
      const radio = document.querySelector(`input[name="memberRole"][value="${data.memberRole}"]`);
      if (radio) radio.checked = true;
    }

    // Radio: Baptism Status
    if (data.baptismStatus) {
      const radio = document.querySelector(`input[name="baptismStatus"][value="${data.baptismStatus}"]`);
      if (radio) {
        radio.checked = true;
        if (data.baptismStatus === "baptised") {
          document.getElementById("baptismDateField").classList.add("visible");
        }
      }
    }

    // Radio: Citizenship
    if (data.citizenship) {
      const radio = document.querySelector(`input[name="citizenship"][value="${data.citizenship}"]`);
      if (radio) {
        radio.checked = true;
        if (data.citizenship === "nonCitizen") {
          document.getElementById("countryField").classList.add("visible");
        }
      }
    }

    if (data.savedAt) {
      const d = new Date(data.savedAt);
      showDraftNotice(`📄 Draf dimuat semula / Draft restored (${d.toLocaleDateString()})`);
    }

  } catch (e) {
    console.warn("Could not load draft:", e);
  }
}

function showDraftNotice(msg) {
  const notice = document.getElementById("draftNotice");
  notice.textContent = msg;
  setTimeout(() => { notice.textContent = ""; }, 4000);
}

// ═══════════════════════════════════════════════
// 5. VALIDATION
// ═══════════════════════════════════════════════
function validateSectionA() {
  let isValid = true;

  // Clear all errors first
  document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");
  document.querySelectorAll(".form-input").forEach(el => el.classList.remove("error-state"));

  // Member Role
  if (!document.querySelector('input[name="memberRole"]:checked')) {
    showError("memberRole", STRINGS.requiredField);
    isValid = false;
  }

  // Full Name
  const fullName = document.getElementById("fullName");
  if (!fullName.value.trim()) {
    showError("fullName", STRINGS.requiredField);
    isValid = false;
  }

  // IC No — basic format check
  const icNo = document.getElementById("icNo");
  const icClean = icNo.value.replace(/-/g, "");
  if (!icNo.value.trim()) {
    showError("icNo", STRINGS.requiredField);
    isValid = false;
  } else if (icClean.length !== 12 || isNaN(icClean)) {
    showError("icNo", STRINGS.invalidIC);
    isValid = false;
  }

  // Gender
  if (!document.querySelector('input[name="gender"]:checked')) {
    showError("gender", STRINGS.selectGender);
    isValid = false;
  }

  // DOB
  const dob = document.getElementById("dob");
  if (!dob.value) {
    showError("dob", STRINGS.requiredField);
    isValid = false;
  }

  // Race
  const race = document.getElementById("race");
  if (!race.value.trim()) {
    showError("race", STRINGS.requiredField);
    isValid = false;
  }

  // Marital Status
  const marital = document.getElementById("maritalStatus");
  if (!marital.value) {
    showError("maritalStatus", STRINGS.requiredField);
    isValid = false;
  }

  // Baptism Status
  if (!document.querySelector('input[name="baptismStatus"]:checked')) {
    showError("baptismStatus", STRINGS.selectBaptism);
    isValid = false;
  } else if (document.querySelector('input[name="baptismStatus"]:checked').value === "baptised") {
    const bd = document.getElementById("baptismDate");
    if (!bd.value) {
      showError("baptismDate", STRINGS.requiredField);
      isValid = false;
    }
  }

  // Citizenship
  if (!document.querySelector('input[name="citizenship"]:checked')) {
    showError("citizenship", STRINGS.selectCitizenship);
    isValid = false;
  } else if (document.querySelector('input[name="citizenship"]:checked').value === "nonCitizen") {
    const country = document.getElementById("countryOfOrigin");
    if (!country.value.trim()) {
      showError("countryOfOrigin", STRINGS.requiredField);
      isValid = false;
    }
  }

  // Year Joining
  const year = document.getElementById("yearJoining");
  if (!year.value) {
    showError("yearJoining", STRINGS.requiredField);
    isValid = false;
  }

  // Phone Number
  const phone = document.getElementById("phoneNumber");
  if (!phone.value.trim()) {
    showError("phoneNumber", STRINGS.requiredField);
    isValid = false;
  }

  // Current Address
  const address = document.getElementById("currentAddress");
  if (!address.value.trim()) {
    showError("currentAddress", STRINGS.requiredField);
    isValid = false;
  }

  // Scroll to first error
  if (!isValid) {
    const firstError = document.querySelector(".error-state, .error-msg:not(:empty)");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return isValid;
}

function showError(fieldId, message) {
  const errEl = document.getElementById(`err-${fieldId}`);
  if (errEl) errEl.textContent = message;
  const inputEl = document.getElementById(fieldId);
  if (inputEl) inputEl.classList.add("error-state");
}

function clearError(fieldId) {
  const errEl = document.getElementById(`err-${fieldId}`);
  if (errEl) errEl.textContent = "";
  const inputEl = document.getElementById(fieldId);
  if (inputEl) inputEl.classList.remove("error-state");
}

// ═══════════════════════════════════════════════
// 6. SECTION NAVIGATION
// ═══════════════════════════════════════════════
function navigateTo(sectionId) {
  document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));

  const targetSection = document.getElementById(`section-${sectionId}`);
  const targetStep    = document.getElementById(`step-${sectionId}`);

  if (targetSection) targetSection.classList.add("active");
  if (targetStep)    targetStep.classList.add("active");

  // Sync Section E readonly fields whenever user navigates to E
  if (sectionId === "e") {
    const komselCode = document.getElementById("komselCode");
    const confKomsel = document.getElementById("confessionKomsel");
    if (komselCode && confKomsel) confKomsel.value = komselCode.value;

    const fullName = document.getElementById("fullName");
    const confName = document.getElementById("confessionName");
    if (fullName && confName) confName.value = fullName.value;

    syncConfessionRefs();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ═══════════════════════════════════════════════
// 7. SECTION B — SERVICE TABLE
// ═══════════════════════════════════════════════

const SERVICES = [
  "Pastoral / Pastoral",
  "Pekerja Sepenuh Masa (Gereja) / Full Time Staff (Church)",
  "[Rock Wave] Penyanyi / Singer",
  "[Rock Wave] Pemain Muzik / Musician",
  "[Rock Wave] Penari Kreatif / Creative Dancer",
  "Multimedia / Multimedia",
  "Pengendali Sistem Bunyi / Sound System Handler",
  "Pengendali Pencahayaan / Lighting Handler",
  "Usher / Usher",
  "Keselamatan & Parkir / Security & Parking",
  "Krew Pentas / Stage Crew",
  "Hospitaliti untuk Jemaat Baru / Hospitality for Newcomers",
  "Hospitaliti untuk VIP / Hospitality for VIP",
  "Rock Essence / Rock Essence",
  "Rock Resource / Rock Resource",
  "Kaunter Maklumat / Information Counter",
  "Pengangkutan / Transportation",
  "Pendoa Syafaat / Intercessor",
  "Kebajikan & Sosial / Welfare & Social",
  "Adiwira / Adiwira",
  "Pembantu Peribadi Pastor & Penceramah / Pastoral Personal Assistant & Speaker",
  "Penginjilan / Evangelism",
  "Tim Persembahan / Offering Team",
];

function buildServiceTable() {
  const tbody = document.getElementById("serviceTableBody");
  if (!tbody) return;

  SERVICES.forEach((service, index) => {
    const row = document.createElement("tr");
    const num = index + 1;

    row.innerHTML = `
      <td class="col-num">${num}</td>
      <td class="col-service">${service}</td>
      <td class="col-check">
        <div class="service-check-wrap">
          <input type="checkbox" class="service-checkbox"
            id="svc-have-${num}" name="svc-have-${num}"
            data-index="${num}" data-type="have" />
        </div>
      </td>
      <td class="col-check">
        <div class="service-check-wrap">
          <input type="checkbox" class="service-checkbox"
            id="svc-want-${num}" name="svc-want-${num}"
            data-index="${num}" data-type="want" />
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Enforce mutual exclusivity: can't tick both columns on same row
  tbody.addEventListener("change", function (e) {
    const cb = e.target;
    if (!cb.classList.contains("service-checkbox")) return;
    const idx = cb.dataset.index;
    const type = cb.dataset.type;

    if (cb.checked) {
      const otherType = type === "have" ? "want" : "have";
      const other = document.getElementById(`svc-${otherType}-${idx}`);
      if (other) other.checked = false;
    }

    saveSectionBDraft();
  });
}

// ── Others toggle ──
function bindSectionBEvents() {
  const othersCheck = document.getElementById("othersCheck");
  const othersFields = document.getElementById("othersFields");

  if (othersCheck) {
    othersCheck.addEventListener("change", function () {
      if (this.checked) {
        othersFields.classList.add("visible");
      } else {
        othersFields.classList.remove("visible");
        document.getElementById("othersServiceName").value = "";
        const radios = document.querySelectorAll('input[name="othersInvolvement"]');
        radios.forEach(r => r.checked = false);
        clearError("othersServiceName");
        clearError("othersInvolvement");
      }
      saveSectionBDraft();
    });
  }

  // Back button
  const btnBackB = document.getElementById("btnBackB");
  if (btnBackB) btnBackB.addEventListener("click", () => navigateTo("a"));

  // Next button
  const btnNextB = document.getElementById("btnNextB");
  if (btnNextB) btnNextB.addEventListener("click", () => {
    saveSectionBDraft();
    navigateTo("c");
  });

  // Auto-save on others fields
  const othersName = document.getElementById("othersServiceName");
  if (othersName) othersName.addEventListener("input", saveSectionBDraft);

  const othersRadios = document.querySelectorAll('input[name="othersInvolvement"]');
  othersRadios.forEach(r => r.addEventListener("change", saveSectionBDraft));
}

// ── Draft: save Section B ──
const DRAFT_KEY_B = "bem_otr_draft_sectionB";

function collectSectionBData() {
  const services = {};
  SERVICES.forEach((_, i) => {
    const num = i + 1;
    services[num] = {
      have: document.getElementById(`svc-have-${num}`)?.checked || false,
      want: document.getElementById(`svc-want-${num}`)?.checked || false,
    };
  });
  return {
    services,
    othersChecked:     document.getElementById("othersCheck")?.checked || false,
    othersServiceName: document.getElementById("othersServiceName")?.value || "",
    othersInvolvement: document.querySelector('input[name="othersInvolvement"]:checked')?.value || "",
    savedAt: new Date().toISOString(),
  };
}

function saveSectionBDraft() {
  localStorage.setItem(DRAFT_KEY_B, JSON.stringify(collectSectionBData()));
}

function loadSectionBDraft() {
  const raw = localStorage.getItem(DRAFT_KEY_B);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);

    // Restore service checkboxes
    if (data.services) {
      Object.entries(data.services).forEach(([num, val]) => {
        const haveEl = document.getElementById(`svc-have-${num}`);
        const wantEl = document.getElementById(`svc-want-${num}`);
        if (haveEl) haveEl.checked = val.have;
        if (wantEl) wantEl.checked = val.want;
      });
    }

    // Restore others
    const othersCheck = document.getElementById("othersCheck");
    if (othersCheck && data.othersChecked) {
      othersCheck.checked = true;
      document.getElementById("othersFields").classList.add("visible");
    }
    const othersName = document.getElementById("othersServiceName");
    if (othersName && data.othersServiceName) othersName.value = data.othersServiceName;
    if (data.othersInvolvement) {
      const radio = document.querySelector(`input[name="othersInvolvement"][value="${data.othersInvolvement}"]`);
      if (radio) radio.checked = true;
    }
  } catch (e) {
    console.warn("Could not load Section B draft:", e);
  }
}

// ── Init Section B ──
document.addEventListener("DOMContentLoaded", () => {
  buildServiceTable();
  loadSectionBDraft();
  bindSectionBEvents();
});

// ═══════════════════════════════════════════════
// 8. SECTION C — CHILDREN INFORMATION
// ═══════════════════════════════════════════════

let childCount = 0;
const DRAFT_KEY_C = "bem_otr_draft_sectionC";

function createChildCard(num, data = {}) {
  const card = document.createElement("div");
  card.className = "child-card";
  card.dataset.childNum = num;

  const genderMaleChecked  = data.gender === "male"   ? "checked" : "";
  const genderFemaleChecked = data.gender === "female" ? "checked" : "";

  card.innerHTML = `
    <div class="child-card-header">
      <span class="child-card-title">
        Anak Ke-${num} &nbsp;/&nbsp; Child No. ${num}
      </span>
      <button type="button" class="btn-remove-child" data-child="${num}">
        ✕ Padam / Remove
      </button>
    </div>

    <div class="form-grid">

      <!-- Full Name -->
      <div class="form-group full-width">
        <label class="form-label" for="childName-${num}">
          Nama Penuh Anak <span class="label-en">/ Child's Full Name</span>
        </label>
        <input type="text" id="childName-${num}" name="childName-${num}"
          class="form-input child-field"
          placeholder="Masukkan nama penuh / Enter full name"
          value="${data.name || ''}" />
      </div>

      <!-- Gender -->
      <div class="form-group">
        <label class="form-label">
          Jantina <span class="label-en">/ Gender</span>
        </label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="radio" name="childGender-${num}" value="male" ${genderMaleChecked} />
            <span class="custom-radio"></span>
            Lelaki <em>/ Boy</em>
          </label>
          <label class="checkbox-label">
            <input type="radio" name="childGender-${num}" value="female" ${genderFemaleChecked} />
            <span class="custom-radio"></span>
            Perempuan <em>/ Girl</em>
          </label>
        </div>
      </div>

      <!-- MyKid -->
      <div class="form-group">
        <label class="form-label" for="childMyKid-${num}">
          MyKid <span class="label-en">/ MyKid</span>
        </label>
        <input type="text" id="childMyKid-${num}" name="childMyKid-${num}"
          class="form-input child-field"
          placeholder="cth/e.g. 120131-14-1234"
          value="${data.myKid || ''}" />
      </div>

    </div>
  `;

  // Remove button
  card.querySelector(".btn-remove-child").addEventListener("click", function () {
    card.remove();
    renumberChildren();
    saveSectionCDraft();
  });

  // Auto-save on any input change
  card.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", saveSectionCDraft);
    input.addEventListener("change", saveSectionCDraft);
  });

  return card;
}

function renumberChildren() {
  const cards = document.querySelectorAll(".child-card");
  childCount = cards.length;
  cards.forEach((card, i) => {
    const num = i + 1;
    card.dataset.childNum = num;
    const title = card.querySelector(".child-card-title");
    if (title) title.innerHTML = `Anak Ke-${num} &nbsp;/&nbsp; Child No. ${num}`;
    card.querySelector(".btn-remove-child").dataset.child = num;
  });
}

function addChild(data = {}) {
  childCount++;
  const card = createChildCard(childCount, data);
  document.getElementById("childrenList").appendChild(card);
  saveSectionCDraft();
}

function bindSectionCEvents() {
  document.getElementById("btnAddChild").addEventListener("click", () => {
    addChild();
  });

  document.getElementById("btnBackC").addEventListener("click", () => {
    navigateTo("b");
  });

  document.getElementById("btnNextC").addEventListener("click", () => {
    saveSectionCDraft();
    navigateTo("d");
  });
}

// ── Draft ──
function collectSectionCData() {
  const children = [];
  document.querySelectorAll(".child-card").forEach((card, i) => {
    const num = i + 1;
    const genderEl = card.querySelector(`input[name="childGender-${card.dataset.childNum}"]:checked`);
    children.push({
      name:   card.querySelector(`[id^="childName-"]`)?.value || "",
      gender: genderEl?.value || "",
      myKid:  card.querySelector(`[id^="childMyKid-"]`)?.value || "",
    });
  });
  return { children, savedAt: new Date().toISOString() };
}

function saveSectionCDraft() {
  localStorage.setItem(DRAFT_KEY_C, JSON.stringify(collectSectionCData()));
}

function loadSectionCDraft() {
  const raw = localStorage.getItem(DRAFT_KEY_C);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.children && data.children.length > 0) {
      data.children.forEach(child => addChild(child));
    }
  } catch (e) {
    console.warn("Could not load Section C draft:", e);
  }
}

// ═══════════════════════════════════════════════
// 9. SECTION D — CHURCH PLEDGE
// ═══════════════════════════════════════════════

const DRAFT_KEY_D = "bem_otr_draft_sectionD";

function bindSectionDEvents() {
  // Save pledge agreement to draft on change
  const pledgeAgree = document.getElementById("pledgeAgree");
  if (pledgeAgree) {
    pledgeAgree.addEventListener("change", () => {
      saveSectionDDraft();
      // Highlight agreement box when ticked
      const label = document.getElementById("pledgeAgreeLabel");
      if (pledgeAgree.checked) {
        label.style.borderColor = "var(--marigold)";
      }
    });
  }

  // Back button
  document.getElementById("btnBackD")?.addEventListener("click", () => navigateTo("c"));

  // Next button — unrestricted for now (TODO: enforce pledge tick when re-enabling)
  document.getElementById("btnNextD")?.addEventListener("click", () => {
    saveSectionDDraft();
    navigateTo("e");
  });
}

function saveSectionDDraft() {
  const data = {
    pledgeAgreed: document.getElementById("pledgeAgree")?.checked || false,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY_D, JSON.stringify(data));
}

function loadSectionDDraft() {
  const raw = localStorage.getItem(DRAFT_KEY_D);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const pledgeAgree = document.getElementById("pledgeAgree");
    if (pledgeAgree && data.pledgeAgreed) {
      pledgeAgree.checked = true;
    }
  } catch (e) {
    console.warn("Could not load Section D draft:", e);
  }
}

// ── Init Section D ──
document.addEventListener("DOMContentLoaded", () => {
  loadSectionDDraft();
  bindSectionDEvents();
});

// ── Init Section C ──
document.addEventListener("DOMContentLoaded", () => {
  bindSectionCEvents();
  const draft = localStorage.getItem(DRAFT_KEY_C);
  let draftLoaded = false;
  if (draft) {
    try {
      const data = JSON.parse(draft);
      if (data.children && data.children.length > 0) {
        loadSectionCDraft();
        draftLoaded = true;
      }
    } catch (e) {}
  }
  if (!draftLoaded) addChild();
});

// ═══════════════════════════════════════════════
// 10. SECTION E — CONFESSION
// ═══════════════════════════════════════════════

const DRAFT_KEY_E = "bem_otr_draft_sectionE";

function initSectionE() {
  // Auto-fill Komsel code from Section A
  const komselInput = document.getElementById("komselCode");
  const confKomsel  = document.getElementById("confessionKomsel");
  if (komselInput && confKomsel) {
    confKomsel.value = komselInput.value;
    // Keep in sync if user edits Section A komsel later
    komselInput.addEventListener("input", () => {
      confKomsel.value = komselInput.value;
      saveSectionEDraft();
    });
  }

  // Auto-fill Full Name from Section A (readonly)
  const fullNameInput = document.getElementById("fullName");
  const confName      = document.getElementById("confessionName");
  if (fullNameInput && confName) {
    confName.value = fullNameInput.value;
    fullNameInput.addEventListener("input", () => {
      confName.value = fullNameInput.value;
      saveSectionEDraft();
    });
  }

  // Auto-fill today's date
  const confDate = document.getElementById("confessionDate");
  if (confDate) {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, "0");
    const dd    = String(today.getDate()).padStart(2, "0");
    confDate.value = `${yyyy}-${mm}-${dd}`;
  }

  // Load saved draft (overwrites auto-fills if user had saved values)
  loadSectionEDraft();
  // Sync English refs after loading
  syncConfessionRefs();

  // Auto-save and sync English refs on input
  ["confessionSince", "confessionLeader", "confessionDate"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      saveSectionEDraft();
      syncConfessionRefs();
    });
    document.getElementById(id)?.addEventListener("change", () => {
      saveSectionEDraft();
      syncConfessionRefs();
    });
  });

  // Back button
  document.getElementById("btnBackE")?.addEventListener("click", () => navigateTo("d"));

  // Submit button — Firestore integration
  document.getElementById("btnSubmit")?.addEventListener("click", async () => {
    const btn = document.getElementById("btnSubmit");
    const icVal = (document.getElementById("icNo")?.value || "").replace(/-/g, "");

    // Disable button to prevent double submission
    btn.disabled = true;
    btn.textContent = "Menyemak... / Checking...";

    try {
      // ── IC Duplicate Check against Firestore ──
      const snapshot = await db.collection("registrations")
        .where("icNo", "==", icVal)
        .get();

      if (!snapshot.empty) {
        document.getElementById("duplicateModal").style.display = "flex";
        btn.disabled = false;
        btn.innerHTML = "Hantar / Submit &rarr;";
        return;
      }

      // ── Collect all section data ──
      btn.textContent = "Menghantar... / Submitting...";
      saveSectionEDraft();

      const sectionADraft = JSON.parse(localStorage.getItem("bem_otr_draft_sectionA") || "{}");
      const sectionBDraft = JSON.parse(localStorage.getItem("bem_otr_draft_sectionB") || "{}");
      const sectionCDraft = JSON.parse(localStorage.getItem("bem_otr_draft_sectionC") || "{}");
      const sectionDDraft = JSON.parse(localStorage.getItem("bem_otr_draft_sectionD") || "{}");
      const sectionEDraft = JSON.parse(localStorage.getItem("bem_otr_draft_sectionE") || "{}");

      const registrationData = {
        name:        (sectionADraft.fullName || "").toUpperCase(),
        icNo:        icVal,
        dateApplied: new Date().toISOString().split("T")[0],
        approved:    false,
        uniqueID:    generateUniqueID(sectionADraft.fullName, icVal, sectionADraft.yearJoining),
        memberRole:  sectionADraft.memberRole || "",
        photoURL:    photoDataURL || "",

        // Behalf registration data (only if in behalf mode)
        ...(IS_BEHALF_MODE && {
          behalfRegistration: true,
          behalfRegistrantIC:   sessionStorage.getItem("behalf_registrant_ic") || "",
          behalfRegistrantName: sessionStorage.getItem("behalf_registrant_name") || "",
          behalfRelationship:   document.getElementById("behalfRelationship")?.value || "",
          behalfReason:         document.querySelector('input[name="behalfReason"]:checked')?.value || "",
          behalfOtherReason:    document.getElementById("behalfOtherReason")?.value || "",
        }),

        sectionA: {
          fullName:        (sectionADraft.fullName || "").toUpperCase(),
          icNo:            icVal,
          gender:          sectionADraft.gender          || "",
          dob:             sectionADraft.dob             || "",
          race:            sectionADraft.race            || "",
          maritalStatus:   sectionADraft.maritalStatus   || "",
          partnerName:     sectionADraft.partnerName     || "",
          latePartnerName: sectionADraft.latePartnerName || "",
          baptismStatus:   sectionADraft.baptismStatus   || "",
          baptismYear:     sectionADraft.baptismYear     || "",
          citizenship:     sectionADraft.citizenship     || "",
          countryOfOrigin: sectionADraft.countryOfOrigin || "",
          phoneNumber:     sectionADraft.phoneNumber     || "",
          occupation:      sectionADraft.occupation      || "",
          originalChurch:  sectionADraft.originalChurch  || "",
          yearJoining:     sectionADraft.yearJoining     || "",
          komselCode:      sectionADraft.komselCode      || "",
          currentAddress:  sectionADraft.currentAddress  || "",
        },
        sectionB: {
          services:         sectionBDraft.services         || {},
          othersChecked:    sectionBDraft.othersChecked     || false,
          othersServiceName:sectionBDraft.othersServiceName || "",
          othersInvolvement:sectionBDraft.othersInvolvement || "",
        },
        sectionC: { children: sectionCDraft.children || [] },
        sectionD: { pledgeAgreed: sectionDDraft.pledgeAgreed || false },
        sectionE: {
          komsel: document.getElementById("confessionKomsel")?.value || "",
          since:  document.getElementById("confessionSince")?.value  || "",
          leader: document.getElementById("confessionLeader")?.value || "",
          name:   document.getElementById("confessionName")?.value   || "",
          date:   document.getElementById("confessionDate")?.value   || "",
        },
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // ── Save to Firestore ──
      await db.collection("registrations").add(registrationData);

      // ── Clear local drafts ──
      ["bem_otr_draft_sectionA","bem_otr_draft_sectionB","bem_otr_draft_sectionC",
       "bem_otr_draft_sectionD","bem_otr_draft_sectionE"].forEach(k => localStorage.removeItem(k));

      showSuccessPage();

    } catch (err) {
      console.error("Submission error:", err);
      alert("Ralat semasa menghantar borang. Sila cuba lagi.\nError submitting form. Please try again.\n\n" + err.message);
      btn.disabled = false;
      btn.innerHTML = "Hantar / Submit &rarr;";
    }
  });

  // Close duplicate modal
  document.getElementById("closeDuplicateModal")?.addEventListener("click", () => {
    document.getElementById("duplicateModal").style.display = "none";
  });

  // Success page back button
  document.getElementById("btnSuccessBack")?.addEventListener("click", () => {
    location.reload();
  });
}

function syncConfessionRefs() {
  const map = {
    confessionKomsel: "syncKomsel",
    confessionSince:  "syncSince",
    confessionLeader: "syncLeader",
    confessionName:   "syncName",
  };
  Object.entries(map).forEach(([inputId, refId]) => {
    const input = document.getElementById(inputId);
    const ref   = document.getElementById(refId);
    if (!input || !ref) return;
    ref.textContent = input.value.trim() || "___";
  });
}

function showSuccessPage() {
  document.getElementById("registrationForm").style.display = "none";
  document.getElementById("successPage").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveSectionEDraft() {
  const data = {
    since:   document.getElementById("confessionSince")?.value  || "",
    leader:  document.getElementById("confessionLeader")?.value || "",
    date:    document.getElementById("confessionDate")?.value   || "",
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY_E, JSON.stringify(data));
}

function loadSectionEDraft() {
  const raw = localStorage.getItem(DRAFT_KEY_E);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.since)  document.getElementById("confessionSince").value  = data.since;
    if (data.leader) document.getElementById("confessionLeader").value = data.leader;
    if (data.date)   document.getElementById("confessionDate").value   = data.date;
  } catch (e) {
    console.warn("Could not load Section E draft:", e);
  }
}

// ── Init Section E ──
document.addEventListener("DOMContentLoaded", () => {
  initSectionE();
});