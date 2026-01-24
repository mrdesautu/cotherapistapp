import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Colors } from '../../constants/Colors';
import { usePatients } from '../../hooks/usePatients';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '../../services/storageService';

export const PatientFormScreen = () => {
    const navigation = useNavigation();
    const { addPatient } = usePatients();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handlePickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar una foto.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handlePickImage = () => {
        Alert.alert(
            'Foto de Perfil',
            'Selecciona una opción',
            [
                { text: 'Tomar Foto', onPress: handleTakePhoto },
                { text: 'Abrir Galería', onPress: handlePickFromGallery },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setLoading(true);
        try {
            let photoURL = null;
            if (photoUri) {
                // Upload to a temp path for now, real path ideally handled by repository logic with ID
                // But for simplicity/prototype, we use timestamp
                photoURL = await storageService.uploadFile(photoUri, `temp_uploads/${Date.now()}.jpg`);
            }

            await addPatient({
                name,
                email,
                phone,
                notes,
                photoURL: photoURL || undefined
            });
            Alert.alert('Éxito', 'Paciente agregado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'No se pudo guardar el paciente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Button
                    title=""
                    icon={<Ionicons name="arrow-back" size={24} color={Colors.text} />}
                    onPress={() => navigation.goBack()}
                    variant="text"
                    style={styles.backButton}
                />
                <Text style={styles.title}>Nuevo Paciente</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.form}>
                    {/* Photo Placeholder */}
                    <View style={styles.photoContainer}>
                        <TouchableOpacity onPress={handlePickImage} style={styles.photoPlaceholder}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                            ) : (
                                <Ionicons name="camera" size={30} color={Colors.textLight} />
                            )}
                        </TouchableOpacity>
                        <Text style={styles.photoText}>{photoUri ? 'Cambiar foto' : 'Agregar foto'}</Text>
                    </View>

                    <Input
                        label="Nombre Completo *"
                        placeholder="Ej: Juan Pérez"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        icon="person-outline"
                    />

                    <Input
                        label="Email"
                        placeholder="juan@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        icon="mail-outline"
                    />

                    <Input
                        label="Teléfono"
                        placeholder="+54 9 11 ..."
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        icon="call-outline"
                    />

                    <Input
                        label="Notas Iniciales"
                        placeholder="Diagnóstico preliminar, observaciones..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        style={{ height: 100, textAlignVertical: 'top' }}
                        icon="document-text-outline"
                    />

                    <View style={styles.spacer} />

                    <Button
                        title="Guardar Paciente"
                        onPress={handleSave}
                        loading={loading}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 40,
        paddingHorizontal: 0,
        marginVertical: 0
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    form: {
        padding: 20,
    },
    photoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    photoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    photoText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    spacer: {
        height: 20,
    },
});
