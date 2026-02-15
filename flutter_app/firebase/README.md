# Firebase Rules (Templates)

These are **secure-by-default** templates for:

- Cloud Firestore rules: `firebase/firestore.rules`
- Firebase Storage rules: `firebase/storage.rules`

They assume:

- Your app uses Firebase Authentication.
- Admin actions are performed by users with a custom claim: `admin: true`.

## Deploying rules (optional)

If you use the Firebase CLI:

1) Install the CLI

```bash
npm i -g firebase-tools
firebase login
```

2) Initialize (choose Firestore + Storage) and select your Firebase project:

```bash
firebase init
```

3) Deploy:

```bash
firebase deploy --only firestore:rules,storage
```

## Important

Never ship with open rules like:

```txt
allow read, write: if true;
```

