import { useState, useEffect, useCallback } from 'react';
import { Patient } from '../types/Patient';
import { patientRepository } from '../repositories/patientRepository';
import { useAuth } from './useAuth';

export const usePatients = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPatients = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await patientRepository.getPatients(user.uid);
            setPatients(data);
        } catch (err: any) {
            console.error('Error fetching patients:', err);
            setError(err.message || 'No se pudieron cargar los pacientes');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const addPatient = async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'therapistId'>) => {
        if (!user) return;

        try {
            const newPatientData = {
                ...data,
                therapistId: user.uid
            };
            const newPatient = await patientRepository.createPatient(newPatientData as any);
            setPatients(prev => [...prev, newPatient]);
            return newPatient;
        } catch (err: any) {
            console.error('Error creating patient:', err);
            throw err;
        }
    };

    return {
        patients,
        isLoading,
        error,
        refetch: fetchPatients,
        addPatient
    };
};
