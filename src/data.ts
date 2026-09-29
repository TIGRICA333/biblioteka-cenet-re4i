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
const SETTINGS_TABLE = "site_settings";

// Максимальный размер фото-обложки в символах data-URL (~350 КБ).
// Большие фото сжимаются сильнее, а если не помещаются — отклоняются
// с понятной ошибкой вместо молчаливого сбоя сохранения.
export const MAX_COVER_LENGTH = 470000;

export class DataError extends Error {}

function friendlyError(error: { message?: string } | null): string {
  if (!error) return "Неизвестная ошибка.";
  const msg = error.message ?? "";
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("fetch failed")
  ) {
    return "Нет связи с базой данных. Возможно, проект Supabase выключен или удалён. Проверьте статус проекта на supabase.com.";
  }
  return msg || "Неизвестная ошибка.";
}

// ---------- Книги ----------

export async function loadBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from(BOOKS_TABLE)
    .select("*")
    .order("id", { ascending: false });
  if (error) throw new DataError(friendlyError(error));
  return (data ?? []).map(mapBookRow);
}

export async function addBook(book: Book): Promise<void> {
  const { error } = await supabase.from(BOOKS_TABLE).insert({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    available: book.available,
    cover_url: book.coverUrl,
  });
  if (error) throw new DataError(friendlyError(error));
}

export async function updateBook(book: Book): Promise<void> {
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
  if (error) throw new DataError(friendlyError(error));
}

export async function deleteBook(id: number): Promise<void> {
  const { error } = await supabase.from(BOOKS_TABLE).delete().eq("id", id);
  if (error) throw new DataError(friendlyError(error));
}

// ---------- Заявки читателей ----------

export async function loadRequests(): Promise<ReaderRequest[]> {
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new DataError(friendlyError(error));
  return (data ?? []).map(mapRequestRow);
}

export async function addRequest(request: ReaderRequest): Promise<void> {
  const { error } = await supabase.from(REQUESTS_TABLE).insert({
    id: request.id,
    name: request.name,
    message: request.message,
  });
  if (error) throw new DataError(friendlyError(error));
}

export async function deleteRequest(id: number): Promise<void> {
  const { error } = await supabase.from(REQUESTS_TABLE).delete().eq("id", id);
  if (error) throw new DataError(friendlyError(error));
}

// ---------- Настройки (график работы) ----------

// Настройки (график работы) — одна строка с id = 1.
// График хранится как JSON-массив дней: [{name, on, time}]
export interface ScheduleDay {
  name: string;
  on: boolean;
  time: string;
}

export const DEFAULT_SCHEDULE: ScheduleDay[] = [
  { name: "Понедельник", on: false, time: "9:00 – 16:00" },
  { name: "Вторник", on: false, time: "9:00 – 16:00" },
  { name: "Среда", on: false, time: "9:00 – 16:00" },
  { name: "Четверг", on: false, time: "9:00 – 16:00" },
  { name: "Пятница", on: false, time: "9:00 – 16:00" },
  { name: "Суббота", on: false, time: "9:00 – 14:00" },
  { name: "Воскресенье", on: false, time: "выходной" },
];

export async function loadSchedule(): Promise<ScheduleDay[]> {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("schedule")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new DataError(friendlyError(error));
  return parseSchedule(data?.schedule);
}

export function parseSchedule(raw: unknown): ScheduleDay[] {
  if (!raw) return DEFAULT_SCHEDULE;
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return DEFAULT_SCHEDULE;
    return DEFAULT_SCHEDULE.map((def) => {
      const found = parsed.find((d: { name?: unknown }) => d?.name === def.name);
      return found
        ? { name: def.name, on: Boolean(found.on), time: String(found.time ?? def.time) }
        : def;
    });
  } catch {
    // Старый формат (простая строка) — переносим в понедельник
    const text = String(raw).trim();
    if (!text) return DEFAULT_SCHEDULE;
    return DEFAULT_SCHEDULE.map((d, i) =>
      i === 0 ? { ...d, on: true, time: text.replace(/^Понедельник:\s*/i, "") } : d
    );
  }
}

export async function saveSchedule(days: ScheduleDay[]): Promise<void> {
  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .update({ schedule: JSON.stringify(days), updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new DataError(friendlyError(error));
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
