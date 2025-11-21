// ============================================
// Google Apps Script - إدارة بيانات العائلات (الفهرس والبيانات)
// ============================================

// معرف جدول بيانات فهرس العائلات الرئيسي
const FAMILY_INDEX_SHEET_ID = "12kdh41FzmZAS-8fgTm5LyqpwlCMWVg-jG9KcJiirLxA";
const FAMILY_INDEX_SHEET_NAME = "Sheet1";

// ============================================
// دالة Web App الرئيسية (GET)
// ============================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

// ============================================
// دالة Web App الرئيسية (POST)
// ============================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result = { success: false };
    
    switch(action) {
      case 'addFamily':
        result = addFamily(data);
        break;
      case 'editFamily':
        result = editFamily(data);
        break;
      case 'deleteFamily':
        result = deleteFamily(data);
        break;
      // دوال صفحة العائلة
      case 'updateCell':
        result = updateCell(data.sheetName, data.rowIndex, data.statusColIndex, data.status, data.noteColIndex, data.note);
        break;
      case 'addPerson':
        result = addPerson(data.sheetName, data.personName);
        break;
      case 'deletePerson':
        result = deletePerson(data.sheetName, data.rowIndex);
        break;
      case 'updateName':
        result = updateName(data.sheetName, data.rowIndex, data.newName);
        break;
      case 'addYear':
        result = addYear(data.sheetName, data.year);
        break;
      case 'deleteYear':
        result = deleteYear(data.sheetName, data.yearIndex);
        break;
      case 'updateYear':
        result = updateYear(data.sheetName, data.yearIndex, data.newYear);
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
// 1. جلب فهرس العائلات
// ============================================
function getFamilies() {
  try {
    const ss = SpreadsheetApp.openById(FAMILY_INDEX_SHEET_ID);
    const sheet = ss.getSheetByName(FAMILY_INDEX_SHEET_NAME);
    
    if (!sheet) {
      return { success: false, error: "Sheet 'FamiliesIndex' not found in the main spreadsheet." };
    }
    
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    if (lastRow < 2) {
      return { success: true, families: {} }; // لا توجد بيانات عائلات (باستثناء الصف الأول)
    }
    
    const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    
    const headers = values[0]; // FamilyName, Description, SheetID, Icon
    const families = {};
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const familyName = row[0];
      
      if (familyName) {
        families[familyName] = {
          FamilyName: familyName,
          Description: row[1] || '',
          SheetID: row[2] || '', // هذا الآن هو اسم الورقة (Sheet Name)
          Icon: row[3] || 'fas fa-users'
        };
      }
    }
    
    return { success: true, families: families };
    
  } catch(error) {
    Logger.log('Error in getFamilies: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ============================================
// 2. إضافة عائلة جديدة للفهرس وإنشاء ورقة عمل خاصة بها
// ============================================
function addFamily(data) {
  try {
    const ss = SpreadsheetApp.openById(FAMILY_INDEX_SHEET_ID);
    const sheet = ss.getSheetByName(FAMILY_INDEX_SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: "Sheet 'FamiliesIndex' not found." };
    }

    const familyName = data.familyName;
    const description = data.description || '';
    const icon = data.icon || 'fas fa-users';
    
    // التحقق من وجود العائلة مسبقاً
    const allNames = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
    if (allNames.includes(familyName)) {
      return { success: false, message: "Family name already exists." };
    }

    // 1. إنشاء ورقة عمل جديدة داخل ملف الفهرس الرئيسي
    const newSheetName = familyName; // استخدام اسم العائلة كاسم للورقة
    
    // التحقق من وجود ورقة عمل بنفس الاسم
    if (ss.getSheetByName(newSheetName)) {
      return { success: false, message: `Sheet with name '${newSheetName}' already exists.` };
    }
    
    const newSheet = ss.insertSheet(newSheetName);
    
    // 2. إعداد الهيكل الأساسي لورقة العمل الجديدة
    
    // إعداد الرؤوس: الاسم، ثم أزواج (السنة - الحالة، السنة - الملاحظة)
    const headers = ['الاسم', '2023', '2023', '2024', '2024'];
    newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // تنسيق الصف الأول
    const headerRange = newSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#4472C4");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    
    // 3. إضافة صف جديد في فهرس العائلات مع اسم الورقة الجديدة
    // ملاحظة: العمود الثالث في الفهرس سيحتوي الآن على اسم الورقة (Sheet Name) بدلاً من Sheet ID
    sheet.appendRow([familyName, description, newSheetName, icon]);
    SpreadsheetApp.flush();
    
    return { success: true, message: `تم إضافة عائلة ${familyName} بنجاح وإنشاء ورقة عمل خاصة بها باسم: ${newSheetName}` };
  } catch(error) {
    Logger.log('Error in addFamily: ' + error);
    return { success: false, message: 'فشل إضافة العائلة: ' + error.toString() };
  }
}

// ============================================
// 3. تعديل بيانات عائلة في الفهرس
// ============================================
function editFamily(data) {
  try {
    const ss = SpreadsheetApp.openById(FAMILY_INDEX_SHEET_ID);
    const sheet = ss.getSheetByName(FAMILY_INDEX_SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: "Sheet 'FamiliesIndex' not found." };
    }

    const oldFamilyName = data.oldFamilyName;
    const newFamilyName = data.familyName;
    const description = data.description || '';
    const sheetName = data.sheetName || ''; // هذا هو اسم الورقة
    const icon = data.icon || 'fas fa-users';
    
    const values = sheet.getDataRange().getValues();
    let rowToUpdate = -1;

    // البحث عن الصف الذي يحتوي على اسم العائلة القديم
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === oldFamilyName) {
        rowToUpdate = i + 1; // رقم الصف في الجدول
        break;
      }
    }

    if (rowToUpdate === -1) {
      return { success: false, message: `Family '${oldFamilyName}' not found.` };
    }

    // تحديث البيانات في الصف
    sheet.getRange(rowToUpdate, 1, 1, 4).setValues([[newFamilyName, description, sheetName, icon]]);
    SpreadsheetApp.flush();
    
    return { success: true, message: `تم تعديل بيانات عائلة ${newFamilyName} بنجاح.` };
  } catch(error) {
    Logger.log('Error in editFamily: ' + error);
    return { success: false, message: 'فشل تعديل العائلة: ' + error.toString() };
  }
}

