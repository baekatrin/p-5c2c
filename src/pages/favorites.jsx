import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Card from "./card";

export default function Favorites() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const favoritedIds = useMemo(() => new Set(rows.map((r) => r.serviceID)), [rows]);

  async function loadFavorites() {
    setLoading(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      setRows([]);
      setError("You must be signed in to view favorites.");
      setLoading(false);
      return;
    }

    const { data: favs, error: favErr } = await supabase
      .from("favorites")
      .select("id, created_at, userID, serviceID")
      .eq("userID", userId)
      .order("created_at", { ascending: false });

    if (favErr) {
      setRows([]);
      setError(favErr.message);
      setLoading(false);
      return;
    }

    const serviceIds = (favs || []).map((f) => f.serviceID).filter(Boolean);
    if (serviceIds.length === 0) {
      setRows(favs || []);
      setLoading(false);
      return;
    }

    const { data: listings, error: listErr } = await supabase
      .from("listings")
      .select("*")
      .in("id", serviceIds);

    if (listErr) {
      setRows([]);
      setError(listErr.message);
      setLoading(false);
      return;
    }

    const byId = new Map((listings || []).map((l) => [l.id, l]));
    setRows(
      (favs || []).map((f) => ({
        ...f,
        listing: byId.get(f.serviceID) || null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function removeFavorite(serviceId) {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const { error: delErr } = await supabase
      .from("favorites")
      .delete()
      .eq("userID", userId)
      .eq("serviceID", serviceId);

    if (delErr) {
      setError(delErr.message);
      return;
    }

    setRows((prev) => prev.filter((r) => r.serviceID !== serviceId));
  }

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <button style={styles.backBtn} type="button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>Favorites</h1>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : rows.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No favorites yet</p>
          <p style={styles.muted}>Tap the heart on any listing to save it here.</p>
          <button type="button" style={styles.emptyCta} onClick={() => navigate("/")}>
            Browse listings
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {rows.map((row) => {
            const l = row.listing;
            if (!l) {
              return (
                <div key={row.id} style={styles.missingCard}>
                  <p style={styles.missingTitle}>Unavailable listing</p>
                  <p style={styles.mutedSmall}>serviceID: {String(row.serviceID)}</p>
                  <button type="button" style={styles.removeBtn} onClick={() => removeFavorite(row.serviceID)}>
                    Remove
                  </button>
                </div>
              );
            }

            const cardListing = {
              id: l.id,
              name: l.title,
              seller: l.seller_id,
              images: l.images,
              description: l.description,
              priceMin: l.price_min,
              priceMax: l.price_max,
            };

            return (
              <Card
                key={row.id}
                listing={cardListing}
                isFavorited={favoritedIds.has(l.id)}
                onFavoriteToggle={() => removeFavorite(l.id)}
                onClick={() => navigate(`/product/${l.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fff5da",
    padding: "24px 32px",
    fontFamily: "'Pally', sans-serif",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    color: "#333",
    padding: "8px 0",
    fontFamily: "'Pally', sans-serif",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "900",
    color: "#111",
  },
  muted: {
    margin: 0,
    color: "#555",
    fontSize: "14px",
  },
  emptyState: {
    marginTop: "12px",
    background: "#fff",
    border: "1.5px solid #000",
    borderRadius: "12px",
    padding: "18px",
    maxWidth: "420px",
  },
  emptyTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111",
    fontFamily: "'Pally', sans-serif",
  },
  emptyCta: {
    marginTop: "12px",
    backgroundColor: "#941b32",
    color: "#fff",
    border: "1.5px solid #000",
    borderRadius: "8px",
    padding: "9px 14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Pally', sans-serif",
  },
  mutedSmall: {
    margin: "6px 0 0",
    color: "#777",
    fontSize: "12px",
    wordBreak: "break-all",
  },
  error: {
    margin: "0 0 16px",
    color: "#941b32",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
    alignItems: "start",
  },
  missingCard: {
    background: "#fff",
    border: "1.5px solid #000",
    borderRadius: "12px",
    padding: "14px",
  },
  missingTitle: {
    margin: 0,
    fontWeight: "800",
    color: "#111",
  },
  removeBtn: {
    marginTop: "10px",
    backgroundColor: "#fff",
    border: "1.5px solid #000",
    borderRadius: "8px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Pally', sans-serif",
  },
};
