import { Construction } from "lucide-react";

export default function ModuloPlaceholder({ titulo, descricao, cor }) {
  return (
    <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${cor || "bg-muted"}`}>
        <Construction size={28} className="text-foreground/60" />
      </div>
      <h1 className="text-2xl font-bold font-heading text-foreground mb-2">{titulo}</h1>
      <p className="text-muted-foreground text-sm text-center max-w-sm">{descricao || "Este módulo está em desenvolvimento e estará disponível em breve."}</p>
      <div className="mt-6 px-4 py-2 bg-muted rounded-full text-xs text-muted-foreground">Em desenvolvimento</div>
    </div>
  );
}