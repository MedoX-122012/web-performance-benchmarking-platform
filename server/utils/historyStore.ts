import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface HistoryEntry {
  id: string;
  url: string;
  timestamp: string;
  device: string;
  connection: string;
  result: any;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

let history: HistoryEntry[] = [];
let saveTimeout: NodeJS.Timeout | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      history = JSON.parse(data);
    }
  } catch {
    history = [];
  }
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    ensureDataDir();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  }, 500);
}

function save(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  const newEntry: HistoryEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  history.unshift(newEntry);
  debouncedSave();
  return newEntry;
}

function getAll(): HistoryEntry[] {
  return history;
}

function getById(id: string): HistoryEntry | undefined {
  return history.find((e) => e.id === id);
}

function getByUrl(url: string): HistoryEntry[] {
  return history.filter((e) => e.url === url);
}

function remove(id: string): boolean {
  const index = history.findIndex((e) => e.id === id);
  if (index === -1) return false;
  history.splice(index, 1);
  debouncedSave();
  return true;
}

function clear() {
  history = [];
  debouncedSave();
}

load();

export const historyStore = { save, getAll, getById, getByUrl, remove, clear };
