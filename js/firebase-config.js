// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfbn8FCMwmI9K8ciWLxZ-jZpbgDpncyHA",
  authDomain: "attendanceapp-865da.firebaseapp.com",
  databaseURL: "https://attendanceapp-865da-default-rtdb.firebaseio.com",
  projectId: "attendanceapp-865da",
  storageBucket: "attendanceapp-865da.firebasestorage.app",
  messagingSenderId: "956662535489",
  appId: "1:956662535489:web:70a05d18829445c7f03dc0",
  measurementId: "G-YYCESEJG64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);