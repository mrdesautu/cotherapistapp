import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { WaveBackground } from '../../components/common/WaveBackground';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { signIn, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        redirectUri: makeRedirectUri({
            scheme: 'dualtherapist'
        }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSignIn(id_token);
        }
    }, [response]);

    const handleGoogleSignIn = async (idToken: string) => {
        setLoading(true);
        try {
            await signInWithGoogle(idToken);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            Alert.alert('Error de inicio de sesión', error.message || 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        if (!email) {
            Alert.alert('Recuperar contraseña', 'Por favor ingresa tu email en el campo de arriba para enviarte las instrucciones de recuperación.');
            return;
        }

        Alert.alert(
            'Recuperar contraseña',
            `¿Enviar instrucciones de recuperación a ${email}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Enviar',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await authService.resetPassword(email);
                            Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.');
                        } catch (error: any) {
                            Alert.alert('Error', 'No se pudo enviar el correo. Verifica que el email sea correcto.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
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
                            <Text style={styles.title}>DualTherapist</Text>
                            <Text style={styles.subtitle}>Tu asistente de terapia inteligente</Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>

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

                            <View style={{ alignItems: 'flex-end', marginBottom: 20 }}>
                                <Button
                                    title="¿Olvidaste tu contraseña?"
                                    onPress={handleForgotPassword}
                                    variant="text"
                                    style={{ padding: 0 }}
                                />
                            </View>

                            <Button
                                title="Iniciar Sesión"
                                onPress={handleLogin}
                                loading={loading}
                                style={styles.loginButton}
                            />

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.dividerText}>O</Text>
                                <View style={styles.line} />
                            </View>

                            {/* Google Sign-In */}
                            <Button
                                title="Continuar con Google"
                                onPress={() => promptAsync()}
                                variant="google"
                                loading={loading && false}
                                icon={<Text style={{ fontSize: 18, marginRight: 10 }}>G</Text>}
                                disabled={!request}
                            />

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                                <Button
                                    title="Regístrate"
                                    onPress={() => navigation.navigate('Register')}
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
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
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
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 24,
    },
    loginButton: {
        marginTop: 10,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        marginHorizontal: 10,
        color: Colors.textLight,
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
