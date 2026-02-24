import { authService } from '../../src/services/authService';
import {
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { set, ref } from 'firebase/database';
import { doc, setDoc } from 'firebase/firestore';
import { auth, database, db } from '../../firebase';

// Mock Firebase dependencies
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    updateProfile: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    onAuthStateChanged: jest.fn(),
    initializeAuth: jest.fn(),
    getReactNativePersistence: jest.fn(),
}));

jest.mock('firebase/database', () => ({
    getDatabase: jest.fn(),
    ref: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    serverTimestamp: jest.fn(() => 1234567890), // Fixed timestamp for testing
}));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 1234567890), // Fixed timestamp for testing
}));

// Mock initialize
jest.mock('../../firebase', () => ({
    auth: {},
    database: {},
    db: {}, // Mock Firestore instance
}));

// Mock local user service (SQLite)
jest.mock('../../src/services/db/userService', () => ({
    localUserService: {
        saveLocalUser: jest.fn(),
        getLocalUser: jest.fn(),
    },
}));

describe('AuthService - Sign Up', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a user in Auth and save to RTDB AND Firestore correctly', async () => {
        // Mock data
        const mockEmail = 'test@example.com';
        const mockPassword = 'password123';
        const mockName = 'Test User';
        const mockUid = 'test-uid-123';

        // Setup mock return values
        (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
            user: { uid: mockUid, email: mockEmail }
        });

        // Execute function
        await authService.signUp(mockEmail, mockPassword, mockName);

        // Verify Auth Creation
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, mockEmail, mockPassword);

        // Verify Profile Update
        expect(updateProfile).toHaveBeenCalledWith(
            expect.objectContaining({ uid: mockUid }),
            { displayName: mockName }
        );

        // Verify RTDB Write
        expect(ref).toHaveBeenCalledWith(database, `users/${mockUid}`);
        expect(set).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                uid: mockUid,
                email: mockEmail,
                displayName: mockName,
                role: 'therapist',
                createdAt: 1234567890,
                lastLoginAt: 1234567890
            })
        );

        // Verify Firestore Write
        expect(doc).toHaveBeenCalledWith(db, 'users', mockUid);
        expect(setDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                uid: mockUid,
                email: mockEmail,
                displayName: mockName,
                role: 'therapist',
                // Firestore uses native Date objects in implementation, let's allow anything for now or check specifically
                createdAt: expect.any(Date),
                lastLoginAt: expect.any(Date)
            })
        );
    });

    it('should throw an error if Auth fails', async () => {
        const mockError = new Error('Auth Failed');
        (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

        await expect(authService.signUp('fail@example.com', 'pass', 'Name'))
            .rejects.toThrow('Auth Failed');

        // Should not proceed to DB write
        expect(set).not.toHaveBeenCalled();
        expect(setDoc).not.toHaveBeenCalled();
    });
});
