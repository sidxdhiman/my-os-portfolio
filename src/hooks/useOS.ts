'use client';

import { useState, useCallback } from 'react';

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
}

export function useOS(): OSState {
    const [user, setUserState] = useState<LabUser | null>(null);
    const [phase, setPhaseState] = useState<OSState['phase']>('init');
    const [openApps, setOpenApps] = useState<AppId[]>([]);
    const [terminalOpen, setTerminalOpen] = useState(false);

    const setUser = useCallback((u: LabUser) => setUserState(u), []);
    const setPhase = useCallback((p: OSState['phase']) => setPhaseState(p), []);

    const pushApp = useCallback((id: AppId) => {
        setOpenApps(prev => prev.includes(id) ? prev : [...prev, id]);
    }, []);

    const closeApp = useCallback((id: AppId) => {
        setOpenApps(prev => prev.filter(a => a !== id));
    }, []);

    const toggleTerminal = useCallback(() => setTerminalOpen(v => !v), []);
    const openTerminal = useCallback(() => setTerminalOpen(true), []);

    const logout = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('lab_user');
        }
        setUserState(null);
        setPhaseState('id-entry');
        setOpenApps([]);
        setTerminalOpen(false);
    }, []);

    return {
        user,
        phase,
        openApps,
        terminalOpen,
        setUser,
        setPhase,
        pushApp,
        closeApp,
        toggleTerminal,
        openTerminal,
        logout,
    };
}
