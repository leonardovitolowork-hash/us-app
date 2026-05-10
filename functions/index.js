const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.database();

// VAPID keys — must match the public key in index.html
const VAPID_PUBLIC  = 'BH2B0QVFuX6fzgQ5z-XirXThGKIuv2QjOJ4TdONScwKnCgsmGUUm3SzdoajOi6OwwPdRx60cJ4m_kydKg1-D-QU';
const VAPID_PRIVATE = functions.config().vapid.private_key;
const VAPID_EMAIL   = 'mailto:leonardovitolowork@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// Helper: send push to a subscription object stored in Firebase
async function sendPush(subSnap, payload) {
  if (!subSnap.exists()) return;
  const sub = subSnap.val();
  // Firebase stores it as a plain object; web-push needs endpoint + keys
  if (!sub || !sub.endpoint) return;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    console.log('Push sent to', sub.endpoint.slice(-20));
  } catch (err) {
    console.warn('Push failed:', err.statusCode, err.message);
    // If subscription is expired/invalid, clean it up
    if (err.statusCode === 404 || err.statusCode === 410) {
      await subSnap.ref.remove();
    }
  }
}

// ─── TRIGGER 1: Nudge sent ───────────────────────────────────────────────────
// Fires whenever /nudge is written
exports.onNudge = functions.database.ref('/nudge').onWrite(async (change) => {
  const nudge = change.after.val();
  if (!nudge || !nudge.from || !nudge.ts) return null;

  // Send to the OTHER person
  const target = nudge.from === 'Leo' ? 'Mimi' : 'Leo';
  const subSnap = await db.ref('pushTokens/' + target).once('value');

  const emoji = nudge.from === 'Leo' ? '💙' : '🌸';
  await sendPush(subSnap, {
    title: 'Us ♥',
    body: emoji + ' ' + nudge.from + ' is thinking of you! 💕',
    icon: '/us-app/icon-192.png',
    badge: '/us-app/icon-192.png',
    tag: 'nudge',
    url: 'https://leonardovitolowork-hash.github.io/us-app/'
  });

  return null;
});

// ─── TRIGGER 2: New task added ───────────────────────────────────────────────
// Fires whenever a new task is created under /tasks
exports.onNewTask = functions.database.ref('/tasks/{taskId}').onCreate(async (snap) => {
  const task = snap.val();
  if (!task || !task.addedBy || !task.text) return null;

  // Notify the OTHER person (don't notify yourself)
  const target = task.addedBy === 'Leo' ? 'Mimi' : 'Leo';
  const subSnap = await db.ref('pushTokens/' + target).once('value');

  const assign = task.assign === 'Leo' ? '💙 Leo' : task.assign === 'Mimi' ? '🌸 Mimi' : '💑 Both';
  const urgent = task.urgent ? ' ⚡' : '';

  await sendPush(subSnap, {
    title: (task.addedBy === 'Leo' ? '💙 Leo' : '🌸 Mimi') + ' added a task' + urgent,
    body: '"' + task.text + '" → ' + assign,
    icon: '/us-app/icon-192.png',
    badge: '/us-app/icon-192.png',
    tag: 'new-task-' + snap.key,
    url: 'https://leonardovitolowork-hash.github.io/us-app/'
  });

  return null;
});
