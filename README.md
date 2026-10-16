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
