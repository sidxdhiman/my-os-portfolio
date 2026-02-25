'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LabUser, OSState } from '@/hooks/useOS';

interface IdScanProps {
    user: LabUser;
    setPhase: (p: OSState['phase']) => void;
}

const STEPS = [
    { label: 'Verifying identity', detail: 'Cross-referencing user registry' },
    { label: 'Loading workspace config', detail: 'Applying developer preferences' },
    { label: 'Initialising lab modules', detail: 'PDF Editor, Whiteboard, Eraser…' },
    { label: 'Checking permissions', detail: `Access level: Developer` },
    { label: 'Establishing secure session', detail: 'Local-only, no data transmitted' },
    { label: 'All systems ready', detail: 'Welcome to the lab!' },
];

export function IdScan({ user, setPhase }: IdScanProps) {
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        let s = 0;
        const interval = setInterval(() => {
            s++;
            setStep(s);
            if (s >= STEPS.length - 1) clearInterval(interval);
        }, 500);

        const t1 = setTimeout(() => setDone(true), STEPS.length * 500 + 200);
        const t2 = setTimeout(() => setPhase('door-open'), STEPS.length * 500 + 900);

        return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); };
    }, [setPhase]);

    const pct = Math.round(((step + 1) / STEPS.length) * 100);

    return (
        <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 10, padding: '0 16px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', maxWidth: 460 }}
            >
                {/* Card */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '36px 36px 32px',
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: done ? 'linear-gradient(135deg, #00897b, #26a69a)' : 'linear-gradient(135deg, #6200ea, #9c27b0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: done ? '0 4px 12px rgba(0,137,123,0.3)' : 'var(--shadow-brand)',
                            transition: 'all 0.5s ease',
                            flexShrink: 0,
                        }}>
                            <AnimatePresence mode="wait">
                                {done ? (
                                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 22, color: 'white' }}>✓</motion.span>
                                ) : (
                                    <motion.div key="spin" style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                )}
                            </AnimatePresence>
                        </div>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                                {done ? 'Welcome back, ' : 'Setting up your lab, '}
                                <span style={{ color: 'var(--brand)' }}>{user.name}</span>
                            </h1>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                {done ? 'Your workspace is ready' : 'Just a moment…'}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: 4, background: 'var(--bg-subtle)',
                        borderRadius: 100, overflow: 'hidden', marginBottom: 22,
                    }}>
                        <motion.div
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            style={{
                                height: '100%',
                                background: done ? 'linear-gradient(90deg, #00897b, #26a69a)' : 'linear-gradient(90deg, #6200ea, #9c27b0)',
                                borderRadius: 100,
                                transition: 'background 0.5s',
                            }}
                        />
                    </div>

                    {/* Steps list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {STEPS.map((s, i) => {
                            const isActive = i === step && !done;
                            const isCompleted = i < step || done;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '8px 12px', borderRadius: 8,
                                        background: isActive ? 'var(--brand-xlight)' : 'transparent',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                        background: isCompleted ? (done && i === STEPS.length - 1 ? '#00897b' : 'var(--brand)') : 'var(--bg-subtle)',
                                        border: `2px solid ${isCompleted ? 'transparent' : (isActive ? 'var(--brand)' : 'var(--border)')}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.25s',
                                    }}>
                                        {isCompleted ? (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : isActive ? (
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} className="pulse-dot" />
                                        ) : (
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-strong)' }} />
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: isActive ? 600 : 500,
                                            color: isCompleted ? 'var(--text-primary)' : (isActive ? 'var(--brand)' : 'var(--text-muted)'),
                                            lineHeight: 1.3,
                                        }}>
                                            {s.label}
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'var(--mono)' }}
                                            >
                                                {s.detail}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Right label */}
                                    {isCompleted && (
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', flexShrink: 0 }}>done</span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Role chip */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Access level</span>
                        <span className="chip">{user.accessLevel}</span>
                    </div>
                </div>
            </motion.div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
