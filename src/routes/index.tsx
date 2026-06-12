import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, BarChart3, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BitraHub — Gestão de presença e turmas | Bitra Tech" },
      { name: "description", content: "SaaS para escolas e cursos: chamada em segundos, frequência em tempo real e relatórios prontos. Por Bitra Tech." },
      { property: "og:title", content: "BitraHub — Gestão de presença com precisão" },
      { property: "og:description", content: "Transforme o diário de classe em inteligência estratégica." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-paper text-navy-900 selection:bg-navy-600/20">
      <Nav />
      <Hero />
      <DashboardPreview />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border-subtle px-6 py-4">
      <div className="max-w-7xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="size-8 bg-navy-900 rounded-sm flex items-center justify-center text-paper font-display font-extrabold shrink-0">B</div>
          <span className="font-display font-bold tracking-tight text-xl truncate">BitraHub</span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-medium text-navy-800/70">
          <a href="#funcionalidades" className="hover:text-navy-900 transition-colors">Funcionalidades</a>
          <a href="#dashboard" className="hover:text-navy-900 transition-colors">Plataforma</a>
          <a href="#precos" className="hover:text-navy-900 transition-colors">Preços</a>
        </div>
        <Link
          to="/app"
          className="bg-navy-900 text-paper px-5 py-2 rounded-sm text-sm font-semibold hover:bg-navy-800 transition-colors shrink-0"
        >
          Entrar no Portal
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
      <span className="inline-block py-1 px-3 bg-navy-600/10 text-navy-600 text-[10px] font-mono font-bold uppercase tracking-widest rounded-full mb-6">
        Padrão Bitra Tech
      </span>
      <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-balance">
        Gestão de presença com<br />
        <span className="text-navy-600">precisão cirúrgica.</span>
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-navy-800/60 mb-10 leading-relaxed">
        O BitraHub transforma o diário de classe em uma ferramenta de inteligência estratégica. Menos burocracia, mais foco no aprendizado.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/app"
          className="bg-navy-900 text-paper px-8 py-4 rounded-sm font-bold text-base hover:shadow-xl transition-shadow inline-flex items-center justify-center gap-2"
        >
          Acessar o app demo <ArrowRight className="size-4" />
        </Link>
        <a
          href="#dashboard"
          className="border border-navy-900/10 px-8 py-4 rounded-sm font-bold text-base hover:bg-navy-900/5 transition-colors"
        >
          Ver demonstração
        </a>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section id="dashboard" className="max-w-7xl mx-auto px-6 pb-32">
      <div className="bg-white rounded-xl shadow-2xl shadow-navy-900/10 border border-border-subtle overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/40 ml-3">bitrahub.app/dashboard</span>
        </div>
        <div className="grid grid-cols-12 gap-4 p-6 lg:p-8 bg-surface">
          <Kpi label="Total alunos" value="1.248" />
          <Kpi label="Turmas ativas" value="42" />
          <Kpi label="Frequência média" value="94,2%" valueClass="text-emerald-600" />
          <Kpi dark label="Alertas baixa freq." value="12" />

          <div className="col-span-12 md:col-span-8 bg-white p-6 border border-border-subtle rounded-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg">Chamada rápida — 3º Ano B</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy-800/50">18 / 24</span>
            </div>
            <div className="space-y-2">
              {[
                { n: "Ana Beatriz Silva", s: "presente" },
                { n: "Carlos Eduardo Santos", s: "ausente" },
                { n: "Daniela Moreira", s: "presente" },
                { n: "Eduardo Lima", s: "atrasado" },
              ].map((r) => (
                <div key={r.n} className="flex items-center justify-between p-3 bg-navy-900/[0.03] rounded-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded bg-navy-900/10 shrink-0" />
                    <span className="text-sm font-medium truncate">{r.n}</span>
                  </div>
                  <StatusPill status={r.s as "presente" | "ausente" | "atrasado"} />
                </div>
              ))}
            </div>
            <button className="w-full mt-5 bg-navy-900 text-white py-3 font-bold rounded-sm hover:bg-navy-800 transition-colors">
              Finalizar chamada
            </button>
          </div>

          <div className="col-span-12 md:col-span-4 bg-white border border-border-subtle rounded-lg p-6">
            <h3 className="font-display font-bold text-lg">Fluxo de presença</h3>
            <p className="text-xs text-navy-800/50 mb-5">Últimos 7 dias letivos</p>
            <MiniChart />
            <div className="flex justify-between items-center text-xs font-mono mt-4 pt-4 border-t border-border-subtle">
              <span className="text-navy-800/60 uppercase">Retenção</span>
              <span className="font-bold text-emerald-600">+2,4%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, dark, valueClass }: { label: string; value: string; dark?: boolean; valueClass?: string }) {
  const base = dark
    ? "bg-navy-900 border-navy-800 text-paper"
    : "bg-white border-border-subtle";
  return (
    <div className={`col-span-12 md:col-span-3 p-5 border rounded-lg flex flex-col justify-between gap-6 ${base}`}>
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${dark ? "text-white/40" : "text-navy-600"}`}>{label}</span>
      <span className={`text-3xl font-display font-extrabold ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: "presente" | "ausente" | "atrasado" | "justificado" }) {
  const map = {
    presente: "bg-emerald-100 text-emerald-700",
    ausente: "bg-rose-100 text-rose-700",
    atrasado: "bg-amber-100 text-amber-700",
    justificado: "bg-navy-600/15 text-navy-600",
  } as const;
  return (
    <span className={`px-3 py-1 text-[10px] font-bold rounded-sm uppercase tracking-wider ${map[status]}`}>{status}</span>
  );
}

