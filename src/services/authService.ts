import { auth, database, db } from '../../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithCredential,
    sendPasswordResetEmail
} from 'firebase/auth';
// Removed redundant native GoogleSignin import
import { ref, set, get, update, serverTimestamp } from 'firebase/database';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from '../types/User';
import { localUserService } from './db/userService';
import { buildUserNodePath } from '../utils/rtdbPathBuilder';

export const authService = {
    // ... (initialize)

    // Reset Password
    resetPassword: async (email: string): Promise<void> => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error("Error sending reset email:", error);
            throw error;
        }
    },
    initialize: () => {
        // No extra config needed for web-based auth for now
    },

    // Observar cambios de estado
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Obtener datos adicionales de Realtime Database si es necesario
                // Por simplificación, mapeamos lo básico por ahora
                let user: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || '',
                    photoURL: firebaseUser.photoURL || undefined,
                    role: 'therapist', // Default por ahora
                    createdAt: Date.now(), // Placeholder
                    lastLoginAt: Date.now(),
                };

                try {
                    const dbUser = await authService.getUser(firebaseUser.uid);
                    if (dbUser) {
                        user = { ...user, ...dbUser };
                    }
                    // Save to SQLite for offline access
                    await localUserService.saveLocalUser(user);
                } catch (e) {
                    console.warn("Failed to sync user to local DB", e);
                }

                callback(user);
            } else {
                callback(null);
            }
        });
    },

    // Login con email
    signIn: async (email: string, pass: string): Promise<void> => {
        const credential = await signInWithEmailAndPassword(auth, email, pass);
        // Actualizar lastLogin
        const userNode = buildUserNodePath(credential.user.uid);
        const userRef = ref(database, userNode);
        await update(userRef, { lastLoginAt: serverTimestamp() });

        // Sync Login to Firestore
        try {
            const userDocRef = doc(db, 'users', credential.user.uid);
            await setDoc(userDocRef, { lastLoginAt: new Date() }, { merge: true });
        } catch (e) {
            console.warn("Firestore sync failed on login", e);
        }

        // Local DB sync is handled by onAuthStateChanged
    },

    // Registro con email
    signUp: async (email: string, pass: string, name: string): Promise<void> => {
        const credential = await createUserWithEmailAndPassword(auth, email, pass);

        // Actualizar perfil básico en Auth
        await updateProfile(credential.user, { displayName: name });

        // Crear perfil en Realtime Database
        const userNode = buildUserNodePath(credential.user.uid);
        const userRef = ref(database, userNode);
        const newUser: User = {
            uid: credential.user.uid,
            email: email,
            displayName: name,
            role: 'therapist',
            createdAt: Date.now(), // Firebase serverTimestamp() better in real usage
            lastLoginAt: Date.now()
        };

        // Guardar usando timestamp de servidor para consistencia en RTDB
        await set(userRef, {
            ...newUser,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
        });

        // Sync to Firestore (Required for Backend Auth Middleware)
        try {
            const userDocRef = doc(db, 'users', credential.user.uid);
            // Firestore expects native Date objects or Firestore Timestamp, not RTDB serverTimestamp placeholder
            await setDoc(userDocRef, {
                ...newUser,
                createdAt: new Date(),
                lastLoginAt: new Date()
            });
        } catch (e) {
            console.error("Failed to create user in Firestore during signUp", e);
            // Consider throwing here if backend access is strictly required
        }
    },

    // Login con Google
    signInWithGoogle: async (idToken: string): Promise<void> => {
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const uid = userCredential.user.uid;

            const userNode = buildUserNodePath(uid);
            const userRef = ref(database, userNode);
            const snapshot = await get(userRef);

            const newUser: User = {
                uid: uid,
                email: userCredential.user.email || '',
                displayName: userCredential.user.displayName || '',
                photoURL: userCredential.user.photoURL || undefined,
                role: 'therapist',
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            };

            if (!snapshot.exists()) {
                // RTDB Create
                await set(userRef, {
                    ...newUser,
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp()
                });
            } else {
                // RTDB Update Login
                await update(userRef, { lastLoginAt: serverTimestamp() });
            }

            // Firestore Sync (Check if exists, if not create, else update login)
            try {
                const userDocRef = doc(db, 'users', uid);
                const docSnap = await getDoc(userDocRef);

                if (!docSnap.exists()) {
                    await setDoc(userDocRef, {
                        ...newUser,
                        createdAt: new Date(),
                        lastLoginAt: new Date()
                    });
                } else {
                    await updateDoc(userDocRef, { lastLoginAt: new Date() });
                }
            } catch (e) {
                console.warn("Firestore sync failed on Google Login", e);
            }

        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    },

    // Cerrar sesión
    signOut: async (): Promise<void> => {
        try {
            // Web browser session might persist, usually web-based auth handles logout via URL or just clearing local token
        } catch (e) {
            console.error(e);
        }
        await firebaseSignOut(auth);
    },

    // Actualizar perfil de usuario
    updateUser: async (uid: string, data: { displayName?: string; photoURL?: string }): Promise<void> => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No auth user');

        // 1. Update Authentication Profile
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        if (data.displayName) profileUpdates.displayName = data.displayName;
        if (data.photoURL) profileUpdates.photoURL = data.photoURL;

        if (Object.keys(profileUpdates).length > 0) {
            await updateProfile(currentUser, profileUpdates);
        }

        // 2. Update Realtime Database
        const userNode = buildUserNodePath(uid);
        const userRef = ref(database, userNode);
        await update(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

        // 3. Sync to Firestore
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, {
                ...data,
                updatedAt: new Date()
            }, { merge: true });
        } catch (e) {
            console.warn("Firestore user update failed", e);
        }

        // 4. Update Local DB
        try {
            const currentLocal = await localUserService.getLocalUser(uid);
            if (currentLocal) {
                await localUserService.saveLocalUser({ ...currentLocal, ...data });
            }
        } catch (e) {
            console.warn("Error updating local user", e);
        }
    },

    // Subir imagen de perfil (Base64)
    uploadProfileImage: async (uid: string, base64Image: string): Promise<string> => {
        const imageUri = `data:image/jpeg;base64,${base64Image}`;

        // Solo actualizar Realtime DB para evitar error de longitud en Firebase Auth
        const userNode = buildUserNodePath(uid);
        const userRef = ref(database, userNode);
        await update(userRef, {
            photoURL: imageUri,
            updatedAt: serverTimestamp()
        });

        // Sync to Firestore
        try {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, {
                photoURL: imageUri,
                updatedAt: new Date()
            }, { merge: true });
        } catch (e) {
            console.warn("Firestore image update failed", e);
        }

        return imageUri;
    },

    // Obtener datos del usuario desde DB
    getUser: async (uid: string): Promise<any> => {
        const userNode = buildUserNodePath(uid);
        const userRef = ref(database, userNode);
        const snapshot = await get(userRef);
        return snapshot.exists() ? snapshot.val() : null;
    },

    // Obtener usuario actual (Auth)
    getCurrentUser: (): FirebaseUser | null => {
        return auth.currentUser;
    }
};
