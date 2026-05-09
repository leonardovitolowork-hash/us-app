const { onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();

// ====================================================
// PASTE YOUR VAPID KEYS HERE (see setup instructions)
// ====================================================
const VAPID_PUBLIC  = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';
const VAPID_PRIVATE = 'REPLACE_WITH_YOUR_VAPID_PRIVATE_KEY';
const VAPID_EMAIL   = 'mailto:leonardovitolowork@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

exports.sendNudge = onValueWritten(
  { ref: '/nudge', region: 'europe-west1' },
  async (event) => {
    const nudge = event.data.after.val();
    if (!nudge || !nudge.from || !nudge.ts) return null;

    const sender   = nudge.from;                          // 'Leo' or 'Mimi'
    const receiver = sender === 'Leo' ? 'Mimi' : 'Leo';  // the other person
    const emoji    = sender === 'Leo' ? '💙' : '🌸';

    const title = `${emoji} ${sender} is thinking of you!`;
    const body  = `Open the app to send a nudge back 💕`;

    // Load the receiver's push subscription from Firebase
    const db = admin.database();
    const snap = await db.ref(`pushTokens/${receiver}`).get();
    if (!snap.exists()) {
      console.log(`No push token for ${receiver}`);
      return null;
    }

    const subscription = snap.val();
    const payload = JSON.stringify({ title, body, icon: './icon-192.png', badge: './icon-192.png' });

    try {
      await webpush.sendNotification(subscription, payload);
      console.log(`Nudge sent from ${sender} to ${receiver}`);
    } catch (err) {
      console.error('Push failed:', err);
      // Clean up expired subscription
      if (err.statusCode === 410) {
        await db.ref(`pushTokens/${receiver}`).remove();
      }
    }
    return null;
  }
);
