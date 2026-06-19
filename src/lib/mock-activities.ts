export type ActivityType = "particular" | "turma";
export type ActivityStatus = "pendente" | "entregue" | "corrigida";

export type Submission = {
  id: string;
  studentId: string;
  studentName: string;
  status: ActivityStatus;
  submittedAt?: string;
  note?: string; // aluno's observação
  grade?: number;
  feedback?: string; // professor's comment
  gradedAt?: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  due: string; // ISO
  createdAt: string;
  type: ActivityType;
  classId?: string;
  className?: string;
  studentId?: string;
  studentName?: string;
  submissions: Submission[];
};

const today = new Date();
const iso = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

// Mock alunos do "aluno logado" (preview): vamos fingir que o aluno em foco é "Ana Lima" (id a1)
export const CURRENT_STUDENT_ID = "a1";
export const CURRENT_STUDENT_NAME = "Ana Lima";

export const mockActivities: Activity[] = [
  {
    id: "act-1",
    title: "Lista de funções quadráticas",
    description:
      "Resolva os exercícios 1 a 12 do capítulo 4. Mostre o passo a passo da fatoração e do gráfico. Entregue até a próxima aula.",
    due: iso(2),
    createdAt: iso(-3),
    type: "turma",
    classId: "t-9a",
    className: "9º Ano A — Matemática",
    submissions: [
      { id: "s-1", studentId: "a1", studentName: "Ana Lima", status: "pendente" },
      { id: "s-2", studentId: "a2", studentName: "Bruno Reis", status: "entregue", submittedAt: iso(-1), note: "Tive dificuldade no item 7." },
      { id: "s-3", studentId: "a3", studentName: "Carla Souza", status: "corrigida", submittedAt: iso(-2), gradedAt: iso(-1), grade: 8.5, feedback: "Muito bom! Cuidado com o sinal no item 9." },
      { id: "s-4", studentId: "a4", studentName: "Diego Martins", status: "pendente" },
    ],
  },
  {
    id: "act-2",
    title: "Redação: tecnologia e educação",
    description: "Texto dissertativo-argumentativo, 25 a 30 linhas, sobre o impacto da IA na sala de aula.",
    due: iso(-1),
    createdAt: iso(-7),
    type: "turma",
    classId: "t-9a",
    className: "9º Ano A — Português",
    submissions: [
      { id: "s-5", studentId: "a1", studentName: "Ana Lima", status: "entregue", submittedAt: iso(-1), note: "Foquei nos riscos e oportunidades." },
      { id: "s-6", studentId: "a2", studentName: "Bruno Reis", status: "corrigida", submittedAt: iso(-2), gradedAt: iso(0), grade: 9.0, feedback: "Argumentação sólida." },
    ],
  },
  {
    id: "act-3",
    title: "Reforço de leitura — capítulo 3",
    description: "Leitura do capítulo 3 e resposta às 5 perguntas de interpretação enviadas no chat.",
    due: iso(5),
    createdAt: iso(-1),
    type: "particular",
    studentId: "a1",
    studentName: "Ana Lima",
    submissions: [
      { id: "s-7", studentId: "a1", studentName: "Ana Lima", status: "pendente" },
    ],
  },
  {
    id: "act-4",
    title: "Prova substitutiva — Geometria",
    description: "Resolução da prova substitutiva. Devolução obrigatória.",
    due: iso(-3),
    createdAt: iso(-10),
    type: "particular",
    studentId: "a1",
    studentName: "Ana Lima",
    submissions: [
      { id: "s-8", studentId: "a1", studentName: "Ana Lima", status: "corrigida", submittedAt: iso(-4), gradedAt: iso(-2), grade: 7.0, feedback: "Recupere o conteúdo de áreas. Sugiro refazer os exercícios 3 e 5." },
    ],
  },
];

export const mockClasses = [
  { id: "t-9a", name: "9º Ano A" },
  { id: "t-8b", name: "8º Ano B" },
];
export const mockStudents = [
  { id: "a1", name: "Ana Lima" },
  { id: "a2", name: "Bruno Reis" },
  { id: "a3", name: "Carla Souza" },
  { id: "a4", name: "Diego Martins" },
];