// ============================================
// مدير بيانات العائلات - JavaScript
// Family Data Manager - Script
// تم التحديث لدمج نظام المصادقة عبر Vercel Serverless Function
// ============================================

// ملاحظة: يتم تحميل بيانات العائلات من ملف data.js

// ============================================
// 1. إدارة الأوضاع (Dark/Light Mode)
// ============================================

const themeToggle = document.getElementById('themeToggle');

// تحميل الوضع المحفوظ
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.querySelector('.theme-icon').textContent = '🌙';
    }
}

// تبديل الوضع
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
});

// تحميل الوضع عند فتح الصفحة
loadTheme();

// ============================================
// 2. إدارة الصفحات
// ============================================

function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إغلاق النافذة المنبثقة إذا كانت مفتوحة
    closeLoginModal();
    
    // إظهار الصفحة المطلوبة
    document.getElementById(pageId).classList.add('active');
    
    // التمرير إلى الأعلى
    window.scrollTo(0, 0);
}

function goHome() {
    showPage('homePage');
}

function showFamily(familyName, isAdminMode = false) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    if (familyName === 'آل مزهر') {
        // عرض صفحة آل مزهر الجديدة
        document.getElementById('familyPageMazhar').classList.add('active');
        // هنا يجب أن نستدعي دالة تحميل البيانات الخاصة بآل مزهر
        mazhar_loadData();
        // تطبيق الصلاحيات
        mazhar_applyAdminControls();
        return;
    }
    
    // عرض بيانات العائلة
    const data = familiesData[familyName];
    
    if (!data) {
        alert('لم يتم العثور على بيانات هذه العائلة');
        return;
    }
    
    // تحديث العنوان
    const familyHeader = document.querySelector('#familyPage .family-header');
    let familyTitle = familyHeader.querySelector('#familyTitle');
    if (!familyTitle) {
        familyTitle = document.createElement('h2');
        familyTitle.id = 'familyTitle';
        familyHeader.appendChild(familyTitle);
    }
    familyTitle.textContent = familyName;
    
    // تحديد ما إذا كان وضع التعديل مفعلاً
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const isEditable = isAdminMode && isLoggedIn;
    
    // إضافة زر التعديل للمشرفين
    let editButton = familyHeader.querySelector('#editFamilyData');
    if (!editButton) {
        editButton = document.createElement('button');
        editButton.id = 'editFamilyData';
        editButton.className = 'btn-primary';
        editButton.innerHTML = '<i class="fas fa-edit"></i> تعديل البيانات';
        editButton.style.marginRight = '10px';
        editButton.onclick = () => alert('صفحة التعديل قريباً... (للمشرف فقط)');
        familyHeader.appendChild(editButton);
    }
    editButton.style.display = isEditable ? 'block' : 'none';
    
    // إنشاء الجدول
    createFamilyTable(data, isEditable);
    
    // عرض الصفحة
    showPage('familyPage');
}

// ============================================
// 3. إنشاء جداول البيانات
// ============================================

function createFamilyTable(data, isEditable = false) {
    const container = document.getElementById('familyTableContainer');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">لا توجد بيانات</p>';
        return;
    }
    
    // الحصول على أسماء الأعمدة
    const columns = Object.keys(data[0]);
    
    // إنشاء الجدول
    let html = '<table>';
    
    // رأس الجدول
    html += '<thead><tr>';
    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    
    if (isEditable) {
        html += `<th>إجراءات</th>`;
    }
    
    html += '</tr></thead>';
    
    // محتوى الجدول
    html += '<tbody>';
    data.forEach((row, index) => {
        html += '<tr>';
        columns.forEach(col => {
            const value = row[col] || '-';
            html += `<td>${value}</td>`;
        });
        
        if (isEditable) {
            html += `<td>
                        <button class="btn-edit" onclick="editRow(${index})"><i class="fas fa-pencil-alt"></i> تعديل</button>
                        <button class="btn-delete" onclick="deleteRow(${index})"><i class="fas fa-trash-alt"></i> حذف</button>
                    </td>`;
        }
        
        html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    
    container.innerHTML = html;
}

// دوال وهمية للتعديل والحذف
function editRow(index) {
    alert(`تعديل الصف رقم ${index + 1} - هذه الميزة للمشرف فقط.`);
}

function deleteRow(index) {
    if (confirm(`هل أنت متأكد من حذف الصف رقم ${index + 1}؟`)) {
        alert(`تم حذف الصف رقم ${index + 1} بنجاح (وهمي).`);
    }
}

// ============================================
// 4. إدارة تسجيل الدخول (النافذة المنبثقة - Modal)
// ============================================

// تعريف دالة لفتح النافذة المنبثقة
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginError').classList.remove('show');
}

