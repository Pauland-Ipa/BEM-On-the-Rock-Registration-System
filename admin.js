"use strict";

/* ═══════════════════════════════════════════════
   BEM On The Rock — admin.js
   Firebase Auth + Firestore Integration
═══════════════════════════════════════════════ */

document.getElementById("adminFooterYear").textContent = new Date().getFullYear();

function generateAdminUniqueID(fullName, icNo, yearJoining) {
  const names    = (fullName || "").trim().split(/\s+/).filter(Boolean);
  const initials = names.map(n => n[0].toUpperCase()).join("");
  const ic       = (icNo || "").replace(/-/g, "");
  const last4    = ic.length >= 4 ? ic.slice(-4) : ic.padStart(4, "0");
  const yr       = String(yearJoining || "").slice(-2);
  return `${initials}-${last4}-${yr}`;
}

const SERVICE_NAMES = [
  "","Pastoral","Pekerja Sepenuh Masa (Gereja)","[Rock Wave] Penyanyi","[Rock Wave] Pemain Muzik",
  "[Rock Wave] Penari Kreatif","Multimedia","Pengendali Sistem Bunyi","Pengendali Pencahayaan",
  "Usher","Keselamatan & Parkir","Krew Pentas","Hospitaliti untuk Jemaat Baru","Hospitaliti untuk VIP",
  "Rock Essence","Rock Resource","Kaunter Maklumat","Pengangkutan","Pendoa Syafaat",
  "Kebajikan & Sosial","Adiwira","Pembantu Peribadi Pastor & Penceramah","Penginjilan","Tim Persembahan"
];

const genderMap  = { male:"Lelaki / Male", female:"Perempuan / Female" };
const maritalMap = { single:"Bujang / Single", engaged:"Bertunang / Engaged", married:"Berkahwin / Married", divorced:"Bercerai / Divorced", widowed:"Janda/Duda / Widowed" };
const baptismMap = { baptised:"Sudah Dibaptis", notBaptised:"Belum Dibaptis" };

let registrations  = [];
let pendingDeleteId = null;
let currentSort    = { by:"date", order:"asc" };
let searchQuery    = "";

// ─────────────────────────────────────────────
// AUTH STATE — show login or admin page
// ─────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginOverlay").style.display = "none";
    document.getElementById("adminPage").style.display = "block";
    loadRegistrations();
  } else {
    document.getElementById("adminPage").style.display = "none";
    document.getElementById("loginOverlay").style.display = "flex";
  }
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
document.getElementById("btnLogin").addEventListener("click", async () => {
  const email    = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  const errEl    = document.getElementById("loginError");
  const btn      = document.getElementById("btnLogin");

  if (!email || !password) {
    errEl.textContent = "Sila isi emel dan kata laluan. / Please enter email and password.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Log masuk... / Logging in...";
  errEl.textContent = "";

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged will handle showing the admin page
  } catch (err) {
    errEl.textContent = "Emel atau kata laluan salah. / Incorrect email or password.";
    btn.disabled = false;
    btn.textContent = "Log Masuk / Login";
  }
});

// Allow Enter key on login fields
["adminUsername","adminPassword"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("btnLogin").click();
  });
});

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
document.getElementById("btnLogout").addEventListener("click", async () => {
  await auth.signOut();
  document.getElementById("adminUsername").value = "";
  document.getElementById("adminPassword").value = "";
});

// ─────────────────────────────────────────────
// LOAD REGISTRATIONS FROM FIRESTORE
// ─────────────────────────────────────────────
function loadRegistrations() {
  db.collection("registrations")
    .orderBy("submittedAt", "desc")
    .onSnapshot(snapshot => {
      registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderTable();
    }, err => {
      console.error("Firestore error:", err);
    });
}

