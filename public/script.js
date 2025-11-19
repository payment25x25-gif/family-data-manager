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
