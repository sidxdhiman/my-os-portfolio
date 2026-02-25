'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { LabUser, AppId } from '@/hooks/useOS';

interface DashboardProps {
    user: LabUser;
    pushApp: (id: AppId) => void;
    openTerminal: () => void;
    logout: () => void;
}

/* ── Casino quote (Robert De Niro, Casino 1995) ─────────────────────── */
const CASINO_QUOTE = {
    text: `"In Vegas, everybody's gotta watch everybody else. Since the players are
trying to cheat the casino and the dealers are trying to cheat the players...
and the casino is watching everybody to keep them all honest.
All the way up, I'm being watched like a hawk."`,
    attribution: '— Sam "Ace" Rothstein · Casino, 1995',
};

/* ── Scratch card component ─────────────────────────────────────────── */
function ScratchCard({ onRevealed }: { onRevealed: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const revealed = useRef(false);
    const totalPixels = useRef(0);
    const [pct, setPct] = useState(0);
    const [done, setDone] = useState(false);

    /* Draw scratch layer */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        totalPixels.current = canvas.width * canvas.height;

        // Shiny silver gradient
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#c8c8d8');
        grad.addColorStop(0.4, '#e8e8f4');
        grad.addColorStop(0.7, '#b8b8cc');
        grad.addColorStop(1, '#d4d4e8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Hatching lines for texture
        ctx.globalAlpha = 0.08;
        for (let x = -canvas.height; x < canvas.width; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + canvas.height, canvas.height);
            ctx.strokeStyle = '#1a1d2e';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Hint text
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(26,29,46,0.55)';
        ctx.textAlign = 'center';
        ctx.fillText('🪙  Scratch to reveal  🪙', canvas.width / 2, canvas.height / 2 - 8);
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(26,29,46,0.35)';
        ctx.fillText('(drag your mouse across the surface)', canvas.width / 2, canvas.height / 2 + 14);
    }, []);

    function checkRevealPct(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] < 128) transparent++;
        const p = Math.round((transparent / (totalPixels.current)) * 100);
        setPct(p);
        if (p > 60 && !revealed.current) {
            revealed.current = true;
            setDone(true);
            // animate remaining away
            const canvas2 = canvasRef.current!;
            const c = canvas2.getContext('2d')!;
            const start = performance.now();
            function fade(now: number) {
                const progress = Math.min(1, (now - start) / 500);
                c.globalAlpha = 1 - progress;
                c.clearRect(0, 0, canvas2.width, canvas2.height);
                if (progress < 1) requestAnimationFrame(fade);
                else { c.globalAlpha = 1; onRevealed(); }
            }
            requestAnimationFrame(fade);
        }
    }

    function scratch(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * (canvas.width / r.width);
        const y = (e.clientY - r.top) * (canvas.height / r.height);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
        checkRevealPct(ctx, canvas);
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 12, overflow: 'hidden', userSelect: 'none' }}>
            {/* Quote beneath */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #1a1d2e, #2d1b69)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '10px 14px', textAlign: 'center',
            }}>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: '#cdd6f4', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                    {CASINO_QUOTE.text}
                </div>
                <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 6, fontFamily: 'var(--mono)' }}>
                    {CASINO_QUOTE.attribution}
                </div>
            </div>

            {/* Scratch overlay */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    cursor: done ? 'default' : 'crosshair',
                    display: done ? 'none' : 'block',
                }}
                onMouseDown={() => { isDrawing.current = true; }}
                onMouseMove={scratch}
                onMouseUp={() => { isDrawing.current = false; }}
                onMouseLeave={() => { isDrawing.current = false; }}
            />

            {/* Progress */}
            {pct > 0 && !done && (
                <div style={{
                    position: 'absolute', bottom: 4, right: 8,
                    fontFamily: 'var(--mono)', fontSize: 9,
                    color: 'rgba(255,255,255,0.5)',
                    background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: 4,
                }}>
                    {pct}% scratched
                </div>
            )}
        </div>
    );
}

/* ── Confetti particles ─────────────────────────────────────────────── */
function Confetti() {
    const COLORS = ['#6200ea', '#9c27b0', '#ff4081', '#ffea00', '#00e5ff', '#69f0ae'];
    const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.6,
        size: 6 + Math.random() * 8,
        wobble: (Math.random() - 0.5) * 60,
    }));
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
            {pieces.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `calc(${p.x}vw + ${p.wobble}px)`, opacity: 1, rotate: 0 }}
                    animate={{ y: '110vh', opacity: 0, rotate: 720 }}
                    transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeIn' }}
                    style={{
                        position: 'absolute', top: 0,
                        width: p.size, height: p.size * 0.55,
                        borderRadius: 2,
                        background: p.color,
                    }}
                />
            ))}
        </div>
    );
}

