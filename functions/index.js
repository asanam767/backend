const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin safely
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Auth trigger - runs when a new user is created
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userDesc = `UID=${user.uid}, Email=${user.email || "no-email"}`;
  console.log(`Processing new user: ${userDesc}`);

  try {
    if (!user.email) {
      console.warn(`User ${user.uid} lacks email. Skipping profile creation.`);
      return;
    }

    // --- Define URLs first to avoid long lines in the array ---
    const profileImage1 = "https://firebasestorage.googleapis.com/v0/b/backend-ec4e8.firebasestorage.app/o/defaultprofile%2Fpro1.png?alt=media&token=7779d0e0-0cec-4541-8657-0238b10f45ff";
    const profileImage2 = "https://firebasestorage.googleapis.com/v0/b/backend-ec4e8.firebasestorage.app/o/defaultprofile%2Fpro2.png?alt=media&token=e6293e7b-bf72-476b-9cb7-bf6ca174a408";

    const profileImages = [
      profileImage1,
      profileImage2,
    ];
    // --- End URL Definition ---

    const randomIndex = Math.floor(Math.random() * profileImages.length);
    const randomProfileImage = profileImages[randomIndex];
    // Log only the end of the selected image URL if needed
    console.log(`Selected image ending: ...${randomProfileImage.slice(-20)}`);

    // --- Task 1: Create Firestore Document ---
    const userDocRef = admin.firestore().collection("users").doc(user.uid);
    const firestoreData = {
      userProfile: {
        profileImage: randomProfileImage,
        userEmail: user.email,
      },
      prompts: [],
      AIanswers: [],
    };

    const firestorePromise = userDocRef.set(firestoreData);
    console.log(`Firestore document creation initiated for ${user.uid}.`);

    // --- Task 2: Update Firebase Auth User Profile ---
    const authPromise = admin.auth().updateUser(user.uid, {
      photoURL: randomProfileImage,
    });
    console.log(`Auth profile photoURL update initiated for ${user.uid}.`);

    await Promise.all([firestorePromise, authPromise]);
    // --- Break the console log string onto a new line ---
    console.log(
        `Firestore doc created & Auth profile updated for ${user.uid}.`,
    );
    // --- End console log fix ---
  } catch (error) {
    console.error(`Error creating profile for user ${user.uid}:`, error);
  }
});
