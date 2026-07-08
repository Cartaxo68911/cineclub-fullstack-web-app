import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../home.css";         

function Stars({ value }) {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="stars">
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get("/movies/");
        const list = r.data.results ?? r.data ?? [];
        if (alive) setMovies(list);
      } catch (_) {
        if (alive) setMovies([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const slides = useMemo(() => movies.slice(0, 5), [movies]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  const next = () => setIdx((p) => (p + 1) % (slides.length || 1));
  const prev = () => setIdx((p) => (p - 1 + (slides.length || 1)) % (slides.length || 1));
  const go = (i) => setIdx(i);

  useEffect(() => {
    if (!slides.length) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 4500);
    return () => clearInterval(timerRef.current);
  }, [slides, idx]);

  const featured = useMemo(() => movies.slice(0, 6), [movies]);

  if (loading) {
    return <main className="container"><p className="muted">A carregar…</p></main>;
  }

  return (
    <main className="home">
      <section className="hero">
        {slides.length === 0 ? (
          <div className="hero-empty">
            <h1>Bem-vindo ao <span className="brand">CineClub</span></h1>
            <p className="muted">Ainda não há filmes para mostrar. Vai a <Link to="/movies">Filmes</Link>.</p>
          </div>
        ) : (
          <>
            {slides.map((m, i) => {
              const active = i === idx;
              return (
                <article
                  key={m.id}
                  className={`slide ${active ? "active" : ""}`}
                  style={{ backgroundImage: `url(https://picsum.photos/1600/700?random=${m.id})` }}
                  onClick={() => nav(`/movies/${m.id}`)}
                  role="button"
                  aria-label={`Abrir ${m.title}`}
                >
                  <div className="slide-overlay">
                    <h1 className="slide-title">{m.title}</h1>
                    <p className="slide-meta">
                      {m.year} • {m.duration_minutes} min {m.age_rating ? `• ${m.age_rating}` : ""}
                    </p>
                    {m.avg_rating != null && (
                      <p className="slide-stars">
                        <Stars value={Math.round(Number(m.avg_rating))} />
                        <span className="avg"> {Number(m.avg_rating).toFixed(1)}</span>
                      </p>
                    )}
                    <div className="slide-actions">
                      <Link className="btn" to={`/movies/${m.id}`} onClick={(e)=>e.stopPropagation()}>Ver detalhes</Link>
                      <Link className="btn btn-secondary" to="/movies" onClick={(e)=>e.stopPropagation()}>Ver todos</Link>
                    </div>
                  </div>
                </article>
              );
            })}
            
            <button className="nav prev" onClick={prev} aria-label="Anterior">‹</button>
            <button className="nav next" onClick={next} aria-label="Seguinte">›</button>

            <div className="dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === idx ? "on" : ""}`}
                  onClick={() => go(i)}
                  aria-label={`Ir para slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="container" style={{ marginTop: 28 }}>
        <div className="section-title">
          <h2> Em destaque</h2>
          <Link to="/movies" className="see-all">Ver todos</Link>
        </div>

        <div className="featured-grid">
          {featured.map((m) => (
            <Link to={`/movies/${m.id}`} key={m.id} className="feat-card">
              <img
                src={`https://picsum.photos/400/600?random=${m.id}`}
                alt={m.title}
                loading="lazy"
              />
              <div className="feat-info">
                <div className="feat-title">{m.title}</div>
                <div className="feat-meta">
                  {m.year} • {m.duration_minutes} min
                </div>
                {m.avg_rating != null && (
                  <div className="feat-stars">
                    <Stars value={Math.round(Number(m.avg_rating))} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
