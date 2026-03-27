// webApp/src/main.js
import './style.css';
import { db, auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import * as api from './api.js';
import * as ui from './ui.js';

// State
let currentUser = null;
let allTravels = [];

// UI setup
const entityList = document.getElementById('entity-list');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');

// Auth Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.body.classList.add('authenticated');
    loadData(user.uid);
  } else {
    currentUser = null;
    document.body.classList.remove('authenticated');
    showLogin();
  }
});

function showLogin() {
  content.innerHTML = `
    <div class="login-container glass-card">
      <h2>KMP Travel Manager</h2>
      <p>Log in to access your detailed travel reports.</p>
      <form id="login-form">
        <div class="form-group"><label>Email</label><input type="email" id="login-email" required></div>
        <div class="form-group"><label>Password</label><input type="password" id="login-pass" required></div>
        <button type="submit" class="btn-primary">Sign In</button>
      </form>
      <p id="login-error" class="text-danger" style="margin-top: 1rem;"></p>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch (e) { document.getElementById('login-error').textContent = e.message; }
  });
}

async function loadData(uid) {
  content.innerHTML = `<div class="loading">Fetching Travels...</div>`;
  try {
    allTravels = await api.fetchTravels(db, uid);
    navigateTo('travels');
  } catch (error) {
    content.innerHTML = `<div class="alert error">Error: ${error.message}</div>`;
  }
}

function navigateTo(view) {
  if (!currentUser && view !== 'simulator') return showLogin();
  document.querySelectorAll('#entity-list li').forEach(li => li.classList.toggle('active', li.dataset.view === view));
  content.innerHTML = '';
  switch (view) {
    case 'travels': ui.renderTravels(allTravels, content); break;
    case 'simulator': ui.renderSimulator(content); break;
    case 'logout': signOut(auth); break;
    default: content.textContent = 'View not found';
  }
}

entityList.addEventListener('click', e => {
  const li = e.target.closest('li[data-view]');
  if (li) navigateTo(li.dataset.view);
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});
