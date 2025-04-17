// ====== INPUT ELEMENTS ======

// Sender (your) info
const senderNameInput = document.getElementById("senderName");
const senderAddressInput = document.getElementById("senderAddress");
const senderPhoneInput = document.getElementById("senderPhone");
const senderEmailInput = document.getElementById("senderEmail");
const senderVATInput = document.getElementById("senderVAT");
const vatRateInput = document.getElementById("vatRate");

// Client info & invoice metadata
const clientNameInput = document.getElementById("clientName");
const clientAddressInput = document.getElementById("clientAddress");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const invoiceDateInput = document.getElementById("invoiceDate");
const dueDateInput = document.getElementById("dueDate");

// Invoice preview output area
const invoicePreview = document.getElementById("invoicePreview");

// ====== LIVE EVENT BINDINGS ======

// Attach input listeners to all fields that affect the preview
[
  senderNameInput, senderAddressInput, senderPhoneInput, senderEmailInput, senderVATInput,
  clientNameInput, clientAddressInput,
  invoiceNumberInput, invoiceDateInput, dueDateInput,
  vatRateInput
].forEach(input => {
  input.addEventListener("input", updatePreview);
});

// ====== MAIN RENDER FUNCTION ======

function updatePreview() {
  let itemsHTML = "";
  let grandTotal = 0;
  let totalWeight = 0;

  // Loop through all item rows and extract input values
  const itemRows = itemsContainer.querySelectorAll("div");
  itemRows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const [desc, qty, unit, price] = Array.from(inputs).map(input => input.value || "");
    const quantity = parseFloat(qty) || 0;
    const unitPrice = parseFloat(price) || 0;
    const lineTotal = quantity * unitPrice;
    const weight = unit.toLowerCase().includes("kg") ? quantity : 0;

    grandTotal += lineTotal;
    totalWeight += weight;

    // Add this item to the preview table HTML
    itemsHTML += `
      <tr class="border-b">
        <td class="p-1">${desc}</td>
        <td class="p-1 text-right">${quantity}</td>
        <td class="p-1">${unit}</td>
        <td class="p-1 text-right">${unitPrice.toFixed(2)}</td>
        <td class="p-1 text-right font-semibold">${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  // VAT calculations
  const vatRate = parseFloat(vatRateInput.value) || 0;
  const vatAmount = (grandTotal * vatRate) / 100;
  const totalWithVAT = grandTotal + vatAmount;

  // Full invoice HTML output
  invoicePreview.innerHTML = `
    <!-- Header Section -->
    <div class="flex justify-between items-start mb-6 border-b pb-4">
      <!-- Left: Invoice title + seller info -->
      <div>
        <h1 class="text-2xl font-bold mb-2">INVOICE</h1>
        <p class="font-semibold">${senderNameInput.value || "Your Name / Company"}</p>
        <p>${senderAddressInput.value || "Your Address"}</p>
        <p>${senderEmailInput.value || "Email"}</p>
        <p>${senderPhoneInput.value || "Phone"}</p>
        <p>${senderVATInput.value || ""}</p>
      </div>

      <!-- Right: Logo placeholder + invoice info -->
      <div class="text-right space-y-2">
        <div class="w-20 h-20 bg-gray-200 rounded-full mx-auto">
          <span class="block text-center pt-6 text-sm text-gray-500">Logo</span>
        </div>
        <p><strong>Invoice #:</strong> ${invoiceNumberInput.value || "0001"}</p>
        <p><strong>Invoice Date:</strong> ${invoiceDateInput.value || new Date().toISOString().split('T')[0]}</p>
        <p><strong>Due Date:</strong> ${dueDateInput.value || "—"}</p>
      </div>
    </div>

    <!-- Item Table -->
    <table class="w-full text-sm mb-4">
      <thead>
        <tr class="border-b font-semibold text-left">
          <th class="p-1">Description</th>
          <th class="p-1 text-right">Qty</th>
          <th class="p-1">Unit</th>
          <th class="p-1 text-right">Unit Price</th>
          <th class="p-1 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML || `<tr><td colspan="5" class="text-gray-400 p-2">No items yet</td></tr>`}
      </tbody>
    </table>

    <!-- Totals -->
    <p class="text-right font-semibold">Total Weight: ${totalWeight} kg</p>
    <p class="text-right font-bold text-lg">Grand Total: €${grandTotal.toFixed(2)}</p>
    <p class="text-right">VAT (${vatRate.toFixed(2)}%): €${vatAmount.toFixed(2)}</p>
    <p class="text-right font-bold text-lg">Total incl. VAT: €${totalWithVAT.toFixed(2)}</p>
  `;
}

// ====== ITEM HANDLING ======

// Get item container + button
const itemsContainer = document.getElementById("itemsContainer");
const addItemBtn = document.getElementById("addItemBtn");

let itemCount = 0;

// Add a new row of item inputs
function addItemRow() {
  const row = document.createElement("div");
  row.className = "grid grid-cols-4 gap-2";

  row.innerHTML = `
    <input type="text" placeholder="Description" class="border p-2" />
    <input type="number" placeholder="Quantity" class="border p-2" />
    <input type="text" placeholder="Unit (e.g. kg)" class="border p-2" />
    <input type="number" placeholder="Unit Price" class="border p-2" />
  `;

  itemsContainer.appendChild(row);
  itemCount++;

  // Update preview on input
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updatePreview);
  });

  updatePreview();
}

// First row on page load
addItemBtn.addEventListener("click", addItemRow);
addItemRow();

// ====== PDF DOWNLOAD ======

// Download PDF via html2pdf.js
const downloadBtn = document.getElementById("downloadBtn");

downloadBtn.addEventListener("click", () => {
  const opt = {
    margin: 0.5,
    filename: `invoice-${invoiceNumberInput.value || "draft"}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(invoicePreview).set(opt).save();
});
