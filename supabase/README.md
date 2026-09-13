# Supabase для библиотеки Центра речи «Будущее»

## 1. Подключение

Проект использует переменные среды:
- `VITE_SUPABASE_URL` — ссылка на проект, например `https://ilghjwojkpsrsabvhpfq.supabase.co`
- `VITE_SUPABASE_ANON_KEY` — публичный ключ anon

Для разработки создайте файл `.env.local` рядом с `package.json`:
```
VITE_SUPABASE_URL=https://ilghjwojkpsrsabvhpfq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_o0CcZuuWAaXd1R3-0rj6ew_x0IDaRLd
```

Файл `.env.local` не попадает в Git. Не добавляйте его в репозиторий.

## 2. Таблицы

Перед первым запуском выполните SQL из файла `supabase/setup.sql` в редакторе SQL проекта Supabase:
`https://supabase.com/dashboard/project/ilghjwojkpsrsabvhpfq/sql/editor`

Там создадутся таблицы:
- `books`
- `reader_requests`

Политики доступа настроены так, чтобы анонимный пользователь мог:
- читать книги,
- добавлять книги,
- обновлять книги,
- удалять книги,
- читать заявки,
- создавать заявки,
- удалять заявки.

## 3. Запуск

```
bun install
bun run dev
```

## 4. GitHub Pages

Сборка настроена так же, как и раньше: `bun run build`. GitHub Actions собирает и публикует статику.
