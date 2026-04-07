/* ═══════════════════════════════════════════════
   BEM On The Rock — admin.js
═══════════════════════════════════════════════ */
"use strict";

// ── Sample data for testing (replaced by Firebase later) ──
const SAMPLE_DATA = [
  {
    id: "001", fullName: "Sarah Jane Majilis", icNo: "920314-12-5678",
    dateApplied: "2025-01-15", approved: false, memberRole: "komselMember",
    gender: "female", dob: "1992-03-14", race: "Kadazan", maritalStatus: "single",
    phoneNumber: "011-23456789", occupation: "Guru", baptismStatus: "baptised",
    baptismDate: "2010-06-12", citizenship: "citizen", originalChurch: "BEM Likas",
    yearJoining: "2018", komselCode: "KS-04", currentAddress: "No. 12, Jalan Damai, KK, Sabah",
    confessionKomsel: "KS-04", confessionSince: "Mac 2018", confessionLeader: "Bro Daniel Koh",
    confessionDate: "2025-01-15", pledgeAgreed: true, children: [],
    services: { have: ["Usher / Usher"], want: ["Penginjilan / Evangelism"] },
  },
  {
    id: "002", fullName: "Marcus Lim Wei Jian", icNo: "880921-12-3456",
    dateApplied: "2025-01-22", approved: true, memberRole: "komselLeader",
    gender: "male", dob: "1988-09-21", race: "Cina", maritalStatus: "married",
    phoneNumber: "016-78901234", occupation: "Jurutera", baptismStatus: "baptised",
    baptismDate: "2005-04-17", citizenship: "citizen", originalChurch: "SIB KK",
    yearJoining: "2015", komselCode: "KS-02", currentAddress: "No. 5, Taman Maju, Penampang",
    confessionKomsel: "KS-02", confessionSince: "Feb 2015", confessionLeader: "Bro James Tan",
    confessionDate: "2025-01-22", pledgeAgreed: true,
    children: [{ name: "Lim Ai Ling", gender: "female", myKid: "150312-12-1234" }],
    services: { have: ["Multimedia / Multimedia"], want: [] },
  },
  {
    id: "003", fullName: "Ruth Anastasia Panggul", icNo: "950607-12-9012",
    dateApplied: "2025-02-03", approved: false, memberRole: "komselMember",
    gender: "female", dob: "1995-06-07", race: "Dusun", maritalStatus: "single",
    phoneNumber: "013-45678901", occupation: "Pelajar", baptismStatus: "notBaptised",
    baptismDate: "", citizenship: "citizen", originalChurch: "",
    yearJoining: "2022", komselCode: "KS-07", currentAddress: "Blok C, No. 3, Taman Sri Kepayan, KK",
    confessionKomsel: "KS-07", confessionSince: "Sep 2022", confessionLeader: "Sis Grace Mohd",
    confessionDate: "2025-02-03", pledgeAgreed: true, children: [],
    services: { have: [], want: ["Usher / Usher", "Keramahan untuk Jemaat Baru / Hospitality for Newcomers"] },
  },
];

let registrations  = [...SAMPLE_DATA];
let deleteTargetId = null;

document.addEventListener("DOMContentLoaded", () => {
  setFooterYear();
  bindLoginEvents();
  bindAdminEvents();
  renderTable();
});

function setFooterYear() {
  const el = document.getElementById("adminFooterYear");
  if (el) el.textContent = new Date().getFullYear();
}

// ── LOGIN ──
function bindLoginEvents() {
  document.getElementById("btnLogin")?.addEventListener("click", showAdminPage);
  document.getElementById("adminPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") showAdminPage();
  });
}

function showAdminPage() {
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("adminPage").style.display    = "block";
}

// ── ADMIN EVENTS ──
function bindAdminEvents() {
  document.getElementById("btnLogout")?.addEventListener("click", () => {
    document.getElementById("adminPage").style.display    = "none";
    document.getElementById("loginOverlay").style.display = "flex";
    document.getElementById("adminUsername").value = "";
    document.getElementById("adminPassword").value = "";
  });

  document.getElementById("sortBy")?.addEventListener("change",    renderTable);
  document.getElementById("sortOrder")?.addEventListener("change", renderTable);

  document.getElementById("closeViewModal")?.addEventListener("click",    () => closeModal("viewModal"));
  document.getElementById("closeViewModalBtn")?.addEventListener("click", () => closeModal("viewModal"));
  document.getElementById("editModalBtn")?.addEventListener("click", () => {
    closeModal("viewModal");
    alert("Edit functionality will be connected to Firebase in the next phase.");
  });

  document.getElementById("cancelDeleteBtn")?.addEventListener("click",  () => closeModal("deleteModal"));
  document.getElementById("closeDeleteModal")?.addEventListener("click", () => closeModal("deleteModal"));
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", confirmDelete);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".action-wrap")) {
      document.querySelectorAll(".action-dropdown.open").forEach(d => d.classList.remove("open"));
    }
  });
}

