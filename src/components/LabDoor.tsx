'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LabUser, OSState } from '@/hooks/useOS';

interface LabDoorProps {
    user: LabUser;
    setPhase: (p: OSState['phase']) => void;
}

function PanelStripes() {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Horizontal rivet rows */}
            {[10, 30, 50, 70, 90].map(pct => (
                <div key={pct} style={{
                    position: 'absolute',
                    top: `${pct}%`,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'rgba(131,27,132,0.12)',
                }} />
            ))}
            {/* Vertical ridge lines */}
            {[15, 30, 50, 70, 85].map(pct => (
                <div key={pct} style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'linear-gradient(180deg, transparent, rgba(131,27,132,0.15) 40%, rgba(131,27,132,0.08) 60%, transparent)',
                }} />
            ))}
            {/* Rivets */}
            {[15, 30, 50, 70, 85].flatMap(x =>
                [10, 30, 50, 70, 90].map(y => (
                    <div key={`${x}-${y}`} style={{
                        position: 'absolute',
                        left: `${x}%`,
                        top: `${y}%`,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, #444460 0%, #1a1a28 100%)',
                        border: '1px solid rgba(131,27,132,0.2)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                    }} />
                ))
            )}
            {/* Warning stripes at bottom */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                background: 'repeating-linear-gradient(-45deg, rgba(131,27,132,0.15) 0px, rgba(131,27,132,0.15) 8px, rgba(255,200,0,0.06) 8px, rgba(255,200,0,0.06) 16px)',
            }} />
        </div>
    );
}

export function LabDoor({ user, setPhase }: LabDoorProps) {
    useEffect(() => {
        const t = setTimeout(() => setPhase('dashboard'), 2400);
        return () => clearTimeout(t);
    }, [setPhase]);

    const doorTransition = {
        duration: 1.8,
        ease: [0.43, 0, 0.21, 1] as [number, number, number, number],
        delay: 0.3,
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}>
            {/* Left panel */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: '-102%' }}
                transition={doorTransition}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '50%',
                    background: 'linear-gradient(180deg, #0a0a14 0%, #0f0f1c 50%, #0a0a14 100%)',
                    borderRight: '2px solid rgba(131,27,132,0.5)',
                    boxShadow: '4px 0 40px rgba(0,0,0,0.9), inset -2px 0 20px rgba(131,27,132,0.1)',
                }}
            >
                <PanelStripes />
                {/* Door label */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: 40,
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--display)',
                    fontSize: 11,
                    color: 'rgba(131,27,132,0.5)',
                    letterSpacing: 4,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                }}>
                    LAB-OS SECURE
                </div>
            </motion.div>

            {/* Right panel */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: '102%' }}
                transition={doorTransition}
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '50%',
                    background: 'linear-gradient(180deg, #0a0a14 0%, #0f0f1c 50%, #0a0a14 100%)',
                    borderLeft: '2px solid rgba(131,27,132,0.5)',
                    boxShadow: '-4px 0 40px rgba(0,0,0,0.9), inset 2px 0 20px rgba(131,27,132,0.1)',
                }}
            >
                <PanelStripes />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 40,
                    transform: 'translateY(-50%)',
                    fontFamily: 'var(--display)',
                    fontSize: 11,
                    color: 'rgba(131,27,132,0.5)',
                    letterSpacing: 4,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                }}>
                    AUTHORIZED ONLY
                </div>
            </motion.div>

            {/* Center glow as doors open */}
            <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: [0, 1, 0.8, 0], scaleX: [0, 1, 1, 0] }}
                transition={{ duration: 1.8, delay: 0.3, ease: 'easeOut' }}
                style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '20%',
                    background: 'linear-gradient(180deg, transparent, #831B84, #ff88ff, #831B84, transparent)',
                    boxShadow: '0 0 60px 20px rgba(131,27,132,0.6)',
                    pointerEvents: 'none',
                }}
            />

            {/* Welcome text in center during transition */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 1.1] }}
                transition={{ duration: 2.4, delay: 0, times: [0, 0.3, 0.5, 0.8, 1] }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 60,
                }}
            >
                <div style={{
                    fontFamily: 'var(--display)',
                    fontSize: 'clamp(18px, 3vw, 32px)',
                    fontWeight: 900,
                    color: '#831B84',
                    textShadow: '0 0 30px rgba(131,27,132,0.9)',
                    letterSpacing: 4,
                    whiteSpace: 'nowrap',
                }}>
                    WELCOME BACK
                </div>
                <div style={{
                    fontFamily: 'var(--display)',
                    fontSize: 'clamp(24px, 4vw, 48px)',
                    fontWeight: 900,
                    color: '#e8e8f0',
                    textShadow: '0 0 40px rgba(131,27,132,0.6)',
                    letterSpacing: 6,
                    marginTop: 4,
                }}>
                    {user.name}
                </div>
            </motion.div>
        </div>
    );
}
