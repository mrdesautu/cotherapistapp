import React, { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { initDatabase } from './src/db/sqlite';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './src/services/syncService';

export default function App() {
  useEffect(() => {
    initDatabase().catch(err => console.error(err));

    // Auto-sync when connection is restored
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncService.processQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
