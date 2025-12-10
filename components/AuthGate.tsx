import React, { useState } from 'react';
import { authenticateUser, registerUser, resetPassword } from '../services/auth';

interface AuthGateProps {
  onAuthenticated: (email: string) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    try {
      const ok = await authenticateUser(email, password);
      if (!ok) {
        setError('Credenciais inválidas. Verifique e tente novamente.');
      } else {
        setMessage('Acesso liberado.');
        onAuthenticated(email.trim().toLowerCase());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    try {
      if (password.length < 8) {
        throw new Error('Senha deve conter ao menos 8 caracteres.');
      }
      await registerUser(email, password);
      setMessage('Conta criada com sucesso. Faça login para continuar.');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);

    try {
      const provisional = await resetPassword(email);
      setMessage(`Uma senha provisória foi enviada para o e-mail informado. (Demo: ${provisional})`);
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível recuperar a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'login') {
      return (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60"
          >
            {isLoading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      );
    }

    if (mode === 'register') {
      return (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Crie uma senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60"
          >
            {isLoading ? 'Criando...' : 'Criar conta segura'}
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail cadastrado</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60"
        >
          {isLoading ? 'Processando...' : 'Enviar senha provisória'}
        </button>
      </form>
    );
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acesso restrito à gestão</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Proteja seus periódicos e submissões com login seguro.</p>
        </div>
        <div className="inline-flex rounded-full bg-primary-50 dark:bg-primary-900/40 p-3 text-primary-600 dark:text-primary-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.795 0 1.558-.316 2.121-.879A2.996 2.996 0 0015 8c0-.795-.316-1.558-.879-2.121A2.996 2.996 0 0012 5c-.795 0-1.558.316-2.121.879A2.996 2.996 0 009 8c0 .795.316 1.558.879 2.121A2.996 2.996 0 0012 11z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 10-14 0c0 7 7 9 7 9s7-2 7-9z" />
          </svg>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => { setMode('login'); resetFeedback(); }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${mode === 'login' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200'}`}
        >
          Entrar
        </button>
        <button
          onClick={() => { setMode('register'); resetFeedback(); }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${mode === 'register' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200'}`}
        >
          Criar conta
        </button>
        <button
          onClick={() => { setMode('reset'); resetFeedback(); }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${mode === 'reset' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200'}`}
        >
          Recuperar senha
        </button>
      </div>

      {message && <div className="mb-4 p-3 rounded-md bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100">{message}</div>}
      {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm border border-red-200 dark:bg-red-900/40 dark:text-red-100">{error}</div>}

      {renderForm()}

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        As credenciais são criptografadas e cada usuário possui um cofre isolado de submissões salvo localmente.
      </p>
    </div>
  );
};

export default AuthGate;
