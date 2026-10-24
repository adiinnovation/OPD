(() => {
'use strict';
const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA');
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2});
const uid = prefix => prefix + '-' + Date.now().toString().slice(-7) + Math.floor(Math.random()*90+10);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initialDoctors = [
 {id:'DOC-001',name:'Dr. Anjali Menon',department:'General Medicine',fee:300},
 {id:'DOC-002',name:'Dr. Rahul Nair',department:'Pediatrics',fee:350},
 {id:'DOC-003',name:'Dr. Meera Krishnan',department:'Gynecology',fee:400},
 {id:'DOC-004',name:'Dr. Vivek Kumar',department:'Orthopedics',fee:400},
 {id:'DOC-005',name:'Dr. Nithin Das',department:'Dermatology',fee:350},
 {id:'SRV-001',name:'Nursing / Vitals',department:'Nursing Service',fee:100}
];
const read = (key, fallback) => { try { const x=localStorage.getItem('carepoint_'+key); return x ? JSON.parse(x) : fallback; } catch { return fallback; } };
let patients=read('patients',[]), appointments=read('appointments',[]), visits=read('visits',[]), bills=read('bills',[]), doctors=read('doctors',initialDoctors);
const save = () => { localStorage.setItem('carepoint_patients',JSON.stringify(patients));localStorage.setItem('carepoint_appointments',JSON.stringify(appointments));localStorage.setItem('carepoint_visits',JSON.stringify(visits));localStorage.setItem('carepoint_bills',JSON.stringify(bills));localStorage.setItem('carepoint_doctors',JSON.stringify(doctors)); };
const patientById = id => patients.find(p=>p.id===id);
const doctorById = id => doctors.find(d=>d.id===id);
const patientName = id => patientById(id)?.name || 'Unknown patient';
const doctorName = id => doctorById(id)?.name || 'Unknown doctor';
const initials = name => String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const empty = text => `<tr><td colspan="10" class="empty-state"><i class="bi bi-inbox"></i>${escapeHTML(text)}</td></tr>`;
function toast(message){$('toastMessage').textContent=message;bootstrap.Toast.getOrCreateInstance($('appToast'),{delay:2600}).show();}
function normalizeWhatsApp(phone){
 let n=String(phone||'').replace(/\D/g,'');
 if(n.startsWith('0')) n=n.slice(1);
 if(n.length===10) n='91'+n;
 return n;
}
function sendWhatsApp(phone,message){
 const n=normalizeWhatsApp(phone);
 if(!n || n.length<10){toast('No valid patient mobile number is available.');return;}
 window.open('https://wa.me/'+n+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
}
function patientRegistrationMessage(p){
 return `PATIENT REGISTRATION DETAILS\nCarePoint OPD\nPatient ID: ${p.id}\nName: ${p.name}\nDate of birth: ${p.dob||'Not recorded'}\nGender: ${p.gender||'Not recorded'}\nMobile: ${p.phone}\nBlood group: ${p.blood||'Not recorded'}\nDistrict: ${p.district||'Not recorded'}\nAddress: ${p.address||'Not recorded'}\n\nPlease verify these details with the hospital.`;
}
function billMessage(b){
 const due=Math.max(0,Number(b.amount)-Number(b.paid));
 return `OPD BILL / PAYMENT DETAILS\nCarePoint OPD\nBill ID: ${b.id}\nDate: ${b.date}\nPatient: ${patientName(b.patientId)}\nService: ${doctorName(b.serviceId)}\nBill amount: ${money(b.amount)}\nPaid: ${money(b.paid)}\nBalance due: ${money(due)}\nPayment method: ${b.method||'Not recorded'}\n\nPlease contact the hospital billing desk for any clarification.`;
}
function prescriptionMessage(v){
 const meds=(v.medicines||[]).map((m,i)=>`${i+1}. ${m.name}${m.dose?' — '+m.dose:''}${m.route?' | Route: '+m.route:''}${m.frequency?' | Frequency: '+m.frequency:''}${m.duration?' | Duration: '+m.duration:''}${m.instructions?' | Instructions: '+m.instructions:''}`).join('\n');
 return `OP CONSULTATION & PRESCRIPTION\nCarePoint OPD\nVisit ID: ${v.id}\nDate: ${v.date}\nPatient: ${patientName(v.patientId)}\nDoctor: ${doctorName(v.doctorId)}\n\nVisit notes: ${v.notes||'—'}\nPlan / follow-up: ${v.plan||'—'}\n\nPRESCRIBED MEDICINES\n${meds||'No medicines recorded'}\n\nPlease follow the treating clinician’s instructions. Contact the hospital if you have questions. Please keep this message private.`;
}
function addMedicineRow(m={}) {
 const tr=document.createElement('tr');
 tr.innerHTML=`<td><input class="form-control medicine-name" data-med="name" value="${escapeHTML(m.name||'')}" maxlength="120" placeholder="Medicine name"></td><td><input class="form-control" data-med="dose" value="${escapeHTML(m.dose||'')}" maxlength="80" placeholder="e.g. 500 mg"></td><td><select class="form-select" data-med="route"><option value="">—</option>${['Oral','Topical','Inhalation','Injection','Eye drops','Ear drops','Other'].map(x=>`<option ${m.route===x?'selected':''}>${x}</option>`).join('')}</select></td><td><input class="form-control" data-med="frequency" value="${escapeHTML(m.frequency||'')}" maxlength="80" placeholder="e.g. twice daily"></td><td><input class="form-control" data-med="duration" value="${escapeHTML(m.duration||'')}" maxlength="80" placeholder="e.g. 5 days"></td><td><input class="form-control" data-med="instructions" value="${escapeHTML(m.instructions||'')}" maxlength="160" placeholder="After food…"></td><td><button type="button" class="btn btn-sm btn-light text-danger remove-medicine" title="Remove medicine"><i class="bi bi-trash"></i></button></td>`;
 $('medicineRows').appendChild(tr);
}
function collectMedicines(){
 return [...$('medicineRows').querySelectorAll('tr')].map(tr=>{
  const m={};tr.querySelectorAll('[data-med]').forEach(el=>m[el.dataset.med]=el.value.trim());
  return m;
 }).filter(m=>m.name);
}

function optionsForPatients(selected=''){return `<option value="">Select patient…</option>`+patients.map(p=>`<option value="${escapeHTML(p.id)}" ${p.id===selected?'selected':''}>${escapeHTML(p.id)} — ${escapeHTML(p.name)} (${escapeHTML(p.phone)})</option>`).join('');}
function optionsForDoctors(selected=''){return `<option value="">Select doctor / service…</option>`+doctors.map(d=>`<option value="${escapeHTML(d.id)}" ${d.id===selected?'selected':''}>${escapeHTML(d.name)} — ${escapeHTML(d.department)}</option>`).join('');}
function refreshSelects(){['aPatient','vPatient','bPatient'].forEach(id=>$(id).innerHTML=optionsForPatients());['aDoctor','vDoctor'].forEach(id=>$(id).innerHTML=optionsForDoctors());$('bService').innerHTML='<option value="">Choose service…</option>'+doctors.map(d=>`<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)} — ${escapeHTML(d.department)} (${money(d.fee)})</option>`).join('');}
function badge(status){return `<span class="pill ${escapeHTML(status)}">${escapeHTML(status)}</span>`;}
function renderDashboard(){
 $('statPatients').textContent=patients.length;
 const todays=appointments.filter(a=>a.date===today()&&a.status!=='Cancelled');
 $('statAppointments').textContent=todays.length;
 $('statVisits').textContent=visits.filter(v=>v.date===today()).length;
 $('statCollection').textContent=money(bills.filter(b=>b.date===today()).reduce((s,b)=>s+Number(b.paid),0));
 $('dashboardAppointments').innerHTML=todays.length?todays.slice().sort((a,b)=>a.time.localeCompare(b.time)).slice(0,6).map(a=>`<tr><td><div class="patient-cell"><div class="patient-avatar">${escapeHTML(initials(patientName(a.patientId)))}</div><div><b>${escapeHTML(patientName(a.patientId))}</b><small>${escapeHTML(a.patientId)}</small></div></div></td><td>${escapeHTML(doctorName(a.doctorId))}</td><td>${escapeHTML(a.time)}</td><td>${badge(a.status)}</td></tr>`).join(''):empty('No appointments scheduled for today');
 $('recentPatients').innerHTML=patients.length?patients.slice().reverse().slice(0,5).map(p=>`<tr><td><b>${escapeHTML(p.id)}</b></td><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.phone)}</td><td>${escapeHTML(p.gender)}</td><td>${escapeHTML(p.created)}</td></tr>`).join(''):empty('No patients registered yet');
}
function renderPatients(){
 const q=($('patientSearch').value||'').toLowerCase();
 const list=patients.filter(p=>[p.id,p.name,p.phone,p.email].join(' ').toLowerCase().includes(q));
 $('patientCount').textContent=`${list.length} record${list.length===1?'':'s'}`;
 $('patientsTable').innerHTML=list.length?list.slice().reverse().map(p=>`<tr><td><b>${escapeHTML(p.id)}</b></td><td><div class="patient-cell"><div class="patient-avatar">${escapeHTML(initials(p.name))}</div><div><b>${escapeHTML(p.name)}</b><small>${escapeHTML(p.dob||'DOB not recorded')}</small></div></div></td><td>${escapeHTML(p.gender)}</td><td>${escapeHTML(p.phone)}</td><td>${escapeHTML(p.blood||'—')}</td><td><div class="status-actions"><button class="btn btn-light" data-edit-patient="${escapeHTML(p.id)}" title="Edit"><i class="bi bi-pencil"></i></button><button class="btn btn-light" data-print-patient="${escapeHTML(p.id)}" title="Print"><i class="bi bi-printer"></i></button><button class="btn whatsapp-btn" data-wa-patient="${escapeHTML(p.id)}" title="Share registration on WhatsApp"><i class="bi bi-whatsapp"></i></button></div></td></tr>`).join(''):empty('No matching patients');
}
function renderAppointments(){
 const q=($('appointmentSearch').value||'').toLowerCase(), date=$('appointmentDateFilter').value, status=$('appointmentStatusFilter').value;
 const list=appointments.filter(a=>(!date||a.date===date)&&(!status||a.status===status)&&[a.id,patientName(a.patientId),doctorName(a.doctorId),a.reason].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 $('appointmentsTable').innerHTML=list.length?list.map(a=>`<tr><td><b>${escapeHTML(a.id)}</b></td><td>${escapeHTML(a.date)}<small class="d-block text-secondary">${escapeHTML(a.time)}</small></td><td>${escapeHTML(patientName(a.patientId))}</td><td>${escapeHTML(doctorName(a.doctorId))}</td><td>${escapeHTML(a.reason||a.type||'—')}</td><td>${badge(a.status)}</td><td><div class="status-actions">${a.status==='Booked'?`<button class="btn btn-light" data-appt-status="${escapeHTML(a.id)}" data-status="Checked-in">Check in</button>`:''}${a.status==='Checked-in'?`<button class="btn btn-light" data-appt-status="${escapeHTML(a.id)}" data-status="Completed">Complete</button>`:''}${!['Completed','Cancelled'].includes(a.status)?`<button class="btn btn-light text-danger" data-appt-status="${escapeHTML(a.id)}" data-status="Cancelled" title="Cancel"><i class="bi bi-x-lg"></i></button>`:''}</div></td></tr>`).join(''):empty('No appointments match these filters');
}
function renderVisits(){
 $('visitsTable').innerHTML=visits.length?visits.slice().reverse().map(v=>`<tr><td><b>${escapeHTML(v.id)}</b></td><td>${escapeHTML(v.date)}</td><td>${escapeHTML(patientName(v.patientId))}</td><td>${escapeHTML(doctorName(v.doctorId))}</td><td>${escapeHTML([v.temp?`Temp ${v.temp}°C`:'',v.bp?`BP ${v.bp}`:'',v.pulse?`Pulse ${v.pulse}`:'',v.spo2?`SpO₂ ${v.spo2}%`:''].filter(Boolean).join(' · ')||'—')}</td><td style="white-space:normal;min-width:180px;max-width:320px">${escapeHTML(v.notes)}${v.plan?`<small class="d-block text-secondary mt-1">Plan: ${escapeHTML(v.plan)}</small>`:''}${v.medicines?.length?`<small class="d-block mt-2"><b>Medicines:</b> ${escapeHTML(v.medicines.map(m=>m.name+(m.dose?' '+m.dose:'')).join(', '))}</small>`:''}</td><td><div class="status-actions"><button class="btn btn-light" data-print-visit="${escapeHTML(v.id)}" title="Print prescription"><i class="bi bi-printer"></i></button><button class="btn whatsapp-btn" data-wa-visit="${escapeHTML(v.id)}" title="Send visit and prescription on WhatsApp"><i class="bi bi-whatsapp"></i></button></div></td></tr>`).join(''):empty('No OP visits recorded');
}
function renderBilling(){
 const q=($('billingSearch').value||'').toLowerCase(), list=bills.filter(b=>[b.id,patientName(b.patientId),doctorName(b.serviceId)].join(' ').toLowerCase().includes(q));
 const billed=bills.reduce((s,b)=>s+Number(b.amount),0), paid=bills.reduce((s,b)=>s+Number(b.paid),0);
 $('billedTotal').textContent=money(billed);$('paidTotal').textContent=money(paid);$('dueTotal').textContent=money(billed-paid);
 $('billingTable').innerHTML=list.length?list.slice().reverse().map(b=>{const due=Math.max(0,Number(b.amount)-Number(b.paid));const status=due===0?'Paid':Number(b.paid)>0?'Partial':'Pending';return `<tr><td><b>${escapeHTML(b.id)}</b></td><td>${escapeHTML(b.date)}</td><td>${escapeHTML(patientName(b.patientId))}</td><td>${escapeHTML(doctorName(b.serviceId))}</td><td>${money(b.amount)}</td><td>${money(b.paid)}</td><td>${money(due)}</td><td>${badge(status)}</td><td><div class="status-actions"><button class="btn btn-light" data-print-bill="${escapeHTML(b.id)}" title="Print bill"><i class="bi bi-printer"></i></button><button class="btn whatsapp-btn" data-wa-bill="${escapeHTML(b.id)}" title="Share bill on WhatsApp"><i class="bi bi-whatsapp"></i></button>${due>0?`<button class="btn btn-light" data-pay-bill="${escapeHTML(b.id)}" title="Record payment"><i class="bi bi-cash"></i></button>`:''}</div></td></tr>`}).join(''):empty('No bills recorded');
}
function renderDoctors(){
 $('doctorsGrid').innerHTML=doctors.map(d=>`<div class="col-sm-6 col-xl-4"><div class="doctor-card"><div class="doctor-top"><div class="doctor-avatar"><i class="bi bi-person-badge"></i></div><div><h3>${escapeHTML(d.name)}</h3><p>${escapeHTML(d.department)}</p></div></div><div class="doctor-fee"><span>Consultation fee</span><b>${money(d.fee)}</b></div><div class="mt-3 text-end"><button class="btn btn-light" data-delete-doctor="${escapeHTML(d.id)}"><i class="bi bi-trash me-1"></i>Remove</button></div></div></div>`).join('');
}
function renderReports(){
 const billed=bills.reduce((s,b)=>s+Number(b.amount),0),paid=bills.reduce((s,b)=>s+Number(b.paid),0);
 $('reportPatients').textContent=patients.length;$('reportAppointments').textContent=appointments.length;$('reportVisits').textContent=visits.length;$('reportBilled').textContent=money(billed);$('reportPaid').textContent=money(paid);$('reportDue').textContent=money(billed-paid);
}
function renderAll(){save();refreshSelects();renderDashboard();renderPatients();renderAppointments();renderVisits();renderBilling();renderDoctors();renderReports();}
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$('page-'+name).classList.add('active');document.querySelectorAll('.sidebar .nav-link[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));$('pageTitle').textContent=({dashboard:'Dashboard',patients:'Patients',appointments:'Appointments',visits:'OP Visits',billing:'Billing & Payments',doctors:'Doctors & Services',reports:'Reports'})[name]||name; $('sidebar').classList.remove('open');}
function openModal(id){if(['appointmentModal','visitModal','billingModal'].includes(id)&&!patients.length){toast('Please register a patient first.');bootstrap.Modal.getOrCreateInstance($('patientModal')).show();return;}refreshSelects();bootstrap.Modal.getOrCreateInstance($(id)).show();}
function resetPatientForm(){ $('patientForm').reset();$('patientEditId').value='';$('patientModal').querySelector('.modal-title').textContent='Register patient';}
function exportJSON(){const blob=new Blob([JSON.stringify({patients,appointments,visits,bills,doctors},null,2)],{type:'application/json'});downloadBlob(blob,'carepoint-opd-backup.json');}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
function downloadCSV(){const rows=[['Bill ID','Date','Patient ID','Patient','Service','Amount','Paid','Balance','Payment method'],...bills.map(b=>[b.id,b.date,b.patientId,patientName(b.patientId),doctorName(b.serviceId),b.amount,b.paid,Math.max(0,b.amount-b.paid),b.method])];downloadBlob(new Blob([rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),'opd-billing-report.csv');}
function printHTML(title,body){const w=window.open('','_blank','width=850,height=700');if(!w){toast('Allow pop-ups to print this document.');return;}w.document.write(`<!doctype html><html><head><title>${escapeHTML(title)}</title><style>body{font:14px Arial;padding:35px;color:#222}h1{font-size:22px}h2{font-size:16px;margin-top:28px}.line{padding:8px 0;border-bottom:1px solid #ddd}.label{color:#666;display:inline-block;min-width:160px}footer{margin-top:35px;color:#777;font-size:11px}</style></head><body><h1>CarePoint — ${escapeHTML(title)}</h1><p>Printed on ${escapeHTML(today())}</p>${body}<footer>Administrative prototype printout. Verify records before official use.</footer><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}
$('patientForm').addEventListener('submit',e=>{e.preventDefault();const edit=$('patientEditId').value;const p={id:edit||uid('OPD'),name:$('pName').value.trim(),dob:$('pDob').value,gender:$('pGender').value,phone:$('pPhone').value.trim(),email:$('pEmail').value.trim(),blood:$('pBlood').value,emergency:$('pEmergency').value.trim(),district:$('pDistrict').value,address:$('pAddress').value.trim(),created:edit?(patientById(edit)?.created||today()):today()};if(!p.name||!p.phone){toast('Name and mobile number are required.');return;}if(edit)patients=patients.map(x=>x.id===edit?p:x);else patients.push(p);bootstrap.Modal.getInstance($('patientModal')).hide();resetPatientForm();renderAll();toast(edit?'Patient updated':'Patient registered');});
$('appointmentForm').addEventListener('submit',e=>{e.preventDefault();const a={id:uid('APT'),patientId:$('aPatient').value,doctorId:$('aDoctor').value,date:$('aDate').value,time:$('aTime').value,type:$('aType').value,reason:$('aReason').value.trim(),status:'Booked'};if(!a.patientId||!a.doctorId||!a.date||!a.time)return;appointments.push(a);e.target.reset();$('aDate').value=today();bootstrap.Modal.getInstance($('appointmentModal')).hide();renderAll();toast('Appointment booked');});
$('visitForm').addEventListener('submit',e=>{e.preventDefault();const medicines=collectMedicines();if([...$('medicineRows').querySelectorAll('[data-med="name"]')].some(el=>el.value.trim()==='')){toast('Complete or remove any blank medicine row.');return;}visits.push({id:uid('VIS'),patientId:$('vPatient').value,doctorId:$('vDoctor').value,date:today(),temp:$('vTemp').value,bp:$('vBp').value.trim(),pulse:$('vPulse').value,spo2:$('vSpo2').value,notes:$('vNotes').value.trim(),plan:$('vPlan').value.trim(),medicines});e.target.reset();$('medicineRows').innerHTML='';addMedicineRow();bootstrap.Modal.getInstance($('visitModal')).hide();renderAll();toast('OP visit and prescription saved');});
$('billingForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number($('bAmount').value),paid=Number($('bPaid').value);if(paid>amount){toast('Paid amount cannot exceed bill amount.');return;}bills.push({id:uid('BILL'),patientId:$('bPatient').value,serviceId:$('bService').value,date:today(),amount,paid,method:$('bMethod').value});e.target.reset();$('bPaid').value='0';bootstrap.Modal.getInstance($('billingModal')).hide();renderAll();toast('Bill saved');});
$('doctorForm').addEventListener('submit',e=>{e.preventDefault();doctors.push({id:uid('DOC'),name:$('dName').value.trim(),department:$('dDepartment').value.trim(),fee:Number($('dFee').value)});e.target.reset();bootstrap.Modal.getInstance($('doctorModal')).hide();renderAll();toast('Doctor / service added');});
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-page]');if(nav){showPage(nav.dataset.page);return;}
 const goto=e.target.closest('[data-goto]');if(goto){showPage(goto.dataset.goto);return;}
 const open=e.target.closest('[data-open-modal]');if(open){openModal(open.dataset.openModal);return;}
 const edit=e.target.closest('[data-edit-patient]');if(edit){const p=patientById(edit.dataset.editPatient);if(!p)return;resetPatientForm();$('patientEditId').value=p.id;['Name','Dob','Gender','Phone','Email','Blood','Emergency','District','Address'].forEach(k=>{const map={Name:'name',Dob:'dob',Gender:'gender',Phone:'phone',Email:'email',Blood:'blood',Emergency:'emergency',District:'district',Address:'address'};$('p'+k).value=p[map[k]]||'';});$('patientModal').querySelector('.modal-title').textContent='Edit patient';openModal('patientModal');return;}
 const stat=e.target.closest('[data-appt-status]');if(stat){const a=appointments.find(x=>x.id===stat.dataset.apptStatus);if(a){a.status=stat.dataset.status;renderAll();toast('Appointment status updated');}return;}
 const del=e.target.closest('[data-delete-doctor]');if(del){const id=del.dataset.deleteDoctor;if(appointments.some(a=>a.doctorId===id)||visits.some(v=>v.doctorId===id)||bills.some(b=>b.serviceId===id)){toast('Cannot remove: this doctor/service has linked records.');return;}if(confirm('Remove this doctor/service from the directory?')){doctors=doctors.filter(d=>d.id!==id);renderAll();toast('Doctor/service removed');}return;}
 const printP=e.target.closest('[data-print-patient]');if(printP){const p=patientById(printP.dataset.printPatient);if(p)printHTML('Patient registration',`<h2>Patient details</h2>${[['Patient ID',p.id],['Name',p.name],['Date of birth',p.dob],['Gender',p.gender],['Mobile',p.phone],['Email',p.email],['Blood group',p.blood],['Emergency contact',p.emergency],['District',p.district],['Address',p.address]].map(([k,v])=>`<div class="line"><span class="label">${escapeHTML(k)}</span>${escapeHTML(v||'—')}</div>`).join('')}`);return;}
 const printB=e.target.closest('[data-print-bill]');if(printB){const b=bills.find(x=>x.id===printB.dataset.printBill);if(b)printHTML('OP bill',`<h2>Bill details</h2>${[['Bill ID',b.id],['Date',b.date],['Patient',patientName(b.patientId)],['Service',doctorName(b.serviceId)],['Amount',money(b.amount)],['Paid',money(b.paid)],['Balance',money(Math.max(0,b.amount-b.paid))],['Payment method',b.method]].map(([k,v])=>`<div class="line"><span class="label">${escapeHTML(k)}</span>${escapeHTML(v)}</div>`).join('')}`);return;}
 const waP=e.target.closest('[data-wa-patient]');if(waP){const p=patientById(waP.dataset.waPatient);if(p)sendWhatsApp(p.phone,patientRegistrationMessage(p));return;}
 const waB=e.target.closest('[data-wa-bill]');if(waB){const b=bills.find(x=>x.id===waB.dataset.waBill);if(b)sendWhatsApp(patientById(b.patientId)?.phone,billMessage(b));return;}
 const waV=e.target.closest('[data-wa-visit]');if(waV){const v=visits.find(x=>x.id===waV.dataset.waVisit);if(v)sendWhatsApp(patientById(v.patientId)?.phone,prescriptionMessage(v));return;}
 const printV=e.target.closest('[data-print-visit]');if(printV){const v=visits.find(x=>x.id===printV.dataset.printVisit);if(v){const meds=(v.medicines||[]).map((m,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(m.name)}</td><td>${escapeHTML(m.dose||'—')}</td><td>${escapeHTML(m.route||'—')}</td><td>${escapeHTML(m.frequency||'—')}</td><td>${escapeHTML(m.duration||'—')}</td><td>${escapeHTML(m.instructions||'—')}</td></tr>`).join('');printHTML('OP consultation & prescription',`<h2>Patient and visit</h2>${[['Visit ID',v.id],['Date',v.date],['Patient',patientName(v.patientId)],['Doctor',doctorName(v.doctorId)],['Vitals',[v.temp?`Temp ${v.temp}°C`:'',v.bp?`BP ${v.bp}`:'',v.pulse?`Pulse ${v.pulse}`:'',v.spo2?`SpO₂ ${v.spo2}%`:''].filter(Boolean).join(' · ')||'—'],['Visit notes',v.notes],['Plan / follow-up',v.plan||'—']].map(([k,val])=>`<div class="line"><span class="label">${escapeHTML(k)}</span>${escapeHTML(val)}</div>`).join('')}<h2>Prescription</h2><table style="width:100%;border-collapse:collapse" border="1" cellpadding="7"><thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${meds||'<tr><td colspan="7">No medicines recorded</td></tr>'}</tbody></table><p style="margin-top:30px">Clinician signature: __________________________</p>`);}return;}
 const pay=e.target.closest('[data-pay-bill]');if(pay){const b=bills.find(x=>x.id===pay.dataset.payBill);if(!b)return;const due=Number(b.amount)-Number(b.paid),raw=prompt(`Balance due ${money(due)}. Enter additional payment amount:`);if(raw===null)return;const amount=Number(raw);if(!Number.isFinite(amount)||amount<=0||amount>due){toast('Enter a valid amount not greater than the balance.');return;}b.paid=Number(b.paid)+amount;renderAll();toast('Payment recorded');}
});
['patientSearch','appointmentSearch','billingSearch'].forEach(id=>$(id).addEventListener('input',()=>({patientSearch:renderPatients,appointmentSearch:renderAppointments,billingSearch:renderBilling})[id]()));
['appointmentDateFilter','appointmentStatusFilter'].forEach(id=>$(id).addEventListener('change',renderAppointments));
$('exportData').addEventListener('click',exportJSON);$('downloadReport').addEventListener('click',downloadCSV);
$('clearData').addEventListener('click',()=>{if(confirm('Clear all patient, appointment, visit and billing records from this browser? This cannot be undone.')){patients=[];appointments=[];visits=[];bills=[];renderAll();toast('Demo records cleared');}});
$('addMedicine').addEventListener('click',()=>addMedicineRow());
$('medicineRows').addEventListener('click',e=>{const b=e.target.closest('.remove-medicine');if(b)b.closest('tr').remove();});
$('visitModal').addEventListener('show.bs.modal',()=>{if(!$('medicineRows').children.length)addMedicineRow();});
$('visitModal').addEventListener('hidden.bs.modal',()=>{if(!$('medicineRows').children.length)addMedicineRow();});
$('menuToggle').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
document.querySelectorAll('[data-open-modal]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.openModal==='appointmentModal')$('aDate').value=today();}));
$('todayDate').textContent=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});$('aDate').value=today();
renderAll();
})();