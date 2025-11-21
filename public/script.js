// ============================================
// مدير بيانات العائلات - JavaScript
// ============================================

// --- المتغيرات العامة ---
const themeToggle = document.getElementById('themeToggle');
// تمت إزالة FAMILY_INDEX_WEB_APP_URL لأنه سيتم استخدام google.script.run
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
    const familyData = familiesIndexData[familyName];
    if (!familyData || !familyData.SheetID) {
        alert('لم يتم العثور على اسم ورقة العمل لهذه العائلة.');
        return;
    }

    // التوجيه إلى صفحة العائلة مع تمرير SheetName واسم العائلة في URL
    const url = `family_mazher_new/index.html?sheetName=${familyData.SheetID}&familyName=${encodeURIComponent(familyName)}`;
    window.location.href = url;
}

// تحميل وعرض فهرس العائلات باستخدام google.script.run
function loadFamiliesIndex(isAdminMode = false) {
    const gridId = isAdminMode ? 'adminFamiliesGrid' : 'familiesGrid';
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '<p style="text-align: center;">جاري تحميل قائمة العائلات...</p>';

    google.script.run
        .withSuccessHandler(function(data) {
            if (data.success) {
                familiesIndexData = data.families;
                updateFamiliesUI(isAdminMode);
            } else {
                throw new Error(data.error || 'فشل تحميل البيانات.');
            }
        })
        .withFailureHandler(function(error) {
            console.error('Error loading families index:', error);
            grid.innerHTML = `<p style="color: red; text-align: center;">خطأ في تحميل البيانات: ${error}</p>`;
        })
        .getFamilies();
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

// دالة تسجيل الدخول تستخدم Fetch API لأنها تتصل بـ /api/auth
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
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
// 5. إدارة نافذة إضافة/تعديل/حذف العائلة
// ============================================

function openDeleteFamilyModal() {
    const familyName = prompt("أدخل اسم العائلة التي تريد حذفها بالضبط:");
    if (familyName) {
        if (confirm(`هل أنت متأكد من حذف عائلة "${familyName}"؟ سيتم حذف ورقة العمل الخاصة بها.`)) {
            deleteFamily(familyName);
        }
    }
}

// حذف عائلة باستخدام google.script.run
function deleteFamily(familyName) {
    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                alert(response.message);
                loadFamiliesIndex(true); // Refresh the admin list
            } else {
                alert(`فشل حذف العائلة: ${response.message}`);
            }
        })
        .withFailureHandler(function(error) {
            console.error('Error submitting delete family data:', error);
            alert('حدث خطأ أثناء إرسال طلب الحذف.');
        })
        .deleteFamily({ familyName: familyName });
}

function openFamilyModal(mode, familyName = null) {
    const modal = document.getElementById('familyModal');
    const form = document.getElementById('familyForm');
    const modalTitle = document.getElementById('familyModalTitle');
    
    form.reset();
    form.dataset.mode = mode;
    form.dataset.oldFamilyName = familyName || '';

    // إخفاء حقل SheetID لأنه لم يعد مستخدماً في الواجهة الأمامية
    document.getElementById('familySheetIdGroup').style.display = 'none';

    if (mode === 'edit' && familyName && familiesIndexData[familyName]) {
        modalTitle.textContent = 'تعديل بيانات العائلة';
        const family = familiesIndexData[familyName];
        document.getElementById('familyName').value = family.FamilyName;
        document.getElementById('familyDescription').value = family.Description;
        document.getElementById('familyIcon').value = family.Icon;
    } else {
        modalTitle.textContent = 'إضافة عائلة جديدة';
    }

    modal.style.display = 'block';
}

function closeFamilyModal() {
    document.getElementById('familyModal').style.display = 'none';
}

// إضافة/تعديل عائلة باستخدام google.script.run
function handleFamilySubmit(event) {
    event.preventDefault();
    const form = event.target;
    const mode = form.dataset.mode;
    const oldFamilyName = form.dataset.oldFamilyName;

    const familyData = {
        action: mode === 'edit' ? 'editFamily' : 'addFamily',
        familyName: document.getElementById('familyName').value,
        description: document.getElementById('familyDescription').value,
        icon: document.getElementById('familyIcon').value,
        oldFamilyName: oldFamilyName
    };

    const scriptFunction = mode === 'edit' ? 'editFamily' : 'addFamily';

    google.script.run
        .withSuccessHandler(function(response) {
            if (response.success) {
                alert(response.message);
                closeFamilyModal();
                loadFamiliesIndex(true); // Refresh the admin list
            } else {
                alert(`فشل العملية: ${response.message}`);
            }
        })
        .withFailureHandler(function(error) {
            console.error('Error submitting family data:', error);
            alert('حدث خطأ أثناء إرسال البيانات.');
        })
        [scriptFunction](familyData);
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
