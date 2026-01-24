import { storage, auth } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export const storageService = {
    // Helper to get current user ID
    getCurrentUserId: () => {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Usuario no autenticado');
        return uid;
    },

    /**
     * Uploads a file (blob/file) to Firebase Storage
     * @param uri Local URI of the file
     * @param path Storage path (e.g. 'patients/123/profile.jpg')
     * @returns Promise with download URL
     */
    uploadFile: async (uri: string, path: string): Promise<string> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, blob);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Observe state change events such as progress, pause, and resume
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                    },
                    (error) => {
                        console.error('Upload failed:', error);
                        reject(error);
                    },
                    async () => {
                        // Handle successful uploads on complete
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error('Error preparing file for upload:', error);
            throw error;
        }
    },

    /**
     * Uploads session audio
     */
    uploadSessionAudio: async (sessionId: string, uri: string): Promise<string> => {
        const uid = storageService.getCurrentUserId();
        const path = `users/${uid}/sessions/${sessionId}/audio.m4a`;
        return storageService.uploadFile(uri, path);
    },

    /**
     * Uploads patient profile photo
     */
    uploadPatientPhoto: async (patientId: string, uri: string): Promise<string> => {
        const uid = storageService.getCurrentUserId();
        // We append a timestamp to avoid caching issues if updated
        const timestamp = Date.now();
        const path = `users/${uid}/patients/${patientId}/profile_${timestamp}.jpg`;
        return storageService.uploadFile(uri, path);
    },

    /**
     * Deletes session audio
     */
    deleteSessionAudio: async (sessionId: string): Promise<void> => {
        try {
            const uid = storageService.getCurrentUserId();
            const path = `users/${uid}/sessions/${sessionId}/audio.m4a`;
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
        } catch (error: any) {
            if (error.code === 'storage/object-not-found') {
                // Ignore if not found
                return;
            }
            console.error('Error deleting session audio:', error);
            // We don't throw, just log, to allow metadata delete to proceed
        }
    }
};
