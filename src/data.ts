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

export async function saveBooks(books: Book[]): Promise<void> {
  const ids = books.map((b) => b.id);
  const { error: deleteError } = await supabase
    .from(BOOKS_TABLE)
    .delete()
    .notIn("id", ids);
  if (deleteError) {
    console.error("Ошибка синхронизации книг (удаление):", deleteError);
  }

  for (const book of books) {
    const { error: upsertError } = await supabase
      .from(BOOKS_TABLE)
      .upsert(book, { onConflict: "id" });
    if (upsertError) {
      console.error("Ошибка синхронизации книги:", upsertError);
    }
  }
}

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

export async function saveRequests(requests: ReaderRequest[]): Promise<void> {
  const ids = requests.map((r) => r.id);
  const { error: deleteError } = await supabase
    .from(REQUESTS_TABLE)
    .delete()
    .notIn("id", ids);
  if (deleteError) {
    console.error("Ошибка синхронизации заявок (удаление):", deleteError);
  }

  for (const request of requests) {
    const { error: upsertError } = await supabase
      .from(REQUESTS_TABLE)
      .upsert(request, { onConflict: "id" });
    if (upsertError) {
      console.error("Ошибка синхронизации заявки:", upsertError);
    }
  }
}

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

import { supabase } from "./supabase";
