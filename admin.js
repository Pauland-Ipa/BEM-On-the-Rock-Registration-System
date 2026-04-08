"use strict";

/* ═══════════════════════════════════════════════
   BEM On The Rock — admin.js
═══════════════════════════════════════════════ */

document.getElementById("adminFooterYear").textContent = new Date().getFullYear();

// ─────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────
let registrations = JSON.parse(localStorage.getItem("bem_otr_registrations") || "null") || [
  {
    id:"1", name:"Sarah Anak Thomas", dateApplied:"2025-03-10", icNo:"950312-13-5678", approved:false,
    sectionA:{ fullName:"Sarah Anak Thomas", icNo:"950312-13-5678", gender:"female", dob:"1995-03-12", race:"Iban", maritalStatus:"single", baptismStatus:"baptised", baptismDate:"2010-06-15", citizenship:"citizen", originalChurch:"BEM Betong", yearJoining:"2018", komselCode:"KS-03", phoneNumber:"011-23456789", occupation:"Jururawat", currentAddress:"No. 12, Jln Bunga Raya, Kuching, Sarawak." },
    sectionB:{ services:{ 9:{have:true,want:false}, 18:{have:false,want:true} }, othersChecked:false },
    sectionC:{ children:[] },
    sectionD:{ pledgeAgreed:true },
    sectionE:{ komsel:"KS-03", since:"Mac 2018", leader:"Bro. James", name:"Sarah Anak Thomas", date:"2025-03-10" }
  },
  {
    id:"2", name:"David Lim Wei Xiang", dateApplied:"2025-04-02", icNo:"880714-12-3456", approved:true,
    sectionA:{ fullName:"David Lim Wei Xiang", icNo:"880714-12-3456", gender:"male", dob:"1988-07-14", race:"Cina", maritalStatus:"married", baptismStatus:"baptised", baptismDate:"2005-12-24", citizenship:"citizen", originalChurch:"SIB Miri", yearJoining:"2015", komselCode:"KS-07", phoneNumber:"012-9876543", occupation:"Jurutera", currentAddress:"Lot 22, Jln Tun Razak, Miri, Sarawak." },
    sectionB:{ services:{ 6:{have:true,want:false}, 7:{have:true,want:false} }, othersChecked:false },
    sectionC:{ children:[{name:"Lim Xiao En", gender:"female", myKid:"150203-12-1234"}] },
    sectionD:{ pledgeAgreed:true },
    sectionE:{ komsel:"KS-07", since:"Jan 2015", leader:"Sis. Rachel", name:"David Lim Wei Xiang", date:"2025-04-02" }
  },
  {
    id:"3", name:"Mary Juk Anak Luta", dateApplied:"2025-01-20", icNo:"010520-13-7890", approved:false,
    sectionA:{ fullName:"Mary Juk Anak Luta", icNo:"010520-13-7890", gender:"female", dob:"2001-05-20", race:"Bidayuh", maritalStatus:"single", baptismStatus:"notBaptised", citizenship:"citizen", originalChurch:"", yearJoining:"2022", komselCode:"KS-01", phoneNumber:"013-1122334", occupation:"Pelajar", currentAddress:"Asrama Universiti Malaysia Sarawak, Kota Samarahan." },
    sectionB:{ services:{ 9:{have:false,want:true}, 12:{have:false,want:true} }, othersChecked:false },
    sectionC:{ children:[] },
    sectionD:{ pledgeAgreed:true },
    sectionE:{ komsel:"KS-01", since:"Feb 2022", leader:"Bro. Kevin", name:"Mary Juk Anak Luta", date:"2025-01-20" }
  }
];

