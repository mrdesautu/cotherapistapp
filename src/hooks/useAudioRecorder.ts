import { useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

export interface AudioRecorderState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number; // in seconds
    uri: string | null;
    hasPermission: boolean;
}

export const useAudioRecorder = () => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [state, setState] = useState<AudioRecorderState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        uri: null,
        hasPermission: false,
    });
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Audio.requestPermissionsAsync();
                setState(prev => ({ ...prev, hasPermission: status === 'granted' }));
            } catch (error) {
                console.error('Error requesting permission:', error);
            }
        })();

        return () => {
            if (recording) {
                try {
                    recording.stopAndUnloadAsync();
                } catch (e) {
                    // Ignore
                }
            }
            if (timerInterval) clearInterval(timerInterval);
        };
    }, []);

    const startRecording = async () => {
        try {
            if (!state.hasPermission) {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso requerido', 'Se necesita acceso al micrófono para grabar la sesión.');
                    return;
                }
                setState(prev => ({ ...prev, hasPermission: true }));
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true, // Keep recording if app backgrounded
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            setState(prev => ({ ...prev, isRecording: true, duration: 0, uri: null }));

            const interval = setInterval(() => {
                setState(prev => ({ ...prev, duration: prev.duration + 1 }));
            }, 1000);
            setTimerInterval(interval);

        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'No se pudo iniciar la grabación');
        }
    };

    const stopRecording = async () => {
        if (!recording) return null;

        try {
            if (timerInterval) clearInterval(timerInterval);
            setTimerInterval(null);

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            setRecording(null);
            setState(prev => ({ ...prev, isRecording: false, uri }));

            // Reset mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            return { uri, duration: state.duration };
        } catch (error) {
            console.error('Failed to stop recording', error);
            return null;
        }
    };

    const pauseRecording = async () => {
        if (!recording) return;
        try {
            await recording.pauseAsync();
            if (timerInterval) clearInterval(timerInterval);
            setTimerInterval(null);
            setState(prev => ({ ...prev, isPaused: true }));
        } catch (error) {
            console.error('Failed to pause', error);
        }
    };

    const resumeRecording = async () => {
        if (!recording) return;
        try {
            await recording.startAsync();
            setState(prev => ({ ...prev, isPaused: false }));
            const interval = setInterval(() => {
                setState(prev => ({ ...prev, duration: prev.duration + 1 }));
            }, 1000);
            setTimerInterval(interval);
        } catch (error) {
            console.error('Failed to resume', error);
        }
    };

    return {
        ...state,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording
    };
};
