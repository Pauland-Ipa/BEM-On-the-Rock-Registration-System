"use strict";
/* ═══════════════════════════════════════════════
   BEM On The Rock — update-info.js
═══════════════════════════════════════════════ */

document.getElementById("updateFooterYear").textContent = new Date().getFullYear();

// ── State ──
let memberDocId  = null;
let memberData   = null;
let editChildren = []; // working copy of children array

// ── Valid Komsel Codes ──
const VALID_CELL_CODES = (() => {
  const codes = [];
  const add = (prefix, max) => { for (let i=1;i<=max;i++) codes.push(prefix+i); };
  add("SN",15); add("ZV",13); add("ZPA",7); add("ZPB",8);
  add("ZPC",5);  add("ZPD",9); add("ZT",15); add("SA",10);
  add("SB",9);   add("ZC",5);
  return codes;
})();

const MARITAL_MAP = {
  single:  "Bujang / Single",
  engaged: "Bertunang / Engaged",
  married: "Berkahwin / Married",
  divorced:"Bercerai / Divorced",
  widowed: "Balu/Duda [Pasangan meninggal] / Widowed"
};

// ── Screen management ──
const screens = [
  "screen-verify","screen-menu","screen-phone","screen-occupation",
  "screen-marital","screen-baptism","screen-komsel","screen-children"
];

function showScreen(id) {
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle("active", s === id);
  });
  window.scrollTo({ top:0, behavior:"smooth" });
  // Hide back-to-home on sub-screens (not verify/menu)
  const backHome = document.getElementById("backHomeBtn");
  if (backHome) backHome.style.display = (id==="screen-verify"||id==="screen-menu") ? "" : "none";
}

// ── IC Format ──
function formatIC(v) {
  const d = v.replace(/\D/g,"");
  let f = d;
  if (d.length>6) f = d.substring(0,6)+"-"+d.substring(6);
  if (d.length>8) f = f.substring(0,9)+"-"+d.substring(8);
  return f.substring(0,14);
}

// ── Phone Format ──
function formatPhone(v) {
  const d = v.replace(/\D/g,"");
  if (d.length>3) return d.substring(0,3)+"-"+d.substring(3,10);
  return d;
}

// ── Komsel validation ──
function normaliseKomsel(v) { return v.toUpperCase().replace(/\s+/g,""); }
function isValidKomsel(v)   { const n=normaliseKomsel(v); return VALID_CELL_CODES.some(c=>normaliseKomsel(c)===n); }

// ═══════════════════════════════════════════════
// SCREEN 1 — Verify IC
// ═══════════════════════════════════════════════
document.getElementById("verifyIC").addEventListener("input", function() {
  this.value = formatIC(this.value);
});

document.getElementById("btnVerify").addEventListener("click", async () => {
  const ic     = document.getElementById("verifyIC").value.replace(/-/g,"");
  const errEl  = document.getElementById("err-verifyIC");
  const notice = document.getElementById("verifyNotice");
  errEl.textContent = "";

  if (ic.length !== 12) {
    errEl.textContent = "Sila masukkan No. KP yang sah / Please enter a valid IC No.";
    return;
  }

  notice.textContent = "Menyemak... / Checking...";
  try {
    const snap = await db.collection("registrations")
      .where("icNo","==",ic)
      .where("approved","==",true)
      .get();

    if (snap.empty) {
      errEl.textContent = "Tiada rekod ahli aktif dengan No. KP ini. / No active member found with this IC No.";
      notice.textContent = "";
      return;
    }

    memberDocId = snap.docs[0].id;
    memberData  = snap.docs[0].data();
    notice.textContent = "";
    populateMenu();
    showScreen("screen-menu");

  } catch(e) {
    errEl.textContent = "Ralat sistem / System error. Please try again.";
    notice.textContent = "";
  }
});

