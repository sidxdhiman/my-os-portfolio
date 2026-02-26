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
        id: 'notes-app' as AppId,
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
        title: 'Broski Board',
        desc: 'Advanced notes, reminders, and todo tracking synchronized to your workflow.',
        tag: 'Productivity',
        color: '#ff9800',
        bg: '#fff3e0',
    },
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

import { GitHubCalendar } from 'react-github-calendar';

/* ── Developer Rewind Modal ─────────────────────────────────────────── */
function DevRewindModal({ username, onComplete, onClose }: { username: string, onComplete: (s: any) => void, onClose: () => void }) {
    const [step, setStep] = useState(0);
    const [slide, setSlide] = useState(0);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        let isCommitsDone = false;
        let isUserDone = false;
        let isReposDone = false;
        let cStats = { repos: 0, commits: 0, year: new Date().getFullYear(), followers: 0, stars: 0, forks: 0, topLang: '', secondLang: '', thirdLang: '' };

        fetch(`https://api.github.com/users/${username}`)
            .then(res => res.json())
            .then(data => {
                if (data.public_repos !== undefined) {
                    cStats.repos = data.public_repos;
                    cStats.year = new Date(data.created_at || Date.now()).getFullYear();
                    cStats.followers = data.followers;
                }
                isUserDone = true;
                checkDone();
            }).catch(() => { isUserDone = true; checkDone(); });

        fetch(`https://api.github.com/search/commits?q=author:${username}`, {
            headers: { 'Accept': 'application/vnd.github.cloak-preview' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.total_count !== undefined) {
                    cStats.commits = data.total_count;
                }
                isCommitsDone = true;
                checkDone();
            })
            .catch(() => { isCommitsDone = true; checkDone(); });

        fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    let s = 0; let f = 0; let langs: Record<string, number> = {};
                    data.forEach(r => {
                        s += r.stargazers_count || 0;
                        f += r.forks_count || 0;
                        if (r.language) { langs[r.language] = (langs[r.language] || 0) + 1; }
                    });
                    cStats.stars = s;
                    cStats.forks = f;
                    const sortedLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).map(x => x[0]);
                    cStats.topLang = sortedLangs[0] || 'Code';
                    cStats.secondLang = sortedLangs[1] || '';
                    cStats.thirdLang = sortedLangs[2] || '';
                }
                isReposDone = true;
                checkDone();
            })
            .catch(() => { isReposDone = true; checkDone(); });

        function checkDone() {
            if (isUserDone && isCommitsDone && isReposDone) {
                setStats(cStats);
                setTimeout(() => setStep(1), 1500); // Hype delay
            }
        }
    }, [username]);

    useEffect(() => {
        if (step === 1 && slide < 9) {
            if (slide === 8) return; // stay on last slide manually
            const timer = setTimeout(() => setSlide(s => s + 1), 4500); /* Speed up slightly to handle more slides */
            return () => clearTimeout(timer);
        }
    }, [step, slide]);

    const GRADIENTS = [
        'linear-gradient(135deg, #f43f5e 0%, #7c3aed 100%)', // red to purple
        'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)', // blue to green
        'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', // yellow to red
        'linear-gradient(135deg, #0f172a 0%, #312e81 100%)', // dark slate to indigo
        'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // purple to pink
        'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', // teal to cyan
        'linear-gradient(135deg, #eab308 0%, #f97316 100%)', // yellow to orange
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // slate to darker slate
        'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)', // pink to red
        'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // indigo to purple
    ];

    const complete = () => {
        if (stats) onComplete(stats);
        else onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: step === 0 ? '#1a1d2e' : GRADIENTS[slide % GRADIENTS.length],
                color: '#fff', display: 'flex', flexDirection: 'column',
                fontFamily: 'var(--display)', overflow: 'hidden'
            }}
        >
            {/* Progress Bars like stories */}
            {step === 1 && (
                <div style={{ display: 'flex', gap: 6, padding: '24px 32px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: slide > i ? '100%' : '0%' }}
                                animate={{ width: slide === i ? '100%' : slide > i ? '100%' : '0%' }}
                                transition={{ duration: slide === i && slide !== 8 ? 4.5 : 0.1, ease: 'linear' }}
                                style={{ height: '100%', background: '#fff' }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Click zones for advancing/rewinding */}
            {step === 1 && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex' }}>
                    <div style={{ flex: '0 0 30%', cursor: 'w-resize' }} onClick={() => setSlide(s => Math.max(0, s - 1))} />
                    <div style={{ flex: '1', cursor: 'e-resize' }} onClick={() => setSlide(s => Math.min(8, s + 1))} />
                </div>
            )}

            <button onClick={complete} style={{ position: 'absolute', top: 32, right: 32, zIndex: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 100, fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(10px)', fontWeight: 600 }}>Skip ✕</button>

            {/* Content wrapper with pointerEvents: none so it doesn't block background clicks */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5%', position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', pointerEvents: 'auto' }}>
                            <div className="pulse-dot" style={{ width: 44, height: 44, background: '#fff', borderRadius: '50%', margin: '0 auto 24px', opacity: 0.8 }} />
                            <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-1px' }}>Accessing neural matrix for <br /> <span style={{ color: '#38bdf8' }}>@{username}</span>...</h2>
                        </motion.div>
                    )}
                    {step === 1 && slide === 0 && (
                        <motion.div key="s0" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', textAlign: 'center', pointerEvents: 'auto' }}>
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ fontSize: 24, marginBottom: 20, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Let's rewind to</motion.div>
                            <h1 style={{ fontSize: 'clamp(80px, 15vw, 160px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-4px', margin: 0, textShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                                {stats.year}
                            </h1>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ fontSize: 'clamp(18px, 3vw, 28px)', marginTop: 24, fontWeight: 500, opacity: 0.9 }}>
                                The year your GitHub journey officially started.
                            </motion.p>
                        </motion.div>
                    )}
                    {step === 1 && slide === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'left', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                Since then, you've become a<br />
                                <span style={{ color: '#10b981' }}>serious builder</span>.
                            </div>
                            <div style={{ marginTop: '5vh', display: 'flex', alignItems: 'baseline', gap: 16 }}>
                                <span style={{ fontSize: 'clamp(60px, 12vw, 120px)', fontWeight: 900, letterSpacing: '-3px' }}>{stats.repos}</span>
                                <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 600, opacity: 0.8 }}>Public Repositories</span>
                            </div>
                        </motion.div>
                    )}
                    {step === 1 && slide === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'right', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(36px, 7vw, 70px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                Fueled by<br />
                                ungodly caffeine<br />
                                and pure willpower...
                            </div>
                            <div style={{ marginTop: '4vh', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 16 }}>
                                <span style={{ fontSize: 'clamp(60px, 12vw, 140px)', fontWeight: 900, letterSpacing: '-4px', color: '#fcd34d' }}>{stats.commits.toLocaleString()}</span>
                                <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 600, opacity: 0.9 }}>Commits</span>
                            </div>
                        </motion.div>
                    )}
                    {step === 1 && slide === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'center', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
                                Your native tongue?
                            </div>
                            <div style={{ fontSize: 'clamp(50px, 12vw, 120px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-3px' }}>
                                {stats.topLang}
                            </div>
                        </motion.div>
                    )}
                    {step === 1 && slide === 4 && (
                        <motion.div key="s4" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'center', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 40 }}>
                                But you're multi-lingual.
                            </div>
                            {stats.secondLang ? (
                                <div style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 800, lineHeight: 1.2 }}>
                                    <span style={{ color: '#67e8f9' }}>{stats.secondLang}</span>
                                    {stats.thirdLang && <> &amp; <span style={{ color: '#f472b6' }}>{stats.thirdLang}</span></>}
                                </div>
                            ) : (
                                <div style={{ fontSize: 'clamp(30px, 6vw, 60px)', fontWeight: 800 }}>A master of one.</div>
                            )}
                        </motion.div>
                    )}
                    {step === 1 && slide === 5 && (
                        <motion.div key="s5" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'left', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                The community<br />noticed.
                            </div>
                            <div style={{ marginTop: '5vh', display: 'flex', alignItems: 'baseline', gap: 16 }}>
                                <span style={{ fontSize: 'clamp(60px, 12vw, 120px)', fontWeight: 900, letterSpacing: '-3px', color: '#fef08a' }}>{stats.stars.toLocaleString()}</span>
                                <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 600, opacity: 0.8 }}>Stars</span>
                            </div>
                        </motion.div>
                    )}
                    {step === 1 && slide === 6 && (
                        <motion.div key="s6" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'right', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(36px, 7vw, 70px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                They even started<br />borrowing your code.
                            </div>
                            <div style={{ marginTop: '4vh', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 16 }}>
                                <span style={{ fontSize: 'clamp(60px, 12vw, 140px)', fontWeight: 900, letterSpacing: '-4px', color: '#c084fc' }}>{stats.forks.toLocaleString()}</span>
                                <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 600, opacity: 0.9 }}>Forks</span>
                            </div>
                        </motion.div>
                    )}
                    {step === 1 && slide === 7 && (
                        <motion.div key="s7" initial={{ opacity: 0, x: 80, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -80, scale: 0.95, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 800, textAlign: 'center', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', textShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                Finally...<br />
                            </div>
                            <div style={{ marginTop: '4vh', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 16 }}>
                                <span style={{ fontSize: 'clamp(60px, 12vw, 140px)', fontWeight: 900, letterSpacing: '-4px', color: '#fff' }}>{stats.followers.toLocaleString()}</span>
                                <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 600, opacity: 0.9 }}>Devs got inspired and followed you.</span>
                            </div>
                        </motion.div>
                    )}
                    {step === 1 && slide === 8 && (
                        <motion.div key="s8" initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, type: 'spring' }} style={{ width: '100%', textAlign: 'center', pointerEvents: 'auto' }}>
                            <div style={{ fontSize: 'clamp(50px, 10vw, 100px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-3px', marginBottom: 20 }}>
                                What a journey.
                            </div>
                            <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)' }}>Ready to see the full heatmap?</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); complete(); }}
                                style={{
                                    background: '#fff', color: '#0f172a', border: 'none', padding: '20px 48px',
                                    borderRadius: 100, fontSize: 24, fontWeight: 800, marginTop: '5vh',
                                    cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative', zIndex: 10
                                }}
                            >
                                Let's Go 🚀
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}


