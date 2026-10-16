# D50 Hawaii Lions CRN Report Submission Portal

District cabinet members sign in, choose a cabinet meeting date and their CRN number, and upload
up to 5 files for their quarterly Cabinet Report. Each submission sends the member a confirmation
email. Admins manage cabinet meeting dates and CRN assignments and export submissions.

| Part | Technology |
| --- | --- |
| Web app (`src/`) | React + Vite, Material UI, hosted on Firebase Hosting |
| Sign-in | Firebase Authentication (email/password) |
| Data | Cloud Firestore (`crnUsers`, `config`) |
| Uploaded files | Cloud Storage, stored as `<meeting date>/<CRN>-<email>-<timestamp>-<filename>` |
| Server code (`functions/`) | Cloud Functions for Firebase (Node 24) |
| Security rules | `firestore.rules`, `storage.rules` |
| Confirmation email | Amazon SES, called from the `sendCrnConfirmation` function |

The Firebase project is `hawaii-lions` (see `.firebaserc`).

## Prerequisites

- Node.js 24 (what Cloud Functions runs)
- Firebase CLI: `npm install -g firebase-tools`, then `firebase login`
- Access to the `hawaii-lions` Firebase project
- Access to the district AWS account (only to set up or rotate the confirmation-email credential)

## Local development

```sh
npm install
cd functions && npm install && cd ..
```

Create `.env.local` in the repo root with the web app's Firebase config (Firebase console →
Project settings → Your apps → Web app). It's gitignored.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Then run `npm run dev` and open http://localhost:5173. The local app talks to the live Firebase
project, so uploads and emails are real.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## How the app works

### Firestore data

| Document | Shape | Used for |
| --- | --- | --- |
| `config/adminEmails` | `{ emails: ["a@hawaiilions.org", ...] }` | Who can open `/admin` |
| `config/dates` | `{ dates: [{ value: "MM-DD-YYYY", text, dueDate: "<ISO timestamp>" }] }` | Meetings members can upload to |
| `config/adminDates` | `{ dates: [{ value: "MM-DD-YYYY", text }] }` | Meetings admins can export |
| `crnUsers/<CRN>` | `{ email: ["member@example.com", ...] }` | Who can submit for each CRN |

- `value` is the meeting date. It's also the Storage folder name and the `meetingDate` sent to
  `sendCrnConfirmation`. `text` is the display name admins type in.
- CRN document IDs below 10 are zero-padded (`"05"`, not `"5"`). The admin page adds the zero
  for you.
- Emails must match the member's sign-in email exactly. Firebase stores sign-in emails in lowercase.

### Admin access

A user is an admin if their email is in `config/adminEmails`. Edit that document in the Firebase
console to add or remove admins. There's no admin page for it.

### Member accounts

Members can't sign up themselves. The `/signup` page only says to contact the IT Committee. To
give someone access:

1. On the admin page, open **CRN Number Changes**, look up the CRN, click **Edit**, add their
   email, then **Save**.
2. Saving updates `crnUsers/<CRN>`, then calls `adminCreateUser` for each email on the CRN. Emails
   that don't have an account yet get one with the default password set in
   `src/components/admin/CRNNumberChangesCard.jsx`. Existing accounts are left alone.
3. Tell the member to sign in with the default password and change it under **Edit Profile**, or
   use **Forgot Password?** on the login page.

Removing an email from a CRN takes away access to that CRN, but doesn't delete the account. Delete
accounts in the Firebase console → **Authentication** → **Users**.

### Cabinet meetings and deadlines

Creating a meeting on the admin page adds it to both `config/dates` and `config/adminDates`, with
`dueDate` set to **11:59:59 PM Hawaii time (HST)** on the due date. The due date must be before the
meeting date.

- Until the due date, the meeting shows in the member's **Cabinet Meeting Date** dropdown.
- After it, the dropdown shows "Deadline passed, email Cabinet Secretary to Submit CRN" instead
  and members can't select the meeting.
- The deadline is checked in the browser only. Storage rules don't enforce it.
- There's no way to edit a due date in the app. Change `dueDate` on that meeting's entry in
  `config/dates` in the Firebase console.

### Removing a meeting

**Remove Cabinet Meeting Dates** only removes the meeting from `config/dates`, so members no longer
see it. It stays in `config/adminDates`, so admins can still export its files, and no uploaded
files are deleted.

If you remove a meeting and then create it again with the same date, it's listed twice in the
export dropdown. Delete the extra entry from `config/adminDates` in the Firebase console.

### Security rules

`firestore.rules` and `storage.rules` control what the web app can read and write. Cloud Functions
use the Admin SDK, so the rules don't apply to them.

