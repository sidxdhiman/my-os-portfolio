import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export interface LabUser {
    name: string;
    accessLevel: string;
    issuedAt: string;
}

export type AppId = 'notes-app' | 'whiteboard' | 'neural-eraser' | 'pdf-editor' | 'terminal';

export interface OSState {
    user: LabUser | null;
    phase: 'init' | 'id-entry' | 'id-scan' | 'door-open' | 'dashboard';
    openApps: AppId[];
    terminalOpen: boolean;
    setUser: (user: LabUser) => void;
    setPhase: (phase: OSState['phase']) => void;
    pushApp: (id: AppId) => void;
    closeApp: (id: AppId) => void;
    toggleTerminal: () => void;
    openTerminal: () => void;
    logout: () => void;
    initUser: () => Promise<void>;
}

const OSContext = createContext<OSState | null>(null);

export function OSProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<LabUser | null>(null);
    const [phase, setPhaseState] = useState<OSState['phase']>('init');
    const [openApps, setOpenApps] = useState<AppId[]>([]);
    const [terminalOpen, setTerminalOpen] = useState(false);
    const router = useRouter();

    const initUser = async () => {
        try {
            const saved = await AsyncStorage.getItem('lab_user');
            if (saved) {
                const parsed: LabUser = JSON.parse(saved);
                if (parsed.name && parsed.accessLevel) {
                    setUserState(parsed);
                    setPhaseState('dashboard');
                    router.replace('/(tabs)');
                    return;
                }
            }
        } catch {
            await AsyncStorage.removeItem('lab_user');
        }
        setPhaseState('id-entry');
    };

    const setUser = useCallback(async (u: LabUser) => {
        setUserState(u);
        await AsyncStorage.setItem('lab_user', JSON.stringify(u));
    }, []);

    const setPhase = useCallback((p: OSState['phase']) => {
        setPhaseState(p);
    }, []);

    const pushApp = useCallback((id: AppId) => {
        setOpenApps(prev => prev.includes(id) ? prev : [...prev, id]);
    }, []);

    const closeApp = useCallback((id: AppId) => {
        setOpenApps(prev => prev.filter(a => a !== id));
    }, []);

    const toggleTerminal = useCallback(() => setTerminalOpen(v => !v), []);
    const openTerminal = useCallback(() => setTerminalOpen(true), []);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem('lab_user');
        setUserState(null);
        setPhaseState('id-entry');
        setOpenApps([]);
        setTerminalOpen(false);
        router.replace('/'); // Redirect to entry
    }, [router]);

    return (
        <OSContext.Provider value={{
            user, phase, openApps, terminalOpen,
            setUser, setPhase, pushApp, closeApp, toggleTerminal, openTerminal, logout, initUser
        }}>
            {children}
        </OSContext.Provider>
    );
}

export function useOS() {
    const context = useContext(OSContext);
    if (!context) throw new Error('useOS must be used within an OSProvider');
    return context;
}
