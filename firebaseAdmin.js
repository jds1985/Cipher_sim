// firebaseAdmin.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8");
  const serviceAccount = JSON.parse(json);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
module.exports = { db, admin };
