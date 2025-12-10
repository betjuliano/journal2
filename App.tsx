import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import FilterBar from './components/FilterBar';
import JournalTable from './components/JournalTable';
import JournalModal from './components/JournalModal';
import SubmissionManager from './components/SubmissionManager';
import AuthGate from './components/AuthGate';
import { mapJournalsFromJson, parseJournalCSV, RawJournalData } from './services/data';
import rawData from './data/journalsData.json';
import { FilterState, Journal } from './types';

const STORAGE_KEY = 'journalscope_db_v2';
const USER_SESSION_KEY = 'journalscope_session_user';
const MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024; // 2MB safeguard for CSV uploads
const ALLOWED_IMPORT_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
const initialJournalsData: Journal[] = mapJournalsFromJson(rawData as RawJournalData[]);

const isJournalRecord = (value: any): value is Journal => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.journal_name === 'string' &&
    typeof value.id === 'number'
  );
};

const sanitizeStoredData = (data: unknown): Journal[] | null => {
  if (!Array.isArray(data)) return null;
  const filtered = data.filter(isJournalRecord).map((item, index) => ({
    ...item,
    // Ensure fields cannot be poisoned by prototype pollution
    journal_name: item.journal_name.toString(),
    id: typeof item.id === 'number' ? item.id : index,
  }));

  return filtered.length > 0 ? filtered : null;
};

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
  const [allJournals, setAllJournals] = useState<Journal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const sanitized = sanitizeStoredData(parsed);
          if (sanitized) return sanitized;

          // Remove corrupted storage to avoid reusing unsafe data
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
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
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(USER_SESSION_KEY);
    }
    return null;
  });

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

  const handleAuthenticated = (email: string) => {
    setCurrentUser(email);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_SESSION_KEY, email);
    }
    setCurrentView('submissions');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_SESSION_KEY);
    }
    setCurrentView('journals');
  };

  const handleSubmitToJournal = (journalName: string) => {
    setSubmissionJournalName(journalName);
    setCurrentView('submissions');
    setSelectedJournal(null);
  };

  const handleDataImport = (file: File) => {
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      alert('Arquivo muito grande. Limite máximo de 2MB para importação.');
      return;
    }

    if (file.type && !ALLOWED_IMPORT_TYPES.includes(file.type)) {
      alert('Formato de arquivo não suportado. Utilize um CSV válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsedData = parseJournalCSV(content);
          setAllJournals(parsedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
          alert(`${parsedData.length} periódicos importados e salvos com sucesso! A base de dados será mantida ao recarregar a página.`);
        } catch (err) {
          console.error(err);
          alert(err instanceof Error ? err.message : 'Erro ao processar o arquivo CSV. Verifique o formato.');
        }
      }
    };

    reader.onerror = () => {
      alert('Não foi possível ler o arquivo selecionado. Tente novamente.');
    };

    reader.readAsText(file, 'utf-8');
  };

  const filteredData = useMemo(() => {
    let result = allJournals;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(j =>
        j.journal_name.toLowerCase().includes(q) ||
        j.issn_print?.includes(q) ||
        j.issn_e?.includes(q)
      );
    }

    if (filters.topTier) {
      result = result.filter(j => j.abdc === 'A*' || j.abs === '4*');
    }
    if (filters.highQuality) {
      result = result.filter(j => ['A*', 'A'].includes(j.abdc) || ['4*', '4'].includes(j.abs));
    }
    if (filters.isWiley) {
      result = result.filter(j => j.is_wiley);
    }

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
          currentUser ? (
            <SubmissionManager
              initialJournalName={submissionJournalName}
              onClearInitialJournal={() => setSubmissionJournalName(null)}
              userEmail={currentUser}
              onLogout={handleLogout}
            />
          ) : (
            <AuthGate onAuthenticated={handleAuthenticated} />
          )
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
