import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useOS } from '../context/OSContext';
import { Check, Loader } from 'lucide-react-native';

const STEPS = [
    { label: 'Verifying identity', detail: 'Cross-referencing user registry' },
    { label: 'Loading workspace config', detail: 'Applying developer preferences' },
    { label: 'Initialising lab modules', detail: 'PDF Editor, Whiteboard, Eraser…' },
    { label: 'Checking permissions', detail: `Access level: Developer` },
    { label: 'Establishing secure session', detail: 'Local-only, no data transmitted' },
    { label: 'All systems ready', detail: 'Welcome to the lab!' },
];

const { width } = Dimensions.get('window');

export default function ScanScreen() {
    const os = useOS();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);

    // Animation values
    const [spinValue] = useState(new Animated.Value(0));
    const [progressWidth] = useState(new Animated.Value(0));

    useEffect(() => {
        // Spin animation
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 800,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        let s = 0;
        const interval = setInterval(() => {
            s++;
            setStep(s);
            const pct = ((s + 1) / STEPS.length) * 100;
            Animated.timing(progressWidth, {
                toValue: pct,
                duration: 450,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start();

            if (s >= STEPS.length - 1) {
                clearInterval(interval);
            }
        }, 500);

        const t1 = setTimeout(() => {
            setDone(true);
        }, STEPS.length * 500 + 200);

        const t2 = setTimeout(() => {
            os.setPhase('dashboard');
            router.replace('/(tabs)');
        }, STEPS.length * 500 + 1200);

        return () => {
            clearInterval(interval);
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Background Dots */}
            <View style={styles.bgDots} />

            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={[styles.iconBox, done ? styles.iconBoxDone : styles.iconBoxLoading]}>
                        {done ? (
                            <Check color="white" size={24} />
                        ) : (
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <Loader color="white" size={24} />
                            </Animated.View>
                        )}
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>
                            {done ? 'Welcome back, ' : 'Setting up your lab, '}
                            <Text style={{ color: '#6200ea' }}>{os.user?.name || 'User'}</Text>
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {done ? 'Your workspace is ready' : 'Just a moment…'}
                        </Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
                            done && { backgroundColor: '#00897b' }
                        ]}
                    />
                </View>

                <View style={styles.stepsList}>
                    {STEPS.map((s, i) => {
                        const isActive = i === step && !done;
                        const isCompleted = i < step || done;
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.stepRow,
                                    isActive && styles.stepRowActive,
                                    { opacity: i <= step ? 1 : 0.3 }
                                ]}
                            >
                                <View style={[
                                    styles.stepIcon,
                                    isCompleted ? (done && i === STEPS.length - 1 ? styles.stepIconFinal : styles.stepIconCompleted) : styles.stepIconPending,
                                    isActive && styles.stepIconActive
                                ]}>
                                    {isCompleted ? (
                                        <Check color="white" size={10} strokeWidth={3} />
                                    ) : isActive ? (
                                        <View style={styles.activeDot} />
                                    ) : (
                                        <View style={styles.pendingDot} />
                                    )}
                                </View>

                                <View style={styles.stepTextContainer}>
                                    <Text style={[
                                        styles.stepLabel,
                                        isCompleted ? styles.stepLabelCompleted : (isActive ? styles.stepLabelActive : styles.stepLabelPending)
                                    ]}>
                                        {s.label}
                                    </Text>
                                    {isActive && (
                                        <Text style={styles.stepDetail}>{s.detail}</Text>
                                    )}
                                </View>

                                {isCompleted && <Text style={styles.doneText}>done</Text>}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerLabel}>Access level</Text>
                    <View style={styles.chip}>
                        <Text style={styles.chipText}>{os.user?.accessLevel || 'DEVELOPER'}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    bgDots: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.55,
    },
    card: {
        width: '100%',
        maxWidth: 460,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 36,
        borderWidth: 1,
        borderColor: '#e2e5ef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxLoading: {
        backgroundColor: '#6200ea',
    },
    iconBoxDone: {
        backgroundColor: '#00897b',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1d2e',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#8b90a8',
        marginTop: 2,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#f1f3f9',
        borderRadius: 100,
        overflow: 'hidden',
        marginBottom: 22,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#6200ea',
        borderRadius: 100,
    },
    stepsList: {
        flexDirection: 'column',
        gap: 10,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    stepRowActive: {
        backgroundColor: '#f5f3ff',
    },
    stepIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIconCompleted: {
        backgroundColor: '#6200ea',
        borderWidth: 0,
    },
    stepIconFinal: {
        backgroundColor: '#00897b',
        borderWidth: 0,
    },
    stepIconActive: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#6200ea',
    },
    stepIconPending: {
        backgroundColor: '#f1f3f9',
        borderWidth: 2,
        borderColor: '#e2e5ef',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#6200ea',
    },
    pendingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#c8cde0',
    },
    stepTextContainer: {
        flex: 1,
    },
    stepLabel: {
        fontSize: 13,
    },
    stepLabelCompleted: {
        fontWeight: '500',
        color: '#1a1d2e',
    },
    stepLabelActive: {
        fontWeight: '600',
        color: '#6200ea',
    },
    stepLabelPending: {
        fontWeight: '500',
        color: '#8b90a8',
    },
    stepDetail: {
        fontSize: 11,
        color: '#8b90a8',
        marginTop: 1,
        fontFamily: 'Courier',
    },
    doneText: {
        fontSize: 11,
        color: '#8b90a8',
        fontFamily: 'Courier',
    },
    footer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e5ef',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerLabel: {
        fontSize: 12,
        color: '#8b90a8',
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: '#f5f3ff',
        borderWidth: 1,
        borderColor: 'rgba(98, 0, 234, 0.15)',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6200ea',
        fontFamily: 'Courier',
    },
});