| Who | Firestore | Storage |
| --- | --- | --- |
| Signed-in member | Read `config/*`; read the `crnUsers` documents that list their email | Upload new files (under 50 MB) into `<MM-DD-YYYY>/` for a CRN they're assigned to |
| Admin | Read and write `config/*` and `crnUsers/*` | List and download all files |
| Anyone else | Nothing | Nothing |

Nobody can overwrite or delete files through the app. Storage rules check the CRN at the start of
the file name, not the email in it.

Deploy rule changes on their own, after testing them:

```sh
firebase deploy --only firestore:rules,storage
```

Storage rules read Firestore to look up admins and CRN assignments. The first time you deploy
them, the CLI asks to give Storage permission to read Firestore. Say yes.

## Confirmation emails (Amazon SES)

After a member's files finish uploading, the dashboard calls the `sendCrnConfirmation` function
once. The function:

- Sends only to the signed-in user's email address. The browser can't choose the recipient.
- Sends only if that user is listed in the CRN's `crnUsers` document.
- Sends through Amazon SES in the district AWS account, using an IAM user that can only send from
  one address.

The SES sending domain is verified for the whole AWS account (the District Communications
portal set it up). This app needs no AWS code or Terraform. It only needs the one-time manual
setup below.

### One-time AWS setup

All of this is in **US East (N. Virginia), `us-east-1`**. Replace `ACCOUNT_ID` with the
12-digit AWS account ID and `DOMAIN` with the SES-verified sending domain.

1. **Configuration set.** In the SES console → **Configuration sets** → **Create set**:
   - Name it `crn-transactional` and turn reputation metrics on.
   - Don't add event destinations. That keeps these emails out of the communications portal's reports.
2. **IAM policy.** In IAM → **Policies** → **Create policy** → JSON, create one named `crn-ses-send`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": "ses:SendEmail",
       "Resource": [
         "arn:aws:ses:us-east-1:ACCOUNT_ID:identity/DOMAIN",
         "arn:aws:ses:us-east-1:ACCOUNT_ID:configuration-set/crn-transactional"
       ],
       "Condition": {
         "StringEquals": { "ses:FromAddress": "crn-noreply@DOMAIN" }
       }
     }]
   }
   ```

3. **IAM user.** In IAM → **Users** → **Create user**:
   - Name it `crn-mailer`, with no console access, and attach `crn-ses-send` directly.
   - Open the user → **Security credentials** → **Create access key** → **Application running outside AWS**.
   - Put the key straight into step 4. Don't save it anywhere else.

### Firebase configuration

4. **Store the access key as Firebase secrets.** Each command prompts for the value:

   ```sh
   firebase functions:secrets:set AWS_SES_ACCESS_KEY_ID
   firebase functions:secrets:set AWS_SES_SECRET_ACCESS_KEY
   ```

5. **Set the non-secret settings** in `functions/.env.hawaii-lions`. This file is committed:

   ```
   SES_REGION=us-east-1
   SES_CONFIGURATION_SET=crn-transactional
   CRN_FROM_ADDRESS=crn-noreply@DOMAIN
   # Optional; defaults to informationtechnology@hawaiilions.org
   CRN_REPLY_TO=informationtechnology@hawaiilions.org
   ```

   `CRN_FROM_ADDRESS` must exactly match `ses:FromAddress` in the IAM policy.

### Rotating the access key

1. Create a second access key on `crn-mailer`.
2. Run both `firebase functions:secrets:set` commands again with the new values.
3. Redeploy `sendCrnConfirmation`.
4. Deactivate the old key, then delete it.

## Testing functions

Both functions are callable functions in `us-central1`. You can call them from the command line,
against either a local emulator or the deployed functions. Only the functions emulator runs
locally, so both ways use the live Firestore, Authentication and SES: test emails are really sent,
and test accounts are really created. The commands below need `curl` and `jq` (`brew install jq`).

| Function | Called from | What it does |
| --- | --- | --- |
| `sendCrnConfirmation` | Dashboard, after an upload | Emails the signed-in user a submission confirmation |
| `adminCreateUser` | Admin → CRN Number Changes, on **Save** | Creates a Firebase Authentication account for each new email on a CRN |

### Get an ID token

Run this from the repo root so it can read the API key from `.env.local`:

```sh
API_KEY=$(grep VITE_FIREBASE_API_KEY .env.local | cut -d= -f2)

