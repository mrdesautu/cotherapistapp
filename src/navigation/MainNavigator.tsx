import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { HomeNavigator } from './HomeNavigator';

import { SessionScreen } from '../screens/main/SessionScreen';

import { AccountScreen } from '../screens/main/AccountScreen';
import { TurnosScreen } from '../screens/main/TurnosScreen';



const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = '';

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Session') {
                        iconName = focused ? 'mic' : 'mic-outline';
                    } else if (route.name === 'Turnos') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Account') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeNavigator}
                options={{ title: 'Pacientes' }}
            />
            <Tab.Screen
                name="Turnos"
                component={TurnosScreen}
                options={{ title: 'Agenda' }}
            />
            <Tab.Screen name="Session" component={SessionScreen} options={{ title: 'Sesión' }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Cuenta' }} />
        </Tab.Navigator>
    );
};
