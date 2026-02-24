import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Session } from '../../types/Session';
import { Audio } from 'expo-av';
import { Button } from '../../components/common/Button';
import { useSessions } from '../../hooks/useSessions';
import { ScreenWrapper } from '../../components/common/ScreenWrapper';
import { sessionService } from '../../services/sessionService';

type ParamList = {
    SessionDetail: { session: Session; patientName: string };
};

export const SessionDetailScreen = () => {
    const route = useRoute<RouteProp<ParamList, 'SessionDetail'>>();
    const navigation = useNavigation<any>();
    const { session, patientName } = route.params;
    const { deleteSession } = useSessions();

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState((session.duration || 0) * 1000); // sync with initial known duration
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Remote session state (real-time updates)
    const [remoteSession, setRemoteSession] = useState<Session | null>(session);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    useEffect(() => {
        const unsubscribe = sessionService.subscribeToSession(session.id, (data) => {
            if (data) {
                setRemoteSession(data);
            }
        });
        return () => unsubscribe();
    }, [session.id]);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // OLD handleRequestTranscription REMOVED FROM HERE

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const loadAudio = async () => {
        if (!session.audioURL) {
            Alert.alert('Error', 'No hay audio disponible para esta sesión');
            return;
        }

        try {
            setIsLoadingAudio(true);

            // Configurar modo de audio para asegurar reproducción
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            console.log('Loading audio from:', session.audioURL);

            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: session.audioURL },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsPlaying(true);

            if (status.isLoaded) {
                console.log('Audio loaded successfully', status.durationMillis);
                setDuration(status.durationMillis || (session.duration || 0) * 1000);
            }

        } catch (error) {
            console.error('Error loading audio:', error);
            Alert.alert('Error', 'No se pudo cargar el audio de la sesión. Verifica tu conexión.');
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || duration);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
            }
        }
    };

    const handlePlayPause = async () => {
        if (!sound) {
            await loadAudio();
        } else {
            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                if (position >= duration) {
                    await sound.replayAsync();
                } else {
                    await sound.playAsync();
                }
            }
        }
    };

    const handleRequestTranscription = async () => {
        if (!session.audioURL || session.audioURL.startsWith('file://')) {
            Alert.alert(
                "Sincronización en curso",
                "El audio aún se está subiendo a la nube. Por favor, espera unos segundos e intenta de nuevo."
            );
            return;
        }

        try {
            setIsRequesting(true);
            await sessionService.requestTranscription(session, session.patientId);
            Alert.alert("Solicitud Enviada", "La transcripción ha comenzado. Te notificaremos cuando esté lista.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo solicitar la transcripción.");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleGenerateReport = async () => {
        try {
            setIsGeneratingReport(true);
            await sessionService.requestClinicalReport(session.id, session.patientId);
            Alert.alert("Generando Informe", "El informe clínico se está generando. Verás los resultados en la aplicación en breve.");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Hubo un error al solicitar el informe clínico.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            "Eliminar Grabación",
            "¿Estás seguro de que deseas eliminar este audio permanentemente? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Stop audio if playing
                            if (sound) {
                                await sound.unloadAsync();
                            }

                            // Delete
                            await deleteSession(session.id, session.therapistId);

                            Alert.alert("Éxito", "La sesión ha sido eliminada.", [
                                { text: "OK", onPress: () => navigation.goBack() }
                            ]);
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar la sesión. Intenta de nuevo.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sesión</Text>
                <TouchableOpacity onPress={handleDelete} style={styles.backButton}>
                    <Ionicons name="trash-outline" size={24} color={Colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Meta Info */}
                <View style={styles.metaContainer}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.date}>{formatDate(session.date)}</Text>
                    <View style={[styles.statusBadge, {
                        backgroundColor:
                            session.globalStatus === 'COMPLETED' ? Colors.success + '20' :
                                session.globalStatus === 'PROCESSING' || session.globalStatus === 'GENERATING_REPORT' ? Colors.warning + '20' :
                                    session.globalStatus === 'FAILED' ? Colors.error + '20' :
                                        Colors.primary + '20'
                    }]}>
                        <Text style={[styles.statusText, {
                            color:
                                session.globalStatus === 'COMPLETED' ? Colors.success :
                                    session.globalStatus === 'PROCESSING' || session.globalStatus === 'GENERATING_REPORT' ? Colors.warning :
                                        session.globalStatus === 'FAILED' ? Colors.error :
                                            Colors.primary
                        }]}>
                            {
                                session.globalStatus === 'COMPLETED' ? 'Completado' :
                                    session.globalStatus === 'PROCESSING' || session.globalStatus === 'GENERATING_REPORT' ? 'Procesando...' :
                                        session.globalStatus === 'FAILED' ? 'Error' :
                                            'Pendiente'
                            }
                        </Text>
                    </View>
                </View>

                {/* Audio Player Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Grabación de Audio</Text>

                    <View style={styles.playerContainer}>
                        <TouchableOpacity
                            onPress={handlePlayPause}
                            style={styles.playButton}
                            disabled={isLoadingAudio}
                        >
                            {isLoadingAudio ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Ionicons name={isPlaying ? "pause" : "play"} size={30} color={Colors.white} />
                            )}
                        </TouchableOpacity>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${(position / duration) * 100}%` }]} />
                            </View>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeText}>{formatTime(position)}</Text>
                                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* AI Analysis Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Análisis AI</Text>

                    {!remoteSession?.transcription && remoteSession?.status !== 'processing' && (
                        <View style={styles.placeholderBox}>
                            <Text style={styles.placeholderText}>Aún no has analizado esta sesión.</Text>
                            <Button
                                title={isRequesting ? "Solicitando..." : "Solicitar Transcripción"}
                                onPress={handleRequestTranscription}
                                disabled={isRequesting}
                            />
                        </View>
                    )}

                    {remoteSession?.globalStatus === 'PROCESSING' || remoteSession?.globalStatus === 'GENERATING_REPORT' ? (
                        <View style={styles.placeholderBox}>
                            <ActivityIndicator color={Colors.primary} size="small" />
                            <Text style={[styles.placeholderText, { marginTop: 10 }]}
                            >Procesando (El informe puede demorar un minuto extra)...</Text>
                        </View>
                    ) : null}

                    {remoteSession?.globalStatus === 'COMPLETED' && (
                        <View>
                            <View style={[styles.statusBadge, { backgroundColor: Colors.success + '20', marginBottom: 10, alignSelf: 'flex-start' }]}
                            >
                                <Text style={[styles.statusText, { color: Colors.success }]}
                                >Análisis Completado</Text>
                            </View>

                            {remoteSession.report && remoteSession.report.postSessionReport ? (
                                <View style={{ marginBottom: 15 }}>
                                    <Button
                                        title="Ver Informe Clínico"
                                        onPress={() => navigation.navigate('ClinicalReportScreen', { reportData: remoteSession.report!.postSessionReport, patientName })}
                                        variant="primary"
                                    />
                                </View>
                            ) : (
                                <View style={{ marginBottom: 15 }}>
                                    <Button
                                        title={isGeneratingReport ? "Generando..." : "Generar Informe Clínico"}
                                        onPress={handleGenerateReport}
                                        disabled={isGeneratingReport || remoteSession?.globalStatus === 'GENERATING_REPORT'}
                                        variant="outline"
                                    />
                                </View>
                            )}

                            <Button
                                title="Ver Transcripción Completa"
                                onPress={() => navigation.navigate('TranscriptionScreen', { content: remoteSession.transcription })}
                                variant="outline"
                            />
                        </View>
                    )}
                </View>

            </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: 'transparent',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        padding: 20,
        paddingBottom: 50,
    },
    metaContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    patientName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    date: {
        fontSize: 16,
        color: Colors.textLight,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
    },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 12,
        color: Colors.textLight,
        fontVariant: ['tabular-nums'],
    },
    placeholderBox: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed'
    },
    placeholderText: {
        color: Colors.textLight,
        textAlign: 'center',
        marginBottom: 8,
    },
    placeholderSubtext: {
        color: Colors.textLight,
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic'
    }
});
