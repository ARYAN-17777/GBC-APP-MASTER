
// Simplified Firebase configuration for APK build
// This is a mock configuration that won't cause build errors

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "gbc-canteen-demo.firebaseapp.com",
  databaseURL: "https://gbc-canteen-demo-default-rtdb.firebaseio.com",
  projectId: "gbc-canteen-demo",
  storageBucket: "gbc-canteen-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo-app-id"
};

// Mock Firebase services for APK build
export const auth = {
  currentUser: null,
  signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-user' } }),
  signOut: () => Promise.resolve()
};

export const database = {
  ref: () => ({
    push: () => ({ key: 'demo-key' }),
    set: () => Promise.resolve(),
    on: () => {},
    off: () => {}
  })
};

export const firestore = {
  collection: () => ({
    doc: () => ({
      set: () => Promise.resolve(),
      get: () => Promise.resolve({ exists: () => false, data: () => null })
    })
  })
};

export const storage = {
  ref: () => ({
    put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('demo-url') } })
  })
};

export default { firebaseConfig };
