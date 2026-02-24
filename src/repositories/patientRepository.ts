import { localPatientService } from '../services/db/patientService';
import { patientService } from '../services/patientService';
import { syncService } from '../services/syncService';
import { Patient } from '../types/Patient';
import netinfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { buildPatientsNodePath } from '../utils/rtdbPathBuilder';

export const patientRepository = {
    // Get patients (Offline-first strategy)
    getPatients: async (therapistId: string): Promise<Patient[]> => {
        // 1. Try to get local data first for speed
        let localPatients = await localPatientService.getPatients(therapistId);

        // 2. Check connection and fetch remote data in background to update local
        const netState = await netinfo.fetch();
        if (netState.isConnected) {
            try {
                const remotePatients = await patientService.getPatients(therapistId);
                // Update local cache
                for (const p of remotePatients) {
                    await localPatientService.savePatient({ ...p, isDirty: 0, syncedAt: Date.now() });
                }
                // Re-fetch local to get updated list
                localPatients = await localPatientService.getPatients(therapistId);
            } catch (error) {
                console.warn('Failed to fetch remote patients, using local only', error);
            }
        }

        return localPatients;
    },

    // Create patient
    createPatient: async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
        const newPatient: Patient = {
            ...data,
            id: Crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDirty: 1, // Start as dirty
            syncedAt: 0
        };

        // 1. Save locally
        await localPatientService.savePatient(newPatient);

        // 2. Queue for sync
        const syncPath = buildPatientsNodePath(newPatient.therapistId);
        await syncService.addToQueue(syncPath, newPatient.id, 'create', newPatient);

        return newPatient;
    },

    // Get single patient
    getPatient: async (patientId: string): Promise<Patient | null> => {
        return localPatientService.getPatient(patientId);
    }
};
