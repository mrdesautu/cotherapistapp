import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = () => {
  if (!db) {
    try {
      db = SQLite.openDatabaseSync('dualtherapist.db');
    } catch (e) {
      console.error("Failed to open database", e);
      // Attempt to re-open or handle error
      throw e;
    }
  }
  return db;
};

export const closeConnection = () => {
  if (db) {
    try {
      db.closeSync();
    } catch (e) {
      console.warn("Error closing DB", e);
    }
    db = null;
  }
}

export const initDatabase = async () => {
  const database = getDBConnection();
  try {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        displayName TEXT,
        photoURL TEXT,
        role TEXT,
        phone TEXT,
        specialization TEXT,
        createdAt INTEGER,
        lastLoginAt INTEGER,
        syncedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        photoURL TEXT,
        therapistId TEXT NOT NULL,
        nextSessionDate INTEGER,
        notes TEXT,
        createdAt INTEGER,
        updatedAt INTEGER,
        syncedAt INTEGER,
        isDirty INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        therapistId TEXT NOT NULL,
        audioURL TEXT,
        duration INTEGER,
        date INTEGER,
        notes TEXT,
        status TEXT,
        createdAt INTEGER,
        syncedAt INTEGER,
        isDirty INTEGER DEFAULT 0,
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS progress (
        patientId TEXT PRIMARY KEY,
        wellbeingData TEXT,
        sessionsData TEXT,
        lastUpdated INTEGER,
        syncedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        createdAt INTEGER,
        attempts INTEGER DEFAULT 0
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
