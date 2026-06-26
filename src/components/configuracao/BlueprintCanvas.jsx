import React, { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const COLOR_MAP = {
  blue:   { border: "#3B82F6", bg: "rgba(59,130,246,0.15)",   tag: "#1D4ED8", tagBg: "rgba(219,234,254,0.95)" },
  green:  { border: "#22C55E", bg: "rgba(34,197,94,0.15)",    tag: "#15803D", tagBg: "rgba(220,252,231,0.95)" },
  orange: { border: "#F97316", bg: "rgba(249,115,22,0.15)",   tag: "#C2410C", tagBg: "rgba(255,237,213,0.95)" },
  violet: { border: "#A855F7", bg: "rgba(168,85,247,0.15)",   tag: "#7E22CE", tagBg: "rgba(243,232,255,0.95)" },
};

function getColor(id) { return COLOR_MAP[id] || COLOR_MAP.blue; }

// Proporção A4 retrato: 1 : √2 ≈ 1 : 1.4142
const A4_RATIO = 1.4142;

export default function BlueprintCanvas({ activeAreaId, areas, pdfUrl, onRegionDrawn, onRegionDeleted }) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const [pdfSize, setPdfSize] = useState({ w: 0, h: 0 });
  const [drawing, setDrawing] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // Calcula o tamanho do PDF para preencher o container em proporção A4
  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const pad = 32; // padding interno total
      const maxW = width - pad;
      const maxH = height - pad;
      // Encaixa o A4 dentro do container mantendo proporção
      let w = maxW;
      let h = w * A4_RATIO;
      if (h > maxH) {
        h = maxH;
        w = h / A4_RATIO;
      }
      setPdfSize({ w: Math.floor(w), h: Math.floor(h) });
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  function getPos(e) {
    const rect = overlayRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e) {
    if (!activeAreaId) return;
    e.preventDefault();
    const p = getPos(e);
    setDrawing({ sx: p.x, sy: p.y, cx: p.x, cy: p.y });
  }
  function onMouseMove(e) {
    if (!drawing) return;
    const p = getPos(e);
    setDrawing(d => ({ ...d, cx: p.x, cy: p.y }));
  }
  function onMouseUp() {
    if (!drawing || !activeAreaId) return;
    const x = Math.min(drawing.sx, drawing.cx);
    const y = Math.min(drawing.sy, drawing.cy);
    const w = Math.abs(drawing.cx - drawing.sx);
    const h = Math.abs(drawing.cy - drawing.sy);
    if (w > 8 && h > 8) onRegionDrawn(activeAreaId, { x, y, width: w, height: h });
    setDrawing(null);
  }

  const inProgress = drawing ? {
    x: Math.min(drawing.sx, drawing.cx),
    y: Math.min(drawing.sy, drawing.cy),
    width: Math.abs(drawing.cx - drawing.sx),
    height: Math.abs(drawing.cy - drawing.sy),
  } : null;

  const activeArea = activeAreaId ? areas.find(a => a.id === activeAreaId) : null;

  // Escala para converter coordenadas salvas (em espaço do PDF) para pixels na tela
  // As coordenadas são salvas em px relativos ao tamanho do iframe no momento do desenho
  // Como o tamanho do pdf é sempre o mesmo (pdfSize), as coords batem direto.

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#1e1e1e",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {pdfSize.w > 0 && (
        <div
          style={{
            position: "relative",
            width: `${pdfSize.w}px`,
            height: `${pdfSize.h}px`,
            flexShrink: 0,
            boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* iframe ocupa 100% do bloco A4 */}
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
              pointerEvents: activeAreaId ? "none" : "auto",
            }}
            title="PDF Viewer"
          />

          {/* Overlay de desenho */}
          <div
            ref={overlayRef}
            style={{
              position: "absolute",
              inset: 0,
              cursor: activeAreaId ? "crosshair" : "default",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Regiões existentes */}
            {areas.filter(a => a.rect).map(area => {
              const c = getColor(area.color);
              const r = area.rect;
              const isHovered = hoveredId === area.id;
              // Normaliza coords caso tenham sido salvas com tamanho diferente
              return (
                <div
                  key={area.id}
                  style={{
                    position: "absolute",
                    left: `${r.x}px`,
                    top: `${r.y}px`,
                    width: `${r.width}px`,
                    height: `${r.height}px`,
                    border: `2px dashed ${c.border}`,
                    backgroundColor: c.bg,
                    borderRadius: "3px",
                    pointerEvents: activeAreaId ? "none" : "auto",
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
                <div
                  style={{
                    position: "absolute",
                    left: `${inProgress.x}px`,
                    top: `${inProgress.y}px`,
                    width: `${inProgress.width}px`,
                    height: `${inProgress.height}px`,
                    border: `2px dashed ${c.border}`,
                    backgroundColor: c.bg,
                    borderRadius: "3px",
                    pointerEvents: "none",
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}