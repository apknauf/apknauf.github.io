import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase-init.js';
import { getUser } from './auth.js';
import { setStatus, setBusy, describeError, withTimeout } from './ui.js';

const form = document.getElementById('contact-form');
const status = document.getElementById('contact-status');
const button = form.querySelector('button[type="submit"]');
const emailInput = document.getElementById('email');

let currentUser = null;

function prefillEmail() {
  if (currentUser && currentUser.email && !emailInput.value) {
    emailInput.value = currentUser.email;
  }
}

function handleSubmit(event) {
  event.preventDefault();
  if (!currentUser) {
    setStatus(status, 'error', 'Please log in before sending a message.');
    return;
  }
  const values = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    subject: form.elements.subject.value.trim(),
    message: form.elements.message.value.trim()
  };
  const emptyField = Object.keys(values).find((key) => values[key] === '');
  if (emptyField) {
    setStatus(status, 'error', `Please fill in the ${emptyField} field.`);
    form.elements[emptyField].focus();
    return;
  }

  setBusy(button, true, 'Sending…');
  setStatus(status, 'working', 'Sending your message to the database…');
  const save = addDoc(collection(db, 'messages'), {
    ...values,
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });
  withTimeout(save, 15000)
    .then((docRef) => {
      form.reset();
      prefillEmail();
      setStatus(status, 'success', `Thanks, ${values.name}! Your message was received and saved. Reference number: ${docRef.id}`);
    })
    .catch((error) => {
      setStatus(status, 'error', `Your message was not sent. ${describeError(error)}`);
    })
    .finally(() => setBusy(button, false));
}

form.addEventListener('submit', handleSubmit);

getUser().then((user) => {
  currentUser = user;
  prefillEmail();
});
