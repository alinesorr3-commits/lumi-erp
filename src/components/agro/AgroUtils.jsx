export const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);

export const fmtNum = (v, dec = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v || 0);

export const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export const CULTURAS = ["Soja", "Milho", "Algodão", "Sorgo", "Feijão", "Arroz", "Trigo", "Cana-de-açúcar", "Café", "Pastagem", "Outro"];

export const STATUS_SAFRA = {
  Planejamento: { color: "text-blue-400", bg: "bg-blue-400/10" },
  Plantio: { color: "text-blue-400", bg: "bg-blue-400/10" },
  Desenvolvimento: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Colheita: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
  Concluída: { color: "text-green-400", bg: "bg-green-400/10" },
  Cancelada: { color: "text-red-400", bg: "bg-red-400/10" },
};

export const CATEGORIAS_DESPESA = [
  "Sementes", "Fertilizantes", "Defensivos", "Combustível",
  "Mão de Obra", "Máquinas/Equipamentos", "Arrendamento",
  "Transporte", "Secagem/Armazenagem", "Assistência Técnica",
  "Seguro", "Irrigação", "Outros"
];

export function calcSafra(safra, despesas, receitas) {
  const despSafra = despesas.filter(d => d.safra_id === safra.id);
  const recSafra = receitas.filter(r => r.safra_id === safra.id);
  const custoTotal = despSafra.reduce((s, d) => s + (d.valor_total || 0), 0);
  const receitaTotal = recSafra.reduce((s, r) => s + (r.valor_total || 0), 0);
  const area = safra.area_plantada || 1;
  const producaoTotal = safra.producao_total || (safra.produtividade_real * area) || (safra.produtividade_prev * area);
  const receitaBruta = receitaTotal || safra.receita_bruta || (producaoTotal * (safra.preco_venda || 0));
  const lucro = receitaBruta - custoTotal;
  const margem = receitaBruta > 0 ? (lucro / receitaBruta) * 100 : 0;
  const custoPorHa = area > 0 ? custoTotal / area : 0;
  const producaoPorHa = area > 0 ? producaoTotal / area : 0;
  return { custoTotal, receitaBruta, lucro, margem, custoPorHa, producaoPorHa, producaoTotal, despSafra, recSafra };
}