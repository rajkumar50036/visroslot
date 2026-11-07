const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const config = {
  apiKey: "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c",
  authDomain: "visroslot.firebaseapp.com",
  projectId: "visroslot",
  storageBucket: "visroslot.firebasestorage.app",
  messagingSenderId: "895677315501",
  appId: "1:895677315501:web:eb54fc3c74f8ed97324924",
  measurementId: "G-4JPZW7PRSQ"
};

const app = initializeApp(config);
const auth = getAuth(app);
console.log('SUCCESS: New Firebase App initialized:', app.name, '| Auth app name:', auth.app.name, '| Project:', app.options.projectId);
