import React from "react";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import Viewer3DPlaceholder from "@/components/dashboard/Viewer3DPlaceholder";
import MetricCards from "@/components/dashboard/MetricCards";
import StatusPanel from "@/components/dashboard/StatusPanel";
import RegrasPorProduto from "@/components/dashboard/RegrasPorProduto";

export default function Home() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <WelcomeHeader />

      {/* Main content: 3D Viewer + Metrics */}
      <div className="flex flex-col xl:flex-row gap-5">
        <Viewer3DPlaceholder />
        <MetricCards />
      </div>

      {/* Bottom panel */}
      <StatusPanel />

      {/* Regras por produto */}
      <RegrasPorProduto />
    </div>
  );
}