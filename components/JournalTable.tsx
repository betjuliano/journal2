import React, { useState, useEffect } from 'react';
import { Journal, CapesRating, SortField, SortDirection } from '../types';

interface JournalTableProps {
  data: Journal[];
  onSelectJournal: (journal: Journal) => void;
}

type ColumnId = 'journal_name' | 'issn' | 'issn_e' | 'publisher' | 'capes_points' | 'abdc' | 'abs' | 'scielo' | 'jif' | 'jcr_quartile' | 'citescore' | 'sjr' | 'sjr_score' | 'spell' | 'info' | 'actions';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
}

const STORAGE_KEY_COLUMNS = 'journalscope_columns_config_v2'; // Bumped version to reset or force merge

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'journal_name', label: 'Journal', visible: true },
  { id: 'issn', label: 'ISSN (P)', visible: false }, // Disabled by default
  { id: 'issn_e', label: 'ISSN (E)', visible: false }, // Disabled by default
  { id: 'publisher', label: 'Editora', visible: false }, // Disabled by default
  { id: 'capes_points', label: 'CAPES', visible: true },
  { id: 'abdc', label: 'ABDC', visible: true },
  { id: 'abs', label: 'ABS', visible: true },
  { id: 'scielo', label: 'Scielo', visible: true },
  { id: 'jif', label: 'JIF', visible: true },
  { id: 'jcr_quartile', label: 'JCR (Q)', visible: false }, // Disabled by default (usually combined with JIF)
  { id: 'citescore', label: 'CiteScore', visible: true },
  { id: 'sjr', label: 'SJR (Q)', visible: true },
  { id: 'sjr_score', label: 'SJR Score', visible: false }, // Disabled by default
  { id: 'spell', label: 'Spell', visible: true },
  { id: 'info', label: 'Info', visible: true },
  { id: 'actions', label: 'Ações', visible: true },
];

