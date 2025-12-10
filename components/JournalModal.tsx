import React, { useState, useEffect } from 'react';
import { Journal, CapesRating } from '../types';

interface JournalModalProps {
  journal: Journal | null;
  onClose: () => void;
  onSubmitToJournal: (journalName: string) => void;
}

const JournalModal: React.FC<JournalModalProps> = ({ journal, onClose, onSubmitToJournal }) => {
  const [showTopicSearch, setShowTopicSearch] = useState(false);
  const [topic, setTopic] = useState('');

  // Reset state when journal changes
  useEffect(() => {
    if (journal) {
      setShowTopicSearch(false);
      setTopic('');
    }
  }, [journal]);

  if (!journal) return null;

  const capesDesc = {
    [CapesRating.MB]: 'Muito Bom (8 pontos)',
    [CapesRating.B]: 'Bom (4 pontos)',
    [CapesRating.R]: 'Regular (2 pontos)',
    [CapesRating.F]: 'Fraco (1 ponto)',
    [CapesRating.I]: 'Insuficiente / Não Classificado',
  };

  const handleTopicSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    // Google Scholar search: source:"Journal Name" "Topic"
    const query = `source:"${journal.journal_name}" "${topic}"`;
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitAction = () => {
    // Abre a busca no Google
    window.open(`https://www.google.com/search?q=${encodeURIComponent(journal.journal_name)}`, '_blank');
    // Navega para submissão
    onSubmitToJournal(journal.journal_name);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                  {journal.journal_name}
                </h3>
                <div className="mt-1 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>ISSN: {journal.issn_print}</span>
                  {journal.issn_e && <span>ISSN-e: {journal.issn_e}</span>}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Publisher: {journal.publisher}
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Avaliação Quadriênio 2025-2028</h4>
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 flex items-center justify-between border border-primary-100 dark:border-primary-800">
                    <div>
                      <span className="block text-xs text-primary-600 dark:text-primary-300 font-semibold uppercase">Nova CAPES</span>
                      <span className="text-3xl font-extrabold text-primary-700 dark:text-primary-400">{journal.capes_new}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{capesDesc[journal.capes_new]}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Pontuação estimada</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricCard label="ABDC" value={journal.abdc || 'N/A'} color="bg-gray-100 dark:bg-slate-700" />
                  <MetricCard label="ABS" value={journal.abs || 'N/A'} color="bg-gray-100 dark:bg-slate-700" />
                  <MetricCard label="SJR Q" value={journal.sjr_quartile || 'N/A'} color="bg-violet-50 dark:bg-violet-900/20" textColor="text-violet-700 dark:text-violet-300" />
                  <MetricCard label="JCR Q" value={journal.jcr_quartile || 'N/A'} color="bg-indigo-50 dark:bg-indigo-900/20" textColor="text-indigo-700 dark:text-indigo-300" />
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                   <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">JCR Impact Factor</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{journal.jif ?? '-'}</span>
                   </div>
                   <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">CiteScore</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{journal.citescore ?? '-'}</span>
                   </div>
                   <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">SJR Score</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{journal.sjr ?? '-'}</span>
                   </div>
                   <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-200 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Spell</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{journal.spell ? journal.spell.toFixed(3) : '-'}</span>
                   </div>
                </div>
                
                <div className="mt-2 flex gap-2">
                    {journal.is_scielo && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Scielo
                        </span>
                    )}
                     {journal.is_wiley && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Wiley
                        </span>
                    )}
                </div>

              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-slate-700">
            {!showTopicSearch ? (
              <div className="flex flex-col sm:flex-row-reverse gap-2">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Fechar
                </button>
                <button
                  onClick={handleSubmitAction}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto sm:text-sm"
                >
                  Submeter
                </button>
                <a
                  href={`https://scholar.google.com/scholar?q=source:"${journal.journal_name}"`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  Google Scholar
                </a>
                <button
                  onClick={() => setShowTopicSearch(true)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  Verificar Tópico
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(journal.journal_name + " length words")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  Limite Palavras
                </a>
              </div>
            ) : (
              <form onSubmit={handleTopicSearch} className="flex flex-col sm:flex-row gap-2 w-full items-center animate-fadeIn">
                <div className="relative flex-grow w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`Pesquisar tópico em ${journal.journal_name}...`}
                    autoFocus
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-800 placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:text-white"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Pesquisar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTopicSearch(false)}
                    className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color, textColor = 'text-gray-900 dark:text-white' }: { label: string, value: string, color: string, textColor?: string }) => (
  <div className={`${color} rounded-lg p-3 text-center`}>
    <span className="block text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
    <span className={`block text-lg font-bold ${textColor}`}>{value}</span>
  </div>
);

export default JournalModal;