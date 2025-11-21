// ============================================
// Google Apps Script - إدارة بيانات عائلة آل بن صالح
// ============================================

const SHEET_ID = "1FleMs__EEeGaAxgdj7G2mPVFGa619F4kdf_o1jKlJIc";
const SHEET_NAME = "Sheet1";

// ============================================
// دالة Web App الرئيسية
// ============================================
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getData') {
    return ContentService.createTextOutput(JSON.stringify(getData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('Invalid action')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result = { success: false };
    
    switch(action) {
      case 'addFamily':
        result = addFamily(data.familyName, data.description, data.icon, data.sheetId);
        break;
      case 'updateCell':
        result = updateCell(data.row, data.col, data.value);
        break;
      case 'addPerson':
        result = addPerson(data.name, data.yearsCount);
        break;
      case 'deletePerson':
        result = deletePerson(data.row);
        break;
      case 'addYear':
        result = addYear(data.year);
        break;
      case 'deleteYear':
        result = deleteYear(data.col);
        break;
      case 'updateYear':
        result = updateYear(data.col, data.year);
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
// الحصول على البيانات
// ============================================
function getData() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  if (values.length === 0) {
    return { data: [], years: [] };
  }
  
  // الصف الأول يحتوي على السنوات
  const yearsRow = values[0];
  const years = [];
  
  // استخراج السنوات (تبدأ من العمود الثاني)
  for (let i = 1; i < yearsRow.length; i++) {
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
      row.push(value ? value.toString() : '-');
    }
    
    // تجاهل الصفوف الفارغة
    if (row[0] && row[0].trim()) {
      data.push(row);
    }
  }
  
  return { data: data, years: years };
}

// ============================================
// تحديث خانة واحدة
// ============================================
function updateCell(row, col, value) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    const actualRow = row + 2;
    const actualCol = col + 2;
    
    Logger.log('تحديث: الصف ' + actualRow + ' العمود ' + actualCol + ' القيمة: ' + value);
    
    sheet.getRange(actualRow, actualCol).setValue(value);
    SpreadsheetApp.flush();
    
    return { success: true, message: 'تم تحديث الخانة بنجاح' };
  } catch(error) {
    Logger.log('خطأ: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// إضافة شخص جديد
// ============================================
function addPerson(name, yearsCount) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();
    
    sheet.getRange(lastRow + 1, 1).setValue(name);
    
    for (let i = 0; i < yearsCount; i++) {
      sheet.getRange(lastRow + 1, i + 2).setValue('-');
    }
    
    SpreadsheetApp.flush();
    Logger.log('تم إضافة شخص: ' + name);
    return { success: true, message: 'تم إضافة الشخص' };
  } catch(error) {
    Logger.log('خطأ في إضافة شخص: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// حذف شخص
// ============================================
function deletePerson(row) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const actualRow = row + 2;
    
    sheet.deleteRow(actualRow);
    SpreadsheetApp.flush();
    Logger.log('تم حذف الصف: ' + actualRow);
    return { success: true, message: 'تم حذف الشخص' };
  } catch(error) {
    Logger.log('خطأ في حذف شخص: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// إضافة سنة جديدة
// ============================================
function addYear(year) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lastCol = sheet.getLastColumn();
    
    // إضافة السنة في الصف الأول
    sheet.getRange(1, lastCol + 1).setValue(year);
    
    // ملء باقي الخلايا في هذا العمود بـ "-"
    for (let i = 2; i <= sheet.getLastRow(); i++) {
      sheet.getRange(i, lastCol + 1).setValue('-');
    }
    
    SpreadsheetApp.flush();
    Logger.log('تم إضافة سنة: ' + year);
    return { success: true, message: 'تم إضافة السنة' };
  } catch(error) {
    Logger.log('خطأ في إضافة سنة: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// حذف سنة
// ============================================
function deleteYear(col) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const actualCol = col + 2;
    
    sheet.deleteColumn(actualCol);
    SpreadsheetApp.flush();
    Logger.log('تم حذف العمود: ' + actualCol);
    return { success: true, message: 'تم حذف السنة' };
  } catch(error) {
    Logger.log('خطأ في حذف سنة: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// تحديث السنة
// ============================================
function updateYear(col, newYear) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const actualCol = col + 2;
    
    sheet.getRange(1, actualCol).setValue(newYear);
    SpreadsheetApp.flush();
    Logger.log('تم تحديث السنة: ' + newYear);
    return { success: true, message: 'تم تحديث السنة' };
  } catch(error) {
    Logger.log('خطأ في تحديث سنة: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// إضافة عائلة جديدة (للفهرس)
// ============================================
function addFamily(familyName, description, icon, sheetId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Families");
    if (!sheet) {
      return { success: false, message: "Sheet 'Families' not found." };
    }

    // التحقق من وجود العائلة مسبقاً
    const data = sheet.getDataRange().getValues();
    const exists = data.some(row => row[0] === familyName);
    if (exists) {
      return { success: false, message: "Family name already exists." };
    }

    // إضافة صف جديد
    sheet.appendRow([familyName, description, icon, sheetId]);
    SpreadsheetApp.flush();
    
    return { success: true, message: "Family added successfully." };
  } catch(error) {
    Logger.log('Error in addFamily: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// دالة مساعدة لإدراج البيانات من Excel
// ============================================
function insertExcelData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // البيانات المستخرجة من Excel
  const excelData = [
    [null, 1438, 1439, 1440, 1441, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, null, null, null, null],
    ['عبدالله مزهر صالح ', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['محمد عبدالله مزهر', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['عبدالرحمن عبدالله مزهر', 'مشارك', 'مشارك', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', null, null, null, null, null, null, null],
    ['مزهر عبدالله مزهر', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['خالد عبدالله مزهر', 'مشارك', 'مشارك', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', null, null, null, null, null, null, null],
    ['علي مزهر صالح', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['محمد علي مزهر', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['مزهر علي مزهر', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['صالح محمد علي ال مزهر', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['سعد صالح محمد', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['خالد صالح محمد', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['فهد صالح محمد', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['وليد صالح محمد', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null],
    ['زكي سعد محمد ال مزهر', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', 'مشارك', null, null, null, null, null, null, null]
  ];
  
  // حذف البيانات القديمة
  sheet.clearContents();
  
  // إدراج البيانات الجديدة
  const range = sheet.getRange(1, 1, excelData.length, excelData[0].length);
  range.setValues(excelData);
  
  // تنسيق الصف الأول
  const headerRange = sheet.getRange(1, 1, 1, excelData[0].length);
  headerRange.setBackground("#4472C4");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // تنسيق عمود الأسماء
  const namesRange = sheet.getRange(2, 1, excelData.length - 1, 1);
  namesRange.setBackground("#D9E1F2");
  namesRange.setFontWeight("bold");
  
  Logger.log("✓ تم إدراج البيانات بنجاح!");
  Logger.log("عدد الصفوف: " + excelData.length);
  Logger.log("عدد الأعمدة: " + excelData[0].length);
}
