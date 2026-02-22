'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LabUser, OSState } from '@/hooks/useOS';

interface IdEntryProps {
    setUser: (u: LabUser) => void;
    setPhase: (p: OSState['phase']) => void;
}

const ACCESS_LEVELS = ['RESEARCHER', 'DEVELOPER', 'ARCHITECT', 'ROOT'];

export function IdEntry({ setUser, setPhase }: IdEntryProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState('DEVELOPER');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleIssue() {
        if (!name.trim()) {
            setError('Subject name is required');
            return;
        }
        setError('');
        setLoading(true);

        const userData: LabUser = {
            name: name.trim().toUpperCase(),
            accessLevel: level,
            issuedAt: new Date().toISOString(),
        };

        setTimeout(() => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('lab_user', JSON.stringify(userData));
            }
            setUser(userData);
            setPhase('id-scan');
            setLoading(false);
        }, 600);
    }

    return (
        /* Static centering wrapper — keeps translate(-50%,-50%) away from Framer Motion's transform pipeline */
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '0 16px',
            pointerEvents: 'none',
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -16 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '100%',
                    maxWidth: 420,
                    pointerEvents: 'auto',
                }}
            >
                <div style={{
                    background: 'rgba(10, 10, 16, 0.97)',
                    border: '1px solid rgba(131, 27, 132, 0.4)',
                    borderRadius: 12,
                    padding: '36px 32px 32px',
                    boxShadow: '0 0 60px rgba(131, 27, 132, 0.2), inset 0 1px 0 rgba(131, 27, 132, 0.2)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Corner decorations */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '2px solid #831B84', borderLeft: '2px solid #831B84' }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: '2px solid #831B84', borderRight: '2px solid #831B84' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderBottom: '2px solid #831B84', borderLeft: '2px solid #831B84' }} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '2px solid #831B84', borderRight: '2px solid #831B84' }} />

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#831B84', boxShadow: '0 0 10px #831B84' }} className="pulse-dot" />
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#831B84', letterSpacing: 3 }}>LABORATORY OS</span>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#831B84', boxShadow: '0 0 10px #831B84' }} className="pulse-dot" />
                        </div>
                        <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 900, letterSpacing: 2, color: '#e8e8f0', lineHeight: 1.2 }}>
                            BIOMETRIC INIT
                        </h1>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 6, letterSpacing: 1 }}>
                            SUBJECT IDENTIFICATION REQUIRED
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(131,27,132,0.5), transparent)', marginBottom: 28 }} />

                    {/* Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: '#831B84', letterSpacing: 2, marginBottom: 8 }}>
                                {'>'} SUBJECT_NAME
                            </label>
                            <input
                                id="subject-name-input"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleIssue()}
                                placeholder="Enter your identifier..."
                                autoFocus
                                style={{
                                    width: '100%',
                                    background: 'rgba(131, 27, 132, 0.06)',
                                    border: '1px solid rgba(131, 27, 132, 0.35)',
                                    borderRadius: 6,
                                    padding: '11px 14px',
                                    color: '#e8e8f0',
                                    fontFamily: 'var(--mono)',
                                    fontSize: 14,
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    letterSpacing: 1,
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#831B84';
                                    e.target.style.boxShadow = '0 0 16px rgba(131,27,132,0.25)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = 'rgba(131, 27, 132, 0.35)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: '#831B84', letterSpacing: 2, marginBottom: 8 }}>
                                {'>'} ACCESS_LEVEL
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {ACCESS_LEVELS.map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setLevel(lvl)}
                                        style={{
                                            background: level === lvl ? 'rgba(131, 27, 132, 0.25)' : 'rgba(131, 27, 132, 0.04)',
                                            border: `1px solid ${level === lvl ? '#831B84' : 'rgba(131, 27, 132, 0.2)'}`,
                                            borderRadius: 6,
                                            padding: '8px 12px',
                                            color: level === lvl ? '#e8e8f0' : 'var(--text-muted)',
                                            fontFamily: 'var(--mono)',
                                            fontSize: 11,
                                            letterSpacing: 1.5,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: level === lvl ? '0 0 12px rgba(131,27,132,0.3)' : 'none',
                                        }}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#ff6b6b', letterSpacing: 1 }}>
                                ⚠ {error}
                            </p>
                        )}

                        <motion.button
                            id="issue-access-btn"
                            onClick={handleIssue}
                            disabled={loading}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                marginTop: 4,
                                width: '100%',
                                background: loading
                                    ? 'rgba(131, 27, 132, 0.2)'
                                    : 'linear-gradient(135deg, #831B84, #a020a2)',
                                border: '1px solid rgba(131, 27, 132, 0.6)',
                                borderRadius: 8,
                                padding: '13px 24px',
                                color: '#fff',
                                fontFamily: 'var(--display)',
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 3,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: loading ? 'none' : '0 0 24px rgba(131, 27, 132, 0.5)',
                                transition: 'all 0.3s',
                            }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    PROCESSING...
                                </span>
                            ) : (
                                '◈ ISSUE ACCESS CARD'
                            )}
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
                            LAB_OS v3.7.1
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
                            SECURE CHANNEL ✓
                        </span>
                    </div>
                </div>

                <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
            </motion.div>
        </div>
    );
}