// تعريف دالة لإغلاق النافذة المنبثقة
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginError').classList.remove('show');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    const loginButton = event.target.querySelector('.btn-login');
    
    errorDiv.classList.remove('show');
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="loading"></span> جاري الدخول...';
    
    try {
        // الاتصال بـ Serverless Function للمصادقة
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.success) {
            // تسجيل الدخول ناجح
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', data.username);
            localStorage.setItem('authToken', data.token); // حفظ التوكن
            
            // إغلاق النافذة المنبثقة
            closeLoginModal();
            
            // إظهار لوحة الإدارة
            showAdminPanel();
            
            // تحديث زر تسجيل الدخول في الهيدر
            updateHeaderLoginButton(data.username);
            
        } else {
            // بيانات خاطئة
            errorDiv.textContent = data.message || 'بيانات الدخول غير صحيحة!';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        console.error('خطأ في الاتصال بالخادم:', error);
        errorDiv.textContent = 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.';
        errorDiv.classList.add('show');
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
    }
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    showPage('homePage');
    document.getElementById('adminNav').style.display = 'none'; // إخفاء شريط الإدارة
    
    // إخفاء زر التعديل عند تسجيل الخروج
    const editButton = document.querySelector('#familyPage .family-header #editFamilyData');
    if (editButton) {
        editButton.style.display = 'none';
    }
    
    // تحديث زر تسجيل الدخول في الهيدر
    updateHeaderLoginButton();
}

// =================================================================
// دوال صفحة آل مزهر (تعتمد على Google Apps Script)
// =================================================================

// ============================================
// متغيرات عامة لصفحة آل مزهر
// ============================================
let mazhar_tableData = [];
let mazhar_years = [];
let mazhar_editingCell = { row: null, col: null };
let mazhar_editingName = { row: null };
let mazhar_editingYear = { col: null };

// **ملاحظة: يجب تغيير هذه الروابط إلى الروابط الخاصة بك**
const MAZHAR_SHEET_ID = "1FleMs__EEeGaAxgdj7G2mPVFGa619F4kdf_o1jKlJIc"; 
const MAZHAR_WEB_APP_URL = "https://script.google.com/macros/s/AKfycby5T2udlC21ihzcAyYrKD_o_QNgeaM36P78HbBDfPtqyAD-UX066lcKaVIP6paNvjhYDg/exec"; 

// ============================================
// تطبيق صلاحيات المشرف لصفحة آل مزهر
// ============================================
function mazhar_applyAdminControls() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const adminControls = document.getElementById('mazharAdminControls');
    const addRowContainer = document.getElementById('mazharAddRowContainer');

    if (isLoggedIn) {
        adminControls.style.display = 'flex';
        addRowContainer.style.display = 'block';
        mazhar_showNotification('وضع المشرف مفعل. يمكنك التعديل الآن.', 'success', 3000);
    } else {
        adminControls.style.display = 'none';
        addRowContainer.style.display = 'none';
        mazhar_showNotification('وضع المشاهدة مفعل. للتعديل، يرجى تسجيل الدخول في الصفحة الرئيسية.', 'info', 5000);
    }
}

// ============================================
// تحميل البيانات من Google Sheet لصفحة آل مزهر
// ============================================
function mazhar_loadData() {
    mazhar_showNotification('جاري تحميل البيانات...', 'info');
    
    fetch(MAZHAR_WEB_APP_URL + '?action=getData')
        .then(response => response.json())
        .then(data => {
            mazhar_tableData = data.data || [];
            mazhar_years = data.years || [];
            mazhar_renderTable();
            mazhar_showNotification('تم تحميل البيانات بنجاح ✓', 'success');
        })
        .catch(error => {
            console.error('خطأ في تحميل بيانات آل مزهر:', error);
            mazhar_showNotification('خطأ في تحميل البيانات. تأكد من رابط Google Apps Script.', 'error');
        });
}

