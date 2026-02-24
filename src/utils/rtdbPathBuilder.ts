/**
 * Utility to build Realtime Database (RTDB) path nodes dynamically from environment templates.
 */

/**
 * Builds the path for a specific user node.
 * @param uid The authenticated user UID
 * @returns e.g. "users/A1B2C3D4"
 */
export const buildUserNodePath = (uid: string): string => {
    const template = process.env.EXPO_PUBLIC_RTDB_USER_NODE_TEMPLATE || 'users/{uid}';
    return template.replace('{uid}', uid);
};

/**
 * Builds the path for the patients list node of a therapist.
 * @param therapistId The ID of the therapist
 * @returns e.g. "users/A1B2C3D4/patients"
 */
export const buildPatientsNodePath = (therapistId: string): string => {
    const template = process.env.EXPO_PUBLIC_RTDB_PATIENTS_NODE_TEMPLATE || 'users/{therapistId}/patients';
    return template.replace('{therapistId}', therapistId);
};

/**
 * Builds the path for the sessions list node of a therapist.
 * @param therapistId The ID of the therapist
 * @returns e.g. "users/A1B2C3D4/sessions"
 */
export const buildSessionsNodePath = (therapistId: string): string => {
    const template = process.env.EXPO_PUBLIC_RTDB_SESSIONS_NODE_TEMPLATE || 'users/{therapistId}/sessions';
    return template.replace('{therapistId}', therapistId);
};
