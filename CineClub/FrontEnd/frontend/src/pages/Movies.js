import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../cards.css";   

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/movies/")
      .then(r => setMovies(r.data.results ?? r.data));
  }, []);

  function openMovie(id) {
    navigate(`/movies/${id}`);
  }

  return (
    <main className="container">
      <h2>🎬 Filmes</h2>

      <div className="movies-grid">
        {movies.map(m => (
          <div
            key={m.id}
            className="movie-card"
            onClick={() => openMovie(m.id)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={`https://picsum.photos/300/450?random=${m.id}`}
              alt={m.title}
            />

            <div className="movie-card-title">
              {m.title}
            </div>

            <div className="movie-card-year">
              {m.year} • {m.duration_minutes} min
              {m.age_rating ? ` • ${m.age_rating}` : ""}
            </div>

            {m.avg_rating && (
              <div className="movie-card-year">
                ★ {m.avg_rating.toFixed(1)}
              </div>
            )}

            {typeof m.sessions_count === "number" && (
              <div className="movie-card-year">
                Sessões disponíveis: <b>{m.sessions_count}</b>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
