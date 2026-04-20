let currentRole = null;
let currentUser = null;
let selectedRole = null;
const API_BASE = 'http://localhost:3000';
const chatHistory = { patient: [], doctor: [] };

const DEMO_USERS = {
  'patient@ayur.com': { password: 'patient123', role: 'patient', name: 'Arjun Singh' },
  'doctor@ayur.com':  { password: 'doctor123',  role: 'doctor',  name: 'Dr. Priya Sharma' }
};

// ── AUTH TAB ──
function switchAuthTab(tab) {
  document.getElementById('form-signin').style.display   = tab === 'signin'   ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-signin').classList.toggle('active',   tab === 'signin');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  selectedRole = null;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
}

function selectRole(role) {
  selectedRole = role;
  document.getElementById('role-patient').classList.toggle('selected', role === 'patient');
  document.getElementById('role-doctor').classList.toggle('selected',  role === 'doctor');
}

// ── SIGN IN ──
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value;
  const errEl = document.getElementById('login-error');
  const u = DEMO_USERS[email];
  if (u && u.password === pwd) {
    errEl.style.display = 'none';
    currentUser = { email, name: u.name, role: u.role };
    enterApp(u.role);
    return;
  }
  // Uncomment for backend: 
  loginFromBackend(email, pwd);
  errEl.style.display = 'block';
}

function quickLogin(role) {
  currentUser = role === 'patient'
    ? { email: 'patient@ayur.com', name: 'Arjun Singh',       role: 'patient' }
    : { email: 'doctor@ayur.com',  name: 'Dr. Priya Sharma',  role: 'doctor'  };
  enterApp(role);
}

async function loginFromBackend(email, pwd) {
  try {
    const res  = await fetch(`${API_BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password: pwd }) });
    const data = await res.json();
    if (data.token) { localStorage.setItem('ayur_token', data.token); currentUser = data.user; enterApp(data.role); }
    else document.getElementById('login-error').style.display = 'block';
  } catch { document.getElementById('login-error').style.display = 'block'; }
}

// ── REGISTER ──
function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pwd   = document.getElementById('reg-pwd').value;
  const pwd2  = document.getElementById('reg-pwd2').value;
  const errEl = document.getElementById('register-error');
  const okEl  = document.getElementById('register-success');
  errEl.style.display = 'none'; okEl.style.display = 'none';

  if (!name || !email || !pwd || !selectedRole) { errEl.textContent = 'Please fill all fields and select a role.'; errEl.style.display = 'block'; return; }
  if (pwd.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  if (pwd !== pwd2)   { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

  // Uncomment for backend: 
  registerFromBackend(name, email, pwd, selectedRole);

  okEl.style.display = 'block';
  setTimeout(() => { switchAuthTab('signin'); document.getElementById('login-email').value = email; }, 1500);
}

async function registerFromBackend(name, email, pwd, role) {
  try {
    const res  = await fetch(`${API_BASE}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password: pwd, role }) });
    console.log(res)
    const data = await res.json();
    if (data.token) { localStorage.setItem('ayur_token', data.token); currentUser = data.user; enterApp(role); }
    else { document.getElementById('register-error').textContent = data.message || 'Registration failed.'; document.getElementById('register-error').style.display = 'block'; }
  } catch { document.getElementById('register-error').textContent = 'Server error. Try again.'; document.getElementById('register-error').style.display = 'block'; }
}

