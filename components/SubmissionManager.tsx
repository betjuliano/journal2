import React, { useState, useEffect } from 'react';
import { Submission, SubmissionStatus, RevisionRound, ReviewPoint } from '../types';
import { getUserSubmissions, saveUserSubmissions } from '../services/auth';

interface SubmissionManagerProps {
  initialJournalName?: string | null;
  onClearInitialJournal?: () => void;
  userEmail: string;
  onLogout: () => void;
}

const SubmissionManager: React.FC<SubmissionManagerProps> = ({ initialJournalName, onClearInitialJournal, userEmail, onLogout }) => {
  const [submissions, setSubmissions] = useState<Submission[]>(() => getUserSubmissions(userEmail));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'revisions' | 'share'>('details');

  // Form State
  const [formData, setFormData] = useState<Submission>({
    id: '',
    journalName: '',
    paperTitle: '',
    submissionDate: new Date().toISOString().split('T')[0],
    status: SubmissionStatus.PLANNING,
    notes: '',
    revisions: [],
    sharedEmails: '',
    shareLink: ''
  });

  const generateShareLink = () => {
    return `https://journalscope.app/s/${Math.random().toString(36).substring(2, 15)}`;
  };

  useEffect(() => {
    setSubmissions(getUserSubmissions(userEmail));
  }, [userEmail]);

  useEffect(() => {
    if (initialJournalName) {
      setActiveTab('details');
      setEditingId(null);
      setFormData({
        id: '',
        journalName: initialJournalName,
        paperTitle: '',
        submissionDate: new Date().toISOString().split('T')[0],
        status: SubmissionStatus.PLANNING,
        notes: '',
        revisions: [],
        sharedEmails: '',
        shareLink: generateShareLink()
      });
      setIsModalOpen(true);
      if (onClearInitialJournal) {
        onClearInitialJournal();
      }
    }
  }, [initialJournalName]);

  const handleOpenModal = (submission?: Submission) => {
    setActiveTab('details');
    if (submission) {
      setEditingId(submission.id);
      setFormData(JSON.parse(JSON.stringify(submission))); // Deep copy to avoid reference issues with nested arrays
    } else {
      setEditingId(null);
      setFormData({
        id: '',
        journalName: '',
        paperTitle: '',
        submissionDate: new Date().toISOString().split('T')[0],
        status: SubmissionStatus.PLANNING,
        notes: '',
        revisions: [],
        sharedEmails: '',
        shareLink: generateShareLink()
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta submissão?')) {
      setSubmissions(prev => {
        const updated = prev.filter(s => s.id !== id);
        saveUserSubmissions(userEmail, updated);
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      setSubmissions(prev => {
        const updated = prev.map(s => s.id === editingId ? { ...formData, id: editingId } : s);
        saveUserSubmissions(userEmail, updated);
        return updated;
      });
    } else {
      const newSubmission: Submission = {
        ...formData,
        id: Date.now().toString()
      };
      setSubmissions(prev => {
        const updated = [newSubmission, ...prev];
        saveUserSubmissions(userEmail, updated);
        return updated;
      });
    }
    setIsModalOpen(false);
  };

  // Revision Logic
  const addRevisionRound = () => {
    const newRound: RevisionRound = {
      id: Date.now().toString(),
      roundNumber: formData.revisions.length + 1,
      receivedDate: new Date().toISOString().split('T')[0],
      deadline: '',
      points: []
    };
    setFormData(prev => ({ ...prev, revisions: [newRound, ...prev.revisions] }));
  };

  const removeRevisionRound = (roundId: string) => {
    setFormData(prev => ({ ...prev, revisions: prev.revisions.filter(r => r.id !== roundId) }));
  };

  const addReviewPoint = (roundId: string) => {
    setFormData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r => {
        if (r.id === roundId) {
          return {
            ...r,
            points: [...r.points, { 
              id: Date.now().toString(), 
              reviewerName: 'Revisor 1', 
              request: '', 
              response: '', 
              isResolved: false 
            }]
          };
        }
        return r;
      })
    }));
  };

  const updateReviewPoint = (roundId: string, pointId: string, field: keyof ReviewPoint, value: any) => {
    setFormData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r => {
        if (r.id === roundId) {
          return {
            ...r,
            points: r.points.map(p => {
              if (p.id === pointId) {
                return { ...p, [field]: value };
              }
              return p;
            })
          };
        }
        return r;
      })
    }));
  };

  const removeReviewPoint = (roundId: string, pointId: string) => {
    setFormData(prev => ({
      ...prev,
      revisions: prev.revisions.map(r => {
        if (r.id === roundId) {
          return {
            ...r,
            points: r.points.filter(p => p.id !== pointId)
          };
        }
        return r;
      })
    }));
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    const colors = {
      [SubmissionStatus.PLANNING]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      [SubmissionStatus.SUBMITTED]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      [SubmissionStatus.UNDER_REVIEW]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      [SubmissionStatus.REVISE_RESUBMIT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      [SubmissionStatus.ACCEPTED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      [SubmissionStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Submissões</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acesso de {userEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
          >
            Sair
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Submissão
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-700">
        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
          {submissions.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma submissão registrada. Clique em "Nova Submissão" para começar.
            </li>
          ) : (
            submissions.map((submission) => (
              <li key={submission.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition duration-150 ease-in-out">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                        {submission.journalName}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex gap-2">
                         {submission.revisions.length > 0 && (
                           <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">
                             {submission.revisions.length}ª Rodada
                           </span>
                         )}
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {submission.paperTitle}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4 flex-wrap">
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>
                            Submetido: <time dateTime={submission.submissionDate}>{new Date(submission.submissionDate).toLocaleDateString('pt-BR')}</time>
                          </p>
                        </div>
                        {submission.sharedEmails && (
                          <div className="flex items-center" title="Compartilhado">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Compartilhado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(submission)}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(submission.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Excluir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-2 sm:p-6 sm:pb-2 border-b border-gray-200 dark:border-slate-700">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4" id="modal-title">
                    {editingId ? 'Gerenciar Submissão' : 'Nova Submissão'}
                  </h3>
                  
                  {/* Tabs */}
                  <div className="flex space-x-4 border-b border-gray-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                      Detalhes Gerais
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('revisions')}
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'revisions' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                      Revisões & Pareceres
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('share')}
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'share' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                      Compartilhamento
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* TAB: DETAILS */}
                  {activeTab === 'details' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Artigo</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                          value={formData.paperTitle}
                          onChange={e => setFormData({...formData, paperTitle: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Journal / Conferência</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                          value={formData.journalName}
                          onChange={e => setFormData({...formData, journalName: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Submissão</label>
                          <input
                            type="date"
                            required
                            className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                            value={formData.submissionDate}
                            onChange={e => setFormData({...formData, submissionDate: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Atual</label>
                          <select
                            className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as SubmissionStatus})}
                          >
                            {Object.values(SubmissionStatus).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas Gerais</label>
                        <textarea
                          rows={4}
                          className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                          value={formData.notes}
                          onChange={e => setFormData({...formData, notes: e.target.value})}
                          placeholder="Anotações gerais sobre o processo..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB: REVISIONS */}
                  {activeTab === 'revisions' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Histórico de Rodadas</h4>
                        <button
                          type="button"
                          onClick={addRevisionRound}
                          className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1.5 rounded-full border border-primary-200 dark:border-primary-800 transition-colors"
                        >
                          + Nova Rodada
                        </button>
                      </div>

                      {formData.revisions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma revisão registrada ainda.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {formData.revisions.map((round) => (
                            <div key={round.id} className="bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                              {/* Round Header */}
                              <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
                                <h5 className="font-bold text-gray-800 dark:text-gray-200">Rodada #{round.roundNumber}</h5>
                                <button type="button" onClick={() => removeRevisionRound(round.id)} className="text-red-500 hover:text-red-700 text-xs">Remover Rodada</button>
                              </div>
                              
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data Recebimento</label>
                                    <input 
                                      type="date" 
                                      className="w-full text-sm border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
                                      value={round.receivedDate}
                                      onChange={(e) => {
                                        const newRevisions = formData.revisions.map(r => r.id === round.id ? {...r, receivedDate: e.target.value} : r);
                                        setFormData({...formData, revisions: newRevisions});
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prazo Resposta</label>
                                    <input 
                                      type="date" 
                                      className="w-full text-sm border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
                                      value={round.deadline}
                                      onChange={(e) => {
                                        const newRevisions = formData.revisions.map(r => r.id === round.id ? {...r, deadline: e.target.value} : r);
                                        setFormData({...formData, revisions: newRevisions});
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Review Points / Requests */}
                                <div className="space-y-3 mt-4">
                                  <div className="flex justify-between items-end border-b border-gray-200 dark:border-slate-600 pb-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Pedidos dos Revisores</label>
                                    <button 
                                      type="button" 
                                      onClick={() => addReviewPoint(round.id)}
                                      className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400"
                                    >
                                      + Adicionar Pedido
                                    </button>
                                  </div>

                                  {round.points.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum ponto registrado.</p>}

                                  {round.points.map((point) => (
                                    <div key={point.id} className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-gray-100 dark:border-slate-600 relative">
                                      <button 
                                        type="button"
                                        onClick={() => removeReviewPoint(round.id, point.id)}
                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                                      >
                                        &times;
                                      </button>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="col-span-1 md:col-span-2">
                                          <input
                                            type="text"
                                            placeholder="Nome do Revisor (ex: Revisor A)"
                                            className="w-full text-xs font-bold border-none p-0 focus:ring-0 bg-transparent text-primary-600 dark:text-primary-400 mb-1"
                                            value={point.reviewerName}
                                            onChange={(e) => updateReviewPoint(round.id, point.id, 'reviewerName', e.target.value)}
                                          />
                                          <textarea 
                                            placeholder="O que o revisor pediu?"
                                            className="w-full text-sm border-gray-200 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-900 dark:text-white p-2"
                                            rows={2}
                                            value={point.request}
                                            onChange={(e) => updateReviewPoint(round.id, point.id, 'request', e.target.value)}
                                          />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                          <textarea 
                                            placeholder="Sua resposta / Ação tomada..."
                                            className="w-full text-sm border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white p-2"
                                            rows={2}
                                            value={point.response}
                                            onChange={(e) => updateReviewPoint(round.id, point.id, 'response', e.target.value)}
                                          />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 flex items-center">
                                          <label className="inline-flex items-center cursor-pointer">
                                            <input 
                                              type="checkbox" 
                                              className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                              checked={point.isResolved}
                                              onChange={(e) => updateReviewPoint(round.id, point.id, 'isResolved', e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                              {point.isResolved ? <span className="text-emerald-600 font-medium">Resolvido / Feito</span> : <span className="text-orange-500">Pendente</span>}
                                            </span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: SHARE */}
                  {activeTab === 'share' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                              Compartilhe esta submissão com coautores para que eles possam acompanhar o progresso e as rodadas de revisão.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mails dos Coautores</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Separe múltiplos e-mails com vírgulas.</p>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-white"
                          value={formData.sharedEmails}
                          onChange={e => setFormData({...formData, sharedEmails: e.target.value})}
                          placeholder="autor1@email.com, orientador@univ.edu"
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link de Compartilhamento (Somente Leitura)</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            readOnly
                            value={formData.shareLink}
                            className="focus:ring-primary-500 focus:border-primary-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 dark:text-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(formData.shareLink);
                              alert('Link copiado!');
                            }}
                            className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>Copiar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-slate-700">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-slate-800 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionManager;