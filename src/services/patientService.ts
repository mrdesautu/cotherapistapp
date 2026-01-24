import { database, auth } from '../../firebase';
import { ref, set, get, remove, update } from 'firebase/database';
import { Patient } from '../types/Patient';

export const patientService = {
    // Helper to get current user ID
    getCurrentUserId: () => {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        return uid;
    },

    // Create patient in Firebase under User's node
    createPatient: async (patient: Patient): Promise<void> => {
        const uid = patientService.getCurrentUserId();
        const patientRef = ref(database, `users/${uid}/patients/${patient.id}`);
        await set(patientRef, patient);
    },

    // Update patient
    updatePatient: async (patientId: string, data: Partial<Patient>): Promise<void> => {
        const uid = patientService.getCurrentUserId();
        const patientRef = ref(database, `users/${uid}/patients/${patientId}`);
        await update(patientRef, data);
    },

    // Delete patient
    deletePatient: async (patientId: string): Promise<void> => {
        const uid = patientService.getCurrentUserId();
        const patientRef = ref(database, `users/${uid}/patients/${patientId}`);
        await remove(patientRef);
    },

    // Get patients (only for the current therapist)
    getPatients: async (therapistId: string): Promise<Patient[]> => {
        // We can ignore the passed therapistId and use the auth one for security, 
        // or ensure they match. For now, using auth.
        const uid = patientService.getCurrentUserId();

        // Direct fetch from users/{uid}/patients
        const patientsRef = ref(database, `users/${uid}/patients`);
        const snapshot = await get(patientsRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert object to array
            return Object.values(data) as Patient[];
        }
        return [];
    }
};
