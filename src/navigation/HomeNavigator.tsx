import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/HomeScreen';
import { PatientFormScreen } from '../screens/main/PatientFormScreen';
import { PatientDetailScreen } from '../screens/main/PatientDetailScreen';
import { SessionDetailScreen } from '../screens/main/SessionDetailScreen';
import { TranscriptionScreen } from '../screens/main/TranscriptionScreen';
import { ClinicalReportScreen } from '../screens/main/ClinicalReportScreen';

// Export type for navigation params if needed later
// export type HomeStackParamList = { ... }

const Stack = createNativeStackNavigator();

export const HomeNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="PatientList" component={HomeScreen} />
            <Stack.Screen
                name="AddPatient"
                component={PatientFormScreen}
                options={{
                    presentation: 'modal', // Nice touch for input forms
                    animation: 'slide_from_bottom'
                }}
            />
            <Stack.Screen
                name="PatientDetail"
                component={PatientDetailScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="SessionDetail"
                component={SessionDetailScreen}
                options={{ title: 'Detalle de Sesión', animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="TranscriptionScreen"
                component={TranscriptionScreen}
                options={{ title: 'Transcripción', animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="ClinicalReportScreen"
                component={ClinicalReportScreen}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
        </Stack.Navigator>
    );
};
