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
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
                <path d="M7 10l3 3 4-4 3 3" />
            </svg>
        ),
        title: 'Whiteboard',
        desc: 'Infinite collaborative canvas for sketches, diagrams, and brainstorming.',
        tag: 'Canvas',
        color: '#1976d2',
        bg: '#e3f2fd',
    },
    {
        id: 'neural-eraser' as AppId,
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
        ),
        title: 'Neural Eraser',
        desc: 'Remove watermarks and artifacts from images using pixel-level canvas analysis.',
        tag: 'AI Tool',
        color: '#7b1fa2',
        bg: '#f3e5f5',
    },
    {
        id: 'pdf-editor' as AppId,
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
        title: 'PDF Editor',
        desc: 'Annotate, draw, highlight, and export PDFs — fully in-browser, no upload needed.',
        tag: 'Editor',
        color: '#d32f2f',
        bg: '#ffebee',
    },
];

const SKILLS = [
    { label: 'Next.js', pct: 95, color: '#1a1d2e' },
    { label: 'React', pct: 93, color: '#61dafb' },
    { label: 'TypeScript', pct: 88, color: '#3178c6' },
    { label: 'Framer Motion', pct: 82, color: '#ff4154' },
    { label: 'Node.js', pct: 78, color: '#3c873a' },
    { label: 'Python / AI', pct: 72, color: '#f7c430' },
];

const STATS = [
    { label: 'Projects', value: '28+', icon: '🚀' },
    { label: 'Commits', value: '4.2k', icon: '📦' },
    { label: 'Uptime', value: '99.9%', icon: '⚡' },
    { label: 'Modules', value: '12', icon: '🧩' },
];

export function Dashboard({ user, pushApp, openTerminal, logout }: DashboardProps) {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'auto', zIndex: 5,
        }}>
            {/* ── Top navigation bar ─────────────────────────────────── */}
            <header style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                padding: '0 32px',
                display: 'flex', alignItems: 'center', height: 60, flexShrink: 0,
                position: 'sticky', top: 0, zIndex: 20,
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'linear-gradient(135deg, #6200ea, #9c27b0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Dev Lab</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--border-strong)' }}>›</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>Dashboard</span>
                    </span>
                </div>

                {/* Nav right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Terminal badge */}
                    <button
                        onClick={openTerminal}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '6px 14px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            fontFamily: 'var(--mono)', fontSize: 12,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 700 }}>$_</span>
                        <span>Terminal</span>
                        <kbd style={{ fontSize: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-muted)' }}>Ctrl+~</kbd>
                    </button>

                    {/* User avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6200ea, #9c27b0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: '#fff',
                            flexShrink: 0,
                        }}>{user.name[0]?.toUpperCase()}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name}</span>
                            <span className="chip" style={{ fontSize: 9, padding: '1px 6px', marginTop: 2 }}>{user.accessLevel}</span>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        title="Sign out"
                        style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#d32f2f'; e.currentTarget.style.color = '#d32f2f'; e.currentTarget.style.background = '#fff0f0'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        ⏻
                    </button>
                </div>
            </header>

            {/* ── Main content ────────────────────────────────────────── */}
            <div style={{ flex: 1, padding: '28px 32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

                {/* Hero section */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '32px 36px',
                        marginBottom: 24,
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex', alignItems: 'center', gap: 28,
                        overflow: 'hidden', position: 'relative',
                    }}
                >
                    {/* Subtle purple gradient blob */}
                    <div style={{
                        position: 'absolute', right: -60, top: -60,
                        width: 260, height: 260, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(98,0,234,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00897b', flexShrink: 0 }} className="pulse-dot" />
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>SYSTEM ONLINE</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>
                            Good to see you, <span style={{ color: 'var(--brand)' }}>{user.name}</span> 👋
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
                            Your interactive lab is ready. Launch any module below or open the terminal for command-line access.
                        </p>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 28, flexShrink: 0, flexWrap: 'wrap' }}>
                        {STATS.map(s => (
                            <div key={s.label} style={{ textAlign: 'center', minWidth: 56 }}>
                                <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--mono)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Content grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

                    {/* Left: Modules */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.3 }}>Lab Modules</h2>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>{MODULES.length} available</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {MODULES.map((mod, i) => (
                                <motion.button
                                    key={mod.id}
                                    id={`module-${mod.id}`}
                                    onClick={() => pushApp(mod.id)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08, duration: 0.3 }}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '18px 20px',
                                        cursor: 'pointer', textAlign: 'left', width: '100%',
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                        background: mod.bg,
                                        color: mod.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: `1px solid ${mod.color}22`,
                                    }}>
                                        {mod.icon}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                                                {mod.title}
                                            </span>
                                            <span style={{
                                                fontSize: 10, padding: '2px 8px',
                                                background: mod.bg, color: mod.color,
                                                border: `1px solid ${mod.color}30`,
                                                borderRadius: 100, fontFamily: 'var(--mono)',
                                                fontWeight: 500, letterSpacing: 0.5,
                                            }}>
                                                {mod.tag}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {mod.desc}
                                        </p>
                                    </div>

                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </motion.button>
                            ))}

                            {/* Terminal shortcut card */}
                            <motion.button
                                onClick={openTerminal}
                                whileHover={{ y: -1 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: MODULES.length * 0.08, duration: 0.3 }}
                                style={{
                                    background: 'var(--bg)',
                                    border: '1.5px dashed var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '14px 20px',
                                    cursor: 'pointer', textAlign: 'left', width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)';
                                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, flexShrink: 0,
                                }}>
                                    $_
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Open Terminal</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, fontFamily: 'var(--mono)' }}>Ctrl + ~ · Command-line interface</div>
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Right: Skills + Quick info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Skills panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.35 }}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '20px 20px',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, letterSpacing: 0.3 }}>
                                Skill Proficiency
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {SKILLS.map((sk, i) => (
                                    <div key={sk.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{sk.label}</span>
                                            </div>
                                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{sk.pct}%</span>
                                        </div>
                                        <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${sk.pct}%` }}
                                                transition={{ delay: 0.3 + i * 0.07, duration: 0.9, ease: 'easeOut' }}
                                                style={{ height: '100%', background: 'var(--brand)', borderRadius: 100, opacity: 0.75 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Quick info panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.35 }}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '20px',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: 0.3 }}>
                                Session Info
                            </h2>
                            {[
                                { label: 'User', value: user.name },
                                { label: 'Access', value: user.accessLevel },
                                { label: 'Session', value: 'Local · Secure' },
                                { label: 'Lab version', value: 'v3.7.1' },
                            ].map(row => (
                                <div key={row.label} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                                }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                                    <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.value}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer style={{
                padding: '14px 32px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-card)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2026 Dev Lab · Built by Sidharth</span>
                <div style={{ display: 'flex', gap: 20 }}>
                    {['GitHub', 'LinkedIn', 'Email'].map(link => (
                        <a key={link} href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            {link}
                        </a>
                    ))}
                </div>
            </footer>
        </div>
    );
}
