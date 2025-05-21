import React, { useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Image,
    Platform,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/FontAwesome5';

interface CustomAlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error' | 'info';
    confirmText?: string;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
    visible,
    title,
    message,
    onClose,
    type = 'info',
    confirmText = 'OK',
}) => {
    // Animation value for the modal appearance
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            // Reset animations when modal becomes visible
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);

            // Start animation sequence
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, scaleAnim]);

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    primary: '#00843D',
                    icon: 'check-circle',
                };
            case 'error':
                return {
                    primary: '#F44336',
                    icon: 'exclamation',
                };
            case 'info':
                return {
                    primary: '#1A237E',
                    icon: 'info-circle',
                };
            default:
                return {
                    primary: '#1A237E',
                    icon: 'info-circle',
                };
        }
    };

    const { primary, icon } = getColors();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Icon at the top */}
                    <View style={[styles.iconContainer, { backgroundColor: primary }]}>
                        <Icon name={icon} size={40} color="white" />
                    </View>

                    {/* Title */}
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: primary }]}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: Dimensions.get('window').width * 0.85,
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 24,
        paddingBottom: 12,
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingTop: 12,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#212121',
        textAlign: 'center',
    },
    content: {
        padding: 24,
        paddingTop: 12,
    },
    message: {
        fontSize: 16,
        color: '#424242',
        textAlign: 'center',
        lineHeight: 24,
        letterSpacing: 0.3,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        alignItems: 'center',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default CustomAlertModal;