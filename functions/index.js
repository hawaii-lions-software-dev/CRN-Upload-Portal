const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");
const cors = require("cors")({
  origin: true
});

exports.sendMail = functions.https.onRequest((req, res) => {
  const { dest, crn } = req.body;
  return cors(req, res, () => {
    var text = `<div>
    Aloha,<br><br>

    This is an automatically generated email.<br><br>
    
    Thank you for submitting CRN ${crn || ""}. Your CRN has been received and will be included in the CRN Reports which will be distributed at a later date. Thank you for your service to the District 50 Hawaii Lions!<br><br>
    
    If you have any questions, please reply to this email.<br><br>
    
    Mahalo,<br>
    Information Technology Committee
    </div>`;
    const msg = {
      to: dest,
      from: "informationtechnology@hawaiilions.org",
      subject: `Confirmation: CRN ${crn} Submitted`,
      text: text,
      html: text
    };
    sgMail.setApiKey(
      "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"
    );
    sgMail.send(msg);
    res.status(200).send("success "+dest+" "+crn);
  }).catch(() => {
    res.status(500).send("error");
  });
});

exports.sendMail2 = functions.runWith({ enforceAppCheck: true }).https.onCall((data) => {
  var text = `<div>
    Aloha,<br><br>

    This is an automatically generated email.<br><br>
    
    Thank you for submitting CRN ${data.crn || ""}. Your CRN has been received and will be included in the CRN Reports which will be distributed at a later date. Thank you for your service to the District 50 Hawaii Lions!<br><br>
    
    If you have any questions, please reply to this email.<br><br>
    
    Mahalo,<br>
    Information Technology Committee
  </div>`;
  const msg = {
    to: data.dest,
    from: "informationtechnology@hawaiilions.org",
    subject: `Confirmation: CRN ${data.crn} Submitted`,
    text: text,
    html: text
  };
  sgMail.setApiKey(
    "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"
  );
  sgMail.send(msg);
  return "success "+data.dest+" "+data.crn;
});