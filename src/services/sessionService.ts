import { db, auth } from '../../firebase';
import { doc, setDoc, updateDoc, collection, addDoc, onSnapshot } from 'firebase/firestore';
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
        const sessionRef = doc(db, 'users', uid, 'sessions', session.id);
        await setDoc(sessionRef, session);
    },

    // Request AI Transcription
    requestTranscription: async (session: Session, patientId: string): Promise<void> => {
        const uid = sessionService.getCurrentUserId();

        // 1. Mark session as processing
        const sessionRef = doc(db, 'users', uid, 'sessions', session.id);
        await updateDoc(sessionRef, { status: 'processing' });

        // 2. Add to global server queue (Firestore Collection)
        const queueRef = collection(db, 'processing_queue');

        await addDoc(queueRef, {
            sessionId: session.id,
            patientId: patientId,
            therapistId: uid,
            fileId: session.id,
            audioUrl: session.audioURL,
            sessionDate: new Date(session.date).toISOString(),
            status: 'queued',
            createdAt: Date.now()
        });
    },

    // Request Manual Clinical Report Generation
    requestClinicalReport: async (sessionId: string, patientId: string): Promise<any> => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Usuario no autenticado');

            // TODO: Mover la URL base a un archivo de configuración en entorno productivo.
            // Por defecto en local Backend corre en puerto 3000
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

            const response = await fetch(`${backendUrl}/api/patients/${patientId}/sessions/${sessionId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al solicitar el reporte');
            }

            return await response.json();
        } catch (error) {
            console.error('[sessionService] Error en requestClinicalReport:', error);
            throw error;
        }
    },

    // Subscribe to session updates
    subscribeToSession: (sessionId: string, callback: (data: Session | null) => void) => {
        const uid = sessionService.getCurrentUserId();
        const sessionRef = doc(db, 'users', uid, 'sessions', sessionId);

        return onSnapshot(sessionRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                callback(docSnapshot.data() as Session);
            } else {
                callback(null);
            }
        });
    }
};
