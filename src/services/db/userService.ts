import { getDBConnection } from '../../db/sqlite';
import { User } from '../../types/User';

const db = getDBConnection();

export const localUserService = {
    saveLocalUser: async (user: User): Promise<void> => {
        try {
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
        } catch (error) {
            console.error('Error saving local user:', error);
            throw error;
        }
    },

    getLocalUser: async (userId: string): Promise<User | null> => {
        try {
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
