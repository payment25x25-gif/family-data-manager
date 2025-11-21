#!/usr/bin/env node
// ============================================
// أداة توليد Hash لكلمات المرور
// Password Hash Generator Tool
// ============================================

const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// الحصول على كلمة المرور من المعاملات
const password = process.argv[2];

if (!password) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         أداة توليد Hash لكلمات المرور                    ║');
    console.log('║         Password Hash Generator Tool                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('الاستخدام / Usage:');
    console.log('  node generate-password-hash.js <password>');
    console.log('');
    console.log('مثال / Example:');
    console.log('  node generate-password-hash.js admin123');
    console.log('');
    process.exit(1);
}

const hash = hashPassword(password);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              نتيجة التشفير / Hash Result                  ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('كلمة المرور / Password:');
console.log(`  ${password}`);
console.log('');
console.log('الـ Hash المشفر / Hashed Password:');
console.log(`  ${hash}`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('لإضافة مشرف جديد في Vercel:');
console.log('To add a new admin in Vercel:');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('1. افتح إعدادات المشروع في Vercel');
console.log('   Open project settings in Vercel');
console.log('');
console.log('2. اذهب إلى: Settings > Environment Variables');
console.log('   Go to: Settings > Environment Variables');
console.log('');
console.log('3. عدّل متغير ADMIN_USERS وأضف:');
console.log('   Edit ADMIN_USERS variable and add:');
console.log('');
console.log(`   username:${hash}`);
console.log('');
console.log('   مثال كامل / Full example:');
console.log(`   admin:240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9,username:${hash}`);
console.log('');
console.log('4. احفظ وأعد نشر المشروع');
console.log('   Save and redeploy the project');
console.log('');
