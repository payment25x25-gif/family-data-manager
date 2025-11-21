// ============================================
// مدير بيانات العائلات - JavaScript
// ============================================

// --- المتغيرات العامة ---
const themeToggle = document.getElementById('themeToggle');
const FAMILY_INDEX_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw8pgbJnIaNbbmNFxQK4C2cqFYuTLYOhH56lNzOsaQ2QdgddGMoeS2SUszRcCpk9wl1/exec";
let familiesIndexData = {}; // لتخزين بيانات فهرس العائلات

// ============================================
// 1. إدارة الأوضاع (Dark/Light Mode)
// ============================================
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    themeToggle.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
});

// ============================================
// 2. إدارة التنقل بين الصفحات
// ============================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    window.scrollTo(0, 0);
}

function goHome() {
    showPage('homePage');
}

// ============================================
// 3. عرض الصفحات وإدارة البيانات
// ============================================

// عرض صفحة عائلة محددة
function showFamily(familyName) {
    // const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // تم إزالة التعريف المكرر
    const familyData = familiesIndexData[familyName];
    if (!familyData || !familyData.SheetID) {
        alert('لم يتم العثور على معرف جدول البيانات لهذه العائلة.');
        return;
    }

    // هنا يمكنك بناء صفحة العائلة ديناميكياً أو الانتقال إلى صفحة مخصصة
    // في هذا المثال، سنقوم فقط بعرض رسالة
    alert(`جاري عرض بيانات عائلة: ${familyName}\nSheet ID: ${familyData.SheetID}`);
    
    // مثال على كيفية استدعاء دالة لجلب بيانات العائلة المحددة
    // loadSpecificFamilyData(familyData.SheetID);
}

// تحميل وعرض فهرس العائلات
function loadFamiliesIndex(isAdminMode = false) {
    const gridId = isAdminMode ? 'adminFamiliesGrid' : 'familiesGrid';
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '<p style="text-align: center;">جاري تحميل قائمة العائلات...</p>';

    fetch(`${FAMILY_INDEX_WEB_APP_URL}?action=getFamilies`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                familiesIndexData = data.families;
                updateFamiliesUI(isAdminMode);
            } else {
                throw new Error(data.error || 'فشل تحميل البيانات.');
            }
        })
        .catch(error => {
            console.error('Error loading families index:', error);
            grid.innerHTML = `<p style="color: red; text-align: center;">${error.message}</p>`;
        });
}

// تحديث واجهة المستخدم ببطاقات العائلات
function updateFamiliesUI(isAdminMode) {
    const gridId = isAdminMode ? 'adminFamiliesGrid' : 'familiesGrid';
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '';
    const familyNames = Object.keys(familiesIndexData);

    if (familyNames.length === 0) {
        grid.innerHTML = '<p style="text-align: center;">لم يتم العثور على عائلات.</p>';
        return;
    }

    familyNames.forEach(familyName => {
        const familyInfo = familiesIndexData[familyName];
        const card = document.createElement('div');
        card.className = 'family-card';
        
        let buttonHTML;
        if (isAdminMode) {
            buttonHTML = `
                <button class="btn-primary" onclick="showFamily('${familyName}')"><i class="fas fa-cogs"></i> تحكم كامل</button>
                <button class="btn-secondary" onclick="openFamilyModal('edit', '${familyName}')"><i class="fas fa-edit"></i> تعديل</button>
            `;
        } else {
            buttonHTML = `<button class="btn-primary" onclick="showFamily('${familyName}')"><i class="fas fa-eye"></i> عرض البيانات</button>`;
        }

        card.innerHTML = `
            <div class="card-icon"><i class="${familyInfo.Icon || 'fas fa-users'}"></i></div>
            <h3>${familyName}</h3>
            <p>${familyInfo.Description || ''}</p>
            <div class="card-buttons">${buttonHTML}</div>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// 4. إدارة المصادقة وتسجيل الدخول
// ============================================

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            localStorage.setItem('isLoggedIn', 'true');
            updateLoginState();
            closeLoginModal();
        } else {
            throw new Error(result.message || 'كلمة المرور غير صحيحة');
        }
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    updateLoginState();
}

function updateLoginState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const adminPanel = document.getElementById('adminPanel');
    const userPanel = document.getElementById('userPanel');

    if (isLoggedIn) {
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        adminPanel.style.display = 'block';
        userPanel.style.display = 'none';
        loadFamiliesIndex(true); // تحميل بيانات المشرف
    } else {
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        adminPanel.style.display = 'none';
        userPanel.style.display = 'block';
        loadFamiliesIndex(false); // تحميل بيانات المستخدم العادي
    }
}

// ============================================
// 5. إدارة نافذة إضافة/تعديل العائلة
// ============================================

function openDeleteFamilyModal() {
    const familyName = prompt("أدخل اسم العائلة التي تريد حذفها بالضبط:");
    if (familyName) {
        if (confirm(`هل أنت متأكد من حذف عائلة "${familyName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            deleteFamily(familyName);
        }
    }
}

