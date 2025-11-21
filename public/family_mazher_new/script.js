// ============================================
// متغيرات عامة
// ============================================
let tableData = []; // [ [Name, Status_Y1, Note_Y1, Status_Y2, Note_Y2, ...], ... ]
let years = [];
let editingCell = { row: null, col: null }; // col here is the year index (0, 1, 2, ...)
let editingName = { row: null };
let editingYear = { col: null };

let SHEET_NAME = ""; // سيتم تعيينه من URL
let FAMILY_NAME = ""; // سيتم تعيينه من URL

// ============================================
// دوال مساعدة
// ============================================

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    SHEET_NAME = params.get('sheetName') || "";
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
    if (!SHEET_NAME) {
        alert('خطأ: لم يتم تحديد اسم ورقة العمل (Sheet Name). سيتم توجيهك للصفحة الرئيسية.');
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
// تحميل البيانات من Google Sheet باستخدام google.script.run
// ============================================
function loadData() {
    showNotification('جاري تحميل البيانات...', 'info');
    
    google.script.run
        .withSuccessHandler(function(data) {
            if (data.success) {
                tableData = data.data || [];
                years = data.years || [];
                renderTable();
                showNotification('تم تحميل البيانات بنجاح ✓', 'success');
            } else {
                showNotification(`خطأ في تحميل البيانات: ${data.error || 'فشل غير معروف'}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`خطأ في تحميل البيانات: فشل الاتصال بالخادم.`, 'error');
        })
        .getData(SHEET_NAME);
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
    
    // تحديث الواجهة
    renderTable();
    closeEditCellModal();
    
    // إرسال التحديث إلى Google Sheet
    showNotification('جاري حفظ التعديلات...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                showNotification('تم حفظ التعديلات بنجاح ✓', 'success');
            } else {
                showNotification(`فشل حفظ التعديلات: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل حفظ التعديلات: خطأ في الاتصال بالخادم.`, 'error');
        })
        .updateCell(SHEET_NAME, editingCell.row, statusColIndex + 1, status, noteColIndex + 1, note); // +1 لتحويلها إلى 1-indexed
}

// ============================================
// إضافة شخص جديد
// ============================================
function handleAddPerson() {
    if (!checkAdminStatus()) return;
    
    const personName = document.getElementById('newPersonName').value.trim();
    if (!personName) {
        showNotification('الرجاء إدخال اسم الشخص', 'warning');
        return;
    }
    
    showNotification('جاري إضافة الشخص...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                document.getElementById('newPersonName').value = '';
                loadData(); // إعادة تحميل البيانات لتحديث الجدول
                showNotification('تم إضافة الشخص بنجاح ✓', 'success');
            } else {
                showNotification(`فشل إضافة الشخص: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل إضافة الشخص: خطأ في الاتصال بالخادم.`, 'error');
        })
        .addPerson(SHEET_NAME, personName);
}

// ============================================
// فتح مودال تعديل الاسم
// ============================================
function openEditNameModal(row, currentName) {
    if (!checkAdminStatus()) return;
    
    editingName = { row };
    document.getElementById('editNameInput').value = currentName;
    document.getElementById('editNameModal').classList.add('show');
}

// ============================================
// إغلاق مودال تعديل الاسم
// ============================================
function closeEditNameModal() {
    document.getElementById('editNameModal').classList.remove('show');
}

// ============================================
// حفظ تعديل الاسم
// ============================================
function saveEditName() {
    const newName = document.getElementById('editNameInput').value.trim();
    if (!newName) {
        showNotification('الرجاء إدخال اسم جديد', 'warning');
        return;
    }
    
    showNotification('جاري حفظ الاسم الجديد...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                tableData[editingName.row][0] = newName;
                renderTable();
                closeEditNameModal();
                showNotification('تم تحديث الاسم بنجاح ✓', 'success');
            } else {
                showNotification(`فشل تحديث الاسم: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل تحديث الاسم: خطأ في الاتصال بالخادم.`, 'error');
        })
        .updateName(SHEET_NAME, editingName.row, newName);
}

// ============================================
// حذف شخص
// ============================================
function deletePersonHandler() {
    if (!confirm(`هل أنت متأكد من حذف ${tableData[editingName.row][0]}؟`)) return;
    
    showNotification('جاري حذف الشخص...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                loadData(); // إعادة تحميل البيانات لتحديث الجدول
                closeEditNameModal();
                showNotification('تم حذف الشخص بنجاح ✓', 'success');
            } else {
                showNotification(`فشل حذف الشخص: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل حذف الشخص: خطأ في الاتصال بالخادم.`, 'error');
        })
        .deletePerson(SHEET_NAME, editingName.row);
}

// ============================================
// فتح مودال تعديل رأس السنة
// ============================================
function openEditYearHeaderModal(col, currentYear) {
    if (!checkAdminStatus()) return;
    
    editingYear = { col };
    document.getElementById('editYearInput').value = currentYear;
    document.getElementById('editYearModal').classList.add('show');
}

// ============================================
// إغلاق مودال تعديل رأس السنة
// ============================================
function closeEditYearModal() {
    document.getElementById('editYearModal').classList.remove('show');
}

// ============================================
// حفظ تعديل رأس السنة
// ============================================
function saveEditYear() {
    const newYear = document.getElementById('editYearInput').value.trim();
    if (!newYear) {
        showNotification('الرجاء إدخال سنة جديدة', 'warning');
        return;
    }
    
    showNotification('جاري حفظ السنة الجديدة...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                years[editingYear.col] = newYear;
                renderTable();
                closeEditYearModal();
                showNotification('تم تحديث السنة بنجاح ✓', 'success');
            } else {
                showNotification(`فشل تحديث السنة: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل تحديث السنة: خطأ في الاتصال بالخادم.`, 'error');
        })
        .updateYear(SHEET_NAME, editingYear.col, newYear);
}

// ============================================
// حذف سنة
// ============================================
function deleteYearHandler() {
    if (!confirm(`هل أنت متأكد من حذف سنة ${years[editingYear.col]}؟ سيتم حذف عمودي الحالة والملاحظة المرتبطين بها.`)) return;
    
    showNotification('جاري حذف السنة...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                loadData(); // إعادة تحميل البيانات لتحديث الجدول
                closeEditYearModal();
                showNotification('تم حذف السنة بنجاح ✓', 'success');
            } else {
                showNotification(`فشل حذف السنة: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل حذف السنة: خطأ في الاتصال بالخادم.`, 'error');
        })
        .deleteYear(SHEET_NAME, editingYear.col);
}

// ============================================
// إضافة سنة جديدة من رأس الصفحة
// ============================================
function handleAddYear() {
    if (!checkAdminStatus()) return;
    
    const newYear = prompt('الرجاء إدخال السنة الجديدة (مثال: 1445):');
    if (!newYear || newYear.trim() === '') {
        return;
    }
    
    showNotification('جاري إضافة السنة...', 'info');
    
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                loadData(); // إعادة تحميل البيانات لتحديث الجدول
                showNotification('تم إضافة السنة بنجاح ✓', 'success');
            } else {
                showNotification(`فشل إضافة السنة: ${response.message}`, 'error');
            }
        })
        .withFailureHandler(function(error) {
            console.error('خطأ في الاتصال بـ Apps Script:', error);
            showNotification(`فشل إضافة السنة: خطأ في الاتصال بالخادم.`, 'error');
        })
        .addYear(SHEET_NAME, newYear);
}

// ============================================
// دالة عرض الإشعارات
// ============================================
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// ============================================
// دالة حفظ البيانات (غير مستخدمة حالياً ولكن يمكن استخدامها لحفظ كل شيء دفعة واحدة)
// ============================================
function saveData() {
    showNotification('وظيفة حفظ البيانات غير مفعلة حالياً. يتم الحفظ تلقائياً عند التعديل.', 'info');
}
