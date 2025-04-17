// Sender info inputs
const senderNameInput = document.getElementById("senderName");
const senderAddressInput = document.getElementById("senderAddress");
const senderPhoneInput = document.getElementById("senderPhone");
const senderEmailInput = document.getElementById("senderEmail");
const vatRateInput = document.getElementById("vatRate");


// Client and invoice details
const clientNameInput = document.getElementById("clientName");
const clientAddressInput = document.getElementById("clientAddress");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const invoiceDateInput = document.getElementById("invoiceDate");

// Preview container
const invoicePreview = document.getElementById("invoicePreview");

// Add these to the top where you set event listeners:
[senderNameInput, senderAddressInput, senderPhoneInput, senderEmailInput,
 clientNameInput, clientAddressInput, invoiceNumberInput, invoiceDateInput, vatRateInput].forEach(input => {
  input.addEventListener("input", updatePreview);
});

function updatePreview() {
  let itemsHTML = "";
  let grandTotal = 0;
  let totalWeight = 0;

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

  // ✅ Now calculate VAT after all items are summed
  const vatRate = parseFloat(vatRateInput.value) || 0;
  const vatAmount = (grandTotal * vatRate) / 100;
  const totalWithVAT = grandTotal + vatAmount;

  invoicePreview.innerHTML = `
    <div class="mb-4">
      <h3 class="text-lg font-bold">${senderNameInput.value || "Your Name"}</h3>
      <p>${senderAddressInput.value || "Your Address"}</p>
      <p>${senderPhoneInput.value || "Phone Number"}</p>
      <p>${senderEmailInput.value || "Email"}</p>
    </div>

    <div class="mb-4">
      <h3 class="text-lg font-semibold">Bill To:</h3>
      <p>${clientNameInput.value || "Client Name"}</p>
      <p>${clientAddressInput.value || "Client Address"}</p>
    </div>

    <div class="mb-4">
      <p><strong>Invoice #:</strong> ${invoiceNumberInput.value || "0001"}</p>
      <p><strong>Date:</strong> ${invoiceDateInput.value || new Date().toISOString().split('T')[0]}</p>
    </div>

    <hr class="my-4">

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

    <p class="text-right font-semibold">Total Weight: ${totalWeight} kg</p>
    <p class="text-right font-bold text-lg">Grand Total: €${grandTotal.toFixed(2)}</p>
    <p class="text-right">VAT (${vatRate.toFixed(2)}%): €${vatAmount.toFixed(2)}</p>
    <p class="text-right font-bold text-lg">Total incl. VAT: €${totalWithVAT.toFixed(2)}</p>
  `;
}

const itemsContainer = document.getElementById("itemsContainer");
const addItemBtn = document.getElementById("addItemBtn");

let itemCount = 0;

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

  // Add event listeners for live update
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updatePreview);
  });

  updatePreview(); // update immediately
}

// Add one default item on load
addItemBtn.addEventListener("click", addItemRow);
addItemRow();

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