// ============================================
// رسم الجدول لصفحة آل مزهر
// ============================================
function mazhar_renderTable() {
    const yearsRow = document.getElementById('mazharYearsRow');
    const tableBody = document.getElementById('mazharTableBody');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // مسح الصفوف السابقة
    yearsRow.innerHTML = '<th colspan="2"></th>';
    tableBody.innerHTML = '';
    
    // إضافة السنوات في الصف الأول
    mazhar_years.forEach((year, index) => {
        const th = document.createElement('th');
        th.className = 'col-year';
        th.textContent = year;
        
        if (isLoggedIn) {
            th.onclick = () => mazhar_openEditYearHeaderModal(index, year);
            th.style.cursor = 'pointer';
            th.title = 'اضغط للتعديل أو الحذف';
        }
        
        yearsRow.appendChild(th);
    });
    
    // إضافة صفوف البيانات
    mazhar_tableData.forEach((row, rowIndex) => {
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
            tdName.onclick = () => mazhar_openEditNameModal(rowIndex, row[0]);
            tdName.style.cursor = 'pointer';
            tdName.title = 'اضغط للتعديل أو الحذف';
        }
        
        tr.appendChild(tdName);
        
        // خلايا البيانات
        for (let colIndex = 1; colIndex <= mazhar_years.length; colIndex++) {
            const td = document.createElement('td');
            const value = row[colIndex] || '-';
            
            const cell = document.createElement('div');
            cell.className = 'data-cell ' + mazhar_getCellClass(value);
            cell.textContent = value;
            
            if (isLoggedIn) {
                cell.onclick = () => mazhar_openEditCellModal(rowIndex, colIndex - 1, row[0], mazhar_years[colIndex - 1], value);
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
// تحديد فئة الخلية بناءً على القيمة لصفحة آل مزهر
// ============================================
function mazhar_getCellClass(value) {
    if (value === 'مشارك') return 'participant';
    if (value === 'X') return 'absent';
    if (value === '-') return 'empty';
    return 'custom';
}

// ============================================
// فتح مودال تعديل الخانة لصفحة آل مزهر
// ============================================
function mazhar_openEditCellModal(row, col, personName, year, currentValue) {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_editingCell = { row, col };
    document.getElementById('mazharEditPersonName').textContent = personName;
    document.getElementById('mazharEditYearValue').textContent = year;
    document.getElementById('mazharEditCellValue').value = currentValue;
    
    // إعادة تعيين الأزرار
    document.querySelectorAll('#mazharEditCellModal .option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('mazharEditCellModal').classList.add('show');
}

// ============================================
// إغلاق مودال تعديل الخانة لصفحة آل مزهر
// ============================================
function mazhar_closeEditCellModal() {
    document.getElementById('mazharEditCellModal').classList.remove('show');
    document.getElementById('mazharEditCellValue').value = '';
}

// ============================================
// تعيين قيمة الخانة من الأزرار لصفحة آل مزهر
// ============================================
function mazhar_setEditValue(value) {
    document.getElementById('mazharEditCellValue').value = value;
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('#mazharEditCellModal .option-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(value)) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// حفظ تعديل الخانة لصفحة آل مزهر
// ============================================
function mazhar_saveEditCell() {
    const value = document.getElementById('mazharEditCellValue').value.trim();
    
    if (!value) {
        mazhar_showNotification('الرجاء إدخال قيمة', 'warning');
        return;
    }
    
    mazhar_tableData[mazhar_editingCell.row][mazhar_editingCell.col + 1] = value;
    
    // حفظ في Google Sheet
    mazhar_updateCell(mazhar_editingCell.row, mazhar_editingCell.col + 1, value);
    
    mazhar_closeEditCellModal();
    mazhar_renderTable();
    mazhar_showNotification('تم تحديث البيانات ✓', 'success');
}

// ============================================
// فتح مودال تعديل الاسم لصفحة آل مزهر
// ============================================
function mazhar_openEditNameModal(row, currentName) {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_editingName = { row };
    document.getElementById('mazharEditNameValue').value = currentName;
    document.getElementById('mazharEditNameModal').classList.add('show');
    document.getElementById('mazharEditNameValue').focus();
}

// ============================================
// إغلاق مودال تعديل الاسم لصفحة آل مزهر
// ============================================
function mazhar_closeEditNameModal() {
    document.getElementById('mazharEditNameModal').classList.remove('show');
    document.getElementById('mazharEditNameValue').value = '';
}

// ============================================
// حفظ تعديل الاسم لصفحة آل مزهر
// ============================================
function mazhar_saveEditName() {
    const newName = document.getElementById('mazharEditNameValue').value.trim();
    
    if (!newName) {
        mazhar_showNotification('الرجاء إدخال اسم', 'warning');
        return;
    }
    
    mazhar_tableData[mazhar_editingName.row][0] = newName;
    mazhar_updateCell(mazhar_editingName.row, 0, newName);
    
    mazhar_closeEditNameModal();
    mazhar_renderTable();
    mazhar_showNotification('تم تحديث الاسم ✓', 'success');
}

// ============================================
// حذف صف الشخص لصفحة آل مزهر
// ============================================
function mazhar_deletePersonRow() {
    if (confirm('هل أنت متأكد من حذف هذا الشخص؟')) {
        mazhar_tableData.splice(mazhar_editingName.row, 1);
        mazhar_deletePerson(mazhar_editingName.row);
        mazhar_closeEditNameModal();
        mazhar_renderTable();
        mazhar_showNotification('تم حذف الشخص ✓', 'success');
    }
}

// ============================================
// فتح مودال تعديل السنة لصفحة آل مزهر
// ============================================
function mazhar_openEditYearHeaderModal(col, currentYear) {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_editingYear = { col };
    document.getElementById('mazharEditYearHeaderValue').value = currentYear;
    document.getElementById('mazharEditYearHeaderModal').classList.add('show');
    document.getElementById('mazharEditYearHeaderValue').focus();
}

// ============================================
// إغلاق مودال تعديل السنة لصفحة آل مزهر
// ============================================
function mazhar_closeEditYearHeaderModal() {
    document.getElementById('mazharEditYearHeaderModal').classList.remove('show');
    document.getElementById('mazharEditYearHeaderValue').value = '';
}

// ============================================
// حفظ تعديل السنة لصفحة آل مزهر
// ============================================
function mazhar_saveEditYearHeader() {
    const newYear = document.getElementById('mazharEditYearHeaderValue').value.trim();
    
    if (!newYear) {
        mazhar_showNotification('الرجاء إدخال السنة', 'warning');
        return;
    }
    
    mazhar_years[mazhar_editingYear.col] = newYear;
    mazhar_updateYear(mazhar_editingYear.col, newYear);
    
    mazhar_closeEditYearHeaderModal();
    mazhar_renderTable();
    mazhar_showNotification('تم تحديث السنة ✓', 'success');
}

// ============================================
// حذف عمود السنة لصفحة آل مزهر
// ============================================
function mazhar_deleteYearColumn() {
    if (confirm('هل أنت متأكد من حذف هذه السنة؟')) {
        mazhar_years.splice(mazhar_editingYear.col, 1);
        mazhar_tableData.forEach(row => {
            row.splice(mazhar_editingYear.col + 1, 1);
        });
        mazhar_deleteYear(mazhar_editingYear.col);
        mazhar_closeEditYearHeaderModal();
        mazhar_renderTable();
        mazhar_showNotification('تم حذف السنة ✓', 'success');
    }
}

// ============================================
// فتح مودال إضافة شخص لصفحة آل مزهر
// ============================================
function mazhar_openAddPersonModal() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    document.getElementById('mazharPersonName').value = '';
    document.getElementById('mazharAddPersonModal').classList.add('show');
    document.getElementById('mazharPersonName').focus();
}

// ============================================
// إغلاق مودال إضافة شخص لصفحة آل مزهر
// ============================================
function mazhar_closeAddPersonModal() {
    document.getElementById('mazharAddPersonModal').classList.remove('show');
    document.getElementById('mazharPersonName').value = '';
}

// ============================================
// إضافة شخص جديد لصفحة آل مزهر
// ============================================
function mazhar_addNewPerson() {
    const name = document.getElementById('mazharPersonName').value.trim();
    
    if (!name) {
        mazhar_showNotification('الرجاء إدخال اسم الشخص', 'warning');
        return;
    }
    
    // إنشاء صف جديد
    const newRow = [name];
    for (let i = 0; i < mazhar_years.length; i++) {
        newRow.push('-');
    }
    
    mazhar_tableData.push(newRow);
    mazhar_addPerson(name);
    
    mazhar_closeAddPersonModal();
    mazhar_renderTable();
    mazhar_showNotification('تم إضافة الشخص ✓', 'success');
}

// ============================================
// فتح مودال إضافة سنة لصفحة آل مزهر
// ============================================
function mazhar_openAddYearModal() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    document.getElementById('mazharYearInput').value = '';
    document.getElementById('mazharAddYearModal').classList.add('show');
    document.getElementById('mazharYearInput').focus();
}

// ============================================
// إغلاق مودال إضافة سنة لصفحة آل مزهر
// ============================================
function mazhar_closeAddYearModal() {
    document.getElementById('mazharAddYearModal').classList.remove('show');
    document.getElementById('mazharYearInput').value = '';
}

// ============================================
// إضافة سنة جديدة لصفحة آل مزهر
// ============================================
function mazhar_addNewYear() {
    const year = document.getElementById('mazharYearInput').value.trim();
    
    if (!year) {
        mazhar_showNotification('الرجاء إدخال السنة', 'warning');
        return;
    }
    
    if (mazhar_years.includes(year)) {
        mazhar_showNotification('هذه السنة موجودة بالفعل', 'warning');
        return;
    }
    
    mazhar_years.push(year);
    mazhar_tableData.forEach(row => {
        row.push('-');
    });
    
    mazhar_addYear(year);
    
    mazhar_closeAddYearModal();
    mazhar_renderTable();
    mazhar_showNotification('تم إضافة السنة ✓', 'success');
}

// ============================================
// البحث والفلترة لصفحة آل مزهر
// ============================================
function mazhar_filterTable() {
    const searchTerm = document.getElementById('mazharSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#mazharTableBody tr');
    
    rows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) {
            const name = nameCell.textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        }
    });
}

// ============================================
// حفظ البيانات لصفحة آل مزهر (وظيفة وهمية)
// ============================================
function mazhar_saveData() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_showNotification('جاري حفظ البيانات...', 'info');
    
    // البيانات محفوظة تلقائياً عند كل تعديل
    setTimeout(() => {
        mazhar_showNotification('تم حفظ البيانات بنجاح ✓', 'success');
    }, 500);
}

// ============================================
// تصدير إلى CSV لصفحة آل مزهر
// ============================================
function mazhar_exportToCSV() {
    let csv = 'الاسم,' + mazhar_years.join(',') + '\n';
    
    mazhar_tableData.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'family_mazhar_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mazhar_showNotification('تم تصدير البيانات ✓', 'success');
}

// ============================================
// عمليات Google Sheet لصفحة آل مزهر
// ============================================

function mazhar_updateCell(row, col, value) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateCell',
            row: row,
            col: col,
            value: value
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_addPerson(name) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addPerson',
            name: name,
            yearsCount: mazhar_years.length
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_deletePerson(row) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deletePerson',
            row: row
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_addYear(year) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addYear',
            year: year
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_deleteYear(col) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deleteYear',
            col: col
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_updateYear(col, newYear) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateYear',
            col: col,
            year: newYear
        })
    }).catch(error => console.error('خطأ:', error));
}

