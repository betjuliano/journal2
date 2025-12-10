// src/services/data.ts
import { Journal, CapesRating } from '../types';

// --- Interface para o JSON que vem do Python ---
export interface RawJournalData {
  JOURNAL: string;
  BASE?: string;
  ISSN?: string;
  "ISSN Online"?: string;
  ABDC?: string;
  SJR?: string;
  SJRN?: string | number;
  ABS?: string;
  CITESCORE?: string | number;
  JCR?: string;
  JIF?: string | number;
  SPELL?: string | number;
  WILEY?: string;
  SCIELO?: string;
}

// Helper: Determina nota CAPES
const calculateCapes = (abdc: string, abs: string, sjrQ: string, jcrQ: string): { rating: CapesRating, points: number } => {
  const normAbdc = abdc ? abdc.toString().trim().toUpperCase() : '';
  const normAbs = abs ? abs.toString().trim() : '';
  const normSjr = sjrQ ? sjrQ.toString().trim().toUpperCase() : '';
  const normJcr = jcrQ ? jcrQ.toString().trim().toUpperCase() : '';

  const isMb = ['A*', 'A'].includes(normAbdc) || ['2', '3', '4', '4*'].includes(normAbs) || normSjr === 'Q1' || normJcr === 'Q1';
  if (isMb) return { rating: CapesRating.MB, points: 8 };

  const isB = normAbdc === 'B' || normAbs === '1' || normSjr === 'Q2' || normJcr === 'Q2';
  if (isB) return { rating: CapesRating.B, points: 4 };

  const isR = normAbdc === 'C' || normSjr === 'Q3' || normJcr === 'Q3';
  if (isR) return { rating: CapesRating.R, points: 2 };

  const isF = normSjr === 'Q4' || normJcr === 'Q4';
  if (isF) return { rating: CapesRating.F, points: 1 };

  return { rating: CapesRating.I, points: 0 };
};

// Helper: Converte número de forma segura (aceita string "0,50" ou number 0.50)
const parseNumber = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const str = val.trim();
    if (str === 'N/A' || str === '') return null;
    const cleanStr = str.replace(',', '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? null : num;
  }
  return null;
};

// --- FUNÇÃO PRINCIPAL ---
export const mapJournalsFromJson = (jsonData: RawJournalData[]): Journal[] => {
  return jsonData.map((item, index) => {
    // Tratamento seguro de nulos com ?.toString()
    const name = item.JOURNAL ? item.JOURNAL.toString().replace(/^"|"$/g, '') : 'Unknown Journal';
    const abdc = item.ABDC ? item.ABDC.toString() : '';
    const abs = item.ABS ? item.ABS.toString() : '';
    const sjr_q = item.SJR ? item.SJR.toString() : '';
    const jcr_q = item.JCR ? item.JCR.toString() : '';

    const rawWiley = item.WILEY ? item.WILEY.toString().toUpperCase() : '';
    const is_wiley = rawWiley.includes('SIM') || rawWiley === 'W' || rawWiley.includes('WILEY');
    
    const rawScielo = item.SCIELO ? item.SCIELO.toString().toUpperCase() : '';
    const is_scielo = rawScielo.includes('SIM');

    const capesInfo = calculateCapes(abdc, abs, sjr_q, jcr_q);

    return {
      id: index,
      journal_name: name,
      issn_print: item.ISSN ? item.ISSN.toString() : '',
      issn_e: item["ISSN Online"] ? item["ISSN Online"].toString() : '',
      publisher: is_wiley ? 'Wiley' : 'N/A',
      abdc,
      abs,
      sjr_quartile: sjr_q,
      jcr_quartile: jcr_q,
      sjr: parseNumber(item.SJRN),
      citescore: parseNumber(item.CITESCORE),
      jif: parseNumber(item.JIF),
      spell: parseNumber(item.SPELL),
      is_wiley,
      is_scielo,
      capes_new: capesInfo.rating,
      capes_points: capesInfo.points
    };
  });
};

// Mantenha essa função vazia ou legada caso ainda queira usar o botão de upload de CSV antigo,
// mas recomendo remover o botão de upload se for usar o JSON fixo.
export const parseJournalCSV = (csvContent: string): Journal[] => {
    console.warn("Função CSV legada chamada");
    return []; 
};