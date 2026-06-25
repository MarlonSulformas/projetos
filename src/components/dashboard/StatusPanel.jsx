import React from "react";
import { motion } from "framer-motion";
import { Activity, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const chartData = [28, 42, 35, 50, 47, 62, 58, 71, 65, 78, 72, 85];
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const logs = [
  { time: "14:32", text: "Planta Baixa PB-042 processada com sucesso", icon: CheckCircle, color: "text-green-500" },
  { time: "13:15", text: "Novo projetista 'Eng. Silva & Associados' cadastrado", icon: FileText, color: "text-blue-500" },
  { time: "11:48", text: "Alerta de compatibilização — Bloco C, Pav. 3", icon: AlertTriangle, color: "text-amber-500" },
  { time: "09:20", text: "Obra 'Residencial Aurora' iniciou fase de montagem", icon: CheckCircle, color: "text-green-500" },
  { time: "08:05", text: "12 componentes pré-moldados validados automaticamente", icon: CheckCircle, color: "text-green-500" },
];

function MiniChart() {
  const max = Math.max(...chartData);
  const min = Math.min(...chartData);
  const w = 100;
  const h = 40;
  const padding = 2;

  const points = chartData.map((val, i) => {
    const x = padding + (i / (chartData.length - 1)) * (w - padding * 2);
    const y = h - padding - ((val - min) / (max - min)) * (h - padding * 2);
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${w - padding},${h}`, `${padding},${h}`].join(" ");
  const linePoints = points.join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={linePoints} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {chartData.map((val, i) => {
        const x = padding + (i / (chartData.length - 1)) * (w - padding * 2);
        const y = h - padding - ((val - min) / (max - min)) * (h - padding * 2);
        return <circle key={i} cx={x} cy={y} r="1.2" fill="#3B82F6" />;
      })}
    </svg>
  );
}

export default function StatusPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-sm border border-[#E5E5E8] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E5E5E8]">
        <Activity className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
        <span className="text-xs font-medium text-[#4A4A52] uppercase tracking-wider">
          Mapeamento de Status
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E5E8]">
        {/* Chart section */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[#1F1F24]">Componentes Processados</p>
              <p className="text-xs text-[#6B6B72] mt-0.5">Últimos 12 meses</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-medium text-[#0F0F0F] leading-none">693</p>
              <p className="text-xs text-green-500 font-medium mt-1">+18.2%</p>
            </div>
          </div>
          <div className="h-28 w-full">
            <MiniChart />
          </div>
          <div className="flex justify-between mt-2 px-0.5">
            {months.map((m) => (
              <span key={m} className="text-[10px] text-[#6B6B72]">{m}</span>
            ))}
          </div>
        </div>

        {/* Logs section */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#1F1F24]">Atividades Recentes</p>
            <button className="text-xs text-blue-500 font-medium hover:text-blue-600 transition-colors">
              Ver tudo
            </button>
          </div>
          <div className="space-y-3">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 group">
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3 text-[#6B6B72]" strokeWidth={1.8} />
                  <span className="text-[11px] text-[#6B6B72] font-mono w-10">{log.time}</span>
                </div>
                <log.icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${log.color}`} strokeWidth={2} />
                <p className="text-[13px] text-[#4A4A52] leading-snug group-hover:text-[#1F1F24] transition-colors">
                  {log.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}