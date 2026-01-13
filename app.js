// ====== Config ======
const STORAGE_KEY = "deliveries_v1";

const ITEMS = [
  { key: "tard", label: "תרד" },
  { key: "alat", label: "עלת" },
  { key: "kubiza", label: "כוביזה" },
  { key: "shomer", label: "שומר" },
];

// Markets (two markets for same customer)
const MARKETS = [
  { key: "gamshi", label: "גמשי" },
  { key: "hasbi", label: "חסבי" },
];

// Drivers (null + list)
const DRIVERS = [
  { key: null, label: "—" },
  { key: "ואיל", label: "ואיל" },
  { key: "אבראהים", label: "אבראהים" },
  { key: "חנדושי", label: "חנדושי" },
  { key: "נביה", label: "נביה" },
  { key: "סאמר", label: "סאמר" },
  { key: "חיתאם", label: "חיתאם" },
  { key: "אסייל", label: "אסייל" },
  { key: "מיסם", label: "מיסם" },
  { key: "מרומא", label: "מרומא" },
  { key: "תלתולא", label: "תלתולא" },
];

// Cars (null + list)
const CARS = [
  { key: null, label: "—" },
  { key: "old jazz", label: "old jazz" },
  { key: "new jazz", label: "new jazz" },
  { key: "jeeb", label: "jeeb" },
];

// ====== Storage Helpers ======
function loadDeliveries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDeliveries(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list, null, 2));
}

function nextDeliveryNumber(list) {
  if (list.length === 0) return 1;
  return Math.max(...list.map(d => d.deliveryNumber || 0)) + 1;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ====== Page 1: Form ======
function initFormPage() {
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const itemsBody = document.getElementById("itemsBody");
  const deliveryNumberPreview = document.getElementById("deliveryNumberPreview");

  const driverSelect = document.getElementById("driverSelect");
  const carSelect = document.getElementById("carSelect");

  const deliveries = loadDeliveries();
  deliveryNumberPreview.textContent = String(nextDeliveryNumber(deliveries));

  // Defaults
  dateInput.value = todayISO();
  timeInput.value = nowHHMM();

  // Fill driver/car selects
  driverSelect.innerHTML = "";
  DRIVERS.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.key === null ? "" : d.key;
    opt.textContent = d.label;
    driverSelect.appendChild(opt);
  });
  driverSelect.value = ""; // default null

  carSelect.innerHTML = "";
  CARS.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.key === null ? "" : c.key;
    opt.textContent = c.label;
    carSelect.appendChild(opt);
  });
  carSelect.value = ""; // default null

  // Build table rows
  itemsBody.innerHTML = "";
  ITEMS.forEach(item => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = item.label;
    tr.appendChild(tdName);

    MARKETS.forEach(mkt => {
      // qty
      const tdQty = document.createElement("td");
      const qty = document.createElement("input");
      qty.type = "number";
      qty.min = "0";
      qty.step = "1";
      qty.placeholder = "0";
      qty.id = `${item.key}_${mkt.key}_qty`;
      tdQty.appendChild(qty);
      tr.appendChild(tdQty);

      // price
      const tdPrice = document.createElement("td");
      const price = document.createElement("input");
      price.type = "number";
      price.min = "0";
      price.step = "0.01";
      price.placeholder = "0.00";
      price.id = `${item.key}_${mkt.key}_price`;
      tdPrice.appendChild(price);
      tr.appendChild(tdPrice);
    });

    itemsBody.appendChild(tr);
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    ITEMS.forEach(item => {
      MARKETS.forEach(mkt => {
        document.getElementById(`${item.key}_${mkt.key}_qty`).value = "";
        document.getElementById(`${item.key}_${mkt.key}_price`).value = "";
      });
    });
    driverSelect.value = "";
    carSelect.value = "";
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const list = loadDeliveries();
    const deliveryNumber = nextDeliveryNumber(list);

    const date = dateInput.value || todayISO();
    const timeSaved = timeInput.value || nowHHMM();

    const driverName = driverSelect.value || null;
    const carName = carSelect.value || null;

    const lines = [];
    ITEMS.forEach(item => {
      MARKETS.forEach(mkt => {
        const qtyVal = document.getElementById(`${item.key}_${mkt.key}_qty`).value;
        const priceVal = document.getElementById(`${item.key}_${mkt.key}_price`).value;

        const qty = qtyVal === "" ? 0 : parseInt(qtyVal, 10);
        const price = priceVal === "" ? 0 : parseFloat(priceVal);

        if (Number.isNaN(qty) || qty < 0) {
          alert(`Invalid qty for ${item.label} ${mkt.label}`);
          throw new Error("Invalid qty");
        }
        if (Number.isNaN(price) || price < 0) {
          alert(`Invalid price for ${item.label} ${mkt.label}`);
          throw new Error("Invalid price");
        }

        const lineTotal = round2(qty * price);

        lines.push({
          itemKey: item.key,
          itemLabel: item.label,
          marketKey: mkt.key,
          marketLabel: mkt.label,
          qty,
          price,
          lineTotal,
        });
      });
    });

    const totalQty = lines.reduce((s, x) => s + x.qty, 0);
    const totalAmount = round2(lines.reduce((s, x) => s + x.lineTotal, 0));

    const delivery = {
      deliveryNumber,
      date,
      timeSaved,
      driverName,
      carName,
      lines,
      totalQty,
      totalAmount,
      createdAtISO: new Date().toISOString(),
    };

    list.push(delivery);
    saveDeliveries(list);

    alert(`Saved delivery #${deliveryNumber} ✅`);
    deliveryNumberPreview.textContent = String(nextDeliveryNumber(list));

    document.getElementById("clearBtn").click();
    timeInput.value = nowHHMM();
  });

  document.getElementById("exportJsonBtn").addEventListener("click", () => {
    const list = loadDeliveries();
    downloadJSON(list, `deliveries_${todayISO()}.json`);
  });

  document.getElementById("importJsonInput").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      alert("Invalid JSON file");
      return;
    }

    if (!Array.isArray(parsed)) {
      alert("JSON must be an array of deliveries");
      return;
    }

    const current = loadDeliveries();
    const map = new Map(current.map(d => [d.deliveryNumber, d]));
    parsed.forEach(d => {
      if (d && typeof d.deliveryNumber === "number") map.set(d.deliveryNumber, d);
    });

    const merged = Array.from(map.values()).sort((a,b) => a.deliveryNumber - b.deliveryNumber);
    saveDeliveries(merged);

    alert("Imported & merged ✅");
    deliveryNumberPreview.textContent = String(nextDeliveryNumber(merged));
    e.target.value = "";
  });

  document.getElementById("deleteAllBtn").addEventListener("click", () => {
    if (!confirm("Delete ALL saved deliveries?")) return;
    localStorage.removeItem(STORAGE_KEY);
    alert("Deleted ✅");
    deliveryNumberPreview.textContent = "1";
  });
}

