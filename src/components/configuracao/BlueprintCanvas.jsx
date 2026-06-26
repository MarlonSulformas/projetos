import React, { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const SHEET_W = 880;
const SHEET_H = 580;

const COLOR_MAP = {
  blue:   { border: "#3B82F6", bg: "rgba(59,130,246,0.12)",   tag: "#1D4ED8", tagBg: "rgba(219,234,254,0.95)" },
  green:  { border: "#22C55E", bg: "rgba(34,197,94,0.12)",    tag: "#15803D", tagBg: "rgba(220,252,231,0.95)" },
  orange: { border: "#F97316", bg: "rgba(249,115,22,0.12)",   tag: "#C2410C", tagBg: "rgba(255,237,213,0.95)" },
  violet: { border: "#A855F7", bg: "rgba(168,85,247,0.12)",   tag: "#7E22CE", tagBg: "rgba(243,232,255,0.95)" },
};

function getColor(id) { return COLOR_MAP[id] || COLOR_MAP.blue; }

export default function BlueprintCanvas({ zoom, activeAreaId, areas, onRegionDrawn, onRegionDeleted }) {
  const sheetRef = useRef(null);
  const [drawing, setDrawing] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const scale = zoom / 100;

  function getPos(e) {
    const rect = sheetRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min((e.clientX - rect.left) / scale, SHEET_W)),
      y: Math.max(0, Math.min((e.clientY - rect.top) / scale, SHEET_H)),
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
    x: Math.min(drawing.sx, drawing.cx), y: Math.min(drawing.sy, drawing.cy),
    width: Math.abs(drawing.cx - drawing.sx), height: Math.abs(drawing.cy - drawing.sy),
  } : null;

  const activeArea = activeAreaId ? areas.find(a => a.id === activeAreaId) : null;

  return (
    <div className="w-full h-full flex items-start justify-center bg-[#F0F2F5] overflow-auto p-5">
      <div
        ref={sheetRef}
        className="relative bg-white shadow-lg flex-shrink-0"
        style={{
          width: `${SHEET_W * scale}px`,
          height: `${SHEET_H * scale}px`,
          border: "1px solid #C9CDD4",
          cursor: activeAreaId ? "crosshair" : "default",
          transition: "width 0.2s, height 0.2s",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Blueprint SVG */}
        <svg
          width="100%" height="100%"
          viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 pointer-events-none"
        >
          {/* Frame */}
          <rect x="10" y="10" width={SHEET_W-20} height={SHEET_H-20} fill="none" stroke="#9CA3AF" strokeWidth="1.5"/>
          <rect x="14" y="14" width={SHEET_W-28} height={SHEET_H-28} fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>

          {/* Header */}
          <rect x="10" y="10" width={SHEET_W-20} height="46" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1"/>
          <text x={SHEET_W/2} y="27" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1F2937" fontFamily="Inter,sans-serif">PROJETO ESTRUTURAL — CADERNO DE PILARES</text>
          <text x={SHEET_W/2} y="43" textAnchor="middle" fontSize="8" fill="#6B7280" fontFamily="Inter,sans-serif">OBRA: Edifício Torres do Rio  |  PAVIMENTO: 3º AO 8º  |  FOLHA: 07/24  |  REV: C</text>

          {/* Vista Frontal label */}
          <text x="22" y="74" fontSize="8" fontWeight="600" fill="#6B7280" fontFamily="Inter,sans-serif">VISTA FRONTAL — PAINÉIS P-07 A P-12</text>

          {/* 7 panels */}
          {[0,1,2,3,4,5,6].map(i => {
            const colors = ["#EFF6FF","#F0FDF4","#FFF7ED","#FDF4FF","#FFFBEB","#F0F9FF","#FFF1F2"];
            const strokes = ["#60A5FA","#34D399","#FB923C","#A78BFA","#FBBF24","#38BDF8","#F472B6"];
            const px = 22 + i * 120;
            return (
              <g key={i}>
                <rect x={px} y={80} width={110} height={210} fill={colors[i]} stroke="#9CA3AF" strokeWidth="0.8"/>
                {[0,1,2,3,4].map(j => (
                  <rect key={j} x={px+8} y={88+j*38} width={94} height={28} fill="none" stroke={strokes[i]} strokeWidth="1.2"/>
                ))}
                <text x={px+55} y={300} textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="Inter,sans-serif">{`P-0${7+i}`}</text>
              </g>
            );
          })}

          {/* Section detail label */}
          <text x="22" y="330" fontSize="8" fontWeight="600" fill="#6B7280" fontFamily="Inter,sans-serif">DETALHE SEÇÃO TRANSVERSAL</text>

          {/* 4 sections */}
          {[0,1,2,3].map(i => {
            const px = 22 + i*130;
            return (
              <g key={i}>
                <rect x={px} y={338} width={114} height={76} fill="#FAFAFA" stroke="#9CA3AF" strokeWidth="0.8"/>
                <line x1={px} y1={376} x2={px+114} y2={376} stroke="#D1D5DB" strokeWidth="0.5"/>
                <line x1={px+57} y1={338} x2={px+57} y2={414} stroke="#D1D5DB" strokeWidth="0.5"/>
                {[0,1,2,3,4].map(j => (
                  <circle key={j} cx={px+15+j*22} cy={356} r="5" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1.2"/>
                ))}
                <text x={px+57} y={428} textAnchor="middle" fontSize="7" fill="#6B7280" fontFamily="Inter,sans-serif">{`Seção S-0${i+1} | e=20cm`}</text>
              </g>
            );
          })}

          {/* Title block */}
          <rect x="10" y={SHEET_H-82} width={SHEET_W-20} height="72" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1={10+(SHEET_W-20)/3} y1={SHEET_H-82} x2={10+(SHEET_W-20)/3} y2={SHEET_H-10} stroke="#D1D5DB" strokeWidth="0.8"/>
          <line x1={10+(SHEET_W-20)*2/3} y1={SHEET_H-82} x2={10+(SHEET_W-20)*2/3} y2={SHEET_H-10} stroke="#D1D5DB" strokeWidth="0.8"/>

          <text x={10+(SHEET_W-20)/6} y={SHEET_H-63} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#1F2937" fontFamily="Inter,sans-serif">ESTRUTURAS APEX ENG. LTDA.</text>
          <text x={10+(SHEET_W-20)/6} y={SHEET_H-49} textAnchor="middle" fontSize="7.5" fill="#4B5563" fontFamily="Inter,sans-serif">Resp.: Eng. A. Silva | CREA: 12345</text>
          <text x={10+(SHEET_W-20)/6} y={SHEET_H-35} textAnchor="middle" fontSize="7.5" fill="#4B5563" fontFamily="Inter,sans-serif">Data: Mar/2024</text>

          <text x={10+(SHEET_W-20)/2} y={SHEET_H-63} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#1F2937" fontFamily="Inter,sans-serif">OBRA: Edifício Torres do Rio</text>
          <text x={10+(SHEET_W-20)/2} y={SHEET_H-49} textAnchor="middle" fontSize="7.5" fill="#4B5563" fontFamily="Inter,sans-serif">São Paulo - SP | Contr.: 2024/0087</text>
          <text x={10+(SHEET_W-20)/2} y={SHEET_H-35} textAnchor="middle" fontSize="7.5" fill="#4B5563" fontFamily="Inter,sans-serif">Pav: 3º ao 8º | Pilares: P-07/P-13</text>

          <text x={10+(SHEET_W-20)*5/6} y={SHEET_H-63} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#1F2937" fontFamily="Inter,sans-serif">Rev. C | Folha 07/24</text>
          <text x={10+(SHEET_W-20)*5/6} y={SHEET_H-49} textAnchor="middle" fontSize="7.5" fill="#4B5563" fontFamily="Inter,sans-serif">Aprovado: Dir. Técnica</text>
          <text x={10+(SHEET_W-20)*5/6} y={SHEET_H-35} textAnchor="middle" fontSize="7.5" fill="#4B5563" fontFamily="Inter,sans-serif">Arquivo: EST-PILARES-R3</text>
        </svg>

        {/* Drawn regions as absolutely positioned divs */}
        {areas.filter(a => a.rect).map(area => {
          const c = getColor(area.color);
          const r = area.rect;
          const isHovered = hoveredId === area.id;
          const left = `${(r.x / SHEET_W) * 100}%`;
          const top = `${(r.y / SHEET_H) * 100}%`;
          const width = `${(r.width / SHEET_W) * 100}%`;
          const height = `${(r.height / SHEET_H) * 100}%`;

          return (
            <div
              key={area.id}
              style={{
                position: "absolute", left, top, width, height,
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

        {/* In-progress rect */}
        {inProgress && activeArea && (() => {
          const c = getColor(activeArea.color);
          return (
            <div
              style={{
                position: "absolute",
                left: `${(inProgress.x / SHEET_W) * 100}%`,
                top: `${(inProgress.y / SHEET_H) * 100}%`,
                width: `${(inProgress.width / SHEET_W) * 100}%`,
                height: `${(inProgress.height / SHEET_H) * 100}%`,
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
  );
}