# Push Notifications Setup Guide

Follow these steps **once** on your PC to enable nudge push notifications.

---

## Step 1 — Install Node.js
Download and install from https://nodejs.org (LTS version)

---

## Step 2 — Install Firebase CLI
Open a terminal (Command Prompt or PowerShell) and run:
```
npm install -g firebase-tools
```

---

## Step 3 — Generate VAPID keys
In the terminal run:
```
npx web-push generate-vapid-keys
```
This prints two keys. **Copy both** — you'll need them in steps 4 and 5.

---

## Step 4 — Add VAPID keys to the Cloud Function
Open `functions/index.js` and replace:
- `REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY`  → your public key
- `REPLACE_WITH_YOUR_VAPID_PRIVATE_KEY` → your private key

---

## Step 5 — Add VAPID public key to index.html
In `index.html`, find this line near the bottom:
```js
const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';
```
Replace it with your public key.

---

## Step 6 — Log in to Firebase & init functions
In the terminal, navigate to your project folder, then run:
```
firebase login
firebase init functions
```
When asked:
- Use existing project → select `to-do-58ecc`
- Language → **JavaScript**
- Don't overwrite existing files
- Install dependencies → **Yes**

---

## Step 7 — Deploy
```
cd functions
npm install
cd ..
firebase deploy --only functions
```

Done! The Cloud Function is live. Now open the app on both phones,
allow notifications when prompted, and test the nudge button.