/* ── Easter-egg congratulations popup ───────────────────────────────── */
function EggFoundModal({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            }}
        >
            <Confetti />
            <motion.div
                initial={{ scale: 0.7, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg), 0 0 80px rgba(98,0,234,0.2)',
                    padding: '36px 40px',
                    textAlign: 'center', maxWidth: 380, width: '90vw',
                    position: 'relative',
                }}
            >
                <div style={{ fontSize: 52, marginBottom: 12 }}>🥚</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>
                    Easter Egg Found!
                </div>
                <div style={{
                    display: 'inline-block',
                    background: 'var(--brand-xlight)', color: 'var(--brand)',
                    border: '1px solid var(--brand-border)',
                    borderRadius: 100, fontSize: 12, padding: '4px 14px',
                    fontFamily: 'var(--mono)', fontWeight: 600, marginBottom: 16,
                }}>🎉 1 / 10 easter eggs found</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                    Congrats! You uncovered a hidden Casino quote by Sam&nbsp;"Ace"&nbsp;Rothstein.
                    There are <strong>9 more</strong> easter eggs hidden across the Lab — keep exploring!
                </p>
                {/* Quote teaser */}
                <div style={{
                    background: '#1a1d2e', borderRadius: 10, padding: '12px 16px',
                    marginBottom: 20, textAlign: 'left',
                }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#a78bfa', marginBottom: 8 }}>CASINO (1995) · Martin Scorsese</div>
                    <div style={{ fontSize: 11, color: '#cdd6f4', fontStyle: 'italic', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                        {CASINO_QUOTE.text.trim()}
                    </div>
                    <div style={{ fontSize: 10, color: '#6c6c8a', marginTop: 8, fontFamily: 'var(--mono)' }}>
                        {CASINO_QUOTE.attribution}
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '11px 20px',
                        background: 'var(--brand)', border: 'none',
                        borderRadius: 10, color: '#fff',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--body)',
                        boxShadow: 'var(--shadow-brand)',
                    }}
                >
                    Awesome, keep exploring! 🚀
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

/* ── Profile Modal ──────────────────────────────────────────────────── */
function ProfileModal({ user, onClose }: { user: LabUser; onClose: () => void }) {
    const [eggFound, setEggFound] = useState(false);
    const [showEgg, setShowEgg] = useState(false);
    const joinDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const handleRevealed = useCallback(() => {
        setTimeout(() => setShowEgg(true), 400);
    }, []);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 90,
                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)',
                }}
            />
            <motion.div
                id="profile-modal"
                initial={{ opacity: 0, scale: 0.93, y: -14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: -14 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    position: 'fixed',
                    top: 68, right: 24,
                    width: 360,
                    zIndex: 91,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                }}
            >
                {/* Header strip */}
                <div style={{
                    height: 80, background: 'linear-gradient(135deg, #6200ea 0%, #9c27b0 60%, #c2185b 100%)',
                    position: 'relative', flexShrink: 0,
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
                    }} />
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 28, height: 28, borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.25)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer', fontSize: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >✕</button>
                </div>

                {/* Avatar overlap */}
                <div style={{ padding: '0 20px', marginTop: -28 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6200ea, #9c27b0)',
                        border: '3px solid var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700, color: '#fff',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: 10,
                    }}>
                        {user.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
                        {user.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span className="chip" style={{ fontSize: 10, padding: '2px 8px' }}>
                            {user.accessLevel}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                            · devlab.local
                        </span>
                    </div>
                </div>

                {/* Info rows */}
                <div style={{ padding: '16px 20px' }}>
                    {[
                        { icon: '📅', label: 'Session started', value: joinDate },
                        { icon: '🔐', label: 'Clearance level', value: user.accessLevel },
                        { icon: '🌐', label: 'Node', value: 'devlab.local · v3.7.1' },
                        { icon: '🏛️', label: 'Stack', value: 'Next.js · TypeScript · Framer' },
                    ].map(row => (
                        <div key={row.label} style={{
                            display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10,
                            marginBottom: 10, borderBottom: '1px solid var(--border)',
                        }}>
                            <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{row.icon}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 110 }}>{row.label}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'var(--mono)' }}>{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Easter egg scratch card */}
                <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>🎰</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Secret Easter Egg
                        </span>
                        <span style={{
                            fontSize: 9, padding: '1px 7px', borderRadius: 100, fontFamily: 'var(--mono)',
                            background: '#fff8e1', color: '#f57f17',
                            border: '1px solid rgba(245,127,23,0.2)',
                        }}>
                            hidden
                        </span>
                    </div>
                    {!eggFound ? (
                        <ScratchCard onRevealed={() => { setEggFound(true); handleRevealed(); }} />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, #1a1d2e, #2d1b69)',
                                borderRadius: 12, padding: '14px 16px',
                            }}
                        >
                            <div style={{ fontSize: 11, lineHeight: 1.7, color: '#cdd6f4', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                                {CASINO_QUOTE.text}
                            </div>
                            <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 8, fontFamily: 'var(--mono)' }}>
                                {CASINO_QUOTE.attribution}
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Egg-found congratulations modal */}
            <AnimatePresence>
                {showEgg && <EggFoundModal onClose={() => setShowEgg(false)} />}
            </AnimatePresence>
        </>
    );
}

