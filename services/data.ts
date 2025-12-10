// src/services/data.ts
import { Journal, CapesRating } from '../types';

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

const sanitizeString = (value: string | number | null | undefined, maxLength = 200): string => {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/^"|"$/g, '').trim().slice(0, maxLength);
};

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

export const mapJournalsFromJson = (jsonData: RawJournalData[]): Journal[] => {
  return jsonData.map((item, index) => {
    const name = sanitizeString(item.JOURNAL, 300) || 'Unknown Journal';
    const abdc = sanitizeString(item.ABDC, 10);
    const abs = sanitizeString(item.ABS, 10);
    const sjr_q = sanitizeString(item.SJR, 5);
    const jcr_q = sanitizeString(item.JCR, 5);

    const rawWiley = sanitizeString(item.WILEY, 20).toUpperCase();
    const is_wiley = rawWiley.includes('SIM') || rawWiley === 'W' || rawWiley.includes('WILEY');

    const rawScielo = sanitizeString(item.SCIELO, 20).toUpperCase();
    const is_scielo = rawScielo.includes('SIM');

    const capesInfo = calculateCapes(abdc, abs, sjr_q, jcr_q);

    return {
      id: index,
      journal_name: name,
      issn_print: sanitizeString(item.ISSN, 50),
      issn_e: sanitizeString(item["ISSN Online"], 50),
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

const cleanCell = (cell: string): string => cell.replace(/^"|"$/g, '').trim();

const MAX_CSV_ROWS = 5000;

export const parseJournalCSV = (csvContent: string): Journal[] => {
  if (!csvContent.trim()) return [];
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  if (lines.length - 1 > MAX_CSV_ROWS) {
    throw new Error('Arquivo CSV excede o limite de 5000 linhas para importação segura.');
  }

  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(cleanCell);

  const hasJournalColumn = headers.some((header) => header.toUpperCase() === 'JOURNAL');
  if (!hasJournalColumn) {
    throw new Error('CSV inválido: coluna JOURNAL é obrigatória.');
  }

  const rawRows: RawJournalData[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split(delimiter).map(cleanCell);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = cells[index] ?? '';
    });

    rawRows.push(record as RawJournalData);
  }

  return mapJournalsFromJson(rawRows);
};
