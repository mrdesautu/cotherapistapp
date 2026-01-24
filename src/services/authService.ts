import { auth, database } from '../../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
// Removed redundant native GoogleSignin import
import { ref, set, get, update, serverTimestamp } from 'firebase/database';
import { User } from '../types/User';
import { localUserService } from './db/userService';

export const authService = {
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
        const userRef = ref(database, `users/${credential.user.uid}`);
        await update(userRef, { lastLoginAt: serverTimestamp() });
        // Local DB sync is handled by onAuthStateChanged
    },

    // Registro con email
    signUp: async (email: string, pass: string, name: string): Promise<void> => {
        const credential = await createUserWithEmailAndPassword(auth, email, pass);

        // Actualizar perfil básico en Auth
        await updateProfile(credential.user, { displayName: name });

        // Crear perfil en Realtime Database
        const userRef = ref(database, `users/${credential.user.uid}`);
        const newUser: User = {
            uid: credential.user.uid,
            email: email,
            displayName: name,
            role: 'therapist',
            createdAt: Date.now(), // Firebase serverTimestamp() better in real usage
            lastLoginAt: Date.now()
        };

        // Guardar usando timestamp de servidor para consistencia
        await set(userRef, {
            ...newUser,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
        });
    },

    // Login con Google
    signInWithGoogle: async (idToken: string): Promise<void> => {
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);

            const userRef = ref(database, `users/${userCredential.user.uid}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                const newUser: User = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email || '',
                    displayName: userCredential.user.displayName || '',
                    photoURL: userCredential.user.photoURL || undefined,
                    role: 'therapist',
                    createdAt: Date.now(),
                    lastLoginAt: Date.now()
                };
                await set(userRef, {
                    ...newUser,
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp()
                });
            } else {
                await update(userRef, { lastLoginAt: serverTimestamp() });
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
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

        // 3. Update Local DB
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
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, {
            photoURL: imageUri,
            updatedAt: serverTimestamp()
        });

        return imageUri;
    },

    // Obtener datos del usuario desde DB
    getUser: async (uid: string): Promise<any> => {
        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);
        return snapshot.exists() ? snapshot.val() : null;
    },

    // Obtener usuario actual (Auth)
    getCurrentUser: (): FirebaseUser | null => {
        return auth.currentUser;
    }
};
