import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, ChevronRight, ChevronDown, DollarSign, ShoppingCart,
  FileText, Users, Truck, HardHat, Sprout, TrendingUp, BarChart2,
  Package, Calculator, Send, Shield, Globe, Calendar, Search,
  CheckCircle2, Circle, ArrowRight, Lightbulb, AlertCircle, Star,
  UserCircle
} from "lucide-react";

// ─── Dados do manual ───────────────────────────────────────────────────
const MODULOS = [
  {
    id: "inicio",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Primeiros Passos",
    subtitulo: "Como começar a usar o Lumi ERP",
    path: null,
    secoes: [
      {
        titulo: "O que é o Lumi ERP?",
        conteudo: `O Lumi ERP é um sistema completo de gestão empresarial. Ele reúne em um só lugar: financeiro, fiscal, comercial, RH, estoques, veículos, obras, agronegócio e muito mais.

Você acessa tudo pelo menu lateral à esquerda. Cada item do menu é um módulo independente.`,
        dica: "Comece sempre pelo módulo Financeiro — ele é a base de tudo.",
        passos: []
      },
      {
        titulo: "Como navegar no sistema",
        conteudo: "O sistema tem uma barra lateral com todos os módulos disponíveis no seu plano. Clique em qualquer item para acessar o módulo.",
        passos: [
          "Clique em qualquer módulo no menu lateral esquerdo",
          "Use as abas internas de cada módulo para navegar entre as funcionalidades",
          "O botão 'Panorama' no topo do menu mostra um resumo geral de tudo",
          "Para imprimir qualquer tela, use o botão 🖨️ Imprimir disponível nos módulos",
        ],
        dica: "No celular, toque no ícone ☰ no canto superior esquerdo para abrir o menu."
      },
    ]
  },
  {
    id: "financeiro",
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-500/10/10",
    border: "border-green-500/30",
    titulo: "Financeiro",
    subtitulo: "Contas a pagar, receber, fluxo de caixa e conciliação",
    path: "/financeiro",
    secoes: [
      {
        titulo: "Cadastrar uma Conta a Pagar",
        conteudo: "Use quando precisar registrar uma despesa: aluguel, fornecedor, imposto, etc.",
        passos: [
          "Acesse Financeiro → aba 'Contas a Pagar'",
          "Clique em '+ Novo Lançamento'",
          "Preencha a descrição: ex. 'Aluguel Julho/2025'",
          "Selecione o tipo: Despesa",
          "Informe o valor: ex. R$ 2.500,00",
          "Escolha o vencimento: ex. 10/07/2025",
          "Selecione a categoria: ex. 'Aluguel'",
          "Clique em Salvar",
        ],
        exemplo: {
          titulo: "Exemplo prático — Padaria Delícia",
          descricao: "A Padaria Delícia precisa registrar o pagamento de farinha ao fornecedor:",
          campos: [
            { label: "Descrição", valor: "Farinha de Trigo — NF 4521 — Moinho Central" },
            { label: "Tipo", valor: "Despesa" },
            { label: "Valor", valor: "R$ 1.800,00" },
            { label: "Vencimento", valor: "15/07/2025" },
            { label: "Categoria", valor: "Matéria-Prima" },
            { label: "Fornecedor", valor: "Moinho Central Ltda" },
          ]
        },
        dica: "Ao marcar como 'Pago', o sistema registra a data de pagamento automaticamente."
      },
      {
        titulo: "Cadastrar uma Conta a Receber",
        conteudo: "Use para registrar vendas, prestações de serviço ou qualquer receita esperada.",
        passos: [
          "Acesse Financeiro → aba 'Contas a Receber'",
          "Clique em '+ Novo Lançamento'",
          "Selecione o tipo: Receita",
          "Preencha a descrição, valor e vencimento",
          "Clique em Salvar",
          "Quando receber o pagamento, clique em 'Marcar pago'",
        ],
        exemplo: {
          titulo: "Exemplo prático — Consultoria Silva",
          descricao: "A empresa prestou serviço de consultoria e vai receber em parcelas:",
          campos: [
            { label: "Descrição", valor: "Consultoria Tributária — Cliente ABC" },
            { label: "Tipo", valor: "Receita" },
            { label: "Valor", valor: "R$ 5.000,00" },
            { label: "Vencimento", valor: "20/07/2025" },
            { label: "Categoria", valor: "Serviços Prestados" },
            { label: "Cliente", valor: "ABC Indústria Ltda" },
          ]
        }
      },
      {
        titulo: "Visualizar o Fluxo de Caixa",
        conteudo: "O fluxo de caixa mostra entradas e saídas ao longo do tempo.",
        passos: [
          "Acesse Financeiro → aba 'Fluxo de Caixa'",
          "Veja o gráfico de barras com receitas (verde) e despesas (vermelho)",
          "O saldo projetado aparece na linha azul",
          "Use os filtros de período para ver meses específicos",
        ],
        dica: "Monitore o fluxo semanal para evitar surpresas no caixa."
      },
      {
        titulo: "Importar Lançamentos de Planilha",
        conteudo: "Se você já tem dados em Excel, importe de uma vez.",
        passos: [
          "Acesse Financeiro → aba 'Importar Planilha'",
          "Faça download do modelo de planilha",
          "Preencha os dados no Excel (descrição, valor, vencimento, tipo)",
          "Carregue o arquivo no sistema",
          "Revise os dados e confirme a importação",
        ],
        dica: "O sistema detecta duplicatas automaticamente e avisa antes de importar."
      },
    ]
  },
  {
    id: "comercial",
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Comercial / CRM",
    subtitulo: "Clientes, orçamentos, pedidos e pipeline de vendas",
    path: "/comercial",
    secoes: [
      {
        titulo: "Cadastrar um Cliente",
        conteudo: "Todo processo comercial começa pelo cadastro do cliente.",
        passos: [
          "Acesse Comercial → aba 'CRM / Clientes'",
          "Clique em '+ Novo Cliente'",
          "Informe: Nome/Razão Social, CNPJ ou CPF",
          "Preencha e-mail, telefone e endereço",
          "Salve o cadastro",
        ],
        exemplo: {
          titulo: "Exemplo prático — Distribuidora Matos",
          descricao: "Cadastro de um novo cliente atacadista:",
          campos: [
            { label: "Razão Social", valor: "Supermercado Bom Preço Ltda" },
            { label: "CNPJ", valor: "12.345.678/0001-99" },
            { label: "E-mail", valor: "compras@bompreco.com.br" },
            { label: "Telefone", valor: "(11) 98765-4321" },
            { label: "Cidade", valor: "São Paulo - SP" },
          ]
        }
      },
      {
        titulo: "Criar um Orçamento",
        conteudo: "Gere orçamentos profissionais para enviar ao cliente.",
        passos: [
          "Acesse Comercial → aba 'Orçamentos e Pedidos'",
          "Clique em '+ Novo Orçamento'",
          "Selecione o cliente",
          "Adicione os produtos/serviços com quantidade e valor",
          "O sistema calcula o total automaticamente",
          "Salve e envie ao cliente por e-mail ou imprima",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "Orçamento para reforma elétrica:",
          campos: [
            { label: "Cliente", valor: "Supermercado Bom Preço" },
            { label: "Item 1", valor: "Mão de obra elétrica — 40h × R$ 80 = R$ 3.200" },
            { label: "Item 2", valor: "Material elétrico — R$ 1.500" },
            { label: "Total", valor: "R$ 4.700,00" },
            { label: "Validade", valor: "30 dias" },
          ]
        }
      },
    ]
  },
  {
    id: "nfe",
    icon: Send,
    color: "text-red-400",
    bg: "bg-red-500/10/10",
    border: "border-red-500/30",
    titulo: "Emissão NF-e / NFS-e",
    subtitulo: "Notas fiscais eletrônicas de produto e serviço",
    path: "/modulo-nfe",
    secoes: [
      {
        titulo: "Configurar a empresa para emissão",
        conteudo: "Antes de emitir NF-e, você precisa configurar os dados da empresa.",
        passos: [
          "Acesse Emissão NF-e → aba 'Configurações / Empresa'",
          "Informe CNPJ, Razão Social, Endereço completo",
          "Selecione o Regime Tributário (Simples Nacional, Lucro Presumido, etc.)",
          "Faça upload do Certificado Digital A1 (.pfx ou .p12)",
          "Informe a senha do certificado",
          "Defina o ambiente: Homologação (testes) ou Produção (real)",
          "Salve as configurações",
        ],
        dica: "Sempre teste em Homologação antes de mudar para Produção!"
      },
      {
        titulo: "Emitir uma NF-e (Produto)",
        conteudo: "Nota Fiscal Eletrônica para venda de mercadorias.",
        passos: [
          "Acesse Emissão NF-e → aba 'Emitir NF-e'",
          "Selecione o destinatário (cliente)",
          "Adicione os produtos com NCM, CFOP, quantidade e valor",
          "O sistema calcula os impostos automaticamente (ICMS, PIS, COFINS, IPI)",
          "Revise os valores e clique em 'Emitir NF-e'",
          "Aguarde a autorização da SEFAZ",
          "Faça download do XML e DANFE (PDF)",
        ],
        exemplo: {
          titulo: "Exemplo prático — Metalúrgica Ferro Forte",
          descricao: "Venda de parafusos para uma construtora:",
          campos: [
            { label: "Destinatário", valor: "Construtora Pedra & Cal Ltda" },
            { label: "Produto", valor: "Parafuso Sextavado 1/2' — NCM 7318.15.00" },
            { label: "Quantidade", valor: "500 peças" },
            { label: "Valor Unit.", valor: "R$ 0,85" },
            { label: "Total", valor: "R$ 425,00" },
            { label: "CFOP", valor: "5102 — Venda dentro do Estado" },
          ]
        }
      },
    ]
  },
  {
    id: "estoques",
    icon: Package,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10/10",
    border: "border-yellow-500/30",
    titulo: "Gestão de Estoques",
    subtitulo: "Produtos, movimentações, produção e fichas técnicas",
    path: "/estoques",
    secoes: [
      {
        titulo: "Cadastrar um Produto",
        conteudo: "O cadastro de produtos é a base do módulo de estoques.",
        passos: [
          "Acesse Estoques → aba 'Produtos'",
          "Clique em '+ Novo Produto'",
          "Informe código, descrição, unidade (UN, KG, CX, etc.)",
          "Defina o preço de custo e preço de venda",
          "Informe o estoque mínimo (quantidade de alerta)",
          "Salve o produto",
        ],
        exemplo: {
          titulo: "Exemplo prático — Fábrica de Móveis Madeirex",
          descricao: "Cadastro de insumo para produção:",
          campos: [
            { label: "Código", valor: "INS-001" },
            { label: "Descrição", valor: "Painel MDF 15mm 2750×1830" },
            { label: "Unidade", valor: "CHP (Chapa)" },
            { label: "Preço de Custo", valor: "R$ 180,00" },
            { label: "Estoque Mínimo", valor: "10 chapas" },
          ]
        }
      },
      {
        titulo: "Criar uma Ficha Técnica",
        conteudo: "A Ficha Técnica define quais insumos e quantidades são necessários para produzir 1 unidade de um produto acabado.",
        passos: [
          "Acesse Estoques → aba 'Produção' → sub-aba 'Fichas Técnicas'",
          "Clique em '+ Nova Ficha Técnica'",
          "Selecione o produto acabado",
          "Adicione cada insumo com a quantidade por unidade produzida",
          "Informe o custo de mão de obra por unidade",
          "Defina o percentual de overhead (gastos gerais, ex: 10%)",
          "Defina a margem de lucro desejada (ex: 30%)",
          "Veja o preço de venda sugerido calculado automaticamente",
          "Salve a ficha técnica",
        ],
        exemplo: {
          titulo: "Exemplo prático — Fábrica de Móveis Madeirex",
          descricao: "Ficha Técnica de um Armário 2 Portas:",
          campos: [
            { label: "Produto", valor: "Armário 2 Portas Ref. ARM-100" },
            { label: "Insumo 1", valor: "Painel MDF 15mm — 3 chapas × R$ 180 = R$ 540" },
            { label: "Insumo 2", valor: "Dobradiça — 4 pares × R$ 8 = R$ 32" },
            { label: "Insumo 3", valor: "Puxador — 2 un × R$ 15 = R$ 30" },
            { label: "Mão de Obra", valor: "R$ 150,00 / unidade" },
            { label: "Overhead (10%)", valor: "R$ 60,20" },
            { label: "Custo Total", valor: "R$ 812,20 / unidade" },
            { label: "Margem (30%)", valor: "R$ 243,66" },
            { label: "Preço Sugerido", valor: "R$ 1.055,86" },
          ]
        },
        dica: "O campo 'Desperdício %' em cada insumo adiciona uma margem de segurança para perdas de material."
      },
      {
        titulo: "Criar uma Ordem de Produção",
        conteudo: "A Ordem de Produção (OP) define o que vai ser produzido e em qual quantidade.",
        passos: [
          "Acesse Estoques → Produção → 'Ordens de Produção'",
          "Clique em '+ Nova Ordem de Produção'",
          "Selecione o produto e a ficha técnica",
          "Informe a quantidade a produzir",
          "Defina as datas de início e conclusão previstas",
          "Salve a ordem com status 'Planejada'",
          "Quando iniciar a produção, clique em ⚡ Executar — o sistema baixa os insumos do estoque automaticamente",
        ],
        dica: "O sistema verifica o estoque dos insumos antes de executar. Se faltar algum item, ele avisa."
      },
    ]
  },
  {
    id: "fiscal",
    icon: FileText,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10/10",
    border: "border-yellow-500/30",
    titulo: "Fiscal & Tributário",
    subtitulo: "Notas fiscais recebidas, dívidas fiscais e simulador tributário",
    path: "/fiscal",
    secoes: [
      {
        titulo: "Registrar Nota Fiscal Recebida",
        conteudo: "Registre as NF-e que você recebe de fornecedores.",
        passos: [
          "Acesse Fiscal → aba 'Notas Fiscais'",
          "Clique em '+ Nova Nota Fiscal'",
          "Preencha o número, data de emissão, fornecedor e valor total",
          "Informe os tributos (ICMS, PIS, COFINS)",
          "Ou importe o XML da NF-e do fornecedor",
          "Salve o registro",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "NF de compra de mercadorias:",
          campos: [
            { label: "Número NF", valor: "7842" },
            { label: "Emitente", valor: "Distribuidora XYZ Ltda" },
            { label: "Data", valor: "05/07/2025" },
            { label: "Valor Total", valor: "R$ 12.500,00" },
            { label: "ICMS", valor: "R$ 1.500,00" },
          ]
        }
      },
      {
        titulo: "Simular o Regime Tributário",
        conteudo: "Descubra qual regime tributário é mais vantajoso para sua empresa.",
        passos: [
          "Acesse Fiscal → aba 'Simulador Tributário'",
          "Informe o faturamento anual estimado",
          "Informe as despesas com folha de pagamento",
          "O sistema calcula a carga tributária para: Simples Nacional, Lucro Presumido e Lucro Real",
          "Compare os resultados e tome a decisão com base nos números",
        ],
        dica: "Faça a simulação todo ano, pois os limites do Simples Nacional mudam."
      },
    ]
  },
  {
    id: "rh",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Recursos Humanos",
    subtitulo: "Colaboradores, folha de pagamento e ponto eletrônico",
    path: "/rh",
    secoes: [
      {
        titulo: "Cadastrar um Colaborador",
        conteudo: "O cadastro de colaboradores é o primeiro passo do módulo de RH.",
        passos: [
          "Acesse RH → aba 'Colaboradores'",
          "Clique em '+ Novo Colaborador'",
          "Preencha: Nome, CPF, data de admissão",
          "Informe o cargo e departamento",
          "Defina o salário base",
          "Preencha os dados bancários para pagamento",
          "Salve o cadastro",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "Admissão de um novo funcionário:",
          campos: [
            { label: "Nome", valor: "Fernanda Costa Lima" },
            { label: "CPF", valor: "123.456.789-00" },
            { label: "Admissão", valor: "01/07/2025" },
            { label: "Cargo", valor: "Assistente Administrativo" },
            { label: "Salário Base", valor: "R$ 2.200,00" },
            { label: "Departamento", valor: "Financeiro" },
          ]
        }
      },
      {
        titulo: "Gerar a Folha de Pagamento",
        conteudo: "O sistema calcula automaticamente INSS, IRRF, FGTS e outros encargos.",
        passos: [
          "Acesse RH → aba 'Folha de Pagamento'",
          "Selecione o mês de referência (ex: Julho/2025)",
          "Clique em 'Gerar Folha'",
          "O sistema busca todos os colaboradores ativos",
          "Revise os valores de cada colaborador",
          "Adicione horas extras, adicionais ou descontos extras se necessário",
          "Aprove a folha e marque como 'Paga' após o pagamento",
        ],
        dica: "O sistema usa a tabela progressiva do IRRF e as alíquotas do INSS vigentes automaticamente."
      },
    ]
  },
  {
    id: "veiculos",
    icon: Truck,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Veículos",
    subtitulo: "Frota, manutenção, abastecimento e despesas",
    path: "/veiculos",
    secoes: [
      {
        titulo: "Cadastrar um Veículo",
        passos: [
          "Acesse Veículos → aba 'Frota'",
          "Clique em '+ Novo Veículo'",
          "Informe placa, modelo, ano, cor e tipo de combustível",
          "Defina o responsável e departamento",
          "Salve o cadastro",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "Cadastro de caminhão de entrega:",
          campos: [
            { label: "Placa", valor: "ABC-1D23" },
            { label: "Modelo", valor: "Mercedes-Benz Atego 1719" },
            { label: "Ano", valor: "2021" },
            { label: "Combustível", valor: "Diesel" },
            { label: "Responsável", valor: "Carlos Santos" },
          ]
        }
      },
      {
        titulo: "Registrar Abastecimento",
        passos: [
          "Acesse Veículos → aba 'Abastecimentos'",
          "Clique em '+ Novo Abastecimento'",
          "Selecione o veículo",
          "Informe data, litros abastecidos, valor por litro e hodômetro",
          "Salve — o sistema calcula o consumo médio automaticamente",
        ],
        dica: "Monitore o consumo médio. Um aumento repentino pode indicar problema mecânico."
      },
    ]
  },
  {
    id: "obras",
    icon: HardHat,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10/10",
    border: "border-yellow-500/30",
    titulo: "Gestão de Obras",
    subtitulo: "Cadastro de obras, despesas, materiais e mão de obra",
    path: "/obras",
    secoes: [
      {
        titulo: "Cadastrar uma Obra",
        passos: [
          "Acesse Obras → aba 'Cadastro'",
          "Clique em '+ Nova Obra'",
          "Informe o nome da obra, cliente, endereço e tipo",
          "Defina o valor do contrato e as datas previstas",
          "Salve a obra",
        ],
        exemplo: {
          titulo: "Exemplo prático — Construtora Alvenaria SP",
          descricao: "Início de uma obra de reforma:",
          campos: [
            { label: "Nome", valor: "Reforma Sede Corporativa — Bloco A" },
            { label: "Cliente", valor: "Empresa Tech Solutions Ltda" },
            { label: "Endereço", valor: "Av. Paulista, 1000 — São Paulo/SP" },
            { label: "Valor Contrato", valor: "R$ 380.000,00" },
            { label: "Início Previsto", valor: "15/07/2025" },
            { label: "Conclusão Prevista", valor: "15/12/2025" },
          ]
        }
      },
      {
        titulo: "Registrar Despesas da Obra",
        passos: [
          "Acesse a obra → aba 'Despesas'",
          "Clique em '+ Nova Despesa'",
          "Selecione a categoria (material, mão de obra, equipamento, etc.)",
          "Informe o fornecedor, data e valor",
          "Vincule à nota fiscal se houver",
          "Salve — o sistema atualiza o custo total da obra automaticamente",
        ],
        dica: "Acompanhe a aba 'Resultado' para ver se a obra está dentro do orçamento previsto."
      },
    ]
  },
  {
    id: "agronegocio",
    icon: Sprout,
    color: "text-green-400",
    bg: "bg-green-500/10/10",
    border: "border-green-500/30",
    titulo: "Agronegócio",
    subtitulo: "Fazendas, safras, talhões e resultado agrícola",
    path: "/agronegocio",
    secoes: [
      {
        titulo: "Cadastrar uma Fazenda",
        passos: [
          "Acesse Agronegócio → aba 'Cadastros'",
          "Clique em '+ Nova Fazenda'",
          "Informe o nome, município, UF e área total em hectares",
          "Adicione os talhões (subdivisões da fazenda) com área de cada um",
          "Salve o cadastro",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "Cadastro de fazenda de soja:",
          campos: [
            { label: "Nome", valor: "Fazenda Santa Rita" },
            { label: "Município", valor: "Sorriso - MT" },
            { label: "Área Total", valor: "1.200 hectares" },
            { label: "Talhão 1", valor: "Talhão Norte — 400 ha" },
            { label: "Talhão 2", valor: "Talhão Sul — 400 ha" },
            { label: "Talhão 3", valor: "Talhão Leste — 400 ha" },
          ]
        }
      },
      {
        titulo: "Registrar uma Safra",
        passos: [
          "Acesse Agronegócio → aba 'Safras'",
          "Clique em '+ Nova Safra'",
          "Selecione a fazenda e os talhões",
          "Defina a cultura (soja, milho, cana, etc.) e a temporada",
          "Registre as despesas de plantio (sementes, defensivos, fertilizantes)",
          "Registre as receitas de colheita conforme ocorrem",
          "Veja o resultado na aba 'Resultado Agrícola'",
        ],
        dica: "O resultado agrícola compara receitas × despesas por safra e por talhão, permitindo identificar as áreas mais rentáveis."
      },
    ]
  },
  {
    id: "certidoes",
    icon: Shield,
    color: "text-green-400",
    bg: "bg-green-500/10/10",
    border: "border-green-500/30",
    titulo: "Certidões",
    subtitulo: "Controle de vencimentos de certidões negativas",
    path: "/certidoes",
    secoes: [
      {
        titulo: "Cadastrar uma Certidão",
        conteudo: "Mantenha controle das certidões negativas da empresa para não perder prazo.",
        passos: [
          "Acesse Certidões",
          "Clique em '+ Nova Certidão'",
          "Selecione o tipo: FGTS, INSS, Receita Federal, Trabalhista, etc.",
          "Informe a empresa/CNPJ",
          "Digite a data de emissão e data de validade",
          "Faça upload do PDF da certidão",
          "Salve — o sistema alertará automaticamente quando estiver próxima do vencimento",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "Registro da CND da Receita Federal:",
          campos: [
            { label: "Tipo", valor: "Receita Federal" },
            { label: "Empresa", valor: "Comércio ABC Ltda — 12.345.678/0001-99" },
            { label: "Emissão", valor: "01/07/2025" },
            { label: "Validade", valor: "01/01/2026" },
            { label: "Situação", valor: "Regular" },
          ]
        },
        dica: "O sistema envia alertas por e-mail 30, 15 e 7 dias antes do vencimento automaticamente!"
      },
    ]
  },
  {
    id: "calendario",
    icon: Calendar,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Calendário de Tarefas",
    subtitulo: "Agenda de compromissos, prazos e tarefas",
    path: "/calendario",
    secoes: [
      {
        titulo: "Criar uma Tarefa ou Compromisso",
        passos: [
          "Acesse Calendário",
          "Clique em '+ Nova Tarefa'",
          "Informe o título, tipo (Fiscal, Financeiro, Certidão, etc.)",
          "Defina a data e hora de vencimento",
          "Escolha a prioridade: Baixa, Média, Alta ou Urgente",
          "Defina o responsável",
          "Para tarefas que se repetem (IRPJ mensal, DCTF, etc.), ative 'Recorrente' e escolha a frequência",
          "Salve a tarefa",
        ],
        exemplo: {
          titulo: "Exemplo prático — Obrigações fiscais",
          descricao: "Lembretes mensais para o contador:",
          campos: [
            { label: "Tarefa 1", valor: "Apuração do Simples Nacional — todo dia 20" },
            { label: "Tarefa 2", valor: "Envio DCTF — todo dia 15" },
            { label: "Tarefa 3", valor: "Pagamento FGTS — todo dia 7" },
            { label: "Recorrência", valor: "Mensal" },
          ]
        },
        dica: "Tarefas com prioridade Urgente e vencidas aparecem automaticamente no Panorama Geral."
      },
    ]
  },
  {
    id: "engfin",
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-500/10/10",
    border: "border-green-500/30",
    titulo: "Engenharia Financeira",
    subtitulo: "DRE, balancete, análise técnica e parecer IA",
    path: "/eng-financeira",
    secoes: [
      {
        titulo: "Gerar o DRE (Demonstrativo de Resultado)",
        conteudo: "O DRE mostra o resultado do período: se a empresa teve lucro ou prejuízo.",
        passos: [
          "Acesse Eng. Financeira → aba 'DRE'",
          "O sistema consolida automaticamente receitas, custos e despesas",
          "Alterne entre visão mensal e anual",
          "Veja indicadores: margem bruta, EBITDA, lucro líquido",
          "Clique em 'Parecer IA' para receber uma análise automática com recomendações",
          "Exporte para CSV se necessário",
        ],
        dica: "O DRE é gerado com base nos lançamentos do módulo Financeiro. Mantenha os lançamentos em dia!"
      },
      {
        titulo: "Gerar o Balancete",
        passos: [
          "Acesse Eng. Financeira → aba 'Balancete'",
          "Clique em '+ Novo Balancete'",
          "Selecione o período e informe os dados do Plano de Contas",
          "Clique em 'Gerar Balancete' para calcular os saldos",
          "Use 'Análise IA' para receber um parecer técnico automatizado",
        ]
      },
    ]
  },
  {
    id: "tributario",
    icon: Calculator,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Planejamento Tributário",
    subtitulo: "Simulação e planejamento de tributos",
    path: "/planejamento-tributario",
    secoes: [
      {
        titulo: "Fazer uma Simulação Tributária",
        passos: [
          "Acesse Planejamento Tributário",
          "Informe o faturamento anual da empresa",
          "Informe a folha de pagamento anual",
          "Informe as despesas operacionais",
          "O sistema calcula e compara os três regimes tributários",
          "Veja qual regime gera menor carga tributária",
          "Salve a simulação para comparar com anos anteriores",
        ],
        exemplo: {
          titulo: "Exemplo prático",
          descricao: "Empresa com faturamento de R$ 2 milhões/ano:",
          campos: [
            { label: "Faturamento Anual", valor: "R$ 2.000.000,00" },
            { label: "Simples Nacional", valor: "Alíquota ~10,7% = R$ 214.000" },
            { label: "Lucro Presumido", valor: "Alíquota ~13,33% = R$ 266.600" },
            { label: "Lucro Real", valor: "Depende do lucro efetivo" },
            { label: "Recomendação", valor: "Simples Nacional (menor carga)" },
          ]
        },
        dica: "O planejamento tributário pode gerar economia de 15 a 30% nos impostos. Faça todo ano!"
      },
    ]
  },
  {
    id: "links",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Links do Governo",
    subtitulo: "Atalhos para portais fiscais e previdenciários",
    path: "/links-governo",
    secoes: [
      {
        titulo: "Usar os Links Oficiais",
        conteudo: "O módulo reúne os principais portais governamentais para acesso rápido.",
        passos: [
          "Acesse Links do Governo",
          "Se necessário, clique em 'Importar Links Padrão' para carregar os links oficiais",
          "Use a busca ou os filtros por categoria (Federal, Estadual, Municipal, etc.)",
          "Clique em ⭐ para marcar links favoritos e acessá-los mais rapidamente",
          "Adicione links personalizados clicando em '+ Novo Link'",
        ],
        dica: "Links disponíveis: Receita Federal, e-CAC, SIRC, eSocial, Nota Fiscal Eletrônica, SEFAZ, Prefeituras e muitos mais."
      },
    ]
  },
  {
    id: "bens_recebidos",
    icon: Package,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10/10",
    border: "border-yellow-500/30",
    titulo: "Bens Recebidos",
    subtitulo: "Controle de bens recebidos em pagamentos e permutas",
    path: "/bens-recebidos",
    secoes: [
      {
        titulo: "Cadastrar e gerenciar estoque de Bens",
        passos: [
          "Acesse Bens Recebidos → aba 'Estoque de Bens'",
          "Clique em '+ Novo Bem' para registrar um bem",
          "Adicione dados como valor, categoria, fotos e documentos",
          "Use a aba 'Em Negociação' para acompanhar as transações de entrada ou saída",
          "Acompanhe o painel Dashboard para as métricas gerais",
        ],
        dica: "A classificação correta e imagens em anexo facilitam a gestão de longo prazo do seu patrimônio."
      }
    ]
  },
  {
    id: "simulador",
    icon: BarChart2,
    color: "text-blue-400",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Simulador de Lucro",
    subtitulo: "Simule cenários de receita, custo e margem",
    path: "/simulador",
    secoes: [
      {
        titulo: "Como utilizar o simulador",
        passos: [
          "Acesse o módulo 'Simulador de Lucro'",
          "Nas premissas (lado esquerdo), informe ticket médio, carteira de clientes, e gastos fixos",
          "Ajuste os alvos nas 'Alavancas de Melhoria' (Aumento de preço, Redução de Churn ou Corte de Gastos)",
          "Acompanhe a tabela 'DEMONSTRATIVO DE SIMULAÇÃO' com os ganhos calculados e comparativos",
        ],
        dica: "Pequenos cortes de churn e aumentos de ticket aumentam o seu lucro líquido de forma agressiva."
      }
    ]
  },
  {
    id: "integracoes",
    icon: Globe,
    color: "text-red-400",
    bg: "bg-red-500/10/10",
    border: "border-red-500/30",
    titulo: "Integrações e APIs",
    subtitulo: "Conecte seu sistema a plataformas do governo",
    path: "/integracoes",
    secoes: [
      {
        titulo: "Configurar Integrações",
        passos: [
          "Vá em 'Integrações e APIs' pelo menu principal",
          "Navegue entre os conectores de sistemas contábeis ou governamentais",
          "Siga os passos e preencha as credenciais, quando requisitado",
          "Visualize os 'Logs de Sincronização' para validar a automação",
        ],
        dica: "Dependendo da sua localidade ou regime, configurações do Sefaz exigirão o seu Certificado Digital já registrado."
      }
    ]
  },
  {
    id: "meu_painel",
    icon: UserCircle,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-blue-500/30",
    titulo: "Meu Painel",
    subtitulo: "Informações sobre sua assinatura e módulos",
    path: "/meu-painel",
    secoes: [
      {
        titulo: "Verificar Assinatura e Planos",
        passos: [
          "Clique em 'Meu Painel' no rodapé do menu lateral principal",
          "Visualize a situação de sua assinatura atual e data da próxima renovação",
          "Veja quais módulos você possui liberados de acordo com o seu plano",
          "Caso deseje mais recursos, siga até a tela de Planos para um Upgrade",
        ],
        dica: "Para trocar de permissões de usuário (ou cadastrar mais usuários), fale com o suporte ou gerencie no módulo Admin."
      }
    ]
  }
];