// ============================================
// 4. حذف عائلة من الفهرس
// ============================================
function deleteFamily(data) {
  try {
    const ss = SpreadsheetApp.openById(FAMILY_INDEX_SHEET_ID);
    const sheet = ss.getSheetByName(FAMILY_INDEX_SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: "Sheet 'FamiliesIndex' not found." };
    }

    const familyName = data.familyName;
    
    const values = sheet.getDataRange().getValues();
    let rowToDelete = -1;

    // البحث عن الصف الذي يحتوي على اسم العائلة
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === familyName) {
        rowToDelete = i + 1; // رقم الصف في الجدول
        break;
      }
    }

    if (rowToDelete === -1) {
      return { success: false, message: `Family '${familyName}' not found.` };
    }

    // حذف الصف
    sheet.deleteRow(rowToDelete);
    
    // حذف ورقة العمل الخاصة بالعائلة
    const familySheet = ss.getSheetByName(familyName);
    if (familySheet) {
        ss.deleteSheet(familySheet);
    }
    
    SpreadsheetApp.flush();
    
    return { success: true, message: `تم حذف عائلة ${familyName} بنجاح.` };
  } catch(error) {
    Logger.log('Error in deleteFamily: ' + error);
    return { success: false, message: 'فشل حذف العائلة: ' + error.toString() };
  }
}

// ============================================
// دوال إدارة بيانات العائلة (من family_mazher_new/Code.gs)
// ============================================

// 1. الحصول على البيانات (مع دعم الحالة والملاحظة)
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

// 2. تحديث خانة (الحالة والملاحظة)
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

// 3. إضافة شخص جديد
function addPerson(sheetName, personName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
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

// 4. حذف شخص
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

// 5. تحديث اسم شخص
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

// 6. إضافة سنة جديدة
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

// 7. حذف سنة
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

// 8. تحديث السنة
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
