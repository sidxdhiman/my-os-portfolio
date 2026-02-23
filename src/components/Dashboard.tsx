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
                    padding: '11px 20px',
                    background: 'rgba(10,10,18,0.85)',
                    border: '1px solid rgba(131,27,132,0.15)',
                    borderRadius: 10,
                    backdropFilter: 'blur(24px)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#831B84' }} className="pulse-dot" />
                    <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: '#831B84', letterSpacing: 2.5 }}>
                        LAB OS
                    </span>
                    <div style={{ height: 12, width: 1, background: 'rgba(131,27,132,0.2)' }} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        padding: '4px 10px',
                        border: '1px solid rgba(131,27,132,0.12)',
                        borderRadius: 5,
                    }}>
                        Ctrl + ~ → Terminal
                    </span>

                    {/* User badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px',
                        background: 'rgba(131,27,132,0.08)',
                        border: '1px solid rgba(131,27,132,0.18)',
                        borderRadius: 7,
                    }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6a1670, #a040a0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: '#fff',
                        }}>
                            {user.name[0]}
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#e0e0ec', lineHeight: 1.2 }}>{user.name}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(131,27,132,0.7)' }}>{user.accessLevel}</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        title="Logout"
                        style={{
                            background: 'none',
                            border: '1px solid rgba(255,100,100,0.2)',
                            borderRadius: 6,
                            padding: '5px 11px',
                            color: 'rgba(255,100,100,0.5)',
                            fontFamily: 'var(--mono)', fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ff7070'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.2)'; }}
                    >
                        ⏻
                    </button>
                </div>
            </motion.div>

            {/* ── Welcome banner — centered ──────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                style={{
                    padding: '36px 40px',
                    background: 'rgba(9, 8, 16, 0.85)',
                    border: '1px solid rgba(131,27,132,0.15)',
                    borderRadius: 14,
                    backdropFilter: 'blur(24px)',
                    position: 'relative',
                    overflow: 'hidden',
                    /* Center all text */
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Ambient orb */}
                <div style={{
                    position: 'absolute', top: '-50%', right: '-5%',
                    width: '30%', paddingTop: '30%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(131,27,132,0.07) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                    <div style={{
                        fontFamily: 'var(--mono)', fontSize: 12,
                        color: 'rgba(131,27,132,0.6)', letterSpacing: 2.5, marginBottom: 12,
                    }}>
                        system online · access granted
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--display)',
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: 900,
                        color: '#e8e8f0',
                        letterSpacing: 2,
                        lineHeight: 1.15,
                        marginBottom: 12,
                    }}>
                        Welcome back,{' '}
                        <span style={{ color: '#8f1f90' }}>{user.name}</span>
                    </h1>
                    <p style={{
                        fontFamily: 'var(--mono)', fontSize: 13,
                        color: 'var(--text-muted)', maxWidth: 520,
                        lineHeight: 1.7, margin: '0 auto',
                    }}>
                        Lab modules online. Use Ctrl+~ to open the terminal, or click a module card below.
                    </p>
                </div>

                {/* Stats row — centered */}
                <div style={{ display: 'flex', gap: 40, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {STATS.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 900, color: '#7a1a7b', lineHeight: 1 }}>
                                {s.value}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, marginTop: 4 }}>
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
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 2 }}>
                        MODULES
                    </div>

                    {MODULES.map((mod, i) => (
                        <motion.button
                            key={mod.id}
                            id={`module-${mod.id}`}
                            onClick={() => pushApp(mod.id)}
                            whileHover={{ backgroundColor: 'rgba(131,27,132,0.08)' }}
                            whileTap={{ scale: 0.99 }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.32 + i * 0.07 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '18px 22px',
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
                                width: 46, height: 46, borderRadius: 10,
                                background: 'rgba(131,27,132,0.07)',
                                border: '1px solid rgba(131,27,132,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, color: mod.color, flexShrink: 0,
                            }}>
                                {mod.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontFamily: 'var(--body)', fontSize: 15, fontWeight: 600, color: '#dcdce8', letterSpacing: 0.2 }}>
                                        {mod.title}
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px',
                                        border: '1px solid rgba(131,27,132,0.2)', borderRadius: 3,
                                        color: 'rgba(131,27,132,0.6)', letterSpacing: 1.2,
                                    }}>
                                        {mod.tag}
                                    </span>
                                </div>
                                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    {mod.desc}
                                </p>
                            </div>
                            <div style={{ color: 'rgba(131,27,132,0.3)', fontFamily: 'var(--mono)', fontSize: 20 }}>›</div>
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
                            padding: '15px 22px',
                            background: 'rgba(131,27,132,0.03)',
                            border: '1px dashed rgba(131,27,132,0.2)',
                            borderRadius: 12, cursor: 'pointer',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: 1,
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
                        padding: '22px 24px',
                        backdropFilter: 'blur(20px)',
                        display: 'flex', flexDirection: 'column', gap: 14,
                    }}
                >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2 }}>
                        SKILL MATRIX
                    </div>

                    {SKILLS.map((skill, i) => (
                        <div key={skill.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: 0.2 }}>
                                    {skill.label}
                                </span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(131,27,132,0.7)' }}>
                                    {skill.pct}%
                                </span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(131,27,132,0.08)', borderRadius: 2, overflow: 'hidden' }}>
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
                    fontFamily: 'var(--mono)', fontSize: 11,
                    color: 'rgba(90,90,114,0.5)', letterSpacing: 0.5,
                }}
            >
                <span>© 2026 Laboratory OS — Sidharth</span>
                <span>{user.name} · {user.accessLevel}</span>
            </motion.div>
        </div>
    );
}
