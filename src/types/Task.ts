export interface TherapeuticTask {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    duration: number; // estimated minutes
    createdAt: number;
}

export interface TaskAssignment {
    id: string;
    taskId: string;
    patientId: string;
    therapistId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
    assignedDate: number;
    dueDate?: number;
    completedDate?: number;
    patientNotes?: string;
    therapistFeedback?: string;
    syncedAt?: number;
    isDirty?: number;
}