// ====== Page 2: Stats ======
function initStatsPage() {
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const applyBtn = document.getElementById("applyFilterBtn");
  const resetBtn = document.getElementById("resetFilterBtn");
  const exportPdfBtn = document.getElementById("exportPdfBtn");

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  fromDate.value = toISODate(firstDay);
  toDate.value = todayISO();

  renderStats();

  applyBtn.addEventListener("click", renderStats);
  resetBtn.addEventListener("click", () => {
    fromDate.value = toISODate(firstDay);
    toDate.value = todayISO();
    renderStats();
  });

  exportPdfBtn.addEventListener("click", () => {
    const list = getFilteredDeliveries(fromDate.value, toDate.value);
    exportSummaryPDF(list, { from: fromDate.value, to: toDate.value });
  });

  function renderStats() {
    const all = loadDeliveries();
    const filtered = getFilteredDeliveries(fromDate.value, toDate.value);

    const last = all.length ? all[all.length - 1] : null;
    const lastBox = document.getElementById("lastDeliveryBox");
    lastBox.innerHTML = last
      ? renderDeliveryDetailsHTML(last, { showReceiptButton: true })
      : "<p class='small'>No deliveries yet.</p>";

    const tbody = document.getElementById("deliveriesList");
    tbody.innerHTML = "";
    filtered.forEach(d => {
      const tr = document.createElement("tr");

      const receiptBtn = document.createElement("button");
      receiptBtn.className = "btn";
      receiptBtn.textContent = "Receipt PDF";
      receiptBtn.addEventListener("click", () => exportReceiptPDF(d));

      tr.innerHTML = `
        <td>${d.deliveryNumber}</td>
        <td>${d.date}</td>
        <td>${d.timeSaved}</td>
        <td>${d.totalQty}</td>
        <td>${formatMoney(d.totalAmount)}</td>
      `;

      const tdBtn = document.createElement("td");
      tdBtn.appendChild(receiptBtn);
      tr.appendChild(tdBtn);

      tbody.appendChild(tr);
    });

    const totalsBox = document.getElementById("totalsBox");
    const totals = computeTotals(filtered);
    totalsBox.innerHTML = `
      <div class="pill"><b>Deliveries</b><br>${filtered.length}</div>
      <div class="pill"><b>Total Qty</b><br>${totals.totalQty}</div>
      <div class="pill"><b>Total ₪</b><br>${formatMoney(totals.totalAmount)}</div>
      <div class="pill"><b>Avg ₪ / Delivery</b><br>${formatMoney(filtered.length ? totals.totalAmount / filtered.length : 0)}</div>
    `;

    renderPerItemMarketTable(filtered);
  }
}

