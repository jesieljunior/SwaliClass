import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  GraduationCap,
  UserRound,
  School,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Compass,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou Cadastrar — SwaliClass" },
      {
        name: "description",
        content:
          "Acesse o SwaliClass como Estudante Autônomo para estudar sozinho com IA, ou como Professor e Escola.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type ProfileCategory = "school" | "teacher" | "student";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // Cadastro state
  const [profileType, setProfileType] = useState<ProfileCategory>("student");
  const [studentHasTeacher, setStudentHasTeacher] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState("");
  const [studyFocus, setStudyFocus] = useState("ENEM");
  const [institutionName, setInstitutionName] = useState("");
  const [subject, setSubject] = useState("");

  // Common credentials
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        // Standard login: will determine student vs staff based on registered profile / email
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;

        navigate({ to: "/app" });
      } else if (mode === "signup") {
        // Create account
        const isStudentSolo = profileType === "student" && !studentHasTeacher;

        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: {
              full_name: fullName,
              profile_type: profileType,
              has_teacher: studentHasTeacher,
              study_focus: studyFocus,
              institution_name: institutionName,
              subject: subject,
              invite_code: inviteCode,
            },
          },
        });
        if (signUpErr) throw signUpErr;

        // Auto sign in with the new credentials so the user enters immediately
        await supabase.auth.signInWithPassword({ email, password });

        if (isStudentSolo) {
          localStorage.setItem("bitrahub:view-mode", "student");
          localStorage.setItem("swali_active_role", "student");
        } else if (profileType === "student") {
          localStorage.setItem("bitrahub:view-mode", "student");
          localStorage.setItem("swali_active_role", "student");
        } else {
          localStorage.setItem("bitrahub:view-mode", "teacher");
          localStorage.setItem("swali_active_role", "staff");
        }

        navigate({ to: "/app" });
      } else {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetErr) throw resetErr;
        setInfo("Se o e-mail estiver cadastrado, enviamos um link de recuperação.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao processar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-surface">
      {/* Coluna Esquerda - Apresentação da Plataforma */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col justify-between bg-navy-900 text-paper p-10 xl:p-12 border-r border-navy-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-10 bg-navy-600 rounded-md grid place-items-center font-display font-extrabold shadow-sm">
            S
          </div>
          <div>
            <p className="font-display font-bold tracking-wide">SWALICLASS</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-paper/40">
              Estudo com IA & Gestão Acadêmica
            </p>
          </div>
        </Link>

        <div className="space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono">
            <Sparkles className="size-3.5" /> Portal Inteligente de Aprendizado
          </div>

          <h2 className="font-display text-3xl font-bold leading-tight">
            Para quem estuda sozinho, e para quem ensina.
          </h2>
          <p className="text-paper/70 text-xs leading-relaxed">
            Se você não tem professor, o SwaliClass entrega um portal completo para você estudar no
            seu ritmo com a Swali AI, resumos dos seus PDFs, flashcards e comunidade. E se você é
            professor ou escola, gerencie turmas e chamadas com facilidade.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <p className="font-bold text-amber-300 flex items-center gap-2">
                <UserRound className="size-3.5" /> Estudante Autônomo (Sem Professor)
              </p>
              <p className="text-paper/60 text-[11px] leading-normal">
                Suba seus PDFs, tire dúvidas 24/7 com IA que mapeia seus erros e treine com
                simulados gerados sob medida para o seu objetivo.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <p className="font-bold text-emerald-300 flex items-center gap-2">
                <GraduationCap className="size-3.5" /> Professor Particular
              </p>
              <p className="text-paper/60 text-[11px] leading-normal">
                Cadastre turmas, lance notas, realize chamada por presença e envie materiais
                diretamente aos alunos.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <p className="font-bold text-sky-300 flex items-center gap-2">
                <School className="size-3.5" /> Escola & Instituição
              </p>
              <p className="text-paper/60 text-[11px] leading-normal">
                Painel administrativo multi-docente, relatórios de frequência em PDF e gestão de
                cursos.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-widest text-paper/30">
          © {new Date().getFullYear()} SwaliClass · Criado por Jesiel Amaro Junior
        </p>
      </aside>

      {/* Coluna Direita - Formulário */}
      <main className="lg:col-span-7 xl:col-span-8 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-2">
            <div className="size-8 bg-navy-900 rounded-md grid place-items-center text-paper font-display font-extrabold">
              S
            </div>
            <span className="font-display font-bold">SwaliClass</span>
          </Link>

          {/* Abas Entrar / Cadastre-se */}
          <div className="p-1 bg-surface-hover border border-border-subtle rounded-xl grid grid-cols-2 gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-navy-900 text-paper shadow-xs"
                  : "text-navy-800/60 hover:text-navy-900"
              }`}
            >
              <span>Acessar Conta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-navy-900 text-paper shadow-xs"
                  : "text-navy-800/60 hover:text-navy-900"
              }`}
            >
              <span>Criar Nova Conta</span>
            </button>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {mode === "login"
                ? "Entrar na sua conta"
                : mode === "signup"
                  ? "Criar sua conta no SwaliClass"
                  : "Recuperar sua senha"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-navy-800/60">
              {mode === "login"
                ? "Entre com seu e-mail e senha cadastrados para acessar seu portal."
                : mode === "signup"
                  ? "Selecione seu perfil abaixo para personalizar seu acesso."
                  : "Digite o e-mail da sua conta para receber as instruções de recuperação."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* ETAPA DE CADASTRO: PERGUNTA EXPLÍCITA (ESCOLA? PROFESSOR? ESTUDANTE?) */}
            {mode === "signup" && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-navy-900 mb-2">
                    Você é:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Opção Escola */}
                    <button
                      type="button"
                      onClick={() => setProfileType("school")}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        profileType === "school"
                          ? "bg-navy-900 text-paper border-navy-900 shadow-sm"
                          : "bg-white text-navy-900 border-border-subtle hover:border-navy-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <School
                          className={`size-5 ${profileType === "school" ? "text-amber-400" : "text-navy-700"}`}
                        />
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            profileType === "school"
                              ? "bg-white/20 text-white"
                              : "bg-surface-hover text-navy-800/60"
                          }`}
                        >
                          Instituição
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Escola</p>
                        <p
                          className={`text-[11px] leading-tight mt-0.5 ${
                            profileType === "school" ? "text-paper/70" : "text-navy-800/50"
                          }`}
                        >
                          Coordenação e múltiplos professores
                        </p>
                      </div>
                    </button>

                    {/* Opção Professor */}
                    <button
                      type="button"
                      onClick={() => setProfileType("teacher")}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        profileType === "teacher"
                          ? "bg-navy-900 text-paper border-navy-900 shadow-sm"
                          : "bg-white text-navy-900 border-border-subtle hover:border-navy-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <GraduationCap
                          className={`size-5 ${profileType === "teacher" ? "text-emerald-400" : "text-navy-700"}`}
                        />
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            profileType === "teacher"
                              ? "bg-white/20 text-white"
                              : "bg-surface-hover text-navy-800/60"
                          }`}
                        >
                          Docente
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Professor</p>
                        <p
                          className={`text-[11px] leading-tight mt-0.5 ${
                            profileType === "teacher" ? "text-paper/70" : "text-navy-800/50"
                          }`}
                        >
                          Aulas particulares e minhas turmas
                        </p>
                      </div>
                    </button>

                    {/* Opção Estudante */}
                    <button
                      type="button"
                      onClick={() => setProfileType("student")}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        profileType === "student"
                          ? "bg-navy-900 text-paper border-navy-900 shadow-sm"
                          : "bg-white text-navy-900 border-border-subtle hover:border-navy-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <UserRound
                          className={`size-5 ${profileType === "student" ? "text-amber-400" : "text-navy-700"}`}
                        />
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            profileType === "student"
                              ? "bg-amber-400 text-navy-950 font-bold"
                              : "bg-surface-hover text-navy-800/60"
                          }`}
                        >
                          Aluno
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Estudante</p>
                        <p
                          className={`text-[11px] leading-tight mt-0.5 ${
                            profileType === "student" ? "text-paper/70" : "text-navy-800/50"
                          }`}
                        >
                          Estudo individual com IA ou turma
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* SE FOR ESTUDANTE: PERGUNTA SE TEM PROFESSOR OU ESTUDA SOZINHO */}
                {profileType === "student" && (
                  <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-3.5 shadow-xs">
                    <div>
                      <p className="text-xs font-mono font-bold uppercase tracking-wider text-navy-900">
                        Você possui vínculo com algum professor ou escola?
                      </p>
                      <p className="text-[11px] text-navy-800/60 mt-0.5">
                        Alunos que não têm professor têm acesso normal ao portal para estudar
                        sozinhos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Opção A: Estudo Sozinho / Sem Professor */}
                      <button
                        type="button"
                        onClick={() => setStudentHasTeacher(false)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          !studentHasTeacher
                            ? "bg-amber-50/80 border-amber-300 text-navy-950 shadow-xs ring-1 ring-amber-300"
                            : "bg-surface border-border-subtle text-navy-800/70 hover:bg-surface-hover"
                        }`}
                      >
                        <div
                          className={`size-4 rounded-full border mt-0.5 grid place-items-center shrink-0 ${
                            !studentHasTeacher
                              ? "border-amber-600 bg-amber-500 text-white"
                              : "border-border-subtle bg-white"
                          }`}
                        >
                          {!studentHasTeacher && (
                            <span className="size-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                            Não tenho professor
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-semibold">
                              Estudo Sozinho
                            </span>
                          </p>
                          <p className="text-[11px] text-navy-800/70 mt-0.5 leading-snug">
                            Vou estudar sozinho com a Swali AI, resumos de PDFs e simulados.
                          </p>
                        </div>
                      </button>

                      {/* Opção B: Tenho Professor / Escola */}
                      <button
                        type="button"
                        onClick={() => setStudentHasTeacher(true)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          studentHasTeacher
                            ? "bg-navy-50/80 border-navy-300 text-navy-950 shadow-xs ring-1 ring-navy-300"
                            : "bg-surface border-border-subtle text-navy-800/70 hover:bg-surface-hover"
                        }`}
                      >
                        <div
                          className={`size-4 rounded-full border mt-0.5 grid place-items-center shrink-0 ${
                            studentHasTeacher
                              ? "border-navy-900 bg-navy-900 text-white"
                              : "border-border-subtle bg-white"
                          }`}
                        >
                          {studentHasTeacher && <span className="size-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy-900">Sim, tenho professor</p>
                          <p className="text-[11px] text-navy-800/70 mt-0.5 leading-snug">
                            Faço parte de uma turma cadastrada por uma escola ou professor.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Explicação contextual quando estuda sozinho */}
                    {!studentHasTeacher ? (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1 text-emerald-950">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                          <span>Acesso Liberado para Estudo Independente</span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                          Você terá acesso normal e completo ao portal: use a{" "}
                          <strong>Swali AI</strong>, envie seus próprios arquivos na{" "}
                          <strong>Biblioteca</strong>, participe da <strong>Comunidade</strong> e
                          gere flashcards de fixação no seu próprio tempo.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/70 mb-1">
                          Código de Convite ou Turma (opcional)
                        </label>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="Ex: TURMA-9A ou cole o código recebido"
                          className="w-full h-9 px-3 bg-white border border-border-subtle rounded-md text-xs focus:outline-none focus:border-navy-900"
                        />
                      </div>
                    )}

                    {/* Foco de estudo */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/70 mb-1">
                        Qual é o seu objetivo de estudo?
                      </label>
                      <select
                        value={studyFocus}
                        onChange={(e) => setStudyFocus(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-border-subtle rounded-md text-xs focus:outline-none focus:border-navy-900"
                      >
                        <option value="ENEM">ENEM & Vestibulares Tradicionais</option>
                        <option value="Concursos">Concursos Públicos</option>
                        <option value="OAB">Exame da OAB & Carreiras Jurídicas</option>
                        <option value="Faculdade">Ensino Superior / Faculdade</option>
                        <option value="Autodidata">Autodidata / Estudos Gerais & Idiomas</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* SE FOR ESCOLA: CAMPOS DA INSTITUIÇÃO */}
                {profileType === "school" && (
                  <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-3 shadow-xs">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/70 mb-1">
                        Nome da Escola ou Instituição *
                      </label>
                      <input
                        type="text"
                        required
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="Ex: Colégio Monteiro Lobato, Cursinho Gauss"
                        className="w-full h-9 px-3 bg-white border border-border-subtle rounded-md text-xs focus:outline-none focus:border-navy-900"
                      />
                    </div>
                  </div>
                )}

                {/* SE FOR PROFESSOR: CAMPOS DO DOCENTE */}
                {profileType === "teacher" && (
                  <div className="p-4 rounded-xl border border-border-subtle bg-white space-y-3 shadow-xs">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-navy-800/70 mb-1">
                        Área ou Disciplina de Ensino
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ex: Redação, Matemática, Biologia, Direito Constitucional"
                        className="w-full h-9 px-3 bg-white border border-border-subtle rounded-md text-xs focus:outline-none focus:border-navy-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DADOS BÁSICOS DE CADASTRO OU LOGIN */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60 mb-1">
                  Seu nome completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Lucas Henrique Silva"
                  className="w-full h-10 px-3 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full h-10 px-3 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono uppercase tracking-widest text-navy-800/60">
                    Senha
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-navy-800/60 hover:text-navy-900 cursor-pointer"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full h-10 px-3 bg-white border border-border-subtle rounded-md text-sm focus:outline-none focus:border-navy-900"
                />
              </div>
            )}

            {error && (
              <p className="text-xs bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-md">
                {error}
              </p>
            )}

            {info && (
              <p className="text-xs bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-md">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-navy-900 text-paper rounded-lg font-semibold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                "Processando…"
              ) : mode === "login" ? (
                <>
                  <span>Entrar no SwaliClass</span>
                  <ArrowRight className="size-4" />
                </>
              ) : mode === "signup" ? (
                profileType === "student" ? (
                  !studentHasTeacher ? (
                    <>
                      <span>Criar Conta e Estudar Sozinho</span>
                      <ArrowRight className="size-4" />
                    </>
                  ) : (
                    <>
                      <span>Criar Conta de Aluno</span>
                      <ArrowRight className="size-4" />
                    </>
                  )
                ) : profileType === "teacher" ? (
                  <>
                    <span>Criar Conta de Professor</span>
                    <ArrowRight className="size-4" />
                  </>
                ) : (
                  <>
                    <span>Criar Conta da Escola</span>
                    <ArrowRight className="size-4" />
                  </>
                )
              ) : (
                "Enviar link de recuperação"
              )}
            </button>
          </form>

          {/* Dica para testes rápidos (discreta e elegante) */}
          <div className="pt-2 border-t border-border-subtle/80 text-[11px] text-navy-800/50 space-y-1">
            <p className="font-mono uppercase tracking-wider text-[10px] text-navy-800/40">
              Ambiente de Demonstração & Testes
            </p>
            <p>
              • Para entrar como <strong>Estudante sem professor</strong>: use{" "}
              <code className="text-navy-900 font-mono bg-surface-hover px-1 py-0.5 rounded">
                estudante@swaliclass.com
              </code>{" "}
              ou cadastre seu e-mail como Estudante.
            </p>
            <p>
              • Para entrar como <strong>Gestão Escolar / Professor</strong>: use{" "}
              <code className="text-navy-900 font-mono bg-surface-hover px-1 py-0.5 rounded">
                admin@swaliclass.com
              </code>
              .
            </p>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            {mode === "login" ? (
              <p className="text-navy-800/60">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-navy-900 font-bold hover:underline cursor-pointer ml-1"
                >
                  Cadastre-se gratuitamente →
                </button>
              </p>
            ) : (
              <p className="text-navy-800/60">
                Já possui conta cadastrada?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-navy-900 font-bold hover:underline cursor-pointer ml-1"
                >
                  ← Fazer Login
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
