import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ====== INPUT ELEMENTS ======

// Get download button reference
const downloadBtn = document.getElementById("downloadBtn");
const bankName = document.getElementById('bankName');
const bankAddr = document.getElementById('bankAddr');
const bankIBAN = document.getElementById('bankIBAN');
const bankSwift = document.getElementById('bankSwift');

// Extended address + due date logic
const senderStreetInput = document.getElementById("senderStreet");
const senderCityInput = document.getElementById("senderCity");
const senderStateInput = document.getElementById("senderState");
const senderZipInput = document.getElementById("senderZip");
const senderCountryInput = document.getElementById("senderCountry");
const paymentTermsInput = document.getElementById("paymentTerms");

// Sender (your) info
const senderNameInput = document.getElementById("senderName");
const senderAddressInput = document.getElementById("senderAddress");
const senderPhoneInput = document.getElementById("senderPhone");
const senderEmailInput = document.getElementById("senderEmail");
const senderVATInput = document.getElementById("senderVAT");
const vatRateInput = document.getElementById("vatRate");
const logoInput = document.getElementById("logoInput");
let logoDataUrl = ""; // Holds the uploaded logo image

// Client info & invoice metadata
const clientNameInput = document.getElementById("clientName");
const clientAddressInput = document.getElementById("clientAddress");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const invoiceDateInput = document.getElementById("invoiceDate");
const dueDateInput = document.getElementById("dueDate");

// Invoice preview output area
const invoicePreview = document.getElementById("invoicePreview");

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // First row on page load
  addItemRow();
});

// ====== LIVE EVENT BINDINGS ======

// Attach input listeners to all fields that affect the preview
[
  senderNameInput, senderStreetInput, senderCityInput, senderStateInput,
  senderZipInput, senderCountryInput,
  senderPhoneInput, senderEmailInput, senderVATInput,
  clientNameInput, clientAddressInput,
  invoiceNumberInput, invoiceDateInput, dueDateInput, paymentTermsInput,
  vatRateInput, bankIBAN, bankSwift, bankAddr, bankName
].forEach(input => {
  if (input) {
    input.addEventListener("input", updatePreview);
  }
});

const logoSizeInfo = document.getElementById("logoSizeInfo");

if (logoInput) {
  logoInput.addEventListener("change", function () {
    const file = logoInput.files[0];
    if (!logoSizeInfo) return;

    if (file) {
      const maxSizeKB = 2048; // 2MB
      const fileSizeKB = file.size / 1024;
      const formattedSize = fileSizeKB.toFixed(1);

      logoSizeInfo.textContent = `Selected file: ${formattedSize} KB (Max: ${maxSizeKB} KB)`;

      if (fileSizeKB > maxSizeKB) {
        logoSizeInfo.textContent += " – Too large!";
        logoSizeInfo.classList.remove("text-gray-500");
        logoSizeInfo.classList.add("text-red-600", "font-semibold");
        logoInput.value = "";
        logoDataUrl = "";
        updatePreview();
        return;
      }

      logoSizeInfo.classList.remove("text-red-600", "font-semibold");
      logoSizeInfo.classList.add("text-gray-500");

      const reader = new FileReader();
      reader.onload = function (e) {
        logoDataUrl = e.target.result;
        updatePreview();
      };
      reader.readAsDataURL(file);
    } else {
      logoSizeInfo.textContent = "Max file size: 2 MB";
      logoDataUrl = "";
      updatePreview();
    }
  });
}

// ====== MAIN RENDER FUNCTION ======

