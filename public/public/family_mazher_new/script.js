// ============================================
// متغيرات عامة
// ============================================
let tableData = [];
let years = [];
let editingCell = { row: null, col: null };
let editingName = { row: null };
let editingYear = { col: null };

const SHEET_ID = "12kdh41FzmZAS-8fgTm5LyqpwlCMWVg-jG9KcJiirLxA";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw8pgbJnIaNbbmNFxQK4C2cqFYuTLYOhH56lNzOsaQ2QdgddGMoeS2SUszRcCpk9wl1/exec";

// ============================================
// تحميل البيانات عند بدء الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    checkAdminStatus(); // إضافة التحقق من حالة المشرف
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
        
        // تعطيل وظيفة البحث (اختياري، لكن سنبقيها للمشاهدة)
        // document.getElementById('searchInput').disabled = true;
        
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
    
    fetch(WEB_APP_URL + '?action=getData')
        .then(response => response.json())
        .then(data => {
            tableData = data.data || [];
            years = data.years || [];
            renderTable();
            showNotification('تم تحميل البيانات بنجاح ✓', 'success');
        })
        .catch(error => {
            console.error('خطأ:', error);
            showNotification('خطأ في تحميل البيانات', 'error');
        });
}

// ============================================
// رسم الجدول
// ============================================
function renderTable() {
    const yearsRow = document.getElementById('yearsRow');
    const tableBody = document.getElementById('tableBody');
    const isLoggedIn = checkAdminStatus(); // التحقق من حالة المشرف
    
    // مسح الصفوف السابقة
    yearsRow.innerHTML = '<th colspan="2"></th>';
    tableBody.innerHTML = '';
    
    // إضافة السنوات في الصف الأول
    years.forEach((year, index) => {
        const th = document.createElement('th');
        th.className = 'col-year';
        th.textContent = year;
        
        if (isLoggedIn) {
            th.onclick = () => openEditYearHeaderModal(index, year);
            th.style.cursor = 'pointer';
            th.title = 'اضغط للتعديل أو الحذف';
        }
        
        yearsRow.appendChild(th);
    });
    
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
        
        // خلايا البيانات
        for (let colIndex = 1; colIndex <= years.length; colIndex++) {
            const td = document.createElement('td');
            const value = row[colIndex] || '-';
            
            const cell = document.createElement('div');
            cell.className = 'data-cell ' + getCellClass(value);
            cell.textContent = value;
            
            if (isLoggedIn) {
                cell.onclick = () => openEditCellModal(rowIndex, colIndex - 1, row[0], years[colIndex - 1], value);
            } else {
                cell.style.cursor = 'default';
            }
            
            td.appendChild(cell);
            tr.appendChild(td);
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
function openEditCellModal(row, col, personName, year, currentValue) {
    if (!checkAdminStatus()) return; // منع الفتح إذا لم يكن مشرفاً
    
    editingCell = { row, col };
    document.getElementById('editPersonName').textContent = personName;
    document.getElementById('editYearValue').textContent = year;
    document.getElementById('editCellValue').value = currentValue;
    
    // إعادة تعيين الأزرار
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('editCellModal').classList.add('show');
}

// ============================================
// إغلاق مودال تعديل الخانة
// ============================================
function closeEditCellModal() {
    document.getElementById('editCellModal').classList.remove('show');
    document.getElementById('editCellValue').value = '';
}

// ============================================
// تعيين قيمة الخانة من الأزرار
// ============================================
function setEditValue(value) {
    document.getElementById('editCellValue').value = value;
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(value)) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// حفظ تعديل الخانة
// ============================================
function saveEditCell() {
    const value = document.getElementById('editCellValue').value.trim();
    
    if (!value) {
        showNotification('الرجاء إدخال قيمة', 'warning');
        return;
    }
    
    tableData[editingCell.row][editingCell.col + 1] = value;
    
    // حفظ في Google Sheet
    updateCell(editingCell.row, editingCell.col + 1, value);
    
    closeEditCellModal();
    renderTable();
    showNotification('تم تحديث البيانات ✓', 'success');
}

// ============================================
// فتح مودال تعديل الاسم
// ============================================
function openEditNameModal(row, currentName) {
    if (!checkAdminStatus()) return; // منع الفتح إذا لم يكن مشرفاً
    
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
    
    tableData[editingName.row][0] = newName;
    updateCell(editingName.row, 0, newName);
    
    closeEditNameModal();
    renderTable();
    showNotification('تم تحديث الاسم ✓', 'success');
}

// ============================================
// حذف صف الشخص
// ============================================
function deletePersonRow() {
    if (confirm('هل أنت متأكد من حذف هذا الشخص؟')) {
        tableData.splice(editingName.row, 1);
        deletePerson(editingName.row);
        closeEditNameModal();
        renderTable();
        showNotification('تم حذف الشخص ✓', 'success');
    }
}

// ============================================
// فتح مودال تعديل السنة
// ============================================
function openEditYearHeaderModal(col, currentYear) {
    if (!checkAdminStatus()) return; // منع الفتح إذا لم يكن مشرفاً
    
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
    
    years[editingYear.col] = newYear;
    updateYear(editingYear.col, newYear);
    
    closeEditYearHeaderModal();
    renderTable();
    showNotification('تم تحديث السنة ✓', 'success');
}

// ============================================
// حذف عمود السنة
// ============================================
function deleteYearColumn() {
    if (confirm('هل أنت متأكد من حذف هذه السنة؟')) {
        years.splice(editingYear.col, 1);
        tableData.forEach(row => {
            row.splice(editingYear.col + 1, 1);
        });
        deleteYear(editingYear.col);
        closeEditYearHeaderModal();
        renderTable();
        showNotification('تم حذف السنة ✓', 'success');
    }
}

// ============================================
// فتح مودال إضافة شخص
// ============================================
function openAddPersonModal() {
    if (!checkAdminStatus()) return; // منع الفتح إذا لم يكن مشرفاً
    
    document.getElementById('personName').value = '';
    document.getElementById('addPersonModal').classList.add('show');
    document.getElementById('personName').focus();
}

// ============================================
// إغلاق مودال إضافة شخص
// ============================================
function closeAddPersonModal() {
    document.getElementById('addPersonModal').classList.remove('show');
    document.getElementById('personName').value = '';
}

// ============================================
// إضافة شخص جديد
// ============================================
function addNewPerson() {
    const name = document.getElementById('personName').value.trim();
    
    if (!name) {
        showNotification('الرجاء إدخال اسم الشخص', 'warning');
        return;
    }
    
    // إنشاء صف جديد
    const newRow = [name];
    for (let i = 0; i < years.length; i++) {
        newRow.push('-');
    }
    
    tableData.push(newRow);
    addPerson(name);
    
    closeAddPersonModal();
    renderTable();
    showNotification('تم إضافة الشخص ✓', 'success');
}

// ============================================
// فتح مودال إضافة سنة
// ============================================
function openAddYearModal() {
    if (!checkAdminStatus()) return; // منع الفتح إذا لم يكن مشرفاً
    
    document.getElementById('yearInput').value = '';
    document.getElementById('addYearModal').classList.add('show');
    document.getElementById('yearInput').focus();
}

// ============================================
// إغلاق مودال إضافة سنة
// ============================================
function closeAddYearModal() {
    document.getElementById('addYearModal').classList.remove('show');
    document.getElementById('yearInput').value = '';
}

// ============================================
// إضافة سنة جديدة
// ============================================
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
    tableData.forEach(row => {
        row.push('-');
    });
    
    addYear(year);
    
    closeAddYearModal();
    renderTable();
    showNotification('تم إضافة السنة ✓', 'success');
}

// ============================================
// البحث والفلترة
// ============================================
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) {
            const name = nameCell.textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        }
    });
}

