/* ══════════════════════════════════════════════════
   invoice.js  —  Ture Gen. Invoice System Logic
   ══════════════════════════════════════════════════ */

/* ── DOM refs ── */
const systemModal       = document.getElementById('system-modal');
const renderCanvas      = document.getElementById('invoice-render-canvas');
const dynamicRecordsBox = document.getElementById('dynamic-records-box');
const btnHome           = document.getElementById('btn-home');
const btnNew            = document.getElementById('btn-new');
const btnDownload       = document.getElementById('btn-download');

/* ── Set today's date as default ── */
document.getElementById('form-date').value = new Date().toISOString().split('T')[0];

/* ── Modal ── */
function openSystemModal()  { systemModal.classList.remove('hidden'); }
function closeSystemModal() { systemModal.classList.add('hidden'); }

/* ── Home: reset everything back to start state ── */
function goHome() {
    renderCanvas.classList.add('hidden');
    btnHome.classList.add('hidden');
    btnNew.classList.add('hidden');
    btnDownload.classList.add('hidden');
    document.getElementById('invoice-data-form').reset();
    document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
    resetItemRows();
}

function resetItemRows() {
    dynamicRecordsBox.innerHTML =
        '<div class="item-entry bg-neutral-50 p-3 rounded border border-neutral-200 relative">' +
            '<div class="flex justify-between items-center mb-1.5">' +
                '<span class="font-bold text-blue-600 uppercase tracking-wide">Item Record #<span class="index-badge">1</span></span>' +
            '</div>' +
            '<div class="grid grid-cols-3 gap-2">' +
                '<div class="col-span-2">' +
                    '<input type="text" placeholder="Description" required class="row-desc w-full border border-neutral-300 rounded p-2 focus:outline-none focus:border-blue-500 font-medium">' +
                '</div>' +
                '<div>' +
                    '<input type="number" placeholder="Amount (KD)" required step="0.001" min="0" class="row-amount w-full border border-neutral-300 rounded p-2 focus:outline-none focus:border-blue-500 font-medium font-mono">' +
                '</div>' +
            '</div>' +
        '</div>';
}

/* ── Add / remove line items ── */
function appendNewItemFormRow() {
    const count = dynamicRecordsBox.getElementsByClassName('item-entry').length + 1;
    const html =
        '<div class="item-entry bg-neutral-50 p-3 rounded border border-neutral-200 relative">' +
            '<div class="flex justify-between items-center mb-1.5">' +
                '<span class="font-bold text-blue-600 uppercase tracking-wide">Item Record #<span class="index-badge">' + count + '</span></span>' +
                '<button type="button" onclick="this.closest(\'.item-entry\').remove(); recalculateRowBadges();" class="text-red-500 hover:text-red-700 font-bold uppercase text-[10px]">Remove</button>' +
            '</div>' +
            '<div class="grid grid-cols-3 gap-2">' +
                '<div class="col-span-2">' +
                    '<input type="text" placeholder="Description" required class="row-desc w-full border border-neutral-300 rounded p-2 focus:outline-none focus:border-blue-500 font-medium">' +
                '</div>' +
                '<div>' +
                    '<input type="number" placeholder="Amount (KD)" required step="0.001" min="0" class="row-amount w-full border border-neutral-300 rounded p-2 focus:outline-none focus:border-blue-500 font-medium font-mono">' +
                '</div>' +
            '</div>' +
        '</div>';
    dynamicRecordsBox.insertAdjacentHTML('beforeend', html);
}

function recalculateRowBadges() {
    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry'))
        .forEach(function(el, i) { el.querySelector('.index-badge').textContent = i + 1; });
}

/* ── KD amount formatted to 3 decimal places ── */
function formatKD(amount) {
    return parseFloat(amount).toFixed(3) + ' KD';
}