const JournalTable: React.FC<JournalTableProps> = ({ data, onSelectJournal }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [sortField, setSortField] = useState<SortField>('capes_points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  
  // Load columns with merge logic
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Merge logic: Keep saved preferences, but ensure new default columns exist
          const parsedIds = new Set(parsed.map((c: ColumnConfig) => c.id));
          const newCols = DEFAULT_COLUMNS.filter(c => !parsedIds.has(c.id));
          return [...parsed, ...newCols];
        } catch (e) {
          console.error('Error parsing columns config', e);
        }
      }
    }
    return DEFAULT_COLUMNS;
  });

  // Persist columns changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columns));
  }, [columns]);

  const handleSort = (field: string) => {
    // Only sortable fields
    const sortableFields = ['journal_name', 'capes_points', 'sjr', 'citescore', 'spell', 'jif'];
    if (!sortableFields.includes(field)) return;

    const typedField = field as SortField;
    if (typedField === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(typedField);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal: any = a[fieldToProp(sortField)];
    let bVal: any = b[fieldToProp(sortField)];

    // Handle nulls
    if (aVal === null) aVal = -1;
    if (bVal === null) bVal = -1;

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Column Management
  const toggleColumn = (id: ColumnId) => {
    setColumns(prev => prev.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newColumns = [...columns];
    if (direction === 'up' && index > 0) {
      [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
    } else if (direction === 'down' && index < newColumns.length - 1) {
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    }
    setColumns(newColumns);
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
  };

  // Helper Render Functions
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

  const getQuartileBadge = (quartile: string) => {
    const q = quartile.toUpperCase();
    let style = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    if (q === 'Q1') style = 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    else if (q === 'Q2') style = 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    else if (q === 'Q3') style = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    else if (q === 'Q4') style = 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${style}`}>
        {quartile}
      </span>
    );
  };

  const renderCell = (journal: Journal, columnId: ColumnId) => {
    switch (columnId) {
      case 'journal_name':
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{journal.journal_name}</span>
            {/* Only show ISSN here if separate ISSN columns are hidden to save space, otherwise redundant? 
                Let's keep it for context unless ISSN column is enabled. But simplicity first. */}
            <span className="text-xs text-gray-400 font-normal">ISSN: {journal.issn_print}</span>
          </div>
        );
      case 'issn':
        return <div className="text-center text-xs font-mono">{journal.issn_print || '-'}</div>;
      case 'issn_e':
        return <div className="text-center text-xs font-mono">{journal.issn_e || '-'}</div>;
      case 'publisher':
        return <div className="text-center text-xs text-gray-600 dark:text-gray-400">{journal.publisher}</div>;
      case 'capes_points':
        return <div className="text-center">{getCapesBadge(journal.capes_new)}</div>;
      case 'abdc':
        return <div className="text-center">{journal.abdc ? <span className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded">{journal.abdc}</span> : '-'}</div>;
      case 'abs':
        return <div className="text-center">{journal.abs ? <span className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded">{journal.abs}</span> : '-'}</div>;
      case 'scielo':
        return <div className="text-center">{journal.is_scielo ? <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-bold px-2 py-0.5 rounded">Sim</span> : <span className="text-gray-400 text-xs">-</span>}</div>;
      case 'jif':
        return (
          <div className="text-center">
            {journal.jif ? (
              <div className="flex flex-col items-center">
                <span className="text-gray-900 dark:text-white font-medium">{journal.jif}</span>
                {journal.jcr_quartile && <span className="text-[10px] text-gray-500">{journal.jcr_quartile}</span>}
              </div>
            ) : (journal.jcr_quartile ? <span className="text-xs text-gray-500">{journal.jcr_quartile}</span> : '-')}
          </div>
        );
      case 'jcr_quartile':
        return (
          <div className="text-center">
             {journal.jcr_quartile ? getQuartileBadge(journal.jcr_quartile) : '-'}
          </div>
        );
      case 'citescore':
        return (
          <div className="text-center">
             {journal.citescore ? (
               <div className="flex flex-col items-center">
                 <span className="text-gray-900 dark:text-white font-medium">{journal.citescore}</span>
               </div>
             ) : '-'}
          </div>
        );
      case 'sjr':
        return (
           <div className="text-center">
            {journal.sjr_quartile ? (
              getQuartileBadge(journal.sjr_quartile)
            ) : (journal.sjr ? <span className="text-xs text-gray-500">{journal.sjr}</span> : '-')}
           </div>
        );
      case 'sjr_score':
        return (
          <div className="text-center">
            {journal.sjr ? <span className="text-gray-900 dark:text-white text-sm">{journal.sjr}</span> : '-'}
          </div>
        );
      case 'spell':
        return <div className="text-center font-mono text-xs">{journal.spell ? journal.spell.toFixed(3) : '-'}</div>;
      case 'info':
        return (
          <div className="text-center flex justify-center gap-2">
            {journal.is_wiley && (
              <span title="Wiley" className="text-blue-500 font-bold text-xs border border-blue-500 rounded px-1">W</span>
            )}
          </div>
        );
      case 'actions':
        return (
          <div className="text-right">
             <button 
                onClick={() => onSelectJournal(journal)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
          </div>
        );
      default:
        return null;
    }
  };

  const getHeaderStyle = (colId: string) => {
    // Center text for most columns, left for Name, right for Actions
    if (colId === 'journal_name') return 'text-left';
    if (colId === 'actions') return 'text-right';
    return 'text-center';
  };

  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="relative">
      
      {/* Settings Button (Floating or Top Right) */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
            showSettings 
             ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-slate-700 dark:text-white dark:border-slate-600'
             : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700 dark:hover:bg-slate-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.281c-.09.543-.56.941-1.11.941h-2.592c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Colunas
        </button>
      </div>

      {/* Settings Modal / Dropdown */}
      {showSettings && (
        <div className="absolute right-0 top-10 z-20 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 animate-fadeIn p-4">
          <div className="flex justify-between items-center mb-3">
             <h4 className="text-sm font-bold text-gray-900 dark:text-white">Organizar Colunas</h4>
             <button onClick={resetColumns} className="text-xs text-primary-600 hover:underline dark:text-primary-400">Resetar</button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {columns.map((col, idx) => (
              <div key={col.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded group border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={col.visible}
                    onChange={() => toggleColumn(col.id)}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span className={`text-sm ${col.visible ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{col.label}</span>
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    disabled={idx === 0}
                    onClick={() => moveColumn(idx, 'up')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button 
                    disabled={idx === columns.length - 1}
                    onClick={() => moveColumn(idx, 'down')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 text-center">
             <button onClick={() => setShowSettings(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Fechar</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400 border-b dark:border-slate-700">
              <tr>
                {visibleColumns.map(col => (
                  <th 
                    key={col.id} 
                    scope="col" 
                    className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 ${getHeaderStyle(col.id)}`}
                    onClick={() => handleSort(col.id)}
                  >
                    <div className={`flex items-center gap-1 ${getHeaderStyle(col.id) === 'text-right' ? 'justify-end' : getHeaderStyle(col.id) === 'text-center' ? 'justify-center' : 'justify-start'}`}>
                      {col.label} 
                      {sortField === col.id && (
                        <span className="text-primary-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((journal) => (
                <tr 
                  key={journal.id} 
                  className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {visibleColumns.map(col => (
                    <td key={col.id} className="px-6 py-4">
                      {renderCell(journal, col.id)}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum periódico encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <span className="text-sm text-gray-700 dark:text-gray-400">
            Mostrando <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> de <span className="font-semibold">{sortedData.length}</span>
          </span>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Anterior
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function fieldToProp(field: SortField): keyof Journal {
  return field;
}

export default JournalTable;