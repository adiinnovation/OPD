CAREPOINT OPD MANAGEMENT SYSTEM
================================

Included:
- Dashboard with today's appointment and collection summaries
- Patient registration, search, edit, printable registration details, and WhatsApp sharing to the registered patient number
- Appointment booking, filters, check-in, completion and cancellation
- OP consultation visit notes, basic observations, multi-medicine prescription entry, printable prescriptions, and WhatsApp sharing
- Billing, partial payments, balance tracking, printable bills, and WhatsApp bill/payment summaries
- Doctor/service directory and consultation fees
- Reports, CSV billing export and JSON data backup
- Responsive Bootstrap layout for desktop, tablet and mobile

HOW TO RUN
1. Extract the ZIP file to a folder.
2. Open index.html in a modern browser.
3. Internet access is required to load Bootstrap and Bootstrap Icons from their CDN.
4. Data is saved in the current browser's localStorage.

IMPORTANT LIMITATIONS
This is a front-end prototype for evaluation and workflow demonstration. It is NOT a production-ready hospital information system. It has no server, secure authentication, role-based access control, multi-user sync, database backups, audit trail, or encrypted clinical storage. Browser-local data can be lost or viewed by someone with access to the device/browser. Do not enter real patient-identifiable or sensitive clinical data.

Before official hospital deployment, build a secure backend and database, user authentication and permissions, audit logging, encrypted transport/storage, backup and recovery, session controls, validation, and appropriate privacy/security compliance. Have clinical and administrative workflows reviewed by the hospital. The visit-note area is not a diagnostic system.

Files:
- index.html: application structure and forms
- styles.css: responsive UI styling
- app.js: browser-side functionality and local storage

WHATSAPP SHARING
- Patient registry: use the WhatsApp icon to prepare a patient registration summary.
- Billing: use the WhatsApp icon to prepare bill, payment and outstanding-balance details.
- OP Visits: add prescription medicines, save the visit, then use the WhatsApp icon to prepare the visit/prescription message; use the printer icon for a printable prescription.
- Messages are addressed using the patient's registered mobile number. Indian 10-digit numbers are automatically prefixed with country code 91.
- WhatsApp opens with a prefilled message; a staff member must review and press Send. The browser app cannot send WhatsApp messages silently or guarantee delivery.
- Prescriptions may contain sensitive health information. Confirm the patient's identity, consent, recipient number and hospital policy before sharing. Only authorized clinicians should prescribe and approve medication details.