// ═══════════════════════════════════════════════
// SCREEN 2 — Menu
// ═══════════════════════════════════════════════
function populateMenu() {
  const a = memberData.sectionA || {};

  // Photo
  const photoWrap = document.getElementById("bannerPhoto");
  photoWrap.innerHTML = memberData.photoURL
    ? `<img src="${memberData.photoURL}" alt="Photo"/>`
    : `<div class="member-banner-photo-placeholder">👤</div>`;

  document.getElementById("bannerName").textContent   = (a.fullName || memberData.name || "—").toUpperCase();
  document.getElementById("bannerUID").textContent    = `ID: ${memberData.uniqueID || "—"}`;
  document.getElementById("bannerKomsel").textContent = `Kod Komsel / Cell Group: ${a.komselCode || "—"}`;

  // Disable baptism option if already baptised
  const baptismBtn = document.getElementById("btnBaptismMenu");
  if (a.baptismStatus === "baptised") {
    baptismBtn.disabled = true;
    baptismBtn.title = "Anda sudah dibaptis / You are already baptised";
    const note = document.createElement("span");
    note.style.cssText = "font-size:0.7rem;color:var(--text-muted);font-style:italic;";
    note.textContent = "(Sudah dibaptis / Already baptised)";
    baptismBtn.appendChild(note);
  }

  // Hide success notice when re-entering menu
  // (will be shown by individual save handlers)
}

// Menu button clicks → navigate to sub-screen
document.querySelectorAll(".update-menu-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    if (this.disabled) return;
    const target = this.dataset.screen;
    populateSubScreen(target);
    showScreen(`screen-${target}`);
    // Hide success notice when navigating away
    document.getElementById("updateSuccessNotice").style.display = "none";
  });
});

// ── Back to menu buttons ──
document.querySelectorAll(".back-to-menu").forEach(btn => {
  btn.addEventListener("click", () => showScreen("screen-menu"));
});

// ═══════════════════════════════════════════════
// POPULATE SUB-SCREENS with current data
// ═══════════════════════════════════════════════
function populateSubScreen(screen) {
  const a = memberData.sectionA || {};

  if (screen === "phone") {
    document.getElementById("currentPhone").textContent =
      a.phoneNumber || "Tiada data / No data";
    const inp = document.getElementById("newPhone");
    inp.value = "";
    document.getElementById("btnSavePhone").disabled = true;
    document.getElementById("err-newPhone").textContent = "";
  }

  if (screen === "occupation") {
    document.getElementById("currentOccupation").textContent =
      a.occupation || "Tiada data berkenaan pekerjaan lama wujud / No occupation data available";
    const inp = document.getElementById("newOccupation");
    inp.value = "";
    document.getElementById("btnSaveOccupation").disabled = true;
    document.getElementById("err-newOccupation").textContent = "";
  }

  if (screen === "marital") {
    const current = a.maritalStatus;
    let displayText = MARITAL_MAP[current] || "—";
    if ((current==="engaged"||current==="married") && a.partnerName) {
      displayText += ` — ${a.partnerName}`;
    }
    document.getElementById("currentMarital").textContent = displayText;

    // Populate dropdown excluding current status
    const sel = document.getElementById("newMarital");
    sel.innerHTML = `<option value="">-- Pilih / Select --</option>`;
    Object.entries(MARITAL_MAP).forEach(([val,label]) => {
      if (val !== current) {
        const opt = document.createElement("option");
        opt.value = val; opt.textContent = label;
        sel.appendChild(opt);
      }
    });
    document.getElementById("partnerNameField").classList.remove("visible");
    document.getElementById("newPartnerName").value = "";
    document.getElementById("btnSaveMarital").disabled = true;
    document.getElementById("err-newMarital").textContent = "";
    document.getElementById("err-newPartnerName").textContent = "";
  }

  if (screen === "baptism") {
    // Reset
    document.querySelectorAll('input[name="baptismAnswer"]').forEach(r => r.checked=false);
    document.getElementById("baptismYearSection").classList.remove("visible");
    document.getElementById("newBaptismYear").value = "";
    document.getElementById("btnSaveBaptism").disabled = true;
    document.getElementById("err-newBaptismYear").textContent = "";
  }

  if (screen === "komsel") {
    document.getElementById("currentKomsel").textContent =
      a.komselCode || "Tiada data / No data";
    const inp = document.getElementById("newKomsel");
    inp.value = "";
    document.getElementById("komselUpdateBadge").className = "komsel-valid-badge";
    document.getElementById("btnSaveKomsel").disabled = true;
    document.getElementById("err-newKomsel").textContent = "";
  }

  if (screen === "children") {
    editChildren = JSON.parse(JSON.stringify(memberData.sectionC?.children || []));
    renderChildrenEdit();
  }
}