/* ── Number → English words (Dinars + Fils) ── */
function convertNumberToEnglishWords(amount) {
    var rounded = Math.round(amount * 1000) / 1000;
    var dinars  = Math.floor(rounded);
    var fils    = Math.round((rounded - dinars) * 1000);

    var units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var tens  = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function u1000(v) {
        var t = '';
        if (v >= 100) { t += units[Math.floor(v / 100)] + ' Hundred '; v %= 100; }
        if (v >= 20)  { t += tens[Math.floor(v / 10)]   + ' ';          v %= 10;  }
        if (v >  0)   { t += units[v] + ' '; }
        return t.trim();
    }

    function toWords(n) {
        if (n === 0) return 'Zero';
        var w = '';
        if (n >= 1000000) { w += u1000(Math.floor(n / 1000000)) + ' Million '; n %= 1000000; }
        if (n >= 1000)    { w += u1000(Math.floor(n / 1000))    + ' Thousand '; n %= 1000;    }
        if (n > 0)          w += u1000(n);
        return w.trim();
    }

    var result = toWords(dinars) + ' KD';
    if (fils > 0) result += ' and ' + toWords(fils) + ' Fils';
    return (result + ' Only').replace(/\s+/g, ' ');
}

/* ── Build invoice from form ── */
function executeInvoiceGenerationPipeline(event) {
    event.preventDefault();

    document.getElementById('target-no').textContent      = document.getElementById('form-no').value;
    document.getElementById('target-address').textContent = document.getElementById('form-address').value;

    var parts   = document.getElementById('form-date').value.split('-');
    var dateStr = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                    .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('target-date').textContent = dateStr;

    var tbody      = document.getElementById('target-table-body');
    tbody.innerHTML = '';
    var grandTotal  = 0;

    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry')).forEach(function(row, i) {
        var desc = row.querySelector('.row-desc').value;
        var amt  = parseFloat(row.querySelector('.row-amount').value) || 0;
        grandTotal += amt;

        var tr       = document.createElement('tr');
        tr.className = 'text-center divide-x divide-black align-top font-medium';
        tr.innerHTML =
            '<td class="py-3 px-2 font-mono">' + (i + 1) + '.</td>' +
            '<td class="py-3 px-4 text-left whitespace-normal break-words max-w-md">' + desc + '</td>' +
            '<td class="py-3 px-4 text-right font-mono">' + formatKD(amt) + '</td>';
        tbody.appendChild(tr);
    });

    document.getElementById('target-grand-total').textContent = formatKD(grandTotal);
    document.getElementById('target-total-words').textContent = convertNumberToEnglishWords(grandTotal);

    var fileInput  = document.getElementById('form-sig-file');
    var imgElement = document.getElementById('target-salesman-sig-img');

    if (fileInput.files && fileInput.files[0]) {
        var reader   = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
            imgElement.classList.remove('hidden');
            showInvoiceAndExport();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        imgElement.classList.add('hidden');
        imgElement.src = '';
        showInvoiceAndExport();
    }
}

/* ── Show invoice preview and trigger PDF export ── */
function showInvoiceAndExport() {
    renderCanvas.classList.remove('hidden');
    closeSystemModal();

    btnHome.classList.remove('hidden');
    btnNew.classList.remove('hidden');
    btnDownload.classList.remove('hidden');

    /* Wait for two animation frames so the browser fully paints
       the invoice before html2canvas captures it. */
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            exportPdf();
        });
    });
}

/* ── PDF export (the actual download) ── */
function exportPdf() {
    var invoiceNo  = document.getElementById('target-no').textContent || 'Document';
    var outputName = 'Invoice_No_' + invoiceNo + '.pdf';

    /* We capture the live invoice element directly.
       backgroundColor is set on html2canvas so the white sheet
       is captured correctly even against the dark page. */
    var opt = {
        margin:      [0, 0, 0, 0],
        filename:    outputName,
        image:       { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale:           3,
            useCORS:         true,
            logging:         false,
            letterRendering: true,
            backgroundColor: '#ffffff',
            windowWidth:     794,   /* ~210mm at 96dpi */
            windowHeight:    1123   /* ~297mm at 96dpi */
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    btnDownload.textContent = '⏳ Generating…';
    btnDownload.disabled    = true;

    html2pdf()
        .set(opt)
        .from(renderCanvas)
        .save()
        .then(function() {
            btnDownload.innerHTML = '&#8659; Download PDF';
            btnDownload.disabled  = false;
        })
        .catch(function(err) {
            btnDownload.innerHTML = '&#8659; Download PDF';
            btnDownload.disabled  = false;
            alert('PDF export failed: ' + err.message);
        });
}

/* ── Manual re-download (green button) ── */
function reDownloadPdf() {
    exportPdf();
}
