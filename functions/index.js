const admin = require("firebase-admin");
const serviceAccount = require("./naverblog-server-firebase-adminsdk-eeyof-3187e48c54");
const dotenv = require("dotenv");

dotenv.config();

let firebase;
if (admin.apps.length === 0) {
  firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  firebase = admin.app();
}

module.exports = {
  api: require("./api"),
};