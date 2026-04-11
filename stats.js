"use strict";
/* ═══════════════════════════════════════════════
   BEM On The Rock — stats.js
   Membership Statistics with Chart.js
═══════════════════════════════════════════════ */

document.getElementById("statsFooterYear").textContent = new Date().getFullYear();

// ── Chart colour palette (marigold theme) ──
const PALETTE = [
  "#FF8C00","#FFA333","#FFB347","#CC7000","#E67E00",
  "#FF6B00","#FFD580","#B35A00","#FF9E33","#FFCD80",
  "#E8A000","#D4760A","#C46A00","#F0A830","#FFC060"
];

const CHART_TEXT = getComputedStyle(document.documentElement)
  .getPropertyValue("--text-primary").trim() || "#F5F5F0";

const chartDefaults = {
  plugins: {
    legend: { labels: { color: CHART_TEXT, font: { family: "Crimson Pro, serif", size: 13 } } }
  },
  scales: {
    x: { ticks: { color: CHART_TEXT }, grid: { color: "rgba(255,140,0,0.1)" } },
    y: { ticks: { color: CHART_TEXT }, grid: { color: "rgba(255,140,0,0.1)" } }
  }
};

const pieDefaults = {
  plugins: {
    legend: { labels: { color: CHART_TEXT, font: { family: "Crimson Pro, serif", size: 13 } } }
  }
};

let allCharts = {};
let allData   = [];

// ── Auth guard ──
auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = "admin.html"; return; }
  loadAndRender("all");
});

document.getElementById("statsDateFilter").addEventListener("change", function() {
  loadAndRender(this.value);
});

async function loadAndRender(filter) {
  document.getElementById("statsLoading").style.display = "block";
  try {
    const snap = await db.collection("registrations").get();
    allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const filtered = applyDateFilter(allData, filter);
    renderAll(filtered);
  } catch(e) {
    console.error("Stats load error:", e);
  }
  document.getElementById("statsLoading").style.display = "none";
}

function applyDateFilter(data, filter) {
  if (filter === "all") return data;
  const now   = new Date();
  const today = now.toISOString().split("T")[0];
  return data.filter(r => {
    const d = r.submittedAt?.toDate ? r.submittedAt.toDate() : new Date(r.dateApplied || "");
    if (!d || isNaN(d)) return false;
    if (filter === "day")   return d.toISOString().split("T")[0] === today;
    if (filter === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (filter === "year")  return d.getFullYear() === now.getFullYear();
    return true;
  });
}

function countBy(data, fn) {
  const map = {};
  data.forEach(r => {
    const k = fn(r) || "Tidak Diketahui / Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}

function destroyChart(id) {
  if (allCharts[id]) { allCharts[id].destroy(); delete allCharts[id]; }
}

function getAgeGroup(dob) {
  if (!dob) return "Tidak Diketahui / Unknown";
  const birth = new Date(dob);
  if (isNaN(birth)) return "Tidak Diketahui / Unknown";
  const age = Math.floor((new Date() - birth) / (365.25 * 24 * 3600 * 1000));
  if (age < 13) return "Kanak-kanak / Child (<13)";
  if (age <= 17) return "Remaja / Teen (13–17)";
  if (age <= 29) return "Dewasa Muda / Young Adult (18–29)";
  if (age <= 59) return "Dewasa / Adult (30–59)";
  return "Warga Emas / Senior (60+)";
}

function getCityFromAddress(addr) {
  if (!addr) return "Tidak Diketahui / Unknown";
  const lower = addr.toLowerCase();
  if (lower.includes("kuching"))      return "Kuching";
  if (lower.includes("miri"))         return "Miri";
  if (lower.includes("sibu"))         return "Sibu";
  if (lower.includes("bintulu"))      return "Bintulu";
  if (lower.includes("samarahan"))    return "Kota Samarahan";
  if (lower.includes("serian"))       return "Serian";
  if (lower.includes("sri aman"))     return "Sri Aman";
  if (lower.includes("betong"))       return "Betong";
  if (lower.includes("sarikei"))      return "Sarikei";
  if (lower.includes("kapit"))        return "Kapit";
  return "Lain-lain / Others";
}

function makeBarChart(id, labels, values, label) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  allCharts[id] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: PALETTE.slice(0, labels.length), borderRadius: 6 }]
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
  });
}

function makePieChart(id, labels, values) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  allCharts[id] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: PALETTE.slice(0, labels.length), borderWidth: 2, borderColor: "rgba(0,0,0,0.3)" }]
    },
    options: { ...pieDefaults, cutout: "55%" }
  });
}

function makeLineChart(id, labels, values, label) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  allCharts[id] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label, data: values,
        borderColor: "#FF8C00", backgroundColor: "rgba(255,140,0,0.15)",
        tension: 0.4, fill: true, pointBackgroundColor: "#FF8C00"
      }]
    },
    options: chartDefaults
  });
}

