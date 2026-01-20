# google-workspace-room-booking

**🏢 Smart Conference Room Booking System
**An automated approval-based workflow that manages office conference room requests using Google Workspace. This system streamlines the booking process by moving requests from a Google Form into a Google Chat Space for real-time manager approval, with automatic conflict detection and calendar synchronization.

**🌟 Features
**Real-time Chat Alerts: Sends interactive "Card" messages to a designated Google Chat Space using Webhooks.

One-Click Approval: Managers can approve or reject requests directly from Chat via a Google Apps Script Web App.

Intelligent Conflict Detection: Upon clicking "Approve," the script scans the Google Calendar for any existing events during the requested time slot to prevent double-bookings.

Automatic Calendar Sync: Once approved, the script creates an event on a shared office calendar and sends official calendar invites to the requester and attendees.

Split Date/Time Handling: Specifically designed to merge separate Date and Time inputs from Google Forms into valid JavaScript Date objects.

Status Tracking: Automatically updates the Google Sheet with the processor's email and timestamp.

**🛠️ Technical Workflow
**Submission: User submits a Google Form.

Notification: onFormSubmit triggers, sending a JSON payload to a Google Chat Webhook.

Interaction: The manager clicks "Approve" or "Reject" on the Chat Card.

Validation: The doGet function handles the request, performing a calendar lookup via CalendarApp.

Completion:

Success: The event is created, and the status is updated.

Failure: If a conflict is found, the manager receives an error message, and no event is created.

**📋 Installation & Configuration
**1. Spreadsheet Setup
Ensure your Google Sheet ("Form Responses 1") has the following column structure:

B: Requester Email

C: Room Name

D: Meeting Purpose

E: Start Date | F: Start Time

G: End Date | H: End Time

I: Other Attendees

L: Status (Column 12)

2. Script Configuration
Update the constants at the top of the Code.gs file:

WEBHOOK_URL: Your Google Chat Space webhook.

CALENDAR_ID: The ID of the shared room calendar.

WEB_APP_URL: The URL generated after deploying as a Web App.

3. Deployment
Open Apps Script editor.

Click Deploy > New Deployment.

Select Web App.

Set Execute as: Me and Who has access: Anyone.

Set a Trigger for onFormSubmit on the "From spreadsheet" event.

**💻 Code Highlights
**

Date/Time Merger
The script features a robust helper to combine separate date and time inputs safely:

JavaScript

function combineDateTime(dateVal, timeVal) {
  var d = new Date(dateVal);
  var t = new Date(timeVal);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), 0);
}

Conflict Trap
Prevents double-bookings by checking the CalendarApp event array:

JavaScript

var conflicts = cal.getEvents(start, end);
if (conflicts.length > 0) {
  return ContentService.createTextOutput("❌ CONFLICT: Room already booked.");
}


📄 License
Distributed under the MIT License. See LICENSE for more information.
