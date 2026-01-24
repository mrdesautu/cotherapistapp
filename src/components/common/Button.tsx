import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'outline' | 'text' | 'google';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineButton;
            case 'text':
                return styles.textButton;
            case 'google':
                return styles.googleButton;
            default:
                return styles.primaryButton;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineButtonText;
            case 'text':
                return styles.textButtonText;
            case 'google':
                return styles.googleButtonText;
            default:
                return styles.primaryButtonText;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                getButtonStyle(),
                disabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
            ) : (
                <>
                    {icon && icon}
                    <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginVertical: 8,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    textButton: {
        backgroundColor: 'transparent',
        height: 'auto',
        paddingHorizontal: 0,
        marginVertical: 4,
    },
    googleButton: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    disabledButton: {
        opacity: 0.6,
    },
    text: {
        fontWeight: '600',
        fontSize: 16,
    },
    primaryButtonText: {
        color: Colors.white,
    },
    outlineButtonText: {
        color: Colors.primary,
    },
    textButtonText: {
        color: Colors.primary,
        fontSize: 14,
    },
    googleButtonText: {
        color: Colors.text,
    },
});