function MiniChart() {
  const data = [82, 90, 87, 94, 91, 96, 94];
  const max = 100;
  return (
    <svg viewBox="0 0 200 90" className="w-full h-32">
      <polyline
        fill="none"
        stroke="#3b6fa0"
        strokeWidth="2.5"
        points={data.map((v, i) => `${(i / (data.length - 1)) * 200},${90 - (v / max) * 80}`).join(" ")}
      />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * 200} cy={90 - (v / max) * 80} r="2.5" fill="#0f1b3d" />
      ))}
    </svg>
  );
}

function Features() {
  const items = [
    { icon: Clock, title: "Chamada em segundos", desc: "Marcação rápida, seleção em massa e atalhos para uso na sala de aula." },
    { icon: BarChart3, title: "Inteligência de frequência", desc: "Identifique alunos com baixa presença antes da evasão acontecer." },
    { icon: Users, title: "Multi-tenant nativo", desc: "Cada instituição com seus dados isolados — pronto para escala." },
    { icon: ShieldCheck, title: "Auditoria e permissões", desc: "Perfis Super Admin, Administrador e Professor com logs completos." },
  ];
  return (
    <section id="funcionalidades" className="max-w-7xl mx-auto px-6 py-24 border-t border-border-subtle">
      <div className="grid md:grid-cols-2 gap-8">
        {items.map((f) => (
          <div key={f.title} className="p-8 bg-white border border-border-subtle rounded-lg">
            <div className="size-10 bg-navy-900 text-paper rounded-sm flex items-center justify-center mb-5">
              <f.icon className="size-5" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
            <p className="text-navy-800/60 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Starter", price: "Grátis", desc: "Até 100 alunos. Ideal para professores particulares.", features: ["1 instituição", "Chamada e frequência", "Relatórios básicos"] },
    { name: "Professional", price: "R$ 299", suffix: "/mês", desc: "Até 500 alunos. Para escolas em crescimento.", features: ["Multi-professores", "Relatórios PDF/Excel", "Suporte por email"], highlight: true },
    { name: "Business", price: "R$ 599", suffix: "/mês", desc: "Até 2.000 alunos. Para redes consolidadas.", features: ["API de integração", "Auditoria completa", "Suporte prioritário"] },
    { name: "Enterprise", price: "Custom", desc: "Volume ilimitado e SLA dedicado.", features: ["SSO e SAML", "Sucesso do cliente", "Consultoria Bitra"] },
  ];
  return (
    <section id="precos" className="max-w-7xl mx-auto px-6 py-24 border-t border-border-subtle">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-navy-600">Planos</span>
        <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-3">Preços diretos. Sem letras miúdas.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`p-7 rounded-lg border flex flex-col ${
              p.highlight ? "bg-navy-900 text-paper border-navy-900" : "bg-white border-border-subtle"
            }`}
          >
            <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${p.highlight ? "text-paper/70" : "text-navy-600"}`}>{p.name}</h4>
            <p className="mt-4 font-display font-extrabold text-3xl">
              {p.price}
              {p.suffix && <span className={`text-xs font-normal ${p.highlight ? "text-paper/50" : "text-navy-800/40"}`}>{p.suffix}</span>}
            </p>
            <p className={`mt-2 text-sm ${p.highlight ? "text-paper/70" : "text-navy-800/60"}`}>{p.desc}</p>
            <ul className="mt-6 space-y-2 flex-1">
              {p.features.map((f) => (
                <li key={f} className={`flex gap-2 text-sm ${p.highlight ? "text-paper/85" : "text-navy-800/75"}`}>
                  <Check className="size-4 shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-6 py-2.5 rounded-sm text-sm font-bold transition-colors ${
                p.highlight ? "bg-paper text-navy-900 hover:bg-white" : "bg-navy-900 text-paper hover:bg-navy-800"
              }`}
            >
              Começar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <div className="bg-navy-900 text-paper rounded-xl p-12 md:p-16 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Pronto para deixar a chamada no automático?
        </h2>
        <p className="text-paper/70 max-w-xl mx-auto mb-8">
          Experimente o BitraHub com dados de demonstração. Sem cartão, sem amarras.
        </p>
        <Link to="/app" className="inline-flex items-center gap-2 bg-paper text-navy-900 px-7 py-3.5 rounded-sm font-bold hover:bg-white transition-colors">
          Abrir o app demo <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border-subtle text-center text-[10px] font-mono text-navy-800/40 uppercase tracking-[0.2em]">
      BitraHub por Bitra Tech &copy; 2026 — Plataforma SaaS de gestão escolar
    </footer>
  );
}
