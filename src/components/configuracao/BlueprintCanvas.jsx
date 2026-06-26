import React, { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Trash2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const COLOR_MAP = {
  blue:   { border: "#3B82F6", bg: "rgba(59,130,246,0.15)",  tag: "#1D4ED8", tagBg: "rgba(219,234,254,0.95)" },
  green:  { border: "#22C55E", bg: "rgba(34,197,94,0.15)",   tag: "#15803D", tagBg: "rgba(220,252,231,0.95)" },
  orange: { border: "#F97316", bg: "rgba(249,115,22,0.15)",  tag: "#C2410C", tagBg: "rgba(255,237,213,0.95)" },
  violet: { border: "#A855F7", bg: "rgba(168,85,247,0.15)",  tag: "#7E22CE", tagBg: "rgba(243,232,255,0.95)" },
};
function getColor(id) { return COLOR_MAP[id] || COLOR_MAP.blue; }

const HANDLE_SIZE = 8; // px

// Which corner is being resized
const CORNERS = ["nw", "ne", "sw", "se"];

function getHandleStyle(corner, borderColor) {
  const base = {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: "#fff",
    border: `2px solid ${borderColor}`,
    borderRadius: 2,
    zIndex: 10,
    cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize",
  };
  const half = HANDLE_SIZE / 2;
  if (corner === "nw") return { ...base, top: -half, left: -half };
  if (corner === "ne") return { ...base, top: -half, right: -half };
  if (corner === "sw") return { ...base, bottom: -half, left: -half };
  if (corner === "se") return { ...base, bottom: -half, right: -half };
  return base;
}

export default function BlueprintCanvas({
  drawingColor,
  isDrawingMode,
  areas,
  pdfUrl,
  onRegionDrawn,   // (rect: {x,y,width,height} normalized) => void  — called when draw ends
  onRegionResized, // (areaId, rect) => void
  onRegionDeleted, // (areaId) => void
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfUrlRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [renderTick, setRenderTick] = useState(0);

  // Drawing state
  const [drawing, setDrawing] = useState(null);

  // Resizing state
  const [resizing, setResizing] = useState(null);

  const [hoveredId, setHoveredId] = useState(null);

  // Keep pdfUrl in a ref so ResizeObserver can access latest value
  useEffect(() => { pdfUrlRef.current = pdfUrl; }, [pdfUrl]);

  // ── PDF rendering ──────────────────────────────────────────────
  useEffect(() => {
    if (!pdfUrl || !containerRef.current) return;
    let cancelled = false;

    async function render() {
      const container = containerRef.current;
      if (!container) return;

      // Wait for container to have real dimensions (up to 20 attempts)
      let containerW = container.clientWidth;
      let containerH = container.clientHeight;
      let attempts = 0;
      while ((!containerW || !containerH) && attempts < 20) {
        await new Promise(r => setTimeout(r, 50));
        containerW = container.clientWidth;
        containerH = container.clientHeight;
        attempts++;
      }
      if (!containerW || !containerH) return;

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      if (cancelled) return;
      const page = await pdf.getPage(1);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 1 });
      const scaleX = containerW / viewport.width;
      const scaleY = containerH / viewport.height;
      const scale = Math.min(scaleX, scaleY);

      const dpr = window.devicePixelRatio || 1;
      const renderScale = scale * dpr;
      const scaledViewport = page.getViewport({ scale: renderScale });
      const canvasW = Math.floor(scale * viewport.width);
      const canvasH = Math.floor(scale * viewport.height);

      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;
      setCanvasSize({ w: canvasW, h: canvasH });

      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    }

    render();
    return () => { cancelled = true; };
  }, [pdfUrl, renderTick]);

  // Re-render when container resizes and we have a PDF loaded
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0 && pdfUrlRef.current) {
        setRenderTick(t => t + 1);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Coordinate helpers ─────────────────────────────────────────
  function getNorm(e) {
    const overlay = e.currentTarget;
    const rect = overlay.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  // ── Drawing handlers ───────────────────────────────────────────
  function onOverlayMouseDown(e) {
    if (!isDrawingMode) return;
    e.preventDefault();
    const p = getNorm(e);
    setDrawing({ sx: p.x, sy: p.y, cx: p.x, cy: p.y });
  }

  function onOverlayMouseMove(e) {
    if (drawing) {
      const p = getNorm(e);
      setDrawing(d => ({ ...d, cx: p.x, cy: p.y }));
      return;
    }
    if (resizing) {
      handleResizeMove(e);
    }
  }

  function onOverlayMouseUp(e) {
    if (drawing) {
      const x = Math.min(drawing.sx, drawing.cx);
      const y = Math.min(drawing.sy, drawing.cy);
      const w = Math.abs(drawing.cx - drawing.sx);
      const h = Math.abs(drawing.cy - drawing.sy);
      setDrawing(null);
      if (w > 0.01 && h > 0.01) {
        onRegionDrawn({ x, y, width: w, height: h });
      }
      return;
    }
    if (resizing) {
      setResizing(null);
    }
  }

  // ── Resize handlers ────────────────────────────────────────────
  function startResize(e, area, corner) {
    e.stopPropagation();
    e.preventDefault();
    const overlay = e.currentTarget.closest("[data-overlay]");
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    setResizing({
      areaId: area.id,
      corner,
      origRect: { ...area.rect },
      startX: (e.clientX - rect.left) / rect.width,
      startY: (e.clientY - rect.top) / rect.height,
      overlayRect: rect,
    });
  }

  function handleResizeMove(e) {
    if (!resizing) return;
    const { overlayRect } = resizing;
    const cx = (e.clientX - overlayRect.left) / overlayRect.width;
    const cy = (e.clientY - overlayRect.top) / overlayRect.height;
    const dx = cx - resizing.startX;
    const dy = cy - resizing.startY;
    let { x, y, width, height } = resizing.origRect;

    if (resizing.corner === "nw") { x += dx; y += dy; width -= dx; height -= dy; }
    if (resizing.corner === "ne") { y += dy; width += dx; height -= dy; }
    if (resizing.corner === "sw") { x += dx; width -= dx; height += dy; }
    if (resizing.corner === "se") { width += dx; height += dy; }

    // Clamp
    x = Math.max(0, Math.min(x, 0.99));
    y = Math.max(0, Math.min(y, 0.99));
    width = Math.max(0.01, Math.min(width, 1 - x));
    height = Math.max(0.01, Math.min(height, 1 - y));

    onRegionResized(resizing.areaId, { x, y, width, height });
  }

  const toP = v => `${(v * 100).toFixed(4)}%`;

  const inProgress = drawing ? {
    x: Math.min(drawing.sx, drawing.cx),
    y: Math.min(drawing.sy, drawing.cy),
    width: Math.abs(drawing.cx - drawing.sx),
    height: Math.abs(drawing.cy - drawing.sy),
  } : null;

  const drawColor = getColor(drawingColor);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      {/* PDF canvas */}
      <canvas ref={canvasRef} style={{ display: "block", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", background: "#fff" }} />

      {/* Overlay */}
      {canvasSize.w > 0 && (
        <div
          data-overlay="true"
          style={{
            position: "absolute",
            width: canvasSize.w,
            height: canvasSize.h,
            cursor: isDrawingMode ? "crosshair" : "default",
          }}
          onMouseDown={onOverlayMouseDown}
          onMouseMove={onOverlayMouseMove}
          onMouseUp={onOverlayMouseUp}
          onMouseLeave={onOverlayMouseUp}
        >
          {/* Saved areas */}
          {areas.filter(a => a.rect).map(area => {
            const c = getColor(area.color);
            const r = area.rect;
            const isHovered = hoveredId === area.id;
            return (
              <div
                key={area.id}
                style={{
                  position: "absolute",
                  left: toP(r.x), top: toP(r.y),
                  width: toP(r.width), height: toP(r.height),
                  border: `2px dashed ${c.border}`,
                  backgroundColor: c.bg,
                  borderRadius: 3,
                  boxSizing: "border-box",
                  pointerEvents: isDrawingMode ? "none" : "auto",
                }}
                onMouseEnter={() => setHoveredId(area.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Badge */}
                <span style={{
                  position: "absolute", top: 4, left: 6,
                  fontSize: 10, fontWeight: 600,
                  color: c.tag, backgroundColor: c.tagBg,
                  padding: "2px 6px", borderRadius: 4,
                  whiteSpace: "nowrap", pointerEvents: "none",
                  maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {area.tagLabel ? `[${area.tagLabel}] ` : ""}{area.name}
                </span>

                {/* Delete button */}
                {isHovered && !isDrawingMode && (
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); onRegionDeleted(area.id); }}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      width: 22, height: 22,
                      background: "#EF4444", borderRadius: 4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", border: "none", zIndex: 20,
                    }}
                  >
                    <Trash2 style={{ width: 12, height: 12, color: "white" }} />
                  </button>
                )}

                {/* Resize handles */}
                {isHovered && !isDrawingMode && CORNERS.map(corner => (
                  <div
                    key={corner}
                    style={getHandleStyle(corner, c.border)}
                    onMouseDown={e => startResize(e, area, corner)}
                  />
                ))}
              </div>
            );
          })}

          {/* Drawing in progress */}
          {inProgress && inProgress.width > 0.005 && inProgress.height > 0.005 && (
            <div style={{
              position: "absolute",
              left: toP(inProgress.x), top: toP(inProgress.y),
              width: toP(inProgress.width), height: toP(inProgress.height),
              border: `2px dashed ${drawColor.border}`,
              backgroundColor: drawColor.bg,
              borderRadius: 3,
              pointerEvents: "none",
            }} />
          )}
        </div>
      )}
    </div>
  );
}