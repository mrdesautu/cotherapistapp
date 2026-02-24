import { getDBConnection } from '../../db/sqlite';
import { User } from '../../types/User';

export const localUserService = {
    saveLocalUser: async (user: User): Promise<void> => {
        try {
            const db = getDBConnection();
            db.runSync(
                `INSERT OR REPLACE INTO users (id, email, displayName, photoURL, role, createdAt, lastLoginAt, syncedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.uid,
                    user.email,
                    user.displayName,
                    user.photoURL || null,
                    user.role,
                    user.createdAt,
                    user.lastLoginAt,
                    Date.now()
                ]
            );
        } catch (error: any) {
            console.warn('Error saving local user (Safe to ignore if app is reloading):', error.message);
            // Don't rethrow to avoid crashing the auth flow
        }
    },

    getLocalUser: async (userId: string): Promise<User | null> => {
        try {
            const db = getDBConnection();
            const row = db.getFirstSync<any>(
                `SELECT * FROM users WHERE id = ?`,
                [userId]
            );

            if (row) {
                return {
                    uid: row.id,
                    email: row.email,
                    displayName: row.displayName,
                    photoURL: row.photoURL,
                    role: row.role as 'therapist' | 'patient',
                    createdAt: row.createdAt,
                    lastLoginAt: row.lastLoginAt,
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting local user:', error);
            throw error;
        }
    }
};
