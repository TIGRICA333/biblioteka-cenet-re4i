import { useState } from "react";
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
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [requests, setRequests] = useState<ReaderRequest[]>(loadRequests);

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCover, setEditCover] = useState("");

  const persistBooks = (next: Book[]) => {
    setBooks(next);
    saveBooks(next);
  };

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

  const handleAddBook = () => {
    if (!newTitle.trim()) return;      const next: Book = {
      id: Date.now(),
      title: newTitle.trim(),
      author: newAuthor.trim() || "Неизвестный автор",
      description: newDesc.trim(),
      available: true,
      coverUrl: newCover || "",
    };
    persistBooks([next, ...books]);
    setNewTitle("");
    setNewAuthor("");
    setNewDesc("");
  };

  const startEdit = (b: Book) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditAuthor(b.author);
    setEditDesc(b.description);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    persistBooks(
      books.map((b) =>
        b.id === editingId
          ? { ...b, title: editTitle, author: editAuthor, description: editDesc, coverUrl: editCover }
          : b
      )
    );
    setEditingId(null);
  };

  const handleDeleteBook = (id: number) => {
    if (confirm("Удалить эту книгу?")) {
      persistBooks(books.filter((b) => b.id !== id));
    }
  };

  const toggleAvailable = (id: number) => {
    persistBooks(
      books.map((b) => (b.id === id ? { ...b, available: !b.available } : b))
    );
  };

  const handleSendRequest = () => {
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
    setRequests(next);
    saveRequests(next);
    setReqName("");
    setReqMessage("");
    setReqSent(true);
  };

  const handleDeleteRequest = (id: number) => {
    const next = requests.filter((r) => r.id !== id);
    setRequests(next);
    saveRequests(next);
  };

  const visibleBooks = books.filter((b) =>
    (b.title + " " + b.author).toLowerCase().includes(bookSearch.toLowerCase())
  );

  return (
    <div className="app">
      <header className="header">
        <h1>
          📚 Библиотека Центра речи «Будущее»
          <span aria-hidden="true"> 📚</span>
        </h1>
        <p>Книги для детей и родителей — бронируйте, читайте, развивайтесь!</p>
      </header>                <div className="grid">
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
              {visibleBooks.map((b) => (                  <li key={b.id} className="book-item">
                    {b.coverUrl && (
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="book-cover"
                      />
                    )}
                  {editingId === b.id ? (
                    <div className="admin-form" style={{ borderTop: "none", paddingTop: 0 }}>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Название" />
                      <input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} placeholder="Автор" />
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Описание" />
                      <input type="text" value={editCover} onChange={(e) => setEditCover(e.target.value)} placeholder="Ссылка на фото книги" />
                      <div className="actions">
                        <button className="btn btn-white" onClick={saveEdit}>Сохранить</button>
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
                          disabled={!b.available}
                          onClick={() => handleBook(b.id)}
                        >
                          Забронировать
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
              <input type="text" placeholder="Ссылка на фото книги (URL)" value={newCover} onChange={(e) => setNewCover(e.target.value)} />
              <button className="btn btn-white" onClick={handleAddBook}>Опубликовать</button>
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
                <button className="btn btn-pink" onClick={handleSendRequest}>Отправить заявку</button>
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
              <li>Понедельник: 9:00 – 12:00</li>
              <li>Четверг: 11:00 – 15:00</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
