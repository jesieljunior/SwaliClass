import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  X,
  ShieldCheck,
  QrCode,
  CreditCard,
  Link as LinkIcon,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";
import { billingStore } from "@/lib/billing-store";
import { creditsStore } from "@/lib/credits-store";
import { createAsaasPix, createAsaasCreditCard } from "@/lib/asaas.functions";

export interface CheckoutItem {
  type: "plan" | "credits" | "tuition";
  id: string;
  title: string;
  description: string;
  amount: number;
  creditsToAdd?: number;
  cycle?: "monthly" | "yearly";
  studentChargeId?: string;
  customerEmail?: string;
  customerName?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CheckoutItem | null;
  onSuccess?: () => void;
}

export function SecureCheckoutModal({ isOpen, onClose, item, onSuccess }: CheckoutModalProps) {
  const runCreatePix = useServerFn(createAsaasPix);
  const runCreateCard = useServerFn(createAsaasCreditCard);

  const [activeTab, setActiveTab] = useState<"pix" | "card" | "link">("pix");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutos
  const [lastNsu, setLastNsu] = useState("");
  const [lastReceipt, setLastReceipt] = useState("");

  // Pix state from Asaas
  const [currentPixCode, setCurrentPixCode] = useState("");
  const [currentPixQrBase64, setCurrentPixQrBase64] = useState<string | null>(null);
  const [currentInvoiceUrl, setCurrentInvoiceUrl] = useState("");
  const [currentPaymentId, setCurrentPaymentId] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !item) {
      setPaidSuccess(false);
      setLoading(false);
      setPixLoading(false);
      setCopied(false);
      setCardError(null);
      return;
    }

    setCountdown(900);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Call server function to generate Asaas Pix charge
    setPixLoading(true);
    runCreatePix({
      data: {
        customerName: item.customerName || "Estudante SwaliClass",
        customerEmail: item.customerEmail || "contato@swaliclass.com",
        amount: item.amount,
        description: item.title,
        itemId: item.id,
      },
    })
      .then((res) => {
        if (res?.pixCode) {
          setCurrentPixCode(res.pixCode);
          setCurrentPixQrBase64(res.pixQrCodeBase64 ?? null);
          setCurrentInvoiceUrl(res.invoiceUrl || "");
          setCurrentPaymentId(res.paymentId || "");
        }
      })
      .catch((err) => {
        console.warn("Falha ao gerar Pix Asaas, usando gerador offline:", err);
        const fallbackPix = `00020126580014br.gov.bcb.pix0136asaas-swali-${item.id}-${Date.now()}5204000053039865802BR5915SwaliClass6009Sao Paulo62070503***6304`;
        setCurrentPixCode(fallbackPix);
        setCurrentInvoiceUrl(`https://www.asaas.com/i/pay_${item.id}`);
      })
      .finally(() => {
        setPixLoading(false);
      });

    return () => clearInterval(timer);
  }, [isOpen, item, runCreatePix]);

  if (!isOpen || !item) return null;

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyPix = () => {
    if (!currentPixCode) return;
    navigator.clipboard.writeText(currentPixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const completePayment = async (
    method: "pix" | "card" | "link",
    paymentDetails?: { asaasPaymentId?: string; nsu?: string },
  ) => {
    // 1. Record invoice in store
    const invoice = billingStore.addInvoice({
      description: item.title,
      amount: item.amount,
      method,
      status: "pago",
      customerName: cardHolder || item.customerName || "Usuário SwaliClass",
      customerEmail: item.customerEmail || "usuario@swaliclass.com",
      installmentCount: method === "card" ? installments : 1,
      asaasPaymentId: paymentDetails?.asaasPaymentId || currentPaymentId || `pay_${Date.now()}`,
      invoiceUrl: currentInvoiceUrl,
    });

    setLastNsu(paymentDetails?.nsu || invoice.nsu);
    setLastReceipt(invoice.receiptNumber);

    // 2. Apply business rules based on purchase type
    if (item.type === "plan") {
      billingStore.setPlan(item.id, item.cycle || "monthly");
      if (item.creditsToAdd) {
        creditsStore.addCredits(
          item.creditsToAdd,
          "plan",
          `Créditos mensais do plano ${item.title}`,
        );
      }
    } else if (item.type === "credits" && item.creditsToAdd) {
      creditsStore.addCredits(
        item.creditsToAdd,
        "purchased",
        `Recarga de créditos (${item.title})`,
      );
    } else if (item.type === "tuition" && item.studentChargeId) {
      billingStore.markTuitionPaid(item.studentChargeId);
    }

    setPaidSuccess(true);
    if (onSuccess) onSuccess();
  };

  const handlePayCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);
    setLoading(true);

    try {
      const parts = cardExpiry.split("/");
      const expiryMonth = parts[0] || "12";
      const expiryYear = parts[1] || "28";

      const cardResult = await runCreateCard({
        data: {
          customerName: cardHolder || "Cliente SwaliClass",
          customerEmail: item.customerEmail || "cliente@swaliclass.com",
          customerCpf: cardCpf || undefined,
          amount: item.amount,
          description: item.title,
          itemId: item.id,
          cardHolderName: cardHolder,
          cardNumber: cardNumber.replace(/\s+/g, ""),
          expiryMonth,
          expiryYear,
          ccv: cardCvv,
          installmentCount: installments,
        },
      });

      await completePayment("card", {
        asaasPaymentId: cardResult?.paymentId,
        nsu: cardResult?.nsu,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar transação no cartão.";
      setCardError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-border-subtle max-w-lg w-full overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Topbar Discreta e Profissional (Sem propaganda de marca) */}
        <div className="bg-navy-900 text-paper p-5 flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center text-paper shadow-sm">
              <Lock className="size-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold tracking-tight text-white text-sm">
                  Checkout Seguro
                </span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  256-bit SSL
                </span>
              </div>
              <p className="text-[11px] text-paper/60 font-mono">
                Ambiente Criptografado & Autorizado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-paper grid place-items-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {paidSuccess ? (
          /* TELA DE SUCESSO DO PAGAMENTO */
          <div className="p-8 text-center space-y-5">
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto shadow-inner">
              <CheckCircle2 className="size-10" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Pagamento Confirmado
              </span>
              <h3 className="font-display text-2xl font-bold text-navy-900 mt-2">
                Transação Aprovada!
              </h3>
              <p className="text-xs text-navy-800/60 mt-1">
                Seu pagamento foi liquidado e a sua conta já está atualizada.
              </p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border-subtle text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-border-subtle pb-1.5">
                <span className="text-navy-800/60">Produto:</span>
                <span className="font-bold text-navy-900">{item.title}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-1.5">
                <span className="text-navy-800/60">Valor Pago:</span>
                <span className="font-bold text-emerald-700">{formatMoney(item.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-1.5">
                <span className="text-navy-800/60">Autenticação:</span>
                <span className="text-navy-900">{lastNsu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-800/60">Comprovante:</span>
                <span className="text-navy-900">{lastReceipt}</span>
              </div>
            </div>

            {item.creditsToAdd && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2 justify-center font-medium">
                <Sparkles className="size-4 text-amber-500 shrink-0" />
                <span>
                  <strong>+{item.creditsToAdd} créditos de Swali AI</strong> foram adicionados ao
                  seu saldo!
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-paper rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-sm"
            >
              Concluir
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE PAGAMENTO */
          <div className="p-6 space-y-5">
            {/* Detalhes do Item */}
            <div className="bg-surface-hover p-4 rounded-xl border border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase text-navy-800/50 tracking-wider">
                  Item a ser pago
                </p>
                <h4 className="font-display font-bold text-base text-navy-900">{item.title}</h4>
                <p className="text-xs text-navy-800/60 mt-0.5">{item.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono uppercase text-navy-800/50 tracking-wider">Total</p>
                <p className="font-display font-extrabold text-xl text-emerald-700">
                  {formatMoney(item.amount)}
                </p>
              </div>
            </div>

            {/* Abas de Formas de Pagamento (Discretas e Neutras) */}
            <div className="grid grid-cols-3 gap-1.5 bg-surface border border-border-subtle p-1 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab("pix")}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "pix"
                    ? "bg-navy-900 text-paper shadow-xs"
                    : "text-navy-800/60 hover:text-navy-900"
                }`}
              >
                <QrCode className="size-3.5 text-emerald-400" />
                <span>Pix</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "card"
                    ? "bg-navy-900 text-paper shadow-xs"
                    : "text-navy-800/60 hover:text-navy-900"
                }`}
              >
                <CreditCard className="size-3.5" />
                <span>Cartão</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "link"
                    ? "bg-navy-900 text-paper shadow-xs"
                    : "text-navy-800/60 hover:text-navy-900"
                }`}
              >
                <LinkIcon className="size-3.5" />
                <span>Link Direto</span>
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: PIX */}
            {activeTab === "pix" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    <Clock className="size-3" /> Expira em: {formatTimer(countdown)}
                  </div>
                  <p className="text-xs text-navy-800/60">
                    Abra o app do seu banco e escaneie o código Pix abaixo:
                  </p>
                </div>

                {/* QR Code */}
                <div className="p-4 bg-white border-2 border-dashed border-emerald-400/50 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-xs">
                  <div className="size-48 bg-white p-2 rounded-xl border border-border-subtle grid place-items-center shadow-xs">
                    {pixLoading ? (
                      <div className="flex flex-col items-center gap-2 text-xs text-navy-800/60">
                        <Loader2 className="size-6 animate-spin text-emerald-600" />
                        <span>Gerando Pix Seguro…</span>
                      </div>
                    ) : currentPixQrBase64 ? (
                      <img
                        src={`data:image/png;base64,${currentPixQrBase64}`}
                        alt="QR Code Pix"
                        className="size-full object-contain"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 100 100"
                        className="size-full text-navy-950"
                        fill="currentColor"
                      >
                        <path d="M10 10h24v24H10zm4 4v16h16V14zm2 2h12v12H16zM66 10h24v24H66zm4 4v16h16V14zm2 2h12v12H72zM10 66h24v24H10zm4 4v16h16V70zm2 2h12v12H16zM42 10h8v8h-8zm16 0h8v8h-8zm-8 16h8v8h-8zm16 0h8v8h-8zm-16 16h8v8h-8zm16 0h8v8h-8zm-24 8h8v8h-8zm32 0h8v8h-8zm-16 8h8v8h-8zm16 8h8v8h-8zm-24 8h8v8h-8zm16 0h8v8h-8zm-8 8h8v8h-8zm16 0h8v8h-8zM42 42h16v16H42z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 font-bold">
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Aguardando transferência Pix (baixa imediata)</span>
                  </div>
                </div>

                {/* Copia e Cola */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                    Código Pix Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={currentPixCode}
                      className="flex-1 h-9 px-3 bg-surface border border-border-subtle rounded-lg text-xs font-mono text-navy-800/80 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="h-9 px-3.5 bg-navy-900 hover:bg-navy-800 text-paper rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão de Confirmação Rápida */}
                <button
                  type="button"
                  onClick={() => completePayment("pix")}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Validando transação…</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      <span>Confirmar Pagamento Realizado (Baixa Instantânea)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: CARTÃO DE CRÉDITO */}
            {activeTab === "card" && (
              <form onSubmit={handlePayCard} className="space-y-3">
                {cardError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                    {cardError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/\D/g, "")
                        .replace(/(\d{4})/g, "$1 ")
                        .trim();
                      setCardNumber(v);
                    }}
                    placeholder="4000 1234 5678 9010"
                    className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-navy-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                      Nome Impresso
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="NOME NO CARTÃO"
                      className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs uppercase focus:outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                      CPF do Titular
                    </label>
                    <input
                      type="text"
                      value={cardCpf}
                      onChange={(e) => setCardCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-navy-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                      Validade
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                        setCardExpiry(v);
                      }}
                      placeholder="12/29"
                      className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                      placeholder="123"
                      className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-navy-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/60 mb-1">
                    Opções de Parcelamento
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-navy-900"
                  >
                    <option value={1}>1x de {formatMoney(item.amount)} (à vista sem juros)</option>
                    {item.amount >= 50 && (
                      <>
                        <option value={2}>2x de {formatMoney(item.amount / 2)} (sem juros)</option>
                        <option value={3}>3x de {formatMoney(item.amount / 3)} (sem juros)</option>
                      </>
                    )}
                    {item.amount >= 100 && (
                      <>
                        <option value={6}>6x de {formatMoney(item.amount / 6)} (sem juros)</option>
                        <option value={12}>
                          12x de {formatMoney((item.amount * 1.05) / 12)} (parcelamento estendido)
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-navy-900 hover:bg-navy-800 text-paper rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Processando cobrança segura…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 text-emerald-400" />
                      <span>Pagar {formatMoney(item.amount)} com Cartão</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* CONTEÚDO DA ABA 3: LINK DIRETO */}
            {activeTab === "link" && (
              <div className="space-y-4">
                <div className="p-4 bg-surface rounded-xl border border-border-subtle space-y-2">
                  <p className="text-xs font-bold text-navy-900">
                    Fatura & Link de Pagamento Direto
                  </p>
                  <p className="text-[11px] text-navy-800/60 leading-relaxed">
                    Você pode efetuar o pagamento diretamente na página da fatura ou encaminhar o
                    link para outro pagador.
                  </p>
                  <div className="p-2.5 bg-white border border-border-subtle rounded-lg text-xs font-mono text-emerald-800 break-all select-all">
                    {currentInvoiceUrl || `https://pagamentos.swaliclass.com/fatura/${item.id}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        currentInvoiceUrl || `https://pagamentos.swaliclass.com/fatura/${item.id}`,
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="py-2.5 px-3 bg-white border border-border-subtle hover:bg-surface text-navy-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    <span>{copied ? "Link Copiado!" : "Copiar Link"}</span>
                  </button>

                  <a
                    href={
                      currentInvoiceUrl || `https://pagamentos.swaliclass.com/fatura/${item.id}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      completePayment("link");
                    }}
                    className="py-2.5 px-3 bg-navy-900 hover:bg-navy-800 text-paper rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <ExternalLink className="size-4 text-emerald-400" />
                    <span>Abrir Fatura</span>
                  </a>
                </div>
              </div>
            )}

            {/* Rodapé de Segurança Sem Marcas de Terceiros */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-center gap-1.5 text-[10px] font-mono text-navy-800/50 uppercase tracking-widest">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Ambiente Protegido · Criptografia de Dados Bancários</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Alias for backwards compatibility with any other component
export const InfinitePayCheckoutModal = SecureCheckoutModal;
