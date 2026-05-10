# Deploying the Cloud Functions

## One-time setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Set your VAPID private key as a Firebase config secret
Your VAPID private key (the one paired with the public key in index.html):
```bash
firebase functions:config:set vapid.private_key="YOUR_VAPID_PRIVATE_KEY"
```
> Get your private key from wherever you generated the VAPID pair.
> If you need to regenerate them, run: `npx web-push generate-vapid-keys`
> Then update the public key in index.html AND sw.js too.

### 3. Install function dependencies
```bash
cd functions
npm install
cd ..
```

### 4. Deploy
```bash
firebase deploy --only functions
```

## What the functions do

- **onNudge** — triggers when either person taps "Thinking of you!", sends a push notification to the other person's phone
- **onNewTask** — triggers when a new task is added, notifies the other person

## Re-deploying after changes
```bash
firebase deploy --only functions
```
