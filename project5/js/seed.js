import { collection, doc, getDocs, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase-init.js';
import { getUser } from './auth.js';
import { setStatus, setBusy, describeError, withTimeout } from './ui.js';

const button = document.getElementById('seed-button');
const status = document.getElementById('seed-status');
const current = document.getElementById('seed-current');

function checkExisting() {
  setStatus(current, 'working', 'Checking what is already in the database…');
  withTimeout(getDocs(collection(db, 'categories')), 15000)
    .then((snapshot) => {
      const count = snapshot.size;
      setStatus(current, 'success', count
        ? `The database already has ${count} categories. Uploading again will overwrite them with the JSON file.`
        : 'The database has no wildlife categories yet.');
    })
    .catch((error) => setStatus(current, 'error', describeError(error)));
}

function seed() {
  setBusy(button, true, 'Uploading…');
  setStatus(status, 'working', 'Reading data/wildlife.json and uploading it…');
  fetch('data/wildlife.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`data/wildlife.json could not be loaded (status ${response.status}).`);
      }
      return response.json();
    })
    .then((data) => {
      const batch = writeBatch(db);
      data.categories.forEach((category, index) => {
        batch.set(doc(db, 'categories', category.id), { ...category, order: index });
      });
      return withTimeout(batch.commit(), 20000).then(() => data.categories.length);
    })
    .then((count) => {
      setStatus(status, 'success', `Done! ${count} categories were saved to Firestore. Open the Wildlife Explorer to check them.`);
      checkExisting();
    })
    .catch((error) => setStatus(status, 'error', describeError(error)))
    .finally(() => setBusy(button, false));
}

button.addEventListener('click', seed);
getUser().then((user) => {
  if (user) {
    checkExisting();
  }
});
