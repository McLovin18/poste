import admin from 'firebase-admin';

// Use application default credentials or service account if provided.
if (!admin.apps.length) {
  try {
    // If GOOGLE_APPLICATION_CREDENTIALS is set or running on GCP, this will pick up ADC.
    admin.initializeApp();
  } catch (e) {
    // fallback: try to initialize without credentials (may fail in local)
    try {
      admin.initializeApp();
    } catch (err) {
      // ignore - app may already be initialized elsewhere
      console.warn('[firebaseAdmin] initializeApp fallback', err);
    }
  }
}

export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();

export default admin;
