import { useState, useEffect, useMemo } from "react";
import {
  Book,
  ReaderRequest,
  ADMIN_PASSWORD,
  MAX_COVER_LENGTH,
  loadBooks,
  loadRequests,
  loadSchedule,
  saveSchedule,
  ScheduleDay,
  addBook,
  updateBook,
  deleteBook,
  addRequest,
  deleteRequest,
} from "./data";

const ADMIN_STORAGE_KEY = "biblioteka-admin-ok";

// Палитра корешков для книжек на фоновых стеллажах
const SHELF_COLORS = [
  "#c0392b", "#2e7d52", "#d63384", "#e67e22", "#5c6bc0",
  "#8e5a2b", "#16a085", "#f1c40f", "#7b1fa2", "#455a64",
  "#1f5c3d", "#d35400", "#2980b9", "#c2185b", "#6d4c41",
];

// Детерминированный генератор, чтобы книжки не «прыгали» при каждой перерисовке
function shelfRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

interface ShelfBookSpec {
  height: number;
  color: string;
  lean: boolean;
}

function makeShelf(seed: number, count: number): ShelfBookSpec[] {
  const rnd = shelfRandom(seed);
  return Array.from({ length: count }, () => ({
    height: 55 + Math.round(rnd() * 37),
    color: SHELF_COLORS[Math.floor(rnd() * SHELF_COLORS.length)],
    lean: rnd() < 0.14,
  }));
}

function LibraryBackground() {
  const leftShelves = useMemo(
    () => [makeShelf(11, 8), makeShelf(17, 8), makeShelf(23, 8), makeShelf(29, 8), makeShelf(31, 8)],
    []
  );
  const rightShelves = useMemo(
    () => [makeShelf(53, 8), makeShelf(59, 8), makeShelf(61, 8), makeShelf(67, 8), makeShelf(71, 8), makeShelf(73, 8), makeShelf(79, 8)],
    []
  );
  return (
    <div className="library-bg" aria-hidden="true">
      {[
        { side: "left", shelves: leftShelves },
        { side: "right", shelves: rightShelves },
      ].map(({ side, shelves }) => (
        <div key={side} className={"side-shelf " + side}>
          {shelves.map((books, si) => (
            <div key={si}>
              <div className="shelf-books">
                {books.map((b, bi) => (
                  <div
                    key={bi}
                    className={"mini-book" + (b.lean ? " lean" : "")}
                    style={{ height: b.height, background: b.color }}
                  />
                ))}
              </div>
              <div className="shelf-board" />
            </div>
          ))}
        </div>
      ))}
      <FallingItems />
      <div className="librarian-desk">
        <div className="librarian">🧑‍💼</div>
        <div className="desk">
          <span className="desk-check show">✅</span>
        </div>
      </div>
    </div>
  );
}

