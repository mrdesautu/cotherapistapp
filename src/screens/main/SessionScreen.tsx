import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { usePatients } from '../../hooks/usePatients';
import { Button } from '../../components/common/Button';
import { Patient } from '../../types/Patient';
import { sessionRepository } from '../../repositories/sessionRepository';
import { useAuth } from '../../hooks/useAuth';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';

type SessionScreenRouteProp = RouteProp<{ Session: { patientId?: string } }, 'Session'>;

export const SessionScreen = () => {
    const { user } = useAuth();
    const route = useRoute<SessionScreenRouteProp>();
    const navigation = useNavigation();
    const { isRecording, isPaused, duration, startRecording, stopRecording, pauseRecording, resumeRecording, hasPermission } = useAudioRecorder();
    const { patients } = usePatients();

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (route.params?.patientId && patients.length > 0) {
            const patient = patients.find(p => p.id === route.params.patientId);
            if (patient) setSelectedPatient(patient);
        }
    }, [route.params?.patientId, patients]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleRecording = async () => {
        if (!selectedPatient) {
            Alert.alert('Seleccionar Paciente', 'Por favor selecciona un paciente antes de iniciar la sesión.');
            return;
        }

        if (isRecording) {
            // Stop logic
            const result = await stopRecording();
            if (result && user) {
                setIsSaving(true);
                try {
                    await sessionRepository.createSession(
                        selectedPatient.id,
                        user.uid,
                        result.uri || '',
                        result.duration
                    );
                    Alert.alert('Sesión Guardada', 'La grabación se ha guardado correctamente.');
                    setSelectedPatient(null); // Reset after save
                } catch (error) {
                    Alert.alert('Error', 'No se pudo guardar la sesión.');
                } finally {
                    setIsSaving(false);
                }
            }
        } else {
            // Start logic
            await startRecording();
        }
    };

    const renderPatientItem = ({ item }: { item: Patient }) => (
        <TouchableOpacity
            style={styles.patientItem}
            onPress={() => {
                setSelectedPatient(item);
                setPickerVisible(false);
            }}
        >
            <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.patientName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Nueva Sesión</Text>
            </View>

            <View style={styles.content}>
                {/* Patient Selector */}
                <View style={styles.selectorContainer}>
                    <Text style={styles.label}>Paciente</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => !isRecording && setPickerVisible(true)}
                        disabled={isRecording}
                    >
                        {selectedPatient ? (
                            <View style={styles.selectedPatient}>
                                <View style={styles.avatarSmall}>
                                    <Text style={styles.avatarTextSmall}>{selectedPatient.name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.selectedText}>{selectedPatient.name}</Text>
                            </View>
                        ) : (
                            <Text style={styles.placeholderText}>Seleccionar paciente...</Text>
                        )}
                        <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Recording Interface */}
                <View style={styles.recorderContainer}>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timer}>{formatTime(duration)}</Text>
                        <Text style={styles.statusText}>
                            {isRecording ? (isPaused ? 'Grabación Pausada' : 'Grabando...') : 'Listo para grabar'}
                        </Text>
                    </View>

                    <View style={styles.controlsRow}>
                        {isRecording ? (
                            <>
                                {/* Pause/Resume Button */}
                                <TouchableOpacity
                                    style={[styles.smallControlButton, { marginRight: 20 }]}
                                    onPress={isPaused ? resumeRecording : pauseRecording}
                                >
                                    <Ionicons
                                        name={isPaused ? "play" : "pause"}
                                        size={30}
                                        color={Colors.primary}
                                    />
                                </TouchableOpacity>

                                {/* Stop Button */}
                                <TouchableOpacity
                                    style={[styles.recordButton, styles.recording]}
                                    onPress={handleToggleRecording}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Ionicons name="stop" size={40} color={Colors.white} />
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Start Button */
                            <TouchableOpacity
                                style={[
                                    styles.recordButton,
                                    (!selectedPatient || isSaving) ? styles.disabled : null
                                ]}
                                onPress={handleToggleRecording}
                                disabled={!selectedPatient || isSaving}
                            >
                                <Ionicons name="mic" size={40} color={Colors.white} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isRecording && (
                        <View style={styles.waveContainer}>
                            {/* Placeholder for visualizer */}
                            <Text style={{ color: Colors.primary }}>• • • • • • •</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Patient Picker Modal */}
            <Modal
                visible={isPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Paciente</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={patients}
                            renderItem={renderPatientItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={styles.emptyListText}>No tienes pacientes registrados.</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 8,
        fontWeight: '600',
    },
    selectorContainer: {
        marginBottom: 40,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedPatient: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    placeholderText: {
        fontSize: 16,
        color: Colors.textLight,
    },
    recorderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    timer: {
        fontSize: 64,
        fontWeight: '200',
        color: Colors.primary,
        fontVariant: ['tabular-nums'],
    },
    statusText: {
        fontSize: 16,
        color: Colors.textLight,
        marginTop: 10,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    recording: {
        backgroundColor: Colors.error,
        shadowColor: Colors.error,
    },
    disabled: {
        backgroundColor: Colors.border,
        shadowColor: 'transparent',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallControlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    waveContainer: {
        marginTop: 30,
        height: 40,
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    listContent: {
        padding: 20,
    },
    patientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    patientName: {
        fontSize: 16,
        color: Colors.text,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarTextSmall: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyListText: {
        textAlign: 'center',
        padding: 20,
        color: Colors.textLight,
    },
});
