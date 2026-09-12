export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  available: boolean;
  coverUrl: string;
}

export interface ReaderRequest {
  id: number;
  name: string;
  message: string;
  date: string;
}

export const ADMIN_PASSWORD = "budushchee2024";

export const INITIAL_BOOKS: Book[] = [];

const BOOKS_KEY = "library_books_v2";
const REQUESTS_KEY = "library_requests";

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted data
  }
  return INITIAL_BOOKS;
}

export function saveBooks(books: Book[]) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function loadRequests(): ReaderRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted data
  }
  return [];
}

export function saveRequests(requests: ReaderRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}
