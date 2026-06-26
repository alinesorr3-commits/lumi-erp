import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Veiculo.filter({ status: "Ativo" }).then(d => {
      setVeiculos(d); setLoading(false);
    });
    // Also load all for full list
    base44.entities.Veiculo.list().then(d => {
      setVeiculos(d); setLoading(false);
    });
  }, []);

  return { veiculos, loading };
}

export function useNotasFiscais() {
  const [notas, setNotas] = useState([]);
  useEffect(() => {
    base44.entities.NotaFiscalFiscal.list("-data_emissao", 200).then(d => setNotas(d));
  }, []);
  return notas;
}