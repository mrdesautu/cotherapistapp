import { database, auth } from '../../firebase';
import { ref, set, update } from 'firebase/database';
import { Session } from '../types/Session';

export const sessionService = {
    // Helper to get current user ID
    getCurrentUserId: () => {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        return uid;
    },

    // Save session metadata to Firebase
    saveSession: async (session: Session): Promise<void> => {
        const uid = sessionService.getCurrentUserId();
        const sessionRef = ref(database, `users/${uid}/sessions/${session.id}`);
        await set(sessionRef, session);
    },

    updateSessionStatus: async (sessionId: string, status: Session['status'], audioURL?: string): Promise<void> => {
        const uid = sessionService.getCurrentUserId();
        const sessionRef = ref(database, `users/${uid}/sessions/${sessionId}`);
        const updates: Partial<Session> = { status };
        if (audioURL) updates.audioURL = audioURL;
        await update(sessionRef, updates);
    }
};
