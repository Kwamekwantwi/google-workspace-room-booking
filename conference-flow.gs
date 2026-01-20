// --- CONFIGURATION ---
const WEBHOOK_URL = "Your Google Chat Webhook URL";
const CALENDAR_ID = "Calendar ID";
// You will update this after Step 3
const WEB_APP_URL = "Web App Url after deployment in Google Script"; 

function onFormSubmit(e) {
var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Form Responses 1");
  
  // Safety Check
  if (!sheet) {
    Logger.log("Error: Could not find the sheet 'Form Responses 1'. Checking for the first sheet instead...");
    sheet = ss.getSheets()[0]; // Fallback to the very first tab in the sheet
  }
  
  var lastRow = sheet.getLastRow();

  // --- THIS IS THE MISSING LINE ---
  var rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var email = rowData[1];      // Col B
  var roomName = rowData[2];   // Col C
  var purpose = rowData[3];    // Col D
  var startDisplay = formatDate(rowData[4]) + " " + formatTime(rowData[5]);
  var endDisplay = formatDate(rowData[6]) + " " + formatTime(rowData[7]);
  
  var approvalUrl = `${WEB_APP_URL}?action=approve&row=${lastRow}`;
  var rejectionUrl = `${WEB_APP_URL}?action=reject&row=${lastRow}`;
  
  var chatMessage = {
    "cardsV2": [{
      "cardId": "roomBooking",
      "card": {
        "header": { "title": "Conference Room Booking", "subtitle": roomName },
        "sections": [{
          "widgets": [
            { "textParagraph": { "text": `<b>Requester:</b> ${email}` } },
            { "textParagraph": { "text": `<b>Purpose:</b> ${purpose}` } },
            { "textParagraph": { "text": `<b>Start:</b> ${startDisplay}` } },
            { "textParagraph": { "text": `<b>End:</b> ${endDisplay}` } },
            {
              "buttonList": {
                "buttons": [
                  { "text": "✅ Approve", "onClick": { "openLink": { "url": approvalUrl } } },
                  { "text": "❌ Reject", "onClick": { "openLink": { "url": rejectionUrl } } }
                ]
              }
            }
          ]
        }]
      }
    }]
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(chatMessage)
  });
}

function doGet(e) {
  var action = e.parameter.action;
  var row = parseInt(e.parameter.row);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  
  var status = sheet.getRange(row, 12).getValue();
  if (String(status || "").startsWith("Approved") || String(status || "").startsWith("Rejected")) {
    return ContentService.createTextOutput("Error: This request was already processed.");
  }

  if (action === "approve") {
    var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    var start = combineDateTime(data[4], data[5]);
    var end = combineDateTime(data[6], data[7]);
    
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    var conflicts = cal.getEvents(start, end);
    
    if (conflicts.length > 0) {
      return ContentService.createTextOutput("❌ CONFLICT: This room is already booked for that time.");
    }
  }

  var user = Session.getActiveUser().getEmail();
  var statusText = action === "approve" ? `Approved by ${user}` : `Rejected by ${user}`;
  updateStatus(row, statusText, action);
  
  return ContentService.createTextOutput(`Successfully ${action}d.`);
}

function updateStatus(row, status, action) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  sheet.getRange(row, 12).setValue(status);
  
  var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var recipient = data[1];
  
  if (action === "approve") {
    var start = combineDateTime(data[4], data[5]);
    var end = combineDateTime(data[6], data[7]);
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    
    cal.createEvent(`Meeting: ${data[3]} (${data[2]})`, start, end, {
      description: "Auto-approved via Room Booking System",
      guests: recipient + (data[8] ? "," + data[8] : ""),
      sendInvites: true
    });
  }
  
  MailApp.sendEmail(recipient, "Room Booking Update", `Your request for ${data[2]} has been ${status}.`);
}

/**
 * Helper to merge Date and Time objects safely
 */
function combineDateTime(dateVal, timeVal) {
  // Check if inputs exist
  if (!dateVal || !timeVal) {
    throw new Error("Date or Time value is missing in the sheet.");
  }

  var d = new Date(dateVal);
  var t = new Date(timeVal);

  // Check if the conversion resulted in "Invalid Date"
  if (isNaN(d.getTime()) || isNaN(t.getTime())) {
    throw new Error("The sheet contains an invalid date or time format.");
  }

  // Create the combined date: Year, Month, Day from 'd', Hours, Minutes from 't'
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    t.getHours(),
    t.getMinutes(),
    0
  );
}

function formatDate(d) { return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), "dd/MM/yyyy"); }
function formatTime(t) { return Utilities.formatDate(new Date(t), Session.getScriptTimeZone(), "HH:mm"); }
