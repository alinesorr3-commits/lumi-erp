import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";

export const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export const statusConfig = {
  Planejamento: { color: "text-blue-400", bg: "bg-blue-400/10" },
  "Em Andamento": { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Concluída: { color: "text-green-400", bg: "bg-green-400/10" },
  Pausada: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Cancelada: { color: "text-red-400", bg: "bg-red-400/10" },
};

export function useObras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    base44.entities.Obra.list("-created_date").then(d => { setObras(d); setLoading(false); });
  };
  useEffect(() => { reload(); }, []);
  return { obras, loading, reload };
}

export function exportCSV(rows, filename) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
}