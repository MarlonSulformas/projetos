import React, { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const COLOR_MAP = {
  blue:   { border: "#3B82F6", bg: "rgba(59,130,246,0.15)",   tag: "#1D4ED8", tagBg: "rgba(219,234,254,0.95)" },
  green:  { border: "#22C55E", bg: "rgba(34,197,94,0.15)",    tag: "#15803D", tagBg: "rgba(220,252,231,0.95)" },
  orange: { border: "#F97316", bg: "rgba(249,115,22,0.15)",   tag: "#C2410C", tagBg: "rgba(255,237,213,0.95)" },
  violet: { border: "#A855F7", bg: "rgba(168,85,247,0.15)",   tag: "#7E22CE", tagBg: "rgba(243,232,255,0.95)" },
};

function getColor(id) { return COLOR_MAP[id] || COLOR_MAP.blue; }

// PDF_W e PDF_H representam o tamanho natural do documento em pixels na tela (sem zoom).
// O iframe é renderizado nesse tamanho fixo; o zoom escala esse bloco inteiro.
// O container pai tem overflow:auto → scrollbars aparecem quando o bloco escalado transbordar.
const PDF_W = 800;  // largura base do iframe em px
const PDF_H = 1130; // altura base do iframe em px (A4 landscape ~1:1.41)

export default function BlueprintCanvas({ zoomScale = 1, activeAreaId, areas, pdfUrl, onRegionDrawn, onRegionDeleted }) {
  const overlayRef = useRef(null);
  const [drawing, setDrawing] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // Dimensões escaladas reais (ocupam espaço físico no layout para ativar scrollbars)
  const scaledW = PDF_W * zoomScale;
  const scaledH = PDF_H * zoomScale;

  function getPos(e) {
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoomScale,
      y: (e.clientY - rect.top) / zoomScale,
    };
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
    if (w > 12 && h > 12) onRegionDrawn(activeAreaId, { x, y, width: w, height: h });
    setDrawing(null);
  }

  const inProgress = drawing ? {
    x: Math.min(drawing.sx, drawing.cx),
    y: Math.min(drawing.sy, drawing.cy),
    width: Math.abs(drawing.cx - drawing.sx),
    height: Math.abs(drawing.cy - drawing.sy),
  } : null;

  const activeArea = activeAreaId ? areas.find(a => a.id === activeAreaId) : null;

  return (
    /*
     * PAI — janela estática com overflow:auto.
     * Sem flex-center para não travar o scroll quando o conteúdo transbordar.
     */
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#222",
        borderRadius: "8px",
        overflow: "auto",
      }}
    >
      {/*
       * Wrapper de centralização horizontal — apenas empurra o bloco para o centro
       * quando ele for menor que o container; não interfere no scroll vertical.
       */}
      <div style={{ display: "flex", justifyContent: "center", padding: "16px 0", minHeight: "100%" }}>
        {/*
         * BLOCO DO PDF — tem dimensões físicas reais (scaledW × scaledH).
         * Não usa transform:scale (que não expande o layout).
         * O iframe é renderizado em PDF_W × PDF_H e o bloco pai é escalado
         * via width/height físicos; o iframe é escalado via transform para caber.
         */}
        <div
          style={{
            position: "relative",
            width: `${scaledW}px`,
            height: `${scaledH}px`,
            flexShrink: 0,
          }}
        >
          {/* iframe escalado para preencher o bloco físico */}
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${PDF_W}px`,
              height: `${PDF_H}px`,
              border: "none",
              transformOrigin: "top left",
              transform: `scale(${zoomScale})`,
              pointerEvents: activeAreaId ? "none" : "auto",
            }}
            title="PDF Viewer"
          />

          {/* Overlay de desenho — mesmo tamanho físico do bloco */}
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
            {/* Regiões existentes (coords em espaço não-escalado) */}
            {areas.filter(a => a.rect).map(area => {
              const c = getColor(area.color);
              const r = area.rect;
              const isHovered = hoveredId === area.id;
              return (
                <div
                  key={area.id}
                  style={{
                    position: "absolute",
                    left: `${r.x * zoomScale}px`,
                    top: `${r.y * zoomScale}px`,
                    width: `${r.width * zoomScale}px`,
                    height: `${r.height * zoomScale}px`,
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
                    left: `${inProgress.x * zoomScale}px`,
                    top: `${inProgress.y * zoomScale}px`,
                    width: `${inProgress.width * zoomScale}px`,
                    height: `${inProgress.height * zoomScale}px`,
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
      </div>
    </div>
  );
}