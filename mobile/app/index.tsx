import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOS } from '../context/OSContext';
import { Shield } from 'lucide-react-native';

const ROLES = ['Researcher', 'Developer', 'Architect', 'Root'];

export default function EntryScreen() {
    const os = useOS();
    const router = useRouter();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Developer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        os.initUser();
    }, []);

    const handleSubmit = async () => {
        if (!name.trim()) { setError('Please enter a username or identifier to continue.'); return; }
        if (!password.trim()) { setError('Please enter a password.'); return; }

        setError('');
        setLoading(true);

        // Simulate loading for cool effect
        setTimeout(async () => {
            await os.setUser({
                name: name.trim(),
                accessLevel: role.toUpperCase(),
                issuedAt: new Date().toISOString(),
            });
            os.setPhase('id-scan');
            setLoading(false);
            router.replace('/scan');
        }, 800);
    };

    return (
        <View style={styles.container}>
            {/* Background Dots */}
            <View style={styles.bgDots} />

            <View style={styles.card}>
                <View style={styles.logoRow}>
                    <View style={styles.logoBox}>
                        <Shield color="white" size={20} />
                    </View>
                    <View>
                        <Text style={styles.logoTitle}>Dev Lab</Text>
                        <Text style={styles.logoSubtitle}>sidharth.dev</Text>
                    </View>
                </View>

                <Text style={styles.title}>Sign in to your lab</Text>
                <Text style={styles.subtitle}>Enter your name to access the interactive portfolio tools.</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={[styles.input, error && !name ? styles.inputError : null]}
                        placeholder="e.g. Sidharth"
                        placeholderTextColor="#8b90a8"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={[styles.input, error && !password ? styles.inputError : null]}
                        placeholder="Enter any password"
                        placeholderTextColor="#8b90a8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {!!error && (
                        <Text style={styles.errorText}>⚠ {error}</Text>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.rolesGrid}>
                        {ROLES.map(r => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                                onPress={() => setRole(r)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.radio, role === r && styles.radioActive]}>
                                    {role === r && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitText}>Continue to Lab →</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>v3.7 · Local-only · No data sent</Text>
                </View>
            </View>

            <Text style={styles.bottomTagline}>Built by Sidharth · Interactive portfolio tools</Text>
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
        maxWidth: 420,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 36,
        paddingBottom: 36,
        borderWidth: 1,
        borderColor: '#e2e5ef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 10,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
    },
    logoBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#6200ea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1d2e',
        letterSpacing: -0.3,
    },
    logoSubtitle: {
        fontSize: 11,
        color: '#8b90a8',
        fontFamily: 'Courier', // Placeholder for Mono
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1d2e',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#4a4f6a',
        marginBottom: 28,
        lineHeight: 21,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4a4f6a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fc',
        borderWidth: 1.5,
        borderColor: '#c8cde0',
        borderRadius: 6,
        padding: 12,
        fontSize: 15,
        color: '#1a1d2e',
    },
    inputError: {
        borderColor: '#d32f2f',
    },
    errorText: {
        fontSize: 12,
        color: '#d32f2f',
        marginTop: 6,
    },
    rolesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    roleBtn: {
        flexBasis: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fc',
        borderWidth: 1.5,
        borderColor: '#e2e5ef',
        borderRadius: 6,
        padding: 10,
        gap: 8,
    },
    roleBtnActive: {
        backgroundColor: '#f5f3ff',
        borderColor: '#6200ea',
    },
    radio: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#c8cde0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: {
        borderColor: '#6200ea',
        backgroundColor: '#6200ea',
    },
    radioInner: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'white',
    },
    roleBtnText: {
        fontSize: 13,
        color: '#4a4f6a',
    },
    roleBtnTextActive: {
        color: '#6200ea',
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#6200ea',
        padding: 14,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#6200ea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 4,
    },
    submitText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    footerRow: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        color: '#8b90a8',
        fontFamily: 'Courier',
    },
    bottomTagline: {
        marginTop: 24,
        fontSize: 12,
        color: '#8b90a8',
    },
});
