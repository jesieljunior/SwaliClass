import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CreditCard,
  QrCode,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Building2,
  GraduationCap,
  UserRound,
  FileText,
  Settings,
  Plus,
  Coins,
  Receipt,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  billingStore,
  PLANS,
  CREDIT_PACKAGES,
  type PlanDefinition,
  type CreditPackage,
  type InvoiceItem,
  type StudentTuitionCharge,
  type GatewayConfig,
} from "@/lib/billing-store";
import { creditsStore, type CreditBalances } from "@/lib/credits-store";
import { useSession } from "@/hooks/use-session";
import { useViewMode } from "@/lib/view-mode";
import { SecureCheckoutModal, type CheckoutItem } from "@/components/infinitepay-checkout-modal";

export const Route = createFileRoute("/_authenticated/app/cobranca")({
  head: () => ({
    meta: [
      { title: "Planos, Créditos & Cobrança — SwaliClass" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CobrancaPage,
});

function CobrancaPage() {
  const session = useSession().data;
  const { isStudent } = useViewMode();
  const isActualStudent = isStudent || (session?.isAluno && !session?.isStaff);

  const [activeTab, setActiveTab] = useState<
    "plans" | "credits" | "tuitions" | "invoices" | "settings"
  >("plans");

  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [subscription, setSubscription] = useState(billingStore.getCurrentSubscription());
  const [invoices, setInvoices] = useState<InvoiceItem[]>(billingStore.getInvoices());
  const [tuitions, setTuitions] = useState<StudentTuitionCharge[]>(
    billingStore.getTuitionCharges(),
  );
  const [config, setConfig] = useState<GatewayConfig>(billingStore.getConfig());
  const [balances, setBalances] = useState<CreditBalances>(creditsStore.getBalances());

  // Modal checkout
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  // New tuition modal
  const [newTuitionOpen, setNewTuitionOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [tuitionTitle, setTuitionTitle] = useState("Mensalidade Escolar — Novembro/2026");
  const [tuitionAmount, setTuitionAmount] = useState("320.00");
  const [tuitionDueDate, setTuitionDueDate] = useState("2026-11-10");

  // Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<InvoiceItem | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setSubscription(billingStore.getCurrentSubscription());
      setInvoices(billingStore.getInvoices());
      setTuitions(billingStore.getTuitionCharges());
      setConfig(billingStore.getConfig());
      setBalances(creditsStore.getBalances());
    };

    window.addEventListener("swaliclass_billing_updated", handleUpdate);
    window.addEventListener("swaliclass_credits_updated", handleUpdate);
    return () => {
      window.removeEventListener("swaliclass_billing_updated", handleUpdate);
      window.removeEventListener("swaliclass_credits_updated", handleUpdate);
    };
  }, []);

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const currentPlan = PLANS.find((p) => p.id === subscription.planId) || PLANS[0];

  const handleOpenPlanCheckout = (plan: PlanDefinition) => {
    const amount = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    if (amount === 0) {
      billingStore.setPlan(plan.id, cycle);
      return;
    }
    setCheckoutItem({
      type: "plan",
      id: plan.id,
      title: `Plano ${plan.name} (${cycle === "yearly" ? "Anual" : "Mensal"})`,
      description: plan.description,
      amount,
      creditsToAdd: plan.creditsMonthly,
      cycle,
      customerEmail: session?.email || "usuario@swaliclass.com",
      customerName: session?.fullName || "Usuário SwaliClass",
    });
    setCheckoutModalOpen(true);
  };

  const handleOpenCreditsCheckout = (pkg: CreditPackage) => {
    setCheckoutItem({
      type: "credits",
      id: pkg.id,
      title: `${pkg.title} (+${pkg.credits} Créditos Swali AI)`,
      description: pkg.description,
      amount: pkg.price,
      creditsToAdd: pkg.credits,
      customerEmail: session?.email || "usuario@swaliclass.com",
      customerName: session?.fullName || "Usuário SwaliClass",
    });
    setCheckoutModalOpen(true);
  };

  const handlePayTuition = (charge: StudentTuitionCharge) => {
    setCheckoutItem({
      type: "tuition",
      id: charge.id,
      title: charge.title,
      description: `Pagamento de mensalidade para ${charge.studentName}`,
      amount: charge.amount,
      studentChargeId: charge.id,
      customerEmail: charge.studentEmail,
      customerName: charge.studentName,
    });
    setCheckoutModalOpen(true);
  };

  const handleCreateTuition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) return;

    billingStore.createTuitionCharge({
      studentId: `st-${Date.now()}`,
      studentName,
      studentEmail,
      title: tuitionTitle,
      amount: parseFloat(tuitionAmount) || 100,
      dueDate: tuitionDueDate,
      status: "pendente",
    });

    setNewTuitionOpen(false);
    setStudentName("");
    setStudentEmail("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Ambiente Seguro · Pix & Cartão
            </span>
            <span className="text-xs text-navy-800/50">Baixa Instantânea</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-navy-900">
            Planos, Créditos & Cobrança
          </h1>
          <p className="text-xs text-navy-800/60 mt-0.5">
            Gerencie sua assinatura, recarregue créditos de IA ou emita cobranças para alunos com
            conciliação automática.
          </p>
        </div>

        {/* Resumo rápido do saldo e plano atual */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white border border-border-subtle shadow-xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-400/20 text-amber-700 grid place-items-center">
              <Coins className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-navy-800/50">Saldo Swali AI</p>
              <p className="font-display font-bold text-base text-navy-900">
                {balances.total}{" "}
                <span className="text-xs font-normal text-navy-800/60">créditos</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-navy-900 text-paper shadow-xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-navy-800 border border-white/10 text-emerald-400 grid place-items-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-paper/60">Plano Atual</p>
              <p className="font-display font-bold text-base text-emerald-300">
                {currentPlan.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-subtle pb-px text-xs font-mono">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "plans"
              ? "border-navy-900 text-navy-950 bg-white"
              : "border-transparent text-navy-800/60 hover:text-navy-900 hover:bg-surface-hover"
          }`}
        >
          <Sparkles className="size-4 text-amber-500" />
          <span>Planos & Assinaturas</span>
        </button>

        <button
          onClick={() => setActiveTab("credits")}
          className={`px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "credits"
              ? "border-navy-900 text-navy-950 bg-white"
              : "border-transparent text-navy-800/60 hover:text-navy-900 hover:bg-surface-hover"
          }`}
        >
          <Coins className="size-4 text-emerald-500" />
          <span>Recarga de Créditos IA</span>
        </button>

        <button
          onClick={() => setActiveTab("tuitions")}
          className={`px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "tuitions"
              ? "border-navy-900 text-navy-950 bg-white"
              : "border-transparent text-navy-800/60 hover:text-navy-900 hover:bg-surface-hover"
          }`}
        >
          <Receipt className="size-4 text-sky-500" />
          <span>Cobranças & Mensalidades</span>
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "invoices"
              ? "border-navy-900 text-navy-950 bg-white"
              : "border-transparent text-navy-800/60 hover:text-navy-900 hover:bg-surface-hover"
          }`}
        >
          <FileText className="size-4 text-zinc-500" />
          <span>Faturas & Comprovantes</span>
        </button>

        {!isActualStudent && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-t-lg font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "settings"
                ? "border-navy-900 text-navy-950 bg-white"
                : "border-transparent text-navy-800/60 hover:text-navy-900 hover:bg-surface-hover"
            }`}
          >
            <Settings className="size-4 text-navy-600" />
            <span>Configurações de Pagamento</span>
          </button>
        )}
      </div>

      {/* ABA 1: PLANOS & ASSINATURAS */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {/* Seletor Mensal / Anual */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={`text-xs font-mono ${cycle === "monthly" ? "font-bold text-navy-900" : "text-navy-800/50"}`}
            >
              Faturamento Mensal
            </span>
            <button
              type="button"
              onClick={() => setCycle(cycle === "monthly" ? "yearly" : "monthly")}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                cycle === "yearly" ? "bg-emerald-500" : "bg-navy-800/20"
              }`}
            >
              <span
                className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${
                  cycle === "yearly" ? "left-7" : "left-1"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-mono ${cycle === "yearly" ? "font-bold text-navy-900" : "text-navy-800/50"}`}
              >
                Faturamento Anual
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Até 20% OFF
              </span>
            </div>
          </div>

          {/* Cards dos Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
              const isCurrent = subscription.planId === plan.id;
              const price = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    plan.popular
                      ? "bg-white border-navy-900 shadow-md ring-2 ring-emerald-400/40"
                      : "bg-white border-border-subtle hover:border-navy-800/30 shadow-xs"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {plan.badge && (
                          <span className="inline-block text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                            {plan.badge}
                          </span>
                        )}
                        <h3 className="font-display font-bold text-lg text-navy-900">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-navy-800/60 mt-1">{plan.description}</p>
                      </div>

                      {plan.target === "student" && (
                        <div className="size-8 rounded-lg bg-sky-100 text-sky-700 grid place-items-center shrink-0">
                          <GraduationCap className="size-4" />
                        </div>
                      )}
                      {plan.target === "teacher" && (
                        <div className="size-8 rounded-lg bg-indigo-100 text-indigo-700 grid place-items-center shrink-0">
                          <UserRound className="size-4" />
                        </div>
                      )}
                      {plan.target === "school" && (
                        <div className="size-8 rounded-lg bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                          <Building2 className="size-4" />
                        </div>
                      )}
                    </div>

                    {/* Preço */}
                    <div className="pt-2 border-t border-border-subtle">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display font-extrabold text-3xl text-navy-900">
                          {price === 0 ? "Grátis" : formatMoney(price)}
                        </span>
                        {price > 0 && (
                          <span className="text-xs font-mono text-navy-800/50">
                            {cycle === "yearly" ? "/ano" : "/mês"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                        <Sparkles className="size-3 text-emerald-600" />
                        {plan.creditsMonthly.toLocaleString("pt-BR")} créditos de IA inclusos / mês
                      </p>
                    </div>

                    {/* Lista de Recursos */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-mono uppercase text-navy-800/50 tracking-wider">
                        O que está incluso:
                      </p>
                      <ul className="space-y-1.5 text-xs text-navy-800/80">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border-subtle">
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span>Plano Ativo no Momento</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenPlanCheckout(plan)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          plan.popular
                            ? "bg-navy-900 hover:bg-navy-800 text-paper"
                            : "bg-surface-hover hover:bg-surface border border-border-subtle text-navy-900"
                        }`}
                      >
                        <ShieldCheck className="size-4 text-emerald-400" />
                        <span>
                          {price === 0 ? "Selecionar Grátis" : "Contratar com Pix ou Cartão"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: RECARGA DE CRÉDITOS IA */}
      {activeTab === "credits" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 rounded-2xl p-6 text-paper flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full text-amber-300 font-bold inline-flex items-center gap-1">
                <Sparkles className="size-3" /> Swali AI Tokens
              </span>
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-white">
                Turbine seu aprendizado e elaboração de provas
              </h2>
              <p className="text-xs text-paper/70 max-w-xl">
                Os créditos de Swali AI são utilizados para resumir livros e PDFs de centenas de
                páginas, corrigir redações no padrão oficial, criar simulados inéditos e tirar
                dúvidas 24h.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-center shrink-0 min-w-44">
              <p className="text-[10px] font-mono uppercase text-paper/60">Seu Saldo Total</p>
              <p className="font-display font-extrabold text-3xl text-amber-400 mt-1">
                {balances.total}
              </p>
              <p className="text-[10px] text-paper/50 mt-1">
                {balances.plan} de plano + {balances.purchased} avulsos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  pkg.popular
                    ? "border-navy-900 shadow-md ring-2 ring-emerald-400/40"
                    : "border-border-subtle hover:border-navy-800/30 shadow-xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-navy-600 uppercase tracking-wider">
                      {pkg.title}
                    </span>
                    {pkg.bonus && (
                      <span className="text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {pkg.bonus}
                      </span>
                    )}
                  </div>

                  <div className="py-2 border-y border-border-subtle flex items-baseline justify-between">
                    <div className="flex items-center gap-1.5 text-navy-900">
                      <Coins className="size-4 text-amber-500" />
                      <span className="font-display font-extrabold text-2xl">+{pkg.credits}</span>
                    </div>
                    <span className="font-display font-bold text-xl text-emerald-700">
                      {formatMoney(pkg.price)}
                    </span>
                  </div>

                  <p className="text-xs text-navy-800/70 leading-relaxed">{pkg.description}</p>
                </div>

                <button
                  onClick={() => handleOpenCreditsCheckout(pkg)}
                  className="mt-5 w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-paper rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Zap className="size-3.5 text-amber-400" />
                  <span>Recarregar Agora</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: COBRANÇAS & MENSALIDADES DE ALUNOS */}
      {activeTab === "tuitions" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-navy-900">
                Cobranças de Mensalidades & Taxas
              </h3>
              <p className="text-xs text-navy-800/60 mt-0.5">
                Emita cobranças avulsas ou recorrentes com chave Pix e link de pagamento individual
                para alunos.
              </p>
            </div>

            <button
              onClick={() => setNewTuitionOpen(true)}
              className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-paper rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="size-4 text-emerald-400" />
              <span>Nova Cobrança</span>
            </button>
          </div>

          <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface border-b border-border-subtle text-navy-800/60 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Aluno / Sacado</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5">Vencimento</th>
                    <th className="p-3.5">Valor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {tuitions.map((tui) => (
                    <tr key={tui.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-navy-900">{tui.studentName}</div>
                        <div className="text-[11px] text-navy-800/50">{tui.studentEmail}</div>
                      </td>
                      <td className="p-3.5 text-navy-800">{tui.title}</td>
                      <td className="p-3.5 text-navy-800/70">
                        {new Date(tui.dueDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3.5 font-bold text-navy-900">{formatMoney(tui.amount)}</td>
                      <td className="p-3.5">
                        {tui.status === "paga" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            <Check className="size-3" /> Paga
                          </span>
                        )}
                        {tui.status === "pendente" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                            <Clock className="size-3" /> Aguardando
                          </span>
                        )}
                        {tui.status === "atrasada" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                            <AlertCircle className="size-3" /> Em Atraso
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {tui.status !== "paga" ? (
                          <button
                            onClick={() => handlePayTuition(tui)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Pagar Agora
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Baixa Realizada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: FATURAS & COMPROVANTES */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-navy-900">
              Histórico de Pagamentos & Comprovantes
            </h3>
            <p className="text-xs text-navy-800/60 mt-0.5">
              Consulte faturas aprovadas, códigos de autenticação e recibos fiscais.
            </p>
          </div>

          <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface border-b border-border-subtle text-navy-800/60 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Recibo</th>
                  <th className="p-3.5">Descrição</th>
                  <th className="p-3.5">Data/Hora</th>
                  <th className="p-3.5">Método</th>
                  <th className="p-3.5">Valor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="p-3.5 font-bold text-navy-900">{inv.receiptNumber}</td>
                    <td className="p-3.5 text-navy-800">{inv.description}</td>
                    <td className="p-3.5 text-navy-800/70">
                      {new Date(inv.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3.5 uppercase text-[10px]">
                      {inv.method.includes("pix") ? "Pix Instantâneo" : "Cartão de Crédito"}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700">{formatMoney(inv.amount)}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        <Check className="size-3" /> Aprovado
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(inv)}
                        className="px-2.5 py-1 bg-surface border border-border-subtle hover:bg-surface-hover text-navy-900 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Ver Recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 5: CONFIGURAÇÕES DE PAGAMENTO */}
      {activeTab === "settings" && !isActualStudent && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display font-bold text-lg text-navy-900">
              Configurações do Gateway de Pagamento
            </h3>
            <p className="text-xs text-navy-800/60 mt-0.5">
              Status da integração de pagamentos e conciliação bancária segura via API.
            </p>
          </div>

          <div className="bg-white border border-border-subtle rounded-2xl p-6 space-y-4 max-w-2xl shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <p className="font-display font-bold text-sm text-navy-900">
                  Status do Gateway Integrado
                </p>
                <p className="text-xs text-navy-800/60 mt-0.5">
                  Conexão criptografada homologada para Pix e Cartão de Crédito.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-mono font-bold border border-emerald-300 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                Ativo em Produção
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                  Engine de Faturamento
                </label>
                <input
                  type="text"
                  readOnly
                  value="Asaas Payments API v3 (Homologada)"
                  className="w-full h-9 px-3 bg-surface border border-border-subtle rounded-lg text-xs font-mono text-navy-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                  Chave Pix / Tipo de Recebimento
                </label>
                <input
                  type="text"
                  readOnly
                  value="Chave Aleatória EVP / Notificações Webhook Ativas"
                  className="w-full h-9 px-3 bg-surface border border-border-subtle rounded-lg text-xs font-mono text-navy-900 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Webhooks e baixa automática ativos. As transferências Pix e aprovações de cartão
                  são creditadas e conciliadas em tempo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT SEGURO */}
      <SecureCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        item={checkoutItem}
      />

      {/* MODAL DE NOVA COBRANÇA PARA ALUNO */}
      {newTuitionOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border-subtle max-w-md w-full p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-navy-900">
              Emitir Nova Cobrança de Aluno
            </h3>

            <form onSubmit={handleCreateTuition} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-navy-800/60 mb-1">
                  Nome do Aluno
                </label>
                <input
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ex: Gabriel Martins"
                  className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-navy-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-navy-800/60 mb-1">
                  E-mail do Aluno / Responsável
                </label>
                <input
                  required
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="gabriel.martins@email.com"
                  className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-navy-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-navy-800/60 mb-1">
                  Título da Cobrança
                </label>
                <input
                  required
                  value={tuitionTitle}
                  onChange={(e) => setTuitionTitle(e.target.value)}
                  placeholder="Ex: Mensalidade Escolar"
                  className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-navy-800/60 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={tuitionAmount}
                    onChange={(e) => setTuitionAmount(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-navy-800/60 mb-1">
                    Vencimento
                  </label>
                  <input
                    required
                    type="date"
                    value={tuitionDueDate}
                    onChange={(e) => setTuitionDueDate(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewTuitionOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-navy-800/60 hover:text-navy-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-paper rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Gerar Cobrança Pix & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO / COMPROVANTE */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border-subtle max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-600" />
                <span className="font-display font-bold text-sm text-navy-900">
                  Comprovante de Pagamento
                </span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-navy-800/60 hover:text-navy-900 cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-navy-800/50">Comprovante:</span>
                <span className="font-bold text-navy-900">{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-800/50">Autenticação:</span>
                <span className="text-navy-900">{selectedReceipt.nsu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-800/50">Data/Hora:</span>
                <span className="text-navy-900">
                  {new Date(selectedReceipt.date).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-800/50">Canal:</span>
                <span className="text-navy-900 font-bold">
                  {selectedReceipt.method.includes("pix") ? "Pix Instantâneo" : "Cartão de Crédito"}
                </span>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-2 text-sm">
                <span className="text-navy-900 font-bold">Valor Total:</span>
                <span className="font-extrabold text-emerald-700">
                  {formatMoney(selectedReceipt.amount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-paper font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Imprimir / Fechar Recibo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
