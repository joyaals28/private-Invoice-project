/* ══════════════════════════════════════════════════
   invoice.js  —  Ture Gen. Invoice System
   ══════════════════════════════════════════════════ */

/* ── DOM refs ── */
var systemModal       = document.getElementById('system-modal');
var renderCanvas      = document.getElementById('invoice-render-canvas');
var dynamicRecordsBox = document.getElementById('dynamic-records-box');
var btnHome           = document.getElementById('btn-home');
var btnNew            = document.getElementById('btn-new');
var btnDownload       = document.getElementById('btn-download');
var btnCreate         = document.getElementById('btn-create');

/* ── Set today's date as default ── */
(function setToday() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm   = String(d.getMonth() + 1).padStart(2, '0');
    var dd   = String(d.getDate()).padStart(2, '0');
    document.getElementById('form-date').value = yyyy + '-' + mm + '-' + dd;
})();

/* ════════════════════════════════
   MODAL
════════════════════════════════ */
function openSystemModal()  { systemModal.classList.remove('hidden'); }
function closeSystemModal() { systemModal.classList.add('hidden'); }

/* ════════════════════════════════
   HOME — reset to blank state
════════════════════════════════ */
function goHome() {
    renderCanvas.classList.add('hidden');
    btnHome.classList.add('hidden');
    btnNew.classList.add('hidden');
    btnDownload.classList.add('hidden');
    btnCreate.classList.remove('hidden');

    document.getElementById('invoice-data-form').reset();
    (function setToday() {
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm   = String(d.getMonth() + 1).padStart(2, '0');
        var dd   = String(d.getDate()).padStart(2, '0');
        document.getElementById('form-date').value = yyyy + '-' + mm + '-' + dd;
    })();
    resetItemRows();
}

function resetItemRows() {
    dynamicRecordsBox.innerHTML =
        '<div class="item-entry bg-gray-50 p-3 rounded border border-gray-200 relative">' +
            '<div class="flex justify-between items-center mb-1.5">' +
                '<span class="font-bold text-blue-600 uppercase tracking-wide text-xs">Item Record #<span class="index-badge">1</span></span>' +
            '</div>' +
            '<div class="grid grid-cols-3 gap-2">' +
                '<div class="col-span-2">' +
                    '<input type="text" placeholder="Description" required class="row-desc w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 font-medium">' +
                '</div>' +
                '<div>' +
                    '<input type="number" placeholder="Amount (KD)" required step="0.001" min="0" class="row-amount w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 font-medium font-mono">' +
                '</div>' +
            '</div>' +
        '</div>';
}

/* ════════════════════════════════
   LINE ITEMS
════════════════════════════════ */
function appendNewItemFormRow() {
    var count = dynamicRecordsBox.getElementsByClassName('item-entry').length + 1;
    var html =
        '<div class="item-entry bg-gray-50 p-3 rounded border border-gray-200 relative">' +
            '<div class="flex justify-between items-center mb-1.5">' +
                '<span class="font-bold text-blue-600 uppercase tracking-wide text-xs">Item Record #<span class="index-badge">' + count + '</span></span>' +
                '<button type="button" onclick="this.closest(\'.item-entry\').remove(); recalculateRowBadges();" ' +
                        'class="text-red-500 hover:text-red-700 font-bold uppercase text-xs">Remove</button>' +
            '</div>' +
            '<div class="grid grid-cols-3 gap-2">' +
                '<div class="col-span-2">' +
                    '<input type="text" placeholder="Description" required class="row-desc w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 font-medium">' +
                '</div>' +
                '<div>' +
                    '<input type="number" placeholder="Amount (KD)" required step="0.001" min="0" class="row-amount w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 font-medium font-mono">' +
                '</div>' +
            '</div>' +
        '</div>';
    dynamicRecordsBox.insertAdjacentHTML('beforeend', html);
}

function recalculateRowBadges() {
    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry'))
        .forEach(function(el, i) { el.querySelector('.index-badge').textContent = i + 1; });
}

/* ════════════════════════════════
   FORMATTING
════════════════════════════════ */
function formatKD(amount) {
    return parseFloat(amount).toFixed(3) + ' KD';
}

