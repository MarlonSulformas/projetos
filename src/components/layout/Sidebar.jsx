import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Settings, Building2, Menu, X, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Painel Principal", path: "/" },
  { icon: Users, label: "Projetistas e Produtos", path: "/projetistas" },
  { icon: Settings, label: "Configuração / Treinamento", path: "/configuracao" },
  { icon: Building2, label: "Gestão de Obras", path: "/obras" },
];

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 pt-6 pb-8 ${!expanded && !isMobile ? "justify-center px-3" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
          <Box className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <AnimatePresence>
          {(expanded || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-sm font-semibold text-[#0F0F0F] tracking-tight leading-none block">
                Engenharia
              </span>
              <span className="text-[11px] font-medium text-[#6B6B72] tracking-wide uppercase leading-none mt-0.5 block">
                Estrutural
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 relative
                ${isActive
                  ? "bg-[#EFECFA] text-[#0F0F0F]"
                  : "text-[#6B6B72] hover:bg-[#F1F1F4] hover:text-[#1F1F24]"
                }
                ${!expanded && !isMobile ? "justify-center px-2.5" : ""}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-blue-500" : ""}`} strokeWidth={1.8} />
              <AnimatePresence>
                {(expanded || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <div className="px-3 pb-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6B72] hover:bg-[#F1F1F4] hover:text-[#1F1F24] transition-all duration-150"
          >
            <Menu className="w-4 h-4" strokeWidth={1.8} />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  Recolher
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-[#2D3748] hover:bg-[#F1F1F4] transition-colors"
      >
        <Menu className="w-5 h-5" strokeWidth={1.8} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="lg:hidden fixed left-4 top-4 bottom-4 z-50 w-[260px] bg-white rounded-2xl shadow-xl overflow-hidden"
              style={{
                border: "1px solid transparent",
                backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #60A5FA, #C084FC)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B72] hover:bg-[#F1F1F4] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: expanded ? 260 : 80 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="hidden lg:block fixed left-5 top-5 bottom-5 z-30 bg-white rounded-2xl shadow-sm overflow-hidden flex-shrink-0"
        style={{
          border: "1px solid transparent",
          backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #60A5FA, #C084FC)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Spacer */}
      <motion.div
        animate={{ width: expanded ? 290 : 110 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="hidden lg:block flex-shrink-0"
      />
    </>
  );
}