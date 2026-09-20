import { supabase } from "./supabase";

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

const BOOKS_TABLE = "books";
const REQUESTS_TABLE = "reader_requests";

// ---------- Книги ----------

export async function loadBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from(BOOKS_TABLE)
    .select("*")
    .order("id", { ascending: false });
  if (error) {
    console.error("Ошибка загрузки книг из Supabase:", error);
    return [];
  }
  return (data ?? []).map(mapBookRow);
}

export async function addBook(book: Book): Promise<boolean> {
  const { error } = await supabase.from(BOOKS_TABLE).insert({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    available: book.available,
    cover_url: book.coverUrl,
  });
  if (error) {
    console.error("Ошибка добавления книги:", error);
    return false;
  }
  return true;
}

export async function updateBook(book: Book): Promise<boolean> {
  const { error } = await supabase
    .from(BOOKS_TABLE)
    .update({
      title: book.title,
      author: book.author,
      description: book.description,
      available: book.available,
      cover_url: book.coverUrl,
    })
    .eq("id", book.id);
  if (error) {
    console.error("Ошибка обновления книги:", error);
    return false;
  }
  return true;
}

export async function deleteBook(id: number): Promise<boolean> {
  const { error } = await supabase.from(BOOKS_TABLE).delete().eq("id", id);
  if (error) {
    console.error("Ошибка удаления книги:", error);
    return false;
  }
  return true;
}

// ---------- Заявки читателей ----------

export async function loadRequests(): Promise<ReaderRequest[]> {
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Ошибка загрузки заявок из Supabase:", error);
    return [];
  }
  return (data ?? []).map(mapRequestRow);
}

export async function addRequest(request: ReaderRequest): Promise<boolean> {
  const { error } = await supabase.from(REQUESTS_TABLE).insert({
    id: request.id,
    name: request.name,
    message: request.message,
  });
  if (error) {
    console.error("Ошибка добавления заявки:", error);
    return false;
  }
  return true;
}

export async function deleteRequest(id: number): Promise<boolean> {
  const { error } = await supabase.from(REQUESTS_TABLE).delete().eq("id", id);
  if (error) {
    console.error("Ошибка удаления заявки:", error);
    return false;
  }
  return true;
}

// ---------- Маппинг ----------

function mapBookRow(row: Record<string, unknown>): Book {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    author: String(row.author ?? "Неизвестный автор"),
    description: String(row.description ?? ""),
    available: Boolean(row.available),
    coverUrl: String(row.cover_url ?? ""),
  };
}

function mapRequestRow(row: Record<string, unknown>): ReaderRequest {
  return {
    id: Number(row.id),
    name: String(row.name ?? "Читатель"),
    message: String(row.message ?? ""),
    date: formatDate(row.created_at),
  };
}

function formatDate(value: unknown): string {
  if (!value) return new Date().toLocaleString("ru-RU");
  const d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime())) return new Date().toLocaleString("ru-RU");
  return d.toLocaleString("ru-RU");
}
