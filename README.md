# D50 Hawaii Lions CRN Report Submission Portal

District cabinet members sign in, choose a cabinet meeting date and their CRN number, and upload
up to 5 files for their quarterly Cabinet Report. Each submission sends the member a confirmation
email. Admins manage cabinet meeting dates and CRN assignments and export submissions.

| Part | Technology |
| --- | --- |
| Web app (`src/`) | React + Vite, Material UI, hosted on Firebase Hosting |
| Sign-in | Firebase Authentication (email/password) |
| Data | Cloud Firestore (`crnUsers`, `users`, `config`) |
| Uploaded files | Cloud Storage, stored as `<meeting date>/<CRN>-<email>-<timestamp>-<filename>` |
| Server code (`functions/`) | Cloud Functions for Firebase (Node 24) |
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

You can call `sendCrnConfirmation` from the command line, against either a local emulator or the
deployed function. Both send a real email through SES to the account you sign in as, and both read
the live `crnUsers` collection. The commands below need `curl` and `jq` (`brew install jq`).

### 1. Get an ID token

Callable functions need a Firebase ID token for a real user. Sign in with an account that's
assigned to at least one CRN. Run this from the repo root so it can read the API key from
`.env.local`:

```sh
API_KEY=$(grep VITE_FIREBASE_API_KEY .env.local | cut -d= -f2)

ID_TOKEN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"YOUR_EMAIL@hawaiilions.org","password":"YOUR_PASSWORD","returnSecureToken":true}' | jq -r .idToken)
```

Don't commit real credentials or paste them into this file. The token expires after one hour, so
run this again if calls start failing with `UNAUTHENTICATED`.

### 2a. Call the deployed function

```sh
curl -s -X POST "https://us-central1-hawaii-lions.cloudfunctions.net/sendCrnConfirmation" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"crn":"39","meetingDate":"10-18-2026","fileCount":1}}'
```

Replace `39` with a CRN whose `crnUsers` document lists your email. The request body must wrap the
arguments in `data`, the same way the Firebase client SDK does.

### 2b. Run the function locally

1. Give the emulator the SES access key. Create `functions/.secret.local`, which is gitignored:

   ```
   AWS_SES_ACCESS_KEY_ID=...
   AWS_SES_SECRET_ACCESS_KEY=...
   ```

   The non-secret settings come from `functions/.env.hawaii-lions` automatically.

2. Start the functions emulator:

   ```sh
   cd functions
   npm run serve
   ```

   Only the functions emulator runs, so the function reads and writes the live Firestore. If it
   fails with a credentials error, run `gcloud auth application-default login` and start it again.

3. In another terminal, get an ID token (step 1), then call the local URL:

   ```sh
   curl -s -X POST "http://127.0.0.1:5001/hawaii-lions/us-central1/sendCrnConfirmation" \
     -H "Authorization: Bearer $ID_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"data":{"crn":"39","meetingDate":"10-18-2026","fileCount":1}}'
   ```

   Changes to `functions/index.js` reload without restarting the emulator. Logs print in the
   emulator's terminal and in the Emulator UI at http://127.0.0.1:4000.

### Expected responses

| Response | Meaning |
| --- | --- |
| `{"result":{"ok":true}}` | The email was sent. Check the inbox of the account you signed in as. |
| `{"error":{"message":"That CRN is not assigned to you.","status":"PERMISSION_DENIED"}}` | Your email isn't in that CRN's `crnUsers` document |
| `{"error":{"message":"A valid CRN is required.","status":"INVALID_ARGUMENT"}}` | `crn` is missing, isn't a string, or contains `/` |
| `{"error":{"message":"You must be signed in.","status":"UNAUTHENTICATED"}}` | The token is missing or expired. Get a new one. |
| `{"error":{"message":"Could not send the confirmation email.","status":"INTERNAL"}}` | SES rejected the send. See the function logs and [Troubleshooting](#troubleshooting). |

## Deploying

```sh
npm run build
firebase deploy --only hosting,functions
```

To deploy one part, use `--only hosting` or `--only functions:sendCrnConfirmation`.

## Troubleshooting

To see function errors, run `firebase functions:log --only sendCrnConfirmation`.

| Error | Likely cause |
| --- | --- |
| `AccessDenied` | `CRN_FROM_ADDRESS`, the region, the domain or the configuration set name doesn't match the IAM policy |
| `MessageRejected` / "Email address is not verified" | The SES account is still in the sandbox, or the address is on a domain SES hasn't verified |
| `permission-denied` returned to the browser | The signed-in user isn't listed in that CRN's `crnUsers` document |
| Upload succeeds but no email arrives | Check the recipient's spam folder, then the SES account suppression list (an earlier bounce or complaint blocks the address) |

For IT support, contact the Hawaii Lions Information Technology Committee at
informationtechnology@hawaiilions.org.
