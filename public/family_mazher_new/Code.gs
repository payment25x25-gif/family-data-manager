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
  const sheetName = e.parameter.sheetName;
  
  if (action === 'getData' && sheetName) {
    return ContentService.createTextOutput(JSON.stringify(getData(sheetName)))
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
    const sheetName = data.sheetName;
    
    if (!sheetName) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Missing Sheet Name' }))
            .setMimeType(ContentService.MimeType.JSON);
    }
    
    let result = { success: false };
    
    switch(action) {
      case 'updateCell':
        result = updateCell(sheetName, data.rowIndex, data.statusColIndex, data.status, data.noteColIndex, data.note);
        break;
      case 'addPerson':
        result = addPerson(sheetName, data.personName);
        break;
      case 'deletePerson':
        result = deletePerson(sheetName, data.rowIndex);
        break;
      case 'updateName':
        result = updateName(sheetName, data.rowIndex, data.newName);
        break;
      case 'addYear':
        result = addYear(sheetName, data.year);
        break;
      case 'deleteYear':
        result = deleteYear(sheetName, data.yearIndex);
        break;
      case 'updateYear':
        result = updateYear(sheetName, data.yearIndex, data.newYear);
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
function getData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
        return { success: false, error: `Sheet '${sheetName}' not found.` };
    }
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
function updateCell(sheetName, rowIndex, statusColIndex, status, noteColIndex, note) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
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
function addPerson(sheetName, personName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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
function deletePerson(sheetName, rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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
function updateName(sheetName, rowIndex, newName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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
function addYear(sheetName, year) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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
function deleteYear(sheetName, yearIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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
function updateYear(sheetName, yearIndex, newYear) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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
// تم إزالة دالة initializeNewFamilySheet لأن التهيئة تتم الآن في Code.gs الرئيسي