// ============================================
// إظهار الإشعارات لصفحة آل مزهر
// ============================================
function mazhar_showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('mazharNotification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// ============================================
// إغلاق المودالات عند الضغط خارجها لصفحة آل مزهر
// ============================================
window.addEventListener('click', function(event) {
    // إضافة مودالات آل مزهر
    const mazharModals = [
        'mazharAddPersonModal',
        'mazharAddYearModal',
        'mazharEditCellModal',
        'mazharEditNameModal',
        'mazharEditYearHeaderModal'
    ];
    
    mazharModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ============================================
// اختصارات لوحة المفاتيح لصفحة آل مزهر
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
        // نحدد دالة الحفظ بناءً على الصفحة النشطة
        if (document.getElementById('familyPageMazhar').classList.contains('active')) {
            mazhar_saveData();
        } else {
            // دالة حفظ وهمية للصفحات الأخرى
        }
    }
});

// =================================================================
// دوال صفحة آل مزهر (تعتمد على Google Apps Script)
// =================================================================

// ============================================
// متغيرات عامة لصفحة آل مزهر
// ============================================
let mazhar_tableData = [];
let mazhar_years = [];
let mazhar_editingCell = { row: null, col: null };
let mazhar_editingName = { row: null };
let mazhar_editingYear = { col: null };

