import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { file_url } = await req.json();
    if (!file_url) {
      return Response.json({ error: "file_url required" }, { status: 400 });
    }

    // Fazer download do arquivo com headers apropriados
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      console.error(`Failed to fetch ${file_url}: ${fileResponse.status}`);
      return Response.json({ error: "Failed to download file" }, { status: 400 });
    }

    const fileContent = await fileResponse.text();

    // Fazer parsing do XML
    try {
      // Simples regex-based extraction para campos NCM, valores, UF, CFOP
      const parseField = (xml, tag, index = 0) => {
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "g");
        const matches = xml.match(regex);
        if (!matches || !matches[index]) return null;
        return matches[index].replace(/^<[^>]+>|<\/[^>]+>$/g, "");
      };

      // Extrair primeiro NCM
      const ncmMatch = fileContent.match(/<NCM>([0-9]{8})<\/NCM>/);
      const ncm = ncmMatch ? ncmMatch[1] : "";

      // Extrair valores
      const vBCMatch = fileContent.match(/<vBC>([0-9.]+)<\/vBC>/);
      const vBC = vBCMatch ? parseFloat(vBCMatch[1]) : 0;

      const vFreteMatch = fileContent.match(/<vFrete>([0-9.]+)<\/vFrete>/);
      const vFrete = vFreteMatch ? parseFloat(vFreteMatch[1]) : 0;

      const vSeguroMatch = fileContent.match(/<vSeguro>([0-9.]+)<\/vSeguro>/);
      const vSeguro = vSeguroMatch ? parseFloat(vSeguroMatch[1]) : 0;

      const pIPIMatch = fileContent.match(/<pIPI>([0-9.]+)<\/pIPI>/);
      const pIPI = pIPIMatch ? parseFloat(pIPIMatch[1]) : 0;

      // Extrair CFOP
      const cfopMatch = fileContent.match(/<CFOP>(\d{4})<\/CFOP>/);
      const cfop = cfopMatch ? cfopMatch[1] : "2102";

      // Extrair UF origem (de quem emite - enderEmi)
      const ufEmitMatch = fileContent.match(/<enderEmi>[\s\S]*?<UF>([A-Z]{2})<\/UF>[\s\S]*?<\/enderEmi>/);
      const ufOrig = ufEmitMatch ? ufEmitMatch[1] : "SP";

      // Extrair UF destino (de quem recebe - enderDest)
      const ufDestMatch = fileContent.match(/<enderDest>[\s\S]*?<UF>([A-Z]{2})<\/UF>[\s\S]*?<\/enderDest>/);
      const ufDest = ufDestMatch ? ufDestMatch[1] : "MT";

      // Extrair CST/CSOSN (pode estar em ICMS, PIS, COFINS)
      const cstMatch = fileContent.match(/<CST>(\d{3})<\/CST>/);
      const cst = cstMatch ? cstMatch[1] : "";

      // Calcular MVA ST se houver (simplificado)
      const mvaMatch = fileContent.match(/<pMVAST>([0-9.]+)<\/pMVAST>/);
      const mva = mvaMatch ? parseFloat(mvaMatch[1]) : 0;

      return Response.json({
        status: "success",
        output: {
          ncm,
          valor_mercadoria: vBC,
          valor_frete: vFrete,
          valor_seguro: vSeguro,
          ipi_percentual: pIPI,
          mva,
          uf_origem: ufOrig,
          uf_destino: ufDest,
          cfop,
          cst_csosn: cst,
        }
      });
    } catch (parseError) {
      return Response.json({
        status: "error",
        details: `XML parsing error: ${parseError.message}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Erro ao extrair dados de NF-e:", error.message);
    return Response.json({
      error: error.message || "Erro interno do servidor"
    }, { status: 500 });
  }
});