function convertNumberToEnglishWords(amount) {
    var rounded = Math.round(amount * 1000) / 1000;
    var dinars  = Math.floor(rounded);
    var fils    = Math.round((rounded - dinars) * 1000);

    var units = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
                 'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    var tens  = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    function u1000(v) {
        var t = '';
        if (v >= 100) { t += units[Math.floor(v/100)] + ' Hundred '; v %= 100; }
        if (v >= 20)  { t += tens[Math.floor(v/10)]   + ' ';          v %= 10;  }
        if (v >  0)   { t += units[v] + ' '; }
        return t.trim();
    }
    function toWords(n) {
        if (n === 0) return 'Zero';
        var w = '';
        if (n >= 1000000) { w += u1000(Math.floor(n/1000000)) + ' Million '; n %= 1000000; }
        if (n >= 1000)    { w += u1000(Math.floor(n/1000))    + ' Thousand '; n %= 1000; }
        if (n > 0)          w += u1000(n);
        return w.trim();
    }
    var result = toWords(dinars) + ' KD';
    if (fils > 0) result += ' and ' + toWords(fils) + ' Fils';
    return (result + ' Only').replace(/\s+/g, ' ');
}

/* ════════════════════════════════
   BUILD INVOICE
════════════════════════════════ */
function executeInvoiceGenerationPipeline(event) {
    event.preventDefault();

    document.getElementById('target-no').textContent      = document.getElementById('form-no').value;
    document.getElementById('target-address').textContent = document.getElementById('form-address').value;

    var parts   = document.getElementById('form-date').value.split('-');
    var dateStr = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                    .toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' });
    document.getElementById('target-date').textContent = dateStr;

    var tbody    = document.getElementById('target-table-body');
    tbody.innerHTML = '';
    var grandTotal  = 0;

    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry')).forEach(function(row, i) {
        var desc = row.querySelector('.row-desc').value;
        var amt  = parseFloat(row.querySelector('.row-amount').value) || 0;
        grandTotal += amt;
        var tr = document.createElement('tr');
        tr.style.cssText = 'text-align:center; border-bottom:1px solid #d1d5db;';
        tr.innerHTML =
            '<td style="padding:9px 6px; border-right:1px solid #111827; font-family:Montserrat,sans-serif; font-size:11px; font-weight:600;">' + (i+1) + '.</td>' +
            '<td style="padding:9px 10px; text-align:left; border-right:1px solid #111827; font-family:Montserrat,sans-serif; font-size:11px; font-weight:500;">' + desc + '</td>' +
            '<td style="padding:9px 10px; text-align:right; font-family:Montserrat,sans-serif; font-size:11px; font-weight:600; font-variant-numeric:tabular-nums;">' + formatKD(amt) + '</td>';
        tbody.appendChild(tr);
    });

    document.getElementById('target-grand-total').textContent = formatKD(grandTotal);
    document.getElementById('target-total-words').textContent = convertNumberToEnglishWords(grandTotal);

    var fileInput  = document.getElementById('form-sig-file');
    var imgElement = document.getElementById('target-salesman-sig-img');

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
            imgElement.style.display = 'block';
            showAndExport();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        imgElement.style.display = 'none';
        imgElement.src = '';
        showAndExport();
    }
}

/* ════════════════════════════════
   SHOW INVOICE + TRIGGER EXPORT
════════════════════════════════ */
function showAndExport() {
    closeSystemModal();
    renderCanvas.classList.remove('hidden');
    renderCanvas.style.display = 'flex';
    renderCanvas.style.flexDirection = 'column';

    btnCreate.classList.add('hidden');
    btnHome.classList.remove('hidden');
    btnNew.classList.remove('hidden');
    btnDownload.classList.remove('hidden');

    /* Preload fonts then export */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    exportPdf();
                });
            });
        });
    } else {
        setTimeout(exportPdf, 800);
    }
}

/* ════════════════════════════════
   PDF EXPORT
════════════════════════════════ */
function exportPdf() {
    var invoiceNo = document.getElementById('target-no').textContent || 'Document';
    var filename  = 'Invoice_No_' + invoiceNo.trim() + '.pdf';

    var opt = {
        margin:      [5, 5, 5, 5],
        filename:    filename,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale:           3,
            useCORS:         true,
            logging:         false,
            letterRendering: true,
            backgroundColor: '#ffffff',
            windowWidth:     794   /* 210mm at 96dpi */
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

/* ── Re-download same invoice ── */
function reDownloadPdf() { exportPdf(); }