const SERVICE_NAMES = [
  "","Pastoral","Pekerja Sepenuh Masa (Gereja)","[Rock Wave] Penyanyi","[Rock Wave] Pemain Muzik",
  "[Rock Wave] Penari Kreatif","Multimedia","Pengendali Sistem Bunyi","Pengendali Pencahayaan",
  "Usher","Keselamatan & Parkir","Krew Pentas","Keramahan untuk Jemaat Baru","Keramahan untuk VIP",
  "Rock Essence","Rock Resource","Kaunter Maklumat","Pengangkutan","Pendoa Syafaat",
  "Kebajikan & Sosial","Adiwira","P.A Pastor & Penceramah","Penginjilan","Tim Persembahan"
];

let pendingDeleteId = null;
let currentSort = { by:"date", order:"asc" };
let searchQuery = "";

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
document.getElementById("btnLogin").addEventListener("click", () => {
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("adminPage").style.display = "block";
  renderTable();
});

document.getElementById("btnLogout").addEventListener("click", () => {
  document.getElementById("adminPage").style.display = "none";
  document.getElementById("loginOverlay").style.display = "flex";
  document.getElementById("adminUsername").value = "";
  document.getElementById("adminPassword").value = "";
});

["adminUsername","adminPassword"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("btnLogin").click();
  });
});

// ─────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────
document.getElementById("adminSearch").addEventListener("input", function() {
  searchQuery = this.value.trim().toLowerCase();
  renderTable();
});

// ─────────────────────────────────────────────
// SORT
// ─────────────────────────────────────────────
document.getElementById("sortBy").addEventListener("change", function() {
  currentSort.by = this.value; renderTable();
});
document.getElementById("sortOrder").addEventListener("change", function() {
  currentSort.order = this.value; renderTable();
});

// ─────────────────────────────────────────────
// RENDER TABLE
// ─────────────────────────────────────────────
function getSortedFiltered() {
  let data = [...registrations];
  if (searchQuery) {
    data = data.filter(r =>
      (r.name||"").toLowerCase().includes(searchQuery) ||
      (r.icNo||"").replace(/-/g,"").includes(searchQuery.replace(/-/g,""))
    );
  }
  data.sort((a,b) => {
    let vA = currentSort.by === "name" ? (a.name||"").toLowerCase() : (a.dateApplied||"");
    let vB = currentSort.by === "name" ? (b.name||"").toLowerCase() : (b.dateApplied||"");
    if (vA < vB) return currentSort.order === "asc" ? -1 : 1;
    if (vA > vB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });
  return data;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ms-MY", {day:"2-digit",month:"short",year:"numeric"});
}

function renderTable() {
  const tbody = document.getElementById("adminTableBody");
  const empty = document.getElementById("adminEmpty");
  tbody.innerHTML = "";
  const data = getSortedFiltered();
  if (!data.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  data.forEach((reg, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-num">${i+1}</td>
      <td>${reg.name||"—"}</td>
      <td>${formatDate(reg.dateApplied)}</td>
      <td>${reg.icNo||"—"}</td>
      <td class="status-cell">
        <div class="toggle-wrap">
          <label class="toggle-switch">
            <input type="checkbox" class="status-toggle" data-id="${reg.id}" ${reg.approved?"checked":""}/>
            <span class="toggle-track"></span>
            <span class="toggle-knob"></span>
          </label>
          <span class="toggle-status-text ${reg.approved?"approved":""}" id="status-text-${reg.id}">
            ${reg.approved ? "Diluluskan / Approved" : "Belum Diluluskan / Yet to be Approved"}
          </span>
        </div>
      </td>
      <td class="action-cell" id="action-cell-${reg.id}">
        <button class="btn-action-dots" data-id="${reg.id}">•••</button>
        <div class="action-dropdown" id="dropdown-${reg.id}">
          <button class="action-dropdown-item view-btn" data-id="${reg.id}"><span class="action-icon">📄</span> Lihat / View</button>
          <button class="action-dropdown-item print-btn" data-id="${reg.id}"><span class="action-icon">🖨️</span> Cetak / Print</button>
          <button class="action-dropdown-item delete delete-btn" data-id="${reg.id}"><span class="action-icon">🗑️</span> Padam / Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
  bindTableEvents();
}

// ─────────────────────────────────────────────
// TABLE EVENTS
// ─────────────────────────────────────────────
function bindTableEvents() {
  document.querySelectorAll(".status-toggle").forEach(t => {
    t.addEventListener("change", function() {
      const reg = registrations.find(r => r.id === this.dataset.id);
      if (!reg) return;
      reg.approved = this.checked;
      const el = document.getElementById(`status-text-${this.dataset.id}`);
      if (el) { el.textContent = reg.approved ? "Diluluskan / Approved" : "Belum Diluluskan / Yet to be Approved"; el.className = `toggle-status-text ${reg.approved?"approved":""}`; }
      saveRegistrations();
    });
  });

  document.querySelectorAll(".btn-action-dots").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      document.querySelectorAll(".action-dropdown").forEach(d => { if (d.id !== `dropdown-${this.dataset.id}`) d.classList.remove("open"); });
      document.getElementById(`dropdown-${this.dataset.id}`).classList.toggle("open");
    });
  });

  document.addEventListener("click", () => document.querySelectorAll(".action-dropdown").forEach(d => d.classList.remove("open")));

  document.querySelectorAll(".view-btn").forEach(btn => btn.addEventListener("click", function() { openViewModal(this.dataset.id); }));
  document.querySelectorAll(".print-btn").forEach(btn => btn.addEventListener("click", function() { printRecord(this.dataset.id); }));
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      pendingDeleteId = this.dataset.id;
      document.getElementById("deleteModal").style.display = "flex";
    });
  });
}

