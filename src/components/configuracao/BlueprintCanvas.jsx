import React, { useRef, useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";

const REGION_STYLES = {
  blue:   { rect: "border-blue-500 bg-blue-400/15", tag: "bg-blue-500 text-white" },
  green:  { rect: "border-green-500 bg-green-400/15", tag: "bg-green-500 text-white" },
  violet: { rect: "border-violet-500 bg-violet-400/15", tag: "bg-violet-500 text-white" },
  slate:  { rect: "border-slate-400 bg-slate-300/20", tag: "bg-slate-500 text-white" },
};

const SHEET_W = 660;
const SHEET_H = 500;

export default function BlueprintCanvas({ zoom, activeRegion, regions, onRegionDrawn, onRegionDeleted }) {
  const containerRef = useRef(null);
  const sheetRef = useRef(null);
  const [drawing, setDrawing] = useState(null); // { startX, startY, currentX, currentY }
  const [hoveredId, setHoveredId] = useState(null);

  const scale = zoom / 100;
  const sheetW = SHEET_W * scale;
  const sheetH = SHEET_H * scale;

  function getRelativePos(e) {
    const rect = sheetRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x: Math.max(0, Math.min(x, SHEET_W)), y: Math.max(0, Math.min(y, SHEET_H)) };
  }

  function handleMouseDown(e) {
    if (!activeRegion) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    setDrawing({ startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
  }

  function handleMouseMove(e) {
    if (!drawing) return;
    const pos = getRelativePos(e);
    setDrawing(d => ({ ...d, currentX: pos.x, currentY: pos.y }));
  }

  function handleMouseUp() {
    if (!drawing || !activeRegion) return;
    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const w = Math.abs(drawing.currentX - drawing.startX);
    const h = Math.abs(drawing.currentY - drawing.startY);
    if (w > 10 && h > 10) {
      onRegionDrawn(activeRegion, { x, y, width: w, height: h });
    }
    setDrawing(null);
  }

  // Current in-progress rect
  const inProgressRect = drawing ? {
    x: Math.min(drawing.startX, drawing.currentX),
    y: Math.min(drawing.startY, drawing.currentY),
    width: Math.abs(drawing.currentX - drawing.startX),
    height: Math.abs(drawing.currentY - drawing.startY),
  } : null;

  const mappedRegions = regions.filter(r => r.rect);
  const activeRegionData = activeRegion ? regions.find(r => r.id === activeRegion) : null;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-[#F4F4F6] overflow-auto p-6">
      <div
        ref={sheetRef}
        className="relative bg-white shadow-md flex-shrink-0 select-none"
        style={{
          width: `${sheetW}px`,
          height: `${sheetH}px`,
          border: "1px solid #D1D5DB",
          cursor: activeRegion ? "crosshair" : "default",
          transition: "width 0.2s, height 0.2s",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG drawing */}
        <svg width="100%" height="100%" viewBox={`0 0 ${SHEET_W} ${SHEET_H}`} xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 pointer-events-none">
          <rect x="8" y="8" width="644" height="484" fill="none" stroke="#9CA3AF" strokeWidth="1.5" />
          <rect x="12" y="12" width="636" height="476" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
          <rect x="8" y="8" width="644" height="42" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1" />
          <text x="334" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1F2937" fontFamily="Inter,sans-serif">PROJETO ESTRUTURAL — CADERNO DE PILARES</text>
          <text x="334" y="38" textAnchor="middle" fontSize="7.5" fill="#6B7280" fontFamily="Inter,sans-serif">OBRA: Edifício Torres do Rio  |  PAVIMENTO: 3º AO 8º  |  FOLHA: 07/24  |  REV: C</text>
          <text x="20" y="67" fontSize="7.5" fontWeight="600" fill="#6B7280" fontFamily="Inter,sans-serif">VISTA FRONTAL — PAINÉIS P-07 A P-12</text>
          {[0,1,2,3,4,5].map(i => (
            <g key={i}>
              <rect x={22 + i*104} y={74} width={94} height={200} fill={["#EFF6FF","#F0FDF4","#FFF7ED","#FDF4FF","#FFFBEB","#F0F9FF"][i]} stroke="#9CA3AF" strokeWidth="0.8" />
              {[0,1,2,3,4].map(j => (
                <rect key={j} x={30 + i*104} y={82 + j*36} width={78} height={24} fill="none" stroke={["#60A5FA","#34D399","#FB923C","#A78BFA","#FBBF24","#38BDF8"][i]} strokeWidth="1" />
              ))}
              <text x={69 + i*104} y={284} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="Inter,sans-serif">{`P-0${7+i}`}</text>
            </g>
          ))}
          <text x="20" y="305" fontSize="7.5" fontWeight="600" fill="#6B7280" fontFamily="Inter,sans-serif">DETALHE SEÇÃO TRANSVERSAL</text>
          {[0,1,2].map(i => (
            <g key={i}>
              <rect x={22 + i*110} y={312} width={94} height={65} fill="#FAFAFA" stroke="#9CA3AF" strokeWidth="0.8" />
              <line x1={22+i*110} y1={344} x2={116+i*110} y2={344} stroke="#D1D5DB" strokeWidth="0.5" />
              <line x1={69+i*110} y1={312} x2={69+i*110} y2={377} stroke="#D1D5DB" strokeWidth="0.5" />
              {[0,1,2,3].map(j => (
                <circle key={j} cx={35+j*25+i*110} cy={328} r="4" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1" />
              ))}
              <text x={69+i*110} y={390} textAnchor="middle" fontSize="6.5" fill="#6B7280" fontFamily="Inter,sans-serif">{`Seção S-0${i+1} | e=20cm`}</text>
            </g>
          ))}
          <rect x="8" y="430" width="644" height="62" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1" />
          <line x1="210" y1="430" x2="210" y2="492" stroke="#D1D5DB" strokeWidth="0.8" />
          <line x1="420" y1="430" x2="420" y2="492" stroke="#D1D5DB" strokeWidth="0.8" />
          <text x="109" y="446" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1F2937" fontFamily="Inter,sans-serif">ESTRUTURAS APEX ENG. LTDA.</text>
          <text x="109" y="460" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Resp.: Eng. A. Silva  |  CREA: 12345</text>
          <text x="315" y="446" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1F2937" fontFamily="Inter,sans-serif">OBRA: Edifício Torres do Rio</text>
          <text x="315" y="460" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">São Paulo - SP  |  Contr.: 2024/0087</text>
          <text x="540" y="446" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1F2937" fontFamily="Inter,sans-serif">Rev. C  |  Folha 07/24</text>
          <text x="540" y="460" textAnchor="middle" fontSize="7" fill="#4B5563" fontFamily="Inter,sans-serif">Arquivo: EST-PILARES-R3</text>
        </svg>

        {/* Drawn regions */}
        {mappedRegions.map(region => {
          const s = REGION_STYLES[region.color];
          const r = region.rect;
          const isHovered = hoveredId === region.id;
          return (
            <div
              key={region.id}
              className={`absolute border-2 border-dashed rounded-sm ${s.rect} group`}
              style={{
                left: `${(r.x / SHEET_W) * 100}%`,
                top: `${(r.y / SHEET_H) * 100}%`,
                width: `${(r.width / SHEET_W) * 100}%`,
                height: `${(r.height / SHEET_H) * 100}%`,
                pointerEvents: activeRegion ? "none" : "auto",
              }}
              onMouseEnter={() => setHoveredId(region.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className={`absolute top-1.5 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.tag}`}>
                Região {region.id}: {region.label}
              </span>
              {isHovered && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRegionDeleted(region.id); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center shadow-md transition-colors"
                  title="Apagar demarcação"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* In-progress drawing rect */}
        {inProgressRect && activeRegionData && (
          <div
            className={`absolute border-2 border-dashed pointer-events-none ${REGION_STYLES[activeRegionData.color].rect}`}
            style={{
              left: `${(inProgressRect.x / SHEET_W) * 100}%`,
              top: `${(inProgressRect.y / SHEET_H) * 100}%`,
              width: `${(inProgressRect.width / SHEET_W) * 100}%`,
              height: `${(inProgressRect.height / SHEET_H) * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}