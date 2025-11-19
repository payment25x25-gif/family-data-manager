// ============================================
// Vercel Serverless Function - Authentication
// دالة المصادقة - تعمل على سيرفر Vercel
// ============================================

// استيراد crypto لتشفير كلمات المرور
const crypto = require('crypto');

// دالة لتشفير كلمة المرور باستخدام SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// دالة للتحقق من صحة JWT Token بسيط
function generateToken(username) {
    const timestamp = Date.now();
    const data = `${username}:${timestamp}:${process.env.JWT_SECRET}`;
    return Buffer.from(data).toString('base64');
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        
        if (parts.length !== 3) return null;
        
        const [username, timestamp, secret] = parts;
        
        // التحقق من السر
        if (secret !== process.env.JWT_SECRET) return null;
        
        // التحقق من صلاحية التوكن (7 أيام)
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 7 * 24 * 60 * 60 * 1000) return null;
        
        return { username, timestamp };
    } catch (error) {
        return null;
    }
}

// الدالة الرئيسية التي يستدعيها Vercel
module.exports = async (req, res) => {
    // تفعيل CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // معالجة طلبات OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // معالجة طلب تسجيل الدخول
    if (req.method === 'POST' && req.url === '/api/auth') {
        try {
            const { username, password, action } = req.body;
            
            // التحقق من وجود البيانات المطلوبة
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'اسم المستخدم وكلمة المرور مطلوبان'
                });
            }
            
            // الحصول على قائمة المشرفين من متغيرات البيئة
            // الصيغة: ADMIN_USERS=admin:hash1,manager:hash2,supervisor:hash3
            const adminUsersEnv = process.env.ADMIN_USERS || '';
            const adminUsers = {};
            
            if (adminUsersEnv) {
                adminUsersEnv.split(',').forEach(entry => {
                    const [user, passHash] = entry.split(':');
                    if (user && passHash) {
                        adminUsers[user.trim()] = passHash.trim();
                    }
                });
            }
            
            // إذا لم يكن هناك مشرفين، استخدم القيم الافتراضية (للتطوير فقط)
            if (Object.keys(adminUsers).length === 0) {
                // admin:admin123 (مشفر)
                adminUsers['admin'] = hashPassword('admin123');
            }
            
            // التحقق من بيانات الدخول
            const hashedPassword = hashPassword(password);
            
            if (adminUsers[username] && adminUsers[username] === hashedPassword) {
                // تسجيل الدخول ناجح
                const token = generateToken(username);
                
                return res.status(200).json({
                    success: true,
                    message: 'تم تسجيل الدخول بنجاح',
                    token: token,
                    username: username
                });
            } else {
                // بيانات خاطئة
                return res.status(401).json({
                    success: false,
                    message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
                });
            }
        } catch (error) {
            console.error('خطأ في المصادقة:', error);
            return res.status(500).json({
                success: false,
                message: 'حدث خطأ في الخادم'
            });
        }
    }
    
    // معالجة طلب التحقق من التوكن
    if (req.method === 'GET' && req.url === '/api/auth/verify') {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'لم يتم توفير رمز المصادقة'
                });
            }
            
            const token = authHeader.substring(7);
            const verified = verifyToken(token);
            
            if (verified) {
                return res.status(200).json({
                    success: true,
                    username: verified.username
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
                });
            }
        } catch (error) {
            console.error('خطأ في التحقق:', error);
            return res.status(500).json({
                success: false,
                message: 'حدث خطأ في الخادم'
            });
        }
    }
    
    // طلب غير مدعوم
    return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
    });
};
