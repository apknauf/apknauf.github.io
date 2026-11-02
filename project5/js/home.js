import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth, isConfigured } from './firebase-init.js';
import { logOut } from './auth.js';
import { setStatus, setBusy, describeError } from './ui.js';

const el = (id) => document.getElementById(id);

const loadingStatus = el('auth-loading');
const redirectNotice = el('redirect-notice');
const signedOutView = el('signed-out-view');
const signedInView = el('signed-in-view');
const accountMessage = el('account-message');

const loginForm = el('login-form');
const signupForm = el('signup-form');
const passwordForm = el('password-form');
const showLoginButton = el('show-login');
const showSignupButton = el('show-signup');

const params = new URLSearchParams(window.location.search);
const nextPage = safeNextPage(params.get('next'));


function safeNextPage(value) {
  if (!value) {
    return null;
  }
  return /^[a-z0-9-]+\.html(#[a-z0-9-]*)?$/i.test(value) ? value : null;
}

function showRedirectNotice() {
  if (nextPage) {
    redirectNotice.textContent = 'Please log in or sign up to open that page. You will be taken there as soon as you are signed in.';
    redirectNotice.hidden = false;
  } else if (params.get('signedout') === '1') {
    redirectNotice.textContent = 'You have been logged out. Log in again any time to keep exploring.';
    redirectNotice.hidden = false;
  }
}

function showMode(mode) {
  const isLogin = mode === 'login';
  loginForm.hidden = !isLogin;
  signupForm.hidden = isLogin;
  showLoginButton.setAttribute('aria-pressed', String(isLogin));
  showSignupButton.setAttribute('aria-pressed', String(!isLogin));
  setStatus(el('login-status'), '', '');
  setStatus(el('signup-status'), '', '');
  (isLogin ? el('login-email') : el('signup-email')).focus();
}

function goToNextPage() {
  if (nextPage) {
    window.location.href = nextPage;
  }
}

function handleLogin(event) {
  event.preventDefault();
  const status = el('login-status');
  const button = loginForm.querySelector('button[type="submit"]');
  setBusy(button, true, 'Logging in…');
  setStatus(status, 'working', 'Checking your email and password…');
  signInWithEmailAndPassword(auth, el('login-email').value.trim(), el('login-password').value)
    .then(() => {
      loginForm.reset();
      setStatus(status, '', '');
      setStatus(accountMessage, 'success', nextPage ? 'Logged in! Taking you to your page…' : 'Logged in! Welcome back.');
      goToNextPage();
    })
    .catch((error) => {
      setStatus(status, 'error', describeError(error));
    })
    .finally(() => setBusy(button, false));
}

function handleSignup(event) {
  event.preventDefault();
  const status = el('signup-status');
  const button = signupForm.querySelector('button[type="submit"]');
  const password = el('signup-password').value;
  if (password !== el('signup-confirm').value) {
    setStatus(status, 'error', 'The two passwords do not match. Please type them again.');
    el('signup-confirm').focus();
    return;
  }
  setBusy(button, true, 'Creating account…');
  setStatus(status, 'working', 'Creating your account…');
  createUserWithEmailAndPassword(auth, el('signup-email').value.trim(), password)
    .then(() => {
      signupForm.reset();
      setStatus(status, '', '');
      setStatus(accountMessage, 'success', nextPage ? 'Account created! Taking you to your page…' : 'Account created! You are now signed in.');
      goToNextPage();
    })
    .catch((error) => {
      setStatus(status, 'error', describeError(error));
    })
    .finally(() => setBusy(button, false));
}

function handlePasswordChange(event) {
  event.preventDefault();
  const status = el('password-status');
  const button = passwordForm.querySelector('button[type="submit"]');
  const user = auth.currentUser;
  const currentPassword = el('current-password').value;
  const newPassword = el('new-password').value;

  if (newPassword !== el('confirm-password').value) {
    setStatus(status, 'error', 'The new passwords do not match. Please type them again.');
    el('confirm-password').focus();
    return;
  }
  if (newPassword === currentPassword) {
    setStatus(status, 'error', 'Your new password must be different from your current password.');
    el('new-password').focus();
    return;
  }
  if (!user) {
    setStatus(status, 'error', 'You need to be logged in to change your password.');
    return;
  }

  setBusy(button, true, 'Updating…');
  setStatus(status, 'working', 'Updating your password…');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  reauthenticateWithCredential(user, credential)
    .then(() => updatePassword(user, newPassword))
    .then(() => {
      passwordForm.reset();
      setStatus(status, 'success', 'Your password was changed. Use the new password next time you log in.');
    })
    .catch((error) => {
      const isWrongCurrent = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password';
      setStatus(status, 'error', isWrongCurrent
        ? `Your current password is incorrect. (Firebase: ${error.code})`
        : describeError(error));
    })
    .finally(() => setBusy(button, false));
}

function handleLogout() {
  const button = el('logout-button');
  setBusy(button, true, 'Logging out…');
  setStatus(accountMessage, 'working', 'Logging you out…');
  logOut().catch((error) => {
    setBusy(button, false);
    setStatus(accountMessage, 'error', describeError(error));
  });
}

function renderAccount(user) {
  loadingStatus.hidden = true;
  signedOutView.hidden = Boolean(user);
  signedInView.hidden = !user;
  if (user) {
    el('user-email').textContent = user.email;
  } else {
    setStatus(accountMessage, '', '');
  }
}

showRedirectNotice();
showLoginButton.addEventListener('click', () => showMode('login'));
showSignupButton.addEventListener('click', () => showMode('signup'));
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
passwordForm.addEventListener('submit', handlePasswordChange);
el('logout-button').addEventListener('click', handleLogout);

if (isConfigured) {
  onAuthStateChanged(auth, renderAccount);
} else {
  setStatus(loadingStatus, 'error', 'Firebase is not set up yet. Add your project settings to js/firebase-config.js.');
}
