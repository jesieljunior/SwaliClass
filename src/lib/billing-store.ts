// SwaliClass - Billing & Subscription Engine
// Gerenciador de planos, pacotes de créditos IA, cobranças de mensalidades e checkout integrado via API Asaas.

export type BillingRoleTarget = "student" | "teacher" | "school";

export interface PlanDefinition {
  id: string;
  name: string;
  target: BillingRoleTarget;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  description: string;
  features: string[];
  creditsMonthly: number;
  maxStudents?: number;
  badge?: string;
}

export interface CreditPackage {
  id: string;
  title: string;
  credits: number;
  price: number;
  popular?: boolean;
  bonus?: string;
  description: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  method:
    | "pix"
    | "card"
    | "link"
    | "infinitepay_pix"
    | "infinitepay_card"
    | "infinitepay_link"
    | "asaas_pix"
    | "asaas_card";
  status: "pago" | "processando" | "pendente" | "falha";
  nsu: string;
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  installmentCount?: number;
  asaasPaymentId?: string;
  invoiceUrl?: string;
}

export interface StudentTuitionCharge {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "paga" | "pendente" | "atrasada";
  pixCode: string;
  paymentLink: string;
  paidAt?: string;
  createdAt: string;
  asaasPaymentId?: string;
}

export interface GatewayConfig {
  gatewayName: string;
  environment: "sandbox" | "production";
  autoConfirmSeconds: number;
  pixKeyType: string;
}

// Backward compatibility alias
export type InfinitePayConfig = GatewayConfig;

export const PLANS: PlanDefinition[] = [
  // Planos para Estudantes Autônomos
  {
    id: "student_free",
    name: "Estudante Free",
    target: "student",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Para quem quer testar e dar os primeiros passos de estudo com IA.",
    creditsMonthly: 50,
    features: [
      "50 créditos de Swali AI mensais",
      "Upload de PDFs até 10 páginas",
      "Flashcards e resumos essenciais",
      "Acesso à Biblioteca Comunitária",
      "Comunidade de dúvidas",
    ],
  },
  {
    id: "student_pro",
    name: "Estudante PRO",
    target: "student",
    popular: true,
    badge: "Mais Escolhido para ENEM & Concursos",
    priceMonthly: 29.9,
    priceYearly: 289.0,
    description: "Estudo intensivo sem limites com IA avançada, simulados e análise de erros.",
    creditsMonthly: 1000,
    features: [
      "1.000 créditos de Swali AI renovados todo mês",
      "Upload ilimitado de PDFs e livros completos",
      "Simulados diagnósticos no padrão ENEM, OAB e Concursos",
      "Correção detalhada de redações com nota por competência",
      "Algoritmo de repetição espaçada personalizada",
      "Suporte prioritário e ambiente sem anúncios",
    ],
  },

  // Planos para Professores Particulares
  {
    id: "teacher_solo",
    name: "Professor Autônomo",
    target: "teacher",
    priceMonthly: 49.9,
    priceYearly: 490.0,
    description: "Ideal para professores que ministram aulas particulares e pequenos grupos.",
    creditsMonthly: 500,
    maxStudents: 50,
    features: [
      "Até 3 turmas ativas e 50 alunos cadastrados",
      "Chamada digital com registro em segundos",
      "Lançamento de notas, faltas e tarefas",
      "Envio de materiais e apostilas em PDF direto aos alunos",
      "Emissão de mensalidades automatizada (Pix e Cartão)",
    ],
  },
  {
    id: "teacher_pro",
    name: "Professor PRO",
    target: "teacher",
    popular: true,
    badge: "Essencial para Docentes",
    priceMonthly: 99.9,
    priceYearly: 980.0,
    description: "Gestão completa de múltiplos cursos, simulados e apoio pedagógico com IA.",
    creditsMonthly: 2500,
    maxStudents: 250,
    features: [
      "Turmas ilimitadas (até 250 alunos)",
      "Swali AI para elaboração automática de provas e gabaritos",
      "Correção assistida de redações com critérios customizados",
      "Relatórios de presença e notas em PDF/Excel",
      "Cobrança automatizada com conciliação e recibo fiscal",
      "Canal de suporte direto prioritário",
    ],
  },

  // Planos para Escolas & Instituições
  {
    id: "school_starter",
    name: "Escola Starter",
    target: "school",
    priceMonthly: 249.0,
    priceYearly: 2490.0,
    description: "Para colégios, cursinhos e polos educacionais em crescimento.",
    creditsMonthly: 5000,
    maxStudents: 500,
    features: [
      "Até 500 alunos e 20 professores vinculados",
      "Diário de classe oficial para auditoria MEC",
      "Painel integrado para coordenação e secretaria",
      "Relatórios preditivos de evasão e frequência escolar",
      "Gestão de mensalidades, carnês e controle de inadimplência",
    ],
  },
  {
    id: "school_enterprise",
    name: "Escola Enterprise",
    target: "school",
    popular: true,
    badge: "Redes & Grandes Colégios",
    priceMonthly: 599.0,
    priceYearly: 5990.0,
    description: "Para redes de ensino consolidadas com alto volume de alunos e múltiplas sedes.",
    creditsMonthly: 20000,
    features: [
      "Alunos e professores ilimitados",
      "Multi-unidades e polos distintos na mesma gestão",
      "Integração via API com sistemas legados e ERPs",
      "Conciliação bancária completa com régua de cobrança",
      "Gerente de conta dedicado e SLA garantido",
    ],
  },
];

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "pack_100",
    title: "Pacote Básico",
    credits: 100,
    price: 9.9,
    description: "Ideal para tirar dúvidas rápidas e resumir artigos específicos.",
  },
  {
    id: "pack_300",
    title: "Pacote Intensivo",
    credits: 300,
    price: 22.9,
    popular: true,
    bonus: "+50 bônus",
    description: "Perfeito para semanas de provas, simulados e geração de dezenas de flashcards.",
  },
  {
    id: "pack_1000",
    title: "Pacote Avançado",
    credits: 1000,
    price: 59.9,
    bonus: "+200 bônus",
    description: "Melhor custo-benefício para quem estuda todos os dias com PDFs extensos.",
  },
  {
    id: "pack_2500",
    title: "Pacote Universitário / Concursos",
    credits: 2500,
    price: 129.9,
    bonus: "+600 bônus",
    description: "Capacidade máxima de IA para livros inteiros, teses e simulados completos.",
  },
];

