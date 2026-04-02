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
  setFooterYear();
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
// 1b. DYNAMIC FOOTER YEAR
// ═══════════════════════════════════════════════
function setFooterYear() {
  const el = document.getElementById("footerYear");
  if (el) el.textContent = new Date().getFullYear();
}


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

  // ── Next Button — TEMPORARILY UNRESTRICTED FOR TESTING ──
  // TODO: Re-enable validation once all sections A–E are complete
  document.getElementById("btnNext").disabled = false;
  document.getElementById("btnNext").addEventListener("click", () => {
    saveDraft();
    navigateTo("b");
  });

  // ── Step Navigator clicks ──
  document.querySelectorAll(".step").forEach(step => {
    step.addEventListener("click", function () {
      const target = this.dataset.section;
      navigateTo(target);
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
    occupation:     document.getElementById("occupation").value,
    phoneNumber:    document.getElementById("phoneNumber").value,
    currentAddress: document.getElementById("currentAddress").value,
    memberRole:     document.querySelector('input[name="memberRole"]:checked')?.value || "",
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
  const targetStep = document.getElementById(`step-${sectionId}`);

  if (targetSection) targetSection.classList.add("active");
  if (targetStep) targetStep.classList.add("active");

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
  "Keramahan untuk Jemaat Baru / Hospitality for Newcomers",
  "Keramahan untuk VIP / Hospitality for VIP",
  "Rock Essence / Rock Essence",
  "Rock Resource / Rock Resource",
  "Kaunter Maklumat / Information Counter",
  "Pengangkutan / Transportation",
  "Pendoa Syafaat / Intercessor",
  "Kebajikan & Sosial / Welfare & Social",
  "Adiwira / Adiwira",
  "P.A Pastor & Penceramah / P.A Pastor & Speakers",
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

// ── Init Section C ──
document.addEventListener("DOMContentLoaded", () => {
  loadSectionCDraft();
  bindSectionCEvents();
});