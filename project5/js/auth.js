import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth, isConfigured } from './firebase-init.js';
import { setStatus } from './ui.js';

const isProtected = document.body.dataset.protected === 'true';
let isLeaving = false;
let resolveFirstUser;
const firstUser = new Promise((resolve) => {
  resolveFirstUser = resolve;
});

function currentPage() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  return page + window.location.hash;
}

function redirectToLogin() {
  window.location.replace(`index.html?next=${encodeURIComponent(currentPage())}#account`);
}

function updateNav(user) {
  const accountLink = document.getElementById('nav-account');
  const logoutButton = document.getElementById('nav-logout');
  if (accountLink) {
    accountLink.textContent = user ? 'My Account' : 'Log In / Sign Up';
  }
  if (logoutButton) {
    logoutButton.hidden = !user;
  }
}

function showGateError(message) {
  setStatus(document.getElementById('auth-gate'), 'error', message);
}

export function logOut() {
  isLeaving = true;
  return signOut(auth)
    .then(() => {
      window.location.href = 'index.html?signedout=1#account';
    })
    .catch((error) => {
      isLeaving = false;
      throw error;
    });
}

export function getUser() {
  return firstUser;
}

function initNavLogout() {
  const button = document.getElementById('nav-logout');
  const message = document.getElementById('nav-message');
  if (!button) {
    return;
  }
  button.addEventListener('click', () => {
    button.disabled = true;
    button.textContent = 'Logging out…';
    setStatus(message, 'working', 'Logging you out…');
    logOut().catch(() => {
      button.disabled = false;
      button.textContent = 'Log Out';
      setStatus(message, 'error', 'Logout failed. Check your connection and try again.');
    });
  });
}

initNavLogout();

if (!isConfigured) {
  showGateError('Firebase is not set up yet. Add your project settings to js/firebase-config.js.');
  resolveFirstUser(null);
} else {
  onAuthStateChanged(auth, (user) => {
    updateNav(user);
    resolveFirstUser(user);
    if (!isProtected) {
      return;
    }
    if (user) {
      document.body.classList.add('auth-ready');
    } else if (!isLeaving) {
      redirectToLogin();
    }
  });
}
