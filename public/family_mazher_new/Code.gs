// ============================================
// Google Apps Script - إدارة بيانات العائلة (الحالة والملاحظة)
// ============================================

// ملاحظة: تم إزالة تعريف SHEET_ID و SHEET_NAME الثابتين
// سيتم تمرير Sheet ID ديناميكياً من الواجهة الأمامية

// ============================================
// دالة Web App الرئيسية (GET)
// ============================================
function doGet(e) {
  const action = e.parameter.action;
  const sheetId = e.parameter.sheetId;
  
  if (action === 'getData' && sheetId) {
    return ContentService.createTextOutput(JSON.stringify(getData(sheetId)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('Invalid action or missing Sheet ID')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================
// دالة Web App الرئيسية (POST)
// ============================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetId = data.sheetId;
    
    if (!sheetId) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Missing Sheet ID' }))
            .setMimeType(ContentService.MimeType.JSON);
    }
    
    let result = { success: false };
    
    switch(action) {
      case 'updateCell':
        result = updateCell(sheetId, data.rowIndex, data.statusColIndex, data.status, data.noteColIndex, data.note);
        break;
      case 'addPerson':
        result = addPerson(sheetId, data.personName);
        break;
      case 'deletePerson':
        result = deletePerson(sheetId, data.rowIndex);
        break;
      case 'updateName':
        result = updateName(sheetId, data.rowIndex, data.newName);
        break;
      case 'addYear':
        result = addYear(sheetId, data.year);
        break;
      case 'deleteYear':
        result = deleteYear(sheetId, data.yearIndex);
        break;
      case 'updateYear':
        result = updateYear(sheetId, data.yearIndex, data.newYear);
        break;
      default:
        result = { success: false, message: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// 1. الحصول على البيانات (مع دعم الحالة والملاحظة)
// ============================================
function getData(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0]; // يفترض أن البيانات في أول شيت
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      return { success: true, data: [], years: [] };
    }
    
    // الصف الأول يحتوي على السنوات
    const yearsRow = values[0];
    const years = [];
    
    // استخراج السنوات (تبدأ من العمود الثاني، كل سنة تغطي عمودين: الحالة والملاحظة)
    for (let i = 1; i < yearsRow.length; i += 2) {
      if (yearsRow[i]) {
        years.push(yearsRow[i].toString());
      }
    }
    
    // استخراج البيانات (تبدأ من الصف الثاني)
    const data = [];
    for (let i = 1; i < values.length; i++) {
      const row = [];
      for (let j = 0; j < yearsRow.length; j++) {
        const value = values[i][j];
        row.push(value ? value.toString() : ''); // لا نستخدم '-' هنا، نتركها فارغة
      }
      
      // تجاهل الصفوف الفارغة
      if (row[0] && row[0].trim()) {
        data.push(row);
      }
    }
    
    return { success: true, data: data, years: years };
  } catch(error) {
    Logger.log('Error in getData: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ============================================
// 2. تحديث خانة (الحالة والملاحظة)
// ============================================
function updateCell(sheetId, rowIndex, statusColIndex, status, noteColIndex, note) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    
    // rowIndex هو رقم الصف في مصفوفة البيانات (0-indexed)، نضيف 1 لتعويض صف الرؤوس
    const actualRow = rowIndex + 2; 
    
    // تحديث الحالة
    sheet.getRange(actualRow, statusColIndex).setValue(status);
    
    // تحديث الملاحظة
    sheet.getRange(actualRow, noteColIndex).setValue(note);
    
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم تحديث الخانة بنجاح' };
  } catch(error) {
    Logger.log('خطأ في updateCell: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// 3. إضافة شخص جديد
// ============================================
function addPerson(sheetId, personName) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // إنشاء صف جديد
    const newRow = [personName];
    // ملء باقي الأعمدة بقيم افتراضية (حالة '-' وملاحظة فارغة)
    for (let i = 1; i < lastCol; i += 2) {
        newRow.push('-'); // الحالة
        newRow.push(''); // الملاحظة
    }
    
    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم إضافة الشخص' };
  } catch(error) {
    Logger.log('خطأ في addPerson: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// 4. حذف شخص
// ============================================
function deletePerson(sheetId, rowIndex) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    const actualRow = rowIndex + 2; // +2 لتعويض صف الرؤوس و 0-indexed
    
    sheet.deleteRow(actualRow);
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم حذف الشخص' };
  } catch(error) {
    Logger.log('خطأ في deletePerson: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// 5. تحديث اسم شخص
// ============================================
function updateName(sheetId, rowIndex, newName) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    const actualRow = rowIndex + 2; // +2 لتعويض صف الرؤوس و 0-indexed
    
    sheet.getRange(actualRow, 1).setValue(newName);
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم تحديث الاسم' };
  } catch(error) {
    Logger.log('خطأ في updateName: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// 6. إضافة سنة جديدة
// ============================================
function addYear(sheetId, year) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    
    // إضافة السنة في الصف الأول (تغطي عمودين)
    sheet.getRange(1, lastCol + 1).setValue(year);
    sheet.getRange(1, lastCol + 2).setValue(year);
    
    // ملء باقي الخلايا في العمودين الجديدين
    for (let i = 2; i <= lastRow; i++) {
      sheet.getRange(i, lastCol + 1).setValue('-'); // الحالة الافتراضية
      sheet.getRange(i, lastCol + 2).setValue(''); // الملاحظة الافتراضية
    }
    
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم إضافة السنة' };
  } catch(error) {
    Logger.log('خطأ في addYear: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// 7. حذف سنة
// ============================================
function deleteYear(sheetId, yearIndex) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    // yearIndex هو رقم السنة (0-indexed)، كل سنة تبدأ من العمود 2 (1-indexed) وتغطي عمودين
    const actualCol = (yearIndex * 2) + 2; 
    
    // حذف عمودي الحالة والملاحظة
    sheet.deleteColumns(actualCol, 2);
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم حذف السنة' };
  } catch(error) {
    Logger.log('خطأ في deleteYear: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// 8. تحديث السنة
// ============================================
function updateYear(sheetId, yearIndex, newYear) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
    // yearIndex هو رقم السنة (0-indexed)، كل سنة تبدأ من العمود 2 (1-indexed)
    const actualCol = (yearIndex * 2) + 2; 
    
    // تحديث قيمة السنة في كلا العمودين (الحالة والملاحظة)
    sheet.getRange(1, actualCol).setValue(newYear);
    sheet.getRange(1, actualCol + 1).setValue(newYear);
    
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم تحديث السنة' };
  } catch(error) {
    Logger.log('خطأ في updateYear: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// دالة مساعدة لتهيئة جدول بيانات جديد
// ============================================
function initializeNewFamilySheet(sheetId, familyName) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0];
    sheet.setName('البيانات');
    
    // إعداد الرؤوس: الاسم، ثم أزواج (السنة - الحالة، السنة - الملاحظة)
    const headers = ['الاسم', '2023', '2023', '2024', '2024'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // تنسيق الصف الأول
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#4472C4");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم تهيئة جدول البيانات بنجاح' };
  } catch(error) {
    Logger.log('خطأ في initializeNewFamilySheet: ' + error);
    return { success: false, message: error.toString() };
  }
}
