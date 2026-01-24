import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface WaveBackgroundProps {
    children: React.ReactNode;
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({ children }) => {
    // Generates a series of lines for the top wave
    const renderTopLines = () => {
        const lines = [];
        const numLines = 25;

        for (let i = 0; i < numLines; i++) {
            // Calculate variations for each line
            const offset = i * 4; // Vertical spacing
            const amp = 80 + i * 2; // Amplitude increases slightly

            // Start points shift down
            const startY = -20 + i * 3;
            const endY = -20 + i * 3;

            // Bezier curve points
            // Start: Top Left
            // C1: Goes down and right
            // C2: Goes up and right
            // End: Top Right

            // To mimic the "opening" mesh:
            // The curves should fan out in the middle
            const cp1y = 100 + i * 8;
            const cp2y = 0 + i * 5;

            const d = `M0,${startY} C${width * 0.3},${cp1y} ${width * 0.7},${cp2y} ${width},${endY}`;

            lines.push(
                <Path
                    key={`top-${i}`}
                    d={d}
                    stroke="url(#gradLinesTop)"
                    strokeWidth="1.5"
                    fill="none"
                    opacity={0.6 - (i / numLines) * 0.3} // Fade out slightly
                />
            );
        }
        return lines;
    };

    // Generates a series of lines for the bottom wave
    const renderBottomLines = () => {
        const lines = [];
        const numLines = 25;

        for (let i = 0; i < numLines; i++) {
            const startY = height + 20 - i * 3;
            const endY = height + 20 - i * 3;

            // Inverted logic for bottom
            const cp1y = height - (80 + i * 8);
            const cp2y = height - (20 + i * 5);

            const d = `M0,${startY} C${width * 0.3},${cp1y} ${width * 0.7},${cp2y} ${width},${endY}`;

            lines.push(
                <Path
                    key={`bottom-${i}`}
                    d={d}
                    stroke="url(#gradLinesBottom)"
                    strokeWidth="1.5"
                    fill="none"
                    opacity={0.6 - (i / numLines) * 0.3}
                />
            );
        }
        return lines;
    };

    return (
        <View style={styles.container}>
            <View style={styles.backgroundContainer}>
                <Svg height={height} width={width} viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
                    <Defs>
                        {/* Gradient for Top Lines */}
                        <LinearGradient id="gradLinesTop" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.6" />
                            <Stop offset="0.5" stopColor={Colors.accent} stopOpacity="0.5" />
                            <Stop offset="1" stopColor={Colors.secondary} stopOpacity="0.4" />
                        </LinearGradient>

                        {/* Gradient for Bottom Lines */}
                        <LinearGradient id="gradLinesBottom" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor={Colors.secondary} stopOpacity="0.4" />
                            <Stop offset="0.5" stopColor={Colors.accent} stopOpacity="0.5" />
                            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.6" />
                        </LinearGradient>
                    </Defs>

                    {renderTopLines()}
                    {renderBottomLines()}
                </Svg>
            </View>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    svg: {
        flex: 1,
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
});
