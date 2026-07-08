import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api";

const fmt = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" });


function Stars({ value }) {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="stars">
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}

export default function MovieDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation(); 

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [msg, setMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [seatLayout, setSeatLayout] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const r1 = await api.get(`/movies/${id}/`);
      setMovie(r1.data);
      const r2 = await api.get(`/reviews_public/?movie=${id}`);
      setReviews(r2.data.results ?? r2.data);
    }
    load();
  }, [id]);

  function shouldRedirectToLogin(error) {
    const status = error?.response?.status;
    const detail = String(error?.response?.data?.detail || "");
    if (status === 401 || status === 403) return true;
    if (/Authentication credentials were not provided/i.test(detail)) return true;
    if (/CSRF/i.test(detail)) return true;
    return false;
    }

  async function openSeatModal(session) {
    setMsg("");
    setCurrentSession(session);
    setSelectedSeat("");
    try {
      const r = await api.get(`/sessions/${session.id}/seats/`);
      setSeatLayout(r.data);
      setShowModal(true);
    } catch {
      setMsg("Não foi possível carregar os lugares.");
    }
  }

  async function confirmarReserva() {
    if (!currentSession || !selectedSeat) {
      setMsg("Escolhe um assento.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/bookings/", { session: currentSession.id, seat: selectedSeat });
      setMsg(`Reserva criada para o assento ${selectedSeat}! 🎟`);
      setShowModal(false);
      setSelectedSeat("");
      setCurrentSession(null);
    } catch (e) {
      if (shouldRedirectToLogin(e)) {
        nav("/login", { replace: true, state: { next: location.pathname } });
        return;
      }
      setMsg(e?.response?.data?.detail || "Não foi possível reservar.");
      if (currentSession?.id) {
        try {
          const r = await api.get(`/sessions/${currentSession.id}/seats/`);
          setSeatLayout(r.data);
        } catch {}
      }
    } finally {
      setSaving(false);
    }
  }

  async function likeReview(reviewId, index) {
    try {
      const r = await api.post(`/reviews_public/${reviewId}/like/`);
      setReviews(prev => {
        const next = [...prev];
        if (next[index]?.id === reviewId) {
          next[index] = { ...next[index], likes: r.data.likes, liked: r.data.liked };
        }
        return next;
      });
    } catch (e) {
      if (shouldRedirectToLogin(e)) {
        nav("/login", { replace: true, state: { next: location.pathname } });
      }
    }
  }

  if (!movie) return <p className="muted container">A carregar…</p>;

  return (
    <main className="container" style={{ maxWidth: 900 }}>
      <Link to="/movies" className="muted">← voltar</Link>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18, marginTop: 12 }}>
        <img
          src={`https://picsum.photos/480/720?random=${movie.id}`}
          alt={movie.title}
          style={{ width: "100%", borderRadius: 12, border: "1px solid #222" }}
        />

        <section>
          <h2 style={{ marginTop: 0 }}>{movie.title}</h2>
          <p className="muted">
            {movie.year} • {movie.duration_minutes} min {movie.age_rating ? `• ${movie.age_rating}` : ""}
          </p>
          {movie.avg_rating != null && <p>★ {Number(movie.avg_rating).toFixed(1)}</p>}

          {msg && <p className="flash">{msg}</p>}

          <h3>Sessões</h3>
          {movie.sessions_upcoming?.length ? (
            <ul style={{ display: "grid", gap: 10, paddingLeft: 0, listStyle: "none" }}>
              {movie.sessions_upcoming.map(s => (
                <li key={s.id} className="session-card neon">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="tag">{s.room}</div>
                      <div style={{ marginTop: 6, fontWeight: 700 }}>{fmt.format(new Date(s.date_time))}</div>
                      <div className="muted" style={{ marginTop: 2 }}>
                        Lugares: {s.total_seats} • Ocupados: {s.seats_taken ?? 0}
                      </div>
                    </div>
                    <button className="btn" onClick={() => openSeatModal(s)}>Escolher lugar</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sem sessões futuras.</p>
          )}
        </section>
      </div>

      <section style={{ marginTop: 24 }}>
        <h3>Reviews públicas</h3>
        {reviews.length === 0 && <p className="muted">Ainda não há reviews para este filme.</p>}

        <ul className="reviews-list">
          {reviews.map((r, i) => (
            <li key={r.id} className="review-card" style={{ alignItems: "stretch" }}>
              <div className="review-avatar">{(r.username || "U")[0].toUpperCase()}</div>
              <div className="review-body" style={{ flex: 1 }}>
                <div className="review-top" style={{ gap: 10 }}>
                  <b>{r.username}</b>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="review-text">{r.comment}</p>}
                <div className="review-meta">{new Date(r.created_at).toLocaleDateString("pt-PT")}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  className={`btn btn-secondary ${r.liked ? "is-liked" : ""}`}
                  onClick={() => likeReview(r.id, i)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {r.liked ? " Útil" : " Útil"} ({r.likes ?? 0})
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

     
      {showModal && currentSession && seatLayout && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !saving && setShowModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
            display: "grid", placeItems: "center", zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(680px, 96vw)",
              background: "#12121a",
              border: "1px solid #222",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 40px rgba(0,0,0,.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Escolher lugar — {fmt.format(new Date(currentSession.date_time))}</h3>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Fechar</button>
            </div>

            <p className="muted" style={{ marginTop: 6 }}>Clica num lugar disponível (cinzento = ocupado)</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${seatLayout.cols}, 38px)`,
                gap: 8,
                justifyContent: "center",
                marginTop: 12
              }}
            >
              {seatLayout.labels.map(label => {
                const taken = seatLayout.reserved.includes(label);
                const on = selectedSeat === label;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={taken || saving}
                    onClick={() => setSelectedSeat(on ? "" : label)}
                    className="btn-small"
                    style={{
                      cursor: taken ? "not-allowed" : "pointer",
                      opacity: taken ? 0.45 : 1,
                      background: on ? "#ff2e63" : "#26262b",
                      borderColor: on ? "#ff4a79" : "#34343a",
                      fontWeight: 700
                    }}
                    title={label}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
              <button className="btn" onClick={confirmarReserva} disabled={!selectedSeat || saving}>
                {saving ? "A reservar…" : `Confirmar ${selectedSeat ? `(${selectedSeat})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
