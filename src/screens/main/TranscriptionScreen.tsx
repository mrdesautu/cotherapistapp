import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Clipboard, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';

type ParamList = {
    Transcription: { content: string };
};

export const TranscriptionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ParamList, 'Transcription'>>();
    const { content } = route.params;

    const handleCopy = () => {
        Clipboard.setString(content);
        Alert.alert('Copiado', 'Texto copiado al portapapeles');
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: content,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transcripción</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                        <Ionicons name="copy-outline" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                        <Ionicons name="share-outline" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.transcriptionText}>{content || "No hay contenido disponible."}</Text>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    transcriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
        textAlign: 'justify',
    },
});
