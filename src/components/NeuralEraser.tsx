'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppId } from '@/hooks/useOS';

interface NeuralEraserProps {
    onClose: () => void;
}

type ScanPhase = 'idle' | 'scanning' | 'scanned' | 'removing' | 'done';

interface WatermarkBox {
    x: number; y: number; w: number; h: number; label: string;
}

const DETECTED_LAYERS = [
    { icon: '◈', label: 'Text Overlay', detail: 'Semi-transparent white text, confidence: 97%', severity: 'high' },
    { icon: '◉', label: 'Logo Watermark', detail: 'Top-right corner composite, confidence: 94%', severity: 'high' },
    { icon: '◆', label: 'Pattern Mask', detail: 'Repeating tile pattern, confidence: 88%', severity: 'med' },
    { icon: '◇', label: 'Noise Layer', detail: 'Gaussian noise injection, confidence: 72%', severity: 'low' },
    { icon: '○', label: 'Alpha Channel', detail: 'Non-standard transparency, confidence: 91%', severity: 'med' },
];

const MOCK_WATERMARKS: WatermarkBox[] = [
    { x: 55, y: 12, w: 26, h: 10, label: 'TEXT' },
    { x: 72, y: 68, w: 20, h: 18, label: 'LOGO' },
    { x: 8, y: 42, w: 30, h: 8, label: 'PATTERN' },
];

const REMOVAL_STEPS = [
    'Initializing neural lattice...',
    'Sampling surrounding texture...',
    'Running inpainting model (pass 1/3)...',
    'Running inpainting model (pass 2/3)...',
    'Running inpainting model (pass 3/3)...',
    'Applying frequency domain cleanup...',
    'Reconstructing edge continuity...',
    'Denoising output...',
    'Finalizing clean result...',
    'Done. ✓',
];