/* ── Main Dashboard ─────────────────────────────────────────────────── */
export function Dashboard({ user, pushApp, openTerminal, logout }: DashboardProps) {
    const [profileOpen, setProfileOpen] = useState(false);

    // Developer Rewind states - Load initial values from localStorage
    const [inputName, setInputName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('lab_github_input') || '';
        }
        return '';
    });
    const [activeUsername, setActiveUsername] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('lab_github_active') || '';
        }
        return '';
    });
    const [rewindOpen, setRewindOpen] = useState(false);
    const [ghStats, setGhStats] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('lab_github_stats');
            if (saved) return JSON.parse(saved);
        }
        return { repos: '0', commits: '0' };
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lab_github_input', inputName);
        }
    }, [inputName]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lab_github_active', activeUsername);
        }
    }, [activeUsername]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lab_github_stats', JSON.stringify(ghStats));
        }
    }, [ghStats]);

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

            {/* Developer Rewind Full-Screen Modal */}
            <AnimatePresence>
                {rewindOpen && (
                    <DevRewindModal
                        username={inputName}
                        onClose={() => setRewindOpen(false)}
                        onComplete={(s) => {
                            setGhStats({ repos: String(s.repos), commits: String(s.commits) });
                            setActiveUsername(inputName);
                            setRewindOpen(false);
                        }}
                    />
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
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480, marginBottom: 20 }}>
                            Your interactive lab is ready. Launch any module below or open the terminal for command-line access.
                        </p>

                        {activeUsername && (
                            <div style={{ display: 'flex', gap: 28, flexShrink: 0, flexWrap: 'wrap', marginBottom: 24 }}>
                                <div style={{ textAlign: 'center', minWidth: 56 }}>
                                    <div style={{ fontSize: 11, marginBottom: 2 }}>📦</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{ghStats.repos}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--mono)' }}>Repos</div>
                                </div>
                                <div style={{ textAlign: 'center', minWidth: 56 }}>
                                    <div style={{ fontSize: 11, marginBottom: 2 }}>🔥</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{ghStats.commits}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--mono)' }}>Commits</div>
                                </div>
                            </div>
                        )}

                    </div>
                    <div style={{ flexShrink: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: activeUsername ? '16px 20px' : '32px 36px', background: 'var(--bg)', overflowX: 'auto', maxWidth: '100%', minWidth: activeUsername ? 'auto' : 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                        {!activeUsername ? (
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>Developer Rewind</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5, maxWidth: 280, margin: '0 auto 24px' }}>
                                    Connect a GitHub profile to uncover your coding story & heatmap calendar.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                    <input
                                        type="text"
                                        placeholder="GitHub username"
                                        value={inputName}
                                        spellCheck={false}
                                        onChange={e => setInputName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && inputName && setRewindOpen(true)}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-strong)',
                                            background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--mono)', outline: 'none', textAlign: 'center'
                                        }}
                                    />
                                    <button
                                        onClick={() => inputName && setRewindOpen(true)}
                                        style={{
                                            background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 16px',
                                            cursor: inputName ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14, transition: 'all 0.1s', opacity: inputName ? 1 : 0.6,
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >Generate Wrapped ✨</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>GitHub Contributions (@{activeUsername})</span>
                                    </div>
                                    <button
                                        onClick={() => setActiveUsername('')}
                                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4, transition: 'all 0.1s' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#d32f2f'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >Change User</button>
                                </div>
                                <GitHubCalendar
                                    username={activeUsername}
                                    colorScheme="light"
                                    fontSize={12}
                                    theme={{
                                        light: ['#ebedf0', '#c084fc', '#a855f7', '#9333ea', '#6b21a8'],
                                    }}
                                    blockMargin={4}
                                    blockSize={11}
                                />
                            </>
                        )}
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
