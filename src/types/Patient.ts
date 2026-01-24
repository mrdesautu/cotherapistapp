export interface Patient {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    photoURL?: string;
    therapistId: string;
    nextSessionDate?: number;
    notes?: string;
    createdAt: number;
    updatedAt: number;
    syncedAt?: number;
    isDirty?: number; // 0 = synced, 1 = dirty (needs sync)
}