// **ملاحظة: يجب تغيير هذه الروابط إلى الروابط الخاصة بك**
const MAZHAR_SHEET_ID = "1FleMs__EEeGaAxgdj7G2mPVFGa619F4kdf_o1jKlJIc"; 
const MAZHAR_WEB_APP_URL = "https://script.google.com/macros/s/AKfycby5T2udlC21ihzcAyYrKD_o_QNgeaM36P78HbBDfPtqyAD-UX066lcKaVIP6paNvjhYDg/exec"; 

// ============================================
// تطبيق صلاحيات المشرف لصفحة آل مزهر
// ============================================
function mazhar_applyAdminControls() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const adminControls = document.getElementById('mazharAdminControls');
    const addRowContainer = document.getElementById('mazharAddRowContainer');

    if (isLoggedIn) {
        adminControls.style.display = 'flex';
        addRowContainer.style.display = 'block';
        mazhar_showNotification('وضع المشرف مفعل. يمكنك التعديل الآن.', 'success', 3000);
    } else {
        adminControls.style.display = 'none';
        addRowContainer.style.display = 'none';
        mazhar_showNotification('وضع المشاهدة مفعل. للتعديل، يرجى تسجيل الدخول في الصفحة الرئيسية.', 'info', 5000);
    }
}

// ============================================
// تحميل البيانات من Google Sheet لصفحة آل مزهر
// ============================================
function mazhar_loadData() {
    mazhar_showNotification('جاري تحميل البيانات...', 'info');
    
    fetch(MAZHAR_WEB_APP_URL + '?action=getData')
        .then(response => response.json())
        .then(data => {
            mazhar_tableData = data.data || [];
            mazhar_years = data.years || [];
            mazhar_renderTable();
            mazhar_showNotification('تم تحميل البيانات بنجاح ✓', 'success');
        })
        .catch(error => {
            console.error('خطأ في تحميل بيانات آل مزهر:', error);
            mazhar_showNotification('خطأ في تحميل البيانات. تأكد من رابط Google Apps Script.', 'error');
        });
}

