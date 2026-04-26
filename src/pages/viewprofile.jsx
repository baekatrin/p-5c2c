import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Card from "./card";

const ASPECT_RATIOS = ["3/2", "1/2", "4/5", "2/3", "1/3", "3/2", "2/5", "4/3"];

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: "28px",
            cursor: onChange ? "pointer" : "default",
            color: star <= (hovered || value) ? "#f39836" : "#ddd",
            transition: "color 0.1s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [messagingBusy, setMessagingBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: profileData }, { data: listingsData }] = await Promise.all([
        supabase.from("User").select("*").eq("id", id).single(),
        supabase.from("listings").select("*").eq("seller_id", id).order("created_at", { ascending: false }),
      ]);
      if (profileData) setProfile(profileData);
      if (listingsData) setListings(listingsData);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleMessageSeller = async () => {
    setMessagingBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessagingBusy(false); return; }

    // find or create a conversation between buyer and this seller (no listing)
    let { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("seller_id", id)
      .is("listing_id", null)
      .maybeSingle();

    if (!convo) {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({ buyer_id: user.id, seller_id: id, listing_id: null })
        .select("id")
        .single();
      convo = newConvo;
    }

    setMessagingBusy(false);
    if (convo) navigate(`/chat/${convo.id}`);
  };

  if (loading) return <p style={{ padding: "40px", fontFamily: "var(--font-body)" }}>Loading...</p>;
  if (!profile) return <p style={{ padding: "40px", fontFamily: "var(--font-body)" }}>Profile not found.</p>;

  const columns = [[], [], [], []];
  listings.forEach((l, i) => columns[i % 4].push({ ...l, aspectRatio: ASPECT_RATIOS[i % ASPECT_RATIOS.length] }));

  return (
    <div style={styles.page}>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* ── PROFILE CARD ── */}
      <div style={styles.profileCard}>

        {/* Avatar / profile pic */}
        <div style={styles.avatar}>
          {profile.profilePic ? (
            <img src={profile.profilePic} alt="Profile" style={styles.avatarImg} />
          ) : (
            <span style={styles.avatarInitials}>
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </span>
          )}
        </div>

        <div style={styles.profileInfo}>
          <h1 style={styles.name}>{profile.firstName} {profile.lastName}</h1>
          <p style={styles.username}>@{profile.username}</p>
          <p style={styles.school}>{profile.school}</p>

          {/* Avg rating display */}
          <div style={styles.ratingRow}>
            <StarRating value={Math.round(profile.avgRating || 0)} />
            <span style={styles.ratingLabel}>
              {profile.avgRating?.toFixed(1)} ({profile.reviewCount} reviews)
            </span>
          </div>

          {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.messageBtn} onClick={handleMessageSeller} disabled={messagingBusy}>
              {messagingBusy ? "Opening chat..." : "Message Seller"}
            </button>
          </div>
        </div>
      </div>

      {/* ── LEAVE A REVIEW ── */}
      <div style={styles.reviewSection}>
        <h2 style={styles.sectionTitle}>Leave a Review</h2>
        {submitted ? (
          <p style={styles.reviewThanks}>Thanks for your review!</p>
        ) : (
          <div style={styles.reviewForm}>
            <StarRating value={userRating} onChange={setUserRating} />
            <button
              style={{ ...styles.submitReviewBtn, ...(userRating === 0 ? styles.submitDisabled : {}) }}
              disabled={userRating === 0}
              onClick={() => setSubmitted(true)}
            >
              Submit Review
            </button>
          </div>
        )}
      </div>

      {/* ── LISTINGS ── */}
      <div style={styles.listingsSection}>
        <h2 style={styles.sectionTitle}>
          Listings
          <span style={styles.listingCount}>{listings.length} active</span>
        </h2>

        {listings.length === 0 ? (
          <p style={styles.emptyText}>No listings yet.</p>
        ) : (
          <div style={styles.grid}>
            {columns.map((col, colIndex) => (
              <div key={colIndex} style={styles.column}>
                {col.map((listing) => (
                  <Card
                    key={listing.id}
                    listing={{
                      id: listing.id,
                      name: listing.title,
                      seller: profile.username,
                      images: listing.images,
                      description: listing.description,
                      priceMin: listing.price_min,
                      priceMax: listing.price_max,
                    }}
                    aspectRatio={listing.aspectRatio}
                    onClick={() => navigate(`/product/${listing.id}`)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "var(--color-bg)",
    fontFamily: "var(--font-body)",
    paddingBottom: "80px",
  },
  header: {
    backgroundColor: "var(--color-surface)",
    borderBottom: "1.5px solid var(--color-border)",
    padding: "14px 28px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: "14px",
    fontFamily: "var(--font-display)",
    cursor: "pointer",
    color: "var(--color-text)",
    padding: 0,
  },
  profileCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "40px",
    maxWidth: "1200px",
    margin: "56px auto 0",
    padding: "0 40px",
  },
  avatar: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    backgroundColor: "var(--color-accent)",
    border: "3px solid var(--color-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: "56px",
    fontFamily: "var(--font-display)",
    fontWeight: "700",
    color: "#fff",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  name: {
    fontFamily: "var(--font-display)",
    fontSize: "2.8rem",
    fontWeight: "700",
    color: "var(--color-text)",
    margin: 0,
  },
  username: {
    fontFamily: "var(--font-body)",
    fontSize: "18px",
    color: "var(--color-text-muted)",
    margin: 0,
  },
  school: {
    fontFamily: "var(--font-display)",
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--color-primary)",
    margin: 0,
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "4px",
  },
  ratingLabel: {
    fontSize: "14px",
    color: "var(--color-text-muted)",
    fontFamily: "var(--font-body)",
  },
  bio: {
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    color: "var(--color-text)",
    marginTop: "4px",
    lineHeight: "1.6",
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  messageBtn: {
    padding: "12px 28px",
    backgroundColor: "var(--color-primary)",
    color: "#fff",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "15px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    cursor: "pointer",
  },
  reviewSection: {
    maxWidth: "1200px",
    margin: "48px auto 0",
    padding: "0 40px",
  },
  reviewForm: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  reviewThanks: {
    fontFamily: "var(--font-body)",
    fontSize: "15px",
    color: "var(--color-text-muted)",
  },
  submitReviewBtn: {
    padding: "8px 20px",
    backgroundColor: "var(--color-primary)",
    color: "#fff",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
    borderColor: "#ccc",
  },
  listingsSection: {
    maxWidth: "1200px",
    margin: "40px auto 0",
    padding: "0 40px",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "var(--color-text)",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  listingCount: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--color-text-muted)",
    fontFamily: "var(--font-body)",
  },
  emptyText: {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    color: "var(--color-text-muted)",
  },
  grid: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
  },
};