// ── RENDER TABLE ──
function getSortedData() {
  const sortBy    = document.getElementById("sortBy")?.value    || "date";
  const sortOrder = document.getElementById("sortOrder")?.value || "asc";
  const data = [...registrations];
  data.sort((a, b) => {
    const valA = sortBy === "name" ? a.fullName.toLowerCase() : a.dateApplied;
    const valB = sortBy === "name" ? b.fullName.toLowerCase() : b.dateApplied;
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ?  1 : -1;
    return 0;
  });
  return data;
}

function renderTable() {
  const tbody = document.getElementById("adminTableBody");
  const empty = document.getElementById("adminEmpty");
  tbody.innerHTML = "";
  const data = getSortedData();

  if (data.length === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  data.forEach((reg, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td>${escHtml(reg.fullName)}</td>
      <td>${formatDisplayDate(reg.dateApplied)}</td>
      <td>${escHtml(reg.icNo)}</td>
      <td class="col-status">
        <div class="toggle-wrap">
          <label class="toggle-switch">
            <input type="checkbox" class="status-toggle" data-id="${reg.id}" ${reg.approved ? "checked" : ""}/>
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label ${reg.approved ? "approved" : ""}" id="toggle-lbl-${reg.id}">
            ${reg.approved ? "Diluluskan /<br>Approved" : "Belum Diluluskan /<br>Yet to be Approved"}
          </span>
        </div>
      </td>
      <td class="col-action">
        <div class="action-wrap">
          <button class="btn-action-dots" data-id="${reg.id}">•••</button>
          <div class="action-dropdown" id="dropdown-${reg.id}">
            <button class="dropdown-item view-btn"   data-id="${reg.id}"><span class="dropdown-icon">📄</span> Lihat / View</button>
            <button class="dropdown-item print-btn"  data-id="${reg.id}"><span class="dropdown-icon">🖨️</span> Cetak / Print</button>
            <button class="dropdown-item delete delete-btn" data-id="${reg.id}"><span class="dropdown-icon">🗑️</span> Padam / Delete</button>
          </div>
        </div>
      </td>`;
    tbody.appendChild(row);
  });

  bindTableRowEvents();
}

function bindTableRowEvents() {
  document.querySelectorAll(".status-toggle").forEach(toggle => {
    toggle.addEventListener("change", function () {
      const reg = registrations.find(r => r.id === this.dataset.id);
      if (!reg) return;
      reg.approved = this.checked;
      const lbl = document.getElementById(`toggle-lbl-${reg.id}`);
      if (lbl) {
        lbl.innerHTML = reg.approved ? "Diluluskan /<br>Approved" : "Belum Diluluskan /<br>Yet to be Approved";
        lbl.className = `toggle-label ${reg.approved ? "approved" : ""}`;
      }
    });
  });

  document.querySelectorAll(".btn-action-dots").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const dropdown = document.getElementById(`dropdown-${this.dataset.id}`);
      document.querySelectorAll(".action-dropdown.open").forEach(d => { if (d !== dropdown) d.classList.remove("open"); });
      dropdown?.classList.toggle("open");
    });
  });

  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", function () { closeAllDropdowns(); openViewModal(this.dataset.id); });
  });

  document.querySelectorAll(".print-btn").forEach(btn => {
    btn.addEventListener("click", function () { closeAllDropdowns(); printApplicant(this.dataset.id); });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", function () { closeAllDropdowns(); openDeleteModal(this.dataset.id); });
  });
}

// ── VIEW MODAL ──
function openViewModal(id) {
  const reg = registrations.find(r => r.id === id);
  if (!reg) return;

  const val = v => v
    ? `<span class="view-value">${escHtml(String(v))}</span>`
    : `<span class="view-value view-value--empty">—</span>`;

  const maritalLabels = {
    single:"Bujang/Single", engaged:"Bertunang/Engaged", married:"Berkahwin/Married",
    divorced:"Bercerai/Divorced", widowed:"Janda/Duda/Widowed"
  };
  const roleLabels = {
    pastoral:"Pastoral", zoneLeader:"Ketua Zon/Zone Leader",
    komselLeader:"Ketua Komsel/Komsel Leader", komselMember:"Ahli Komsel/Komsel Member"
  };

  const childrenHtml = reg.children?.length > 0
    ? reg.children.map((c, i) => `
        <div class="view-item view-item--full">
          <span class="view-label">Anak Ke-${i+1} / Child ${i+1}</span>
          ${val(`${c.name} (${c.gender==="male"?"Lelaki/Boy":"Perempuan/Girl"}) — MyKid: ${c.myKid||"—"}`)}
        </div>`).join("")
    : `<div class="view-item view-item--full"><span class="view-value view-value--empty">Tiada / None</span></div>`;

  document.getElementById("viewModalBody").innerHTML = `
    <div class="view-section">
      <div class="view-section-title">A. Maklumat Peribadi / Personal Information</div>
      <div class="view-grid">
        <div class="view-item view-item--full"><span class="view-label">Nama Penuh / Full Name</span>${val(reg.fullName)}</div>
        <div class="view-item"><span class="view-label">No. KP / IC No.</span>${val(reg.icNo)}</div>
        <div class="view-item"><span class="view-label">Jantina / Gender</span>${val(reg.gender==="male"?"Lelaki/Male":"Perempuan/Female")}</div>
        <div class="view-item"><span class="view-label">Nombor Telefon / Phone</span>${val(reg.phoneNumber)}</div>
        <div class="view-item"><span class="view-label">Pekerjaan / Occupation</span>${val(reg.occupation)}</div>
        <div class="view-item"><span class="view-label">Tarikh Lahir / DOB</span>${val(reg.dob)}</div>
        <div class="view-item"><span class="view-label">Bangsa / Race</span>${val(reg.race)}</div>
        <div class="view-item"><span class="view-label">Status Perkahwinan / Marital</span>${val(maritalLabels[reg.maritalStatus]||reg.maritalStatus)}</div>
        <div class="view-item"><span class="view-label">Pembaptisan / Baptism</span>${val(reg.baptismStatus==="baptised"?`Sudah (${reg.baptismDate})`:"Belum")}</div>
        <div class="view-item"><span class="view-label">Warganegara / Citizenship</span>${val(reg.citizenship==="citizen"?"Malaysia":reg.countryOfOrigin)}</div>
        <div class="view-item"><span class="view-label">Gereja Asal / Original Church</span>${val(reg.originalChurch)}</div>
        <div class="view-item"><span class="view-label">Tahun Menyertai / Year Joined</span>${val(reg.yearJoining)}</div>
        <div class="view-item"><span class="view-label">Kod Komsel / Komsel Code</span>${val(reg.komselCode)}</div>
        <div class="view-item"><span class="view-label">Peranan / Role</span>${val(roleLabels[reg.memberRole]||reg.memberRole)}</div>
        <div class="view-item view-item--full"><span class="view-label">Alamat / Address</span>${val(reg.currentAddress)}</div>
      </div>
    </div>
    <div class="view-section">
      <div class="view-section-title">B. Bidang Pelayanan / Field of Service</div>
      <div class="view-grid">
        <div class="view-item view-item--full"><span class="view-label">Pernah Terlibat / Have Been Involved</span><span class="view-value">${escHtml(reg.services?.have?.join(", ")||"—")}</span></div>
        <div class="view-item view-item--full"><span class="view-label">Ingin Terlibat / Would Like to Be Involved</span><span class="view-value">${escHtml(reg.services?.want?.join(", ")||"—")}</span></div>
      </div>
    </div>
    <div class="view-section">
      <div class="view-section-title">C. Maklumat Kanak-kanak / Children Information</div>
      <div class="view-grid">${childrenHtml}</div>
    </div>
    <div class="view-section">
      <div class="view-section-title">D. Ikrar Jemaat / Church Pledge</div>
      <div class="view-grid">
        <div class="view-item view-item--full"><span class="view-label">Persetujuan / Agreement</span>${val(reg.pledgeAgreed?"✅ Bersetuju / Agreed":"❌ Tidak / Not Agreed")}</div>
      </div>
    </div>
    <div class="view-section">
      <div class="view-section-title">E. Pengakuan Jemaat / Confession</div>
      <div class="view-grid">
        <div class="view-item"><span class="view-label">Kod Komsel</span>${val(reg.confessionKomsel)}</div>
        <div class="view-item"><span class="view-label">Sejak / Since</span>${val(reg.confessionSince)}</div>
        <div class="view-item"><span class="view-label">Pimpinan / Leader</span>${val(reg.confessionLeader)}</div>
        <div class="view-item"><span class="view-label">Tarikh / Date</span>${val(reg.confessionDate)}</div>
      </div>
    </div>`;

  document.getElementById("viewModal").style.display = "flex";
}

// ── PRINT ──
function printApplicant(id) {
  const reg = registrations.find(r => r.id === id);
  if (!reg) return;
  const w = window.open("", "_blank", "width=800,height=600");
  w.document.write(`<html><head><title>${reg.fullName}</title>
    <style>body{font-family:Georgia,serif;padding:2rem;color:#111}h1{font-size:1.4rem}h2{font-size:1rem;color:#555;font-weight:normal;margin-bottom:1.5rem}h3{font-size:.9rem;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:1.2rem;color:#333}.grid{display:grid;grid-template-columns:1fr 1fr;gap:.4rem 1.5rem;margin-top:.5rem}.item{display:flex;flex-direction:column}.full{grid-column:1/-1}.lbl{font-size:.72rem;color:#888}.val{font-size:.92rem;font-weight:bold}</style>
    </head><body>
    <h1>BEM On The Rock</h1>
    <h2>Maklumat Keanggotaan — ${escHtml(reg.fullName)}</h2>
    <h3>A. Maklumat Peribadi</h3>
    <div class="grid">
      <div class="item full"><span class="lbl">Nama Penuh</span><span class="val">${escHtml(reg.fullName)}</span></div>
      <div class="item"><span class="lbl">No. KP</span><span class="val">${escHtml(reg.icNo)}</span></div>
      <div class="item"><span class="lbl">Jantina</span><span class="val">${reg.gender==="male"?"Lelaki":"Perempuan"}</span></div>
      <div class="item"><span class="lbl">Tarikh Lahir</span><span class="val">${escHtml(reg.dob)}</span></div>
      <div class="item"><span class="lbl">Bangsa</span><span class="val">${escHtml(reg.race)}</span></div>
      <div class="item"><span class="lbl">Telefon</span><span class="val">${escHtml(reg.phoneNumber)}</span></div>
      <div class="item"><span class="lbl">Pekerjaan</span><span class="val">${escHtml(reg.occupation||"—")}</span></div>
      <div class="item"><span class="lbl">Status Perkahwinan</span><span class="val">${escHtml(reg.maritalStatus)}</span></div>
      <div class="item"><span class="lbl">Pembaptisan</span><span class="val">${reg.baptismStatus==="baptised"?`Sudah (${reg.baptismDate})`:"Belum"}</span></div>
      <div class="item"><span class="lbl">Warganegara</span><span class="val">${reg.citizenship==="citizen"?"Malaysia":escHtml(reg.countryOfOrigin||"—")}</span></div>
      <div class="item"><span class="lbl">Gereja Asal</span><span class="val">${escHtml(reg.originalChurch||"—")}</span></div>
      <div class="item"><span class="lbl">Tahun Menyertai</span><span class="val">${escHtml(reg.yearJoining)}</span></div>
      <div class="item"><span class="lbl">Kod Komsel</span><span class="val">${escHtml(reg.komselCode)}</span></div>
      <div class="item full"><span class="lbl">Alamat</span><span class="val">${escHtml(reg.currentAddress)}</span></div>
    </div>
    <h3>B. Pelayanan</h3>
    <div class="grid">
      <div class="item full"><span class="lbl">Pernah Terlibat</span><span class="val">${escHtml(reg.services?.have?.join(", ")||"—")}</span></div>
      <div class="item full"><span class="lbl">Ingin Terlibat</span><span class="val">${escHtml(reg.services?.want?.join(", ")||"—")}</span></div>
    </div>
    <h3>E. Pengakuan</h3>
    <div class="grid">
      <div class="item"><span class="lbl">Komsel</span><span class="val">${escHtml(reg.confessionKomsel)}</span></div>
      <div class="item"><span class="lbl">Sejak</span><span class="val">${escHtml(reg.confessionSince)}</span></div>
      <div class="item"><span class="lbl">Pimpinan</span><span class="val">${escHtml(reg.confessionLeader)}</span></div>
      <div class="item"><span class="lbl">Tarikh</span><span class="val">${escHtml(reg.confessionDate)}</span></div>
    </div>
    <script>window.onload=()=>{window.print();window.close();}<\/script>
    </body></html>`);
  w.document.close();
}

// ── DELETE ──
function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById("deleteModal").style.display = "flex";
}

function confirmDelete() {
  if (!deleteTargetId) return;
  registrations  = registrations.filter(r => r.id !== deleteTargetId);
  deleteTargetId = null;
  closeModal("deleteModal");
  renderTable();
}

// ── HELPERS ──
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

function closeAllDropdowns() {
  document.querySelectorAll(".action-dropdown.open").forEach(d => d.classList.remove("open"));
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString("ms-MY", { day:"2-digit", month:"short", year:"numeric" });
}

function escHtml(str) {
  return String(str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}