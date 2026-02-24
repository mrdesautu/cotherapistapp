import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { GlassCard } from '../common/GlassCard';
import { Button } from '../common/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { patientService } from '../../services/patientService';
import { auth } from '../../../firebase';
import { Patient } from '../../types/Patient';

import { appointmentService } from '../../services/appointmentService';

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: string;
}

export const BookingModal = ({ visible, onClose, onSuccess, selectedDate }: BookingModalProps) => {
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [fetchingPatients, setFetchingPatients] = useState(false);

    // Form State
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [date, setDate] = useState(new Date(selectedDate));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [sessionType, setSessionType] = useState<'Virtual' | 'Presencial'>('Virtual');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (visible) {
            loadPatients();
            setDate(new Date(selectedDate));
        }
    }, [visible, selectedDate]);

    const loadPatients = async () => {
        try {
            setFetchingPatients(true);
            const uid = auth.currentUser?.uid;
            if (uid) {
                const data = await patientService.getPatients(uid);
                setPatients(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFetchingPatients(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedPatient) {
            Alert.alert('Error', 'Por favor selecciona un paciente');
            return;
        }

        setLoading(true);
        try {
            await appointmentService.createAppointment({
                patientId: selectedPatient.id,
                patientName: selectedPatient.name,
                therapistId: auth.currentUser?.uid,
                date: date.toISOString(),
                type: sessionType,
                notes: notes
            });

            Alert.alert('Éxito', 'Turno agendado correctamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear el turno');
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedVal?: Date) => {
        setShowDatePicker(false);
        if (selectedVal) setDate(selectedVal);
    };

    const onTimeChange = (event: any, selectedVal?: Date) => {
        setShowTimePicker(false);
        if (selectedVal) setDate(selectedVal);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Nuevo Turno</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form}>
                        <Text style={styles.label}>Paciente</Text>
                        {fetchingPatients ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <View style={styles.patientList}>
                                {patients.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[
                                            styles.patientChip,
                                            selectedPatient?.id === p.id && styles.patientChipSelected
                                        ]}
                                        onPress={() => setSelectedPatient(p)}
                                    >
                                        <Text style={[
                                            styles.patientChipText,
                                            selectedPatient?.id === p.id && styles.patientChipTextSelected
                                        ]}>
                                            {p.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Fecha</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Hora</Text>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.pickerText}>
                                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.label}>Tipo de Sesión</Text>
                        <View style={styles.typeRow}>
                            {(['Virtual', 'Presencial'] as const).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        sessionType === type && styles.typeButtonSelected
                                    ]}
                                    onPress={() => setSessionType(type)}
                                >
                                    <Text style={[
                                        styles.typeButtonText,
                                        sessionType === type && styles.typeButtonTextSelected
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Notas (opcional)</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Detalles del turno..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={3}
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.spacer} />

                        <Button
                            title="Confirmar Turno"
                            onPress={handleCreate}
                            loading={loading}
                            disabled={!selectedPatient}
                        />
                    </ScrollView>
                </View>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={date}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onTimeChange}
                />
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#16163F',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    form: {
        marginBottom: 20,
    },
    label: {
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
        marginTop: 15,
    },
    patientList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    patientChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    patientChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    patientChipText: {
        color: 'white',
        fontSize: 13,
    },
    patientChipTextSelected: {
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    field: {
        width: '48%',
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pickerText: {
        color: 'white',
        marginLeft: 10,
        fontSize: 14,
    },
    typeRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    typeButtonSelected: {
        backgroundColor: 'rgba(123, 44, 191, 0.3)',
    },
    typeButtonText: {
        color: '#999',
        fontWeight: 'bold',
    },
    typeButtonTextSelected: {
        color: Colors.primaryLight,
    },
    textArea: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        color: 'white',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    spacer: {
        height: 30,
    },
});