// ─── Componente de Passo ──────────────────────────────────────────────
function PassoItem({ texto, numero }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {numero}
      </span>
      <p className="text-sm text-foreground leading-relaxed">{texto}</p>
    </div>
  );
}

// ─── Componente de Seção ──────────────────────────────────────────────
function Secao({ secao }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setAberta(a => !a)}
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {aberta ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" /> : <Circle size={16} className="text-muted-foreground flex-shrink-0" />}
          <span className="text-sm font-semibold text-foreground">{secao.titulo}</span>
        </div>
        {aberta ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
      </button>

      {aberta && (
        <div className="px-5 py-5 space-y-4 border-t border-border">
          {secao.conteudo && (
            <p className="text-sm text-muted-foreground leading-relaxed">{secao.conteudo}</p>
          )}

          {secao.passos?.length > 0 && (
            <div className="space-y-2.5">
              {secao.passos.map((passo, i) => <PassoItem key={i} texto={passo} numero={i + 1} />)}
            </div>
          )}

          {secao.exemplo && (
            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{secao.exemplo.titulo}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{secao.exemplo.descricao}</p>
              <div className="space-y-1.5">
                {secao.exemplo.campos.map((campo, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground w-32 flex-shrink-0 font-medium">{campo.label}:</span>
                    <span className="text-foreground font-semibold">{campo.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {secao.dica && (
            <div className="flex items-start gap-2.5 bg-yellow-500/10/10 border border-yellow-500/20 rounded-lg px-4 py-3">
              <Lightbulb size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300 leading-relaxed"><strong>Dica:</strong> {secao.dica}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente de Módulo ─────────────────────────────────────────────
function CardModulo({ modulo, ativo, onClick }) {
  const Icon = modulo.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
 ${ativo ? `${modulo.bg} ${modulo.border} ${modulo.color}` : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"}`}
    >
      <Icon size={16} className={`flex-shrink-0 ${ativo ? modulo.color : ""}`} />
      <span className="text-sm font-medium truncate">{modulo.titulo}</span>
      {ativo && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
    </button>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────
export default function Manual() {
  const [moduloAtivo, setModuloAtivo] = useState(MODULOS[0].id);
  const [busca, setBusca] = useState("");

  const modulo = MODULOS.find(m => m.id === moduloAtivo);
  const Icon = modulo?.icon;

  const modulosFiltrados = busca
    ? MODULOS.filter(m =>
        m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        m.subtitulo.toLowerCase().includes(busca.toLowerCase()) ||
        m.secoes.some(s => s.titulo.toLowerCase().includes(busca.toLowerCase()))
      )
    : MODULOS;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar do manual */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden hidden lg:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Manual do Usuário</h2>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar módulo..."
              className="w-full bg-muted border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {modulosFiltrados.map(m => (
            <CardModulo key={m.id} modulo={m} ativo={moduloAtivo === m.id && !busca} onClick={() => { setModuloAtivo(m.id); setBusca(""); }} />
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">Lumi ERP · Manual v1.0</p>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        {busca ? (
          <div className="p-6">
            <p className="text-xs text-muted-foreground mb-4">Resultados para: <strong className="text-foreground">"{busca}"</strong></p>
            {modulosFiltrados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
            ) : (
              <div className="space-y-6">
                {modulosFiltrados.map(m => (
                  <div key={m.id}>
                    <button onClick={() => { setModuloAtivo(m.id); setBusca(""); }}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary mb-3 transition-colors">
                      <m.icon size={16} className={m.color} /> {m.titulo} <ArrowRight size={14} />
                    </button>
                    {m.secoes.filter(s => s.titulo.toLowerCase().includes(busca.toLowerCase())).map((s, i) => (
                      <Secao key={i} secao={s} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : modulo ? (
          <div className="p-6 lg:p-8">
            {/* Header do módulo */}
            <div className={`rounded-2xl border p-6 mb-6 ${modulo.bg} ${modulo.border}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-background/30 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className={modulo.color} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{modulo.titulo}</h1>
                    <p className="text-sm text-muted-foreground">{modulo.subtitulo}</p>
                    <p className="text-xs text-muted-foreground mt-1">{modulo.secoes.length} tópico(s) neste módulo</p>
                  </div>
                </div>
                {modulo.path && (
                  <Link
                    to={modulo.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-background/30 hover:bg-background/50 ${modulo.color} border ${modulo.border}`}
                  >
                    Ir para o módulo <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>

            {/* Navegação mobile (select de módulos) */}
            <div className="lg:hidden mb-4">
              <select
                value={moduloAtivo}
                onChange={e => setModuloAtivo(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {MODULOS.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
              </select>
            </div>

            {/* Alerta informativo */}
            <div className="flex items-start gap-2.5 bg-primary/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300 leading-relaxed">
                Clique em cada tópico abaixo para expandir o passo a passo detalhado com exemplos práticos.
              </p>
            </div>

            {/* Seções */}
            <div className="space-y-3">
              {modulo.secoes.map((secao, i) => (
                <Secao key={i} secao={secao} />
              ))}
            </div>

            {/* Rodapé de navegação */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
              {MODULOS.findIndex(m => m.id === moduloAtivo) > 0 ? (
                <button
                  onClick={() => setModuloAtivo(MODULOS[MODULOS.findIndex(m => m.id === moduloAtivo) - 1].id)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  {MODULOS[MODULOS.findIndex(m => m.id === moduloAtivo) - 1].titulo}
                </button>
              ) : <div />}
              {MODULOS.findIndex(m => m.id === moduloAtivo) < MODULOS.length - 1 ? (
                <button
                  onClick={() => setModuloAtivo(MODULOS[MODULOS.findIndex(m => m.id === moduloAtivo) + 1].id)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {MODULOS[MODULOS.findIndex(m => m.id === moduloAtivo) + 1].titulo}
                  <ChevronRight size={14} />
                </button>
              ) : <div />}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}