// ====== Filtering ======
function getFilteredDeliveries(fromISO, toISO) {
  const list = loadDeliveries();
  return list.filter(d => {
    if (fromISO && d.date < fromISO) return false;
    if (toISO && d.date > toISO) return false;
    return true;
  });
}

// ====== Per-item per-market totals ======
function computePerItemMarketTotals(deliveries) {
  const totals = {};
  ITEMS.forEach(it => {
    totals[it.key] = {
      itemLabel: it.label,
      gamshi: { qty: 0, amount: 0 },
      hasbi: { qty: 0, amount: 0 },
    };
  });

  deliveries.forEach(d => {
    (d.lines || []).forEach(line => {
      if (!totals[line.itemKey]) return;
      const mk = line.marketKey === "gamshi" ? "gamshi" : (line.marketKey === "hasbi" ? "hasbi" : null);
      if (!mk) return;
      totals[line.itemKey][mk].qty += (line.qty || 0);
      totals[line.itemKey][mk].amount = round2(totals[line.itemKey][mk].amount + (line.lineTotal || 0));
    });
  });

  return totals;
}

function renderPerItemMarketTable(filtered) {
  const body = document.getElementById("perItemMarketBody");
  const per = computePerItemMarketTotals(filtered);
  body.innerHTML = "";

  ITEMS.forEach(it => {
    const row = per[it.key];
    const gQty = row.gamshi.qty;
    const gAmt = row.gamshi.amount;
    const hQty = row.hasbi.qty;
    const hAmt = row.hasbi.amount;
    const allQty = gQty + hQty;
    const allAmt = round2(gAmt + hAmt);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.itemLabel}</td>
      <td>${gQty}</td>
      <td>${formatMoney(gAmt)}</td>
      <td>${hQty}</td>
      <td>${formatMoney(hAmt)}</td>
      <td>${allQty}</td>
      <td>${formatMoney(allAmt)}</td>
    `;
    body.appendChild(tr);
  });
}

// ====== Totals helpers ======
function computeTotals(deliveries) {
  const totalQty = deliveries.reduce((s, d) => s + (d.totalQty || 0), 0);
  const totalAmount = round2(deliveries.reduce((s, d) => s + (d.totalAmount || 0), 0));
  return { totalQty, totalAmount };
}

function renderDeliveryDetailsHTML(d, opts = {}) {
  const lines = d.lines || [];

  const rows = lines.map(l => `
    <tr>
      <td>${l.itemLabel}</td>
      <td>${l.marketLabel}</td>
      <td>${l.qty}</td>
      <td>${formatMoney(l.price)}</td>
      <td>${formatMoney(l.lineTotal)}</td>
    </tr>
  `).join("");

  const driverTxt = d.driverName ? d.driverName : "—";
  const carTxt = d.carName ? d.carName : "—";

  const receiptButtonHTML = opts.showReceiptButton
    ? `<div class="actions" style="margin-top:10px">
         <button class="btn" id="lastReceiptBtn">Receipt PDF</button>
       </div>`
    : "";

  setTimeout(() => {
    const btn = document.getElementById("lastReceiptBtn");
    if (btn) btn.onclick = () => exportReceiptPDF(d);
  }, 0);

  return `
    <div class="hint">
      <b>#${d.deliveryNumber}</b> — ${d.date} ${d.timeSaved}<br>
      Driver: <b>${driverTxt}</b> | Car: <b>${carTxt}</b><br>
      Total Qty: <b>${d.totalQty}</b> | Total: <b>${formatMoney(d.totalAmount)}</b>
    </div>
    <div class="tableWrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Item</th>
            <th>Market</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${receiptButtonHTML}
  `;
}

// ====== JSON download ======
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ====== PDF: Summary ======
function exportSummaryPDF(deliveries, range) {
  if (!window.jspdf?.jsPDF) {
    alert("jsPDF failed to load. Check internet/CDN.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 12;
  doc.setFontSize(14);
  doc.text("Deliveries Summary Report", 10, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Range: ${range.from || "-"} to ${range.to || "-"}`, 10, y);
  y += 6;

  const totals = computeTotals(deliveries);
  doc.text(`Deliveries: ${deliveries.length}`, 10, y); y += 5;
  doc.text(`Total Qty: ${totals.totalQty}`, 10, y); y += 5;
  doc.text(`Total Amount: ${formatMoney(totals.totalAmount)}`, 10, y); y += 8;

  doc.setFontSize(9);
  deliveries.forEach(d => {
    if (y > 280) { doc.addPage(); y = 12; }
    const driver = d.driverName || "—";
    const car = d.carName || "—";
    doc.text(
      `#${d.deliveryNumber}  ${d.date} ${d.timeSaved}  Driver:${driver}  Car:${car}  Qty:${d.totalQty}  ${formatMoney(d.totalAmount)}`,
      10, y
    );
    y += 5;
  });

  doc.save(`deliveries_summary_${range.from || "from"}_${range.to || "to"}.pdf`);
}

