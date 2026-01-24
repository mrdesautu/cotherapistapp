import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform, Image } from 'react-native';

import { usePatients } from '../../hooks/usePatients';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Patient } from '../../types/Patient';
import { Input } from '../../components/common/Input';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';

export const HomeScreen = () => {
    const { user } = useAuth();
    const { patients, isLoading, refetch } = usePatients();
    const navigation = useNavigation<any>();
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredPatients = React.useMemo(() => {
        if (!searchQuery) return patients;
        return patients.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [patients, searchQuery]);

    const renderPatient = ({ item }: { item: Patient }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PatientDetail', { patient: item })}
        >
            <View style={styles.avatarContainer}>
                {item.photoURL ? (
                    // Placeholder for image
                    <View style={[styles.avatar, { backgroundColor: Colors.primaryLight }]}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                ) : (
                    <View style={[styles.avatar, { backgroundColor: Colors.primaryLight }]}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientDetails}>
                    {item.nextSessionDate ? `Próxima sesión: ${new Date(item.nextSessionDate).toLocaleDateString()}` : 'Sin sesión programada'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola, {user?.displayName?.split(' ')[0] || 'Doc'}</Text>
                    <Text style={styles.subtitle}>Tus Pacientes</Text>
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Account')}>
                    {user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.placeholderProfile}>
                            <Ionicons name="person" size={20} color={Colors.white} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Input
                    placeholder="Buscar Paciente"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon="search-outline"
                    style={styles.searchInput}
                />
            </View>

            <FlatList
                data={filteredPatients}
                renderItem={renderPatient}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={Colors.textLight} />
                            <Text style={styles.emptyText}>No tienes pacientes aún</Text>
                            <Text style={styles.emptySubtext}>Agrega uno nuevo para comenzar</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddPatient')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={30} color={Colors.white} />
                <Text style={styles.fabText}>Nuevo Paciente</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textLight,
    },
    profileButton: {
        padding: 5,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    placeholderProfile: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchInput: {
        marginBottom: 0,
        backgroundColor: Colors.white,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardContent: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    patientDetails: {
        fontSize: 12,
        color: Colors.textLight,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 25,
        right: 20,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fabText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
});
