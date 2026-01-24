import React, { useState } from 'react';
import { View, Alert, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';

interface ProfileImagePickerProps {
    currentImage?: string;
    onImageSelected: (base64: string) => void;
}

export const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({ currentImage, onImageSelected }) => {

    // Función para manejar la selección
    const handlePickImage = async (useCamera: boolean) => {
        try {
            let permissionResult;

            if (useCamera) {
                permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            } else {
                permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            }

            if (permissionResult.status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se necesita acceso para seleccionar una imagen.');
                return;
            }

            const result = await (useCamera
                ? ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                })
                : ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    base64: true,
                })
            );

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (asset.base64) {
                    onImageSelected(asset.base64);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al seleccionar la imagen.');
            console.error(error);
        }
    };

    const showOptions = () => {
        Alert.alert(
            'Cambiar Foto de Perfil',
            'Elige una opción',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Tomar Foto', onPress: () => handlePickImage(true) },
                { text: 'Elegir de Galería', onPress: () => handlePickImage(false) },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={showOptions} style={styles.imageContainer}>
                {currentImage ? (
                    <Image source={{ uri: currentImage }} style={styles.image} />
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="person" size={80} color={Colors.textLight} />
                    </View>
                )}
                <View style={styles.editIconContainer}>
                    <Ionicons name="camera" size={20} color="white" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    imageContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 3,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
    image: {
        width: 144,
        height: 144,
        borderRadius: 72,
    },
    placeholder: {
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
});
