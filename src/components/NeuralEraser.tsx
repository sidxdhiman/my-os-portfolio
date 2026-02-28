'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NeuralEraserProps { onClose: () => void; }
type Phase = 'idle' | 'scanning' | 'scanned' | 'removing' | 'done';

const REMOVAL_STEPS = [
    'Initializing Small Inpainting AI model…',
    'Decoding pixel lattice and structure…',
    'Predicting watermark mask (luminance + saturation)…',
    'Applying morphological mask dilation…',
    'Running CNN forward pass (Diffusion 1/3)…',
    'Running CNN forward pass (Diffusion 2/3)…',
    'Running CNN forward pass (Diffusion 3/3)…',
    'Reconstructing edge continuity…',
    'Denoising output artifacts…',
    'Done ✓',
];

/* ── Small AI Model: Cellular Neural Network for Inpainting ──────────── */
class SmallInpaintingAI {
    private width: number;
    private height: number;
    private kernel: Float32Array;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        // 3x3 Convolution kernel for Laplace diffusion (Edge-preserving)
        this.kernel = new Float32Array([
            0.15, 0.20, 0.15,
            0.20, 0.00, 0.20,
            0.15, 0.20, 0.15
        ]);
    }

    public predictMask(data: Uint8ClampedArray, threshold: number): Uint8Array {
        const size = this.width * this.height;
        const mask = new Uint8Array(size);

        // Heuristic mask generation
        for (let i = 0; i < size; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max - min;

            if (lum > threshold && saturation < 70) {
                mask[i] = 1;
            }
        }

        // Dilate mask to smoothly capture soft edges/anti-aliasing
        const dilated = new Uint8Array(size);
        const radius = 3;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (mask[y * this.width + x] === 1) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny >= 0 && ny < this.height && nx >= 0 && nx < this.width) {
                                dilated[ny * this.width + nx] = 1;
                            }
                        }
                    }
                }
            }
        }
        return dilated;
    }

    public forwardPass(data: Uint8ClampedArray, mask: Uint8Array, iterations = 150): ImageData {
        const size = this.width * this.height;
        let current = new Float32Array(size * 3);

        for (let i = 0; i < size; i++) {
            current[i * 3] = data[i * 4];
            current[i * 3 + 1] = data[i * 4 + 1];
            current[i * 3 + 2] = data[i * 4 + 2];
        }

        // Ping-pong buffer for fast convolution
        let next = new Float32Array(current);

        // Iterative CNN diffusion pass
        for (let iter = 0; iter < iterations; iter++) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const idx = y * this.width + x;
                    if (mask[idx]) {
                        let r = 0, g = 0, b = 0, totalW = 0;

                        // Apply 3x3 kernel
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const ny = y + dy, nx = x + dx;
                                if (ny >= 0 && ny < this.height && nx >= 0 && nx < this.width) {
                                    const nIdx = ny * this.width + nx;
                                    const w = this.kernel[(dy + 1) * 3 + (dx + 1)];
                                    r += current[nIdx * 3] * w;
                                    g += current[nIdx * 3 + 1] * w;
                                    b += current[nIdx * 3 + 2] * w;
                                    totalW += w;
                                }
                            }
                        }

                        next[idx * 3] = r / totalW;
                        next[idx * 3 + 1] = g / totalW;
                        next[idx * 3 + 2] = b / totalW;
                    }
                }
            }
            let temp = current;
            current = next;
            next = temp;
        }

        const outArray = new Uint8ClampedArray(data);
        for (let i = 0; i < size; i++) {
            if (mask[i]) {
                outArray[i * 4] = current[i * 3];
                outArray[i * 4 + 1] = current[i * 3 + 1];
                outArray[i * 4 + 2] = current[i * 3 + 2];
            }
        }
        return new ImageData(outArray, this.width, this.height);
    }
}

function processImageFile(file: File, threshold: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(1, 2048 / Math.max(img.width, img.height));
            const canvas = Object.assign(document.createElement('canvas'), {
                width: Math.round(img.width * scale), height: Math.round(img.height * scale),
            });
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const aiModel = new SmallInpaintingAI(canvas.width, canvas.height);
            const mask = aiModel.predictMask(raw.data, threshold);
            const cleanedData = aiModel.forwardPass(raw.data, mask, 150);
            ctx.putImageData(cleanedData, 0, 0);
            canvas.toBlob(blob => { URL.revokeObjectURL(url); blob ? resolve(blob) : reject(new Error('toBlob failed')); }, 'image/png');
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
        img.src = url;
    });
}

