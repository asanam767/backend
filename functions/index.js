// functions/index.js (UPDATED: Also sets Auth photoURL + Fixes max-len)

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userDesc = `UID=${user.uid}, Email=${user.email || "no-email"}`;
  console.log(`Processing user: ${userDesc}`);

  try {
    if (!user.email) {
      const warningMsg = `User ${user.uid} has no email.`;
      console.warn(warningMsg, "Skipping Firestore write and Auth update.");
      return;
    }

    const profileImages = [
      // eslint-disable-next-line max-len
      "https://firebasestorage.googleapis.com/v0/b/backend-ec4e8.firebasestorage.app/o/defaultprofile%2Fpro1.png?alt=media&token=7779d0e0-0cec-4541-8657-0238b10f45ff",
      // eslint-disable-next-line max-len
      "https://firebasestorage.googleapis.com/v0/b/backend-ec4e8.firebasestorage.app/o/defaultprofile%2Fpro2.png?alt=media&token=e6293e7b-bf72-476b-9cb7-bf6ca174a408",
    ];

    const randomIndex = Math.floor(Math.random() * profileImages.length);
    const randomProfileImage = profileImages[randomIndex];
    console.log(`Selected image ends in: ...${randomProfileImage.slice(-20)}`);

    // --- Task 1: Update Firestore (Keep doing this) ---
    const userDocRef = admin.firestore().collection("users").doc(user.uid);
    const firestorePromise = userDocRef.set({
      userProfile: {
        profileImage: randomProfileImage,
        userEmail: user.email,
      },
    }, {merge: true});
    // Shorten Firestore log
    console.log(`Firestore write initiated for: ${user.uid}`); // Line 51 fixed

    // --- Task 2: Update Firebase Auth User Profile (NEW!) ---
    const authPromise = admin.auth().updateUser(user.uid, {
      photoURL: randomProfileImage, // Set the photoURL on the Auth user
    });
    console.log(`Firebase Auth update initiated for: ${user.uid}`);

    // --- Wait for both operations to complete ---
    await Promise.all([firestorePromise, authPromise]);

    // Shorten success log
    const successMsg = `Updated Firestore & Auth for user: ${user.uid}`;
    console.log(successMsg);
  } catch (error) {
    // Shorten error log
    console.error(`Error processing user ${user.uid}:`, error);
  }
});
