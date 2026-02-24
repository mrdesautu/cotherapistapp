import { localSessionService } from '../services/db/sessionService';
import { sessionService } from '../services/sessionService';
import { syncService } from '../services/syncService';
import { Session } from '../types/Session';
import * as Crypto from 'expo-crypto';
import { buildSessionsNodePath } from '../utils/rtdbPathBuilder';

export const sessionRepository = {
    createSession: async (
        patientId: string,
        therapistId: string,
        audioUri: string,
        duration: number
    ): Promise<Session> => {
        const newSession: Session = {
            id: Crypto.randomUUID(),
            patientId,
            therapistId,
            audioURL: audioUri, // Initially local URI
            duration: 0,
            date: Date.now(),
            status: 'PENDING_UPLOAD',
            globalStatus: 'PENDING_UPLOAD',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncedAt: 0,
            isDirty: 1,
        };

        // 1. Save locally
        await localSessionService.saveSession(newSession);

        // 2. Queue for sync
        const syncPath = buildSessionsNodePath(therapistId);

        // Queue metadata creation
        await syncService.addToQueue(syncPath, newSession.id, 'create', newSession);

        // Queue audio upload
        await syncService.addToQueue(syncPath, newSession.id, 'upload_session_audio', { localUri: audioUri });

        return newSession;
    },

    getSessionsByPatient: async (patientId: string): Promise<Session[]> => {
        return localSessionService.getSessionsByPatient(patientId);
    },

    deleteSession: async (sessionId: string, therapistId: string): Promise<void> => {
        // 1. Delete locally
        await localSessionService.deleteSession(sessionId);

        // 2. Queue for sync (delete from remote)
        const syncPath = buildSessionsNodePath(therapistId);
        await syncService.addToQueue(syncPath, sessionId, 'delete', {});
    }
};
