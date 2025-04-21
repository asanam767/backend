const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
        try {
                console.log(
                        `New user created: UID=${user.uid}, Email=${user.email || "no-email"}`
                );

                // Validate email existence
                if (!user.email) {
                        console.warn(`No email provided for user: ${user.uid}`);
                        return null;
                }

                // Save user data to Firestore
                const userData = {
                        email: user.email,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        displayName: user.displayName || null,
                };

                await admin.firestore()
                        .collection("users")
                        .doc(user.uid)
                        .set(userData, { merge: true });

                return null; // Indicate successful completion
        } catch (error) {
                console.error("Error saving user to Firestore:", error);
                return null; // Ensure function completion even on error
        }
});