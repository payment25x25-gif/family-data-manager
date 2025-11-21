// ============================================
// متغيرات عامة
// ============================================
let tableData = []; // [ [Name, Status_Y1, Note_Y1, Status_Y2, Note_Y2, ...], ... ]
let years = [];
let editingCell = { row: null, col: null }; // col here is the year index (0, 1, 2, ...)
let editingName = { row: null };
let editingYear = { col: null };

let SHEET_ID = ""; // سيتم تعيينه من URL
let FAMILY_NAME = ""; // سيتم تعيينه من URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby5T2udlC21ihzcAyYrKD_o_QNgeaM36P78HbBDfPtqyAD-UX066lcKaVIP6paNvjhYDg/exec"; // يجب أن يكون هذا هو رابط Web App الخاص بـ Code.gs

// ============================================
// دوال مساعدة
// ============================================

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    SHEET_ID = params.get('sheetId') || "";
    FAMILY_NAME = decodeURIComponent(params.get('familyName') || "بيانات العائلة");
}

function goBackToHome() {
    window.location.href = '../index.html';
}

// ============================================
// تحميل البيانات عند بدء الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    getUrlParams();
    if (!SHEET_ID) {
        alert('خطأ: لم يتم تحديد معرف جدول البيانات (Sheet ID). سيتم توجيهك للصفحة الرئيسية.');
        goBackToHome();
        return;
    }
    
    // تحديث عنوان الصفحة
    document.getElementById('familyPageTitle').textContent = `مدير بيانات عائلة ${FAMILY_NAME}`;
    document.getElementById('familyHeaderTitle').innerHTML = `📊 مدير بيانات عائلة ${FAMILY_NAME}`;

    loadData();
    checkAdminStatus();
});

// ============================================
// التحقق من حالة المشرف
// ============================================
function checkAdminStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        // إخفاء جميع أزرار الإدارة
        document.getElementById('btnAddPersonHeader').style.display = 'none';
        document.getElementById('btnAddYearHeader').style.display = 'none';
        document.getElementById('btnSaveData').style.display = 'none';
        document.getElementById('addRowContainer').style.display = 'none';
        
        // إظهار رسالة للمستخدم
        showNotification('وضع المشاهدة مفعل. للتعديل، يرجى تسجيل الدخول في الصفحة الرئيسية.', 'info', 5000);
    }
    return isLoggedIn;
}

