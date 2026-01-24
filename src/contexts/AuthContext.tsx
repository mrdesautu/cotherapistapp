import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types/User';
import { authService } from '../services/authService';

interface AuthContextData {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string, name: string) => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
    updateProfileImage: (base64Image: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authService.initialize();
        const unsubscribe = authService.onAuthStateChanged(async (u) => {
            if (u) {
                // Fetch additional data from Realtime DB (like photoURL if too long for Auth)
                try {
                    const dbUser = await authService.getUser(u.uid);
                    if (dbUser?.photoURL) {
                        // Merge DB photoURL into the user object state
                        setUser({ ...u, photoURL: dbUser.photoURL });
                    } else {
                        setUser(u);
                    }
                } catch (e) {
                    console.error('Error fetching user data from DB', e);
                    setUser(u);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = async (email: string, pass: string) => {
        await authService.signIn(email, pass);
    };

    const signUp = async (email: string, pass: string, name: string) => {
        await authService.signUp(email, pass, name);
    };

    const signInWithGoogle = async (idToken: string) => {
        await authService.signInWithGoogle(idToken);
    };

    const signOut = async () => {
        await authService.signOut();
    };

    const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
        if (!user) return;
        await authService.updateUser(user.uid, data);
        setUser((prev) => prev ? { ...prev, ...data } : null);
    };

    const updateProfileImage = async (base64Image: string) => {
        if (!user) return;
        const newPhotoURL = await authService.uploadProfileImage(user.uid, base64Image);
        setUser((prev) => prev ? { ...prev, photoURL: newPhotoURL } : null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signInWithGoogle, signOut, updateUserProfile, updateProfileImage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
