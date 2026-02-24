import { auth } from '../../firebase';

const BASE_URL = 'http://localhost:4000/api'; // Standard backend port

export const appointmentService = {
    /**
     * Get the Google OAuth URL for the current user
     */
    getGoogleAuthUrl: async () => {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const token = await user.getIdToken();
        const response = await fetch(`${BASE_URL}/auth/google/auth-url`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get Google Auth URL');
        }

        const data = await response.json();
        return data.url;
    },

    /**
     * Create a new appointment
     */
    createAppointment: async (appointmentData: any) => {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const token = await user.getIdToken();
        const response = await fetch(`${BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appointmentData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create appointment');
        }

        return response.json();
    },

    /**
     * Get appointments for the current user
     */
    getAppointments: async (role: 'therapist' | 'patient', startDate?: string, endDate?: string) => {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const token = await user.getIdToken();
        let url = `${BASE_URL}/appointments?userId=${user.uid}&role=${role}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        return response.json();
    }
};