// ============================================
// رسم الجدول لصفحة آل مزهر
// ============================================
function mazhar_renderTable() {
    const yearsRow = document.getElementById('mazharYearsRow');
    const tableBody = document.getElementById('mazharTableBody');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // مسح الصفوف السابقة
    yearsRow.innerHTML = '<th colspan="2"></th>';
    tableBody.innerHTML = '';
    
    // إضافة السنوات في الصف الأول
    mazhar_years.forEach((year, index) => {
        const th = document.createElement('th');
        th.className = 'col-year';
        th.textContent = year;
        
        if (isLoggedIn) {
            th.onclick = () => mazhar_openEditYearHeaderModal(index, year);
            th.style.cursor = 'pointer';
            th.title = 'اضغط للتعديل أو الحذف';
        }
        
        yearsRow.appendChild(th);
    });
    
    // إضافة صفوف البيانات
    mazhar_tableData.forEach((row, rowIndex) => {
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
            tdName.onclick = () => mazhar_openEditNameModal(rowIndex, row[0]);
            tdName.style.cursor = 'pointer';
            tdName.title = 'اضغط للتعديل أو الحذف';
        }
        
        tr.appendChild(tdName);
        
        // خلايا البيانات
        for (let colIndex = 1; colIndex <= mazhar_years.length; colIndex++) {
            const td = document.createElement('td');
            const value = row[colIndex] || '-';
            
            const cell = document.createElement('div');
            cell.className = 'data-cell ' + mazhar_getCellClass(value);
            cell.textContent = value;
            
            if (isLoggedIn) {
                cell.onclick = () => mazhar_openEditCellModal(rowIndex, colIndex - 1, row[0], mazhar_years[colIndex - 1], value);
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
// تحديد فئة الخلية بناءً على القيمة لصفحة آل مزهر
// ============================================
function mazhar_getCellClass(value) {
    if (value === 'مشارك') return 'participant';
    if (value === 'X') return 'absent';
    if (value === '-') return 'empty';
    return 'custom';
}

// ============================================
// فتح مودال تعديل الخانة لصفحة آل مزهر
// ============================================
function mazhar_openEditCellModal(row, col, personName, year, currentValue) {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_editingCell = { row, col };
    document.getElementById('mazharEditPersonName').textContent = personName;
    document.getElementById('mazharEditYearValue').textContent = year;
    document.getElementById('mazharEditCellValue').value = currentValue;
    
    // إعادة تعيين الأزرار
    document.querySelectorAll('#mazharEditCellModal .option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('mazharEditCellModal').classList.add('show');
}

// ============================================
// إغلاق مودال تعديل الخانة لصفحة آل مزهر
// ============================================
function mazhar_closeEditCellModal() {
    document.getElementById('mazharEditCellModal').classList.remove('show');
    document.getElementById('mazharEditCellValue').value = '';
}

// ============================================
// تعيين قيمة الخانة من الأزرار لصفحة آل مزهر
// ============================================
function mazhar_setEditValue(value) {
    document.getElementById('mazharEditCellValue').value = value;
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('#mazharEditCellModal .option-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(value)) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// حفظ تعديل الخانة لصفحة آل مزهر
// ============================================
function mazhar_saveEditCell() {
    const value = document.getElementById('mazharEditCellValue').value.trim();
    
    if (!value) {
        mazhar_showNotification('الرجاء إدخال قيمة', 'warning');
        return;
    }
    
    mazhar_tableData[mazhar_editingCell.row][mazhar_editingCell.col + 1] = value;
    
    // حفظ في Google Sheet
    mazhar_updateCell(mazhar_editingCell.row, mazhar_editingCell.col + 1, value);
    
    mazhar_closeEditCellModal();
    mazhar_renderTable();
    mazhar_showNotification('تم تحديث البيانات ✓', 'success');
}

// ============================================
// فتح مودال تعديل الاسم لصفحة آل مزهر
// ============================================
function mazhar_openEditNameModal(row, currentName) {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_editingName = { row };
    document.getElementById('mazharEditNameValue').value = currentName;
    document.getElementById('mazharEditNameModal').classList.add('show');
    document.getElementById('mazharEditNameValue').focus();
}

// ============================================
// إغلاق مودال تعديل الاسم لصفحة آل مزهر
// ============================================
function mazhar_closeEditNameModal() {
    document.getElementById('mazharEditNameModal').classList.remove('show');
    document.getElementById('mazharEditNameValue').value = '';
}

// ============================================
// حفظ تعديل الاسم لصفحة آل مزهر
// ============================================
function mazhar_saveEditName() {
    const newName = document.getElementById('mazharEditNameValue').value.trim();
    
    if (!newName) {
        mazhar_showNotification('الرجاء إدخال اسم', 'warning');
        return;
    }
    
    mazhar_tableData[mazhar_editingName.row][0] = newName;
    mazhar_updateCell(mazhar_editingName.row, 0, newName);
    
    mazhar_closeEditNameModal();
    mazhar_renderTable();
    mazhar_showNotification('تم تحديث الاسم ✓', 'success');
}

// ============================================
// حذف صف الشخص لصفحة آل مزهر
// ============================================
function mazhar_deletePersonRow() {
    if (confirm('هل أنت متأكد من حذف هذا الشخص؟')) {
        mazhar_tableData.splice(mazhar_editingName.row, 1);
        mazhar_deletePerson(mazhar_editingName.row);
        mazhar_closeEditNameModal();
        mazhar_renderTable();
        mazhar_showNotification('تم حذف الشخص ✓', 'success');
    }
}

// ============================================
// فتح مودال تعديل السنة لصفحة آل مزهر
// ============================================
function mazhar_openEditYearHeaderModal(col, currentYear) {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_editingYear = { col };
    document.getElementById('mazharEditYearHeaderValue').value = currentYear;
    document.getElementById('mazharEditYearHeaderModal').classList.add('show');
    document.getElementById('mazharEditYearHeaderValue').focus();
}

// ============================================
// إغلاق مودال تعديل السنة لصفحة آل مزهر
// ============================================
function mazhar_closeEditYearHeaderModal() {
    document.getElementById('mazharEditYearHeaderModal').classList.remove('show');
    document.getElementById('mazharEditYearHeaderValue').value = '';
}

// ============================================
// حفظ تعديل السنة لصفحة آل مزهر
// ============================================
function mazhar_saveEditYearHeader() {
    const newYear = document.getElementById('mazharEditYearHeaderValue').value.trim();
    
    if (!newYear) {
        mazhar_showNotification('الرجاء إدخال السنة', 'warning');
        return;
    }
    
    mazhar_years[mazhar_editingYear.col] = newYear;
    mazhar_updateYear(mazhar_editingYear.col, newYear);
    
    mazhar_closeEditYearHeaderModal();
    mazhar_renderTable();
    mazhar_showNotification('تم تحديث السنة ✓', 'success');
}

// ============================================
// حذف عمود السنة لصفحة آل مزهر
// ============================================
function mazhar_deleteYearColumn() {
    if (confirm('هل أنت متأكد من حذف هذه السنة؟')) {
        mazhar_years.splice(mazhar_editingYear.col, 1);
        mazhar_tableData.forEach(row => {
            row.splice(mazhar_editingYear.col + 1, 1);
        });
        mazhar_deleteYear(mazhar_editingYear.col);
        mazhar_closeEditYearHeaderModal();
        mazhar_renderTable();
        mazhar_showNotification('تم حذف السنة ✓', 'success');
    }
}

// ============================================
// فتح مودال إضافة شخص لصفحة آل مزهر
// ============================================
function mazhar_openAddPersonModal() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    document.getElementById('mazharPersonName').value = '';
    document.getElementById('mazharAddPersonModal').classList.add('show');
    document.getElementById('mazharPersonName').focus();
}

// ============================================
// إغلاق مودال إضافة شخص لصفحة آل مزهر
// ============================================
function mazhar_closeAddPersonModal() {
    document.getElementById('mazharAddPersonModal').classList.remove('show');
    document.getElementById('mazharPersonName').value = '';
}

// ============================================
// إضافة شخص جديد لصفحة آل مزهر
// ============================================
function mazhar_addNewPerson() {
    const name = document.getElementById('mazharPersonName').value.trim();
    
    if (!name) {
        mazhar_showNotification('الرجاء إدخال اسم الشخص', 'warning');
        return;
    }
    
    // إنشاء صف جديد
    const newRow = [name];
    for (let i = 0; i < mazhar_years.length; i++) {
        newRow.push('-');
    }
    
    mazhar_tableData.push(newRow);
    mazhar_addPerson(name);
    
    mazhar_closeAddPersonModal();
    mazhar_renderTable();
    mazhar_showNotification('تم إضافة الشخص ✓', 'success');
}

// ============================================
// فتح مودال إضافة سنة لصفحة آل مزهر
// ============================================
function mazhar_openAddYearModal() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    document.getElementById('mazharYearInput').value = '';
    document.getElementById('mazharAddYearModal').classList.add('show');
    document.getElementById('mazharYearInput').focus();
}

// ============================================
// إغلاق مودال إضافة سنة لصفحة آل مزهر
// ============================================
function mazhar_closeAddYearModal() {
    document.getElementById('mazharAddYearModal').classList.remove('show');
    document.getElementById('mazharYearInput').value = '';
}

// ============================================
// إضافة سنة جديدة لصفحة آل مزهر
// ============================================
function mazhar_addNewYear() {
    const year = document.getElementById('mazharYearInput').value.trim();
    
    if (!year) {
        mazhar_showNotification('الرجاء إدخال السنة', 'warning');
        return;
    }
    
    if (mazhar_years.includes(year)) {
        mazhar_showNotification('هذه السنة موجودة بالفعل', 'warning');
        return;
    }
    
    mazhar_years.push(year);
    mazhar_tableData.forEach(row => {
        row.push('-');
    });
    
    mazhar_addYear(year);
    
    mazhar_closeAddYearModal();
    mazhar_renderTable();
    mazhar_showNotification('تم إضافة السنة ✓', 'success');
}

// ============================================
// البحث والفلترة لصفحة آل مزهر
// ============================================
function mazhar_filterTable() {
    const searchTerm = document.getElementById('mazharSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#mazharTableBody tr');
    
    rows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) {
            const name = nameCell.textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        }
    });
}

// ============================================
// حفظ البيانات لصفحة آل مزهر (وظيفة وهمية)
// ============================================
function mazhar_saveData() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    
    mazhar_showNotification('جاري حفظ البيانات...', 'info');
    
    // البيانات محفوظة تلقائياً عند كل تعديل
    setTimeout(() => {
        mazhar_showNotification('تم حفظ البيانات بنجاح ✓', 'success');
    }, 500);
}

// ============================================
// تصدير إلى CSV لصفحة آل مزهر
// ============================================
function mazhar_exportToCSV() {
    let csv = 'الاسم,' + mazhar_years.join(',') + '\n';
    
    mazhar_tableData.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'family_mazhar_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mazhar_showNotification('تم تصدير البيانات ✓', 'success');
}

// ============================================
// عمليات Google Sheet لصفحة آل مزهر
// ============================================

function mazhar_updateCell(row, col, value) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateCell',
            row: row,
            col: col,
            value: value
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_addPerson(name) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addPerson',
            name: name,
            yearsCount: mazhar_years.length
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_deletePerson(row) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deletePerson',
            row: row
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_addYear(year) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'addYear',
            year: year
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_deleteYear(col) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'deleteYear',
            col: col
        })
    }).catch(error => console.error('خطأ:', error));
}

