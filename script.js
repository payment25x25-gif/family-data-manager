// ============================================
// مدير بيانات العائلات - JavaScript
// Family Data Manager - Script
// ============================================

// ============================================
// 1. إدارة الأوضاع (Dark/Light Mode)
// ============================================

const themeToggle = document.getElementById('themeToggle');

// تحميل الوضع المحفوظ
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

// تبديل الوضع
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
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
    // التعديل: إذا كانت العائلة "آل مزهر"، يتم التوجيه إلى index2/index.html
    if (familyName === 'آل مزهر') {
        // تمرير حالة المشرف إلى الصفحة الأخرى
        const adminStatus = isAdminMode ? '?admin=true' : '';
        window.location.href = `index2/index.html${adminStatus}`;
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
    familyHeader.querySelector('#familyTitle').textContent = familyName;
    
    // تحديد ما إذا كان وضع التعديل مفعلاً
    const isEditable = isAdminMode || (localStorage.getItem('isLoggedIn') === 'true' && familyName !== 'آل مزهر');
    
    // إضافة زر التعديل للمشرفين
    let editButton = familyHeader.querySelector('#editFamilyData');
    if (!editButton) {
        editButton = document.createElement('button');
        editButton.id = 'editFamilyData';
        editButton.className = 'btn-primary';
        editButton.textContent = '✏️ تعديل البيانات';
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
                        <button class="btn-edit" onclick="editRow(${index})">تعديل</button>
                        <button class="btn-delete" onclick="deleteRow(${index})">حذف</button>
                    </td>`;
        }
        
        html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    
    container.innerHTML = html;
}

// ============================================
// 4. إدارة تسجيل الدخول (النافذة المنبثقة - Modal)
// ============================================

// تعريف دالة لفتح النافذة المنبثقة
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

// تعريف دالة لإغلاق النافذة المنبثقة
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginError').classList.remove('show');
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // بيانات المشرف
    const adminCredentials = { username: 'admin', password: 'admin123' };
    
    // التحقق من البيانات
    if (username === adminCredentials.username && password === adminCredentials.password) {
        // حفظ حالة تسجيل الدخول
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        
        // إغلاق النافذة المنبثقة
        closeLoginModal();
        
        // إظهار لوحة الإدارة
        showAdminPanel();
        
        // إخفاء رسالة الخطأ
        errorDiv.classList.remove('show');
    } else {
        // عرض رسالة خطأ
        errorDiv.textContent = 'بيانات الدخول غير صحيحة!';
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').classList.remove('show');
    showPage('homePage');
    document.getElementById('adminNav').style.display = 'none'; // إخفاء شريط الإدارة
    
    // إخفاء زر التعديل عند تسجيل الخروج
    const editButton = document.querySelector('#familyPage .family-header #editFamilyData');
    if (editButton) {
        editButton.style.display = 'none';
    }
}

function showAdminPanel() {
    showPage('adminPage');
    document.getElementById('adminNav').style.display = 'block';
    
    // إضافة بطاقات العائلات إلى لوحة الإدارة
    const adminContent = document.querySelector('#adminPage .admin-content');
    adminContent.innerHTML = `
        <p>مرحباً بك في لوحة الإدارة! 👋</p>
        <p>اختر العائلة التي تريد تعديل بياناتها:</p>
        <div class="families-grid" id="adminFamiliesGrid">
            <!-- سيتم ملء البطاقات هنا -->
        </div>
    `;
    
    const familiesGrid = document.getElementById('adminFamiliesGrid');
    const familyNames = Object.keys(familiesData);
    
    familyNames.forEach(familyName => {
        // تحديد لون عشوائي للبطاقة
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const card = document.createElement('div');
        card.className = 'family-card';
        card.style.background = `linear-gradient(135deg, ${randomColor}, #1f2937)`;
        card.innerHTML = `
            <h4>${familyName}</h4>
            <p>إدارة وتعديل بيانات عائلة ${familyName}</p>
            <button class="btn-primary" onclick="showFamily('${familyName}', true)">تحكم كامل</button>
        `;
        familiesGrid.appendChild(card);
    });
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

function showFamiliesAdmin() {
    alert('صفحة إدارة العائلات قريباً...');
}

// ============================================
// 5. التحقق من حالة تسجيل الدخول
// ============================================

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
    }
    
    // إظهار زر التعديل إذا كان المشرف مسجلاً دخوله وكان في صفحة العائلة
    const editButton = document.querySelector('#familyPage .family-header #editFamilyData');
    if (editButton) {
        editButton.style.display = isLoggedIn ? 'block' : 'none';
    }
}

// ============================================
// 6. تهيئة الصفحة
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من حالة تسجيل الدخول
    checkLoginStatus();
    
    // إضافة مستمعين للأزرار
    // إزالة المستمع القديم واستبداله بفتح النافذة المنبثقة
    const loginButtons = document.querySelectorAll('[onclick*="showPage(\'loginPage\')"]');
    loginButtons.forEach(btn => {
        btn.onclick = openLoginModal;
    });
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    const modal = document.getElementById('loginModal');
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeLoginModal();
        }
    });
});

// ============================================
// 7. دوال مساعدة
// ============================================

// البحث في البيانات
function searchInTable(searchTerm) {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// تصدير البيانات إلى CSV
function exportToCSV(familyName) {
    const data = familiesData[familyName];
    if (!data) return;
    
    const columns = Object.keys(data[0]);
    let csv = columns.join(',') + '\n';
    
    data.forEach(row => {
        const values = columns.map(col => {
            const value = row[col] || '';
            return `"${value}"`;
        });
        csv += values.join(',') + '\n';
    });
    
    // تحميل الملف
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${familyName}.csv`;
    a.click();
}

// ============================================
// 8. إضافة زر تسجيل الدخول للـ Header
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // إضافة زر تسجيل الدخول
    const header = document.querySelector('.header-content');
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn-primary';
    loginBtn.textContent = '🔐 تسجيل الدخول';
    loginBtn.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.9rem; width: auto;';
    loginBtn.onclick = openLoginModal; // <--- تم التعديل هنا
    
    // إدراج الزر قبل زر تبديل الوضع
    header.insertBefore(loginBtn, themeToggle);
});
