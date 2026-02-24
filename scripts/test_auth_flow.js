
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set, get, child } = require('firebase/database');

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
const db = getDatabase(app);

const TEST_EMAIL = `test_user_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function runTest() {
    console.log('--- Starting Auth Flow Test ---');

    try {
        // 1. Sign Up
        console.log(`1. Attempting Sign Up with ${TEST_EMAIL}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        const user = userCredential.user;
        console.log('   ✅ Sign Up Success:', user.uid);

        // 2. Write to Realtime Database (Simulate Client Logic)
        console.log('2. Writing user profile to Realtime Database...');
        await set(ref(db, 'users/' + user.uid), {
            username: "Test User",
            email: TEST_EMAIL,
            role: 'therapist'
        });
        console.log('   ✅ Write Success');

        // 3. Read from Realtime Database
        console.log('3. Reading user profile to verify...');
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${user.uid}`));
        if (snapshot.exists()) {
            console.log('   ✅ Read Success:', snapshot.val());
        } else {
            console.error('   ❌ No data available');
        }

        // 4. Sign In
        console.log('4. Attempting Sign In...');
        const signInCred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        console.log('   ✅ Sign In Success:', signInCred.user.email);

        console.log('--- Test Completed Successfully ---');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

runTest();
