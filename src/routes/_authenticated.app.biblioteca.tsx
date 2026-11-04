import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  Search,
  Upload,
  Download,
  Filter,
  Plus,
  ThumbsUp,
  FileText,
  Sparkles,
  Coins,
  CheckCircle2,
  X,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { creditsStore } from "@/lib/credits-store";

export const Route = createFileRoute("/_authenticated/app/biblioteca")({
  component: BibliotecaColaborativaPage,
});

interface MaterialItem {
  id: string;
  title: string;
  subject: string;
  level: string;
  author: string;
  downloads: number;
  likes: number;
  license: string;
  format: "PDF" | "Resumo" | "Mapa Mental";
  date: string;
}

const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: "mat-1",
    title: "Guia Completo: Funções Trigonométricas e Gráficos de Seno e Cosseno",
    subject: "Matemática",
    level: "Ensino Médio / ENEM",
    author: "Lucas Ferreira (Aluno)",
    downloads: 142,
    likes: 38,
    license: "CC BY-SA 4.0",
    format: "Resumo",
    date: "14/03/2026",
  },
  {
    id: "mat-2",
    title: "Mapa Mental: Primeira Lei da Termodinâmica e Transformações Gasosas",
    subject: "Física",
    level: "Ensino Médio / ENEM",
    author: "Prof. Carlos Silveira",
    downloads: 320,
    likes: 95,
    license: "Domínio Público",
    format: "Mapa Mental",
    date: "10/03/2026",
  },
  {
    id: "mat-3",
    title: "Esquema de Redação Nota 1000: Modelos de Tese e Intervenção Social",
    subject: "Redação",
    level: "ENEM",
    author: "Beatriz Ramos (Aluna)",
    downloads: 489,
    likes: 160,
    license: "CC BY 4.0",
    format: "PDF",
    date: "05/03/2026",
  },
  {
    id: "mat-4",
    title: "Quadro Cronológico: A Era Vargas e as Leis Trabalhistas",
    subject: "História",
    level: "Ensino Médio",
    author: "Mariana Costa (Docente)",
    downloads: 98,
    likes: 24,
    license: "CC BY-NC 4.0",
    format: "Resumo",
    date: "01/03/2026",
  },
];

export function BibliotecaColaborativaPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = materials.filter((m) => {
    const matchesSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.author.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === "all" || m.subject === selectedSubject;
    const matchesFormat = selectedFormat === "all" || m.format === selectedFormat;
    return matchesSearch && matchesSubject && matchesFormat;
  });

  const handleLike = (id: string) => {
    setMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: item.likes + 1 } : item)),
    );
    toast.success("Obrigado pelo seu voto positivo no material!");
  };

  const handleDownload = (item: MaterialItem) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, downloads: m.downloads + 1 } : m)),
    );
    toast.success(`Download de "${item.title}" iniciado!`);
  };

  return (
    <div className="space-y-6">
      {/* Header com Ação de Contribuição */}
      <div className="flex justify-between items-start gap-4 flex-wrap pb-4 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800 text-[11px] font-bold font-mono uppercase tracking-wider mb-1">
            <BookOpen className="size-3 text-navy-600" /> Repositório Comunitário
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-navy-900">
            Biblioteca Colaborativa
          </h1>
          <p className="text-xs text-navy-800/60 mt-1 max-w-xl">
            Compartilhe resumos, PDFs e mapas mentais com a comunidade acadêmica. Cada material
            aprovado concede <strong>+15 créditos permanentes</strong>.
          </p>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="px-4 h-10 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800 inline-flex items-center gap-2 transition-colors"
        >
          <Upload className="size-4" /> Enviar Material (+15 Créditos)
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 flex items-center gap-2 px-3 h-10 bg-white border border-border-subtle rounded-md">
          <Search className="size-4 text-navy-800/40 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, matéria ou autor…"
            className="bg-transparent flex-1 min-w-0 text-sm outline-none placeholder:text-navy-800/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-navy-800/40 hover:text-navy-800">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 h-10 bg-white border border-border-subtle rounded-md text-sm">
            <Filter className="size-3.5 text-navy-800/40 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs outline-none text-navy-900 cursor-pointer"
            >
              <option value="all">Todas as matérias</option>
              <option value="Matemática">Matemática</option>
              <option value="Física">Física</option>
              <option value="Química">Química</option>
              <option value="Redação">Redação</option>
              <option value="História">História</option>
              <option value="Biologia">Biologia</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 h-10 bg-white border border-border-subtle rounded-md text-sm">
            <FileText className="size-3.5 text-navy-800/40 shrink-0" />
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-transparent text-xs outline-none text-navy-900 cursor-pointer"
            >
              <option value="all">Todos os formatos</option>
              <option value="PDF">PDFs</option>
              <option value="Resumo">Resumos</option>
              <option value="Mapa Mental">Mapas Mentais</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grade de Materiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((mat) => (
          <div
            key={mat.id}
            className="bg-white border border-border-subtle rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-navy-900/30 transition-colors shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-navy-900/5 text-navy-800 font-bold">
                  {mat.subject} · {mat.level}
                </span>
                <span className="text-[10px] font-mono text-navy-800/40">{mat.format}</span>
              </div>
              <h3 className="font-display font-bold text-base text-navy-900">{mat.title}</h3>
              <p className="text-xs text-navy-800/60 mt-1">Por {mat.author}</p>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 text-navy-800/50 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleLike(mat.id)}
                  className="hover:text-emerald-700 inline-flex items-center gap-1 transition-colors"
                >
                  <ThumbsUp className="size-3.5" /> {mat.likes}
                </button>
                <span className="inline-flex items-center gap-1">
                  <Download className="size-3.5" /> {mat.downloads}
                </span>
                <span className="hidden sm:inline">{mat.license}</span>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(mat)}
                className="px-3 h-8 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800 inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="size-3.5" /> Baixar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center p-12 bg-white border border-dashed border-border-subtle rounded-lg">
          <p className="text-sm text-navy-800/50">
            Nenhum material encontrado com os filtros selecionados.
          </p>
        </div>
      )}

      {/* Modal de Envio de Material */}
      {uploadOpen && (
        <UploadMaterialModal
          onClose={() => setUploadOpen(false)}
          onAdded={(newMat) => {
            setMaterials([newMat, ...materials]);
            creditsStore.addCredits(
              15,
              "contribution",
              `Envio de material na Biblioteca: ${newMat.title}`,
            );
            toast.success("Material enviado com sucesso!", {
              description: "+15 Créditos por Contribuição adicionados ao seu saldo!",
            });
            setUploadOpen(false);
          }}
        />
      )}
    </div>
  );
}

function UploadMaterialModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (mat: MaterialItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Matemática");
  const [level, setLevel] = useState("Ensino Médio / ENEM");
  const [format, setFormat] = useState<"PDF" | "Resumo" | "Mapa Mental">("Resumo");
  const [license, setLicense] = useState("CC BY 4.0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdded({
      id: `mat-${Date.now()}`,
      title,
      subject,
      level,
      author: "Você (Colaborador)",
      downloads: 1,
      likes: 1,
      license,
      format,
      date: new Date().toLocaleDateString("pt-BR"),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-border-subtle p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h2 className="font-display font-bold text-lg text-navy-900">
              Contribuir com Material
            </h2>
            <p className="text-xs text-navy-800/60 mt-0.5">
              Compartilhe com a rede e ganhe <strong>15 créditos permanentes</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-navy-800/40 hover:text-navy-900">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Título do Material
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Resumo Prático de Cinemática e Queda Livre"
              className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none focus:border-navy-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Disciplina</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
              >
                <option value="Matemática">Matemática</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
                <option value="Redação">Redação</option>
                <option value="História">História</option>
                <option value="Biologia">Biologia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Formato</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
              >
                <option value="Resumo">Resumo Estruturado</option>
                <option value="PDF">Documento PDF</option>
                <option value="Mapa Mental">Mapa Mental</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">
                Nível de Ensino
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
              >
                <option value="Ensino Fundamental">Ensino Fundamental</option>
                <option value="Ensino Médio / ENEM">Ensino Médio / ENEM</option>
                <option value="Concursos">Concursos</option>
                <option value="Ensino Superior">Ensino Superior</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Licença</label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full h-10 px-3 border border-border-subtle rounded text-xs outline-none bg-white"
              >
                <option value="CC BY 4.0">Creative Commons (CC BY 4.0)</option>
                <option value="Domínio Público">Domínio Público</option>
                <option value="Uso Educacional Interno">Uso Educacional Interno</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center gap-2">
            <Coins className="size-4 text-amber-700 shrink-0" />
            <span>
              Ao enviar, você receberá <strong>+15 Créditos por Contribuição</strong> que não
              expiram.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 border border-border-subtle rounded-sm text-xs font-semibold hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 h-9 bg-navy-900 text-paper rounded-sm text-xs font-bold hover:bg-navy-800"
            >
              Enviar e Ganhar Créditos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