// ─────────────────────────────────────────────
// VIEW MODAL
// ─────────────────────────────────────────────
const genderMap   = { male:"Lelaki / Male", female:"Perempuan / Female" };
const maritalMap  = { single:"Bujang / Single", engaged:"Bertunang / Engaged", married:"Berkahwin / Married", divorced:"Bercerai / Divorced", widowed:"Janda/Duda / Widowed" };
const baptismMap  = { baptised:"Sudah Dibaptis", notBaptised:"Belum Dibaptis" };

function buildViewHTML(reg) {
  const a = reg.sectionA || {};
  const servicesB = reg.sectionB?.services || {};
  const haveList = [], wantList = [];
  Object.entries(servicesB).forEach(([idx,val]) => {
    const n = SERVICE_NAMES[parseInt(idx)] || `Service ${idx}`;
    if (val.have) haveList.push(n);
    if (val.want) wantList.push(n);
  });
  const children = reg.sectionC?.children || [];
  const childrenHTML = children.length
    ? children.map((c,i) => `<div class="view-field"><span class="view-field-label">Anak ${i+1} / Child ${i+1}</span><span class="view-field-value">${c.name||"—"} (${genderMap[c.gender]||"—"}) — MyKid: ${c.myKid||"—"}</span></div>`).join("")
    : `<div class="view-field"><span class="view-field-value">Tiada Anak berumur 12 tahun dan ke bawah / No Children aged 12 and below</span></div>`;
  const e = reg.sectionE || {};
  return `
    <div class="view-section"><div class="view-section-title">A. Maklumat Peribadi / Personal Information</div>
    <div class="view-grid">
      <div class="view-field"><span class="view-field-label">Nama Penuh / Full Name</span><span class="view-field-value">${a.fullName||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">No. KP / IC No.</span><span class="view-field-value">${a.icNo||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Jantina / Gender</span><span class="view-field-value">${genderMap[a.gender]||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Tarikh Lahir / DOB</span><span class="view-field-value">${a.dob||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Bangsa / Race</span><span class="view-field-value">${a.race||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Status Perkahwinan / Marital Status</span><span class="view-field-value">${maritalMap[a.maritalStatus]||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Status Pembaptisan / Baptism</span><span class="view-field-value">${baptismMap[a.baptismStatus]||"—"}${a.baptismDate?" ("+a.baptismDate+")":""}</span></div>
      <div class="view-field"><span class="view-field-label">Warganegara / Citizenship</span><span class="view-field-value">${a.citizenship==="citizen"?"Warganegara Malaysia":(a.countryOfOrigin||"—")}</span></div>
      <div class="view-field"><span class="view-field-label">Nombor Telefon / Phone</span><span class="view-field-value">${a.phoneNumber||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Pekerjaan / Occupation</span><span class="view-field-value">${a.occupation||"Tiada Maklumat / No Information"}</span></div>
      <div class="view-field"><span class="view-field-label">Gereja Asal / Original Church</span><span class="view-field-value">${a.originalChurch||"Tiada Maklumat / No Information"}</span></div>
      <div class="view-field"><span class="view-field-label">Tahun Menyertai / Year Joined</span><span class="view-field-value">${a.yearJoining||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Kod Komsel / Komsel Code</span><span class="view-field-value">${a.komselCode||"—"}</span></div>
      <div class="view-field" style="grid-column:1/-1"><span class="view-field-label">Alamat / Address</span><span class="view-field-value">${a.currentAddress||"—"}</span></div>
    </div></div>
    <div class="view-section"><div class="view-section-title">B. Bidang Pelayanan / Field of Service</div>
    <div class="view-grid">
      <div class="view-field"><span class="view-field-label">Pernah Terlibat / Have Been Involved</span><span class="view-field-value">${haveList.length?haveList.join(", "):"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Ingin Terlibat / Would Like to Be Involved</span><span class="view-field-value">${wantList.length?wantList.join(", "):"—"}</span></div>
    </div></div>
    <div class="view-section"><div class="view-section-title">C. Maklumat Kanak-kanak / Children Information</div><div class="view-grid">${childrenHTML}</div></div>
    <div class="view-section"><div class="view-section-title">D. Ikrar Jemaat / Church Pledge</div>
    <div class="view-grid"><div class="view-field"><span class="view-field-label">Bersetuju / Agreed</span><span class="view-field-value">${reg.sectionD?.pledgeAgreed?"✅ Ya / Yes":"❌ Tidak / No"}</span></div></div></div>
    <div class="view-section"><div class="view-section-title">E. Pengakuan Jemaat / Confession</div>
    <div class="view-grid">
      <div class="view-field"><span class="view-field-label">Komsel</span><span class="view-field-value">${e.komsel||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Sejak / Since</span><span class="view-field-value">${e.since||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Pemimpin / Leader</span><span class="view-field-value">${e.leader||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Tarikh / Date</span><span class="view-field-value">${formatDate(e.date)}</span></div>
    </div></div>`;
}

