
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');

// Hardcoded config from .env
const firebaseConfig = {
    apiKey: "AIzaSyA3ThLQkUIL1VU0jk1-uStenKD5lGnjcHk",
    authDomain: "cotherapyst-c1ddf.firebaseapp.com",
    projectId: "cotherapyst-c1ddf",
    storageBucket: "cotherapyst-c1ddf.firebasestorage.app",
    messagingSenderId: "907064128928",
    appId: "1:907064128928:ios:c302bb806f3894527860c5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = 'dejarque88@gmail.com';

console.log(`Sending password reset email to ${email}...`);

sendPasswordResetEmail(auth, email)
    .then(() => {
        console.log('Password reset email sent successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error sending password reset email:', error);
        process.exit(1);
    });