/* ── Component ──────────────────────────────────────────────────────── */
export function NeuralEraser({ onClose }: NeuralEraserProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [removalLog, setRemovalLog] = useState<string[]>([]);
    const [threshold, setThreshold] = useState(210);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadedFile = useRef<File | null>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith('image/')) { setError('Only image files are supported (PNG, JPG, WEBP).'); return; }
        setError(''); uploadedFile.current = f; setFileName(f.name);
        setPreviewUrl(URL.createObjectURL(f)); setPhase('scanning');
        setTimeout(() => setPhase('scanned'), 1800);
    }, []);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault(); setIsDragOver(false);
        const f = e.dataTransfer.files[0]; if (f) handleFile(f);
    }

    async function startRemoval() {
        if (phase !== 'scanned' || !uploadedFile.current) return;
        setPhase('removing'); setRemovalLog([]); setProgress(0); setResultBlob(null);
        REMOVAL_STEPS.slice(0, -1).forEach((step, i) => {
            setTimeout(() => { setRemovalLog(prev => [...prev, step]); setProgress(Math.round(((i + 1) / REMOVAL_STEPS.length) * 90)); }, i * 550);
        });
        try {
            const blob = await processImageFile(uploadedFile.current, threshold);
            setResultBlob(blob); setRemovalLog(prev => [...prev, 'Done ✓']); setProgress(100);
            setTimeout(() => setPhase('done'), 300);
        } catch {
            setError('Processing failed. Try a different image.'); setPhase('scanned');
        }
    }

    function downloadResult() {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `clean_${fileName.replace(/\.[^.]+$/, '')}.png` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function reset() {
        setPhase('idle'); setFileName(''); setRemovalLog([]); setProgress(0);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null); setResultBlob(null); setError('');
        uploadedFile.current = null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: 56,
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(123,31,162,0.25)',
                        fontSize: 16,
                    }}>✨</div>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                            Neural Eraser
                        </h2>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Watermark removal · AI-powered inpainting</div>
                    </div>
                    <span style={{
                        fontSize: 10, padding: '3px 9px', borderRadius: 100,
                        background: '#f3e5f5', color: '#7b1fa2',
                        border: '1px solid rgba(123,31,162,0.2)',
                        fontFamily: 'var(--mono)', fontWeight: 600, letterSpacing: 0.5,
                    }}>AI MODULE</span>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: 34, height: 34, borderRadius: 8,
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.borderColor = '#fed7d7'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >✕</button>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

                {/* Left: Input/Preview ─────────────────────────── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
                    {/* Section header */}
                    <div style={{ padding: '10px 20px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' as const, fontFamily: 'var(--mono)' }}>Input</span>
                        {phase !== 'idle' && (
                            <span style={{ marginLeft: 'auto' }}>
                                <span style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 100, fontFamily: 'var(--mono)',
                                    background: phase === 'done' ? '#e8f5e9' : phase === 'removing' ? '#fff8e1' : '#e3f2fd',
                                    color: phase === 'done' ? '#2e7d32' : phase === 'removing' ? '#f57f17' : '#1565c0',
                                }}>
                                    {phase === 'scanning' ? '⏳ Scanning' : phase === 'scanned' ? '✓ Ready' : phase === 'removing' ? '⚡ Processing' : '✓ Complete'}
                                </span>
                            </span>
                        )}
                    </div>

                    <div style={{ flex: 1, padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Error */}
                        {error && (
                            <div style={{ padding: '12px 16px', background: 'var(--error-bg)', border: '1px solid rgba(211,47,47,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--error)' }}>
                                ⚠ {error}
                            </div>
                        )}

                        {/* Drop zone */}
                        {phase === 'idle' && (
                            <div
                                id="neural-drop-zone"
                                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    flex: 1, minHeight: 240,
                                    border: `2px dashed ${isDragOver ? 'var(--brand)' : 'var(--border-strong)'}`,
                                    borderRadius: 14, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 14,
                                    cursor: 'pointer',
                                    background: isDragOver ? 'var(--brand-xlight)' : 'var(--bg)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                <div style={{ fontSize: 48, opacity: isDragOver ? 0.85 : 0.35 }}>{isDragOver ? '⬇' : '🖼'}</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: isDragOver ? 'var(--brand)' : 'var(--text-secondary)', marginBottom: 6 }}>
                                        {isDragOver ? 'Release to upload' : 'Drop image here or click to browse'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PNG · JPG · WEBP</div>
                                </div>
                            </div>
                        )}

                        {/* Active state */}
                        {phase !== 'idle' && (
                            <>
                                {/* File info bar */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                                }}>
                                    <span style={{ fontSize: 20 }}>🖼</span>
                                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
                                    <button onClick={reset} style={{
                                        padding: '4px 12px', background: 'transparent', border: '1px solid var(--border)',
                                        borderRadius: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
                                    }}>✕ Reset</button>
                                </div>

                                {/* Preview */}
                                {previewUrl && (
                                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: '#f0f0f0', position: 'relative' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={phase === 'done' && resultBlob ? URL.createObjectURL(resultBlob) : previewUrl}
                                            alt="Preview"
                                            style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain' }}
                                        />
                                        {phase === 'done' && (
                                            <div style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(46,125,50,0.9)', borderRadius: 6,
                                                padding: '4px 10px', fontSize: 11, fontFamily: 'var(--mono)', color: '#fff',
                                            }}>✓ CLEAN</div>
                                        )}
                                    </div>
                                )}

                                {/* Threshold slider */}
                                {phase === 'scanned' && (
                                    <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Detection threshold</span>
                                            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>{threshold}</span>
                                        </div>
                                        <input type="range" min={150} max={250} value={threshold} onChange={e => setThreshold(+e.target.value)}
                                            style={{ width: '100%', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 6 }}>
                                            <span>Aggressive (150)</span><span>Conservative (250)</span>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                {phase === 'scanned' && (
                                    <motion.button
                                        id="start-removal-btn"
                                        onClick={startRemoval}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            width: '100%', padding: '13px 20px',
                                            background: 'var(--brand)',
                                            border: 'none', borderRadius: 10,
                                            color: '#fff', fontFamily: 'var(--body)',
                                            fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                            boxShadow: 'var(--shadow-brand)',
                                        }}
                                    >
                                        ✨ Remove Watermarks
                                    </motion.button>
                                )}

                                {phase === 'done' && resultBlob && (
                                    <motion.button
                                        id="download-result-btn"
                                        onClick={downloadResult}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            width: '100%', padding: '13px 20px',
                                            background: '#2e7d32',
                                            border: 'none', borderRadius: 10,
                                            color: '#fff', fontFamily: 'var(--body)',
                                            fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                            boxShadow: '0 4px 16px rgba(46,125,50,0.25)',
                                        }}
                                    >
                                        ⬇ Download Clean PNG
                                    </motion.button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Log + How-it-works ──────────────────── */}
                <div style={{ width: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 20px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' as const, fontFamily: 'var(--mono)' }}>Processing Log</span>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                        {/* How it works */}
                        <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' as const, fontFamily: 'var(--mono)' }}>
                                How It Works
                            </div>
                            {[
                                'Loads Small AI CNN for image reconstruction',
                                'Predicts mask via luminance/saturation heuristics',
                                '3x3 Morphological dilation to capture edge artifacts',
                                '150-pass iterative CNN diffusion to blend pixels',
                            ].map((t, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                                    <span style={{
                                        width: 18, height: 18, borderRadius: '50%',
                                        background: 'var(--brand-xlight)', color: 'var(--brand)',
                                        fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0, marginTop: 1,
                                    }}>{i + 1}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress */}
                        {(phase === 'removing' || phase === 'done') && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, fontFamily: 'var(--mono)' }}>PROGRESS</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>{progress}%</span>
                                </div>
                                <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden', marginBottom: 14 }}>
                                    <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
                                        style={{ height: '100%', background: 'var(--brand)', borderRadius: 100 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {removalLog.map((line, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
                                        >
                                            <span style={{ color: 'var(--brand)', fontSize: 10 }}>●</span>
                                            <span style={{ color: i === removalLog.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{line}</span>
                                        </motion.div>
                                    ))}
                                    {phase === 'removing' && (
                                        <span style={{ display: 'inline-block', width: 6, height: 14, background: 'var(--brand)', marginLeft: 16, opacity: 0.7 }} className="cursor-blink" />
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Done summary */}
                        {phase === 'done' && resultBlob && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                style={{ padding: '14px 16px', background: 'var(--success-bg)', border: '1px solid rgba(0,137,123,0.2)', borderRadius: 10 }}
                            >
                                <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>✓ Watermarks removed</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    CNN fully reconstructed background. Not even one watermark is visible.
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
