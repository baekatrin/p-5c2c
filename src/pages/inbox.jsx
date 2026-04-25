import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Inbox() {
  const navigateTo = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── 1. Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  // ── 2. Load all conversations enriched with listing + other user info
  useEffect(() => {
    if (!currentUser) return;

    async function loadConversations() {
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false });

      if (error || !convos) {
        console.error("Error loading conversations:", error);
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(
        convos.map(async (convo) => {
          const otherId = currentUser.id === convo.buyer_id ? convo.seller_id : convo.buyer_id;

          // Most recent message timestamp (for sorting)
          const { data: lastMsgArr } = await supabase
            .from("messages")
            .select("created_at")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMsgAt = lastMsgArr?.[0]?.created_at ?? null;

          // Other user's name
          const { data: otherUser } = await supabase
            .from("User")
            .select("name") // ← adjust if your column name differs
            .eq("id", otherId)
            .single();

          // Listing info
          let listingTitle = "";
          let listingImage = null;
          if (convo.listing_id) {
            const { data: listing } = await supabase
              .from("listings")
              .select("title, images")
              .eq("id", convo.listing_id)
              .single();
            if (listing) {
              listingTitle = listing.title;
              // images is an array — grab first one
              listingImage = listing.images?.[0] ?? null;
            }
          }

          return {
            ...convo,
            lastMsgAt,
            otherUserName: otherUser?.name ?? "Unknown",
            listingTitle,
            listingImage,
          };
        })
      );

      // Sort by most recent activity
      enriched.sort((a, b) => {
        const aTime = a.lastMsgAt ?? a.created_at;
        const bTime = b.lastMsgAt ?? b.created_at;
        return new Date(bTime) - new Date(aTime);
      });

      setConversations(enriched);
      setLoading(false);
    }

    loadConversations();
  }, [currentUser]);

  function formatTimestamp(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigateTo("/")}>← Back</button>
        <h1 style={styles.title}>Inbox</h1>
      </div>

      {/* List */}
      <div style={styles.list}>
        {loading && <p style={styles.statusText}>Loading conversations...</p>}

        {!loading && conversations.length === 0 && (
          <p style={styles.statusText}>No messages yet — find a listing and reach out!</p>
        )}

        {!loading && conversations.map((convo) => (
          <button
            key={convo.id}
            style={styles.convoRow}
            onClick={() => navigateTo(`/chat/${convo.id}`)}
          >
            {/* Listing thumbnail */}
            <div style={styles.thumbnail}>
              {convo.listingImage ? (
                <img src={convo.listingImage} alt={convo.listingTitle} style={styles.thumbnailImg} />
              ) : (
                <div style={styles.thumbnailPlaceholder}>
                  <span style={styles.thumbnailPlaceholderText}>?</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={styles.convoInfo}>
              <div style={styles.convoTopRow}>
                <span style={styles.convoName}>{convo.otherUserName}</span>
                <span style={styles.convoTime}>
                  {formatTimestamp(convo.lastMsgAt ?? convo.created_at)}
                </span>
              </div>
              {convo.listingTitle && (
                <p style={styles.convoListing}>Re: {convo.listingTitle}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fff5da",
    fontFamily: "'Pally', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 24px",
    backgroundColor: "#fffaec",
    borderBottom: "1.5px solid #000",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    fontFamily: "'Pally', sans-serif",
    padding: "4px 0",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#111",
  },
  list: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "12px 0",
  },
  statusText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 60,
    padding: "0 24px",
  },
  convoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: "14px 24px",
    background: "none",
    border: "none",
    borderBottom: "1px solid #e8e8e8",
    cursor: "pointer",
    textAlign: "left",
  },

  // Listing thumbnail (square)
  thumbnail: {
    flexShrink: 0,
    width: 56,
    height: 56,
    borderRadius: 10,
    border: "1.5px solid #000",
    overflow: "hidden",
    backgroundColor: "#e0e0e0",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
  },
  thumbnailPlaceholderText: {
    fontSize: 18,
    color: "#aaa",
    fontWeight: 700,
  },

  // Conversation info
  convoInfo: {
    flex: 1,
    minWidth: 0,
  },
  convoTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  convoName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111",
    fontFamily: "'Pally', sans-serif",
  },
  convoTime: {
    fontSize: 12,
    color: "#999",
    flexShrink: 0,
    fontFamily: "'Pally', sans-serif",
  },
  convoListing: {
    margin: "3px 0 0",
    fontSize: 13,
    color: "#941b32",
    fontWeight: 600,
    fontFamily: "'Pally', sans-serif",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};