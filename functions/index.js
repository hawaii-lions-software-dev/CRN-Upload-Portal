const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

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
      user = await admin.auth().getUserByEmail(email);
      // If found, just return success (or you can throw an error if you want)
      return { result: "User already exists", uid: user.uid };
    } catch (err) {
      // If not found, create user
      if (err.code !== "auth/user-not-found") throw err;
    }

    user = await admin.auth().createUser({
      email,
      password,
    });
    return { result: "User created", uid: user.uid };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});