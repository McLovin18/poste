import admin from 'firebase-admin';

// Do NOT call admin.firestore() at module load time — that triggers
// Firestore initialization during build/static generation and may
// fail when GOOGLE_APPLICATION_CREDENTIALS is not present. Provide
// lazy helpers instead.

export function getAdmin() {
  return admin;
}

export function getAdminFirestore() {
  // Initialize app if not already initialized. Leaving initializeApp
  // in a try/catch so it doesn't throw synchronously during import.
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (e) {
      try {
        admin.initializeApp();
      } catch (err) {
        console.warn('[firebaseAdmin] initializeApp fallback', err);
      }
    }
  }

  // Now return firestore instance. This may still throw if credentials
  // are not available; callers should handle that case.
  return admin.firestore();
}

export function getAdminStorage() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (e) {
      try {
        admin.initializeApp();
      } catch (err) {
        console.warn('[firebaseAdmin] initializeApp fallback', err);
      }
    }
  }
  return admin.storage();
}

export default admin;
