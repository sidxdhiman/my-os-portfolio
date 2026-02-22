'use client';

import { motion } from 'framer-motion';
import type { LabUser, AppId } from '@/hooks/useOS';

interface DashboardProps {
    user: LabUser;
    pushApp: (id: AppId) => void;
    openTerminal: () => void;
    logout: () => void;
}

const MODULES = [
    {
        id: 'whiteboard' as AppId,
        icon: '◼',
        title: 'Whiteboard',
        desc: 'Collaborative digital canvas with glow draw tools',
        tag: 'CANVAS',
        color: '#7090d0',
    },
    {
        id: 'neural-eraser' as AppId,
        icon: '⊗',
        title: 'Neural Eraser',
        desc: 'AI-powered watermark removal engine',
        tag: 'AI',
        color: '#a060b0',
    },
];

const SKILLS = [
    { label: 'Next.js', pct: 95 },
    { label: 'React', pct: 93 },
    { label: 'TypeScript', pct: 88 },
    { label: 'Framer Motion', pct: 82 },
    { label: 'Node.js', pct: 78 },
    { label: 'Python / AI', pct: 72 },
];

const STATS = [
    { label: 'Projects', value: '28+' },
    { label: 'Commits', value: '4.2K' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Modules', value: '12' },
];

export function Dashboard({ user, pushApp, openTerminal, logout }: DashboardProps) {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            padding: '20px 28px',
            gap: 16,
            zIndex: 5,
        }}>
            {/* ── Top bar ─────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 18px',
                    background: 'rgba(10,10,18,0.85)',
                    border: '1px solid rgba(131,27,132,0.15)',
                    borderRadius: 10,
                    backdropFilter: 'blur(24px)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#831B84' }} className="pulse-dot" />
                    <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#831B84', letterSpacing: 2.5 }}>
                        LAB OS
                    </span>
                    <div style={{ height: 12, width: 1, background: 'rgba(131,27,132,0.2)' }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        padding: '3px 8px',
                        border: '1px solid rgba(131,27,132,0.12)',
                        borderRadius: 5,
                    }}>
                        Ctrl + ~ → Terminal
                    </span>

                    {/* User badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '5px 10px',
                        background: 'rgba(131,27,132,0.08)',
                        border: '1px solid rgba(131,27,132,0.18)',
                        borderRadius: 7,
                    }}>
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6a1670, #a040a0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--display)', fontSize: 9, fontWeight: 700, color: '#fff',
                        }}>
                            {user.name[0]}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e0e0ec', lineHeight: 1 }}>{user.name}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(131,27,132,0.7)' }}>{user.accessLevel}</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            background: 'none',
                            border: '1px solid rgba(255,100,100,0.15)',
                            borderRadius: 5,
                            padding: '4px 9px',
                            color: 'rgba(255,100,100,0.45)',
                            fontFamily: 'var(--mono)', fontSize: 10,
                            cursor: 'pointer', letterSpacing: 1,
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ff7070'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.15)'; }}
                    >
                        ⏻
                    </button>
                </div>
            </motion.div>

            {/* ── Welcome banner ──────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                style={{
                    padding: '28px 30px',
                    background: 'rgba(9, 8, 16, 0.85)',
                    border: '1px solid rgba(131,27,132,0.15)',
                    borderRadius: 14,
                    backdropFilter: 'blur(24px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Subtle ambient orb */}
                <div style={{
                    position: 'absolute', top: '-60%', right: '-5%',
                    width: '35%', paddingTop: '35%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(131,27,132,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(131,27,132,0.6)', letterSpacing: 2.5, marginBottom: 10 }}>
                        system online · access granted
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--display)',
                        fontSize: 'clamp(22px, 3vw, 36px)',
                        fontWeight: 900,
                        color: '#e8e8f0',
                        letterSpacing: 2,
                        lineHeight: 1.15,
                        marginBottom: 10,
                    }}>
                        Welcome back, <span style={{ color: '#8f1f90' }}>{user.name}</span>
                    </h1>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', maxWidth: 480, lineHeight: 1.7 }}>
                        Lab modules online. Use Ctrl+~ to open the terminal, or click a module card below.
                    </p>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 28, marginTop: 22, flexWrap: 'wrap' }}>
                    {STATS.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                        >
                            <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 900, color: '#7a1a7b', lineHeight: 1 }}>
                                {s.value}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, marginTop: 3 }}>
                                {s.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── Main row ────────────────────────────── */}
            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

                {/* Modules */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.45 }}
                    style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 2 }}>
                        MODULES
                    </div>

                    {MODULES.map((mod, i) => (
                        <motion.button
                            key={mod.id}
                            id={`module-${mod.id}`}
                            onClick={() => pushApp(mod.id)}
                            whileHover={{ backgroundColor: 'rgba(131,27,132,0.07)' }}
                            whileTap={{ scale: 0.99 }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.32 + i * 0.07 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '16px 20px',
                                background: 'rgba(10, 10, 18, 0.82)',
                                border: '1px solid rgba(131,27,132,0.14)',
                                borderRadius: 12,
                                cursor: 'pointer',
                                textAlign: 'left',
                                backdropFilter: 'blur(16px)',
                                transition: 'background 0.25s',
                                width: '100%',
                            }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: 9,
                                background: `rgba(131,27,132,0.07)`,
                                border: `1px solid rgba(131,27,132,0.15)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, color: mod.color, flexShrink: 0,
                            }}>
                                {mod.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                    <span style={{ fontFamily: 'var(--body)', fontSize: 13, fontWeight: 600, color: '#dcdce8', letterSpacing: 0.3 }}>
                                        {mod.title}
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px',
                                        border: '1px solid rgba(131,27,132,0.2)', borderRadius: 3,
                                        color: 'rgba(131,27,132,0.6)', letterSpacing: 1.2,
                                    }}>
                                        {mod.tag}
                                    </span>
                                </div>
                                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    {mod.desc}
                                </p>
                            </div>
                            <div style={{ color: 'rgba(131,27,132,0.25)', fontFamily: 'var(--mono)', fontSize: 16 }}>›</div>
                        </motion.button>
                    ))}

                    {/* Terminal launcher */}
                    <motion.button
                        onClick={openTerminal}
                        whileHover={{ backgroundColor: 'rgba(131,27,132,0.06)' }}
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.48 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '13px 20px',
                            background: 'rgba(131,27,132,0.03)',
                            border: '1px dashed rgba(131,27,132,0.2)',
                            borderRadius: 12, cursor: 'pointer',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1,
                            width: '100%', transition: 'background 0.25s',
                        }}
                    >
                        <span style={{ color: 'rgba(131,27,132,0.5)' }}>{'>'}</span>
                        Open Terminal (Ctrl + ~)
                    </motion.button>
                </motion.div>

                {/* Skills panel */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.36, duration: 0.45 }}
                    style={{
                        flex: '1 1 45%',
                        background: 'rgba(9, 8, 16, 0.82)',
                        border: '1px solid rgba(131,27,132,0.14)',
                        borderRadius: 14,
                        padding: '20px 22px',
                        backdropFilter: 'blur(20px)',
                        display: 'flex', flexDirection: 'column', gap: 13,
                    }}
                >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>
                        SKILL MATRIX
                    </div>

                    {SKILLS.map((skill, i) => (
                        <div key={skill.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontFamily: 'var(--body)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 0.2 }}>
                                    {skill.label}
                                </span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(131,27,132,0.6)' }}>
                                    {skill.pct}%
                                </span>
                            </div>
                            <div style={{ height: 3, background: 'rgba(131,27,132,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.pct}%` }}
                                    transition={{ delay: 0.5 + i * 0.07, duration: 0.9, ease: 'easeOut' }}
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, rgba(131,27,132,0.7), rgba(180,60,180,0.6))',
                                        borderRadius: 2,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ── Footer ──────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 2px',
                    fontFamily: 'var(--mono)', fontSize: 9,
                    color: 'rgba(90,90,114,0.6)', letterSpacing: 0.8,
                }}
            >
                <span>© 2026 Laboratory OS — Sidharth</span>
                <span>{user.name} · {user.accessLevel}</span>
            </motion.div>
        </div>
    );
}