// ============================================
// تحميل البيانات من Google Sheet
// ============================================
function loadData() {
    showNotification('جاري تحميل البيانات...', 'info');
    
    fetch(`${WEB_APP_URL}?action=getData&sheetId=${SHEET_ID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                tableData = data.data || [];
                years = data.years || [];
                renderTable();
                showNotification('تم تحميل البيانات بنجاح ✓', 'success');
            } else {
                throw new Error(data.error || 'فشل تحميل البيانات.');
            }
        })
        .catch(error => {
            console.error('خطأ:', error);
            showNotification(`خطأ في تحميل البيانات: ${error.message}`, 'error');
        });
}

// ============================================
// رسم الجدول
// ============================================
function renderTable() {
    const yearsRow = document.getElementById('yearsRow');
    const tableBody = document.getElementById('tableBody');
    const isLoggedIn = checkAdminStatus();
    
    // مسح الصفوف السابقة
    yearsRow.innerHTML = '<th colspan="2"></th>';
    tableBody.innerHTML = '';
    
    // إضافة السنوات في الصف الأول
    years.forEach((year, index) => {
        // رأس السنة (يحتوي على اسم السنة)
        const thYear = document.createElement('th');
        thYear.className = 'col-year-header';
        thYear.colSpan = 2; // يغطي عمود الحالة وعمود الملاحظة
        thYear.textContent = year;
        
        if (isLoggedIn) {
            thYear.onclick = () => openEditYearHeaderModal(index, year);
            thYear.style.cursor = 'pointer';
            thYear.title = 'اضغط للتعديل أو الحذف';
        }
        yearsRow.appendChild(thYear);
    });
    
    // إضافة صف الرؤوس الفرعية (الحالة والملاحظة)
    const subHeadersRow = document.createElement('tr');
    subHeadersRow.innerHTML = '<th class="col-number">#</th><th class="col-name">الاسم</th>';
    
    years.forEach(() => {
        subHeadersRow.innerHTML += '<th class="col-status">الحالة</th><th class="col-note">الملاحظة</th>';
    });
    
    // إزالة الصف القديم وإضافة الصف الجديد
    const headerRow = document.querySelector('.header-row');
    if (headerRow.nextElementSibling && headerRow.nextElementSibling.classList.contains('sub-headers-row')) {
        headerRow.nextElementSibling.remove();
    }
    subHeadersRow.classList.add('sub-headers-row');
    headerRow.parentNode.insertBefore(subHeadersRow, headerRow.nextElementSibling);
    
    // إضافة صفوف البيانات
    tableData.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        
        // رقم الصف
        const tdNumber = document.createElement('td');
        tdNumber.className = 'col-number';
        tdNumber.textContent = rowIndex + 1;
        tr.appendChild(tdNumber);
        
        // اسم الشخص
        const tdName = document.createElement('td');
        tdName.className = 'col-name';
        tdName.textContent = row[0] || '';
        
        if (isLoggedIn) {
            tdName.onclick = () => openEditNameModal(rowIndex, row[0]);
            tdName.style.cursor = 'pointer';
            tdName.title = 'اضغط للتعديل أو الحذف';
        }
        
        tr.appendChild(tdName);
        
        // خلايا البيانات (الحالة والملاحظة لكل سنة)
        for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
            const statusColIndex = 1 + (yearIndex * 2);
            const noteColIndex = 2 + (yearIndex * 2);
            
            const status = row[statusColIndex] || '-';
            const note = row[noteColIndex] || '';
            
            // عمود الحالة
            const tdStatus = document.createElement('td');
            tdStatus.className = 'col-status';
            const cellStatus = document.createElement('div');
            cellStatus.className = 'data-cell ' + getCellClass(status);
            cellStatus.textContent = status;
            
            // عمود الملاحظة
            const tdNote = document.createElement('td');
            tdNote.className = 'col-note';
            const cellNote = document.createElement('div');
            cellNote.className = 'data-cell note-cell';
            cellNote.textContent = note;
            cellNote.title = note; // عرض الملاحظة كاملة عند التمرير
            
            if (isLoggedIn) {
                const clickHandler = () => openEditCellModal(rowIndex, yearIndex, row[0], years[yearIndex], status, note);
                tdStatus.onclick = clickHandler;
                tdNote.onclick = clickHandler;
                tdStatus.style.cursor = 'pointer';
                tdNote.style.cursor = 'pointer';
            } else {
                tdStatus.style.cursor = 'default';
                tdNote.style.cursor = 'default';
            }
            
            tdStatus.appendChild(cellStatus);
            tdNote.appendChild(cellNote);
            tr.appendChild(tdStatus);
            tr.appendChild(tdNote);
        }
        
        tableBody.appendChild(tr);
    });
}

// ============================================
// تحديد فئة الخلية بناءً على القيمة
// ============================================
function getCellClass(value) {
    if (value === 'مشارك') return 'participant';
    if (value === 'X') return 'absent';
    if (value === '-') return 'empty';
    return 'custom';
}

// ============================================
// فتح مودال تعديل الخانة
// ============================================
function openEditCellModal(row, yearIndex, personName, year, currentStatus, currentNote) {
    if (!checkAdminStatus()) return; // منع الفتح إذا لم يكن مشرفاً
    
    editingCell = { row, col: yearIndex };
    document.getElementById('editPersonName').textContent = personName;
    document.getElementById('editYearValue').textContent = year;
    document.getElementById('editParticipationStatus').value = currentStatus;
    document.getElementById('editNoteValue').value = currentNote;
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === currentStatus) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('editCellModal').classList.add('show');
}

// ============================================
// إغلاق مودال تعديل الخانة
// ============================================
function closeEditCellModal() {
    document.getElementById('editCellModal').classList.remove('show');
    document.getElementById('editParticipationStatus').value = '';
    document.getElementById('editNoteValue').value = '';
}

// ============================================
// تعيين حالة المشاركة من الأزرار
// ============================================
function setParticipationStatus(value) {
    document.getElementById('editParticipationStatus').value = value;
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === value) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// حفظ تعديل الخانة (الحالة والملاحظة)
// ============================================
function saveEditCell() {
    const status = document.getElementById('editParticipationStatus').value.trim();
    const note = document.getElementById('editNoteValue').value.trim();
    
    if (!status) {
        showNotification('الرجاء اختيار حالة المشاركة', 'warning');
        return;
    }
    
    const yearIndex = editingCell.col;
    const statusColIndex = 1 + (yearIndex * 2);
    const noteColIndex = 2 + (yearIndex * 2);
    
    // تحديث البيانات المحلية
    tableData[editingCell.row][statusColIndex] = status;
    tableData[editingCell.row][noteColIndex] = note;
    
    // حفظ في Google Sheet
    updateCell(editingCell.row, statusColIndex, status, noteColIndex, note);
    
    closeEditCellModal();
    renderTable();
    showNotification('تم تحديث البيانات ✓', 'success');
}

// ============================================
// فتح مودال إضافة شخص جديد
// ============================================
function openAddPersonModal() {
    if (!checkAdminStatus()) return;
    document.getElementById('addPersonModal').classList.add('show');
    document.getElementById('personName').focus();
}

function closeAddPersonModal() {
    document.getElementById('addPersonModal').classList.remove('show');
    document.getElementById('personName').value = '';
}

function addNewPerson() {
    const personName = document.getElementById('personName').value.trim();
    if (!personName) {
        showNotification('الرجاء إدخال اسم الشخص', 'warning');
        return;
    }
    
    // إنشاء صف جديد بالاسم والقيم الافتراضية
    const newRow = [personName];
    for (let i = 0; i < years.length; i++) {
        newRow.push('-'); // الحالة الافتراضية
        newRow.push(''); // الملاحظة الافتراضية
    }
    
    tableData.push(newRow);
    
    // حفظ في Google Sheet
    addPerson(personName);
    
    closeAddPersonModal();
    renderTable();
    showNotification(`تم إضافة ${personName} ✓`, 'success');
}

// ============================================
// فتح مودال إضافة سنة جديدة
// ============================================
function openAddYearModal() {
    if (!checkAdminStatus()) return;
    document.getElementById('addYearModal').classList.add('show');
    document.getElementById('yearInput').focus();
}

function closeAddYearModal() {
    document.getElementById('addYearModal').classList.remove('show');
    document.getElementById('yearInput').value = '';
}

function addNewYear() {
    const year = document.getElementById('yearInput').value.trim();
    if (!year) {
        showNotification('الرجاء إدخال السنة', 'warning');
        return;
    }
    
    if (years.includes(year)) {
        showNotification('هذه السنة موجودة بالفعل', 'warning');
        return;
    }
    
    years.push(year);
    
    // إضافة عمودين (الحالة والملاحظة) لكل صف
    tableData.forEach(row => {
        row.push('-'); // الحالة الافتراضية
        row.push(''); // الملاحظة الافتراضية
    });
    
    // حفظ في Google Sheet
    addYear(year);
    
    closeAddYearModal();
    renderTable();
    showNotification(`تم إضافة سنة ${year} ✓`, 'success');
}

// ============================================
// فتح مودال تعديل الاسم
// ============================================
function openEditNameModal(row, currentName) {
    if (!checkAdminStatus()) return;
    
    editingName = { row };
    document.getElementById('editNameValue').value = currentName;
    document.getElementById('editNameModal').classList.add('show');
    document.getElementById('editNameValue').focus();
}

// ============================================
// إغلاق مودال تعديل الاسم
// ============================================
function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('show');
    document.getElementById('editNameValue').value = '';
}

// ============================================
// حفظ تعديل الاسم
// ============================================
function saveEditName() {
    const newName = document.getElementById('editNameValue').value.trim();
    
    if (!newName) {
        showNotification('الرجاء إدخال اسم', 'warning');
        return;
    }
    
    const oldName = tableData[editingName.row][0];
    tableData[editingName.row][0] = newName;
    
    // حفظ في Google Sheet
    updateName(editingName.row, newName);
    
    closeEditNameModal();
    renderTable();
    showNotification(`تم تحديث الاسم من ${oldName} إلى ${newName} ✓`, 'success');
}

// ============================================
// حذف صف الشخص
// ============================================
function deletePersonRow() {
    if (confirm('هل أنت متأكد من حذف هذا الشخص؟')) {
        const personName = tableData[editingName.row][0];
        tableData.splice(editingName.row, 1);
        deletePerson(editingName.row);
        closeEditNameModal();
        renderTable();
        showNotification(`تم حذف الشخص ${personName} ✓`, 'success');
    }
}

// ============================================
// فتح مودال تعديل السنة
// ============================================
function openEditYearHeaderModal(col, currentYear) {
    if (!checkAdminStatus()) return;
    
    editingYear = { col };
    document.getElementById('editYearHeaderValue').value = currentYear;
    document.getElementById('editYearHeaderModal').classList.add('show');
    document.getElementById('editYearHeaderValue').focus();
}

// ============================================
// إغلاق مودال تعديل السنة
// ============================================
function closeEditYearHeaderModal() {
    document.getElementById('editYearHeaderModal').classList.remove('show');
    document.getElementById('editYearHeaderValue').value = '';
}

// ============================================
// حفظ تعديل السنة
// ============================================
function saveEditYearHeader() {
    const newYear = document.getElementById('editYearHeaderValue').value.trim();
    
    if (!newYear) {
        showNotification('الرجاء إدخال السنة', 'warning');
        return;
    }
    
    const oldYear = years[editingYear.col];
    years[editingYear.col] = newYear;
    updateYear(editingYear.col, newYear);
    
    closeEditYearHeaderModal();
    renderTable();
    showNotification(`تم تحديث السنة من ${oldYear} إلى ${newYear} ✓`, 'success');
}

// ============================================
// حذف عمود السنة
// ============================================
function deleteYearColumn() {
    if (confirm('هل أنت متأكد من حذف عمود هذه السنة بالكامل؟')) {
        const year = years[editingYear.col];
        
        // حذف السنة من مصفوفة السنوات
        years.splice(editingYear.col, 1);
        
        // حذف عمودي الحالة والملاحظة من كل صف بيانات
        const statusColIndex = 1 + (editingYear.col * 2);
        
        tableData.forEach(row => {
            row.splice(statusColIndex, 2);
        });
        
        // حفظ في Google Sheet
        deleteYear(editingYear.col);
        
        closeEditYearHeaderModal();
        renderTable();
        showNotification(`تم حذف سنة ${year} ✓`, 'success');
    }
}

// ============================================
// إشعارات
// ============================================
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// ============================================
// وظائف الاتصال بـ Google Apps Script
// ============================================

// تحديث خلية (الحالة والملاحظة)
async function updateCell(rowIndex, statusColIndex, status, noteColIndex, note) {
    const data = {
        action: 'updateCell',
        sheetId: SHEET_ID,
        rowIndex: rowIndex + 1, // +1 لتعويض صف الرؤوس
        statusColIndex: statusColIndex + 1, // +1 لتعويض عمود الاسم
        status: status,
        noteColIndex: noteColIndex + 1, // +1 لتعويض عمود الاسم
        note: note
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error updating cell:', error);
        showNotification('فشل تحديث الخلية في Google Sheet', 'error');
    }
}

// إضافة شخص
async function addPerson(personName) {
    const data = {
        action: 'addPerson',
        sheetId: SHEET_ID,
        personName: personName
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error adding person:', error);
        showNotification('فشل إضافة الشخص في Google Sheet', 'error');
    }
}

// حذف شخص
async function deletePerson(rowIndex) {
    const data = {
        action: 'deletePerson',
        sheetId: SHEET_ID,
        rowIndex: rowIndex + 1 // +1 لتعويض صف الرؤوس
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error deleting person:', error);
        showNotification('فشل حذف الشخص من Google Sheet', 'error');
    }
}

// تحديث اسم شخص
async function updateName(rowIndex, newName) {
    const data = {
        action: 'updateName',
        sheetId: SHEET_ID,
        rowIndex: rowIndex + 1, // +1 لتعويض صف الرؤوس
        newName: newName
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error updating name:', error);
        showNotification('فشل تحديث الاسم في Google Sheet', 'error');
    }
}

// إضافة سنة
async function addYear(year) {
    const data = {
        action: 'addYear',
        sheetId: SHEET_ID,
        year: year
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error adding year:', error);
        showNotification('فشل إضافة السنة في Google Sheet', 'error');
    }
}

// تحديث سنة
async function updateYear(yearIndex, newYear) {
    const data = {
        action: 'updateYear',
        sheetId: SHEET_ID,
        yearIndex: yearIndex + 1, // +1 لتعويض عمود الاسم
        newYear: newYear
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error updating year:', error);
        showNotification('فشل تحديث السنة في Google Sheet', 'error');
    }
}

// حذف سنة
async function deleteYear(yearIndex) {
    const data = {
        action: 'deleteYear',
        sheetId: SHEET_ID,
        yearIndex: yearIndex + 1 // +1 لتعويض عمود الاسم
    };
    
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Error deleting year:', error);
        showNotification('فشل حذف السنة من Google Sheet', 'error');
    }
}

// ============================================
// وظيفة البحث (Filter)
// ============================================
function filterTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('dataTable');
    const tr = table.getElementsByTagName('tr');
    
    for (let i = 2; i < tr.length; i++) { // البدء من الصف الثالث لتخطي الرؤوس
        const td = tr[i].getElementsByTagName('td')[1]; // عمود الاسم
        if (td) {
            const txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }       
    }
}

// ============================================
// وظيفة تصدير CSV (غير معدلة)
// ============================================
function exportToCSV() {
    let csv = [];
    
    // إضافة رؤوس الجدول
    const headerRow = document.querySelector('.header-row');
    const subHeadersRow = document.querySelector('.sub-headers-row');
    
    let headers = [];
    headerRow.querySelectorAll('th').forEach(th => {
        if (th.colSpan > 1) {
            const year = th.textContent.trim();
            headers.push(year + ' - الحالة');
            headers.push(year + ' - الملاحظة');
        } else {
            headers.push(th.textContent.trim());
        }
    });
    
    csv.push(headers.join(','));
    
    // إضافة بيانات الجدول
    tableData.forEach(row => {
        let rowData = [];
        row.forEach(cell => {
            // التعامل مع الفواصل داخل البيانات
            let cellData = cell === null || cell === undefined ? '' : cell.toString();
            if (cellData.includes(',')) {
                cellData = `"${cellData}"`;
            }
            rowData.push(cellData);
        });
        csv.push(rowData.join(','));
    });

    // تحميل الملف
    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvFile);
    link.download = `${FAMILY_NAME}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// وظيفة حفظ البيانات (غير مستخدمة حالياً)
// ============================================
function saveData() {
    showNotification('وظيفة حفظ البيانات غير مطلوبة حالياً، التحديث يتم تلقائياً.', 'info');
}
