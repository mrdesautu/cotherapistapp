import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';

import { WaveBackground } from '../../components/common/WaveBackground';

import signupSchema from '../../validations/signupSchema';

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { signUp } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setLoading(true);
        try {
            // Validar con Yup
            signupSchema.validateSync(
                { name, email, password, confirmPassword },
                { abortEarly: false }
            );

            // Si pasa validación, proceder con registro
            await signUp(email, password, name);
            // Auth state change will handle navigation
        } catch (error: any) {
            // Manejar errores de validación (Yup) o de Firebase
            if (error.name === 'ValidationError') {
                Alert.alert('Error de validación', error.errors[0]); // Mostrar primer error
            } else {
                Alert.alert('Error de registro', error.message || 'Ocurrió un error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <WaveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Crear Cuenta</Text>
                            <Text style={styles.subtitle}>Únete a Cotherapist</Text>
                        </View>

                        <View style={styles.form}>
                            <Input
                                label="Nombre Completo"
                                placeholder="Ej: David García"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                icon="person-outline"
                            />

                            <Input
                                label="Email"
                                placeholder="tu@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                icon="mail-outline"
                            />

                            <Input
                                label="Contraseña"
                                placeholder="******"
                                value={password}
                                onChangeText={setPassword}
                                isPassword
                                icon="lock-closed-outline"
                            />

                            <Input
                                label="Confirmar Contraseña"
                                placeholder="******"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                isPassword
                                icon="lock-closed-outline"
                            />

                            <Button
                                title="Registrarse"
                                onPress={handleRegister}
                                loading={loading}
                                style={styles.registerButton}
                            />

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                                <Button
                                    title="Inicia Sesión"
                                    onPress={() => navigation.navigate('Login')}
                                    variant="text"
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </WaveBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textLight,
    },
    form: {
        width: '100%',
    },
    registerButton: {
        marginTop: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: Colors.text,
    },
});
