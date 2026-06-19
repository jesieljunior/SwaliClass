import { useViewMode } from "@/lib/view-mode";
import { GraduationCap, UserRound } from "lucide-react";
import { motion } from "framer-motion";

export function ViewModeToggle() {
  const { mode, setMode } = useViewMode();
  return (
    <div className="relative inline-flex items-center bg-surface border border-border-subtle rounded-full p-1 text-xs font-mono uppercase tracking-wider">
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="absolute top-1 bottom-1 w-1/2 rounded-full bg-navy-900 shadow-sm"
        style={{ left: mode === "teacher" ? 4 : "calc(50% - 4px)" }}
      />
      <button
        onClick={() => setMode("teacher")}
        className={`relative z-10 px-3 sm:px-4 h-7 rounded-full flex items-center gap-1.5 transition-colors ${mode === "teacher" ? "text-paper" : "text-navy-800/60"}`}
      >
        <GraduationCap className="size-3.5" />
        <span className="hidden sm:inline">Professor</span>
      </button>
      <button
        onClick={() => setMode("student")}
        className={`relative z-10 px-3 sm:px-4 h-7 rounded-full flex items-center gap-1.5 transition-colors ${mode === "student" ? "text-paper" : "text-navy-800/60"}`}
      >
        <UserRound className="size-3.5" />
        <span className="hidden sm:inline">Aluno</span>
      </button>
    </div>
  );
}