"use client";
import React, { useRef, useState, useEffect } from "react";
import { Download, Trash2, X, Minus, Square, Type } from "lucide-react";

export default function Whiteboard({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#831B84"); // Your brand purple

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

  const startDrawing = (e: React.MouseEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX, e.clientY);
      ctx.strokeStyle = color;
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(e.clientX, e.clientY);
      ctx.stroke();
    }
  };

  const download = () => {
    const link = document.createElement("a");
    link.download = "lab-board-export.png";
    link.href = canvasRef.current?.toDataURL() || "";
    link.click();
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  return (
    <div className="h-full w-full relative bg-[#0a0a0a] cursor-crosshair">
      {/* Tool Bar */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <button
          onClick={clear}
          className="p-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={20} />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button
          onClick={() => setColor("#831B84")}
          className={`w-6 h-6 rounded-full bg-[#831B84] border-2 ${color === "#831B84" ? "border-white" : "border-transparent"}`}
        />
        <button
          onClick={() => setColor("#ffffff")}
          className={`w-6 h-6 rounded-full bg-white border-2 ${color === "#ffffff" ? "border-white" : "border-transparent"}`}
        />
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button
          onClick={download}
          className="p-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
        >
          <Download size={20} />
        </button>
        <button
          onClick={onClose}
          className="p-3 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={() => setIsDrawing(false)}
        className="absolute inset-0"
      />
    </div>
  );
}
