'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WhiteboardProps { onClose: () => void; }
type Tool = 'pen' | 'eraser';

const COLORS = [
    '#1a1d2e', '#6200ea', '#d32f2f', '#1976d2',
    '#00897b', '#f57f17', '#e91e63', '#ffffff',
];

export function Whiteboard({ onClose }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#1a1d2e');
    const [size, setSize] = useState(3);
    const [drawing, setDrawing] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Light background
        ctx.fillStyle = '#f8f9fc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle dot grid
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let x = 0; x < canvas.width; x += 28)
            for (let y = 0; y < canvas.height; y += 28) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    }, []);

    function getPos(e: React.MouseEvent) {
        const r = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onMouseDown(e: React.MouseEvent) { setDrawing(true); lastPos.current = getPos(e); }
    function onMouseMove(e: React.MouseEvent) {
        if (!drawing) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const pos = getPos(e);
        const last = lastPos.current ?? pos;
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(pos.x, pos.y);
        if (tool === 'eraser') {
            ctx.strokeStyle = '#f8f9fc'; ctx.lineWidth = size * 5;
        } else {
            ctx.strokeStyle = color; ctx.lineWidth = size;
        }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        lastPos.current = pos;
    }
    function onMouseUp() { setDrawing(false); lastPos.current = null; }

    function clearCanvas() {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.fillStyle = '#f8f9fc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let x = 0; x < canvas.width; x += 28)
            for (let y = 0; y < canvas.height; y += 28) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    }

    function exportCanvas() {
        const canvas = canvasRef.current; if (!canvas) return;
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'), { href: url, download: 'whiteboard.png' });
            a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
        }, 'image/png');
    }

    const toolBtn = (active: boolean) => ({
        padding: '6px 14px',
        background: active ? 'var(--brand-xlight)' : 'transparent',
        border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
        borderRadius: 8,
        color: active ? 'var(--brand)' : 'var(--text-secondary)',
        fontFamily: 'var(--body)', fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 6,
    } as React.CSSProperties);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            style={{
                position: 'fixed', inset: '4%', zIndex: 80,
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
            }}
        >
            {/* ── Toolbar ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0 16px', height: 52, flexShrink: 0,
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
                flexWrap: 'wrap',
            }}>
                {/* Logo + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg, #6200ea, #9c27b0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                    }}>✍️</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Whiteboard</span>
                </div>

                <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

                {/* Tool buttons */}
                <button style={toolBtn(tool === 'pen')} onClick={() => setTool('pen')}>
                    <span>✏</span> Pen
                </button>
                <button style={toolBtn(tool === 'eraser')} onClick={() => setTool('eraser')}>
                    <span>⌫</span> Eraser
                </button>

                <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setTool('pen'); }}
                            style={{
                                width: 20, height: 20, borderRadius: 5,
                                background: c, cursor: 'pointer',
                                border: color === c ? '2.5px solid var(--brand)' : `2px solid ${c === '#ffffff' ? 'var(--border)' : 'transparent'}`,
                                transform: color === c ? 'scale(1.2)' : 'scale(1)',
                                transition: 'all 0.12s', flexShrink: 0,
                            }}
                        />
                    ))}
                    <input
                        type="color" value={color}
                        onChange={e => { setColor(e.target.value); setTool('pen'); }}
                        title="Custom color"
                        style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', padding: 0 }}
                    />
                </div>

                <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

                {/* Size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Size</span>
                    <input
                        type="range" min={1} max={24} value={size}
                        onChange={e => setSize(+e.target.value)}
                        style={{ width: 80, accentColor: 'var(--brand)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-secondary)', minWidth: 20 }}>{size}</span>
                </div>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Actions */}
                <button
                    onClick={exportCanvas}
                    style={{
                        padding: '6px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                    ⬇ Export PNG
                </button>
                <button
                    onClick={clearCanvas}
                    style={{
                        padding: '6px 14px', background: 'transparent', border: '1px solid #fed7d7',
                        borderRadius: 8, fontSize: 13, color: '#e53e3e', cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    ✕ Clear
                </button>
                <button
                    onClick={onClose}
                    style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.borderColor = '#fed7d7'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                    ✕
                </button>
            </div>

            {/* ── Canvas ──────────────────────────────────────────── */}
            <canvas
                ref={canvasRef}
                id="whiteboard-canvas"
                style={{
                    flex: 1, display: 'block', width: '100%', height: '100%',
                    cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            />
        </motion.div>
    );
}
