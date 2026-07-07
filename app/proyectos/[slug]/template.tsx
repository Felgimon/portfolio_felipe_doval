"use client";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Transición de entrada de las páginas de detalle. El template re-monta en cada
 * navegación entre casos, así que la animación corre en cada apertura.
 * Respeta reduced-motion (sin animación).
 */
export default function ProyectoTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.6, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
