/* ══════════════════════════════════════════════════
   invoice.js  —  Ture Gen. Invoice System
   ══════════════════════════════════════════════════ */

var systemModal       = document.getElementById('system-modal');
var renderCanvas      = document.getElementById('invoice-render-canvas');
var dynamicRecordsBox = document.getElementById('dynamic-records-box');
var btnHome           = document.getElementById('btn-home');
var btnNew            = document.getElementById('btn-new');
var btnDownload       = document.getElementById('btn-download');
var btnCreate         = document.getElementById('btn-create');

/* ── Today's date ── */
(function() {
    var d    = new Date();
    var yyyy = d.getFullYear();
    var mm   = String(d.getMonth() + 1).padStart(2, '0');
    var dd   = String(d.getDate()).padStart(2, '0');
    document.getElementById('form-date').value = yyyy + '-' + mm + '-' + dd;
})();

/* ════════ MODAL ════════ */
function openSystemModal()  { systemModal.classList.remove('hidden'); }
function closeSystemModal() { systemModal.classList.add('hidden'); }

/* ════════ HOME ════════ */
function goHome() {
    renderCanvas.classList.add('hidden');
    btnHome.classList.add('hidden');
    btnNew.classList.add('hidden');
    btnDownload.classList.add('hidden');
    btnCreate.classList.remove('hidden');
    document.getElementById('invoice-data-form').reset();
    (function() {
        var d = new Date();
        document.getElementById('form-date').value =
            d.getFullYear() + '-' +
            String(d.getMonth()+1).padStart(2,'0') + '-' +
            String(d.getDate()).padStart(2,'0');
    })();
    resetItemRows();
}

function resetItemRows() {
    dynamicRecordsBox.innerHTML = makeItemRow(1, false);
}

function makeItemRow(n, removable) {
    return '<div class="item-entry bg-gray-50 p-3 rounded border border-gray-200">' +
        '<div class="flex justify-between items-center mb-1.5">' +
            '<span class="font-bold text-blue-600 uppercase tracking-wide text-xs">Item Record #<span class="index-badge">' + n + '</span></span>' +
            (removable ? '<button type="button" onclick="this.closest(\'.item-entry\').remove();reindex();" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase">Remove</button>' : '') +
        '</div>' +
        '<div class="grid grid-cols-3 gap-2">' +
            '<div class="col-span-2"><input type="text" placeholder="Description" required class="row-desc w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500"></div>' +
            '<div><input type="number" placeholder="Amount (KD)" required step="0.001" min="0" class="row-amount w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-blue-500 font-mono"></div>' +
        '</div></div>';
}

/* ════════ LINE ITEMS ════════ */
function appendNewItemFormRow() {
    var n = dynamicRecordsBox.getElementsByClassName('item-entry').length + 1;
    dynamicRecordsBox.insertAdjacentHTML('beforeend', makeItemRow(n, true));
}
function reindex() {
    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry'))
        .forEach(function(el, i) { el.querySelector('.index-badge').textContent = i + 1; });
}

/* ════════ FORMATTING ════════ */
function formatKD(n) {
    return parseFloat(n).toFixed(3) + ' KD';
}

function toWords(amount) {
    var rounded = Math.round(amount * 1000) / 1000;
    var dinars  = Math.floor(rounded);
    var fils    = Math.round((rounded - dinars) * 1000);
    var u = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
             'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    var t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function h(v) {
        var s = '';
        if (v >= 100) { s += u[Math.floor(v/100)] + ' Hundred '; v %= 100; }
        if (v >= 20)  { s += t[Math.floor(v/10)] + ' '; v %= 10; }
        if (v > 0)      s += u[v] + ' ';
        return s.trim();
    }
    function words(n) {
        if (!n) return 'Zero';
        var w = '';
        if (n >= 1000000) { w += h(Math.floor(n/1000000)) + ' Million '; n %= 1000000; }
        if (n >= 1000)    { w += h(Math.floor(n/1000)) + ' Thousand '; n %= 1000; }
        if (n > 0)          w += h(n);
        return w.trim();
    }
    var out = words(dinars) + ' KD';
    if (fils > 0) out += ' and ' + words(fils) + ' Fils';
    return (out + ' Only').replace(/\s+/g, ' ');
}

/* ════════ BUILD INVOICE ════════ */
function executeInvoiceGenerationPipeline(e) {
    e.preventDefault();

    document.getElementById('target-no').textContent      = document.getElementById('form-no').value;
    document.getElementById('target-address').textContent = document.getElementById('form-address').value;

    var p = document.getElementById('form-date').value.split('-');
    document.getElementById('target-date').textContent =
        new Date(+p[0], +p[1]-1, +p[2]).toLocaleDateString('en-US', {day:'numeric', month:'long', year:'numeric'});

    var tbody = document.getElementById('target-table-body');
    tbody.innerHTML = '';
    var total = 0;

    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry')).forEach(function(row, i) {
        var desc = row.querySelector('.row-desc').value;
        var amt  = parseFloat(row.querySelector('.row-amount').value) || 0;
        total += amt;
        var tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #d1d5db';
        tr.innerHTML =
            '<td style="padding:8px 4px; text-align:center; border-right:1px solid #111827; font-family:Poppins,sans-serif; font-weight:600; font-size:10.5px;">' + (i+1) + '.</td>' +
            '<td style="padding:8px 10px; text-align:left; border-right:1px solid #111827; font-family:Poppins,sans-serif; font-size:10.5px;">' + desc + '</td>' +
            '<td style="padding:8px 10px; text-align:right; font-family:Poppins,sans-serif; font-weight:600; font-size:10.5px; font-variant-numeric:tabular-nums;">' + formatKD(amt) + '</td>';
        tbody.appendChild(tr);
    });

    document.getElementById('target-grand-total').textContent = formatKD(total);
    document.getElementById('target-total-words').textContent = toWords(total);

    var sigFile = document.getElementById('form-sig-file');
    var sigImg  = document.getElementById('target-salesman-sig-img');

    if (sigFile.files && sigFile.files[0]) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            sigImg.src = ev.target.result;
            sigImg.style.display = 'block';
            showAndExport();
        };
        reader.readAsDataURL(sigFile.files[0]);
    } else {
        sigImg.style.display = 'none';
        sigImg.src = '';
        showAndExport();
    }
}

/* ════════ SHOW + EXPORT ════════ */
function showAndExport() {
    closeSystemModal();
    renderCanvas.classList.remove('hidden');
    btnCreate.classList.add('hidden');
    btnHome.classList.remove('hidden');
    btnNew.classList.remove('hidden');
    btnDownload.classList.remove('hidden');

    /* Wait for fonts to be ready, then export */
    var doExport = function() {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                exportPdf();
            });
        });
    };

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(doExport);
    } else {
        setTimeout(doExport, 1000);
    }
}

/* ════════ PDF EXPORT ════════ */
function exportPdf() {
    var no       = document.getElementById('target-no').textContent.trim() || 'Document';
    var filename = 'Invoice_No_' + no + '.pdf';

    btnDownload.textContent = '⏳ Generating…';
    btnDownload.disabled    = true;

    var opt = {
        margin:      [5, 5, 5, 5],
        filename:    filename,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale:           2,
            useCORS:         true,
            logging:         false,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(renderCanvas).save()
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

function reDownloadPdf() { exportPdf(); }
