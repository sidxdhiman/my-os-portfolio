'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LabUser, OSState } from '@/hooks/useOS';

interface LabDoorProps {
    user: LabUser;
    setPhase: (p: OSState['phase']) => void;
}

export function LabDoor({ user, setPhase }: LabDoorProps) {
    useEffect(() => {
        const t = setTimeout(() => setPhase('dashboard'), 2000);
        return () => clearTimeout(t);
    }, [setPhase]);

    const slide = {
        duration: 1.4,
        ease: [0.43, 0, 0.21, 1] as [number, number, number, number],
        delay: 0.15,
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
            {/* Left panel */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: '-100%' }}
                transition={slide}
                style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%',
                    background: 'var(--bg-card)',
                    borderRight: '1px solid var(--border)',
                    boxShadow: '4px 0 32px rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 40,
                }}
            >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 3, writingMode: 'vertical-rl' }}>
                    DEV · LAB
                </span>
            </motion.div>

            {/* Right panel */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: '100%' }}
                transition={slide}
                style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%',
                    background: 'var(--bg-card)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-4px 0 32px rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 40,
                }}
            >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 3, writingMode: 'vertical-rl' }}>
                    SECURE
                </span>
            </motion.div>

            {/* Center welcome flash */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 1.05] }}
                transition={{ duration: 1.9, times: [0, 0.25, 0.75, 1] }}
                style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none', zIndex: 60,
                }}
            >
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '28px 40px',
                    boxShadow: 'var(--shadow-lg)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: 2 }}>
                        ACCESS GRANTED
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        Welcome, <span style={{ color: 'var(--brand)' }}>{user.name}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <span className="chip">{user.accessLevel}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
