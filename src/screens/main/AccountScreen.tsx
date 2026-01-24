import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ProfileImagePicker } from '../../components/profile/ProfileImagePicker';
import { useAuth } from '../../hooks/useAuth';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';

export const AccountScreen = () => {
    const { user, signOut, updateUserProfile, updateProfileImage } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.displayName || '');

    // Temporary image state for preview before saving
    const [tempImage, setTempImage] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setLoading(true);
        try {
            // 1. Update Image if changed
            if (tempImage) {
                await updateProfileImage(tempImage);
            }

            // 2. Update Name
            if (name !== user?.displayName) {
                await updateUserProfile({
                    displayName: name
                });
            }

            Alert.alert('Éxito', 'Perfil actualizado correctamente');
            setTempImage(null); // Clear temp image as it is now saved
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    // Determine what image to show: temp preview or current user photo
    // For Preview: tempImage (base64) needs data uri prefix if coming raw from picker, 
    // BUT ProfileImagePicker component sends it bare? 
    // My ProfileImagePicker passes `asset.base64`.
    // Image source needs `data:image/jpeg;base64,` prefix if it's raw base64.
    // However, `user.photoURL` might be a http URL or a data URI.
    // Let's assume ProfileImagePicker emits raw base64.

    // Helper to get display URI
    const getDisplayImage = () => {
        if (tempImage) return `data:image/jpeg;base64,${tempImage}`;
        return user?.photoURL;
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.title}>Mi Cuenta</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.form}>

                    <ProfileImagePicker
                        currentImage={getDisplayImage()}
                        onImageSelected={setTempImage}
                    />

                    <Text style={styles.emailText}>{user?.email}</Text>

                    <View style={styles.spacer} />

                    <Input
                        label="Nombre Completo"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        icon="person-outline"
                    />

                    <Input
                        label="Email"
                        value={user?.email || ''}
                        editable={false}
                        icon="mail-outline"
                        style={{ color: Colors.textLight }}
                    />

                    <View style={styles.spacer} />

                    <Button
                        title="Guardar Cambios"
                        onPress={handleSave}
                        loading={loading}
                    />

                    <View style={styles.spacer} />
                    <View style={styles.divider} />
                    <View style={styles.spacer} />

                    <Button
                        title="Cerrar Sesión"
                        onPress={handleSignOut}
                        variant="outline"
                        style={{ borderColor: Colors.error }}
                        textStyle={{ color: Colors.error }}
                        icon={<Ionicons name="log-out-outline" size={20} color={Colors.error} />}
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    form: {
        padding: 20,
    },
    emailText: {
        color: Colors.textLight,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    spacer: {
        height: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border
    }
});
