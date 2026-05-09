const { onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();

const VAPID_PUBLIC  = 'BHkKY58uW_N_SIds8DV3zwOPeCQjBN4TTLpbIgvdBk9RwBn-2dr3Ttir8MQCE4cxWuj48xriPPENFlq9W5XZL1I';
const VAPID_PRIVATE = '35H-kBAeFfHcCAXbr_FFEkWOXhubMO2u8oWo71_zDkY';
const VAPID_EMAIL   = 'mailto:leonardovitolowork@gmail.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

exports.sendNudge = onValueWritten(
  { ref: '/nudge', region: 'europe-west1' },
  async (event) => {
    const nudge = event.data.after.val();
    if (!nudge || !nudge.from || !nudge.ts) return null;

    const sender   = nudge.from;
    const receiver = sender === 'Leo' ? 'Mimi' : 'Leo';
    const emoji    = sender === 'Leo' ? '💙' : '🌸';

    const title = `${emoji} ${sender} is thinking of you!`;
    const body  = `Open the app to send a nudge back 💕`;

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
      if (err.statusCode === 410) {
        await db.ref(`pushTokens/${receiver}`).remove();
      }
    }
    return null;
  }
);