export function NeuralEraser({ onClose }: NeuralEraserProps) {
    const [phase, setPhase] = useState<ScanPhase>('idle');
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [removalStep, setRemovalStep] = useState(0);
    const [removalLog, setRemovalLog] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadedFileRef = useRef<File | null>(null);

    const handleFile = useCallback((f: File) => {
        if (!f) return;
        uploadedFileRef.current = f;
        setFileName(f.name);
        setFileType(f.type.includes('pdf') ? 'pdf' : 'image');
        setPhase('scanning');
        setTimeout(() => setPhase('scanned'), 3000);
    }, []);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }

    function startRemoval() {
        if (phase !== 'scanned') return;
        setPhase('removing');
        setRemovalStep(0);
        setRemovalLog([]);

        REMOVAL_STEPS.forEach((step, i) => {
            setTimeout(() => {
                setRemovalStep(i);
                setRemovalLog(prev => [...prev, step]);
                if (i === REMOVAL_STEPS.length - 1) {
                    setTimeout(() => setPhase('done'), 600);
                }
            }, i * 700);
        });
    }

    function reset() {
        setPhase('idle');
        setFileName('');
        setFileType(null);
        setRemovalStep(0);
        setRemovalLog([]);
        uploadedFileRef.current = null;
    }

    /** Generate a clean canvas image and trigger real download */
    function downloadCleanResult() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 800, 600);
        grad.addColorStop(0, '#12101e');
        grad.addColorStop(0.5, '#1a1228');
        grad.addColorStop(1, '#18102c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 600);

        // Subtle grid
        ctx.strokeStyle = 'rgba(131,27,132,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
        for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }

        // Green check badge
        ctx.beginPath();
        ctx.arc(400, 260, 70, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40,202,65,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,202,65,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = '#28ca41';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(365, 262);
        ctx.lineTo(390, 292);
        ctx.lineTo(435, 238);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#28ca41';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WATERMARKS REMOVED', 400, 370);

        ctx.fillStyle = 'rgba(200,200,220,0.5)';
        ctx.font = '14px monospace';
        ctx.fillText(`Source: ${fileName}`, 400, 403);
        ctx.fillText('Processed by Neural Eraser · Lab OS', 400, 425);

        ctx.fillStyle = 'rgba(131,27,132,0.4)';
        ctx.font = '11px monospace';
        ctx.fillText('lab-os.neural-eraser · clean output', 400, 580);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const baseName = fileName.replace(/\.[^.]+$/, '');
            a.download = `clean_${baseName}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed',
                inset: '5%',
                zIndex: 80,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(7, 7, 14, 0.98)',
                border: '1px solid rgba(131, 27, 132, 0.4)',
                borderRadius: 16,
                boxShadow: '0 0 80px rgba(131, 27, 132, 0.2), 0 40px 120px rgba(0,0,0,0.9)',
                backdropFilter: 'blur(30px)',
                overflow: 'hidden',
            }}
        >
            {/* Title bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                background: 'rgba(131, 27, 132, 0.08)',
                borderBottom: '1px solid rgba(131, 27, 132, 0.2)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', cursor: 'pointer' }} onClick={onClose} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca41' }} />
                    </div>
                    <div style={{ height: 16, width: 1, background: 'rgba(131,27,132,0.3)' }} />
                    <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: '#e8e8f0', letterSpacing: 2 }}>
                        NEURAL ERASER
                    </span>
                    <div style={{
                        background: 'rgba(131, 27, 132, 0.2)',
                        border: '1px solid rgba(131,27,132,0.4)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontFamily: 'var(--mono)',
                        fontSize: 9,
                        color: '#a020a2',
                        letterSpacing: 2,
                    }}>
                        AI MODULE
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        fontSize: 16,
                        lineHeight: 1,
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e8e8f0')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                    ✕
                </button>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT PANE */}
                <div style={{ width: '55%', borderRight: '1px solid rgba(131,27,132,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid rgba(131,27,132,0.1)' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#831B84', letterSpacing: 2 }}>INPUT ZONE</span>
                    </div>

                    <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
                        {/* Drop zone */}
                        {(phase === 'idle') && (
                            <div
                                id="neural-drop-zone"
                                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    height: '100%',
                                    minHeight: 260,
                                    border: `2px dashed ${isDragOver ? '#831B84' : 'rgba(131,27,132,0.3)'}`,
                                    borderRadius: 12,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 16,
                                    cursor: 'pointer',
                                    background: isDragOver ? 'rgba(131,27,132,0.08)' : 'rgba(131,27,132,0.02)',
                                    transition: 'all 0.2s',
                                    boxShadow: isDragOver ? '0 0 40px rgba(131,27,132,0.2)' : 'none',
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    style={{ display: 'none' }}
                                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <div style={{ fontSize: 48, opacity: isDragOver ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                                    {isDragOver ? '⬇' : '⊕'}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: isDragOver ? '#e8e8f0' : 'var(--text-secondary)', marginBottom: 6 }}>
                                        Drop Image or PDF here
                                    </div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                                        Supported: PNG, JPG, WEBP, PDF
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scanning state */}
                        {(phase === 'scanning' || phase === 'scanned' || phase === 'removing' || phase === 'done') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* File info */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 14px',
                                    background: 'rgba(131,27,132,0.08)',
                                    border: '1px solid rgba(131,27,132,0.2)',
                                    borderRadius: 8,
                                }}>
                                    <span style={{ fontSize: 20 }}>{fileType === 'pdf' ? '📄' : '🖼'}</span>
                                    <div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#e8e8f0' }}>{fileName}</div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                                            {fileType?.toUpperCase()} — Neural scan {phase === 'scanning' ? 'in progress...' : 'complete'}
                                        </div>
                                    </div>
                                    <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11 }}>
                                        ✕ Reset
                                    </button>
                                </div>

                                {/* Preview box with watermark overlays */}
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '60%',
                                    background: 'linear-gradient(135deg, #1a1228 0%, #110e1e 50%, #18102c 100%)',
                                    border: '1px solid rgba(131,27,132,0.2)',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                }}>
                                    {/* Simulated image content */}
                                    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, padding: 2 }}>
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} style={{
                                                background: `hsl(${260 + i * 15}, 30%, ${10 + i * 3}%)`,
                                                borderRadius: 2,
                                                opacity: 0.6,
                                            }} />
                                        ))}
                                    </div>

                                    {/* Neural scan line */}
                                    {phase === 'scanning' && (
                                        <div className="neural-scan-line" style={{ zIndex: 5 }} />
                                    )}

                                    {/* Detected watermark boxes */}
                                    <AnimatePresence>
                                        {(phase === 'scanned' || phase === 'removing' || phase === 'done') && MOCK_WATERMARKS.map((box, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{
                                                    opacity: phase === 'done' ? 0 : 1,
                                                    scale: 1,
                                                }}
                                                transition={{ delay: i * 0.15, duration: 0.3 }}
                                                className={phase === 'scanned' ? 'watermark-box' : ''}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${box.x}%`,
                                                    top: `${box.y}%`,
                                                    width: `${box.w}%`,
                                                    height: `${box.h + 8}%`,
                                                    border: '2px solid #831B84',
                                                    borderRadius: 3,
                                                    background: 'rgba(131,27,132,0.1)',
                                                    zIndex: 6,
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute',
                                                    top: -16,
                                                    left: 0,
                                                    background: '#831B84',
                                                    color: '#fff',
                                                    fontFamily: 'var(--mono)',
                                                    fontSize: 8,
                                                    padding: '1px 5px',
                                                    borderRadius: 2,
                                                    letterSpacing: 1,
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {box.label}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Reconstruction animation overlay */}
                                    {phase === 'removing' && (
                                        <motion.div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(131,27,132,0.05)',
                                                zIndex: 7,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {[...Array(8)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                                                        y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                                                        opacity: [0, 0.8, 0],
                                                    }}
                                                    transition={{ duration: 0.8, delay: i * 0.3, repeat: Infinity }}
                                                    style={{
                                                        position: 'absolute',
                                                        width: `${8 + i * 4}px`,
                                                        height: `${8 + i * 4}px`,
                                                        background: '#831B84',
                                                        borderRadius: 1,
                                                        filter: 'blur(2px)',
                                                    }}
                                                />
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Done state - clean overlay */}
                                    {phase === 'done' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(40,202,65,0.06)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 8,
                                            }}
                                        >
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: '#28ca41', letterSpacing: 3 }}>
                                                    ✓ CLEAN
                                                </div>
                                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(40,202,65,0.7)' }}>
                                                    Watermarks removed
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {phase === 'scanned' && (
                                        <motion.button
                                            id="start-removal-btn"
                                            onClick={startRemoval}
                                            whileTap={{ scale: 0.97 }}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #831B84, #a020a2)',
                                                border: '1px solid rgba(131, 27, 132, 0.6)',
                                                borderRadius: 8,
                                                padding: '11px 20px',
                                                color: '#fff',
                                                fontFamily: 'var(--display)',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                letterSpacing: 2,
                                                cursor: 'pointer',
                                                boxShadow: '0 0 24px rgba(131,27,132,0.4)',
                                            }}
                                        >
                                            ⚡ START REMOVAL
                                        </motion.button>
                                    )}
                                    {phase === 'done' && (
                                        <motion.button
                                            id="download-result-btn"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileTap={{ scale: 0.97 }}
                                            style={{
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #28ca41, #1a9e30)',
                                                border: '1px solid rgba(40,202,65,0.4)',
                                                borderRadius: 8,
                                                padding: '11px 20px',
                                                color: '#fff',
                                                fontFamily: 'var(--display)',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                letterSpacing: 2,
                                                cursor: 'pointer',
                                                boxShadow: '0 0 20px rgba(40,202,65,0.3)',
                                            }}
                                            onClick={downloadCleanResult}
                                        >
                                            ⬇ DOWNLOAD CLEAN RESULT
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE */}
                <div style={{ width: '45%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid rgba(131,27,132,0.1)' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#831B84', letterSpacing: 2 }}>
                            INTELLIGENCE REPORT
                        </span>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Detected layers */}
                        <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 10 }}>
                                DETECTED LAYERS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {DETECTED_LAYERS.map((layer, i) => (
                                    <motion.div
                                        key={layer.label}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{
                                            opacity: (phase === 'idle') ? 0.3 : 1,
                                            x: 0,
                                        }}
                                        transition={{ delay: i * 0.08 }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            padding: '8px 12px',
                                            background: 'rgba(131,27,132,0.04)',
                                            border: `1px solid rgba(131,27,132,${phase === 'idle' ? 0.1 : 0.2})`,
                                            borderRadius: 6,
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* Severity bar */}
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 2,
                                            background: layer.severity === 'high' ? '#ff6b6b' : layer.severity === 'med' ? '#ffbd2e' : '#28ca41',
                                            borderRadius: '2px 0 0 2px',
                                        }} />
                                        <span style={{ color: '#831B84', fontSize: 12, flexShrink: 0 }}>{layer.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e8e8f0', marginBottom: 2 }}>{layer.label}</div>
                                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.4 }}>{layer.detail}</div>
                                        </div>
                                        {(phase === 'done') && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{ color: '#28ca41', fontSize: 12, flexShrink: 0 }}
                                            >
                                                ✓
                                            </motion.span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Removal log */}
                        {(phase === 'removing' || phase === 'done') && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 10 }}>
                                    NEURAL PROCESSING LOG
                                </div>
                                <div style={{
                                    background: 'rgba(6,6,12,0.8)',
                                    border: '1px solid rgba(131,27,132,0.2)',
                                    borderRadius: 6,
                                    padding: '10px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                }}>
                                    {removalLog.map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{
                                                fontFamily: 'var(--mono)',
                                                fontSize: 10,
                                                color: i === removalLog.length - 1 ? '#e8e8f0' : 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <span style={{ color: '#831B84' }}>{'>'}</span>
                                            {line}
                                        </motion.div>
                                    ))}
                                    {phase === 'removing' && (
                                        <span style={{ display: 'inline-block', width: 6, height: 11, background: '#831B84', marginLeft: 16 }} className="cursor-blink" />
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginTop: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>NEURAL PROGRESS</span>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#831B84' }}>
                                            {phase === 'done' ? '100' : Math.round((removalStep / (REMOVAL_STEPS.length - 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(131,27,132,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div
                                            style={{
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #831B84, #ff88ff)',
                                                borderRadius: 2,
                                                boxShadow: '0 0 8px rgba(131,27,132,0.6)',
                                            }}
                                            animate={{
                                                width: phase === 'done' ? '100%' : `${(removalStep / (REMOVAL_STEPS.length - 1)) * 100}%`,
                                            }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
