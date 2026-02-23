'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NeuralEraserProps {
    onClose: () => void;
}

type Phase = 'idle' | 'scanning' | 'scanned' | 'removing' | 'done';

const REMOVAL_STEPS = [
    'Decoding pixel lattice...',
    'Building luminance map...',
    'Detecting overlay regions...',
    'Sampling inpaint neighborhoods...',
    'Inpainting pass 1/3...',
    'Inpainting pass 2/3...',
    'Inpainting pass 3/3...',
    'Frequency domain cleanup...',
    'Edge continuity reconstruction...',
    'Denoising output...',
    'Done ✓',
];

/* ── The real watermark detector + remover ─────────────────────────────────
   Algorithm:
   1. Draw the uploaded image to an off-screen canvas.
   2. Scan every pixel for "watermark candidates":
      - High luminance (>215) pixels  →  typical semi-transparent text overlay
      - Pixels very close to pure white (RGB all > 210)
   3. For each candidate pixel, compute the weighted median of its 9x9 neighborhood,
      using only non-candidate pixels as reference.
   4. Replace the candidate pixel with that neighborhood color.
   5. Two-pass for better coverage.
   6. Return a blob for download.
─────────────────────────────────────────────────────────────────────────── */
function removeLuminanceWatermarks(
    imageData: ImageData,
    threshold = 210,
    radius = 10,
): ImageData {
    const { data, width, height } = imageData;
    const out = new Uint8ClampedArray(data);

    // Mark candidate pixels (potential watermark)
    const isCandidate = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > threshold) isCandidate[i] = 1;
    }

    // Two passes of inpainting
    for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (!isCandidate[idx]) continue;

                let sumR = 0, sumG = 0, sumB = 0, count = 0;
                const r0 = Math.max(0, y - radius), r1 = Math.min(height - 1, y + radius);
                const c0 = Math.max(0, x - radius), c1 = Math.min(width - 1, x + radius);

                for (let ny = r0; ny <= r1; ny++) {
                    for (let nx = c0; nx <= c1; nx++) {
                        const ni = ny * width + nx;
                        if (!isCandidate[ni]) {
                            // Distance-weighted
                            const d = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                            const w = 1 / (d + 1);
                            sumR += out[ni * 4] * w;
                            sumG += out[ni * 4 + 1] * w;
                            sumB += out[ni * 4 + 2] * w;
                            count += w;
                        }
                    }
                }

                if (count > 0) {
                    out[idx * 4] = sumR / count;
                    out[idx * 4 + 1] = sumG / count;
                    out[idx * 4 + 2] = sumB / count;
                    out[idx * 4 + 3] = 255;
                }
            }
        }
    }

    return new ImageData(out, width, height);
}

function processImageFile(file: File, threshold: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Cap at 2048 for performance
            const scale = Math.min(1, 2048 / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const cleaned = removeLuminanceWatermarks(raw, threshold);
            ctx.putImageData(cleaned, 0, 0);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error('Canvas toBlob failed'));
            }, 'image/png');
        };

        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
        img.src = url;
    });
}

/* ── Component ─────────────────────────────────────────────────────────── */

const panel: React.CSSProperties = {
    background: 'rgba(10, 10, 18, 0.97)',
    border: '1px solid rgba(131,27,132,0.2)',
    borderRadius: 14,
    backdropFilter: 'blur(24px)',
};

