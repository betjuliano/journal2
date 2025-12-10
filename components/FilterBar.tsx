import React, { useRef } from 'react';
import { FilterState, CapesRating } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onImportData?: (file: File) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, onImportData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const toggleQuickFilter = (key: keyof Pick<FilterState, 'topTier' | 'highQuality' | 'isWiley'>) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDropdownChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? [] : [value] 
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      capes: [],
      abdc: [],
      abs: [],
      quartiles: [],
      isWiley: false,
      topTier: false,
      highQuality: false,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && onImportData) {
      onImportData(event.target.files[0]);
      // Reset value so same file can be selected again if needed
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6 space-y-4">
      
      {/* Quick Filters & Actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filtros Rápidos:</span>
          <button
            onClick={() => toggleQuickFilter('topTier')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filters.topTier 
                ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300' 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-400 dark:hover:bg-slate-700'
            }`}
          >
            🏆 Top Tier (A* / 4*)
          </button>
          <button
            onClick={() => toggleQuickFilter('highQuality')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filters.highQuality 
                ? 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-400 dark:hover:bg-slate-700'
            }`}
          >
            ⭐ Alta Qualidade (A / 4)
          </button>
          <button
            onClick={() => toggleQuickFilter('isWiley')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filters.isWiley 
                ? 'bg-purple-100 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300' 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-400 dark:hover:bg-slate-700'
            }`}
          >
            📚 Apenas Wiley
          </button>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 underline decoration-dotted"
          >
            Limpar filtros
          </button>
          
          {onImportData && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileChange} 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                title="Importar base de dados completa via CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Importar CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
          <input
            type="text"
            placeholder="Buscar por nome ou ISSN..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select 
          onChange={(e) => handleDropdownChange('capes', e.target.value)}
          className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2"
        >
          <option value="all">Classificação CAPES (Todas)</option>
          <option value={CapesRating.MB}>MB (8 pontos)</option>
          <option value={CapesRating.B}>B (4 pontos)</option>
          <option value={CapesRating.R}>R (2 pontos)</option>
          <option value={CapesRating.F}>F (1 ponto)</option>
        </select>

        <select 
          onChange={(e) => handleDropdownChange('abdc', e.target.value)}
          className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2"
        >
          <option value="all">ABDC (Todas)</option>
          <option value="A*">A*</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>

        <select 
          onChange={(e) => handleDropdownChange('abs', e.target.value)}
          className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2"
        >
          <option value="all">ABS (Todas)</option>
          <option value="4*">4*</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>

        <select 
          onChange={(e) => handleDropdownChange('quartiles', e.target.value)}
          className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2"
        >
          <option value="all">Quartis SJR/JCR (Todos)</option>
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;