const STORAGE_KEY_SUBSCRIPTION = "swaliclass_subscription_v1";
const STORAGE_KEY_INVOICES = "swaliclass_invoices_v1";
const STORAGE_KEY_TUITIONS = "swaliclass_tuitions_v1";
const STORAGE_KEY_CONFIG = "swaliclass_billing_cfg_v2";

const DEFAULT_CONFIG: GatewayConfig = {
  gatewayName: "Asaas Payments API v3",
  environment: "production",
  autoConfirmSeconds: 4,
  pixKeyType: "EVP / Chave Aleatória",
};

const DEFAULT_INVOICES: InvoiceItem[] = [
  {
    id: "inv-901",
    description: "Assinatura SwaliClass Estudante PRO (Mensal)",
    amount: 29.9,
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    method: "pix",
    status: "pago",
    nsu: "AUT-89214710",
    receiptNumber: "REC-2026-00412",
    customerName: "Lucas Henrique Silva",
    customerEmail: "estudante@swaliclass.com",
    asaasPaymentId: "pay_982147103982",
    invoiceUrl: "https://www.asaas.com/i/pay_982147103982",
  },
  {
    id: "inv-842",
    description: "Recarga de 300 Créditos Swali AI",
    amount: 22.9,
    date: new Date(Date.now() - 14 * 86400000).toISOString(),
    method: "card",
    status: "pago",
    installmentCount: 1,
    nsu: "AUT-77319402",
    receiptNumber: "REC-2026-00388",
    customerName: "Lucas Henrique Silva",
    customerEmail: "estudante@swaliclass.com",
    asaasPaymentId: "pay_773194021154",
    invoiceUrl: "https://www.asaas.com/i/pay_773194021154",
  },
];

const DEFAULT_TUITIONS: StudentTuitionCharge[] = [
  {
    id: "tui-1",
    studentId: "s1",
    studentName: "Ana Clara Souza",
    studentEmail: "ana.souza@email.com",
    title: "Mensalidade Escolar — Outubro/2026",
    amount: 320.0,
    dueDate: "2026-10-10",
    status: "paga",
    pixCode:
      "00020126580014br.gov.bcb.pix0136asaas-tui-15204000053039865802BR5915SwaliClass6009Sao Paulo62070503***6304E8A2",
    paymentLink: "https://www.asaas.com/i/pay_tui_1",
    paidAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    asaasPaymentId: "pay_tui_1",
  },
  {
    id: "tui-2",
    studentId: "s2",
    studentName: "Bruno Oliveira",
    studentEmail: "bruno.oliveira@email.com",
    title: "Mensalidade Escolar — Outubro/2026",
    amount: 320.0,
    dueDate: "2026-10-15",
    status: "pendente",
    pixCode:
      "00020126580014br.gov.bcb.pix0136asaas-tui-25204000053039865802BR5915SwaliClass6009Sao Paulo62070503***6304A1B9",
    paymentLink: "https://www.asaas.com/i/pay_tui_2",
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    asaasPaymentId: "pay_tui_2",
  },
  {
    id: "tui-3",
    studentId: "s3",
    studentName: "Carla Mendes",
    studentEmail: "carla.mendes@email.com",
    title: "Taxa de Material e Apostila 2º Semestre",
    amount: 150.0,
    dueDate: "2026-10-05",
    status: "atrasada",
    pixCode:
      "00020126580014br.gov.bcb.pix0136asaas-tui-35204000053039865802BR5915SwaliClass6009Sao Paulo62070503***6304C92E",
    paymentLink: "https://www.asaas.com/i/pay_tui_3",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    asaasPaymentId: "pay_tui_3",
  },
];

