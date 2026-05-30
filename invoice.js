/* ══════════════════════════════════════════════════
   invoice.js — Engine Core Automation Pipeline
   ══════════════════════════════════════════════════ */

var systemModal       = document.getElementById('system-modal');
var renderCanvas      = document.getElementById('invoice-render-canvas');
var dynamicRecordsBox = document.getElementById('dynamic-records-box');
var btnHome           = document.getElementById('btn-home');
var btnNew            = document.getElementById('btn-new');
var btnDownload       = document.getElementById('btn-download');
var btnCreate         = document.getElementById('btn-create');

// Auto assign current timezone standard ISO formats
(function() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    document.getElementById('form-date').value = yyyy + '-' + mm + '-' + dd;
})();

function openSystemModal()  { systemModal.classList.remove('hidden'); }
function closeSystemModal() { systemModal.classList.add('hidden'); }

function goHome() {
    renderCanvas.classList.add('hidden');
    btnHome.classList.add('hidden');
    btnNew.classList.add('hidden');
    btnDownload.classList.add('hidden');
    btnCreate.classList.remove('hidden');
    document.getElementById('invoice-data-form').reset();
    resetItemRows();
    // Re-verify static logo state
    var logoImg = document.getElementById('target-logo-img');
    logoImg.src = "images/Logo.png";
    logoImg.style.display = 'block';
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

function appendNewItemFormRow() {
    var n = dynamicRecordsBox.getElementsByClassName('item-entry').length + 1;
    dynamicRecordsBox.insertAdjacentHTML('beforeend', makeItemRow(n, true));
}

function reindex() {
    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry'))
        .forEach(function(el, i) { el.querySelector('.index-badge').textContent = i + 1; });
}

function toWords(amount) {
    var rounded = Math.round(amount * 1000) / 1000;
    var dinars = Math.floor(rounded);
    var fils = Math.round((rounded - dinars) * 1000);
    
    var units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertUnderThousand(value) {
        var str = '';
        if (value >= 100) {
            str += units[Math.floor(value / 100)] + ' Hundred ';
            value %= 100;
        }
        if (value >= 20) {
            str += tens[Math.floor(value / 10)] + ' ';
            value %= 10;
        }
        if (value > 0) {
            str += units[value] + ' ';
        }
        return str.trim();
    }
    
    function compileEngine(num) {
        if (!num) return '';
        var track = '';
        if (num >= 1000000) {
            track += convertUnderThousand(Math.floor(num / 1000000)) + ' Million ';
            num %= 1000000;
        }
        if (num >= 1000) {
            track += convertUnderThousand(Math.floor(num / 1000)) + ' Thousand ';
            num %= 1000;
        }
        if (num > 0) {
            track += convertUnderThousand(num);
        }
        return track.trim();
    }
    
    if (dinars === 0 && fils === 0) return 'Zero KD Only';
    
    var outputWords = '';
    if (dinars > 0) {
        outputWords += compileEngine(dinars) + ' KD';
    }
    if (fils > 0) {
        if (dinars > 0) outputWords += ' and ';
        outputWords += convertUnderThousand(fils) + ' Fils';
    }
    return (outputWords + ' Only').replace(/\s+/g, ' ');
}

function executeInvoiceGenerationPipeline(e) {
    e.preventDefault();

    document.getElementById('target-no').textContent = document.getElementById('form-no').value;
    document.getElementById('target-address').textContent = document.getElementById('form-address').value;

    var dateParts = document.getElementById('form-date').value.split('-');
    document.getElementById('target-date').textContent =
        new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]).toLocaleDateString('en-US', {day:'numeric', month:'long', year:'numeric'});

    var tbody = document.getElementById('target-table-body');
    tbody.innerHTML = '';
    var cumulativeSum = 0;

    Array.from(dynamicRecordsBox.getElementsByClassName('item-entry')).forEach(function(row, i) {
        var description = row.querySelector('.row-desc').value;
        var rowAmount = parseFloat(row.querySelector('.row-amount').value) || 0;
        cumulativeSum += rowAmount;
        
        var tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #111827';
        tr.innerHTML =
            '<td style="padding:7px 4px; text-align:center; border-right:1px solid #111827; font-weight:600; font-size:10px;">' + (i + 1) + '.</td>' +
            '<td style="padding:7px 8px; text-align:left; border-right:1px solid #111827; font-size:10px; whitespace:normal; word-break:break-word;">' + description + '</td>' +
            '<td style="padding:7px 8px; text-align:right; font-weight:600; font-size:10px; font-variant-numeric:tabular-nums;">' + rowAmount.toFixed(3) + ' KD</td>';
        tbody.appendChild(tr);
    });

    document.getElementById('target-grand-total').textContent = cumulativeSum.toFixed(3) + ' KD';
    document.getElementById('target-total-words').textContent = toWords(cumulativeSum);

    var logoImg = document.getElementById('target-logo-img');
    var sigFile = document.getElementById('form-sig-file');
    var sigImg = document.getElementById('target-salesman-sig-img');

    var assetsLoadedCount = 0;
    var assetsNeededCount = 0;
    
    // Check if the logo image element itself is fully ready and painted inside DOM bounds
    if (logoImg.complete && logoImg.naturalWidth !== 0) {
        // Already fully cached and loaded by the browser engine locally
    } else {
        assetsNeededCount++;
        logoImg.onload = function() {
            assetsLoadedCount++;
            checkAndFinalize();
        };
        logoImg.onerror = function() {
            console.warn("Local path logo asset failed download pass. Checking backup arrays.");
            assetsLoadedCount++;
            checkAndFinalize();
        };
    }

    if (sigFile.files && sigFile.files[0]) assetsNeededCount++;

    function checkAndFinalize() {
        if (assetsLoadedCount >= assetsNeededCount) {
            closeSystemModal();
            renderCanvas.classList.remove('hidden');
            btnCreate.classList.add('hidden');
            btnHome.classList.remove('hidden');
            btnNew.classList.remove('hidden');
            btnDownload.classList.remove('hidden');
            
            // Allow layout engines to settle cleanly, then process
            setTimeout(function() { exportPdf(); }, 500);
        }
    }

    // Process Salesman Signature Upload Stream cleanly
    if (sigFile.files && sigFile.files[0]) {
        var sigReader = new FileReader();
        sigReader.onload = function(ev) {
            sigImg.onload = function() {
                assetsLoadedCount++;
                checkAndFinalize();
            };
            sigImg.src = ev.target.result;
            sigImg.style.display = 'block';
        };
        sigReader.readAsDataURL(sigFile.files[0]);
    } else {
        sigImg.style.display = 'none';
        sigImg.src = '';
    }

    if (assetsNeededCount === 0) {
        checkAndFinalize();
    }
}

function exportPdf() {
    var invoiceNo = document.getElementById('target-no').textContent.trim() || 'Doc';
    var filename = 'Invoice_No_' + invoiceNo + '.pdf';

    btnDownload.textContent = '⏳ Generating…';
    btnDownload.disabled = true;

    var configOptions = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale: 3,
            useCORS: true,
            logging: false,
            letterRendering: true,
            backgroundColor: '#ffffff'
        },
        // Strict single page hard cutoff filter configuration
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    html2pdf().set(configOptions).from(renderCanvas).save()
        .then(function() {
            btnDownload.innerHTML = '&#8659; Download PDF';
            btnDownload.disabled = false;
        })
        .catch(function(err) {
            btnDownload.innerHTML = '&#8659; Download PDF';
            btnDownload.disabled = false;
            alert('Generation error: ' + err.message);
        });
}

function reDownloadPdf() { exportPdf(); }
