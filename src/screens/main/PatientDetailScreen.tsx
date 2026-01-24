import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSessions } from '../../hooks/useSessions';
import { Patient } from '../../types/Patient';
import { Session } from '../../types/Session';
import { Button } from '../../components/common/Button';

type ParamList = {
    PatientDetail: { patient: Patient };
};

export const PatientDetailScreen = () => {
    const route = useRoute<RouteProp<ParamList, 'PatientDetail'>>();
    const navigation = useNavigation();
    const { patient } = route.params;
    const { sessions, loading, refreshSessions, deleteSession } = useSessions(patient.id);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    const handleDeleteSession = (session: Session) => {
        Alert.alert(
            "Eliminar Sesión",
            "¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        if (!session.therapistId) return;
                        try {
                            await deleteSession(session.id, session.therapistId);
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar la sesión.");
                        }
                    }
                }
            ]
        );
    };

    const renderSessionItem = ({ item }: { item: Session }) => (
        <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => (navigation as any).navigate('SessionDetail', { session: item, patientName: patient.name })}
            onLongPress={() => handleDeleteSession(item)}
            delayLongPress={500}
        >
            <View style={styles.sessionIcon}>
                <Ionicons name="mic-circle" size={40} color={Colors.primary} />
            </View>
            <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
                <Text style={styles.sessionDuration}>{formatDuration(item.duration)} min</Text>
            </View>
            <View style={styles.sessionStatus}>
                {item.audioURL && (
                    <Ionicons name="play-circle" size={30} color={Colors.primary} />
                )}
                {item.audioURL && item.audioURL.startsWith('http') ? (
                    <Ionicons name="cloud-done" size={14} color={Colors.success} style={{ marginTop: 2 }} />
                ) : (
                    <Ionicons name="cloud-upload" size={14} color={Colors.textLight} style={{ marginTop: 2 }} />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalles</Text>
                <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="create-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    {patient.photoURL ? (
                        <Image source={{ uri: patient.photoURL }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{patient.name.charAt(0).toUpperCase()}</Text>
                    )}
                </View>
                <Text style={styles.name}>{patient.name}</Text>
                <Text style={styles.email}>{patient.email}</Text>
            </View>

            {/* Sessions List */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Historial de Sesiones</Text>
                <FlatList
                    data={sessions}
                    renderItem={renderSessionItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refreshSessions}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No hay sesiones registradas</Text>
                        </View>
                    }
                />
            </View>

            <View style={styles.fabContainer}>
                <Button
                    title="Nueva Sesión"
                    onPress={() => (navigation as any).navigate('Session', { patientId: patient.id })}
                    icon={<Ionicons name="mic" size={20} color={Colors.white} />}
                />
            </View>
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
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    editButton: {
        padding: 5,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
    },
    email: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 5,
    },
    listContainer: {
        flex: 1,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 20,
        marginBottom: 10,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 80,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sessionIcon: {
        marginRight: 15,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDate: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    sessionDuration: {
        fontSize: 14,
        color: Colors.textLight,
    },
    sessionStatus: {
        width: 30,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: Colors.textLight,
        fontSize: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    }
});
