'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LabUser, OSState } from '@/hooks/useOS';

interface IdScanProps {
    user: LabUser;
    setPhase: (p: OSState['phase']) => void;
}

const STATUS_MSGS = [
    'Generating cryptographic identity...',
    'Encoding biometric hash...',
    'Verifying retinal signature...',
    'Decrypting neural key...',
    'Cross-referencing lab registry...',
    'Biometric authentication PASSED ✓',
    'Opening secure channel...',
    'Access GRANTED. Welcome.',
];

export function IdScan({ user, setPhase }: IdScanProps) {
    const [statusIdx, setStatusIdx] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [scanDone, setScanDone] = useState(false);

    useEffect(() => {
        // Start after card appears
        const t1 = setTimeout(() => setScanning(true), 800);
        const t2 = setTimeout(() => setScanDone(true), 4000);
        const t3 = setTimeout(() => setPhase('door-open'), 5200);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [setPhase]);

    useEffect(() => {
        if (!scanning) return;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setStatusIdx(i);
            if (i >= STATUS_MSGS.length - 1) clearInterval(interval);
        }, 420);
        return () => clearInterval(interval);
    }, [scanning]);

    // Generate barcode lines
    const barcodeLines = Array.from({ length: 38 }, (_, i) => ({
        width: [1, 2, 3, 1, 2, 1, 3, 2, 1, 2][i % 10],
        gap: [2, 1, 2, 3, 1, 2, 1, 2, 3, 1][i % 10],
    }));

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '0 16px',
            gap: 24,
            overflowY: 'auto',
        }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    width: '100%',
                    maxWidth: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                }}
            >
                {/* ID Card */}
                <motion.div
                    initial={{ y: 30, opacity: 0, rotateX: -10 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '100%', maxWidth: 400, perspective: 1000 }}
                >
                    <div
                        id="id-card"
                        style={{
                            background: 'linear-gradient(135deg, #0d0d18 0%, #12101e 40%, #0f0f1a 100%)',
                            border: '1px solid rgba(131, 27, 132, 0.6)',
                            borderRadius: 16,
                            padding: '24px 24px 20px',
                            boxShadow: '0 0 40px rgba(131, 27, 132, 0.3), 0 20px 60px rgba(0,0,0,0.8)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Card background shimmer */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(131,27,132, 0.02) 10px, rgba(131,27,132,0.02) 20px)',
                            pointerEvents: 'none',
                        }} />

                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#831B84', boxShadow: '0 0 8px #831B84' }} />
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#831B84', letterSpacing: 3 }}>LABORATORY OS</span>
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2 }}>
                                    ACCESS CREDENTIAL — CLASSIFIED
                                </div>
                            </div>
                            <div style={{
                                background: 'rgba(131, 27, 132, 0.15)',
                                border: '1px solid rgba(131,27,132,0.4)',
                                borderRadius: 4,
                                padding: '3px 8px',
                                fontFamily: 'var(--mono)',
                                fontSize: 9,
                                color: '#a020a2',
                                letterSpacing: 2,
                            }}>
                                {user.accessLevel}
                            </div>
                        </div>

                        {/* Main content */}
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 18 }}>
                            {/* Smart chip */}
                            <div style={{
                                width: 52,
                                height: 40,
                                borderRadius: 6,
                                background: 'linear-gradient(135deg, #c8a000, #f0c800, #c8a000)',
                                position: 'relative',
                                flexShrink: 0,
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(200, 160, 0, 0.4)',
                            }}>
                                {/* Chip lines */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '6px 4px' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{ height: 1, background: 'rgba(100,80,0,0.6)', borderRadius: 1 }} />
                                    ))}
                                </div>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', padding: '4px 4px', alignItems: 'center' }}>
                                    {[0, 1].map(i => (
                                        <div key={i} style={{ width: 1, height: '70%', background: 'rgba(100,80,0,0.6)', borderRadius: 1 }} />
                                    ))}
                                </div>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 26, height: 20, border: '1px solid rgba(100,80,0,0.4)', borderRadius: 3 }} />
                                {/* Shine effect */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
                                }} />
                            </div>

                            {/* Name & details */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>SUBJECT</div>
                                <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, color: '#e8e8f0', letterSpacing: 2, lineHeight: 1 }}>
                                    {user.name}
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(131,27,132,0.8)', marginTop: 6, letterSpacing: 1 }}>
                                    LAB-{Math.abs(user.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(6, '0')}
                                </div>
                            </div>
                        </div>

                        {/* Barcode */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 36, marginBottom: 8 }}>
                            {barcodeLines.map((line, i) => (
                                <div key={i} style={{ display: 'flex', gap: line.gap * 0.5 }}>
                                    <div style={{
                                        width: line.width,
                                        height: 28 + (i % 3 === 0 ? 8 : 0),
                                        background: `rgba(200, 160, 255, ${0.5 + (i % 5) * 0.1})`,
                                        borderRadius: 0.5,
                                        marginRight: line.gap * 0.5,
                                    }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 3, textAlign: 'center' }}>
                            {user.name.split('').map(c => c.charCodeAt(0).toString()).join(' ')}
                        </div>

                        {/* Footer line */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                                ISSUED: {new Date(user.issuedAt).toLocaleDateString()}
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                                TYPE: BIO-DIGITAL
                            </span>
                        </div>

                        {/* Laser scan beam */}
                        <AnimatePresence>
                            {scanning && !scanDone && (
                                <motion.div
                                    key="laser"
                                    initial={{ top: '5%', opacity: 0 }}
                                    animate={{ top: '95%', opacity: [0, 1, 1, 0] }}
                                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        height: 3,
                                        background: 'linear-gradient(90deg, transparent, #a020a2, #ff88ff, #a020a2, transparent)',
                                        boxShadow: '0 0 12px 4px rgba(131, 27, 132, 0.8)',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Scan done checkmark overlay */}
                        <AnimatePresence>
                            {scanDone && (
                                <motion.div
                                    key="scan-done"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(131, 27, 132, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 16,
                                    }}
                                >
                                    <div style={{
                                        fontFamily: 'var(--display)',
                                        fontSize: 18,
                                        fontWeight: 900,
                                        color: '#831B84',
                                        textShadow: '0 0 20px rgba(131,27,132,0.8)',
                                        letterSpacing: 4,
                                    }}>
                                        ✓ VERIFIED
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Status terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        background: 'rgba(6, 6, 10, 0.95)',
                        border: '1px solid rgba(131, 27, 132, 0.25)',
                        borderRadius: 8,
                        padding: '14px 18px',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#831B84', boxShadow: '0 0 8px #831B84' }} className="pulse-dot" />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#831B84', letterSpacing: 3 }}>SCAN TERMINAL</span>
                    </div>
                    {STATUS_MSGS.slice(0, statusIdx + 1).map((msg, i) => (
                        <div key={i} style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            color: i === statusIdx ? '#e8e8f0' : 'var(--text-muted)',
                            lineHeight: 1.6,
                            opacity: i === statusIdx ? 1 : 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <span style={{ color: '#831B84' }}>{'>'}</span>
                            <span>{msg}</span>
                            {i === statusIdx && !scanDone && (
                                <span style={{ width: 6, height: 11, background: '#831B84', display: 'inline-block' }} className="cursor-blink" />
                            )}
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}

