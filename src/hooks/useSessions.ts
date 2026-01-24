import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types/Session';
import { sessionRepository } from '../repositories/sessionRepository';

export const useSessions = (patientId?: string) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!patientId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await sessionRepository.getSessionsByPatient(patientId);
            setSessions(data);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError('No se pudieron cargar las sesiones');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const deleteSession = async (sessionId: string, therapistId: string) => {
        try {
            await sessionRepository.deleteSession(sessionId, therapistId);
            await fetchSessions(); // Refresh list
        } catch (err) {
            console.error('Error deleting session:', err);
            throw err;
        }
    };

    return {
        sessions,
        loading,
        error,
        refreshSessions: fetchSessions,
        deleteSession
    };
};
