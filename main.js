/* ═══════════════════════════════════════════════
   BEM On The Rock — main.js
   Section A Logic:
   - IC → DOB auto-fill
   - Conditional fields (baptism date, country)
   - Year dropdown generation
   - localStorage draft saving
   - Form validation
═══════════════════════════════════════════════ */

"use strict";

// ── DOM Ready ──────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  buildYearDropdown();
  loadDraft();
  bindEvents();
});

// ═══════════════════════════════════════════════
// 1. YEAR DROPDOWN — 2001 to current year (descending)
// ═══════════════════════════════════════════════
function buildYearDropdown() {
  const select = document.getElementById("yearJoining");
  const currentYear = new Date().getFullYear();

  for (let y = currentYear; y >= 2001; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

// ═══════════════════════════════════════════════
// 2. IC → DATE OF BIRTH AUTO-FILL
// ═══════════════════════════════════════════════
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

  // ── IC Input: auto-format + auto-fill DOB ──
  const icInput = document.getElementById("icNo");
  icInput.addEventListener("input", function () {
    const raw = this.value;
    const formatted = formatIC(raw);
    this.value = formatted;

    const dob = parseICToDOB(formatted);
    const dobField = document.getElementById("dob");
    if (dob) {
      dobField.value = dob;
      dobField.style.borderColor = "var(--gold-dim)";
    }
    saveDraft();
    checkNextButton();
  });

  // ── Baptism Status: show/hide date field ──
  const baptismRadios = document.querySelectorAll('input[name="baptismStatus"]');
  baptismRadios.forEach(radio => {
    radio.addEventListener("change", function () {
      const dateField = document.getElementById("baptismDateField");
      if (this.value === "baptised") {
        dateField.classList.add("visible");
        document.getElementById("baptismDate").required = true;
      } else {
        dateField.classList.remove("visible");
        document.getElementById("baptismDate").required = false;
        document.getElementById("baptismDate").value = "";
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
        document.getElementById("countryOfOrigin").required = true;
      } else {
        countryField.classList.remove("visible");
        document.getElementById("countryOfOrigin").required = false;
        document.getElementById("countryOfOrigin").value = "";
        clearError("countryOfOrigin");
      }
      saveDraft();
      checkNextButton();
    });
  });

  // ── Auto-save draft on any input change ──
  const allInputs = document.querySelectorAll("#section-a input, #section-a select, #section-a textarea");
  allInputs.forEach(input => {
    input.addEventListener("change", () => { saveDraft(); checkNextButton(); });
    input.addEventListener("input", () => checkNextButton());
  });

  // ── Save Draft Button ──
  document.getElementById("btnSaveDraft").addEventListener("click", () => {
    saveDraft();
    showDraftNotice("✅ Draf disimpan! / Draft saved!");
  });

  // ── Next Button ──
  document.getElementById("btnNext").addEventListener("click", () => {
    if (validateSectionA()) {
      saveDraft();
      // TODO: Advance to Section B (will be built later)
      alert("Section A selesai! / Section A complete!\n\nSection B akan dibina seterusnya. / Section B will be built next.");
    }
  });

  // ── Step Navigator clicks ──
  document.querySelectorAll(".step.completed").forEach(step => {
    step.addEventListener("click", function () {
      const target = this.dataset.section;
      navigateTo(target);
    });
  });

  // Run once on load in case draft was restored
  checkNextButton();
}

// ═══════════════════════════════════════════════
// 3b. CHECK IF REQUIRED FIELDS ARE FILLED → enable/disable Next button
// ═══════════════════════════════════════════════
function checkNextButton() {
  const btn = document.getElementById("btnNext");

  const fullName     = document.getElementById("fullName").value.trim();
  const icNo         = document.getElementById("icNo").value.replace(/-/g, "");
  const gender       = document.querySelector('input[name="gender"]:checked');
  const dob          = document.getElementById("dob").value;
  const race         = document.getElementById("race").value.trim();
  const marital      = document.getElementById("maritalStatus").value;
  const baptism      = document.querySelector('input[name="baptismStatus"]:checked');
  const citizenship  = document.querySelector('input[name="citizenship"]:checked');
  const yearJoining  = document.getElementById("yearJoining").value;
  const address      = document.getElementById("currentAddress").value.trim();

  // Conditional checks
  const baptismDateOk = !baptism || baptism.value !== "baptised" ||
    document.getElementById("baptismDate").value !== "";
  const countryOk = !citizenship || citizenship.value !== "nonCitizen" ||
    document.getElementById("countryOfOrigin").value.trim() !== "";

  const allFilled =
    fullName &&
    icNo.length === 12 &&
    gender &&
    dob &&
    race &&
    marital &&
    baptism &&
    baptismDateOk &&
    citizenship &&
    countryOk &&
    yearJoining &&
    address;

  btn.disabled = !allFilled;
}

// ═══════════════════════════════════════════════
// 4. LOCALSTORAGE DRAFT SAVING & LOADING
// ═══════════════════════════════════════════════
const DRAFT_KEY = "bem_otr_draft_sectionA";

function collectSectionAData() {
  return {
    fullName:       document.getElementById("fullName").value,
    icNo:           document.getElementById("icNo").value,
    gender:         document.querySelector('input[name="gender"]:checked')?.value || "",
    dob:            document.getElementById("dob").value,
    race:           document.getElementById("race").value,
    maritalStatus:  document.getElementById("maritalStatus").value,
    baptismStatus:  document.querySelector('input[name="baptismStatus"]:checked')?.value || "",
    baptismDate:    document.getElementById("baptismDate").value,
    citizenship:    document.querySelector('input[name="citizenship"]:checked')?.value || "",
    countryOfOrigin:document.getElementById("countryOfOrigin").value,
    originalChurch: document.getElementById("originalChurch").value,
    yearJoining:    document.getElementById("yearJoining").value,
    komselCode:     document.getElementById("komselCode").value,
    currentAddress: document.getElementById("currentAddress").value,
    savedAt:        new Date().toISOString(),
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
      "originalChurch", "yearJoining", "komselCode", "currentAddress"
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
// 6. SECTION NAVIGATION (for future sections)
// ═══════════════════════════════════════════════
function navigateTo(sectionId) {
  document.querySelectorAll(".form-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));

  const targetSection = document.getElementById(`section-${sectionId}`);
  const targetStep = document.getElementById(`step-${sectionId}`);

  if (targetSection) targetSection.classList.add("active");
  if (targetStep) targetStep.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}