async function deleteFamily(familyName) {
    const familyData = {
        action: 'deleteFamily',
        familyName: familyName
    };

    try {
        const response = await fetch(FAMILY_INDEX_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(familyData)
        });

        alert(`تم إرسال طلب حذف عائلة "${familyName}".`);
        loadFamiliesIndex(true); // Refresh the admin list

    } catch (error) {
        console.error('Error submitting delete family data:', error);
        alert('حدث خطأ أثناء إرسال طلب الحذف.');
    }
}

// ============================================
// ============================================

function openFamilyModal(mode, familyName = null) {
    const modal = document.getElementById('familyModal');
    const form = document.getElementById('familyForm');
    const modalTitle = document.getElementById('familyModalTitle');
    
    form.reset();
    form.dataset.mode = mode;
    form.dataset.oldFamilyName = familyName || '';

    if (mode === 'edit' && familyName && familiesIndexData[familyName]) {
        modalTitle.textContent = 'تعديل بيانات العائلة';
        const family = familiesIndexData[familyName];
        document.getElementById('familyName').value = family.FamilyName;
        document.getElementById('familyDescription').value = family.Description;
        document.getElementById('familySheetId').value = family.SheetID;
        document.getElementById('familyIcon').value = family.Icon;
    } else {
        modalTitle.textContent = 'إضافة عائلة جديدة';
    }

    modal.style.display = 'block';
}

function closeFamilyModal() {
    document.getElementById('familyModal').style.display = 'none';
}

async function handleFamilySubmit(event) {
    event.preventDefault();
    const form = event.target;
    const mode = form.dataset.mode;
    const oldFamilyName = form.dataset.oldFamilyName;

    const familyData = {
        action: mode === 'edit' ? 'editFamily' : 'addFamily',
        familyName: document.getElementById('familyName').value,
        description: document.getElementById('familyDescription').value,
        sheetId: document.getElementById('familySheetId').value,
        icon: document.getElementById('familyIcon').value,
        oldFamilyName: oldFamilyName
    };

    try {
        const response = await fetch(FAMILY_INDEX_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', // Required for cross-origin requests
            body: JSON.stringify(familyData)
        });

        // Note: Apps Script web apps often return a redirect, so we can't always parse JSON.
        // We will reload the families list regardless of the direct response.
        alert(mode === 'edit' ? 'تم إرسال طلب التعديل بنجاح.' : 'تم إرسال طلب الإضافة بنجاح.');
        closeFamilyModal();
        loadFamiliesIndex(true); // Refresh the admin list

    } catch (error) {
        console.error('Error submitting family data:', error);
        alert('حدث خطأ أثناء إرسال البيانات.');
    }
}

// ============================================
// 6. التشغيل عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    updateLoginState();

    // ربط الأحداث
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('familyForm').addEventListener('submit', handleFamilySubmit);
    
    // إغلاق النوافذ المنبثقة
    window.onclick = function(event) {
        const loginModal = document.getElementById('loginModal');
        const familyModal = document.getElementById('familyModal');
        if (event.target == loginModal) {
            closeLoginModal();
        }
        if (event.target == familyModal) {
            closeFamilyModal();
        }
    }
});