function updatePreview() {
  if (!invoicePreview) return;
  
  invoicePreview.replaceChildren();  // remove old nodes

  invoicePreview.innerHTML = `
    <div class="invoice-page">
      <section class="flex-grow">
        <!-- Header Section -->
        <div class="flex justify-between items-start mb-6 border-b pb-4">
          <!-- Left: Invoice title + seller info -->
          <div>
            <h1 class="text-2xl font-bold mb-2">INVOICE</h1>
            <p class="font-semibold">${senderNameInput?.value || "Your Name / Company"}</p>
            <p>
              ${senderStreetInput?.value || "Street Address"}, 
              ${senderCityInput?.value || "City"}, 
              ${senderStateInput?.value || "State"}, 
              ${senderZipInput?.value || "ZIP"}, 
              ${senderCountryInput?.value || "Country"}
            </p>
            <p>${senderEmailInput?.value || "Email"}</p>
            <p>${senderPhoneInput?.value || "Phone"}</p>
            <p>${senderVATInput?.value || ""}</p>
          </div>

          <!-- Right: Logo + invoice info -->
          <div class="text-right space-y-2">
            ${logoDataUrl
              ? `
                <div class="w-[100px] h-[100px] bg-white border border-gray-300 rounded p-1 ml-auto">
                  <img src="${logoDataUrl}" alt="Logo" class="w-full h-full object-contain" />
                </div>
              `
              : `
                <div class="w-[100px] h-[100px] bg-gray-200 rounded ml-auto flex items-center justify-center text-gray-500 text-sm">
                  Logo
                </div>
              `
            }      
            <p><strong>Invoice #:</strong> ${invoiceNumberInput?.value || "0001"}</p>
            <p><strong>Invoice Date:</strong> ${invoiceDateInput?.value || new Date().toISOString().split('T')[0]}</p>
            ${(() => {
              const invoiceDate = new Date(invoiceDateInput?.value);
              const terms = parseInt(paymentTermsInput?.value);
              let finalDue = dueDateInput?.value;
            
              if (!finalDue && !isNaN(terms) && invoiceDate.toString() !== "Invalid Date") {
                const dueDate = new Date(invoiceDate);
                dueDate.setDate(invoiceDate.getDate() + terms);
                finalDue = dueDate.toISOString().split("T")[0];
              }
            
              return `<p><strong>Due Date:</strong> ${finalDue || "—"}</p>`;
            })()}
          </div>
        </div>

        <!-- Item Table -->
        <table class="w-full text-sm mb-4">
          <thead>
            <tr class="border-b-2 border-gray-400 font-semibold text-left">
              <th class="p-1 py-2">Description</th>
              <th class="p-1 py-2 text-right">Qty</th>
              <th class="p-1 py-2">Unit</th>
              <th class="p-1 py-2 text-right">Unit Price</th>
              <th class="p-1 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              let itemsHTML = "";
              let grandTotal = 0;
              let totalWeight = 0;

              Array.from(itemsContainer.querySelectorAll("div")).forEach(row => {
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
                    <td class="p-1 py-2">${desc}</td>
                    <td class="p-1 py-2 text-right">${quantity}</td>
                    <td class="p-1 py-2">${unit}</td>
                    <td class="p-1 py-2 text-right">${unitPrice.toFixed(2)}</td>
                    <td class="p-1 py-2 text-right font-semibold">${lineTotal.toFixed(2)}</td>
                  </tr>
                `;
              });

              // VAT calculations
              const vatRate = parseFloat(vatRateInput?.value) || 0;
              const vatAmount = (grandTotal * vatRate) / 100;
              const totalWithVAT = grandTotal + vatAmount;

              return itemsHTML || `<tr><td colspan="5" class="text-gray-400 p-2">No items yet</td></tr>`;
            })()}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <p class="text-right font-semibold">Total Weight: ${(() => {
            let totalWeight = 0;
            Array.from(itemsContainer.querySelectorAll("div")).forEach(row => {
              const inputs = row.querySelectorAll("input");
              const [, qty, unit] = Array.from(inputs).map(input => input.value || "");
              const quantity = parseFloat(qty) || 0;
              if (unit.toLowerCase().includes("kg")) totalWeight += quantity;
            });
            return totalWeight;
          })()} kg</p>
          <p class="text-right font-bold text-lg">Grand Total: €${(() => {
            let grandTotal = 0;
            Array.from(itemsContainer.querySelectorAll("div")).forEach(row => {
              const inputs = row.querySelectorAll("input");
              const [, qty, , price] = Array.from(inputs).map(input => input.value || "");
              const quantity = parseFloat(qty) || 0;
              const unitPrice = parseFloat(price) || 0;
              grandTotal += quantity * unitPrice;
            });
            return grandTotal.toFixed(2);
          })()}</p>
          <p class="text-right">VAT (${parseFloat(vatRateInput?.value || 0).toFixed(2)}%): €${(() => {
            let grandTotal = 0;
            Array.from(itemsContainer.querySelectorAll("div")).forEach(row => {
              const inputs = row.querySelectorAll("input");
              const [, qty, , price] = Array.from(inputs).map(input => input.value || "");
              const quantity = parseFloat(qty) || 0;
              const unitPrice = parseFloat(price) || 0;
              grandTotal += quantity * unitPrice;
            });
            const vatRate = parseFloat(vatRateInput?.value) || 0;
            return ((grandTotal * vatRate) / 100).toFixed(2);
          })()}</p>
          <p class="text-right font-bold text-lg">Total incl. VAT: €${(() => {
            let grandTotal = 0;
            Array.from(itemsContainer.querySelectorAll("div")).forEach(row => {
              const inputs = row.querySelectorAll("input");
              const [, qty, , price] = Array.from(inputs).map(input => input.value || "");
              const quantity = parseFloat(qty) || 0;
              const unitPrice = parseFloat(price) || 0;
              grandTotal += quantity * unitPrice;
            });
            const vatRate = parseFloat(vatRateInput?.value) || 0;
            const vatAmount = (grandTotal * vatRate) / 100;
            return (grandTotal + vatAmount).toFixed(2);
          })()}</p>
        </div>
      </section>

      <!-- footer -->
      <footer class="mt-auto border-t pt-2 text-sm leading-tight">
        <div class="grid grid-cols-3 gap-4">
          <!-- col 1: bank name + address -->
          <div>
            <p class="font-semibold">${bankName?.value || ''}</p>
            <p>${bankAddr?.value || ''}</p>
          </div>

          <!-- col 2: IBAN + SWIFT -->
          <div>
            <p><strong>IBAN:</strong> ${bankIBAN?.value || ''}</p>
            <p><strong>SWIFT/BIC:</strong> ${bankSwift?.value || ''}</p>
          </div>

          <!-- col 3: thank-you, right-aligned -->
          <div class="text-right italic">
            Thank you!
          </div>
        </div>
      </footer>
    </div>
  `;
}

// ====== ITEM HANDLING ======

// Get item container + button
const itemsContainer = document.getElementById("itemsContainer");
const addItemBtn = document.getElementById("addItemBtn");

let itemCount = 0;

// Add a new row of item inputs
function addItemRow() {
  if (!itemsContainer) return;
  
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

// Add item button click handler
if (addItemBtn) {
  addItemBtn.addEventListener("click", addItemRow);
}

// ====== PDF DOWNLOAD ======
if (downloadBtn) {
  downloadBtn.addEventListener('click', async () => {
    updatePreview();                               // refresh DOM

    const pageEl = invoicePreview.querySelector('.invoice-page');
    if (!pageEl) {                                 // nothing to export yet
      console.error('No .invoice-page found');
      return;
    }

    await document.fonts.ready;
    await Promise.all(
      [...pageEl.querySelectorAll('img')].map(img => img.decode().catch(() => {}))
    );

    html2pdf().set({
      margin: 0,
      filename: `invoice-${invoiceNumberInput.value || 'draft'}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'] }
    }).from(pageEl).save();
  });
}

// Log versions for debugging
console.log('Versions →',
  html2pdf?.default?.version ?? html2pdf?.version,
  html2canvas?.version,
  jsPDF?.version);