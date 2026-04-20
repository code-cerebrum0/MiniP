// ── STATE ──
let currentRole = null;
let API_BASE = 'http://localhost:3000'; // Set your backend URL here e.g. 'http://localhost:3000'

// ── AUTH ──
const DEMO_USERS = {
  'patient@ayur.com': { password: 'patient123', role: 'patient' },
  'doctor@ayur.com':  { password: 'doctor123',  role: 'doctor'  }
};

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value.trim();
  const errEl = document.getElementById('login-error');
  
  // Try demo credentials
  const user = DEMO_USERS[email];
  if (user && user.password === pwd) {
    errEl.style.display = 'none';
    enterApp(user.role);
    return;
  }
  
  // If you have a backend, uncomment:
  const success = await loginFromBackend(email, pwd);
  if ( !success){
      errEl.style.display = 'block';

  }
}

function quickLogin(role) { enterApp(role); }

async function loginFromBackend(email, pwd) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: pwd })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('ayur_token', data.token);
      enterApp(data.role);
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  } catch(e) { document.getElementById('login-error').style.display = 'block'; }
}

function enterApp(role) {
  currentRole = role;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${role}`).classList.add('active');
}

function logout() { enterApp('login'); currentRole = null; }

function switchRole() {
  const newRole = currentRole === 'patient' ? 'doctor' : 'patient';
  enterApp(newRole);
}

// Override enterApp for login screen
function enterApp(role) {
  currentRole = role;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (role === 'login') {
    document.getElementById('screen-login').classList.add('active');
  } else {
    document.getElementById(`screen-${role}`).classList.add('active');
  }
}

// ── PAGE SWITCHING ──
function switchPage(role, page) {
  // Hide all pages in role's screen
  const screen = document.getElementById(`screen-${role}`);
  screen.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  
  // Show target page
  const target = document.getElementById(`page-${role}-${page}`);
  if (target) {
    if (page === 'ayurbot' || page === 'assistant') {
      target.style.display = 'flex';
    } else if (page === 'settings') {
      target.style.display = 'flex';
    } else {
      target.style.display = 'block';
    }
    target.classList.add('active');
  }

  // Update nav
  const prefix = role === 'patient' ? 'pnav' : 'dnav';
  screen.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById(`${prefix}-${page}`);
  if (navItem) navItem.classList.add('active');
}

function switchDocTab(tab) {
  document.getElementById('doc-patients-tab').style.display = tab === 'patients' ? 'block' : 'none';
  document.getElementById('doc-today-tab').style.display = tab === 'today' ? 'block' : 'none';
  document.getElementById('tab-patients').classList.toggle('active', tab === 'patients');
  document.getElementById('tab-today').classList.toggle('active', tab === 'today');
}

function goToChat(role) {
  if (role === 'patient') switchPage('patient', 'ayurbot');
  else switchPage('doctor', 'assistant');
}

// ── CHAT ──
const SYSTEM_PROMPT_PATIENT = `You are AyurBot, an Ayurvedic Panchakarma therapy assistant for patients. The current patient is Arjun Singh with Vata-Pitta constitution on Day 12 of a 21-day detox program. Be warm, supportive, and concise. Provide guidance about Panchakarma therapies, Ayurvedic lifestyle, and answer scheduling questions. Keep responses brief (2-4 sentences max).`;

const SYSTEM_PROMPT_DOCTOR = `You are AyurBot, an AI assistant for Dr. Priya Sharma, an Ayurvedic Specialist. Help with patient management, treatment planning, and clinical queries. Current patients: Arjun Singh (Vata-Pitta, 21-day Detox, 78%), Meera Patel (Kapha-Vata, Rejuvenation, 45%), Raj Kumar (Pitta, Stress Relief, 92%). Be professional and concise (2-4 sentences max).`;

const chatHistory = { patient: [], doctor: [] };

async function sendChat(role) {
  const inputEl = document.getElementById(`${role}-chat-input`);
  const msg = inputEl.value.trim();
  if (!msg) return;
  inputEl.value = '';

  addChatMsg(role, 'user', msg);
  chatHistory[role].push({ role: 'user', content: msg });

  // Show typing
  const typingEl = addTyping(role);

  try {
    const systemPrompt = role === 'patient' ? SYSTEM_PROMPT_PATIENT : SYSTEM_PROMPT_DOCTOR;
    
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: chatHistory[role]
      })
    });
    const data = await res.json();
    typingEl.remove();
    
    const reply = data.content?.[0]?.text || 'I apologize, I could not process that. Please try again.';
    chatHistory[role].push({ role: 'assistant', content: reply });
    addChatMsg(role, 'bot', reply);
  } catch(e) {
    typingEl.remove();
    const fallback = getFallback(msg);
    chatHistory[role].push({ role: 'assistant', content: fallback });
    addChatMsg(role, 'bot', fallback);
  }
}

function getFallback(msg) {
  const m = msg.toLowerCase();
  if (m.includes('schedule') || m.includes('book')) return 'I can help you schedule a therapy session. Please use the Sessions tab or let me know your preferred date and time.';
  if (m.includes('plan') || m.includes('treatment')) return 'Your current treatment plan includes Abhyanga, Shirodhara, and Panchakarma Assessment. You are 78% through your 21-day detox program.';
  if (m.includes('dosha') || m.includes('vata') || m.includes('pitta')) return 'As a Vata-Pitta type, you benefit from warm, grounding therapies like Abhyanga and calming practices like Shirodhara to balance your constitution.';
  return 'Namaste! I\'m here to support your Panchakarma journey. For personalized advice, please consult Dr. Priya Sharma during your next session.';
}

function addChatMsg(role, sender, text) {
  const container = document.getElementById(`${role}-chat-messages`);
  const now = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const div = document.createElement('div');
  div.className = `chat-msg ${sender === 'bot' ? 'bot' : 'user'}`;
  div.innerHTML = `<div class="bubble">${text}</div><div class="time">${now}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addTyping(role) {
  const container = document.getElementById(`${role}-chat-messages`);
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = '<div class="bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function quickPrompt(role, text) {
  document.getElementById(`${role}-chat-input`).value = text;
  sendChat(role);
}

// ── MODALS ──
function openReschedule(name) {
  document.getElementById('reschedule-therapy-name').textContent = name;
  document.getElementById('rs-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('reschedule-modal').classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function submitReschedule() {
  const date = document.getElementById('rs-date').value;
  const time = document.getElementById('rs-time').value;
  closeModal('reschedule-modal');
  showToast(`Session rescheduled to ${date} at ${time}`);
  // POST to backend: fetch(`${API_BASE}/api/sessions/reschedule`, {...})
}

// ── PATIENT ACTIONS ──
function viewPatient(name) {
  document.getElementById('patient-modal-name').textContent = name;
  const info = {
    'Arjun Singh': `<div style="color:var(--text-muted);font-size:.85rem;line-height:1.8"><p><b>Constitution:</b> Vata-Pitta</p><p><b>Program:</b> 21-day Detox</p><p><b>Progress:</b> 78% (Day 12)</p><p><b>Next Session:</b> Today 2:30 PM – Abhyanga</p><p><b>Doctor:</b> Dr. Priya Sharma</p></div>`,
    'Meera Patel': `<div style="color:var(--text-muted);font-size:.85rem;line-height:1.8"><p><b>Constitution:</b> Kapha-Vata</p><p><b>Program:</b> Rejuvenation</p><p><b>Progress:</b> 45%</p><p><b>Next Session:</b> Tomorrow 10:00 AM</p><p><b>Doctor:</b> Dr. Priya Sharma</p></div>`,
    'Raj Kumar':   `<div style="color:var(--text-muted);font-size:.85rem;line-height:1.8"><p><b>Constitution:</b> Pitta</p><p><b>Program:</b> Stress Relief</p><p><b>Progress:</b> 92%</p><p><b>Next Session:</b> Sep 16 9:00 AM</p><p><b>Doctor:</b> Dr. Priya Sharma</p></div>`
  };
  document.getElementById('patient-modal-content').innerHTML = info[name] || '';
  document.getElementById('patient-modal').classList.add('open');
}

function editPatient(name) { showToast(`Edit mode for ${name} — connect to your backend`); }

function filterPatients(query) {
  const cards = document.querySelectorAll('#patient-list .patient-card');
  const q = query.toLowerCase();
  cards.forEach(c => {
    c.style.display = c.dataset.name.includes(q) ? 'flex' : 'none';
  });
}

// ── TOAST ──
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', bottom:'90px', left:'50%', transform:'translateX(-50%)',
    background:'var(--green-800)', color:'#fff', padding:'10px 20px',
    borderRadius:'20px', fontSize:'.85rem', zIndex:'999', whiteSpace:'nowrap',
    boxShadow:'0 4px 16px rgba(0,0,0,.2)', animation:'fadeIn .3s ease'
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});