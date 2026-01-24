import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaveBackground } from './WaveBackground';
import { Colors } from '../../constants/Colors';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
    return (
        <WaveBackground>
            <SafeAreaView style={[styles.container, style]} edges={['top']}>
                {children}
            </SafeAreaView>
        </WaveBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
