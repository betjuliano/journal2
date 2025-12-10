
export enum CapesRating {
  MB = 'MB',
  B = 'B',
  R = 'R',
  F = 'F',
  I = 'I' // Insufficient/Not Rated
}

export interface Journal {
  id: number;
  journal_name: string;
  issn_print: string;
  issn_e: string;
  publisher: string;
  
  // Classifications
  abdc: string; // A*, A, B, C
  abs: string; // 4*, 4, 3, 2, 1
  sjr_quartile: string; // Q1, Q2, Q3, Q4
  jcr_quartile: string; // Q1, Q2, Q3, Q4
  
  // Metrics
  citescore: number | null;
  sjr: number | null;
  jif: number | null;
  spell: number | null;
  
  // Flags
  is_wiley: boolean;
  is_scielo: boolean;
  
  // Calculated
  capes_new: CapesRating;
  capes_points: number;
}

export interface FilterState {
  search: string;
  capes: CapesRating[];
  abdc: string[];
  abs: string[];
  quartiles: string[];
  isWiley: boolean;
  topTier: boolean; // Quick filter for A* / 4*
  highQuality: boolean; // Quick filter for A / 4
}

export type SortField = 'capes_points' | 'journal_name' | 'sjr' | 'citescore' | 'spell' | 'jif';
export type SortDirection = 'asc' | 'desc';

export enum SubmissionStatus {
  PLANNING = 'Planejamento',
  SUBMITTED = 'Submetido',
  UNDER_REVIEW = 'Em Revisão',
  REVISE_RESUBMIT = 'R&R',
  ACCEPTED = 'Aceito',
  REJECTED = 'Rejeitado'
}

export interface ReviewPoint {
  id: string;
  reviewerName: string; // Ex: "Revisor 1", "Revisor 2"
  request: string; // O que foi pedido
  response: string; // Resposta/Ação do autor
  isResolved: boolean; // Se foi atendido
}

export interface RevisionRound {
  id: string;
  roundNumber: number;
  receivedDate: string;
  deadline: string;
  points: ReviewPoint[];
}

export interface Submission {
  id: string;
  journalName: string;
  paperTitle: string;
  submissionDate: string;
  status: SubmissionStatus;
  notes?: string;
  
  // Novos campos
  revisions: RevisionRound[];
  sharedEmails: string; // Lista de emails separados por vírgula
  shareLink: string; // Link gerado automaticamente
}

// Lattes Module Types
export interface LattesProject {
  id: string;
  name: string;
  type: 'PESQUISA' | 'EXTENSAO';
  startYear: string;
  endYear: string; // 'ATUAL' if ongoing
  status: 'EM_ANDAMENTO' | 'CONCLUIDO';
  description?: string;
}

export interface LattesAuthor {
  name: string;
  institution?: string; // User input for analysis
}

export interface LattesArticle {
  id: string;
  fullText: string; // For reference/debugging
  title: string;
  authors: LattesAuthor[]; // Structured authors
  journalName: string;
  issn: string; // Extracted from PDF metadata line
  year: number;
  doi?: string;
  
  // Matched Data
  matchedJournalId?: number;
  capesRating: CapesRating;
  points: number;
}

export interface LattesTechProduct {
  id: string;
  fullText: string;
  title: string;
  year: number;
  description?: string;
}

export interface LattesGeneralSection {
  title: string;
  items: string[];
}

export interface LattesProfile {
  name: string;
  lastUpdate: string;
  abstract: string;
  projects: LattesProject[];
  articles: LattesArticle[];
  techProducts: LattesTechProduct[];
  generalSections: LattesGeneralSection[]; // Generic storage for all sections
}
