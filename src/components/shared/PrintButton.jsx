import { Printer } from "lucide-react";

/**
 * Botão de impressão universal.
 * Ao clicar, abre o diálogo de impressão do navegador com estilos corretos para dark mode.
 */
export default function PrintButton({ label = "Imprimir", className = "" }) {
  const handlePrint = () => {
    // Injeta estilo temporário de impressão se não existir
    const styleId = "lumi-print-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print, nav, aside, [data-sidebar], header { display: none !important; }
          .bg-card { background: white !important; border: 1px solid #ddd !important; }
          .bg-muted { background: #f5f5f5 !important; }
          .text-foreground, .text-muted-foreground { color: #111 !important; }
          .text-green-400 { color: hsl(var(--chart-3)) !important; }
          .text-red-400 { color: hsl(var(--chart-5)) !important; }
          .text-blue-400 { color: #2563eb !important; }
          .text-yellow-400 { color: #d97706 !important; }
          .border-border { border-color: #ddd !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; }
          @page { margin: 1.5cm; }
        }
      `;
      document.head.appendChild(style);
    }
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border text-muted-foreground rounded-lg text-xs hover:text-foreground hover:border-primary transition-colors no-print ${className}`}
    >
      <Printer size={13} />
      {label}
    </button>
  );
}