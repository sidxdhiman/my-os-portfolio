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
        desc: 'Collaborative digital canvas',
        tag: 'CANVAS',
        color: '#6080c0',
    },
    {
        id: 'neural-eraser' as AppId,
        icon: '⊗',
        title: 'Neural Eraser',
        desc: 'Real watermark removal via canvas pixel analysis',
        tag: 'AI',
        color: '#9040a0',
    },
    {
        id: 'pdf-editor' as AppId,
        icon: '📄',
        title: 'PDF Editor',
        desc: 'Full-featured PDF annotator — text, shapes, draw, export',
        tag: 'EDITOR',
        color: '#4080d0',
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

const card: React.CSSProperties = {
    background: 'rgba(12, 12, 20, 0.88)',
    border: '1px solid rgba(131,27,132,0.16)',
    borderRadius: 16,
    backdropFilter: 'blur(24px)',
};

export function Dashboard({ user, pushApp, openTerminal, logout }: DashboardProps) {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'auto', padding: '24px 32px', gap: 18, zIndex: 5,
        }}>

            {/* ── Topbar ──────────────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ ...card, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#831B84' }} className="pulse-dot" />
                    <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: '#831B84', letterSpacing: 3 }}>
                        LAB OS
                    </span>
                    <div style={{ width: 1, height: 16, background: 'rgba(131,27,132,0.2)' }} />
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                        fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-muted)',
                        padding: '5px 12px', border: '1px solid rgba(131,27,132,0.14)', borderRadius: 8,
                    }}>
                        Ctrl + ~ → Terminal
                    </span>

                    {/* Avatar badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px',
                        background: 'rgba(131,27,132,0.08)',
                        border: '1px solid rgba(131,27,132,0.18)', borderRadius: 10,
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #5a1260, #9030a0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: '#fff',
                        }}>
                            {user.name[0]}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e8f2', lineHeight: 1.2 }}>{user.name}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(131,27,132,0.7)' }}>{user.accessLevel}</div>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        title="Logout"
                        style={{
                            background: 'rgba(255,80,80,0.06)',
                            border: '1px solid rgba(255,80,80,0.2)',
                            borderRadius: 10, padding: '8px 16px',
                            color: 'rgba(255,100,100,0.6)',
                            fontFamily: 'var(--body)', fontSize: 14,
                            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ff7070'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.2)'; }}
                    >
                        ⏻ Logout
                    </button>
                </div>
            </motion.header>

            {/* ── Welcome — FULLY CENTERED ─────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                style={{
                    ...card,
                    padding: '48px 40px 36px',
                    /* Full centering — both axis */
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {/* Soft ambient blob */}
                <div style={{
                    position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
                    width: '50%', paddingTop: '30%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(131,27,132,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'rgba(131,27,132,0.55)', letterSpacing: 3, marginBottom: 14 }}>
                    SYSTEM ONLINE · ACCESS GRANTED
                </p>
                <h1 style={{
                    fontFamily: 'var(--display)',
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    fontWeight: 700,
                    letterSpacing: 2,
                    lineHeight: 1.1,
                    marginBottom: 14,
                    color: '#eaeaf2',
                }}>
                    Welcome back,{' '}
                    <span style={{ color: '#9030a0' }}>{user.name}</span>
                </h1>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 500, lineHeight: 1.7 }}>
                    Lab modules online. Open the terminal with Ctrl+~ or click a module below.
                </p>

                {/* Stats row — centered */}
                <div style={{ display: 'flex', gap: 48, marginTop: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {STATS.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: '#8020a0', lineHeight: 1 }}>
                                {s.value}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1.5, marginTop: 5 }}>
                                {s.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── Modules + Skills ─────────────────────────────── */}
            <div style={{ display: 'flex', gap: 18, flex: 1, minHeight: 0 }}>

                {/* Module cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>MODULES</p>

                    {MODULES.map((mod, i) => (
                        <motion.button
                            key={mod.id}
                            id={`module-${mod.id}`}
                            onClick={() => pushApp(mod.id)}
                            whileHover={{ scale: 1.005, borderColor: 'rgba(131,27,132,0.35)' }}
                            whileTap={{ scale: 0.995 }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.08 }}
                            style={{
                                ...card,
                                display: 'flex', alignItems: 'center', gap: 18,
                                padding: '20px 24px',
                                cursor: 'pointer', textAlign: 'left', width: '100%',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{
                                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                                background: 'rgba(131,27,132,0.08)',
                                border: '1px solid rgba(131,27,132,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, color: mod.color,
                            }}>
                                {mod.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                                    <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: '#e0e0ee', letterSpacing: 0.5 }}>
                                        {mod.title}
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 7px',
                                        border: '1px solid rgba(131,27,132,0.22)', borderRadius: 4,
                                        color: 'rgba(131,27,132,0.65)', letterSpacing: 1.5,
                                    }}>
                                        {mod.tag}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{mod.desc}</p>
                            </div>
                            <span style={{ color: 'rgba(131,27,132,0.35)', fontSize: 24, lineHeight: 1 }}>›</span>
                        </motion.button>
                    ))}

                    {/* Terminal shortcut */}
                    <motion.button
                        onClick={openTerminal}
                        whileHover={{ borderColor: 'rgba(131,27,132,0.35)' }}
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px',
                            background: 'rgba(131,27,132,0.03)',
                            border: '1px dashed rgba(131,27,132,0.18)', borderRadius: 14,
                            cursor: 'pointer', color: 'var(--text-muted)',
                            fontSize: 14, fontFamily: 'var(--mono)',
                            width: '100%', transition: 'all 0.2s',
                        }}
                    >
                        <span style={{ color: 'rgba(131,27,132,0.45)', fontSize: 16 }}>{'>'}</span>
                        Open Terminal — Ctrl + ~
                    </motion.button>
                </motion.div>

                {/* Skills */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ ...card, flex: '1 1 45%', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>SKILL MATRIX</p>

                    {SKILLS.map((skill, i) => (
                        <div key={skill.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{skill.label}</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'rgba(131,27,132,0.65)' }}>{skill.pct}%</span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(131,27,132,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.pct}%` }}
                                    transition={{ delay: 0.45 + i * 0.07, duration: 1, ease: 'easeOut' }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #6a1a7a, #b050c0)', borderRadius: 3 }}
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* ── Footer ──────────────────────────────────────── */}
            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 4px',
                    fontSize: 12, color: 'rgba(90,90,114,0.45)',
                    fontFamily: 'var(--mono)', flexShrink: 0,
                }}
            >
                <span>© 2026 Laboratory OS — Sidharth</span>
                <span>{user.name} · {user.accessLevel}</span>
            </motion.footer>
        </div>
    );
}
