import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F7F7FA] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-5 pt-16 lg:pt-5">
        <Outlet />
      </main>
    </div>
  );
}