// ═══════════════════════════════════════════════
// PHONE
// ═══════════════════════════════════════════════
document.getElementById("newPhone").addEventListener("input", function() {
  this.value = formatPhone(this.value);
  const valid = this.value.replace(/\D/g,"").length >= 9;
  document.getElementById("btnSavePhone").disabled = !valid;
});

document.getElementById("btnSavePhone").addEventListener("click", async () => {
  const val = document.getElementById("newPhone").value.trim();
  await saveField("sectionA.phoneNumber", val,
    "Nombor Telefon / Phone Number", "screen-phone", "err-newPhone");
});

// ═══════════════════════════════════════════════
// OCCUPATION
// ═══════════════════════════════════════════════
document.getElementById("newOccupation").addEventListener("input", function() {
  document.getElementById("btnSaveOccupation").disabled = !this.value.trim();
});

document.getElementById("btnSaveOccupation").addEventListener("click", async () => {
  const val = document.getElementById("newOccupation").value.trim();
  await saveField("sectionA.occupation", val,
    "Pekerjaan / Occupation", "screen-occupation", "err-newOccupation");
});

// ═══════════════════════════════════════════════
// MARITAL STATUS
// ═══════════════════════════════════════════════
document.getElementById("newMarital").addEventListener("change", function() {
  const v = this.value;
  const partnerField = document.getElementById("partnerNameField");
  const partnerInput = document.getElementById("newPartnerName");
  const a = memberData.sectionA || {};

  if (v==="engaged" || v==="married") {
    partnerField.classList.add("visible");
    // Pre-fill with existing partner name if transitioning engaged→married
    if (a.partnerName) partnerInput.value = a.partnerName;
  } else if (v==="widowed") {
    partnerField.classList.add("visible");
    if (a.partnerName) partnerInput.value = a.partnerName;
  } else {
    partnerField.classList.remove("visible");
    partnerInput.value = "";
  }
  updateMaritalSaveBtn();
});

document.getElementById("newPartnerName").addEventListener("input", updateMaritalSaveBtn);

function updateMaritalSaveBtn() {
  const v = document.getElementById("newMarital").value;
  const p = document.getElementById("newPartnerName").value.trim();
  const needsPartner = (v==="engaged"||v==="married"||v==="widowed");
  document.getElementById("btnSaveMarital").disabled = !v || (needsPartner && !p);
}

