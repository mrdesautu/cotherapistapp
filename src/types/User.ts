export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'therapist' | 'patient';
    createdAt: number;
    lastLoginAt: number;
}
