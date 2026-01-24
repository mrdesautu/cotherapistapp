export interface Session {
    id: string;
    patientId: string;
    therapistId: string;
    audioURL?: string; // Local URI or Remote URL
    duration: number; // in seconds
    date: number; // timestamp
    notes?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: number;
    syncedAt?: number;
    isDirty?: number;
}
