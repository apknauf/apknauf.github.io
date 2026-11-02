
const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'That email and password combination was not recognized.',
  'auth/invalid-login-credentials': 'That email and password combination was not recognized.',
  'auth/wrong-password': 'That password is incorrect.',
  'auth/user-not-found': 'No account uses that email address. Try signing up instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-password': 'Please enter your password.',
  'auth/email-already-in-use': 'An account with that email already exists. Try logging in instead.',
  'auth/weak-password': 'Passwords must be at least 6 characters long.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Could not reach Firebase. Check your internet connection and try again.',
  'auth/requires-recent-login': 'For your security, please log out and log back in before changing your password.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'The Firebase settings in js/firebase-config.js are not valid.',
  'permission-denied': 'You do not have permission to do that. Make sure you are logged in.',
  'unavailable': 'The database could not be reached. Check your internet connection and try again.',
  'deadline-exceeded': 'The database took too long to respond. Please try again.',
  'timeout': 'The request took too long. Check your internet connection and try again.'
};

export function describeError(error) {
  const code = error && error.code;
  if (code && FRIENDLY_ERRORS[code]) {
    return `${FRIENDLY_ERRORS[code]} (Firebase: ${code})`;
  }
  if (error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function createSpinner() {
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  spinner.setAttribute('aria-hidden', 'true');
  return spinner;
}

export function setStatus(element, type, message) {
  if (!element) {
    return;
  }
  element.className = type ? `status status-${type}` : 'status';
  element.replaceChildren();
  if (!type) {
    return;
  }
  if (type === 'working') {
    element.append(createSpinner());
  }
  element.append(document.createTextNode(message));
}

export function setBusy(button, isBusy, busyLabel) {
  if (!button) {
    return;
  }
  if (isBusy) {
    button.dataset.label = button.textContent;
    button.textContent = busyLabel;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

export function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = new Error('The request timed out.');
      error.code = 'timeout';
      reject(error);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
