import React, { useState, useEffect, useMemo } from 'react';
// ... imports de componentes (Header, StatsCards, etc mantidos) ...
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import FilterBar from './components/FilterBar';
import JournalTable from './components/JournalTable';
import JournalModal from './components/JournalModal';
import SubmissionManager from './components/SubmissionManager';

// 1. IMPORTAR A NOVA FUNÇÃO E O ARQUIVO JSON
import { mapJournalsFromJson, RawJournalData } from './services/data';
import rawData from './data/journalsData.json'; // O arquivo do Python
import { FilterState, Journal } from './types';

const STORAGE_KEY = 'journalscope_db_v2'; // Mudei a versão para limpar cache antigo

// 2. PREPARAR OS DADOS INICIAIS
// Convertemos o JSON bruto para o formato da aplicação assim que o arquivo carrega
const initialJournalsData: Journal[] = mapJournalsFromJson(rawData as RawJournalData[]);

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [currentView, setCurrentView] = useState<'journals' | 'submissions'>('journals');
  
  // 3. ATUALIZAR O STATE INICIAL
  const [allJournals, setAllJournals] = useState<Journal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        // Se tiver dados salvos no localStorage, usa eles.
        // Se não, usa o JSON importado do Python (initialJournalsData)
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
      }
    }
    // Aqui entra o fallback para o seu JSON novo
    return initialJournalsData;
  });

const STORAGE_KEY = 'journalscope_db_v1';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [currentView, setCurrentView] = useState<'journals' | 'submissions'>('journals');
  
  // Initialize journals from localStorage if available, otherwise use default data
  const [allJournals, setAllJournals] = useState<Journal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
      }
    }
    return initialJournalsData;
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    capes: [],
    abdc: [],
    abs: [],
    quartiles: [],
    isWiley: false,
    topTier: false,
    highQuality: false,
  });

  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [submissionJournalName, setSubmissionJournalName] = useState<string | null>(null);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleSubmitToJournal = (journalName: string) => {
    setSubmissionJournalName(journalName);
    setCurrentView('submissions');
    setSelectedJournal(null);
  };

  const handleDataImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsedData = parseJournalCSV(content);
          setAllJournals(parsedData);
          
          // Attempt to save to localStorage
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
            alert(`${parsedData.length} periódicos importados e salvos com sucesso! A base de dados será mantida ao recarregar a página.`);
          } catch (storageError) {
            console.error(storageError);
            alert(`${parsedData.length} periódicos importados, mas não foi possível salvar no navegador (limite de armazenamento excedido).`);
          }
          
        } catch (err) {
          alert('Erro ao processar o arquivo CSV. Verifique o formato.');
          console.error(err);
        }
      }
    };
    reader.readAsText(file); // Default encoding, generally UTF-8 is expected for modern CSVs
  };

  // Filter Logic (Memoized for performance)
  const filteredData = useMemo(() => {
    let result = allJournals;

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(j => 
        j.journal_name.toLowerCase().includes(q) || 
        j.issn_print?.includes(q) || 
        j.issn_e?.includes(q)
      );
    }

    // Quick Filters
    if (filters.topTier) {
      result = result.filter(j => j.abdc === 'A*' || j.abs === '4*');
    }
    if (filters.highQuality) {
      result = result.filter(j => ['A*', 'A'].includes(j.abdc) || ['4*', '4'].includes(j.abs));
    }
    if (filters.isWiley) {
      result = result.filter(j => j.is_wiley);
    }

    // Advanced Dropdowns
    if (filters.capes.length > 0) {
      result = result.filter(j => filters.capes.includes(j.capes_new));
    }
    if (filters.abdc.length > 0) {
      result = result.filter(j => filters.abdc.includes(j.abdc));
    }
    if (filters.abs.length > 0) {
      result = result.filter(j => filters.abs.some(f => j.abs === f));
    }
    if (filters.quartiles.length > 0) {
      result = result.filter(j => 
        filters.quartiles.includes(j.sjr_quartile) || 
        filters.quartiles.includes(j.jcr_quartile)
      );
    }

    return result;
  }, [filters, allJournals]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <Header 
        darkMode={darkMode} 
        toggleTheme={toggleTheme} 
        currentView={currentView}
        setView={setCurrentView}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'journals' && (
          <>
            <StatsCards data={filteredData} />
            <FilterBar 
              filters={filters} 
              setFilters={setFilters} 
              onImportData={handleDataImport}
            />
            <JournalTable 
              data={filteredData} 
              onSelectJournal={setSelectedJournal} 
            />
          </>
        )}

        {currentView === 'submissions' && (
          <SubmissionManager 
            initialJournalName={submissionJournalName}
            onClearInitialJournal={() => setSubmissionJournalName(null)}
          />
        )}
      </main>

      <JournalModal 
        journal={selectedJournal} 
        onClose={() => setSelectedJournal(null)} 
        onSubmitToJournal={handleSubmitToJournal}
      />
    </div>
  );
}

export default App;