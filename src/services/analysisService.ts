import { db, auth } from '../../firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export interface AnalysisData {
    id?: string;
    sessionId: string;
    summary: string;
    mentalStatus: any;
    riskAssessment: any;
    nextSessionPlan: any;
    timestamp: number;
}

export const analysisService = {
    // Helper to get current user ID
    getCurrentUserId: () => {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        return uid;
    },

    // Save Analysis to subcollection
    saveAnalysis: async (sessionId: string, analysis: AnalysisData): Promise<void> => {
        const uid = analysisService.getCurrentUserId();

        // Use 'current' as ID if we only keep one active analysis, or auto-ID for history
        // For this schema, we'll auto-generate or use a timestamp-based ID if history is needed
        // But implementation plan suggested 'current' or specific ID. 
        // Let's use 'current' for the main analysis to make retrieval easy.

        const analysisRef = doc(db, 'users', uid, 'sessions', sessionId, 'analysis', 'current');
        await setDoc(analysisRef, analysis);

        // Also update the session with a summary and status
        const sessionRef = doc(db, 'users', uid, 'sessions', sessionId);
        await setDoc(sessionRef, {
            status: 'analyzed',
            analysisId: 'current',
            summary: analysis.summary.substring(0, 100) + '...'
        }, { merge: true });
    },

    // Get Analysis
    getAnalysis: async (sessionId: string): Promise<AnalysisData | null> => {
        const uid = analysisService.getCurrentUserId();
        const analysisRef = doc(db, 'users', uid, 'sessions', sessionId, 'analysis', 'current');
        const snapshot = await getDoc(analysisRef);

        if (snapshot.exists()) {
            return snapshot.data() as AnalysisData;
        }
        return null;
    }
};