// ====== PDF: Receipt (DETAILED) ======
function exportReceiptPDF(delivery) {
  if (!window.jspdf?.jsPDF) {
    alert("jsPDF failed to load. Check internet/CDN.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const driver = delivery.driverName || "—";
  const car = delivery.carName || "—";

  let y = 14;
  doc.setFontSize(16);
  doc.text(`Delivery Receipt #${delivery.deliveryNumber}`, 10, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Date: ${delivery.date}`, 10, y);
  doc.text(`Time Saved: ${delivery.timeSaved}`, 70, y);
  y += 6;

  doc.text(`Driver: ${driver}`, 10, y);
  doc.text(`Car: ${car}`, 70, y);
  y += 6;

  doc.text(`Total Qty: ${delivery.totalQty}`, 10, y);
  doc.text(`Total Amount: ${formatMoney(delivery.totalAmount)}`, 70, y);
  y += 10;

  doc.setFontSize(10);
  doc.text("Item", 10, y);
  doc.text("Market", 55, y);
  doc.text("Qty", 95, y);
  doc.text("Price", 115, y);
  doc.text("Total", 155, y);
  y += 4;

  doc.setLineWidth(0.2);
  doc.line(10, y, 200, y);
  y += 6;

  const lines = (delivery.lines || []).filter(l => (l.qty || 0) > 0 || (l.price || 0) > 0);

  if (lines.length === 0) {
    doc.text("No line items.", 10, y);
  } else {
    lines.forEach(l => {
      if (y > 280) { doc.addPage(); y = 14; }

      doc.text(String(l.itemLabel), 10, y);
      doc.text(String(l.marketLabel), 55, y);
      doc.text(String(l.qty), 95, y);
      doc.text(formatMoney(l.price), 115, y);
      doc.text(formatMoney(l.lineTotal), 155, y);
      y += 6;
    });
  }

  y += 6;
  if (y > 280) { doc.addPage(); y = 14; }
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, y);

  doc.save(`receipt_delivery_${delivery.deliveryNumber}.pdf`);
}

// ====== Utils ======
function toISODate(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatMoney(n) {
  const x = typeof n === "number" ? n : parseFloat(n || 0);
  return `₪${(Number.isFinite(x) ? x : 0).toFixed(2)}`;
}
