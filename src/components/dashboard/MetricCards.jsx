import React from "react";
import { motion } from "framer-motion";
import { Building2, Users, Boxes, TrendingUp, TrendingDown, Minus } from "lucide-react";

const metrics = [
  {
    label: "Obras Ativas",
    value: "4",
    trend: "+2 este mês",
    trendDir: "up",
    icon: Building2,
    accentColor: "#3B82F6",
    accentBg: "#EFF6FF",
  },
  {
    label: "Projetistas Homologados",
    value: "7",
    trend: "Estável",
    trendDir: "neutral",
    icon: Users,
    accentColor: "#22C55E",
    accentBg: "#F0FDF4",
  },
  {
    label: "Componentes Pré-Moldados",
    value: "128",
    trend: "+34 identificados",
    trendDir: "up",
    icon: Boxes,
    accentColor: "#F59E0B",
    accentBg: "#FFFBEB",
  },
];

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: "text-green-500",
  down: "text-red-500",
  neutral: "text-[#6B6B72]",
};

export default function MetricCards() {
  return (
    <div className="flex flex-row xl:flex-col gap-4 xl:w-[260px] flex-shrink-0">
      {metrics.map((metric, idx) => {
        const TrendIcon = trendIcons[metric.trendDir];
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + idx * 0.1, ease: "easeOut" }}
            className="flex-1 xl:flex-none bg-white rounded-2xl shadow-sm border border-[#E5E5E8] p-5 hover:border-[#D4D4D8] transition-all duration-150 cursor-default group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: metric.accentBg }}
              >
                <metric.icon className="w-5 h-5" style={{ color: metric.accentColor }} strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-[11px] font-medium text-[#6B6B72] uppercase tracking-wider mb-1">
              {metric.label}
            </p>
            <p className="text-[36px] xl:text-[48px] font-medium text-[#0F0F0F] leading-none tracking-tight">
              {metric.value}
            </p>
            <div className={`flex items-center gap-1 mt-3 ${trendColors[metric.trendDir]}`}>
              <TrendIcon className="w-3 h-3" strokeWidth={2} />
              <span className="text-xs font-medium">{metric.trend}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}