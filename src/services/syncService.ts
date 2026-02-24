import { getDBConnection } from '../db/sqlite';
import netinfo from '@react-native-community/netinfo';
import { db, auth } from '../../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { storageService } from './storageService';
import { localSessionService } from './db/sessionService';

const getDb = () => getDBConnection();

interface SyncItem {
    id: number;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'upload_session_audio';
    data: string; // JSON string
    attempts: number;
}

// Lock to prevent concurrent syncs
let isSyncing = false;

export const syncService = {
    // Add item to sync queue
    addToQueue: async (
        entityType: string,
        entityId: string,
        action: 'create' | 'update' | 'delete' | 'upload_session_audio',
        data: any
    ) => {
        const dataStr = JSON.stringify(data);
        try {
            const sqliteDb = getDb();
            sqliteDb.runSync(
                `INSERT INTO sync_queue (entityType, entityId, action, data, createdAt, attempts)
         VALUES (?, ?, ?, ?, ?, 0)`,
                [entityType, entityId, action, dataStr, Date.now()]
            );
            // Try to sync immediately if online
            const netState = await netinfo.fetch();
            if (netState.isConnected) {
                // Ensure we don't await here to not block UI, but calling async func implies promise
                syncService.processQueue();
            }
        } catch (error) {
            console.error('Error adding to sync queue:', error);
        }
    },

    // Process the queue
    processQueue: async () => {
        if (isSyncing) return;

        try {
            isSyncing = true;
            const netState = await netinfo.fetch();
            if (!netState.isConnected) return;

            // Check if user is authenticated
            if (!auth.currentUser) {
                console.log('Sync skipped: User not authenticated');
                return;
            }

            // Process in batches
            const sqliteDb = getDb();
            const items = sqliteDb.getAllSync<SyncItem>(
                `SELECT * FROM sync_queue ORDER BY createdAt ASC LIMIT 10`
            );

            if (items.length === 0) return;

            console.log(`Processing ${items.length} items from sync queue...`);

            for (const item of items) {
                try {
                    const data = item.data ? JSON.parse(item.data) : null;
                    await syncService.syncItemToFirebase(item, data);

                    // Remove from queue on success
                    sqliteDb.runSync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
                } catch (error: any) {
                    console.error(`Error syncing item ${item.id}:`, error);

                    // If permission denied, likely a bad path or legacy item. Remove strictly to unblock queue.
                    const errString = String(error).toLowerCase();
                    if (errString.includes('permission-denied') || errString.includes('permission_denied') || errString.includes('permission denied')) {
                        console.warn(`Removing item ${item.id} from sync queue due to PERMISSION_DENIED`);
                        sqliteDb.runSync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
                        continue; // Skip incrementing attempts
                    }

                    // Increment attempts
                    sqliteDb.runSync(
                        `UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?`,
                        [item.id]
                    );
                }
            }

            // Check if more items exist
            const remaining = sqliteDb.getAllSync('SELECT count(*) as count FROM sync_queue');
            // @ts-ignore
            if (remaining[0]?.count > 0) {
                // Trigger next batch
                isSyncing = false; // Reset lock before recursive call or just let it finish and next trigger handles it.
                // Better: let the lock release, and whoever calls it again works. 
                // Or loop internally. For simplicity, just release lock.
            }

        } catch (error) {
            console.error('Error processing sync queue:', error);
        } finally {
            isSyncing = false;
        }
    },

    // Sync individual item
    syncItemToFirebase: async (item: SyncItem, data: any) => {
        // Construct path. Use strict Firestore collection paths.
        // If the entityType is passed as "users/{uid}/patients", Firestore usage is doc(db, "users/{uid}/patients/{id}")
        // However, doc() takes arguments: doc(db, path) OR doc(db, col, id, col, id...)
        // To be safe, we split by '/' and pass as args, OR just pass the full path string if it's valid.

        // Assumption: item.entityType is the collection path (e.g. "users/123/sessions")
        // and item.entityId is the doc ID.

        let docRef;
        try {
            // Check if entityType is a path like "patients" or "users/123/patients"
            // If it starts with users/, it's likely a full path.
            if (item.entityType.startsWith('users/')) {
                docRef = doc(db, `${item.entityType}/${item.entityId}`);
            } else {
                // Fallback or specific handling if entityType is just "patients" (legacy?)
                // As we control usage, we should assume entityType is the parent path.
                docRef = doc(db, `${item.entityType}/${item.entityId}`);
            }
        } catch (e) {
            console.error("Invalid path construction", item.entityType, item.entityId);
            throw e;
        }


        switch (item.action) {
            case 'create':
            case 'update':
                if (data) {
                    await setDoc(docRef, { ...data, lastSyncedAt: Date.now() }, { merge: true });
                }
                break;
            case 'delete':
                await deleteDoc(docRef);
                // Also attempt to delete audio file
                if (item.entityType.includes('sessions')) { // Check if it's a session deletion
                    // entityId is sessionId in this case
                    await storageService.deleteSessionAudio(item.entityId);
                }
                break;
            case 'upload_session_audio':
                if (data && data.localUri) {
                    console.log(`Uploading audio for session ${item.entityId}...`);
                    const downloadUrl = await storageService.uploadSessionAudio(item.entityId, data.localUri);

                    // Update the remote session record with the audioURL
                    await updateDoc(docRef, { audioURL: downloadUrl });

                    // Update local database to reflect the remote URL (verification of upload)
                    await localSessionService.updateSessionAudioUrl(item.entityId, downloadUrl);

                    console.log(`Audio uploaded and session updated: ${downloadUrl}`);
                }
                break;
        }
    }
};
