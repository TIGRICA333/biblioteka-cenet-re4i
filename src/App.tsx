import { useState, useEffect } from "react";
import {
  Book,
  ReaderRequest,
  ADMIN_PASSWORD,
  loadBooks,
  loadRequests,
  saveBooks,
  saveRequests,
} from "./data";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<ReaderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [bookSearch, setBookSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCover, setEditCover] = useState("");
  const [pendingEdit, setPendingEdit] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setErrorMsg("");
      const [booksData, requestsData] = await Promise.all([
        loadBooks(),
        loadRequests(),
      ]);
      setBooks(booksData);
      setRequests(requestsData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Не удалось загрузить данные из библиотеки. Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
    }
  }

  async function persistBooks(next: Book[]) {
    setBooks(next);
    await saveBooks(next);
  }

  async function persistRequests(next: ReaderRequest[]) {
    setRequests(next);
    await saveRequests(next);
  }

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminError("");
      setPasswordInput("");
    } else {
      setAdminError("Неверный пароль. Попробуйте ещё раз.");
    }
  };

  const handleBook = (id: number) => {
    persistBooks(
      books.map((b) => (b.id === id ? { ...b, available: false } : b))
    );
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
    try {
      await persistBooks([next, ...books]);
    } finally {
      setPendingSave(false);
    }
    setNewTitle("");
    setNewAuthor("");
    setNewDesc("");
    setNewCover("");
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSide = 600;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = reject;
        img.src = String(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleNewCoverFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setNewCover(await compressImage(file));
    } catch {
      alert("Не удалось загрузить фото. Попробуйте другое.");
    }
  };

  const handleEditCoverFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setEditCover(await compressImage(file));
    } catch {
      alert("Не удалось загрузить фото. Попробуйте другое.");
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
    const updated: Book[] = books.map((b) =>
      b.id === editingId
        ? { ...b, title: editTitle, author: editAuthor, description: editDesc, coverUrl: editCover }
        : b
    );
    setPendingEdit(true);
    try {
      await persistBooks(updated);
    } finally {
      setPendingEdit(false);
    }
    setEditingId(null);
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm("Удалить эту книгу?")) return;
    const next = books.filter((b) => b.id !== id);
    await persistBooks(next);
  };

  const toggleAvailable = async (id: number) => {
    const next = books.map((b) => (b.id === id ? { ...b, available: !b.available } : b));
    await persistBooks(next);
  };

  const handleSendRequest = async () => {
    if (!reqMessage.trim()) return;
    const next: ReaderRequest[] = [
      {
        id: Date.now(),
        name: reqName.trim() || "Читатель",
        message: reqMessage.trim(),
        date: new Date().toLocaleString("ru-RU"),
      },
      ...requests,
    ];
    setPendingSave(true);
    try {
      await persistRequests(next);
    } finally {
      setPendingSave(false);
    }
    setReqName("");
    setReqMessage("");
    setReqSent(true);
  };

  const handleDeleteRequest = async (id: number) => {
    const next = requests.filter((r) => r.id !== id);
    await persistRequests(next);
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

    {errorMsg && <div className="app-error">{errorMsg}</div>}

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
          <p className="empty">Книги не найдены.</p>
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
                Вы вошли. Можно добавлять, редактировать и удалять книги, а также
                видеть запросы читателей.
              </p>
              <button className="btn btn-dark" onClick={() => setIsAdmin(false)}>Выйти</button>
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
          <strong>🕐 Режим работы:</strong>
          <ul>
            <li>Понедельник: 9:00 – 16:00</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
  );
}
