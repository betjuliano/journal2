import { Submission } from '../types';
import seedVault from '../data/userVault.json';

const STORAGE_KEY = 'journalscope_user_vault_v1';

interface StoredUser {
  email: string;
  salt: string;
  passwordHash: string;
  submissions: Submission[];
}

const getCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) return (globalThis as any).crypto as Crypto;
  return null;
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const cryptoObj = getCrypto();
  if (!cryptoObj?.subtle) throw new Error('Criptografia indisponível neste navegador.');

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const digest = await cryptoObj.subtle.digest('SHA-256', data);
  return toHex(digest);
};

const loadVault = (): StoredUser[] => {
  if (typeof localStorage === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as StoredUser[];
  } catch (error) {
    console.error('Falha ao ler cofre de usuários:', error);
  }

  return Array.isArray(seedVault) ? seedVault : [];
};

const persistVault = (users: StoredUser[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const ensureVault = (): StoredUser[] => {
  const vault = loadVault();
  if (!localStorage.getItem(STORAGE_KEY)) {
    persistVault(vault);
  }
  return vault;
};

const generateSalt = (): string => {
  const cryptoObj = getCrypto();
  if (!cryptoObj?.getRandomValues) return Math.random().toString(36).slice(2);
  const array = new Uint8Array(16);
  cryptoObj.getRandomValues(array);
  return toHex(array.buffer);
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const registerUser = async (email: string, password: string): Promise<StoredUser> => {
  const safeEmail = normalizeEmail(email);
  const vault = ensureVault();

  if (vault.some((u) => u.email === safeEmail)) {
    throw new Error('Já existe uma conta com este e-mail.');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const newUser: StoredUser = { email: safeEmail, salt, passwordHash, submissions: [] };

  persistVault([...vault, newUser]);
  return newUser;
};

export const authenticateUser = async (email: string, password: string): Promise<boolean> => {
  const safeEmail = normalizeEmail(email);
  const vault = ensureVault();
  const user = vault.find((u) => u.email === safeEmail);
  if (!user) return false;

  const hashed = await hashPassword(password, user.salt);
  return hashed === user.passwordHash;
};

export const resetPassword = async (email: string): Promise<string> => {
  const safeEmail = normalizeEmail(email);
  const vault = ensureVault();
  const user = vault.find((u) => u.email === safeEmail);
  if (!user) {
    throw new Error('Conta não encontrada para recuperação.');
  }

  const provisional = `tmp-${Math.random().toString(36).slice(2, 10)}`;
  const salt = generateSalt();
  const passwordHash = await hashPassword(provisional, salt);

  const updatedVault = vault.map((u) =>
    u.email === safeEmail ? { ...u, salt, passwordHash } : u
  );

  persistVault(updatedVault);
  return provisional;
};

export const getUserSubmissions = (email: string): Submission[] => {
  const safeEmail = normalizeEmail(email);
  const vault = ensureVault();
  const user = vault.find((u) => u.email === safeEmail);
  return user ? JSON.parse(JSON.stringify(user.submissions)) : [];
};

export const saveUserSubmissions = (email: string, submissions: Submission[]): void => {
  const safeEmail = normalizeEmail(email);
  const vault = ensureVault();
  const updatedVault = vault.map((u) =>
    u.email === safeEmail ? { ...u, submissions: JSON.parse(JSON.stringify(submissions)) } : u
  );

  persistVault(updatedVault);
};