// ── ENTER APP ──
function enterApp(role) {
  currentRole = role;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (role === 'login') { document.getElementById('screen-login').classList.add('active'); return; }
  document.getElementById(`screen-${role}`).classList.add('active');

  if (currentUser) {
    if (role === 'patient') {
      const first    = currentUser.name.split(' ')[0];
      const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      document.getElementById('patient-greeting').textContent      = `Namaste, ${first}`;
      document.getElementById('patient-avatar').textContent        = initials;
      document.getElementById('settings-patient-name').textContent  = currentUser.name;
      document.getElementById('settings-patient-email').textContent = currentUser.email;
    } else {
      const initials = currentUser.name.replace('Dr. ','').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      document.getElementById('doctor-avatar').textContent         = initials;
      document.getElementById('doctor-name-display').textContent   = currentUser.name;
      document.getElementById('settings-doctor-name').textContent  = currentUser.name;
      document.getElementById('settings-doctor-email').textContent = currentUser.email;
    }
  }
}

function logout() {
  currentUser = null; currentRole = null;
  localStorage.removeItem('ayur_token');
  chatHistory.patient = []; chatHistory.doctor = [];
  enterApp('login');
}

// ── PAGE SWITCHING ──
function switchPage(role, page) {
  const screen = document.getElementById(`screen-${role}`);
  screen.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const target = document.getElementById(`page-${role}-${page}`);
  if (target) {
    target.style.display = (page === 'ayurbot' || page === 'assistant') ? 'flex' : 'block';
    target.classList.add('active');
  }
  const prefix = role === 'patient' ? 'pnav' : 'dnav';
  screen.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById(`${prefix}-${page}`);
  if (nav) nav.classList.add('active');
}

function switchDocTab(tab) {
  document.getElementById('doc-patients-tab').style.display = tab === 'patients' ? 'block' : 'none';
  document.getElementById('doc-today-tab').style.display    = tab === 'today'    ? 'block' : 'none';
  document.getElementById('tab-patients').classList.toggle('active', tab === 'patients');
  document.getElementById('tab-today').classList.toggle('active',    tab === 'today');
}

// ── CHAT ──
const PROMPTS = {
  patient: `You are AyurBot, a warm Ayurvedic Panchakarma therapy assistant. The patient has a Vata-Pitta constitution, Day 12 of a 21-day detox. Be warm and concise — 2-4 sentences max.`,
  doctor:  `You are AyurBot, a clinical AI assistant for an Ayurvedic doctor. Patients: Arjun Singh (Vata-Pitta, 21-day Detox, 78%), Meera Patel (Kapha-Vata, Rejuvenation, 45%), Raj Kumar (Pitta, Stress Relief, 92%). Be professional and concise — 2-4 sentences max.`
};

async function sendChat(role) {
  const inputEl = document.getElementById(`${role}-chat-input`);
  const msg = inputEl.value.trim();
  if (!msg) return;
  inputEl.value = '';
  addChatMsg(role, 'user', msg);
  chatHistory[role].push({ role: 'user', content: msg });
  const typing = addTyping(role);
  try {

    // ------------------------------------------------- Logic for Ayurbot ----- yahaan add krna hofga------------------------------------
    const res  = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system: PROMPTS[role], messages: chatHistory[role] }) });
    const data = await res.json();
    typing.remove();
    const reply = data.content?.[0]?.text || 'I could not process that. Please try again.';
    chatHistory[role].push({ role: 'assistant', content: reply });
    addChatMsg(role, 'bot', reply);
  } catch {
    typing.remove();
    const reply = getFallback(msg);
    chatHistory[role].push({ role: 'assistant', content: reply });
    addChatMsg(role, 'bot', reply);
  }
}

function getFallback(msg) {
  const m = msg.toLowerCase();
  if (m.includes('schedule') || m.includes('book')) return 'I can help you schedule a session. Go to the Sessions tab or tell me your preferred date and time.';
  if (m.includes('plan') || m.includes('treatment')) return 'Your plan includes Abhyanga, Shirodhara, and Panchakarma Assessment. You are 78% through your 21-day detox.';
  if (m.includes('dosha') || m.includes('vata') || m.includes('pitta')) return 'As a Vata-Pitta type, you benefit from warm, grounding therapies like Abhyanga and calming Shirodhara.';
  return 'Namaste! I am here to support your Panchakarma journey. For personalised advice, consult your doctor at your next session.';
}