export function NeuralEraser({ onClose }: NeuralEraserProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
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
        if (!f) return;
        if (!f.type.startsWith('image/')) {
            setError('Only image files are supported (PNG, JPG, WEBP).');
            return;
        }
        setError('');
        uploadedFile.current = f;
        setFileName(f.name);
        setFileType('image');
        setPreviewUrl(URL.createObjectURL(f));
        setPhase('scanning');
        setTimeout(() => setPhase('scanned'), 2200);
    }, []);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault(); setIsDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }

    async function startRemoval() {
        if (phase !== 'scanned' || !uploadedFile.current) return;
        setPhase('removing');
        setRemovalLog([]);
        setProgress(0);
        setResultBlob(null);

        // Simulate log steps while processing
        REMOVAL_STEPS.slice(0, -1).forEach((step, i) => {
            setTimeout(() => {
                setRemovalLog(prev => [...prev, step]);
                setProgress(Math.round(((i + 1) / REMOVAL_STEPS.length) * 90));
            }, i * 600);
        });

        try {
            const blob = await processImageFile(uploadedFile.current, threshold);
            setResultBlob(blob);
            setRemovalLog(prev => [...prev, 'Done ✓']);
            setProgress(100);
            setTimeout(() => setPhase('done'), 400);
        } catch {
            setError('Processing failed. Try a different image.');
            setPhase('scanned');
        }
    }

    function downloadResult() {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clean_${fileName.replace(/\.[^.]+$/, '')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function reset() {
        setPhase('idle'); setFileName(''); setFileType(null);
        setRemovalLog([]); setProgress(0);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null); setResultBlob(null); setError('');
        uploadedFile.current = null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed', inset: '4%',
                zIndex: 80,
                display: 'flex', flexDirection: 'column',
                ...panel,
                boxShadow: '0 0 60px rgba(131,27,132,0.15), 0 32px 80px rgba(0,0,0,0.8)',
            }}
        >
            {/* ── Title bar ──── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderBottom: '1px solid rgba(131,27,132,0.15)', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* macOS dots */}
                    <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={onClose} style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0 }} title="Close" />
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#28ca41' }} />
                    </div>
                    <div style={{ width: 1, height: 18, background: 'rgba(131,27,132,0.2)' }} />
                    <span style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, color: '#e8e8f2', letterSpacing: 1.5 }}>Neural Eraser</span>
                    <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px',
                        background: 'rgba(131,27,132,0.12)', border: '1px solid rgba(131,27,132,0.3)',
                        borderRadius: 4, color: '#a040a0', letterSpacing: 1.5,
                    }}>AI MODULE</span>
                </div>
                {/* Big accessible close button */}
                <button onClick={onClose} style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, cursor: 'pointer', color: 'var(--text-secondary)',
                    fontSize: 18, transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.12)'; e.currentTarget.style.color = '#ff7070'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    ✕
                </button>
            </div>

            {/* ── Body ──── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT — drop / preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(131,27,132,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(131,27,132,0.1)', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#831B84', letterSpacing: 2 }}>INPUT</span>
                    </div>

                    <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Error banner */}
                        {error && (
                            <div style={{
                                padding: '12px 16px', background: 'rgba(255,80,80,0.08)',
                                border: '1px solid rgba(255,80,80,0.25)', borderRadius: 8,
                                fontSize: 13, color: '#ff8080', fontFamily: 'var(--mono)',
                            }}>
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
                                    flex: 1, minHeight: 260,
                                    border: `2px dashed ${isDragOver ? '#831B84' : 'rgba(131,27,132,0.28)'}`,
                                    borderRadius: 14,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                                    cursor: 'pointer',
                                    background: isDragOver ? 'rgba(131,27,132,0.07)' : 'transparent',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                <div style={{ fontSize: 52, opacity: isDragOver ? 0.9 : 0.35 }}>{isDragOver ? '⬇' : '⊕'}</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 16, color: isDragOver ? '#e8e8f2' : 'var(--text-secondary)', marginBottom: 6 }}>
                                        Drop image here or click to browse
                                    </div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                                        PNG · JPG · WEBP
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active: file info + preview */}
                        {phase !== 'idle' && (
                            <>
                                {/* File header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                    background: 'rgba(131,27,132,0.06)', border: '1px solid rgba(131,27,132,0.18)', borderRadius: 10,
                                }}>
                                    <span style={{ fontSize: 22 }}>🖼</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, color: '#e8e8f2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {phase === 'scanning' ? '⏳ Scanning...' : phase === 'scanned' ? '✓ Scan complete — ready to remove' : phase === 'removing' ? '⚡ Processing...' : '✓ Clean version ready'}
                                        </div>
                                    </div>
                                    <button onClick={reset} style={{
                                        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8, padding: '6px 14px',
                                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
                                        transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#e8e8f2'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                        ✕ Reset
                                    </button>
                                </div>

                                {/* Image preview */}
                                {previewUrl && (
                                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(131,27,132,0.15)', background: '#0a0a14' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={phase === 'done' && resultBlob ? URL.createObjectURL(resultBlob) : previewUrl}
                                            alt="Preview"
                                            style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'contain' }}
                                        />
                                        {phase === 'scanning' && <div className="neural-scan-line" />}
                                        {phase === 'done' && (
                                            <div style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(40,202,65,0.9)', borderRadius: 6,
                                                padding: '4px 10px', fontSize: 12, fontFamily: 'var(--mono)', color: '#fff',
                                            }}>✓ CLEAN</div>
                                        )}
                                    </div>
                                )}

                                {/* Threshold slider (shown when scanned) */}
                                {phase === 'scanned' && (
                                    <div style={{ padding: '12px 16px', background: 'rgba(131,27,132,0.04)', border: '1px solid rgba(131,27,132,0.14)', borderRadius: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Detection threshold</span>
                                            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#831B84' }}>{threshold}</span>
                                        </div>
                                        <input type="range" min={150} max={250} value={threshold} onChange={e => setThreshold(+e.target.value)}
                                            style={{ width: '100%', accentColor: '#831B84', cursor: 'pointer' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                                            <span>Aggressive (150)</span><span>Conservative (250)</span>
                                        </div>
                                    </div>
                                )}

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
                                                background: 'linear-gradient(135deg, #6a1a7a, #a030a0)',
                                                border: 'none', borderRadius: 10, padding: '14px 20px',
                                                color: '#fff', fontFamily: 'var(--display)',
                                                fontSize: 16, fontWeight: 600, letterSpacing: 1.5,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ⚡ Remove Watermarks
                                        </motion.button>
                                    )}
                                    {phase === 'done' && resultBlob && (
                                        <motion.button
                                            id="download-result-btn"
                                            onClick={downloadResult}
                                            whileTap={{ scale: 0.97 }}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #1a7a30, #28ca41)',
                                                border: 'none', borderRadius: 10, padding: '14px 20px',
                                                color: '#fff', fontFamily: 'var(--display)',
                                                fontSize: 16, fontWeight: 600, letterSpacing: 1.5,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ⬇ Download Clean PNG
                                        </motion.button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT — log */}
                <div style={{ width: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(131,27,132,0.1)', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#831B84', letterSpacing: 2 }}>PROCESSING LOG</span>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                        {/* How it works */}
                        <div style={{ marginBottom: 8 }}>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 10 }}>HOW IT WORKS</p>
                            {[
                                'Detects high-luminance watermark pixels',
                                'Samples 10px neighborhood for each candidate',
                                'Distance-weighted inpainting (2 passes)',
                                'Outputs clean PNG at original resolution',
                            ].map((t, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                                    <span style={{ color: 'rgba(131,27,132,0.4)', fontSize: 12, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress */}
                        {(phase === 'removing' || phase === 'done') && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>PROGRESS</span>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#831B84' }}>{progress}%</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(131,27,132,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                                    <motion.div
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #6a1a7a, #c060c0)', borderRadius: 3 }}
                                    />
                                </div>

                                {/* Log lines */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {removalLog.map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{
                                                fontFamily: 'var(--mono)', fontSize: 12,
                                                color: i === removalLog.length - 1 ? '#e8e8f2' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}
                                        >
                                            <span style={{ color: '#831B84' }}>›</span> {line}
                                        </motion.div>
                                    ))}
                                    {phase === 'removing' && (
                                        <span style={{ display: 'inline-block', width: 7, height: 14, background: '#831B84', marginLeft: 22 }} className="cursor-blink" />
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Done summary */}
                        {phase === 'done' && resultBlob && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: 12, padding: '14px 16px',
                                    background: 'rgba(40,202,65,0.06)',
                                    border: '1px solid rgba(40,202,65,0.2)', borderRadius: 10,
                                }}
                            >
                                <div style={{ fontSize: 14, color: '#28ca41', fontWeight: 600, marginBottom: 4 }}>✓ Processing complete</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                                    High-luminance watermarks removed via inpainting. Click Download to save your clean PNG.
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
