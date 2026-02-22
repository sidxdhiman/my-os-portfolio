'use client';

import { useEffect, useRef } from 'react';

export function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[];|_~*#831B84';
        const fontSize = 14;
        let columns: number[] = [];
        let animId: number;

        function resize() {
            if (!canvas || !ctx) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const numCols = Math.floor(canvas.width / fontSize);
            columns = Array(numCols).fill(1);
        }

        function draw() {
            if (!canvas || !ctx) return;
            // Slow soft fade trail
            ctx.fillStyle = 'rgba(6, 6, 8, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px "Share Tech Mono", monospace`;

            for (let i = 0; i < columns.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                // Vary brightness for depth
                const brightness = Math.random();
                if (brightness > 0.995) {
                    ctx.fillStyle = 'rgba(200, 140, 200, 0.5)'; // rare bright flash
                } else if (brightness > 0.95) {
                    ctx.fillStyle = 'rgba(131, 27, 132, 0.2)'; // medium
                } else {
                    ctx.fillStyle = 'rgba(131, 27, 132, 0.1)'; // very faint
                }

                ctx.fillText(char, i * fontSize, columns[i] * fontSize);

                if (columns[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    columns[i] = 0;
                }
                columns[i]++;
            }
            animId = requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener('resize', resize);
        animId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 1,
            }}
            aria-hidden="true"
        />
    );
}
