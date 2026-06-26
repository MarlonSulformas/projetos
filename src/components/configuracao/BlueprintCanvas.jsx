import React, { useRef, useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Trash2 } from "lucide-react";

// Worker via CDN matching installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

const COLOR_MAP = {
  blue:   { border: "#3B82F6", bg: "rgba(59,130,246,0.18)",  tag: "#1D4ED8", tagBg: "rgba(219,234,254,0.95)" },
  green:  { border: "#22C55E", bg: "rgba(34,197,94,0.18)",   tag: "#15803D", tagBg: "rgba(220,252,231,0.95)" },
  orange: { border: "#F97316", bg: "rgba(249,115,22,0.18)",  tag: "#C2410C", tagBg: "rgba(255,237,213,0.95)" },
  violet: { border: "#A855F7", bg: "rgba(168,85,247,0.18)",  tag: "#7E22CE", tagBg: "rgba(243,232,255,0.95)" },
};
function getColor(id) { return COLOR_MAP[id] || COLOR_MAP.blue; }

/**
 * Renderiza o PDF em canvas (sem scroll, zoom automático fit-to-container).
 * Áreas salvas em coordenadas normalizadas (0..1) relativas ao canvas renderizado.
 */
export default function BlueprintCanvas({ activeAreaId, areas, pdfUrl, onRegionDrawn, onRegionDeleted }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [drawing, setDrawing] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // Renderiza o PDF no canvas sempre que a URL ou o tamanho do container mudar
  useEffect(() => {
    if (!pdfUrl || !containerRef.current) return;

    let cancelled = false;

    async function render() {
      const container = containerRef.current;
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      if (!containerW || !containerH) return;

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      if (cancelled) return;

      // Renderiza a primeira página ajustada ao container
      const page = await pdf.getPage(1);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 1 });
      const scaleX = containerW / viewport.width;
      const scaleY = containerH / viewport.height;
      const scale = Math.min(scaleX, scaleY);

      const scaledViewport = page.getViewport({ scale });
      const canvasW = Math.floor(scaledViewport.width);
      const canvasH = Math.floor(scaledViewport.height);

      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      canvas.width = canvasW;
      canvas.height = canvasH;
      setCanvasSize({ w: canvasW, h: canvasH });

      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    }

    render();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  // Re-renderiza quando o container é redimensionado
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => {
      if (pdfUrl) {
        // Força re-render mudando uma dep — re-usa o efeito acima
        setCanvasSize(s => ({ ...s }));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [pdfUrl]);

  function getPosNorm(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function onMouseDown(e) {
    if (!activeAreaId) return;
    e.preventDefault();
    const p = getPosNorm(e);
    setDrawing({ sx: p.x, sy: p.y, cx: p.x, cy: p.y });
  }
  function onMouseMove(e) {
    if (!drawing) return;
    const p = getPosNorm(e);
    setDrawing(d => ({ ...d, cx: p.x, cy: p.y }));
  }
  function onMouseUp() {
    if (!drawing || !activeAreaId) return;
    const x = Math.min(drawing.sx, drawing.cx);
    const y = Math.min(drawing.sy, drawing.cy);
    const w = Math.abs(drawing.cx - drawing.sx);
    const h = Math.abs(drawing.cy - drawing.sy);
    if (w > 0.01 && h > 0.01) {
      onRegionDrawn(activeAreaId, { x, y, width: w, height: h });
    }
    setDrawing(null);
  }

  const inProgress = drawing ? {
    x: Math.min(drawing.sx, drawing.cx),
    y: Math.min(drawing.sy, drawing.cy),
    width: Math.abs(drawing.cx - drawing.sx),
    height: Math.abs(drawing.cy - drawing.sy),
  } : null;

  const activeArea = activeAreaId ? areas.find(a => a.id === activeAreaId) : null;
  const toPercent = v => `${(v * 100).toFixed(4)}%`;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      {/* Canvas do PDF */}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          background: "#fff",
        }}
      />

      {/* Overlay de marcação — posicionado exatamente sobre o canvas */}
      {canvasSize.w > 0 && (
        <div
          style={{
            position: "absolute",
            width: canvasSize.w,
            height: canvasSize.h,
            cursor: activeAreaId ? "crosshair" : "default",
            pointerEvents: activeAreaId ? "auto" : "none",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Áreas existentes */}
          {areas.filter(a => a.rect).map(area => {
            const c = getColor(area.color);
            const r = area.rect;
            const isHovered = hoveredId === area.id;
            return (
              <div
                key={area.id}
                style={{
                  position: "absolute",
                  left: toPercent(r.x),
                  top: toPercent(r.y),
                  width: toPercent(r.width),
                  height: toPercent(r.height),
                  border: `2px dashed ${c.border}`,
                  backgroundColor: c.bg,
                  borderRadius: "3px",
                  pointerEvents: activeAreaId ? "none" : "auto",
                  boxSizing: "border-box",
                }}
                onMouseEnter={() => setHoveredId(area.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <span style={{
                  position: "absolute", top: "4px", left: "6px",
                  fontSize: "10px", fontWeight: "600",
                  color: c.tag, backgroundColor: c.tagBg,
                  padding: "2px 6px", borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}>
                  {area.name}
                </span>
                {isHovered && (
                  <button
                    onClick={e => { e.stopPropagation(); onRegionDeleted(area.id); }}
                    style={{
                      position: "absolute", top: "4px", right: "4px",
                      width: "22px", height: "22px",
                      background: "#EF4444", borderRadius: "4px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", border: "none",
                    }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px", color: "white" }} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Retângulo em progresso */}
          {inProgress && activeArea && (() => {
            const c = getColor(activeArea.color);
            return (
              <div style={{
                position: "absolute",
                left: toPercent(inProgress.x),
                top: toPercent(inProgress.y),
                width: toPercent(inProgress.width),
                height: toPercent(inProgress.height),
                border: `2px dashed ${c.border}`,
                backgroundColor: c.bg,
                borderRadius: "3px",
                pointerEvents: "none",
              }} />
            );
          })()}
        </div>
      )}
    </div>
  );
}