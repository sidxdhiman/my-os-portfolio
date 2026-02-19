"use client";
import React, { useRef, useState, useEffect } from "react";
import { Download, Trash2, X, MousePointer2, PenTool } from "lucide-react";

export default function Whiteboard({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#831B84");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
    }
  }, []);

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(e.clientX, e.clientY);
      ctx.strokeStyle = brushColor;
      ctx.stroke();
    }
  };

  return (
    <div className="h-full w-full relative bg-[#050505] overflow-hidden">
      {/* Google-Style Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 p-3 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex gap-2 mr-4">
          <button
            onClick={() => setBrushColor("#831B84")}
            className={`w-6 h-6 rounded-full bg-[#831B84] ${brushColor === "#831B84" ? "ring-2 ring-white" : ""}`}
          />
          <button
            onClick={() => setBrushColor("#ffffff")}
            className={`w-6 h-6 rounded-full bg-white ${brushColor === "#ffffff" ? "ring-2 ring-white" : ""}`}
          />
        </div>
        <button
          onClick={() => {
            const ctx = canvasRef.current?.getContext("2d");
            ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
          }}
          className="p-2 hover:bg-white/5 rounded-xl text-zinc-400"
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.download = "sid-lab-export.png";
            link.href = canvasRef.current?.toDataURL() || "";
            link.click();
          }}
          className="p-2 hover:bg-white/5 rounded-xl text-zinc-400"
        >
          <Download size={18} />
        </button>
        <div className="w-px h-6 bg-white/10" />
        <button
          onClick={onClose}
          className="p-2 hover:bg-red-500/20 rounded-xl text-red-500"
        >
          <X size={18} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          const ctx = canvasRef.current?.getContext("2d");
          ctx?.beginPath();
          ctx?.moveTo(e.clientX, e.clientY);
          setIsDrawing(true);
        }}
        onMouseMove={draw}
        onMouseUp={() => setIsDrawing(false)}
        className="cursor-crosshair"
      />
    </div>
  );
}