// ============================================
// حفظ البيانات
// ============================================
function saveData() {
    if (!checkAdminStatus()) return; // منع الحفظ إذا لم يكن مشرفاً
    
    showNotification('جاري حفظ البيانات...', 'info');
    
    // البيانات محفوظة تلقائياً عند كل تعديل
    setTimeout(() => {
        showNotification('تم حفظ البيانات بنجاح ✓', 'success');
    }, 500);
}

// ============================================
// تصدير إلى CSV
// ============================================
function exportToCSV() {
    let csv = 'الاسم,' + years.join(',') + '\n';
    
    tableData.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'family_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('تم تصدير البيانات ✓', 'success');
}

// ============================================
// عمليات Google Sheet
// ============================================

function updateCell(row, col, value) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateCell',
            row: row,
            col: col,
            value: value
        })
    }).catch(error => console.error('خطأ:', error));
}

function addPerson(name) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addPerson',
            name: name,
            yearsCount: years.length
        })
    }).catch(error => console.error('خطأ:', error));
}

function deletePerson(row) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deletePerson',
            row: row
        })
    }).catch(error => console.error('خطأ:', error));
}

function addYear(year) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addYear',
            year: year
        })
    }).catch(error => console.error('خطأ:', error));
}

function deleteYear(col) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deleteYear',
            col: col
        })
    }).catch(error => console.error('خطأ:', error));
}

function updateYear(col, newYear) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateYear',
            col: col,
            year: newYear
        })
    }).catch(error => console.error('خطأ:', error));
}

// ============================================
// إظهار الإشعارات
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// إغلاق المودالات عند الضغط خارجها
// ============================================
window.onclick = function(event) {
    const modals = [
        'addPersonModal',
        'addYearModal',
        'editCellModal',
        'editNameModal',
        'editYearHeaderModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// ============================================
// اختصارات لوحة المفاتيح
// ============================================
document.addEventListener('keydown', function(event) {
    // Escape لإغلاق المودالات
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
    
    // Ctrl+S لحفظ البيانات
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveData();
    }
});