ID_TOKEN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"YOUR_EMAIL@hawaiilions.org","password":"YOUR_PASSWORD","returnSecureToken":true}' | jq -r .idToken)
```

For `sendCrnConfirmation`, sign in with an account that's assigned to at least one CRN. Don't
commit real credentials or paste them into this file. The token expires after one hour, so run
this again if calls start failing with `UNAUTHENTICATED`.

### Run the functions locally

1. Give the emulator the SES access key. Create `functions/.secret.local`, which is gitignored:

   ```
   AWS_SES_ACCESS_KEY_ID=...
   AWS_SES_SECRET_ACCESS_KEY=...
   ```

   Only `sendCrnConfirmation` needs these. The non-secret settings come from
   `functions/.env.hawaii-lions` automatically.

2. Start the functions emulator:

   ```sh
   cd functions
   npm run serve
   ```

   If it fails with a credentials error, run `gcloud auth application-default login` and start it
   again.

3. In another terminal, call a function with the local base URL in the examples below.

Changes to `functions/index.js` reload without restarting the emulator. Logs print in the
emulator's terminal and in the Emulator UI at http://127.0.0.1:4000.

| Target | Base URL |
| --- | --- |
| Deployed | `https://us-central1-hawaii-lions.cloudfunctions.net` |
| Local emulator | `http://127.0.0.1:5001/hawaii-lions/us-central1` |

The request body must wrap the arguments in `data`, the same way the Firebase client SDK does.

### `sendCrnConfirmation`

```sh
BASE_URL=https://us-central1-hawaii-lions.cloudfunctions.net   # or the local emulator URL

curl -s -X POST "$BASE_URL/sendCrnConfirmation" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"crn":"39","meetingDate":"10-18-2026","fileCount":1}}'
```

Replace `39` with a CRN whose `crnUsers` document lists your email. `meetingDate` is
`MM-DD-YYYY`, the same value the dashboard sends.

| Response | Meaning |
| --- | --- |
| `{"result":{"ok":true}}` | The email was sent. Check the inbox of the account you signed in as. |
| `{"error":{"message":"That CRN is not assigned to you.","status":"PERMISSION_DENIED"}}` | Your email isn't in that CRN's `crnUsers` document |
| `{"error":{"message":"A valid CRN is required.","status":"INVALID_ARGUMENT"}}` | `crn` is missing, isn't a string, or contains `/` |
| `{"error":{"message":"You must be signed in.","status":"UNAUTHENTICATED"}}` | The token is missing or expired. Get a new one. |
| `{"error":{"message":"Could not send the confirmation email.","status":"INTERNAL"}}` | SES rejected the send. See the function logs and [Troubleshooting](#troubleshooting). |

### `adminCreateUser`

```sh
BASE_URL=https://us-central1-hawaii-lions.cloudfunctions.net   # or the local emulator URL

curl -s -X POST "$BASE_URL/adminCreateUser" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"email":"crn-test@example.com","password":"TEST_PASSWORD"}}'
```

- It only creates the sign-in account. It doesn't add the email to any CRN. The admin page does
  that separately by writing to the CRN's `crnUsers` document.
- If an account already exists for that email, it does nothing and returns the existing `uid`. It
  doesn't change that account's password.
- The admin check in the function is currently commented out, so it doesn't require an ID token
  yet. Send one anyway so the command keeps working once the check is turned back on.
- Use a throwaway address. Delete the test account afterward in the Firebase console →
  **Authentication** → **Users**.

| Response | Meaning |
| --- | --- |
| `{"result":{"result":"User created","uid":"..."}}` | The account was created |
| `{"result":{"result":"User already exists","uid":"..."}}` | An account already exists for that email. Nothing changed. |
| `{"error":{"message":"Email is required.","status":"INVALID_ARGUMENT"}}` | `email` is missing or empty |
| `{"error":{"message":"Password is required.","status":"INVALID_ARGUMENT"}}` | `password` is missing or empty |
| `{"error":{"message":"...","status":"INTERNAL"}}` | Firebase Authentication rejected it. The message says why, for example a badly formed email or a password shorter than 6 characters. |

## Deploying

```sh
npm run build
firebase deploy --only hosting,functions
```

This doesn't deploy security rules. See [Security rules](#security-rules).

To deploy one part, use `--only hosting`, `--only functions:sendCrnConfirmation` or
`--only functions:adminCreateUser`.

## Troubleshooting

To see function errors, run `firebase functions:log --only sendCrnConfirmation` (or
`--only adminCreateUser`).

| Error | Likely cause |
| --- | --- |
| `AccessDenied` | `CRN_FROM_ADDRESS`, the region, the domain or the configuration set name doesn't match the IAM policy |
| `MessageRejected` / "Email address is not verified" | The SES account is still in the sandbox, or the address is on a domain SES hasn't verified |
| `permission-denied` returned to the browser | The signed-in user isn't listed in that CRN's `crnUsers` document |
| Member signs in but sees no CRN | Their email in `crnUsers` doesn't exactly match the email they sign in with |
| Upload fails with `storage/unauthorized` | The member isn't assigned to that CRN, or the file is 50 MB or larger |
| Upload succeeds but no email arrives | Check the recipient's spam folder, then the SES account suppression list (an earlier bounce or complaint blocks the address) |

For IT support, contact the Hawaii Lions Information Technology Committee at
informationtechnology@hawaiilions.org.
