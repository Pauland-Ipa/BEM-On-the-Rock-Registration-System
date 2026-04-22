"use strict";
/* ═══════════════════════════════════════════════
   BEM On The Rock — payment.js
   Annual fee: RM10/year per active/inactive member
   Fee starts from year membership was approved
═══════════════════════════════════════════════ */

document.getElementById("payFooterYear").textContent = new Date().getFullYear();

const ANNUAL_FEE = 10; // RM10 per year
let memberDocId   = null;
let memberData    = null;

// ── IC Format ──
function formatIC(v) {
  const d = v.replace(/\D/g,"");
  let f = d;
  if (d.length>6) f = d.substring(0,6)+"-"+d.substring(6);
  if (d.length>8) f = f.substring(0,9)+"-"+d.substring(8);
  return f.substring(0,14);
}

document.getElementById("payIC").addEventListener("input", function() {
  this.value = formatIC(this.value);
});

function showScreen(id) {
  ["screen-verify","screen-payment"].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle("active", s===id);
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

// ── IC Check ──
document.getElementById("btnCheckPayment").addEventListener("click", async () => {
  const ic    = document.getElementById("payIC").value.replace(/-/g,"");
  const errEl = document.getElementById("err-payIC");
  const notice= document.getElementById("payNotice");
  errEl.textContent = "";

  if (ic.length !== 12) {
    errEl.textContent = "Sila masukkan No. KP yang sah / Enter a valid IC No.";
    return;
  }

  notice.textContent = "Menyemak... / Checking...";
  try {
    const snap = await db.collection("registrations").where("icNo","==",ic).limit(1).get();
    if (snap.empty) {
      errEl.textContent = "Tiada rekod dijumpai / No record found with this IC No.";
      notice.textContent = "";
      return;
    }

    memberDocId = snap.docs[0].id;
    memberData  = snap.docs[0].data();
    notice.textContent = "";
    populatePaymentScreen();
    showScreen("screen-payment");

  } catch(e) {
    errEl.textContent = "Ralat sistem / System error.";
    notice.textContent = "";
  }
});

// ── Calculate pending fees ──
function calculatePendingFees(reg) {
  const currentYear = new Date().getFullYear();
  const approvedAt  = reg.approvedAt?.toDate ? reg.approvedAt.toDate() : null;
  const paidYears   = reg.paidYears || []; // array of years paid e.g. [2024, 2025]

  if (!approvedAt) {
    // Not yet approved — first fee due immediately upon approval
    // Bill for current year only
    return [{ year: currentYear, label: `${currentYear} Yuran Tahunan / Annual Fee`, amount: ANNUAL_FEE }]
      .filter(item => !paidYears.includes(item.year));
  }

  const approvedYear = approvedAt.getFullYear();
  // Bill every year from approved year up to current year
  const fees = [];
  for (let y = approvedYear; y <= currentYear; y++) {
    if (!paidYears.includes(y)) {
      fees.push({ year: y, label: `${y} Yuran Tahunan / Annual Fee`, amount: ANNUAL_FEE });
    }
  }
  return fees;
}

// ── Populate payment screen ──
function populatePaymentScreen() {
  const a = memberData.sectionA || {};

  // Photo
  const photoEl = document.getElementById("payMemberPhoto");
  photoEl.innerHTML = memberData.photoURL
    ? `<img src="${memberData.photoURL}" style="width:52px;height:65px;object-fit:cover;border-radius:4px;border:1.5px solid var(--marigold-dim);" alt="Photo"/>`
    : `<div style="width:52px;height:65px;background:var(--bg-input);border-radius:4px;border:1.5px solid var(--border-input);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">👤</div>`;

  document.getElementById("payMemberName").textContent =
    (a.fullName || memberData.name || "—").toUpperCase();
  document.getElementById("payMemberUID").textContent =
    `ID: ${memberData.uniqueID || "—"}`;

  const statusText = memberData.approved ? "✔ Aktif / Active" :
                     memberData.transferred ? "↗ Berpindah / Transferred" :
                     "✖ Tidak Aktif / Inactive";
  const statusColor = memberData.approved ? "#4CAF7D" : memberData.transferred ? "#3B9EE8" : "#E05555";
  document.getElementById("payMemberStatus").innerHTML =
    `<span style="color:${statusColor};font-weight:700;font-size:0.85rem;">${statusText}</span>`;

  // Fees
  const pendingFees = calculatePendingFees(memberData);
  const tbody = document.getElementById("paymentTableBody");
  tbody.innerHTML = "";

  if (pendingFees.length === 0) {
    document.getElementById("payActionArea").style.display = "none";
    document.getElementById("allPaidMsg").style.display = "block";
    document.getElementById("payTotalAmount").textContent = "RM 0.00";
    return;
  }

  document.getElementById("payActionArea").style.display = "block";
  document.getElementById("allPaidMsg").style.display = "none";

  pendingFees.forEach((fee, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-num">${i+1}</td>
      <td>${fee.label}</td>
      <td style="text-align:right;font-weight:700;color:var(--marigold-bright);">RM ${fee.amount.toFixed(2)}</td>
      <td style="text-align:center;"><span style="color:#E05555;font-size:0.78rem;font-family:var(--font-display);letter-spacing:0.05em;">Belum Dibayar / Unpaid</span></td>`;
    tbody.appendChild(tr);
  });

  const total = pendingFees.reduce((sum, f) => sum + f.amount, 0);
  document.getElementById("payTotalAmount").textContent = `RM ${total.toFixed(2)}`;
}

// ── Back button ──
document.getElementById("btnBackPayment").addEventListener("click", () => showScreen("screen-verify"));

// ── Cash modal ──
document.getElementById("btnPayCash").addEventListener("click", () => {
  document.getElementById("cashModal").style.display = "flex";
});
document.getElementById("closeCashModal")?.addEventListener("click",    () => document.getElementById("cashModal").style.display="none");
document.getElementById("closeCashModalBtn")?.addEventListener("click", () => document.getElementById("cashModal").style.display="none");

// ── Online banking placeholder ──
document.getElementById("btnPayOnline").addEventListener("click", () => {
  document.getElementById("onlineModal").style.display = "flex";
});
document.getElementById("closeOnlineModal")?.addEventListener("click",    () => document.getElementById("onlineModal").style.display="none");
document.getElementById("closeOnlineModalBtn")?.addEventListener("click", () => document.getElementById("onlineModal").style.display="none");