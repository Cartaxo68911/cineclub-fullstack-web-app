import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../auth";
import StarInput from "../components/StarInput";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [form, setForm] = useState({ movie: "", rating: 3, comment: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 3, comment: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const rm = await api.get("/movies/");
    const rr = await api.get("/reviews/");
    setMovies(rm.data.results ?? rm.data);
    setMyReviews(rr.data.results ?? rr.data);
  }

  function setCreateField(k, v) {
    setForm(prev => ({ ...prev, [k]: k === "rating" ? Number(v) : v }));
  }

  function setEditField(k, v) {
    setEditForm(prev => ({ ...prev, [k]: k === "rating" ? Number(v) : v }));
  }

  async function createReview(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/reviews/", {
        movie: form.movie,
        rating: Number(form.rating),
        comment: form.comment,
      });
      setForm({ movie: "", rating: 3, comment: "" });
      await load();
      setMsg("Review criada!");
    } catch {
      setMsg("Erro ao criar review.");
    }
  }

  async function deleteReview(id) {
    try {
      await api.delete(`/reviews/${id}/`);
      await load();
      setMsg("Review apagada.");
    } catch {
      setMsg("Erro ao apagar a review.");
    }
  }

  function startEdit(review) {
    setEditId(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment || "",
    });
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/reviews/${id}/`, {
        rating: editForm.rating,
        comment: editForm.comment,
      });
      setEditId(null);
      await load();
      setMsg("Review atualizada!");
    } catch {
      setMsg("Erro ao atualizar review.");
    }
  }

  const Stars = ({ value }) => {
    const n = Math.max(0, Math.min(5, Number(value) || 0));
    return <span className="stars">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
  };

  return (
    <main className="container" style={{ maxWidth: 800 }}>
      <h2>As minhas reviews</h2>
      {msg && <p className="flash">{msg}</p>}

      <form onSubmit={createReview} className="review-form" style={{ marginBottom: 30 }}>
        <select
          value={form.movie}
          onChange={e => setCreateField("movie", e.target.value)}
          required
        >
          <option value="">— escolher filme —</option>
          {movies.map(m => (
            <option key={m.id} value={m.id}>{m.title} ({m.year})</option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="muted">Classificação:</label>
          <StarInput value={form.rating} onChange={v => setCreateField("rating", v)} />
        </div>

        <textarea
          placeholder="Escreve a tua opinião…"
          value={form.comment}
          onChange={e => setCreateField("comment", e.target.value)}
          rows={3}
        />

        <button className="btn">Publicar</button>
      </form>

      <ul className="reviews-list">
        {myReviews.map(r => {
          const isEditing = editId === r.id;

          return (
            <li key={r.id} className="review-card" style={{ flexDirection: "column" }}>
              <div style={{ display: "flex", width: "100%", justifyContent: "space-between", gap: 12 }}>
                <div className="review-body" style={{ flex: 1 }}>
                  <div className="review-top" style={{ gap: 10 }}>
                    <b>{r.movie_title}</b>
                    <Stars value={r.rating} />
                  </div>

                  {!isEditing && r.comment && (
                    <p className="review-text">{r.comment}</p>
                  )}

                  <div className="review-meta">
                    {new Date(r.created_at).toLocaleDateString("pt-PT")}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {!isEditing && (
                    <>
                      <button className="btn btn-secondary" onClick={() => startEdit(r)}>
                        Editar
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteReview(r.id)}>
                        Apagar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="edit-form" style={{ marginTop: 12 }}>
                  <label>Nova Classificação (0–5)</label>
                  <StarInput value={editForm.rating} onChange={v => setEditField("rating", v)} />

                  <label style={{ marginTop: 8 }}>Comentário</label>
                  <textarea
                    rows={3}
                    value={editForm.comment}
                    onChange={e => setEditField("comment", e.target.value)}
                  />

                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button className="btn" onClick={() => saveEdit(r.id)}>Guardar</button>
                    <button className="btn btn-secondary" onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
