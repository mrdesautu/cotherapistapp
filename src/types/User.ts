export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'therapist' | 'patient' | 'admin';
    profile?: {
        licenseNumber?: string;
        insurance?: string;
        dateOfBirth?: number;
        [key: string]: any;
    };
    createdAt: number;
    lastLoginAt: number;
}