function openViewModal(id) {
  const reg = registrations.find(r => r.id === id);
  if (!reg) return;
  document.getElementById("viewModalBody").innerHTML = buildViewHTML(reg);
  document.getElementById("editModalBtn").onclick = () => alert("Edit feature will be connected to Firebase in the next phase.");
  document.getElementById("viewModal").style.display = "flex";
}

document.getElementById("closeViewModal").addEventListener("click", () => document.getElementById("viewModal").style.display = "none");
document.getElementById("closeViewModalBtn").addEventListener("click", () => document.getElementById("viewModal").style.display = "none");

// ─────────────────────────────────────────────
// PRINT
// ─────────────────────────────────────────────
function printRecord(id) {
  const reg = registrations.find(r => r.id === id);
  if (!reg) return;

  const a = reg.sectionA || {};
  const servicesB = reg.sectionB?.services || {};
  const haveList = [], wantList = [];
  Object.entries(servicesB).forEach(([idx,val]) => {
    const n = SERVICE_NAMES[parseInt(idx)] || `Service ${idx}`;
    if (val.have) haveList.push({ num:parseInt(idx), name:n });
    if (val.want) wantList.push({ num:parseInt(idx), name:n });
  });

  // Build service rows for print table
  const allNums = [...new Set([...haveList.map(x=>x.num), ...wantList.map(x=>x.num)])].sort((a,b)=>a-b);
  const serviceRows = allNums.length
    ? allNums.map((num, i) => {
        const h = haveList.find(x=>x.num===num) ? "✓" : "";
        const w = wantList.find(x=>x.num===num) ? "✓" : "";
        return `<tr><td>${i+1}</td><td>${SERVICE_NAMES[num]||"—"}</td><td style="text-align:center;">${h}</td><td style="text-align:center;">${w}</td></tr>`;
      }).join("")
    : "<tr><td colspan='4' style='text-align:center;font-style:italic;'>—</td></tr>";

  const children = reg.sectionC?.children || [];
  const childrenPrint = children.length
    ? children.map((c,i) => `<p>${i+1}. ${c.name||"—"} (${genderMap[c.gender]||"—"}) — MyKid: ${c.myKid||"—"}</p>`).join("")
    : "<p>Tiada Anak berumur 12 tahun dan ke bawah / No Children aged 12 and below</p>";

  const e = reg.sectionE || {};
  const pledgeItems = [
    "Saya mengokong penuh Visi, Misi, Nilai dan Struktur gereja ini memperluaskan kerajaan Syurga di Bumi. / I fully support the Vision, Mission, Values and Structure of this church to expand the kingdom of Heaven on Earth.",
    "Saya siap untuk setia mendokong & terlibat dalam pelayanan gereja melalui Pemberian Persepuluhan & Sumbangan Kewangan. / I am ready to faithfully support & be involved in church ministry through Tithing & Financial Contributions.",
    "Saya komited untuk setia mendokong pelayanan gereja seperti Ibadah Raya, Komsel & Doa Korporat / Syafaat. / I am committed to faithfully supporting church services such as Raya Worship, Komsel & Corporate Prayer / Intercession.",
    "Saya akan selalu menjaga kesaksian hidup saya baik didalam mahupun diluar gereja. / I will always guard my life's testimony both inside and outside the church.",
    "Saya akan selalu menjaga hubungan baik diantara anggota gereja. / I will always maintain good relations between fellow church members.",
    "Saya akan taat berdoa bagi pertumbuhan & perkembangan gereja. / I will devoutly pray for the growth & development of the church.",
    "Saya siap untuk dibimbing, dinasihati & ditegur bila keadaan memerlukan demi kebaikan saya. / I am ready to be guided, advised & reprimanded when the situation requires it for my good."
  ];

  const printHTML = `
    <html><head><title>BEM On The Rock — ${a.fullName||"Pendaftar"}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; margin: 2cm; }
      h1 { text-align:center; font-size:14pt; margin-bottom:2px; }
      h2 { text-align:center; font-size:11pt; font-weight:normal; margin-bottom:20px; }
      h3 { font-size:11pt; border-bottom:1px solid #000; padding-bottom:3px; margin:18px 0 8px; text-transform:uppercase; letter-spacing:0.05em; }
      p { margin:3px 0; line-height:1.6; }
      table { width:100%; border-collapse:collapse; margin:8px 0; }
      th, td { border:1px solid #000; padding:5px 8px; font-size:10pt; text-align:left; }
      th { background:#f0f0f0; font-weight:bold; }
      .row { display:flex; gap:20px; margin-bottom:4px; }
      .lbl { font-weight:bold; min-width:200px; }
      ol { margin:4px 0; padding-left:20px; }
      ol li { margin-bottom:6px; }
      .pledge-agreed { font-weight:bold; margin-top:8px; }
      .section-f, .section-g { margin-top:24px; }
      .blank { display:inline-block; border-bottom:1px solid #000; min-width:120px; }
      .sig-line { margin-top:40px; display:flex; gap:60px; }
      .sig-block { flex:1; }
      .sig-block p { border-top:1px solid #000; margin-top:30px; font-size:9pt; }
      .office-box { border:1px solid #000; padding:12px; margin-top:8px; }
      @media print { body { margin:1.5cm; } }
    </style></head><body>
    <h1>BEM On The Rock</h1>
    <h2>Borang Pendaftaran Keanggotaan Gereja / Church Membership Registration Form</h2>

    <h3>A. Maklumat Peribadi / Personal Information</h3>
    <div class="row"><span class="lbl">Nama Penuh / Full Name:</span><span>${a.fullName||"—"}</span></div>
    <div class="row"><span class="lbl">No. KP / IC No.:</span><span>${a.icNo||"—"}</span></div>
    <div class="row"><span class="lbl">Jantina / Gender:</span><span>${genderMap[a.gender]||"—"}</span></div>
    <div class="row"><span class="lbl">Tarikh Lahir / Date of Birth:</span><span>${a.dob||"—"}</span></div>
    <div class="row"><span class="lbl">Bangsa / Race:</span><span>${a.race||"—"}</span></div>
    <div class="row"><span class="lbl">Status Perkahwinan / Marital Status:</span><span>${maritalMap[a.maritalStatus]||"—"}</span></div>
    <div class="row"><span class="lbl">Status Pembaptisan / Baptism Status:</span><span>${baptismMap[a.baptismStatus]||"—"}${a.baptismDate?" ("+a.baptismDate+")":""}</span></div>
    <div class="row"><span class="lbl">Warganegara / Citizenship:</span><span>${a.citizenship==="citizen"?"Warganegara Malaysia":(a.countryOfOrigin||"—")}</span></div>
    <div class="row"><span class="lbl">Nombor Telefon / Phone:</span><span>${a.phoneNumber||"—"}</span></div>
    <div class="row"><span class="lbl">Pekerjaan / Occupation:</span><span>${a.occupation||"Tiada Maklumat / No Information"}</span></div>
    <div class="row"><span class="lbl">Gereja Asal / Original Church:</span><span>${a.originalChurch||"Tiada Maklumat / No Information"}</span></div>
    <div class="row"><span class="lbl">Tahun Menyertai / Year Joined:</span><span>${a.yearJoining||"—"}</span></div>
    <div class="row"><span class="lbl">Kod Komsel / Komsel Code:</span><span>${a.komselCode||"—"}</span></div>
    <div class="row"><span class="lbl">Alamat Terkini / Current Address:</span><span>${a.currentAddress||"—"}</span></div>

    <h3>B. Bidang Pelayanan / Field of Service</h3>
    <table>
      <thead><tr><th>Bil./Num.</th><th>Pelayanan / Service</th><th>Pernah Terlibat / Have Been Involved</th><th>Ingin Terlibat / Would Like to Be Involved</th></tr></thead>
      <tbody>${serviceRows}</tbody>
    </table>

    <h3>C. Maklumat Kanak-kanak / Children Information</h3>
    ${childrenPrint}

    <h3>D. Ikrar Jemaat / Church Pledge</h3>
    <ol>${pledgeItems.map(p=>`<li>${p}</li>`).join("")}</ol>
    <p class="pledge-agreed">Bersetuju / Agreed: ${reg.sectionD?.pledgeAgreed?"✓ Ya / Yes":"✗ Tidak / No"}</p>

    <h3>E. Pengakuan Jemaat / Confession</h3>
    <p>Saya mengaku bahawa saya telah menghadiri KOMSEL <strong>${e.komsel||"___"}</strong> sejak <strong>${e.since||"___"}</strong> dibawah pimpinan saudara/i <strong>${e.leader||"___"}</strong>.</p>
    <p><em>I acknowledge that I have attended KOMSEL <strong>${e.komsel||"___"}</strong> since <strong>${e.since||"___"}</strong> under the leadership of <strong>${e.leader||"___"}</strong>.</em></p>
    <br/>
    <p>Saya, <strong>${e.name||"___"}</strong> akui bahawa maklumat di atas adalah benar.</p>
    <p><em>I, <strong>${e.name||"___"}</strong> acknowledge that the above information is true.</em></p>
    <br/>
    <p>Tarikh / Date: <strong>${formatDate(e.date)}</strong></p>

    <div class="section-f">
    <h3>F. Pengakuan Pemimpin Komsel / Komsel Leader Confession</h3>
    <p>Saya, <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> dengan nombor kad pengenalan <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, pemimpin bagi Kod Komsel <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> dengan ini mengesahkan bahawa saudara/i <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> telah menghadiri komsel sejak <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
    <p>Beliau telah menunjukkan komitmen dengan mematuhi peraturan dan ikrar di atas.</p>
    <div class="sig-line">
      <div class="sig-block"><p>Tarikh / Date</p></div>
      <div class="sig-block"><p>Tandatangan / Signature</p></div>
    </div></div>

    <div class="section-g">
    <h3>G. Untuk Kegunaan Pejabat / For Office Use</h3>
    <div class="office-box">
      <p>Borang diterima pada / Form received on: <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
      <p>Jenis Keanggotaan / Membership Type: &nbsp;&nbsp; ☐ Tetap / Fixed &nbsp;&nbsp;&nbsp;&nbsp; ☐ Bersekutu / Associate</p>
    </div></div>

    </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(printHTML);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (!pendingDeleteId) return;
  registrations = registrations.filter(r => r.id !== pendingDeleteId);
  saveRegistrations();
  renderTable();
  pendingDeleteId = null;
  document.getElementById("deleteModal").style.display = "none";
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  document.getElementById("deleteModal").style.display = "none";
});

document.getElementById("closeDeleteModal").addEventListener("click", () => {
  pendingDeleteId = null;
  document.getElementById("deleteModal").style.display = "none";
});

// ─────────────────────────────────────────────
// NEW ADMIN REGISTRATION
// ─────────────────────────────────────────────
document.getElementById("btnNewAdmin").addEventListener("click", () => {
  document.getElementById("newAdminModal").style.display = "flex";
});

document.getElementById("closeNewAdminModal").addEventListener("click", closeNewAdminModal);
document.getElementById("cancelNewAdminBtn").addEventListener("click", closeNewAdminModal);

function closeNewAdminModal() {
  document.getElementById("newAdminModal").style.display = "none";
  ["newAdminUsername","newAdminEmail","newAdminPassword","newAdminRepeatPassword"].forEach(id => {
    document.getElementById(id).value = "";
  });
  ["err-newAdminUsername","err-newAdminEmail","err-newAdminPassword","err-newAdminRepeatPassword"].forEach(id => {
    document.getElementById(id).textContent = "";
  });
}

document.getElementById("confirmNewAdminBtn").addEventListener("click", () => {
  let valid = true;
  const username = document.getElementById("newAdminUsername").value.trim();
  const email    = document.getElementById("newAdminEmail").value.trim();
  const password = document.getElementById("newAdminPassword").value;
  const repeat   = document.getElementById("newAdminRepeatPassword").value;

  const setErr = (id, msg) => { document.getElementById(id).textContent = msg; valid = false; };
  const clearErr = id => { document.getElementById(id).textContent = ""; };

  clearErr("err-newAdminUsername"); clearErr("err-newAdminEmail");
  clearErr("err-newAdminPassword"); clearErr("err-newAdminRepeatPassword");

  if (!username) setErr("err-newAdminUsername", "Nama pengguna diperlukan / Username is required");
  if (!email || !email.includes("@")) setErr("err-newAdminEmail", "Emel tidak sah / Invalid email");
  if (password.length < 6) setErr("err-newAdminPassword", "Minimum 6 aksara / Minimum 6 characters");
  if (password !== repeat) setErr("err-newAdminRepeatPassword", "Kata laluan tidak sepadan / Passwords do not match");

  if (!valid) return;

  // TODO: Connect to Firebase Authentication createUserWithEmailAndPassword
  alert(`Admin baharu berjaya didaftarkan!\nNew admin successfully registered!\n\nUsername: ${username}\nEmail: ${email}\n\n(Will be connected to Firebase Authentication.)`);
  closeNewAdminModal();
});

// ─────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────
function saveRegistrations() {
  localStorage.setItem("bem_otr_registrations", JSON.stringify(registrations));
}