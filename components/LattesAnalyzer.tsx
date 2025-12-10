
import React, { useState, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { LattesProfile, LattesArticle, LattesTechProduct, LattesGeneralSection, CapesRating, Journal, LattesAuthor } from '../types';

// PDF.js worker setup
const pdfjsModule = pdfjsLib as any;
const pdfjs = pdfjsModule.default ?? pdfjsModule;

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

// Helper function to render CAPES badge
const getCapesBadge = (rating: CapesRating) => {
  const colors = {
    [CapesRating.MB]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    [CapesRating.B]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [CapesRating.R]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [CapesRating.F]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    [CapesRating.I]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[rating]}`}>
      {rating}
    </span>
  );
};

interface LattesAnalyzerProps {
  journalsData: Journal[];
}

const LattesAnalyzer: React.FC<LattesAnalyzerProps> = ({ journalsData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<LattesProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'production' | 'overview'>('production');
  const [quadrennium, setQuadrennium] = useState<'2013-2016' | '2017-2020' | '2021-2024' | '2025-2028'>('2021-2024');

  // State to manage author institutions across the session
  const [authorInstitutions, setAuthorInstitutions] = useState<Record<string, string>>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      if (file.name.endsWith('.pdf')) {
        await processPDF(file);
      } else {
        throw new Error('Por favor, envie o arquivo PDF do Currículo Lattes.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const processPDF = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Use a delimiter to preserve line structure, crucial for detecting item starts
        const pageText = textContent.items.map((item: any) => item.str).join('\n');
        fullText += pageText + '\n';
      }
      
      parseLattesPDFStructured(fullText);
    } catch (e: any) {
      console.error("PDF Processing Error:", e);
      throw new Error("Erro ao ler o PDF. O arquivo pode estar corrompido ou protegido.");
    }
  };

  // --- PARSING ENGINE ---

  const parseLattesPDFStructured = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Attempt to find name: usually first few lines, not "Lattes" or "CNPq"
    const nameLine = lines.find(l => l.length > 5 && !l.includes('Lattes') && !l.includes('CNPq') && !l.includes('http')) || 'Pesquisador';
    
    const articles: LattesArticle[] = [];
    const techProducts: LattesTechProduct[] = [];
    const generalSections: LattesGeneralSection[] = [];

    let currentSection = '';
    let itemBuffer: string[] = []; 

    // Sections map to normalize parsing behavior
    const sectionMap: Record<string, string> = {
      'Artigos completos publicados em periódicos': 'ARTICLES',
      'Produtos tecnológicos': 'TECH',
      // Add other specific sections if needed
    };

    const flushItem = () => {
      if (itemBuffer.length === 0) return;
      
      const fullItemText = itemBuffer.join(' '); // Join with space to reconstruct paragraph
      
      if (sectionMap[currentSection] === 'ARTICLES') {
        parseArticleItem(fullItemText, articles);
      } else if (sectionMap[currentSection] === 'TECH') {
        parseTechItem(fullItemText, techProducts);
      } else {
        // Generic Section Item
        const cleanText = fullItemText.replace(/\s+/g, ' ');
        if (cleanText.length > 5) { // Noise filter
           let sec = generalSections.find(s => s.title === currentSection);
           if (!sec) {
             sec = { title: currentSection, items: [] };
             generalSections.push(sec);
           }
           sec.items.push(cleanText);
        }
      }
      itemBuffer = [];
    };

    // Major Lattes Sections Headers (Heuristic list)
    const knownHeaders = [
      'Dados Gerais', 'Resumo', 'Identificação', 'Endereço', 'Formação acadêmica/titulação', 
      'Pós-doutorado', 'Atuação Profissional', 'Projetos de pesquisa', 'Projetos de extensão', 
      'Membro de corpo editorial', 'Revisor de periódico', 'Revisor de projeto de fomento', 
      'Áreas de atuação', 'Prêmios e títulos', 'Produções', 'Produção bibliográfica', 
      'Artigos completos publicados em periódicos', 'Livros publicados', 'Capítulos de livros publicados',
      'Textos em jornais de notícias/revistas', 'Trabalhos completos publicados em anais de congressos',
      'Resumos expandidos publicados em anais de congressos', 'Resumos publicados em anais de congressos',
      'Artigos aceitos para publicação', 'Apresentações de Trabalho', 'Demais tipos de produção bibliográfica',
      'Produção técnica', 'Assessoria e consultoria', 'Produtos tecnológicos', 'Processos ou técnicas',
      'Trabalhos técnicos', 'Bancas', 'Participação em bancas de trabalhos de conclusão',
      'Participação em bancas de comissões julgadoras', 'Eventos', 'Participação em eventos',
      'Organização de eventos', 'Orientações', 'Orientações e supervisões em andamento',
      'Orientações e supervisões concluídas', 'Inovação', 'Patentes e registros', 'Educação e Popularização de C & T'
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Check for Section Header
      // We look for exact match or contained match for robustness
      const matchedHeader = knownHeaders.find(h => line.toLowerCase() === h.toLowerCase() || (line.length < 50 && line.toLowerCase().startsWith(h.toLowerCase())));
      
      if (matchedHeader) {
        flushItem(); // Flush previous item
        currentSection = matchedHeader; // Use standardized name if possible, or line
        continue;
      }

      // 2. Check for Item Start (Pattern: "1.", "2.", "15.")
      // Only treat as new item if we are inside a list-based section
      const isListItemStart = /^\d+\.$/.test(line);

      if (isListItemStart) {
        flushItem(); // Previous item done
        // Don't add the number line itself to buffer, it's just a marker in Lattes PDF usually
        continue; 
      }

      // 3. Ignore PDF Artifacts
      if (line.includes('Página gerada pelo Sistema Currículo Lattes')) continue;
      if (line.match(/^\d{2}\/\d{2}\/\d{4}$/)) continue; // Date lines often at bottom

      // 4. Add to buffer
      itemBuffer.push(line);
    }
    flushItem(); // Final flush

    setProfile({
      name: nameLine,
      lastUpdate: new Date().toLocaleDateString(),
      abstract: '',
      projects: [],
      articles,
      techProducts,
      generalSections
    });
  };

  const parseArticleItem = (text: string, list: LattesArticle[]) => {
    // Pattern: AUTHORS. Title. Journal, Metadata. (Next Line/Block) ISSN info.
    // Lattes text is now joined by spaces.
    // Example: "POTRICH, A. ; VIEIRA, K. M. . Title here. Journal Name, v. 10, p. 123, 2024. A2, ISSN 1234-5678"
    
    // 1. Extract ISSN
    // Look for ISSN pattern anywhere in the text block.
    const issnMatch = text.match(/ISSN\s+([-0-9]{9})/i);
    const issn = issnMatch ? issnMatch[1] : '';

    // 2. Extract Year
    // Usually found before ISSN line or at end of citation. Look for year pattern 19xx or 20xx
    // We prefer the year that appears near metadata markers like "p.", "v."
    let year = 0;
    const yearMatches = [...text.matchAll(/(?:19|20)\d{2}/g)];
    if (yearMatches.length > 0) {
        // If multiple years, the publication year is usually the last one before ISSN info starts
        // Or simply the last one found if we exclude the ISSN line part.
        const cleanText = issnMatch ? text.substring(0, issnMatch.index) : text;
        const cleanYears = [...cleanText.matchAll(/(?:19|20)\d{2}/g)];
        if (cleanYears.length > 0) {
            year = parseInt(cleanYears[cleanYears.length - 1][0]);
        }
    }
    if (year === 0) year = new Date().getFullYear(); // Fallback

    // 3. Extract Authors, Title, Journal
    // Pattern: AUTHORS . TITLE . JOURNAL , V. ...
    // Split by ". " is the most reliable first step.
    
    // Remove the ISSN/Qualis part for cleaner parsing of citation
    let citationText = issnMatch ? text.substring(0, issnMatch.index) : text;
    // Also remove leading "1 " or "1. " if it got stuck
    citationText = citationText.replace(/^\d+\.\s*/, '');

    // Strategy:
    // Authors end at the first ". " that follows a sequence of UPPERCASE names.
    // Journal starts after Title. Journal is followed by ", v." or ", n." or ", p." or ", (Year)"
    
    let authorsStr = '';
    let title = '';
    let journalName = '';

    // Find the start of metadata (volume, number, pages, year) to delineate Journal end
    const metaStartRegex = /,\s+(?:v\.|n\.|p\.|(?:19|20)\d{2})/;
    const metaMatch = citationText.match(metaStartRegex);

    if (metaMatch && metaMatch.index) {
        const preMeta = citationText.substring(0, metaMatch.index);
        
        // preMeta contains: "AUTHORS . TITLE . JOURNAL"
        // Let's split by ". "
        // However, authors might use abbreviated names like "VIEIRA, K. M." which contains dots.
        // But Lattes usually puts spaces after dots in names. The separator is ". " (dot space).
        // Let's try to split by ". "
        const segments = preMeta.split('. ');
        
        if (segments.length >= 3) {
            // Last segment is Journal
            journalName = segments[segments.length - 1];
            // First segment is definitely Authors
            authorsStr = segments[0];
            // Everything in between is Title (title might have sentences ending in dot)
            title = segments.slice(1, segments.length - 1).join('. ');
        } else if (segments.length === 2) {
            // Authors . Title+Journal (maybe journal is missing or merged)
            authorsStr = segments[0];
            title = segments[1]; // Fallback
            journalName = "N/D";
        } else {
            authorsStr = preMeta;
            title = "N/D";
            journalName = "N/D";
        }
    } else {
        // Fallback if metadata pattern not found
        const parts = citationText.split('. ');
        authorsStr = parts[0] || '';
        title = parts[1] || '';
        journalName = parts[2] || '';
    }

    // Clean strings
    authorsStr = authorsStr.trim();
    title = title.trim();
    journalName = journalName.trim();

    // Process Authors
    const authorNames = authorsStr.split(';').map(s => s.trim()).filter(s => s);
    const authors: LattesAuthor[] = authorNames.map(name => ({
      name: name.replace(/,$/, ''), // remove trailing comma if any
      institution: '' // populated via interaction
    }));

    // Match Database
    const match = matchJournal(journalName, issn);

    list.push({
      id: `art-${list.length}-${Date.now()}`,
      fullText: text,
      title,
      authors,
      journalName,
      issn,
      year,
      capesRating: match.rating,
      points: match.points,
      matchedJournalId: match.matchedId
    });
  };

  const parseTechItem = (text: string, list: LattesTechProduct[]) => {
    // Basic parser for tech items
    // Pattern usually: AUTHORS. Title. Year. Description.
    let year = 0;
    const yearMatch = text.match(/(?:19|20)\d{2}/g);
    if (yearMatch) {
      year = parseInt(yearMatch[yearMatch.length - 1]);
    }

    // Attempt to extract title: Text between first dot and year?
    // Crude approximation
    const parts = text.split('. ');
    const title = parts.length > 1 ? parts[1] : text.substring(0, 50);

    list.push({
      id: `tech-${list.length}`,
      fullText: text,
      title,
      year,
      description: text
    });
  };

  const matchJournal = (name: string, issn: string): { rating: CapesRating, points: number, matchedId?: number } => {
    // 1. ISSN Match (Clean dashes)
    if (issn) {
        const cleanIssn = issn.replace('-', '');
        const match = journalsData.find(j => 
            j.issn_print.replace('-', '') === cleanIssn || 
            j.issn_e.replace('-', '') === cleanIssn
        );
        if (match) return { rating: match.capes_new, points: match.capes_points, matchedId: match.id };
    }

    // 2. Name Match (Normalize)
    if (name && name !== 'N/D') {
        const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normName.length > 3) {
            const match = journalsData.find(j => {
                const jName = j.journal_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                return jName === normName;
            });
            if (match) return { rating: match.capes_new, points: match.capes_points, matchedId: match.id };
        }
    }

    return { rating: CapesRating.I, points: 0 };
  };

  // --- UI HELPERS ---

  const updateAuthorInstitution = (authorName: string, institution: string) => {
    setAuthorInstitutions(prev => ({
        ...prev,
        [authorName]: institution
    }));
  };

  // Derived Data
  const getQuadrenniumYears = (q: string): number[] => {
    const [start, end] = q.split('-').map(Number);
    return [start, start + 1, start + 2, end];
  };
  const quadYears = getQuadrenniumYears(quadrennium);
  
  const quadArticles = useMemo(() => {
    if (!profile) return [];
    return profile.articles
        .filter(a => quadYears.includes(a.year))
        .sort((a, b) => b.points - a.points);
  }, [profile, quadrennium]);

  const totalPoints = quadArticles.reduce((acc, curr) => acc + curr.points, 0);
  
  const topArticles = quadArticles.slice(0, 4);
  const articles8Points = quadArticles.filter(a => a.points === 8).length;

  const quadTechProducts = useMemo(() => {
      if (!profile) return [];
      return profile.techProducts.filter(t => quadYears.includes(t.year));
  }, [profile, quadrennium]);

  const coAuthorStats = useMemo(() => {
      if (!profile) return [];
      const stats: Record<string, number> = {};
      profile.articles.forEach(art => {
          art.authors.forEach(auth => {
              // Normalize name to avoid dupes?
              const inst = authorInstitutions[auth.name];
              if (inst && auth.name.toUpperCase() !== profile.name.toUpperCase()) {
                  stats[inst] = (stats[inst] || 0) + 1;
              }
          });
      });
      return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [profile, authorInstitutions]);


  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 text-center animate-fadeIn">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Importar Currículo Lattes</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Carregue o PDF do seu Currículo Lattes para análise automática.
          </p>
        </div>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-800 hover:bg-gray-100 dark:border-slate-600 dark:hover:border-gray-500 transition-colors group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {loading ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-primary-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Processando PDF...</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-3 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Clique para enviar PDF</span></p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={loading} />
          </label>
        </div>
        
        {error && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300 flex items-start text-left" role="alert">
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-primary-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
           <p className="text-sm text-gray-500 mt-1">Currículo atualizado em: {profile.lastUpdate}</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setProfile(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
                Nova Análise
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('production')}
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'production' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Produção & Pontuação
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'overview' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Visão Geral
        </button>
      </div>

      {/* TAB: PRODUCTION */}
      {activeTab === 'production' && (
        <div className="space-y-8">
          
          {/* Top 4 Highlights */}
          {topArticles.length > 0 && (
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Destaques (Top 4)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topArticles.map((art, idx) => (
                    <div key={art.id} className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800/50 p-4 rounded-lg shadow border border-gray-200 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                        #{idx + 1}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        {getCapesBadge(art.capesRating)}
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{art.points} pts</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-3 mb-2 min-h-[3rem]" title={art.title}>
                        {art.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">{art.journalName}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <span>{art.year}</span>
                        <span className="font-mono">{art.issn}</span>
                    </div>
                    </div>
                ))}
                </div>
            </div>
          )}

          {/* Quadrennium Selector & Main Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-slate-900/50">
              <div className="flex overflow-x-auto w-full sm:w-auto">
                {['2013-2016', '2017-2020', '2021-2024', '2025-2028'].map((period) => (
                    <button
                    key={period}
                    onClick={() => setQuadrennium(period as any)}
                    className={`flex-1 py-3 px-6 text-center border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                        quadrennium === period
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                    }`}
                    >
                    {period}
                    </button>
                ))}
              </div>
              <div className="p-3 flex gap-4 text-sm">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-100 rounded-full border border-emerald-300"></span>
                    <span className="text-gray-600 dark:text-gray-300">Total: <strong className="text-gray-900 dark:text-white">{totalPoints} pts</strong></span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-100 rounded-full border border-blue-300"></span>
                    <span className="text-gray-600 dark:text-gray-300">Artigos (8pts): <strong className="text-gray-900 dark:text-white">{articles8Points}</strong></span>
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-300 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 w-16 text-center">Ano</th>
                            <th className="px-4 py-3 w-1/4">Journal</th>
                            <th className="px-4 py-3 w-1/4">Autores <span className="normal-case font-normal text-gray-400 text-[10px] ml-1">(Clique p/ editar)</span></th>
                            <th className="px-4 py-3 w-1/3">Título</th>
                            <th className="px-4 py-3 text-center">ISSN</th>
                            <th className="px-4 py-3 text-center">Pontos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {quadArticles.length > 0 ? (
                            quadArticles.map((art) => (
                                <tr key={art.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">{art.year}</td>
                                    <td className="px-4 py-3 font-medium text-primary-700 dark:text-primary-400">{art.journalName}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {art.authors.map((auth, i) => {
                                                const institution = authorInstitutions[auth.name];
                                                return (
                                                    <span 
                                                        key={i}
                                                        onClick={() => {
                                                            const newInst = prompt(`Informe a instituição para ${auth.name}:`, institution || '');
                                                            if (newInst !== null) {
                                                                updateAuthorInstitution(auth.name, newInst);
                                                            }
                                                        }}
                                                        className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors border select-none ${
                                                            institution 
                                                            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' 
                                                            : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300'
                                                        }`}
                                                        title={institution ? `Instituição: ${institution}` : 'Clique para adicionar instituição'}
                                                    >
                                                        {auth.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-200 text-xs leading-relaxed">{art.title}</td>
                                    <td className="px-4 py-3 text-center font-mono text-xs">{art.issn || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {getCapesBadge(art.capesRating)}
                                            <span className="font-bold text-gray-900 dark:text-white">{art.points}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    Nenhuma publicação encontrada neste quadriênio.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Technological Products Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                        </svg>
                        Produtos Tecnológicos
                    </h3>
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                        {quadTechProducts.length} Itens
                    </span>
                </div>
                {quadTechProducts.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {quadTechProducts.map((tech) => (
                            <div key={tech.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{tech.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{tech.description}</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded h-fit">{tech.year}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        Nenhum produto tecnológico encontrado neste período.
                    </div>
                )}
          </div>

          {/* Co-Author Analysis Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Análise de Origem dos Coautores</h3>
              <p className="text-sm text-gray-500 mb-6">Esta análise é baseada nas instituições informadas manualmente ao clicar nos nomes dos autores na tabela acima.</p>
              
              {coAuthorStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coAuthorStats.map(([inst, count], idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600 flex justify-between items-center">
                              <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-4" title={inst}>{inst}</span>
                              <span className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-bold px-2 py-1 rounded-full">
                                  {count} colaborações
                              </span>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
                      <p className="text-gray-500 dark:text-gray-400">Nenhuma informação de instituição adicionada ainda.</p>
                      <p className="text-xs text-gray-400 mt-2">Clique nos nomes dos autores na tabela "Produção & Pontuação" para adicionar a origem.</p>
                  </div>
              )}
          </div>

        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
             {profile.generalSections.length > 0 ? (
                profile.generalSections.map((sec, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
                    <details className="group">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-gray-50 dark:bg-slate-900/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors select-none">
                           <span className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                             <span className={`w-2 h-8 rounded-sm ${idx % 2 === 0 ? 'bg-primary-500' : 'bg-indigo-500'}`}></span>
                             {sec.title}
                           </span>
                           <div className="flex items-center gap-3">
                             <span className="text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 font-medium">
                               {sec.items.length} itens
                             </span>
                             <span className="transition-transform group-open:rotate-180 text-gray-400">
                                <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                             </span>
                           </div>
                        </summary>
                        <div className="text-gray-600 dark:text-gray-400 px-6 py-4 text-sm border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-fadeIn">
                           <ul className="space-y-4">
                             {sec.items.map((item, i) => (
                               <li key={i} className="pl-4 border-l-2 border-gray-100 dark:border-slate-700 leading-relaxed hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                                 {item}
                               </li>
                             ))}
                           </ul>
                        </div>
                    </details>
                 </div>
                ))
             ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma seção identificada no currículo.</p>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LattesAnalyzer;