function mazhar_updateYear(col, newYear) {
    fetch(MAZHAR_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'updateYear',
            col: col,
            year: newYear
        })
    }).catch(error => console.error('خطأ:', error));
}

// ============================================
// إظهار الإشعارات لصفحة آل مزهر
// ============================================
function mazhar_showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('mazharNotification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// ============================================
// إغلاق المودالات عند الضغط خارجها لصفحة آل مزهر
// ============================================
window.addEventListener('click', function(event) {
    // إضافة مودالات آل مزهر
    const mazharModals = [
        'mazharAddPersonModal',
        'mazharAddYearModal',
        'mazharEditCellModal',
        'mazharEditNameModal',
        'mazharEditYearHeaderModal'
    ];
    
    mazharModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ============================================
// اختصارات لوحة المفاتيح لصفحة آل مزهر
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
        // نحدد دالة الحفظ بناءً على الصفحة النشطة
        if (document.getElementById('familyPageMazhar').classList.contains('active')) {
            mazhar_saveData();
        } else {
            // دالة حفظ وهمية للصفحات الأخرى
        }
    }
});

function showAdminPanel() {
    showPage('adminPage');
    document.getElementById('adminNav').style.display = 'block';
    
    const username = localStorage.getItem('username') || 'المشرف';
    
    // إضافة بطاقات العائلات إلى لوحة الإدارة
    const adminContent = document.querySelector('#adminPage .admin-content');
    adminContent.innerHTML = `
        <p style="font-size: 1.2rem; font-weight: 600;">مرحباً بك يا ${username}! 👋</p>
        <p>أنت الآن في منطقة الإدارة. يمكنك التحكم الكامل في بيانات العائلات.</p>
        <p style="margin-top: 20px;">اختر العائلة التي تريد تعديل بياناتها:</p>
        <div class="families-grid" id="adminFamiliesGrid">
            <!-- سيتم ملء البطاقات هنا -->
        </div>
    `;
    
    const familiesGrid = document.getElementById('adminFamiliesGrid');
    const familyNames = Object.keys(familiesData);
    
    familyNames.forEach(familyName => {
        // تحديد لون عشوائي للبطاقة
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const card = document.createElement('div');
        card.className = 'family-card';
        card.style.background = `linear-gradient(135deg, ${randomColor}, #1e293b)`;
        card.innerHTML = `
            <div class="family-card-icon" style="background: ${randomColor};">
                <i class="fas fa-users" style="color: white;"></i>
            </div>
            <h4>${familyName}</h4>
            <p>إدارة وتعديل بيانات عائلة ${familyName}</p>
            <button class="btn-primary" onclick="showFamily('${familyName}', true)">
                <i class="fas fa-cogs"></i> تحكم كامل
            </button>
        `;
        familiesGrid.appendChild(card);
    });
}

