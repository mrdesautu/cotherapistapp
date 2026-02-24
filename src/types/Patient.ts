export interface Patient {
    id: string;
    name: string; // fullName
    email?: string;
    phone?: string;
    photoURL?: string;
    therapistId: string;
    dateOfBirth?: number;
    insurance?: string;
    clinicalSummary?: string;
    metrics?: {
        riskLevel?: string;
        lastAssessmentDate?: number;
        [key: string]: any;
    };
    nextSessionDate?: number;
    notes?: string;
    createdAt: number;
    updatedAt: number;
    syncedAt?: number;
    isDirty?: number; // 0 = synced, 1 = dirty (needs sync)
}
