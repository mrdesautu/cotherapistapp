import { db, auth } from '../../firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
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
        const patientRef = doc(db, 'users', uid, 'patients', patient.id);
        await setDoc(patientRef, patient);
    },

    // Update patient
    updatePatient: async (patientId: string, data: Partial<Patient>): Promise<void> => {
        const uid = patientService.getCurrentUserId();
        const patientRef = doc(db, 'users', uid, 'patients', patientId);
        await updateDoc(patientRef, data);
    },

    // Delete patient
    deletePatient: async (patientId: string): Promise<void> => {
        const uid = patientService.getCurrentUserId();
        const patientRef = doc(db, 'users', uid, 'patients', patientId);
        await deleteDoc(patientRef);
    },

    // Get patients (only for the current therapist)
    getPatients: async (therapistId: string): Promise<Patient[]> => {
        const uid = patientService.getCurrentUserId();

        // Direct fetch from users/{uid}/patients
        const patientsRef = collection(db, 'users', uid, 'patients');
        const snapshot = await getDocs(patientsRef);

        if (!snapshot.empty) {
            return snapshot.docs.map(doc => doc.data() as Patient);
        }
        return [];
    }
};
