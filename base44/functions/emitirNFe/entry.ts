import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const FOCUS_NFE_API = "https://api.focusnfe.com.br/v2";

Deno.serve(async (req) => {
  const API_KEY = Deno.env.get("FOCUS_NFE_API_KEY") || "07ae55ed610f4bedb3af3da09164611e";
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { 
      nfe_id, 
      empresa_id, 
      destinatario_cnpj, 
      itens, 
      valor_total,
      natureza_operacao,
      serie,
      numero
    } = await req.json();

    // Se a chave não estiver configurada, vamos simular a emissão para ambiente de homologação/testes
    const isSimulacao = !API_KEY || API_KEY === "simulacao";

    // Buscar empresa para obter dados do emitente se o ID for passado
    let emitente = { razao_social: "Empresa Padrão", cnpj: "00000000000000" };
    if (empresa_id) {
      const empresas = await base44.asServiceRole.entities.EmpresaCliente.filter({ id: empresa_id });
      if (empresas && empresas.length > 0) {
        emitente = empresas[0];
      } else {
        return Response.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
    }

    // Estrutura XML simplificada para Focus NFe (já trata a geração do XML)
    const docStr = (destinatario_cnpj || "").replace(/\D/g, "");
    
    const nfeData = {
      natureza_operacao: natureza_operacao || "Venda de mercadoria adquirida ou recebida de terceiros",
      serie: serie || 1,
      numero: numero || Math.floor(Math.random() * 999999).toString(),
      data_emissao: new Date().toISOString().split("T")[0],
      destinatario: {
        [docStr.length === 11 ? "cpf" : "cnpj"]: docStr
      },
      itens: (itens || []).map((item, idx) => ({
        numero_item: idx + 1,
        codigo_produto: item.codigo || "",
        descricao: item.descricao || "Item Diverso",
        ncm: item.ncm || "00000000",
        cfop: item.cfop || "5102",
        unidade: item.unidade || "UN",
        quantidade: item.quantidade || 1,
        valor_unitario: item.valor_unitario || 0,
        valor_total: (item.quantidade || 1) * (item.valor_unitario || 0),
        informacao_adicional: item.informacao_adicional || ""
      })),
      valor_total: valor_total
    };

    let focusData;
    
    if (isSimulacao) {
      // Simulando a resposta da API (Ambiente de Homologação)
      focusData = {
        chave_acesso: "35" + Date.now().toString() + Math.floor(Math.random() * 100000000).toString(),
        protocolo: "1" + Math.floor(Math.random() * 100000000000000).toString(),
        numero: nfeData.numero,
        url_xml: "https://homologacao.nfe.fazenda.gov.br/portal/xml",
        url_danfe: "https://homologacao.nfe.fazenda.gov.br/portal/danfe"
      };
      
      // Delay simulando latência da SEFAZ
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      // Chamar API Focus NFe
      const focusResponse = await fetch(`${FOCUS_NFE_API}/nfe?ref=b44`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(API_KEY + ":")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nfeData)
      });

      focusData = await focusResponse.json();

      if (!focusResponse.ok) {
        console.error("Focus NFe error:", focusData);
        return Response.json({ 
          error: focusData.errors?.[0]?.detail || "Erro ao emitir NF-e",
          details: focusData.errors
        }, { status: focusResponse.status });
      }
    }

    // Atualizar registro de NF-e com resposta da API
    if (nfe_id) {
      await base44.entities.NotaFiscalEletronica.update(nfe_id, {
        situacao: "Autorizada",
        chave_acesso: focusData.chave_acesso || "",
        protocolo: focusData.protocolo || "",
        numero: focusData.numero || nfeData.numero,
        data_autorizacao: new Date().toISOString().split("T")[0],
        xml_url: focusData.url_xml || "",
        danfe_url: focusData.url_danfe || ""
      });
    }

    return Response.json({
      success: true,
      message: isSimulacao ? "NF-e emitida com sucesso (Simulação)" : "NF-e emitida com sucesso",
      chave_acesso: focusData.chave_acesso,
      protocolo: focusData.protocolo,
      numero: focusData.numero,
      xml_url: focusData.url_xml,
      danfe_url: focusData.url_danfe
    });

  } catch (error) {
    console.error("Erro ao emitir NF-e:", error.message);
    return Response.json({ 
      error: error.message || "Erro interno do servidor"
    }, { status: 500 });
  }
});