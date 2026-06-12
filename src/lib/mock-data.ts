export type AttendanceStatus = "presente" | "ausente" | "atrasado" | "justificado";

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  attendance: number; // 0..100
  className: string;
  status: "ativo" | "arquivado";
}

export interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  teacher: string;
  classes: number;
  students: number;
}

export interface ClassGroup {
  id: string;
  name: string;
  course: string;
  teacher: string;
  schedule: string;
  days: string;
  capacity: number;
  enrolled: number;
}

export interface Tenant {
  id: string;
  name: string;
  plan: "Starter" | "Professional" | "Business" | "Enterprise";
  users: number;
  students: number;
  status: "ativo" | "inativo";
  dueDate: string;
}

export const students: Student[] = [
  { id: "s1", name: "Ana Beatriz Silva", email: "ana@email.com", phone: "(11) 98765-1001", birthDate: "2008-04-12", attendance: 96, className: "3º Ano B", status: "ativo" },
  { id: "s2", name: "Carlos Eduardo Santos", email: "carlos@email.com", phone: "(11) 98765-1002", birthDate: "2008-07-22", attendance: 72, className: "3º Ano B", status: "ativo" },
  { id: "s3", name: "Daniela Moreira", email: "dani@email.com", phone: "(11) 98765-1003", birthDate: "2009-01-30", attendance: 88, className: "3º Ano B", status: "ativo" },
  { id: "s4", name: "Eduardo Lima", email: "edu@email.com", phone: "(11) 98765-1004", birthDate: "2008-11-05", attendance: 64, className: "2º Ano A", status: "ativo" },
  { id: "s5", name: "Fernanda Costa", email: "fer@email.com", phone: "(11) 98765-1005", birthDate: "2009-03-18", attendance: 100, className: "2º Ano A", status: "ativo" },
  { id: "s6", name: "Gabriel Rocha", email: "gabriel@email.com", phone: "(11) 98765-1006", birthDate: "2008-09-09", attendance: 81, className: "1º Ano C", status: "ativo" },
  { id: "s7", name: "Helena Martins", email: "helena@email.com", phone: "(11) 98765-1007", birthDate: "2009-06-14", attendance: 92, className: "3º Ano B", status: "ativo" },
  { id: "s8", name: "Igor Pereira", email: "igor@email.com", phone: "(11) 98765-1008", birthDate: "2008-12-01", attendance: 58, className: "2º Ano A", status: "ativo" },
  { id: "s9", name: "Júlia Almeida", email: "julia@email.com", phone: "(11) 98765-1009", birthDate: "2009-02-25", attendance: 95, className: "1º Ano C", status: "ativo" },
  { id: "s10", name: "Lucas Ferreira", email: "lucas@email.com", phone: "(11) 98765-1010", birthDate: "2008-10-08", attendance: 77, className: "3º Ano B", status: "ativo" },
  { id: "s11", name: "Mariana Souza", email: "mari@email.com", phone: "(11) 98765-1011", birthDate: "2009-05-19", attendance: 89, className: "2º Ano A", status: "ativo" },
  { id: "s12", name: "Nicolas Dias", email: "nico@email.com", phone: "(11) 98765-1012", birthDate: "2008-08-27", attendance: 67, className: "1º Ano C", status: "arquivado" },
];

export const courses: Course[] = [
  { id: "c1", name: "Inglês Avançado", description: "Curso de inglês para nível B2/C1", category: "Idiomas", teacher: "Profa. Marina Souza", classes: 4, students: 48 },
  { id: "c2", name: "Espanhol Intermediário", description: "Conversação e gramática", category: "Idiomas", teacher: "Prof. Rafael Costa", classes: 3, students: 36 },
  { id: "c3", name: "Programação Web", description: "HTML, CSS, JavaScript e React", category: "Tecnologia", teacher: "Prof. João Lima", classes: 6, students: 72 },
  { id: "c4", name: "Excel Profissional", description: "Excel avançado para empresas", category: "Negócios", teacher: "Profa. Beatriz Alves", classes: 2, students: 24 },
  { id: "c5", name: "Design Gráfico", description: "Figma, Photoshop, Illustrator", category: "Criativo", teacher: "Prof. Diego Mendes", classes: 3, students: 30 },
];

export const classes: ClassGroup[] = [
  { id: "t1", name: "3º Ano B", course: "Inglês Avançado", teacher: "Profa. Marina Souza", schedule: "19h - 21h", days: "Seg, Qua", capacity: 24, enrolled: 22 },
  { id: "t2", name: "2º Ano A", course: "Espanhol Intermediário", teacher: "Prof. Rafael Costa", schedule: "18h - 20h", days: "Ter, Qui", capacity: 20, enrolled: 18 },
  { id: "t3", name: "1º Ano C", course: "Programação Web", teacher: "Prof. João Lima", schedule: "09h - 12h", days: "Sáb", capacity: 30, enrolled: 28 },
  { id: "t4", name: "Turma Exec", course: "Excel Profissional", teacher: "Profa. Beatriz Alves", schedule: "07h - 09h", days: "Ter, Qui", capacity: 15, enrolled: 12 },
  { id: "t5", name: "Design Noturno", course: "Design Gráfico", teacher: "Prof. Diego Mendes", schedule: "19h30 - 22h", days: "Seg, Qua, Sex", capacity: 18, enrolled: 15 },
];

export const tenants: Tenant[] = [
  { id: "ten1", name: "Colégio Alpha", plan: "Business", users: 42, students: 1248, status: "ativo", dueDate: "2026-08-15" },
  { id: "ten2", name: "Idiomas Connect", plan: "Professional", users: 12, students: 380, status: "ativo", dueDate: "2026-07-02" },
  { id: "ten3", name: "Escola Técnica Norte", plan: "Business", users: 28, students: 920, status: "ativo", dueDate: "2026-09-30" },
  { id: "ten4", name: "Curso Livre Maranata", plan: "Starter", users: 3, students: 78, status: "ativo", dueDate: "2026-06-20" },
  { id: "ten5", name: "Academia Pro", plan: "Enterprise", users: 65, students: 2840, status: "ativo", dueDate: "2027-01-10" },
  { id: "ten6", name: "Cursinho Vértice", plan: "Professional", users: 18, students: 410, status: "inativo", dueDate: "2026-05-01" },
];

export const weeklyAttendance = [
  { day: "Seg", value: 92 },
  { day: "Ter", value: 95 },
  { day: "Qua", value: 88 },
  { day: "Qui", value: 96 },
  { day: "Sex", value: 91 },
  { day: "Sáb", value: 84 },
];