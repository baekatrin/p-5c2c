import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ChatPopup from "./chatpopup";

const PLACEHOLDER_IMAGES = [
  { color: "#d4c5b0", label: "1" },
  { color: "#b0c5d4", label: "2" },
  { color: "#b0d4b8", label: "3" },
  { color: "#d4b0b0", label: "4" },
  { color: "#d4d0b0", label: "5" },
];

const PRODUCTS = [
  { id: 1, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100,  category: "Category" },
  { id: 2, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 150, category: "Category" },
  { id: 3, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, category: "Category" },
  { id: 4, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 200, category: "Category" },
  { id: 5, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, category: "Category" },
  { id: 6, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, category: "Category" },
  { id: 7, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 150, category: "Category" },
  { id: 8, name: "Listing Name", seller: "Shop Name", seller_id: null, images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, category: "Category" },
];

const HeartIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "#941b32" : "none"} stroke={filled ? "#941b32" : "#333"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 2 12 14" />
    <polyline points="8 6 12 2 16 6" />
    <path d="M20 14v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6" />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function ViewListing() {
  const { id } = useParams();
  const navigateTo = useNavigate();
  const [favorited, setFavorited] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Chat popup state
  const [chatOpen, setChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  const listing = PRODUCTS.find((p) => p.id === parseInt(id)) || PRODUCTS[0];
  const hasRealImages = listing.images && listing.images.length > 0;
  const images = hasRealImages ? listing.images : PLACEHOLDER_IMAGES;

  const priceLabel =
    listing.priceMin === listing.priceMax
      ? `$${listing.priceMin}`
      : `$${listing.priceMin} – $${listing.priceMax}`;

  // ── Open chat popup: find or create conversation
  async function handleMessageSeller() {
    if (loadingChat) return;

    if (!listing.seller_id) {
      alert("This is a placeholder listing — no seller to message yet!");
      return;
    }

    setLoadingChat(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigateTo("/login"); return; }

      if (user.id === listing.seller_id) {
        alert("That's your own listing!");
        setLoadingChat(false);
        return;
      }

      // Look for an existing conversation first
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("buyer_id", user.id)
        .eq("seller_id", listing.seller_id)
        .single();

      if (existing) {
        setConversationId(existing.id);
        setChatOpen(true);
        setLoadingChat(false);
        return;
      }

      // Create a new conversation
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        })
        .select("id")
        .single();

      if (error || !created) {
        console.error("Failed to create conversation:", error);
        alert("Something went wrong. Please try again.");
        setLoadingChat(false);
        return;
      }

      setConversationId(created.id);
      setChatOpen(true);
    } catch (err) {
      console.error(err);
    }

    setLoadingChat(false);
  }

  return (
    <div style={styles.page}>

      <button style={styles.backBtn} onClick={() => navigateTo(-1)}>
        <BackIcon />
        Back
      </button>

      <div style={styles.layout}>

        {/* ── LEFT: Image column ── */}
        <div style={styles.imageColumn}>
          <div style={styles.imageBox}>
            {hasRealImages ? (
              <img src={images[activeIndex]} alt={listing.name} style={styles.image} />
            ) : (
              <div style={{ ...styles.placeholderSwatch, backgroundColor: images[activeIndex].color }}>
                <span style={styles.placeholderLabel}>Image {images[activeIndex].label}</span>
              </div>
            )}
            <div style={styles.dotsOverlay}>
              {images.length > 1 && (
                <button style={styles.arrowBtn} onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}>‹</button>
              )}
              {images.map((_, i) => (
                <span key={i} style={{ ...styles.dot, ...(i === activeIndex ? styles.dotActive : {}) }} onClick={() => setActiveIndex(i)} />
              ))}
              {images.length > 1 && (
                <button style={styles.arrowBtn} onClick={() => setActiveIndex((i) => (i + 1) % images.length)}>›</button>
              )}
            </div>
            <div style={styles.imageBtnStack}>
              <button style={styles.imageActionBtn} onClick={() => setFavorited((f) => !f)}>
                <HeartIcon filled={favorited} />
              </button>
              <button style={styles.imageActionBtn} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                <ShareIcon />
              </button>
            </div>
          </div>

          <div style={styles.thumbnailStrip}>
            {images.map((img, i) => (
              <button
                key={i}
                style={{ ...styles.thumbnail, ...(i === activeIndex ? styles.thumbnailActive : {}), backgroundColor: hasRealImages ? "#e0e0e0" : img.color }}
                onClick={() => setActiveIndex(i)}
              >
                {hasRealImages ? (
                  <img src={img} alt={`${listing.name} ${i + 1}`} style={styles.thumbnailImg} />
                ) : (
                  <span style={styles.thumbnailLabel}>{img.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Details ── */}
        <div style={styles.detailsColumn}>
          <div style={styles.titlePriceRow}>
            <div style={styles.titleCategoryCol}>
              <h1 style={styles.title}>{listing.name}</h1>
              <div style={styles.categoryBox}>{listing.category}</div>
            </div>
            <div style={styles.priceBox}>{priceLabel}</div>
          </div>

          <div style={styles.descriptionBox}>
            <p style={styles.descriptionText}>{listing.description}</p>
          </div>

          <div style={styles.creatorRow}>
            <div style={styles.creatorAvatar}>
              <span style={styles.creatorInitial}>{listing.seller ? listing.seller[0] : "S"}</span>
            </div>
            <div style={styles.creatorInfo}>
              <p style={styles.creatorLabel}>About the Creator</p>
              <p style={styles.creatorName}>{listing.seller}</p>
            </div>
          </div>

          {/* ── MESSAGE BUTTON — opens popup ── */}
          <button
            style={{ ...styles.messageBtn, opacity: loadingChat ? 0.6 : 1, cursor: loadingChat ? "wait" : "pointer" }}
            onClick={handleMessageSeller}
            disabled={loadingChat}
          >
            {loadingChat ? "Opening chat..." : "Message seller to purchase"}
          </button>

          <button style={styles.sellBtn} onClick={() => navigateTo("/createlisting")}>
            Have an item like this? Sell your own!
          </button>
        </div>
      </div>

      {/* ── Chat popup — floats over the page ── */}
      {chatOpen && conversationId && (
        <ChatPopup
          conversationId={conversationId}
          listingName={listing.name}
          onClose={() => setChatOpen(false)}
          onOpenInbox={() => navigateTo("/messages")}
        />
      )}

    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#fff5da", fontFamily: "'Pally', sans-serif", padding: "24px 40px" },
  backBtn: { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#333", padding: "8px 0", marginBottom: "24px", fontFamily: "'Pally', sans-serif" },
  layout: { display: "flex", gap: "48px", alignItems: "flex-start" },
  imageColumn: { flexShrink: 0, width: "340px" },
  imageBox: { position: "relative", width: "100%", aspectRatio: "3/4", backgroundColor: "#e0e0e0", borderRadius: "16px", border: "1.5px solid #000", overflow: "hidden" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  placeholderSwatch: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  placeholderLabel: { fontSize: "18px", fontWeight: "700", color: "rgba(0,0,0,0.3)", fontFamily: "'Pally', sans-serif" },
  arrowBtn: { background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: "20px", lineHeight: "1", padding: "0 2px", display: "flex", alignItems: "center", justifyContent: "center" },
  dotsOverlay: { position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", alignItems: "center" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "background 0.2s" },
  dotActive: { backgroundColor: "#fff" },
  imageBtnStack: { position: "absolute", bottom: "10px", right: "10px", display: "flex", flexDirection: "column", gap: "6px" },
  imageActionBtn: { background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  thumbnailStrip: { display: "flex", gap: "8px", marginTop: "12px" },
  thumbnail: { flex: 1, aspectRatio: "1/1", borderRadius: "8px", border: "1.5px solid #ccc", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "border-color 0.15s" },
  thumbnailActive: { border: "2px solid #000" },
  thumbnailImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbnailLabel: { fontSize: "12px", fontWeight: "700", color: "rgba(0,0,0,0.35)", fontFamily: "'Pally', sans-serif" },
  detailsColumn: { flex: 1, display: "flex", flexDirection: "column", gap: "16px" },
  titlePriceRow: { display: "flex", gap: "16px", alignItems: "stretch" },
  titleCategoryCol: { flex: 1, display: "flex", flexDirection: "column", gap: "16px" },
  title: { margin: 0, fontSize: "22px", fontWeight: "800", color: "#111", border: "1.5px solid #000", borderRadius: "8px", padding: "12px 16px", backgroundColor: "#fff", fontFamily: "'Pally', sans-serif" },
  priceBox: { flexShrink: 0, fontSize: "36px", fontWeight: "800", color: "#111", border: "1.5px solid #000", borderRadius: "8px", padding: "12px 16px", backgroundColor: "#fff", whiteSpace: "nowrap", fontFamily: "'Pally', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" },
  categoryBox: { fontSize: "14px", fontWeight: "600", color: "#444", border: "1.5px solid #000", borderRadius: "8px", padding: "12px 16px", backgroundColor: "#fff", fontFamily: "'Pally', sans-serif" },
  descriptionBox: { border: "1.5px solid #000", borderRadius: "8px", padding: "16px", backgroundColor: "#fff", minHeight: "120px" },
  descriptionText: { margin: 0, fontSize: "14px", color: "#333", lineHeight: "1.6", fontFamily: "'Pally', sans-serif" },
  creatorRow: { display: "flex", alignItems: "center", gap: "16px" },
  creatorAvatar: { flexShrink: 0, width: "52px", height: "52px", borderRadius: "50%", border: "1.5px solid #000", backgroundColor: "#ddd", display: "flex", alignItems: "center", justifyContent: "center" },
  creatorInitial: { fontSize: "20px", fontWeight: "700", color: "#555" },
  creatorInfo: { flex: 1, border: "1.5px solid #000", borderRadius: "8px", padding: "12px 16px", backgroundColor: "#fff" },
  creatorLabel: { margin: "0 0 4px", fontSize: "12px", color: "#888", fontWeight: "400", fontFamily: "'Pally', sans-serif" },
  creatorName: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#111", fontFamily: "'Pally', sans-serif" },
  messageBtn: { padding: "14px 20px", backgroundColor: "#941b32", color: "#fff", border: "1.5px solid #000", borderRadius: "8px", fontSize: "30px", fontWeight: "700", fontFamily: "'Pally', sans-serif", width: "100%", transition: "opacity 0.15s" },
  sellBtn: { padding: "10px 20px", backgroundColor: "#f39836", color: "#fff", border: "1.5px solid #000", borderRadius: "8px", fontSize: "22px", fontWeight: "700", fontFamily: "'Pally', sans-serif", cursor: "pointer", width: "95%", alignSelf: "center" },
};
