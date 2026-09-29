import { useState, useEffect } from "react";
import {
  Book,
  ReaderRequest,
  ADMIN_PASSWORD,
  MAX_COVER_LENGTH,
  loadBooks,
  loadRequests,
  loadSchedule,
  saveSchedule,
  addBook,
  updateBook,
  deleteBook,
  addRequest,
  deleteRequest,
} from "./data";

const ADMIN_STORAGE_KEY = "biblioteka-admin-ok";

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

  const [schedule, setSchedule] = useState("");
  const [scheduleDraft, setScheduleDraft] = useState("");
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
      setSchedule("");
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

  const visibleBooks = books.filter((b) =>
    (b.title + " " + b.author).toLowerCase().includes(bookSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="app">
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

      <div className="grid">
        {/* Красная панель: книги */}
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
          {isAdmin && (
            <div className="admin-form">
              <h3 style={{ margin: "0 0 10px" }}>➕ Новая книга</h3>
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
          )}
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Зелёная панель: вход администратора */}
          <section className="panel admin-panel">
            {!isAdmin ? (
              <>
                <h2>🔑 Вход администратора</h2>
                <p style={{ fontSize: 14 }}>Только для сотрудников библиотеки.</p>
                {adminError && <div className="admin-error">{adminError}</div>}
                <input
                  type="password"
                  placeholder="Введите пароль"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
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
            {schedule && (
              <>
                <strong>🕐 Режим работы:</strong>
                {editingSchedule && isAdmin ? (
                  <div>
                    <textarea
                      value={scheduleDraft}
                      onChange={(e) => setScheduleDraft(e.target.value)}
                      placeholder={"Например:\nПонедельник: 9:00 – 16:00\nСреда: 10:00 – 17:00"}
                      rows={4}
                    />
                    {scheduleError && <div className="admin-error">{scheduleError}</div>}
                    <div className="actions">
                      <button className="btn btn-white" disabled={pendingSchedule} onClick={handleSaveSchedule}>
                        {pendingSchedule ? "Сохранение…" : "Сохранить график"}
                      </button>
                      <button className="btn btn-dark" onClick={() => setEditingSchedule(false)}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ whiteSpace: "pre-line", margin: "6px 0" }}>{schedule}</div>
                )}
                {isAdmin && !editingSchedule && (
                  <button className="btn btn-dark" onClick={() => { setScheduleDraft(schedule); setEditingSchedule(true); }}>
                    ✏️ Изменить график
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
