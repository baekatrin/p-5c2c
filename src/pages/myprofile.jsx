import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Card from "./card";

const ASPECT_RATIOS = ["3/2", "1/2", "4/5", "2/3", "1/3", "3/2", "2/5", "4/3"];

const SCHOOLS = ["Harvey Mudd", "Pomona", "CMC", "Scripps", "Pitzer"];

function StarRating({ value }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: "28px",
            color: star <= value ? "#f39836" : "#ddd",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function MyProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  // Editable fields (separate from `profile` so we can cancel edits)
  const [editForm, setEditForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    bio: "",
    school: "",
    profilePic: "",
  });

  // ── Load profile + own listings + reviews received
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [
        { data: profileData },
        { data: listingsData },
        { data: reviewsData },
      ] = await Promise.all([
        supabase.from("User").select("*").eq("id", user.id).single(),
        supabase.from("listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        // NOTE: assumes a `reviews` table with reviewee_id, reviewer_id, rating, comment, created_at
        // If your table is named differently, change here.
        supabase.from("reviews").select("*").eq("reviewee_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          username: profileData.username || "",
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          bio: profileData.bio || "",
          school: profileData.school || "",
          profilePic: profileData.profilePic || "",
        });
      }
      if (listingsData) setListings(listingsData);
      if (reviewsData) setReviews(reviewsData);
      setLoading(false);
    }
    load();
  }, []);

  // ── Save profile edits
  async function handleSave() {
    setSaving(true);
    setSaveMessage({ type: "", text: "" });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("User")
      .update({
        username: editForm.username.trim() || null,
        firstName: editForm.firstName.trim() || null,
        lastName: editForm.lastName.trim() || null,
        bio: editForm.bio.trim() || null,
        school: editForm.school.trim() || null,
        profilePic: editForm.profilePic.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      setSaveMessage({ type: "error", text: error.message });
    } else {
      setProfile({ ...profile, ...editForm });
      setEditing(false);
      setSaveMessage({ type: "success", text: "Profile updated!" });
      setTimeout(() => setSaveMessage({ type: "", text: "" }), 2500);
    }
    setSaving(false);
  }

  function handleCancel() {
    // Revert form fields to current profile values
    setEditForm({
      username: profile.username || "",
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      bio: profile.bio || "",
      school: profile.school || "",
      profilePic: profile.profilePic || "",
    });
    setEditing(false);
    setSaveMessage({ type: "", text: "" });
  }

  // ── Delete a listing
  async function handleDeleteListing(listingId) {
    if (!confirm("Delete this listing? This can't be undone.")) return;

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      alert("Couldn't delete listing: " + error.message);
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  // ── Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) return <p style={{ padding: "40px", fontFamily: "var(--font-body)" }}>Loading...</p>;
  if (!profile) return <p style={{ padding: "40px", fontFamily: "var(--font-body)" }}>Profile not found.</p>;

  // Distribute listings across 4 columns (matches ViewProfile layout)
  const columns = [[], [], [], []];
  listings.forEach((l, i) => columns[i % 4].push({ ...l, aspectRatio: ASPECT_RATIOS[i % ASPECT_RATIOS.length] }));

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div style={styles.page}>


      {/* ── PROFILE CARD ── */}
      <div style={styles.profileCard}>

        {/* Avatar */}
        <div style={styles.avatar}>
          {(editing ? editForm.profilePic : profile.profilePic) ? (
            <img
              src={editing ? editForm.profilePic : profile.profilePic}
              alt="Profile"
              style={styles.avatarImg}
            />
          ) : (
            <span style={styles.avatarInitials}>
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </span>
          )}
        </div>

        <div style={styles.profileInfo}>

          {!editing ? (
            // ── VIEW MODE ──
            <>
              <h1 style={styles.name}>{profile.firstName} {profile.lastName}</h1>
              <p style={styles.username}>@{profile.username}</p>
              <p style={styles.school}>{profile.school}</p>

              <div style={styles.ratingRow}>
                <StarRating value={Math.round(avgRating)} />
                <span style={styles.ratingLabel}>
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"} ({reviews.length} reviews)
                </span>
              </div>

              {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

              <div style={styles.actions}>
                <button style={styles.editBtn} onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            // ── EDIT MODE ──
            <>
              <div style={styles.editFieldRow}>
                <input
                  style={styles.editInputLarge}
                  type="text"
                  placeholder="First name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
                <input
                  style={styles.editInputLarge}
                  type="text"
                  placeholder="Last name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>

              <input
                style={styles.editInput}
                type="text"
                placeholder="Username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />

              <select
                style={styles.editInput}
                value={editForm.school}
                onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
              >
                <option value="">Select your school</option>
                {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <input
                style={styles.editInput}
                type="url"
                placeholder="Profile picture URL"
                value={editForm.profilePic}
                onChange={(e) => setEditForm({ ...editForm, profilePic: e.target.value })}
              />

              <textarea
                style={{ ...styles.editInput, minHeight: "70px", resize: "vertical" }}
                placeholder="Bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              />

              <div style={styles.actions}>
                <button
                  style={{ ...styles.editBtn, ...(saving ? styles.btnDisabled : {}) }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button style={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>

              {saveMessage.text && (
                <p style={{
                  ...styles.saveMessage,
                  color: saveMessage.type === "error" ? "#941b32" : "#34715d",
                }}>
                  {saveMessage.text}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── REVIEWS RECEIVED ── */}
      <div style={styles.reviewSection}>
        <h2 style={styles.sectionTitle}>
          Reviews
          <span style={styles.listingCount}>{reviews.length} received</span>
        </h2>

        {reviews.length === 0 ? (
          <p style={styles.emptyText}>No reviews yet.</p>
        ) : (
          <div style={styles.reviewList}>
            {reviews.map((r) => (
              <div key={r.id} style={styles.reviewItem}>
                <StarRating value={r.rating || 0} />
                {r.comment && <p style={styles.reviewComment}>{r.comment}</p>}
                <p style={styles.reviewDate}>
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MY LISTINGS ── */}
      <div style={styles.listingsSection}>
        <h2 style={styles.sectionTitle}>
          My Listings
          <span style={styles.listingCount}>{listings.length} active</span>
        </h2>

        {listings.length === 0 ? (
          <div style={styles.emptyListings}>
            <p style={styles.emptyText}>You haven't posted any listings yet.</p>
            <button
              style={styles.createCta}
              onClick={() => navigate("/createlisting")}
            >
              + Create your first listing
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {columns.map((col, colIndex) => (
              <div key={colIndex} style={styles.column}>
                {col.map((listing) => (
                  <div key={listing.id} style={styles.listingWrapper}>
                    <Card
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
                    <div style={styles.listingActions}>
                      <button
                        style={styles.listingActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: route to an edit-listing page when you build it
                          navigate(`/product/${listing.id}`);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{ ...styles.listingActionBtn, ...styles.listingDeleteBtn }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteListing(listing.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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

  // Edit mode inputs
  editFieldRow: {
    display: "flex",
    gap: "10px",
  },
  editInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "15px",
    fontFamily: "var(--font-body)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  editInputLarge: {
    flex: 1,
    padding: "10px 12px",
    fontSize: "18px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },

  // Buttons
  editBtn: {
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
  cancelBtn: {
    padding: "12px 28px",
    backgroundColor: "#fff",
    color: "var(--color-text)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "15px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    cursor: "pointer",
  },
  logoutBtn: {
    padding: "12px 28px",
    backgroundColor: "#fff",
    color: "var(--color-primary)",
    border: "1.5px solid var(--color-primary)",
    borderRadius: "8px",
    fontSize: "15px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  saveMessage: {
    margin: "8px 0 0",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
  },

  // Reviews
  reviewSection: {
    maxWidth: "1200px",
    margin: "48px auto 0",
    padding: "0 40px",
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  reviewItem: {
    backgroundColor: "var(--color-surface)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "12px",
    padding: "16px",
  },
  reviewComment: {
    margin: "10px 0 0",
    fontSize: "15px",
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
    lineHeight: "1.5",
  },
  reviewDate: {
    margin: "8px 0 0",
    fontSize: "12px",
    color: "var(--color-text-muted)",
    fontFamily: "var(--font-body)",
  },

  // Listings
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
  emptyListings: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-start",
  },
  createCta: {
    padding: "10px 20px",
    backgroundColor: "var(--color-primary)",
    color: "#fff",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    cursor: "pointer",
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
  listingWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  listingActions: {
    display: "flex",
    gap: "8px",
  },
  listingActionBtn: {
    flex: 1,
    padding: "8px 12px",
    backgroundColor: "#fff",
    color: "var(--color-text)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "var(--font-display)",
    fontWeight: "600",
    cursor: "pointer",
  },
  listingDeleteBtn: {
    color: "var(--color-primary)",
    borderColor: "var(--color-primary)",
  },
};
