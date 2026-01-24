import { getDBConnection } from '../../db/sqlite';
import { Session } from '../../types/Session';

const db = getDBConnection();

export const localSessionService = {
    // Get all sessions for a patient
    getSessionsByPatient: async (patientId: string): Promise<Session[]> => {
        try {
            const rows = db.getAllSync<any>(
                `SELECT * FROM sessions WHERE patientId = ? ORDER BY date DESC`,
                [patientId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting local sessions:', error);
            return [];
        }
    },

    // Save session locally
    saveSession: async (session: Session): Promise<void> => {
        try {
            db.runSync(
                `INSERT OR REPLACE INTO sessions (
          id, patientId, therapistId, audioURL, duration, date, 
          notes, status, createdAt, syncedAt, isDirty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    session.id,
                    session.patientId,
                    session.therapistId,
                    session.audioURL || null,
                    session.duration,
                    session.date,
                    session.notes || null,
                    session.status,
                    session.createdAt,
                    session.syncedAt || null,
                    session.isDirty || 1
                ]
            );
        } catch (error) {
            console.error('Error saving local session:', error);
            throw error;
        }
    },

    // Update session audio URL after upload
    updateSessionAudioUrl: async (sessionId: string, audioURL: string): Promise<void> => {
        try {
            db.runSync(
                `UPDATE sessions SET audioURL = ?, syncedAt = ? WHERE id = ?`,
                [audioURL, Date.now(), sessionId]
            );
        } catch (error) {
            console.error('Error updating session audio URL:', error);
        }
    },

    // Delete session locally
    deleteSession: async (sessionId: string): Promise<void> => {
        try {
            db.runSync(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
        } catch (error) {
            console.error('Error deleting local session:', error);
            throw error;
        }
    }
};
