const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.database();

const VAPID_PUBLIC  = 'BH2ScZoN00qrKzq9dfoI5hey7FEiqf7OKeroOYcKIkWAUfSByh9YTDnPPV9OatgwtYD7IZKj1u6lDZzv2hwSyqI';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = 'mailto:leonardovitolowork@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

async function sendPush(subSnap, payload) {
  if (!subSnap.exists()) return;
  const sub = subSnap.val();
  if (!sub || !sub.endpoint) return;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    console.log('Push sent!');
  } catch (err) {
    console.warn('Push failed:', err.statusCode, err.message);
    if (err.statusCode === 404 || err.statusCode === 410) {
      await subSnap.ref.remove();
    }
  }
}

exports.onNudge = functions.database.ref('/nudge').onWrite(async (change) => {
  const nudge = change.after.val();
  if (!nudge || !nudge.from || !nudge.ts) return null;
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

exports.onNewTask = functions.database.ref('/tasks/{taskId}').onCreate(async (snap) => {
  const task = snap.val();
  if (!task || !task.addedBy || !task.text) return null;
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