function makeHBarChart(id, labels, values, label) {
  destroyChart(id);
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  allCharts[id] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: PALETTE.slice(0, labels.length), borderRadius: 4 }]
    },
    options: {
      indexAxis: "y",
      ...chartDefaults,
      plugins: { ...chartDefaults.plugins, legend: { display: false } }
    }
  });
}

function renderAll(data) {
  const total    = data.length;
  const active   = data.filter(r => r.approved).length;
  const inactive = total - active;
  const baptised = data.filter(r => r.sectionA?.baptismStatus === "baptised").length;
  const withKids = data.filter(r => (r.sectionC?.children || []).length > 0).length;

  document.getElementById("totalMembers").textContent    = total;
  document.getElementById("activeMembers").textContent   = active;
  document.getElementById("inactiveMembers").textContent = inactive;
  document.getElementById("baptisedMembers").textContent = baptised;
  document.getElementById("withChildren").textContent    = withKids;

  // Gender
  const gender = countBy(data, r => {
    const g = r.sectionA?.gender;
    return g === "male" ? "Lelaki / Male" : g === "female" ? "Perempuan / Female" : null;
  });
  makePieChart("chartGender", Object.keys(gender), Object.values(gender));

  // Membership Status
  makePieChart("chartStatus",
    ["Aktif / Active", "Tidak Aktif / Inactive"],
    [active, inactive]
  );

  // Registrations over time (by month)
  const byMonth = {};
  data.forEach(r => {
    const d = r.submittedAt?.toDate ? r.submittedAt.toDate() : new Date(r.dateApplied || "");
    if (!d || isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  const sortedMonths = Object.keys(byMonth).sort();
  makeLineChart("chartTime", sortedMonths, sortedMonths.map(k => byMonth[k]), "Pendaftaran / Registrations");

  // Race
  const race = countBy(data, r => r.sectionA?.race);
  makeHBarChart("chartRace", Object.keys(race), Object.values(race), "Ahli / Members");

  // Age Group
  const ageGroups = {
    "Remaja / Teen (13–17)": 0,
    "Dewasa Muda / Young Adult (18–29)": 0,
    "Dewasa / Adult (30–59)": 0,
    "Warga Emas / Senior (60+)": 0,
    "Tidak Diketahui / Unknown": 0
  };
  data.forEach(r => {
    const g = getAgeGroup(r.sectionA?.dob);
    ageGroups[g] = (ageGroups[g] || 0) + 1;
  });
  const ageLbls = Object.keys(ageGroups).filter(k => ageGroups[k] > 0);
  makePieChart("chartAge", ageLbls, ageLbls.map(k => ageGroups[k]));

  // Marital Status
  const maritalLabels = {
    single:"Bujang / Single", engaged:"Bertunang / Engaged",
    married:"Berkahwin / Married", divorced:"Bercerai / Divorced", widowed:"Balu / Widowed"
  };
  const marital = countBy(data, r => maritalLabels[r.sectionA?.maritalStatus] || null);
  makeBarChart("chartMarital", Object.keys(marital), Object.values(marital), "Ahli / Members");

  // Cell Group
  const komsel = countBy(data, r => r.sectionA?.komselCode || null);
  const komselSorted = Object.entries(komsel).sort((a,b) => a[0].localeCompare(b[0]));
  makeHBarChart("chartKomsel", komselSorted.map(x=>x[0]), komselSorted.map(x=>x[1]), "Ahli / Members");

  // Baptism Year
  const bapYr = {};
  data.filter(r => r.sectionA?.baptismStatus === "baptised").forEach(r => {
    const y = r.sectionA?.baptismYear || "?";
    bapYr[y] = (bapYr[y] || 0) + 1;
  });
  const bapSorted = Object.entries(bapYr).sort((a,b) => a[0].localeCompare(b[0]));
  makeBarChart("chartBaptismYear", bapSorted.map(x=>x[0]), bapSorted.map(x=>x[1]), "Ahli Dibaptis / Baptised");

  // Children count
  const childCount = { "0": 0, "1": 0, "2": 0, "3": 0, "4+": 0 };
  data.forEach(r => {
    const n = (r.sectionC?.children || []).length;
    if (n === 0) childCount["0"]++;
    else if (n === 1) childCount["1"]++;
    else if (n === 2) childCount["2"]++;
    else if (n === 3) childCount["3"]++;
    else childCount["4+"]++;
  });
  makePieChart("chartChildren",
    ["Tiada / None", "1 Anak / Child", "2 Anak / Children", "3 Anak / Children", "4+ Anak / Children"],
    [childCount["0"], childCount["1"], childCount["2"], childCount["3"], childCount["4+"]]
  );

  // City
  const city = countBy(data, r => getCityFromAddress(r.sectionA?.currentAddress));
  makePieChart("chartCity", Object.keys(city), Object.values(city));
}