document.getElementById("btnSaveMarital").addEventListener("click", async () => {
  const v = document.getElementById("newMarital").value;
  const p = document.getElementById("newPartnerName").value.trim();
  if (!v) return;

  const updates = { "sectionA.maritalStatus": v };
  if (v==="engaged"||v==="married") { updates["sectionA.partnerName"]=""; updates["sectionA.partnerName"]=p; }
  else if (v==="widowed") { updates["sectionA.latePartnerName"]=p; updates["sectionA.partnerName"]=""; }
  else { updates["sectionA.partnerName"]=""; updates["sectionA.latePartnerName"]=""; }

  try {
    await db.collection("registrations").doc(memberDocId).update({
      ...updates,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Refresh local data
    const snap = await db.collection("registrations").doc(memberDocId).get();
    memberData = snap.data();
    showSuccessAndReturn("Status Perkahwinan / Marital Status");
  } catch(e) {
    document.getElementById("err-newMarital").textContent = "Ralat / Error: "+e.message;
  }
});

// ═══════════════════════════════════════════════
// BAPTISM
// ═══════════════════════════════════════════════
document.querySelectorAll('input[name="baptismAnswer"]').forEach(radio => {
  radio.addEventListener("change", function() {
    const yearSection = document.getElementById("baptismYearSection");
    const saveBtn     = document.getElementById("btnSaveBaptism");
    if (this.value==="yes") {
      yearSection.classList.add("visible");
      saveBtn.disabled = !document.getElementById("newBaptismYear").value;
    } else {
      yearSection.classList.remove("visible");
      saveBtn.disabled = true;
      // Show "not yet" dialog
      document.getElementById("baptismNotYetModal").style.display = "flex";
      this.checked = false;
    }
  });
});

document.getElementById("newBaptismYear").addEventListener("input", function() {
  const yr = parseInt(this.value);
  document.getElementById("btnSaveBaptism").disabled = !(yr>=1920 && yr<=new Date().getFullYear());
});

document.getElementById("btnSaveBaptism").addEventListener("click", async () => {
  const yr = document.getElementById("newBaptismYear").value;
  try {
    await db.collection("registrations").doc(memberDocId).update({
      "sectionA.baptismStatus": "baptised",
      "sectionA.baptismYear":    yr,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    const snap = await db.collection("registrations").doc(memberDocId).get();
    memberData = snap.data();
    // Disable baptism button in menu since now baptised
    const baptismBtn = document.getElementById("btnBaptismMenu");
    if (baptismBtn) baptismBtn.disabled = true;
    showSuccessAndReturn("Status Pembaptisan / Baptism Status");
  } catch(e) {
    document.getElementById("err-newBaptismYear").textContent = "Ralat / Error: "+e.message;
  }
});

document.getElementById("closeBaptismNotYet").addEventListener("click", () => {
  document.getElementById("baptismNotYetModal").style.display = "none";
  showScreen("screen-menu");
});

// ═══════════════════════════════════════════════
// KOMSEL
// ═══════════════════════════════════════════════
document.getElementById("newKomsel").addEventListener("input", function() {
  this.value = this.value.toUpperCase();
  const val   = this.value.trim();
  const badge = document.getElementById("komselUpdateBadge");
  if (!val) { badge.className="komsel-valid-badge"; document.getElementById("btnSaveKomsel").disabled=true; return; }
  const valid = isValidKomsel(val);
  badge.className = `komsel-valid-badge ${valid?"valid":"invalid"}`;
  badge.textContent = valid ? "✓ Kod sah / Valid code" : "✗ Kod tidak sah / Invalid code";
  document.getElementById("btnSaveKomsel").disabled = !valid;
});

document.getElementById("btnSaveKomsel").addEventListener("click", async () => {
  const val = document.getElementById("newKomsel").value.trim().toUpperCase();
  await saveField("sectionA.komselCode", val,
    "Kod Komsel / Cell Group Code", "screen-komsel", "err-newKomsel");
});

// ═══════════════════════════════════════════════
// CHILDREN
// ═══════════════════════════════════════════════
function renderChildrenEdit() {
  const list = document.getElementById("childrenEditList");
  list.innerHTML = "";

  editChildren.forEach((child, i) => {
    const card = document.createElement("div");
    card.className = "child-edit-card";
    const num = i + 1;
    card.innerHTML = `
      <div class="child-edit-header">
        <span class="child-edit-title">Anak Ke-${num} / Child No. ${num}</span>
        <button type="button" class="btn-remove-child" data-index="${i}">✕ Padam / Remove</button>
      </div>
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Nama Penuh Anak / Child's Full Name</label>
          <input type="text" class="form-input child-name-input" data-index="${i}"
            value="${child.name||""}" placeholder="Masukkan nama penuh / Enter full name"/>
        </div>
        <div class="form-group">
          <label class="form-label">Jantina / Gender</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="radio" name="childGenderEdit-${i}" value="male" ${child.gender==="male"?"checked":""}/>
              <span class="custom-radio"></span>
              Lelaki <em>/ Boy</em>
            </label>
            <label class="checkbox-label">
              <input type="radio" name="childGenderEdit-${i}" value="female" ${child.gender==="female"?"checked":""}/>
              <span class="custom-radio"></span>
              Perempuan <em>/ Girl</em>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">MyKid / MyKid</label>
          <input type="text" class="form-input child-mykid-input" data-index="${i}"
            value="${child.myKid||""}" placeholder="cth/e.g. 120131-14-1234"/>
        </div>
      </div>`;

    // Remove child
    card.querySelector(".btn-remove-child").addEventListener("click", () => {
      editChildren.splice(i, 1);
      renderChildrenEdit();
    });

    // Sync name
    card.querySelector(".child-name-input").addEventListener("input", function() {
      editChildren[parseInt(this.dataset.index)].name = this.value;
    });

    // Sync mykid
    card.querySelector(".child-mykid-input").addEventListener("input", function() {
      editChildren[parseInt(this.dataset.index)].myKid = this.value;
    });

    // Sync gender
    card.querySelectorAll(`input[name="childGenderEdit-${i}"]`).forEach(r => {
      r.addEventListener("change", function() {
        editChildren[i].gender = this.value;
      });
    });

    list.appendChild(card);
  });
}

document.getElementById("btnAddChildUpdate").addEventListener("click", () => {
  editChildren.push({ name:"", gender:"", myKid:"" });
  renderChildrenEdit();
});

document.getElementById("btnSaveChildren").addEventListener("click", async () => {
  try {
    await db.collection("registrations").doc(memberDocId).update({
      "sectionC.children": editChildren,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    const snap = await db.collection("registrations").doc(memberDocId).get();
    memberData = snap.data();
    showSuccessAndReturn("Maklumat Anak / Children's Information");
  } catch(e) {
    alert("Ralat menyimpan / Save error: " + e.message);
  }
});

// ═══════════════════════════════════════════════
// GENERIC FIELD SAVE HELPER
// ═══════════════════════════════════════════════
async function saveField(firestorePath, value, fieldLabel, sourceScreen, errId) {
  const btn = document.querySelector(`#${sourceScreen} .btn-primary`);
  if (btn) { btn.disabled=true; btn.textContent="Menyimpan... / Saving..."; }
  try {
    await db.collection("registrations").doc(memberDocId).update({
      [firestorePath]: value,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Refresh local member data
    const snap = await db.collection("registrations").doc(memberDocId).get();
    memberData  = snap.data();
    showSuccessAndReturn(fieldLabel);
  } catch(e) {
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = "Ralat / Error: " + e.message;
    if (btn) { btn.disabled=false; btn.textContent="💾 Simpan / Save"; }
  }
}

// ═══════════════════════════════════════════════
// SHOW SUCCESS NOTICE & RETURN TO MENU
// ═══════════════════════════════════════════════
function showSuccessAndReturn(fieldLabel) {
  const notice  = document.getElementById("updateSuccessNotice");
  const textEl  = document.getElementById("updateSuccessText");
  textEl.innerHTML = `Berjaya mengemas kini <strong>${fieldLabel}</strong>! / Successfully updated your <strong>${fieldLabel}</strong>!`;
  notice.style.display = "flex";
  // Refresh member banner with updated data
  populateMenu();
  showScreen("screen-menu");
  window.scrollTo({ top:0, behavior:"smooth" });
  // Auto-hide after 6 seconds
  setTimeout(() => { notice.style.display="none"; }, 6000);
}