export const billingStore = {
  getCurrentSubscription() {
    if (typeof window === "undefined") {
      return {
        planId: "student_free",
        cycle: "monthly" as "monthly" | "yearly",
        status: "ativo",
        renewsAt: new Date(Date.now() + 27 * 86400000).toISOString(),
      };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      if (!stored) {
        const isStudent =
          localStorage.getItem("bitrahub:view-mode") === "student" ||
          localStorage.getItem("swali_active_role") === "student";
        const initial = {
          planId: isStudent ? "student_free" : "school_starter",
          cycle: "monthly" as "monthly" | "yearly",
          status: "ativo",
          renewsAt: new Date(Date.now() + 27 * 86400000).toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(stored);
    } catch {
      return {
        planId: "student_free",
        cycle: "monthly" as "monthly" | "yearly",
        status: "ativo",
        renewsAt: new Date(Date.now() + 27 * 86400000).toISOString(),
      };
    }
  },

  setPlan(planId: string, cycle: "monthly" | "yearly" = "monthly") {
    const updated = {
      planId,
      cycle,
      status: "ativo",
      renewsAt: new Date(Date.now() + (cycle === "yearly" ? 365 : 30) * 86400000).toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(updated));
      window.dispatchEvent(new Event("swaliclass_billing_updated"));
    }
    return updated;
  },

  getInvoices(): InvoiceItem[] {
    if (typeof window === "undefined") return DEFAULT_INVOICES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(DEFAULT_INVOICES));
        return DEFAULT_INVOICES;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_INVOICES;
    }
  },

  addInvoice(invoice: Omit<InvoiceItem, "id" | "date" | "nsu" | "receiptNumber">): InvoiceItem {
    const fullInvoice: InvoiceItem = {
      ...invoice,
      id: `inv-${Date.now()}`,
      date: new Date().toISOString(),
      nsu: invoice.asaasPaymentId
        ? `ASAAS-${invoice.asaasPaymentId.replace(/\D/g, "").slice(0, 8) || Math.floor(10000000 + Math.random() * 90000000)}`
        : `AUT-${Math.floor(10000000 + Math.random() * 90000000)}`,
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    if (typeof window !== "undefined") {
      const current = this.getInvoices();
      current.unshift(fullInvoice);
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(current));
      window.dispatchEvent(new Event("swaliclass_billing_updated"));
    }

    return fullInvoice;
  },

  getTuitionCharges(): StudentTuitionCharge[] {
    if (typeof window === "undefined") return DEFAULT_TUITIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TUITIONS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_TUITIONS, JSON.stringify(DEFAULT_TUITIONS));
        return DEFAULT_TUITIONS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_TUITIONS;
    }
  },

  createTuitionCharge(
    data: Omit<StudentTuitionCharge, "id" | "createdAt" | "pixCode" | "paymentLink"> & {
      pixCode?: string;
      paymentLink?: string;
      asaasPaymentId?: string;
    },
  ): StudentTuitionCharge {
    const id = `tui-${Date.now()}`;
    const paymentId = data.asaasPaymentId || `pay_${id}`;
    const charge: StudentTuitionCharge = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      pixCode:
        data.pixCode ||
        `00020126580014br.gov.bcb.pix0136asaas-${paymentId}5204000053039865802BR5915SwaliClass6009Sao Paulo62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      paymentLink: data.paymentLink || `https://www.asaas.com/i/${paymentId}`,
      asaasPaymentId: paymentId,
    };

    if (typeof window !== "undefined") {
      const list = this.getTuitionCharges();
      list.unshift(charge);
      localStorage.setItem(STORAGE_KEY_TUITIONS, JSON.stringify(list));
      window.dispatchEvent(new Event("swaliclass_billing_updated"));
    }

    return charge;
  },

  markTuitionPaid(chargeId: string) {
    if (typeof window !== "undefined") {
      const list = this.getTuitionCharges();
      const updated = list.map((item) =>
        item.id === chargeId
          ? { ...item, status: "paga" as const, paidAt: new Date().toISOString() }
          : item,
      );
      localStorage.setItem(STORAGE_KEY_TUITIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event("swaliclass_billing_updated"));
    }
  },

  getConfig(): GatewayConfig {
    if (typeof window === "undefined") return DEFAULT_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  updateConfig(cfg: Partial<GatewayConfig>) {
    if (typeof window !== "undefined") {
      const current = this.getConfig();
      const merged = { ...current, ...cfg };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
      window.dispatchEvent(new Event("swaliclass_billing_updated"));
      return merged;
    }
    return DEFAULT_CONFIG;
  },
};
