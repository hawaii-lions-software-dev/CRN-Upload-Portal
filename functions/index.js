const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp();

exports.adminCreateUser = functions.https.onCall(async (request) => {
  // Optional: Only allow authenticated admins to call this function
  // if (!request.auth || !request.auth.token.admin) {
  //   throw new functions.https.HttpsError("permission-denied", "Only admins can create users.");
  // }

  const { email, password } = request.data;
  
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required.");
  }
  if (!password) {
    throw new functions.https.HttpsError("invalid-argument", "Password is required.");
  }

  try {
    // Check if user already exists
    let user;
    try {
      user = await getAuth().getUserByEmail(email);
      // If found, just return success (or you can throw an error if you want)
      return { result: "User already exists", uid: user.uid };
    } catch (err) {
      // If not found, create user
      if (err.code !== "auth/user-not-found") throw err;
    }

    user = await getAuth().createUser({
      email,
      password,
    });
    return { result: "User created", uid: user.uid };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Confirmation email after a CRN upload, sent through the district's Amazon SES account
// (provisioned by the district-communications repo's Terraform). The recipient is always the
// signed-in user, never something the browser sends, so this can't be used to email anyone else.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const sesAccessKeyId = defineSecret("AWS_SES_ACCESS_KEY_ID");
const sesSecretAccessKey = defineSecret("AWS_SES_SECRET_ACCESS_KEY");
const sesRegion = defineString("SES_REGION", { default: "us-east-1" });
const sesConfigSet = defineString("SES_CONFIGURATION_SET");
const crnFromAddress = defineString("CRN_FROM_ADDRESS");
const crnReplyTo = defineString("CRN_REPLY_TO", { default: "informationtechnology@hawaiilions.org" });

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

exports.sendCrnConfirmation = onCall(
  { secrets: [sesAccessKeyId, sesSecretAccessKey] },
  async (request) => {
    const email = request.auth?.token?.email;
    if (!email) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const { crn, meetingDate, fileCount } = request.data || {};
    if (typeof crn !== "string" || !crn || crn.length > 100 || crn.includes("/")) {
      throw new HttpsError("invalid-argument", "A valid CRN is required.");
    }
    if (typeof meetingDate !== "string" || meetingDate.length > 100) {
      throw new HttpsError("invalid-argument", "A valid cabinet meeting date is required.");
    }

    // Only confirm CRNs assigned to this user (the same check the dashboard's dropdown uses).
    const crnDoc = await getFirestore().collection("crnUsers").doc(crn).get();
    const assigned = crnDoc.exists ? crnDoc.get("email") || [] : [];
    if (!assigned.includes(email)) {
      throw new HttpsError("permission-denied", "That CRN is not assigned to you.");
    }

    const files = Number.isInteger(fileCount) && fileCount > 0 ? fileCount : null;
    const filesLine = files ? ` (${files} file${files === 1 ? "" : "s"})` : "";
    const dateLine = meetingDate ? ` for the ${meetingDate} Cabinet Meeting` : "";

    const text = [
      "Aloha,",
      "",
      "This is an automatically generated email.",
      "",
      `Thank you for submitting CRN ${crn}${dateLine}${filesLine}. Your CRN has been received and will be included in the CRN Reports which will be distributed at a later date. Thank you for your service to the District 50 Hawaii Lions!`,
      "",
      "If you have any questions, please reply to this email.",
      "",
      "Mahalo,",
      "Information Technology Committee",
    ].join("\n");
    const html = `<div>${text
      .split("\n")
      .map((line) => escapeHtml(line))
      .join("<br>")}</div>`;

    const ses = new SESv2Client({
      region: sesRegion.value(),
      credentials: {
        accessKeyId: sesAccessKeyId.value(),
        secretAccessKey: sesSecretAccessKey.value(),
      },
    });

    try {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: `"D50 Hawaii Lions CRN Reports" <${crnFromAddress.value()}>`,
          Destination: { ToAddresses: [email] },
          ReplyToAddresses: [crnReplyTo.value()],
          ConfigurationSetName: sesConfigSet.value(),
          Content: {
            Simple: {
              Subject: { Data: `Confirmation: CRN ${crn} Submitted`, Charset: "UTF-8" },
              Body: {
                Text: { Data: text, Charset: "UTF-8" },
                Html: { Data: html, Charset: "UTF-8" },
              },
            },
          },
        }),
      );
    } catch (err) {
      console.error("SES send failed", { crn, error: err?.name, message: err?.message });
      throw new HttpsError("internal", "Could not send the confirmation email.");
    }

    return { ok: true };
  },
);