/* ── Dashboard data ─────────────────────────────────────────────────── */
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

/* ── Main Dashboard ─────────────────────────────────────────────────── */
export function Dashboard({ user, pushApp, openTerminal, logout }: DashboardProps) {
    const [profileOpen, setProfileOpen] = useState(false);

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

                    {/* User avatar — clickable → profile modal */}
                    <motion.button
                        id="profile-avatar-btn"
                        onClick={() => setProfileOpen(p => !p)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 9,
                            background: profileOpen ? 'var(--bg)' : 'transparent',
                            border: `1px solid ${profileOpen ? 'var(--brand-border)' : 'transparent'}`,
                            borderRadius: 10, padding: '4px 8px 4px 4px',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!profileOpen) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                        onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6200ea, #9c27b0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                            boxShadow: profileOpen ? 'var(--shadow-brand)' : 'none',
                            transition: 'box-shadow 0.2s',
                        }}>{user.name[0]?.toUpperCase()}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name}</span>
                            <span className="chip" style={{ fontSize: 9, padding: '1px 6px', marginTop: 2 }}>{user.accessLevel}</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </motion.button>

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

            {/* Profile modal (dropdown) */}
            <AnimatePresence>
                {profileOpen && (
                    <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
                )}
            </AnimatePresence>

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
                    <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,0,234,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
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
                                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: mod.bg, color: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${mod.color}22` }}>
                                        {mod.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{mod.title}</span>
                                            <span style={{ fontSize: 10, padding: '2px 8px', background: mod.bg, color: mod.color, border: `1px solid ${mod.color}30`, borderRadius: 100, fontFamily: 'var(--mono)', fontWeight: 500, letterSpacing: 0.5 }}>
                                                {mod.tag}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mod.desc}</p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </motion.button>
                            ))}

                            {/* Terminal shortcut */}
                            <motion.button
                                onClick={openTerminal}
                                whileHover={{ y: -1 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: MODULES.length * 0.08, duration: 0.3 }}
                                style={{
                                    background: 'var(--bg)', border: '1.5px dashed var(--border)',
                                    borderRadius: 'var(--radius-md)', padding: '14px 20px',
                                    cursor: 'pointer', textAlign: 'left', width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    color: 'var(--text-secondary)', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>$_</div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Open Terminal</div>
                                    <div style={{ fontSize: 12, opacity: 0.7, fontFamily: 'var(--mono)' }}>Ctrl + ~ · Command-line interface</div>
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Right: Skills + Session info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}
                        >
                            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, letterSpacing: 0.3 }}>Skill Proficiency</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {SKILLS.map((sk, i) => (
                                    <div key={sk.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{sk.label}</span>
                                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{sk.pct}%</span>
                                        </div>
                                        <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${sk.pct}%` }} transition={{ delay: 0.3 + i * 0.07, duration: 0.9, ease: 'easeOut' }}
                                                style={{ height: '100%', background: 'var(--brand)', borderRadius: 100, opacity: 0.75 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}
                        >
                            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, letterSpacing: 0.3 }}>Session Info</h2>
                            {[
                                { label: 'User', value: user.name },
                                { label: 'Access', value: user.accessLevel },
                                { label: 'Session', value: 'Local · Secure' },
                                { label: 'Lab version', value: 'v3.7.1' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                                    <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.value}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer style={{ padding: '14px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
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
