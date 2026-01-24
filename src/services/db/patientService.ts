import { getDBConnection } from '../../db/sqlite';
import { Patient } from '../../types/Patient';

const db = getDBConnection();

export const localPatientService = {
    // Get all patients for a therapist
    getPatients: async (therapistId: string): Promise<Patient[]> => {
        try {
            const rows = db.getAllSync<any>(
                `SELECT * FROM patients WHERE therapistId = ? ORDER BY name ASC`,
                [therapistId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting local patients:', error);
            return [];
        }
    },

    // Get single patient
    getPatient: async (patientId: string): Promise<Patient | null> => {
        try {
            const row = db.getFirstSync<any>(
                `SELECT * FROM patients WHERE id = ?`,
                [patientId]
            );
            return row || null;
        } catch (error) {
            console.error('Error getting local patient:', error);
            return null;
        }
    },

    // Create or Update patient locally
    savePatient: async (patient: Patient): Promise<void> => {
        try {
            db.runSync(
                `INSERT OR REPLACE INTO patients (
          id, name, email, phone, photoURL, therapistId, 
          nextSessionDate, notes, createdAt, updatedAt, syncedAt, isDirty
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    patient.id,
                    patient.name,
                    patient.email || null,
                    patient.phone || null,
                    patient.photoURL || null,
                    patient.therapistId,
                    patient.nextSessionDate || null,
                    patient.notes || null,
                    patient.createdAt,
                    patient.updatedAt,
                    patient.syncedAt || null,
                    patient.isDirty || 1
                ]
            );
        } catch (error) {
            console.error('Error saving local patient:', error);
            throw error;
        }
    },

    // Delete patient locally
    deletePatient: async (patientId: string): Promise<void> => {
        try {
            db.runSync(`DELETE FROM patients WHERE id = ?`, [patientId]);
        } catch (error) {
            console.error('Error deleting local patient:', error);
            throw error;
        }
    }
};
