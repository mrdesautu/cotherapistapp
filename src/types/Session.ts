export type GlobalSessionStatus = 'SCHEDULED' | 'PENDING_UPLOAD' | 'PROCESSING' | 'GENERATING_REPORT' | 'COMPLETED' | 'FAILED';

export type WorkflowStageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export type WorkflowStageName = 'upload' | 'transcription' | 'extraction' | 'embedding' | 'analysis' | 'reporting';

export interface WorkflowStage {
    status: WorkflowStageStatus;
    startedAt: number | null;
    completedAt: number | null;
    provider?: string;
}

export interface ProcessingWorkflow {
    currentStage: WorkflowStageName | null;
    errorDetails: string | null;
    stages: {
        upload: WorkflowStage;
        transcription: WorkflowStage;
        extraction: WorkflowStage;
        embedding: WorkflowStage;
        analysis: WorkflowStage;
        reporting?: WorkflowStage;
    };
}

export interface Session {
    // Identifiers & Relationships
    id: string;
    patientId: string;
    therapistId: string;
    appointmentId?: string;
    sessionNum?: number;
    sessionType?: string;

    // General Metadata
    date: number; // timestamp
    duration?: number;
    durationMinutes?: number;
    notes?: string;
    summary?: string;

    // Sync Control
    createdAt: number;
    updatedAt: number;
    syncedAt?: number;
    isDirty?: number;

    // Artifacts
    audioURL?: string;
    transcription?: string;
    analysisId?: string;
    report?: {
        summary?: string;
        keywords?: string[];
        postSessionReport?: any;
    };

    // Status
    status?: string; // backwards compatibility
    globalStatus: GlobalSessionStatus;
    processingWorkflow?: ProcessingWorkflow;
}
