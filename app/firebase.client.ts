import { initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";

// Initialize Firebase
const app = initializeApp({
  apiKey: "AIzaSyDxEEekyxKXW2r1RYg9em4XlxCxNLJfois",
  authDomain: "shopat-bio.firebaseapp.com",
  projectId: "shopat-bio",
  storageBucket: "shopat-bio.appspot.com",
  messagingSenderId: "449743886380",
  appId: "1:449743886380:web:e69642b621478eddfb9989",
  measurementId: "G-46YG0F984J",
});

export const auth = getAuth(app);

// Let Remix handle the persistence via session cookies.
setPersistence(auth, inMemoryPersistence);