function addChatMsg(role, sender, text) {
  const c   = document.getElementById(`${role}-chat-messages`);
  const now = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const div = document.createElement('div');
  div.className = `chat-msg ${sender === 'bot' ? 'bot' : 'user'}`;
  div.innerHTML = `<div class="bubble">${text}</div><div class="time">${now}</div>`;
  c.appendChild(div); c.scrollTop = c.scrollHeight;
  return div;
}

function addTyping(role) {
  const c   = document.getElementById(`${role}-chat-messages`);
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = '<div class="bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>';
  c.appendChild(div); c.scrollTop = c.scrollHeight;
  return div;
}

function quickPrompt(role, text) { document.getElementById(`${role}-chat-input`).value = text; sendChat(role); }

// ── MODALS ──
function openReschedule(name) {
  document.getElementById('reschedule-therapy-name').textContent = name;
  document.getElementById('rs-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('reschedule-modal').classList.add('open');
}

function submitReschedule() {
  const date = document.getElementById('rs-date').value;
  const time = document.getElementById('rs-time').value;
  closeModal('reschedule-modal');
  showToast(`Rescheduled to ${date} at ${time}`);
  // Backend: fetch(`${API_BASE}/api/sessions/:id/reschedule`, { method:'PUT', body: JSON.stringify({ newDate: date, newTime: time, reason }) })
}

const PATIENT_DATA = {
  'Arjun Singh': { constitution:'Vata-Pitta', program:'21-day Detox', progress:'78% (Day 12)', next:'Today 2:30 PM – Abhyanga', doctor:'Dr. Priya Sharma' },
  'Meera Patel':  { constitution:'Kapha-Vata', program:'Rejuvenation',  progress:'45%',           next:'Tomorrow 10:00 AM',          doctor:'Dr. Priya Sharma' },
  'Raj Kumar':    { constitution:'Pitta',       program:'Stress Relief', progress:'92%',           next:'Sep 16 9:00 AM',             doctor:'Dr. Priya Sharma' }
}; 

function viewPatient(name) {
  const d = PATIENT_DATA[name];
  document.getElementById('patient-modal-name').textContent = name;
  document.getElementById('patient-modal-content').innerHTML = `
    <div style="font-size:.88rem;line-height:2.2">
      ${Object.entries({ Constitution: d.constitution, Program: d.program, Progress: d.progress, 'Next Session': d.next, Doctor: d.doctor })
        .map(([k,v]) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:6px 0"><strong>${k}</strong><span style="color:var(--text-muted)">${v}</span></div>`).join('')}
    </div>`;
  document.getElementById('patient-modal').classList.add('open');
}

function openEditPatient(name) {
  const d = PATIENT_DATA[name];
  document.getElementById('ep-name').value         = name;
  document.getElementById('ep-constitution').value = d.constitution;
  document.getElementById('ep-program').value      = d.program;
  document.getElementById('ep-progress').value     = parseInt(d.progress);
  document.getElementById('ep-status').value       = 'active';
  document.getElementById('ep-notes').value        = '';
  document.getElementById('edit-patient-modal').classList.add('open');
}

function submitEditPatient() {
  const name = document.getElementById('ep-name').value;
  closeModal('edit-patient-modal');
  showToast(`${name} updated successfully`);
  // Backend: 
  // fetch(`${API_BASE}/api/patients/:id`, { method:'PUT', body: JSON.stringify({...}) })
}

function filterPatients(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#patient-list .patient-card').forEach(c => {
    c.style.display = c.dataset.name.includes(q) ? 'flex' : 'none';
  });
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, { position:'fixed', bottom:'90px', left:'50%', transform:'translateX(-50%)', background:'var(--green-800)', color:'#fff', padding:'10px 20px', borderRadius:'20px', fontSize:'.85rem', zIndex:'999', whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,.2)' });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