function FallingItems() {
  const items = useMemo(() => {
    const emojis = ["🍂", "🍁", "🍃", "📚", "📖", "📕", "📗", "🍂", "🍁", "📘"];
    const rnd = shelfRandom(97);
    return Array.from({ length: 16 }, (_, i) => ({
      emoji: emojis[i % emojis.length],
      left: Math.round(rnd() * 96) + 2,
      duration: 9 + Math.round(rnd() * 12),
      delay: -Math.round(rnd() * 20),
      size: 16 + Math.round(rnd() * 14),
      spin: rnd() < 0.5,
    }));
  }, []);
  return (
    <>
      {items.map((it, i) => (
        <span
          key={i}
          className={"falling-item" + (it.spin ? " spin" : "")}
          style={{
            left: it.left + "%",
            fontSize: it.size,
            animationDuration: `${it.duration}s, ${2 + (i % 3)}s, ${it.duration}s`,
            animationDelay: `${it.delay}s, 0s, ${it.delay}s`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </>
  );
}

function WalkingBook() {
  const picked = useMemo(
    () => ["📖", "📕", "📗", "📘", "📙", "📓"][Math.floor(Math.random() * 6)],
    []
  );
  return (
    <div className="walker-book" aria-hidden="true">
      <span className="body">📚</span>
      <span className="picked">{picked}</span>
    </div>
  );
}

// Читальный уголок: столы по кругу и читающие за ними дети
function ReadingCircle() {
  const seats = useMemo(() => {
    const readers = ["👧", "🧒", "👦", "🧒", "👧"];
    const books = ["📖", "📕", "📗", "📘", "📙"];
    return readers.map((emoji, i) => {
      const angle = ((-90 + i * 72) * Math.PI) / 180;
      return {
        emoji,
        book: books[i],
        left: Math.cos(angle) * 40,
        top: Math.sin(angle) * 28,
        delay: i * 0.5,
      };
    });
  }, []);
  return (
    <div className="reading-circle" aria-hidden="true">
      <div className="r-rug" />
      {seats.map((s, i) => (
        <div
          key={i}
          className="r-seat"
          style={{
            left: `calc(50% + ${s.left}%)`,
            top: `calc(50% + ${s.top}%)`,
            animationDelay: `${s.delay}s`,
          }}
        >
          <span className="r-reader" style={{ animationDelay: `${s.delay + 0.2}s` }}>
            {s.emoji}
          </span>
          <div className="r-table">
            <span className="r-book" style={{ animationDelay: `${s.delay}s` }}>
              {s.book}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}


export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<ReaderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [bookSearch, setBookSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem(ADMIN_STORAGE_KEY) === "1"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState("");

  const [reqName, setReqName] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqSent, setReqSent] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCover, setNewCover] = useState("");
  const [pendingSave, setPendingSave] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCover, setEditCover] = useState("");
  const [pendingEdit, setPendingEdit] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDay[]>([]);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  // Автообновление: при возврате на вкладку и каждые 60 секунд
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      loadBooksSafe();
      loadRequestsSafe();
      loadScheduleSafe();
    };
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBooksSafe() {
    try {
      setBooks(await loadBooks());
    } catch (err) {
      if (!errorMsg) setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadRequestsSafe() {
    try {
      setRequests(await loadRequests());
    } catch (err) {
      if (!errorMsg) setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadScheduleSafe() {
    try {
      const s = await loadSchedule();
      setSchedule(s);
      if (!editingSchedule) setScheduleDraft(s);
    } catch {
      // Если таблица настроек ещё не создана — просто не показываем график
      setSchedule([]);
    }
  }

  async function loadInitialData() {
    setLoading(true);
    setErrorMsg("");
    try {
      const [booksData, requestsData] = await Promise.all([
        loadBooks(),
        loadRequests(),
      ]);
      setBooks(booksData);
      setRequests(requestsData);
    } catch (err) {
      setErrorMsg(
        (err instanceof Error ? err.message : String(err)) +
          " Нажмите «Обновить», когда база заработает."
      );
    } finally {
      setLoading(false);
      loadScheduleSafe();
    }
  }

  function showSaveError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    setSaveError(msg);
    alert("Ошибка сохранения: " + msg);
  }

  async function addBookLocal(book: Book) {
    setBooks([book, ...books]);
    try {
      await addBook(book);
      setSaveError("");
    } catch (err) {
      // Откатываем оптимистичное добавление
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      showSaveError(err);
    }
  }

  async function updateBookLocal(book: Book) {
    const prev = books;
    setBooks(books.map((b) => (b.id === book.id ? book : b)));
    try {
      await updateBook(book);
      setSaveError("");
    } catch (err) {
      setBooks(prev);
      showSaveError(err);
    }
  }

  async function removeBookLocal(id: number) {
    const prev = books;
    setBooks(books.filter((b) => b.id !== id));
    try {
      await deleteBook(id);
      setSaveError("");
    } catch (err) {
      setBooks(prev);
      showSaveError(err);
    }
  }

  async function addRequestLocal(request: ReaderRequest) {
    setRequests([request, ...requests]);
    try {
      await addRequest(request);
      setSaveError("");
    } catch (err) {
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      showSaveError(err);
    }
  }

  async function removeRequestLocal(id: number) {
    const prev = requests;
    setRequests(requests.filter((r) => r.id !== id));
    try {
      await deleteRequest(id);
      setSaveError("");
    } catch (err) {
      setRequests(prev);
      showSaveError(err);
    }
  }

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem(ADMIN_STORAGE_KEY, "1");
      setAdminError("");
      setPasswordInput("");
    } else {
      setAdminError("Неверный пароль. Попробуйте ещё раз.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const handleBook = async (id: number) => {
    const book = books.find((b) => b.id === id);
    if (book) await updateBookLocal({ ...book, available: false });
    alert("Книга забронирована! Приходите за ней в часы работы библиотеки.");
  };

  const handleAddBook = async () => {
    if (!newTitle.trim()) return;
    const next: Book = {
      id: Date.now(),
      title: newTitle.trim(),
      author: newAuthor.trim() || "Неизвестный автор",
      description: newDesc.trim(),
      available: true,
      coverUrl: newCover || "",
    };
    setPendingSave(true);
    setSaveError("");
    try {
      await addBookLocal(next);
      setNewTitle("");
      setNewAuthor("");
      setNewDesc("");
      setNewCover("");
    } finally {
      setPendingSave(false);
    }
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          // Начинаем с компактного размера и при необходимости сжимаем сильнее,
          // чтобы фото гарантированно поместилось в базу.
          let maxSide = 500;
          let quality = 0.65;
          const attempt = (): string => {
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL("image/jpeg", quality);
          };
          let dataUrl = attempt();
          let guard = 0;
          while (dataUrl.length > MAX_COVER_LENGTH && guard < 5) {
            maxSide = Math.round(maxSide * 0.75);
            quality = Math.max(0.4, quality - 0.1);
            dataUrl = attempt();
            guard += 1;
          }
          if (dataUrl.length > MAX_COVER_LENGTH) {
            reject(new Error("Фото слишком большое, выберите другое."));
            return;
          }
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Не удалось прочитать фото."));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("Не удалось прочитать фото."));
      reader.readAsDataURL(file);
    });

  const handleNewCoverFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setNewCover(await compressImage(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось загрузить фото.");
    }
  };

  const handleEditCoverFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setEditCover(await compressImage(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Не удалось загрузить фото.");
    }
  };

  const startEdit = (b: Book) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditAuthor(b.author);
    setEditDesc(b.description);
    setEditCover(b.coverUrl);
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const updatedBook = books.find((b) => b.id === editingId);
    if (!updatedBook) return;
    setPendingEdit(true);
    try {
      await updateBookLocal({
        ...updatedBook,
        title: editTitle,
        author: editAuthor,
        description: editDesc,
        coverUrl: editCover,
      });
      setEditingId(null);
    } finally {
      setPendingEdit(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm("Удалить эту книгу?")) return;
    await removeBookLocal(id);
  };

  const toggleAvailable = async (id: number) => {
    const book = books.find((b) => b.id === id);
    if (book) await updateBookLocal({ ...book, available: !book.available });
  };

  const handleSendRequest = async () => {
    if (!reqMessage.trim()) return;
    const nextRequest: ReaderRequest = {
      id: Date.now(),
      name: reqName.trim() || "Читатель",
      message: reqMessage.trim(),
      date: new Date().toLocaleString("ru-RU"),
    };
    setPendingSave(true);
    try {
      await addRequestLocal(nextRequest);
      setReqName("");
      setReqMessage("");
      setReqSent(true);
    } finally {
      setPendingSave(false);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    await removeRequestLocal(id);
  };

  const handleSaveSchedule = async () => {
    setPendingSchedule(true);
    setScheduleError("");
    try {
      await saveSchedule(scheduleDraft);
      setSchedule(scheduleDraft);
      setEditingSchedule(false);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingSchedule(false);
    }
  };

  const toggleDraftDay = (name: string) => {
    setScheduleDraft((prev) =>
      prev.map((d) => (d.name === name ? { ...d, on: !d.on } : d))
    );
  };

  const setDraftTime = (name: string, time: string) => {
    setScheduleDraft((prev) =>
      prev.map((d) => (d.name === name ? { ...d, time } : d))
    );
  };

  const visibleBooks = books.filter((b) =>
    (b.title + " " + b.author).toLowerCase().includes(bookSearch.toLowerCase())
  );

  if (loading) {
    return (    <div className="app">
      <LibraryBackground />
      <WalkingBook />
      <header className="header">
          <h1>📚 Библиотека Центра речи «Будущее»</h1>
          <p>Загрузка библиотеки…</p>
        </header>
        <div className="grid">
          <section className="panel books-panel">
            <p className="empty">Загрузка книг из базы…</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <LibraryBackground />
      <WalkingBook />
      <header className="header">
        <h1>
          📚 Библиотека Центра речи «Будущее»
          <span aria-hidden="true"> 📚</span>
        </h1>
        <p>Книги для детей и родителей — бронируйте, читайте, развивайтесь!</p>
      </header>

      {errorMsg && (
        <div className="app-error">
          {errorMsg}
          <button className="btn btn-white" style={{ marginLeft: 12 }} onClick={loadInitialData}>
            🔄 Обновить
          </button>
        </div>
      )}
      {saveError && !errorMsg && (
        <div className="app-error">
          ⚠️ {saveError}
          <button className="btn btn-white" style={{ marginLeft: 12 }} onClick={loadInitialData}>
            🔄 Обновить
          </button>
        </div>
      )}

      <ReadingCircle />

      <div className="grid">
        {/* Красная панель 1: книги, которые уже есть */}
        <div className="books-column">
        <section className="panel books-panel">
          <h2>📕 Наши книги</h2>
          <input
            placeholder="Поиск книги или автора…"
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
          />
          {visibleBooks.length === 0 ? (
            <p className="empty">
              {errorMsg
                ? "Книги пока не отображаются — база недоступна."
                : "Книги не найдены."}
            </p>
          ) : (
            <ul className="book-list">
              {visibleBooks.map((b) => (
                <li key={b.id} className="book-item">
                  {b.coverUrl && (
                    <img src={b.coverUrl} alt={b.title} className="book-cover" />
                  )}
                  {editingId === b.id ? (
                    <div className="admin-form" style={{ borderTop: "none", paddingTop: 0 }}>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Название" />
                      <input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} placeholder="Автор" />
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Описание" />
                      <label className="file-label">
                        📷 Выбрать фото с телефона
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleEditCoverFile(e.target.files?.[0])} />
                      </label>
                      {editCover && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img src={editCover} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                          <button className="btn btn-dark" onClick={() => setEditCover("")}>Убрать фото</button>
                        </div>
                      )}
                      <div className="actions">
                        <button className="btn btn-white" disabled={pendingEdit} onClick={saveEdit}>
                          {pendingEdit ? "Сохранение…" : "Сохранить"}
                        </button>
                        <button className="btn btn-dark" onClick={() => setEditingId(null)}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <strong>{b.title}</strong>
                      <div>{b.author}</div>
                      {b.description && <div style={{ fontSize: 13, marginTop: 4 }}>{b.description}</div>}
                      <div style={{ marginTop: 6, fontWeight: 600 }}>
                        {b.available ? "✅ Доступна" : "🔒 Выдана"}
                      </div>
                      <div className="actions">
                        <button
                          className="btn btn-white"
                          disabled={!b.available || pendingSave}
                          onClick={() => handleBook(b.id)}
                        >
                          {pendingSave ? "…" : "Забронировать"}
                        </button>
                        {isAdmin && (
                          <>
                            <button className="btn btn-outline" onClick={() => startEdit(b)}>✏️</button>
                            <button className="btn btn-dark" onClick={() => toggleAvailable(b.id)}>
                              {b.available ? "Выдать" : "Вернуть"}
                            </button>
                            <button className="btn btn-dark" onClick={() => handleDeleteBook(b.id)}>🗑️</button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Красная панель 2: внесение новой книги */}
        <section className="panel books-panel">
          <h2>➕ Внести новую книгу</h2>
          {isAdmin ? (
            <div className="admin-form new-book-block">
              <p className="new-book-note">
                Заполните поля и нажмите «Опубликовать» — книга появится в панели «📕 Наши книги».
              </p>
              <input placeholder="Название" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <input placeholder="Автор" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} />
              <textarea placeholder="Описание" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <label className="file-label">
                📷 Выбрать фото с телефона
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleNewCoverFile(e.target.files?.[0])} />
              </label>
              {newCover && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={newCover} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                  <button className="btn btn-dark" onClick={() => setNewCover("")}>Убрать фото</button>
                </div>
              )}
              <button className="btn btn-white" disabled={pendingSave} onClick={handleAddBook}>
                {pendingSave ? "Публикация…" : "Опубликовать"}
              </button>
            </div>
          ) : (
            <p className="new-book-note">
              Вносить и публиковать новые книги может только администратор библиотеки —
              войдите в панель «🔑 Вход администратора» справа.
            </p>
          )}
        </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Зелёная панель: вход администратора */}
          <section className="panel admin-panel">
            {!isAdmin ? (
              <>
                <h2>🔑 Вход администратора</h2>
                <p style={{ fontSize: 14 }}>Только для сотрудников библиотеки.</p>
                {adminError && <div className="admin-error">{adminError}</div>}
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    style={{
                      position: "absolute",
                      right: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: 4,
                      lineHeight: 1,
                    }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <button className="btn btn-white" onClick={handleAdminLogin}>Войти</button>
              </>
            ) : (
              <>
                <h2>✅ Режим администратора</h2>
                <p style={{ fontSize: 14 }}>
                  Вы вошли. Можно добавлять, редактировать и удалять книги,
                  менять график работы и видеть запросы читателей.
                </p>
                <button className="btn btn-dark" onClick={handleAdminLogout}>Выйти</button>
              </>
            )}
          </section>

          {/* Розовая панель: запросы читателей */}
          <section className="panel reader-panel">
            <h2>💌 Заявка читателя</h2>
            {!isAdmin ? (
              <>
                <p className="reader-note">
                  Нужна книга, которой нет в списке? Оставьте заявку администратору!
                </p>
                <input placeholder="Ваше имя" value={reqName} onChange={(e) => setReqName(e.target.value)} />
                <textarea
                  placeholder="Какую книгу вы ищете?"
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                />
                <button className="btn btn-pink" disabled={pendingSave} onClick={handleSendRequest}>
                  {pendingSave ? "Отправка…" : "Отправить заявку"}
                </button>
                {reqSent && <p style={{ marginTop: 10 }}>Спасибо! Ваша заявка отправлена 🌸</p>}
              </>
            ) : (
              <>
                <p className="reader-note">Заявки от читателей:</p>
                {requests.length === 0 ? (
                  <p className="empty">Пока нет заявок.</p>
                ) : (
                  requests.map((r) => (
                    <div key={r.id} className="request-item">
                      <strong>{r.name}</strong>
                      <div>{r.message}</div>
                      <div className="request-meta">{r.date}</div>
                      <button className="btn btn-pink" style={{ marginTop: 8 }} onClick={() => handleDeleteRequest(r.id)}>
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </section>

          {/* Голубая панель: информация */}
          <section className="panel info-panel">
            <h2>ℹ️ О библиотеке</h2>
            <p>
              Библиотека Центра речи «Будущее» помогает детям и родителям развивать
              речь через чтение. Книги можно бронировать на сайте и забирать в
              часы работы.
            </p>
            <strong>📍 Адрес для получения книг:</strong>
            <p style={{ margin: "6px 0 14px" }}>
              г. Раменское, ул. Красноармейская, д. 13
            </p>
            {schedule.some((d) => d.on) && (
              <>
                <strong>🕐 Режим работы:</strong>
                <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
                  {schedule.filter((d) => d.on).map((d) => (
                    <li key={d.name}>
                      {d.name}: {d.time}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!schedule.some((d) => d.on) && <p style={{ fontSize: 14 }}>🕐 Часы работы уточняются.</p>}
            {isAdmin && !editingSchedule && (
              <button
                className="btn btn-dark"
                onClick={() => {
                  setScheduleDraft(schedule);
                  setEditingSchedule(true);
                }}
              >
                ✏️ Изменить график
              </button>
            )}
            {isAdmin && editingSchedule && (
              <div className="admin-form" style={{ marginTop: 10 }}>
                <h3 style={{ margin: "0 0 10px" }}>🕐 График работы</h3>
                {scheduleDraft.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <span style={{ minWidth: 110, fontWeight: 600 }}>{d.name}</span>
                    <button
                      onClick={() => toggleDraftDay(d.name)}
                      aria-pressed={d.on}
                      style={{
                        width: 52,
                        height: 28,
                        borderRadius: 14,
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        background: d.on ? "#2e7d32" : "#bdbdbd",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                      title={d.on ? "Выключить день" : "Включить день"}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: d.on ? 27 : 3,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "left 0.2s",
                        }}
                      />
                    </button>
                    <input
                      value={d.time}
                      onChange={(e) => setDraftTime(d.name, e.target.value)}
                      disabled={!d.on}
                      placeholder="9:00 – 16:00"
                      style={{
                        flex: 1,
                        minWidth: 90,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(0,0,0,0.2)",
                        opacity: d.on ? 1 : 0.5,
                      }}
                    />
                  </div>
                ))}
                {scheduleError && <div className="admin-error">{scheduleError}</div>}
                <div className="actions">
                  <button className="btn btn-white" disabled={pendingSchedule} onClick={handleSaveSchedule}>
                    {pendingSchedule ? "Сохранение…" : "Сохранить график"}
                  </button>
                  <button className="btn btn-dark" onClick={() => setEditingSchedule(false)}>Отмена</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