function showFamiliesAdmin() {
    alert('صفحة إدارة العائلات قريباً...');
}

// ============================================
// 5. التحقق من حالة تسجيل الدخول
// ============================================

async function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const loginButton = document.getElementById('loginButton');
    
    if (!token) {
        localStorage.setItem('isLoggedIn', 'false');
        updateHeaderLoginButton();
        return;
    }
    
    try {
        // التحقق من التوكن عبر Serverless Function
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            // التوكن صالح
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', data.username);
            updateHeaderLoginButton(data.username);
            
            // إذا كان المستخدم في صفحة الإدارة، أعد تحميلها
            if (document.getElementById('adminPage').classList.contains('active')) {
                showAdminPanel();
            }
            
        } else {
            // التوكن غير صالح أو منتهي الصلاحية
            handleLogout();
        }
    } catch (error) {
        console.error('خطأ في التحقق من التوكن:', error);
        handleLogout();
    }
}

function updateHeaderLoginButton(username = null) {
    const loginButton = document.getElementById('loginButton');
    
    if (username) {
        // المستخدم مسجل الدخول
        loginButton.innerHTML = `<i class="fas fa-user-circle"></i> ${username}`;
        loginButton.onclick = showAdminPanel;
        loginButton.classList.add('glow');
        loginButton.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
        // المستخدم غير مسجل الدخول
        loginButton.innerHTML = '<i class="fas fa-lock"></i> <span>تسجيل الدخول</span>';
        loginButton.onclick = openLoginModal;
        loginButton.classList.remove('glow');
        loginButton.style.background = ''; // العودة للخلفية الافتراضية في CSS
    }
}

// ============================================
// 6. تهيئة الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
    checkLoginStatus();
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    const modal = document.getElementById('loginModal');
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeLoginModal();
        }
    });
});
