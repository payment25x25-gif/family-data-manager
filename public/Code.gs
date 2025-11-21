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
  const action = e.parameter.action;
  
  if (action === 'getFamilies') {
    return ContentService.createTextOutput(JSON.stringify(getFamilies()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // إذا كان الطلب لجلب بيانات عائلة محددة (مثل آل مزهر)
  if (action === 'getData' && e.parameter.sheetId) {
    return ContentService.createTextOutput(JSON.stringify(getData(e.parameter.sheetId)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid or missing action parameter.' }))
    .setMimeType(ContentService.MimeType.JSON);
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
      // يمكنك إضافة حالات أخرى هنا لمعالجة تحديثات البيانات الفردية (updateCell, addPerson, etc.)
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
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length < 2) {
      return { success: true, families: {} }; // لا توجد بيانات عائلات (باستثناء الصف الأول)
    }
    
    const headers = values[0]; // FamilyName, Description, SheetID, Icon
    const families = {};
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const familyName = row[0];
      
      if (familyName) {
        families[familyName] = {
          FamilyName: familyName,
          Description: row[1] || '',
          SheetID: row[2] || '',
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
// 2. إضافة عائلة جديدة للفهرس وإنشاء جدول بيانات خاص بها
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
    let sheetId = data.sheetId || ''; // في حالة الإضافة، لا يوجد sheetId، سنقوم بإنشائه
    const icon = data.icon || 'fas fa-users';
    
    // التحقق من وجود العائلة مسبقاً
    const allNames = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
    if (allNames.includes(familyName)) {
      return { success: false, message: "Family name already exists." };
    }

    // 1. إنشاء جدول بيانات جديد للعائلة
    const newSpreadsheet = SpreadsheetApp.create(`بيانات عائلة ${familyName}`);
    sheetId = newSpreadsheet.getId();
    
    // 2. إعداد الهيكل الأساسي لجدول البيانات الجديد
    const newSheet = newSpreadsheet.getSheets()[0];
    newSheet.setName('البيانات');
    
    // إضافة صف الرؤوس (يفترض أن الصف الأول هو لسنوات البيانات)
    // يمكنك تعديل هذا حسب الهيكل الفعلي لبيانات العائلة
    newSheet.appendRow(['الاسم', '2020', '2021', '2022', '2023', '2024']);
    
    // 3. إضافة صف جديد في فهرس العائلات مع SheetID الجديد
    sheet.appendRow([familyName, description, sheetId, icon]);
    SpreadsheetApp.flush();
    
    return { success: true, message: `تم إضافة عائلة ${familyName} بنجاح وإنشاء جدول بيانات خاص بها بالمعرف: ${sheetId}` };
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
    const sheetId = data.sheetId || '';
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
    sheet.getRange(rowToUpdate, 1, 1, 4).setValues([[newFamilyName, description, sheetId, icon]]);
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
    SpreadsheetApp.flush();
    
    return { success: true, message: `تم حذف عائلة ${familyName} بنجاح.` };
  } catch(error) {
    Logger.log('Error in deleteFamily: ' + error);
    return { success: false, message: 'فشل حذف العائلة: ' + error.toString() };
  }
}

// ============================================
// 5. جلب بيانات عائلة محددة (لصفحة العائلة)
// ============================================
function getData(sheetId) {
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0]; // يفترض أن البيانات في أول شيت
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      return { success: true, data: [], years: [] };
    }
    
    // منطق استخراج البيانات والسنوات (كما كان في الكود القديم)
    const yearsRow = values[0];
    const years = [];
    
    for (let i = 1; i < yearsRow.length; i++) {
      if (yearsRow[i]) {
        years.push(yearsRow[i].toString());
      }
    }
    
    const data = [];
    for (let i = 1; i < values.length; i++) {
      const row = [];
      for (let j = 0; j < yearsRow.length; j++) {
        const value = values[i][j];
        row.push(value ? value.toString() : '-');
      }
      
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
// الدوال المساعدة الأخرى (updateCell, addPerson, deletePerson, etc.)
// يجب عليك نقلها من ملف Code.gs القديم إلى هذا الملف
// ============================================
// ملاحظة: لتبسيط الكود، لم يتم نقل الدوال المساعدة هنا، ولكن يجب عليك نقلها يدوياً.
// الكود أعلاه يركز على إدارة فهرس العائلات (getFamilies, addFamily, editFamily).
// ============================================
