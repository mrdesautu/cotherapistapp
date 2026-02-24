import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Text, RefreshControl } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GlassCard } from '../../components/common/GlassCard';
import { BookingModal } from '../../components/main/BookingModal';

LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sep.', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

interface Turno {
    id: string;
    patient: string;
    time: string;
    type: string;
}

export const TurnosScreen = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Mock data for initial rendering
    const turnos: Turno[] = [
        { id: '1', patient: 'Michael Rodriguez', time: '10:00 AM', type: 'Virtual' },
        { id: '2', patient: 'Sophie Martin', time: '02:30 PM', type: 'Presencial' },
    ];

    const onRefresh = () => {
        setRefreshing(true);
        // Fetch real data here
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Agenda</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </View>

            <Calendar
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={{
                    [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: Colors.primary }
                }}
                theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: Colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: Colors.accent,
                    dayTextColor: 'white',
                    textDisabledColor: '#444',
                    monthTextColor: 'white',
                    indicatorColor: Colors.primary,
                    arrowColor: Colors.primary,
                }}
            />

            <ScrollView
                style={styles.turnosContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                <Text style={styles.subtitle}>Próximos Turnos</Text>
                {turnos.map(turno => (
                    <GlassCard key={turno.id} style={styles.turnoCard}>
                        <TouchableOpacity style={styles.turnoCardContent}>
                            <View style={styles.timeContainer}>
                                <Text style={styles.turnoTime}>{turno.time}</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <Text style={styles.patientName}>{turno.patient}</Text>
                                <Text style={styles.turnoType}>{turno.type}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </GlassCard>
                ))}
            </ScrollView>

            <BookingModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSuccess={onRefresh}
                selectedDate={selectedDate}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F2D',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: Fonts.bold.fontWeight,
        color: 'white',
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    turnosContainer: {
        padding: 20,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: Fonts.bold.fontWeight,
        color: 'white',
        marginBottom: 15,
    },
    turnoCard: {
        marginBottom: 12,
    },
    turnoCardContent: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeContainer: {
        backgroundColor: 'rgba(123, 44, 191, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginRight: 15,
    },
    turnoTime: {
        color: Colors.primaryLight,
        fontWeight: Fonts.bold.fontWeight,
        fontSize: 14,
    },
    infoContainer: {
        flex: 1,
    },
    patientName: {
        color: 'white',
        fontSize: 16,
        fontWeight: Fonts.bold.fontWeight,
    },
    turnoType: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
    },
});
