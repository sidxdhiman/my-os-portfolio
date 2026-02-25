'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LabUser, OSState } from '@/hooks/useOS';

interface IdEntryProps {
    setUser: (u: LabUser) => void;
    setPhase: (p: OSState['phase']) => void;
}

const ROLES = ['Researcher', 'Developer', 'Architect', 'Root'];

export function IdEntry({ setUser, setPhase }: IdEntryProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('Developer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleSubmit() {
        if (!name.trim()) { setError('Please enter your name to continue.'); return; }
        setError('');
        setLoading(true);
        const userData: LabUser = {
            name: name.trim(),
            accessLevel: role.toUpperCase(),
            issuedAt: new Date().toISOString(),
        };
        setTimeout(() => {
            if (typeof window !== 'undefined') localStorage.setItem('lab_user', JSON.stringify(userData));
            setUser(userData);
            setPhase('id-scan');
            setLoading(false);
        }, 500);
    }

    return (
        <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, padding: '0 16px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', maxWidth: 420 }}
            >
                {/* Card */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '40px 36px 36px',
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    {/* Logo mark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #6200ea, #9c27b0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(98,0,234,0.25)',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Dev Lab</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>sidharth.dev</div>
                        </div>
                    </div>

                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.5px' }}>
                        Sign in to your lab
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.5 }}>
                        Enter your name to access the interactive portfolio tools.
                    </p>

                    {/* Name field */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Your Name
                        </label>
                        <input
                            id="subject-name-input"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            placeholder="e.g. Sidharth"
                            autoFocus
                            style={{
                                width: '100%',
                                background: 'var(--bg)',
                                border: `1.5px solid ${error ? 'var(--error)' : 'var(--border-strong)'}`,
                                borderRadius: 'var(--radius-sm)',
                                padding: '10px 14px',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--body)',
                                fontSize: 15,
                                outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'var(--brand)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(98,0,234,0.12)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = error ? 'var(--error)' : 'var(--border-strong)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {error && (
                            <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>⚠</span> {error}
                            </p>
                        )}
                    </div>

                    {/* Role selector */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                            Role
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {ROLES.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRole(r)}
                                    style={{
                                        background: role === r ? 'var(--brand-xlight)' : 'var(--bg)',
                                        border: `1.5px solid ${role === r ? 'var(--brand)' : 'var(--border)'}`,
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '8px 12px',
                                        color: role === r ? 'var(--brand)' : 'var(--text-secondary)',
                                        fontFamily: 'var(--body)',
                                        fontSize: 13,
                                        fontWeight: role === r ? 600 : 400,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        textAlign: 'left' as const,
                                        display: 'flex', alignItems: 'center', gap: 7,
                                    }}
                                >
                                    <span style={{
                                        width: 14, height: 14, borderRadius: '50%',
                                        border: `2px solid ${role === r ? 'var(--brand)' : 'var(--border-strong)'}`,
                                        background: role === r ? 'var(--brand)' : 'transparent',
                                        flexShrink: 0, position: 'relative',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {role === r && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', display: 'block' }} />}
                                    </span>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                        id="issue-access-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            width: '100%',
                            background: loading ? '#c4a8f0' : 'var(--brand)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 24px',
                            color: '#fff',
                            fontFamily: 'var(--body)',
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: loading ? 'none' : 'var(--shadow-brand)',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Signing in…
                            </>
                        ) : (
                            'Continue to Lab →'
                        )}
                    </motion.button>

                    {/* Footer */}
                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>v3.7 · Local-only · No data sent</span>
                    </div>
                </div>

                {/* Tagline below card */}
                <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--text-muted)' }}>
                    Built by Sidharth · Interactive portfolio tools
                </p>
            </motion.div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