// ─────────────────────────────────────────────
// SEARCH & SORT
// ─────────────────────────────────────────────
document.getElementById("adminSearch").addEventListener("input", function() {
  searchQuery = this.value.trim().toLowerCase();
  renderTable();
});

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
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("ms-MY", { day:"2-digit", month:"short", year:"numeric" });
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
    const uniqueID = generateAdminUniqueID(reg.name, reg.icNo, reg.sectionA?.yearJoining);
    tr.innerHTML = `
      <td class="col-num">${i+1}</td>
      <td>
        <div style="font-weight:700;">${(reg.name||"—").toUpperCase()}</div>
        <div style="font-size:0.78rem;color:var(--marigold);font-family:var(--font-display);letter-spacing:0.05em;">${uniqueID}</div>
      </td>
      <td>${formatDate(reg.submittedAt || reg.dateApplied)}</td>
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
// TABLE ROW EVENTS
// ─────────────────────────────────────────────
function bindTableEvents() {
  // Status toggle — update Firestore
  document.querySelectorAll(".status-toggle").forEach(t => {
    t.addEventListener("change", async function() {
      const id = this.dataset.id;
      const approved = this.checked;
      try {
        await db.collection("registrations").doc(id).update({ approved });
        const el = document.getElementById(`status-text-${id}`);
        if (el) {
          el.textContent = approved ? "Diluluskan / Approved" : "Belum Diluluskan / Yet to be Approved";
          el.className = `toggle-status-text ${approved ? "approved" : ""}`;
        }
      } catch (err) {
        console.error("Toggle error:", err);
        this.checked = !approved; // revert on error
      }
    });
  });

  // Three-dot dropdown — position using fixed coordinates
  document.querySelectorAll(".btn-action-dots").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const id = this.dataset.id;
      // Close all others
      document.querySelectorAll(".action-dropdown").forEach(d => {
        if (d.id !== `dropdown-${id}`) {
          d.classList.remove("open");
          d.style.top = "";
          d.style.left = "";
        }
      });
      const dropdown = document.getElementById(`dropdown-${id}`);
      const rect = this.getBoundingClientRect();
      dropdown.style.top  = (rect.bottom + 6) + "px";
      dropdown.style.left = (rect.left + rect.width / 2 - 85) + "px";
      dropdown.classList.toggle("open");
    });
  });

  document.addEventListener("click", () =>
    document.querySelectorAll(".action-dropdown").forEach(d => d.classList.remove("open"))
  );
  document.addEventListener("scroll", () =>
    document.querySelectorAll(".action-dropdown").forEach(d => d.classList.remove("open")),
    true
  );

  document.querySelectorAll(".view-btn").forEach(btn =>
    btn.addEventListener("click", function() { openViewModal(this.dataset.id); })
  );
  document.querySelectorAll(".print-btn").forEach(btn =>
    btn.addEventListener("click", function() { printRecord(this.dataset.id); })
  );
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
    : `<div class="view-field"><span class="view-field-value">Tiada Anak / No Children aged 12 and below</span></div>`;
  const e = reg.sectionE || {};
  const photoHTML = reg.photoURL
    ? `<div class="view-field" style="grid-column:1/-1;display:flex;justify-content:center;margin-bottom:0.5rem;">
        <img src="${reg.photoURL}" alt="Gambar Pasport" style="width:90px;height:115px;object-fit:cover;border-radius:6px;border:2px solid var(--marigold-dim);"/>
       </div>`
    : "";
  return `
    <div class="view-section"><div class="view-section-title">A. Maklumat Peribadi / Personal Information</div>
    <div class="view-grid">
      ${photoHTML}
      <div class="view-field"><span class="view-field-label">Nama Penuh / Full Name</span><span class="view-field-value" style="text-transform:uppercase;">${a.fullName||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">No. KP / IC No.</span><span class="view-field-value">${reg.icNo||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Jantina / Gender</span><span class="view-field-value">${genderMap[a.gender]||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Tarikh Lahir / DOB</span><span class="view-field-value">${a.dob||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Bangsa / Race</span><span class="view-field-value">${a.race||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Status Perkahwinan / Marital Status</span><span class="view-field-value">${maritalMap[a.maritalStatus]||"—"}${a.partnerName?" — "+a.partnerName:""}${a.latePartnerName?" — "+a.latePartnerName:""}</span></div>
      <div class="view-field"><span class="view-field-label">Status Pembaptisan / Baptism</span><span class="view-field-value">${baptismMap[a.baptismStatus]||"—"}${a.baptismYear?" ("+a.baptismYear+")":""}</span></div>
      <div class="view-field"><span class="view-field-label">Warganegara / Citizenship</span><span class="view-field-value">${a.citizenship==="citizen"?"Warganegara Malaysia":(a.countryOfOrigin||"—")}</span></div>
      <div class="view-field"><span class="view-field-label">Nombor Telefon / Phone</span><span class="view-field-value">${a.phoneNumber||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Pekerjaan / Occupation</span><span class="view-field-value">${a.occupation||"Tiada Maklumat / No Information"}</span></div>
      <div class="view-field"><span class="view-field-label">Gereja Asal / Original Church</span><span class="view-field-value">${a.originalChurch||"Tiada Maklumat / No Information"}</span></div>
      <div class="view-field"><span class="view-field-label">Tahun Menyertai / Year Joined</span><span class="view-field-value">${a.yearJoining||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Kod Komsel / Cell Group Code</span><span class="view-field-value">${a.komselCode||"—"}</span></div>
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
      <div class="view-field"><span class="view-field-label">Kod Komsel / Cell Group Code</span><span class="view-field-value">${e.komsel||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Sejak / Since</span><span class="view-field-value">${e.since||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Pemimpin / Leader</span><span class="view-field-value">${e.leader||"—"}</span></div>
      <div class="view-field"><span class="view-field-label">Tarikh / Date</span><span class="view-field-value">${formatDate(e.date)}</span></div>
    </div></div>`;
}

function openViewModal(id) {
  const reg = registrations.find(r => r.id === id);
  if (!reg) return;
  document.getElementById("viewModalBody").innerHTML = buildViewHTML(reg);
  document.getElementById("editModalBtn").onclick = () => alert("Edit feature coming in the next phase.");
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
  const allNums = [...new Set([...haveList.map(x=>x.num),...wantList.map(x=>x.num)])].sort((a,b)=>a-b);
  const serviceRows = allNums.length
    ? allNums.map((num,i) => {
        const h = haveList.find(x=>x.num===num) ? "✓" : "";
        const w = wantList.find(x=>x.num===num) ? "✓" : "";
        return `<tr><td>${i+1}</td><td>${SERVICE_NAMES[num]||"—"}</td><td style="text-align:center">${h}</td><td style="text-align:center">${w}</td></tr>`;
      }).join("")
    : "<tr><td colspan='4' style='text-align:center;font-style:italic'>—</td></tr>";

  const children = reg.sectionC?.children || [];
  const childrenPrint = children.length
    ? children.map((c,i) => `<p>${i+1}. ${c.name||"—"} (${genderMap[c.gender]||"—"}) — MyKid: ${c.myKid||"—"}</p>`).join("")
    : "<p>Tiada Anak berumur 12 tahun dan ke bawah / No Children aged 12 and below</p>";

  const e = reg.sectionE || {};
  const uniqueID = generateAdminUniqueID(reg.name, reg.icNo, a.yearJoining);
  const photoSection = reg.photoURL
    ? `<img src="${reg.photoURL}" style="float:right;width:90px;height:115px;object-fit:cover;border:1px solid #000;margin-left:12px;" alt="Photo"/>`
    : "";
  const pledgeItems = [
    "Saya menyokong penuh Visi, Misi, Nilai dan Struktur gereja ini memperluaskan kerajaan Syurga di Bumi. / I fully support the Vision, Mission, Values and Structure of this church to expand the kingdom of Heaven on Earth.",
    "Saya siap untuk mendokong & terlibat dalam pelayanan yang dipercayakan. / I am ready to support & get involved in the entrusted ministry.",
    "Saya siap untuk setia mendokong & terlibat dalam pelayanan gereja melalui Pemberian Persepuluhan & Sumbangan Kewangan. / I am ready to faithfully support & be involved in church ministry through Tithing & Financial Contributions.",
    "Saya komited untuk setia mendokong pelayanan gereja seperti Ibadah Raya, Komsel & Doa Korporat / Syafaat. / I am committed to faithfully supporting church services such as Raya Worship, Komsel & Corporate Prayer / Intercession.",
    "Saya akan selalu menjaga kesaksian hidup saya baik didalam mahupun diluar gereja. / I will always guard my life's testimony both inside and outside the church.",
    "Saya akan selalu menjaga hubungan baik diantara anggota gereja. / I will always maintain good relations between fellow church members.",
    "Saya akan taat berdoa bagi pertumbuhan & perkembangan gereja. / I will devoutly pray for the growth & development of the church.",
    "Saya siap untuk dibimbing, dinasihati & ditegur bila keadaan memerlukan demi kebaikan saya. / I am ready to be guided, advised & reprimanded when the situation requires it for my good."
  ];
    "Saya siap untuk dibimbing, dinasihati & ditegur bila keadaan memerlukan demi kebaikan saya. / I am ready to be guided, advised & reprimanded when the situation requires it for my good."
  ];

  const printHTML = `<html><head><title>BEM On The Rock — ${(a.fullName||"Pendaftar").toUpperCase()}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:11pt;color:#000;margin:2cm}
    h1{text-align:center;font-size:14pt;margin-bottom:2px}
    h2{text-align:center;font-size:11pt;font-weight:normal;margin-bottom:4px}
    h2.uid{text-align:center;font-size:10pt;color:#888;margin-bottom:16px}
    h3{font-size:11pt;border-bottom:1px solid #000;padding-bottom:3px;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.05em;clear:both}
    p{margin:3px 0;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin:8px 0}
    th,td{border:1px solid #000;padding:5px 8px;font-size:10pt;text-align:left}
    th{background:#f0f0f0;font-weight:bold}
    .row{display:flex;gap:20px;margin-bottom:4px}
    .lbl{font-weight:bold;min-width:200px}
    ol{margin:4px 0;padding-left:20px}
    ol li{margin-bottom:6px}
    .blank{display:inline-block;border-bottom:1px solid #000;min-width:120px}
    .sig-line{margin-top:40px;display:flex;gap:60px}
    .sig-block{flex:1}
    .sig-block p{border-top:1px solid #000;margin-top:30px;font-size:9pt}
    .office-box{border:1px solid #000;padding:12px;margin-top:8px}
    @media print{body{margin:1.5cm}}
  </style></head><body>
  <h1>BEM On The Rock</h1>
  <h2>Borang Pendaftaran Keanggotaan Gereja / Church Membership Registration Form</h2>
  <h2 class="uid">ID Unik / Unique ID: ${uniqueID}</h2>
  <h3>A. Maklumat Peribadi / Personal Information</h3>
  ${photoSection}
  <div class="row"><span class="lbl">Nama Penuh / Full Name:</span><span style="text-transform:uppercase;font-weight:bold">${a.fullName||"—"}</span></div>
  <div class="row"><span class="lbl">No. KP / IC No.:</span><span>${reg.icNo||"—"}</span></div>
  <div class="row"><span class="lbl">Jantina / Gender:</span><span>${genderMap[a.gender]||"—"}</span></div>
  <div class="row"><span class="lbl">Tarikh Lahir / Date of Birth:</span><span>${a.dob||"—"}</span></div>
  <div class="row"><span class="lbl">Bangsa / Race:</span><span>${a.race||"—"}</span></div>
  <div class="row"><span class="lbl">Status Perkahwinan / Marital Status:</span><span>${maritalMap[a.maritalStatus]||"—"}${a.partnerName?" — "+a.partnerName:""}${a.latePartnerName?" — "+a.latePartnerName:""}</span></div>
  <div class="row"><span class="lbl">Status Pembaptisan / Baptism:</span><span>${baptismMap[a.baptismStatus]||"—"}${a.baptismYear?" ("+a.baptismYear+")":""}</span></div>
  <div class="row"><span class="lbl">Warganegara / Citizenship:</span><span>${a.citizenship==="citizen"?"Warganegara Malaysia":(a.countryOfOrigin||"—")}</span></div>
  <div class="row"><span class="lbl">Nombor Telefon / Phone:</span><span>${a.phoneNumber||"—"}</span></div>
  <div class="row"><span class="lbl">Pekerjaan / Occupation:</span><span>${a.occupation||"Tiada Maklumat / No Information"}</span></div>
  <div class="row"><span class="lbl">Gereja Asal / Original Church:</span><span>${a.originalChurch||"Tiada Maklumat / No Information"}</span></div>
  <div class="row"><span class="lbl">Tahun Menyertai / Year Joined:</span><span>${a.yearJoining||"—"}</span></div>
  <div class="row"><span class="lbl">Kod Komsel / Cell Group Code:</span><span>${a.komselCode||"—"}</span></div>
  <div class="row"><span class="lbl">Alamat Terkini / Current Address:</span><span>${a.currentAddress||"—"}</span></div>
  <h3>B. Bidang Pelayanan / Field of Service</h3>
  <table><thead><tr><th>Bil.</th><th>Pelayanan / Service</th><th>Pernah Terlibat / Have Been Involved</th><th>Ingin Terlibat / Would Like to Be Involved</th></tr></thead>
  <tbody>${serviceRows}</tbody></table>
  <h3>C. Maklumat Kanak-kanak / Children Information</h3>
  ${childrenPrint}
  <h3>D. Ikrar Jemaat / Church Pledge</h3>
  <ol>${pledgeItems.map(p=>`<li>${p}</li>`).join("")}</ol>
  <p><strong>Bersetuju / Agreed: ${reg.sectionD?.pledgeAgreed?"✓ Ya / Yes":"✗ Tidak / No"}</strong></p>
  <h3>E. Pengakuan Jemaat / Confession</h3>
  <p>Saya mengaku bahawa saya telah menghadiri KOMSEL <strong>${e.komsel||"___"}</strong> sejak <strong>${e.since||"___"}</strong> dibawah pimpinan saudara/i <strong>${e.leader||"___"}</strong>.</p>
  <p><em>I acknowledge that I have attended KOMSEL <strong>${e.komsel||"___"}</strong> since <strong>${e.since||"___"}</strong> under the leadership of <strong>${e.leader||"___"}</strong>.</em></p><br/>
  <p>Saya, <strong>${e.name||"___"}</strong> akui bahawa maklumat di atas adalah benar.</p>
  <p><em>I, <strong>${e.name||"___"}</strong> acknowledge that the above information is true.</em></p><br/>
  <p>Tarikh / Date: <strong>${formatDate(e.date)}</strong></p>
  <h3>F. Pengakuan Pemimpin Komsel / Komsel Leader Confession</h3>
  <p>Saya, <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> dengan nombor kad pengenalan <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, pemimpin bagi Kod Komsel <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> dengan ini mengesahkan bahawa saudara/i <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> telah menghadiri komsel sejak <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
  <p>Beliau telah menunjukkan komitmen dengan mematuhi peraturan dan ikrar di atas.</p>
  <div class="sig-line"><div class="sig-block"><p>Tarikh / Date</p></div><div class="sig-block"><p>Tandatangan / Signature</p></div></div>
  <h3>G. Untuk Kegunaan Pejabat / For Office Use</h3>
  <div class="office-box">
    <p>Borang diterima pada / Form received on: <span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
    <p>Jenis Keanggotaan / Membership Type: &nbsp;&nbsp; ☐ Tetap / Fixed &nbsp;&nbsp;&nbsp;&nbsp; ☐ Bersekutu / Associate</p>
  </div>
  </body></html>`;

  const win = window.open("","_blank");
  win.document.write(printHTML);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ─────────────────────────────────────────────
// DELETE — Firestore
// ─────────────────────────────────────────────
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  try {
    await db.collection("registrations").doc(pendingDeleteId).delete();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Ralat semasa memadam. / Error deleting record.");
  }
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