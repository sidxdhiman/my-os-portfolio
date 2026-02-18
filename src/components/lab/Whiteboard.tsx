"use client";
import React, { useRef, useState, useEffect } from 'react';

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#831B84'; // Using your preferred purple shade
  }, []);

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      <canvas
        ref={canvasRef}
        onMouseDown={() => setIsDrawing(true)}
        onMouseMove={draw}
        onMouseUp={() => setIsDrawing(false)}
        className="flex-1 cursor-crosshair"
      />
    </div>
  );
}
