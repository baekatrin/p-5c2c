import { useEffect, useMemo, useState } from "react";
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
  {
    id: 1,
    name: "Listing Name",
    seller: "Shop Name",
    images: [],
    description: "A short description of this listing.",
    priceMin: 100,
    priceMax: 100,
    category: "Category",
    seller_id: null,
  },
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

  const [chatOpen, setChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const listing =
    PRODUCTS.find((p) => p.id === parseInt(id)) || PRODUCTS[0];

  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : PLACEHOLDER_IMAGES;
  const [favorited, setFavorited] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [listing, setListing] = useState(null);
  const [sellerName, setSellerName] = useState("Shop Name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenImageIndexes, setBrokenImageIndexes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    console.log("Looking up listing id:", id);
    async function loadListingData() {
      setLoading(true);
      setError("");
      setActiveIndex(0);
      setBrokenImageIndexes([]);

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, seller_id, title, description, category, price_min, price_max, pricing_note, images")
        .eq("id", id)
        .single();

      if (listingError) {
        if (!isMounted) return;
        setListing(null);
        setError("Could not load this listing.");
        setLoading(false);
        return;
      }

      if (!isMounted) return;
      setListing(listingData);

      if (!listingData?.seller_id) {
        setSellerName("Unknown seller");
        setLoading(false);
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from("User")
        .select("username, firstName, lastName")
        .eq("id", listingData.seller_id)
        .single();

      if (!isMounted) return;

      if (sellerError) {
        setSellerName(listingData.seller_id || "Unknown seller");
        setLoading(false);
        return;
      }

      const fullName = [sellerData?.firstName, sellerData?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      setSellerName(fullName || sellerData?.username || "Unknown seller");
      setLoading(false);
    }

    loadListingData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Temporarily disable real image loading so text fields can be validated without image 404s.
  const hasRealImages = false;
  const images = PLACEHOLDER_IMAGES;

  const priceLabel = useMemo(() => {
    const min = listing?.price_min;
    const max = listing?.price_max;

    if (min == null && max == null) return "Price TBD";
    if (max == null || min === max) return `$${min}`;
    return `$${min} – $${max}`;
  }, [listing?.price_min, listing?.price_max]);

  if (loading) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigateTo(-1)}>
          <BackIcon />
          Back
        </button>
        <p style={styles.statusText}>Loading listing...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigateTo(-1)}>
          <BackIcon />
          Back
        </button>
        <p style={styles.errorText}>{error || "Listing not found."}</p>
      </div>
    );
  }

  // -----------------------------
  // MESSAGE SELLER
  // -----------------------------
  const handleMessageSeller = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const buyerId = userData?.user?.id;

    if (!buyerId) return;

    const sellerId = listing.seller_id;

    // TEMP fallback for mock data
    if (!sellerId) {
      setConversationId("demo");
      setChatOpen(true);
      return;
    }

    let { data: convo } = await supabase
      .from("conversations")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("buyer_id", buyerId)
      .eq("seller_id", sellerId)
      .single();

    if (!convo) {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          buyer_id: buyerId,
          seller_id: sellerId,
        })
        .select()
        .single();

      convo = newConvo;
    }

    setConversationId(convo.id);
    setChatOpen(true);
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigateTo(-1)}>
        Back
      </button>

      <div style={styles.layout}>
        <div style={styles.imageColumn}>
          <div style={styles.imageBox}>
            <div
              style={{
                ...styles.placeholderSwatch,
                backgroundColor: images[0].color,
              }}
            >
              Image {images[0].label}
            </div>
          </div>
            {hasRealImages ? (
              brokenImageIndexes.includes(activeIndex) ? (
                <div style={{ ...styles.placeholderSwatch, backgroundColor: "#d4c5b0" }}>
                  <span style={styles.placeholderLabel}>Image unavailable</span>
                </div>
              ) : (
                <img
                  src={images[activeIndex]}
                  alt={listing.title || "Listing image"}
                  style={styles.image}
                  onError={() =>
                    setBrokenImageIndexes((prev) =>
                      prev.includes(activeIndex) ? prev : [...prev, activeIndex]
                    )
                  }
                />
              )
            ) : (
              <div style={{ ...styles.placeholderSwatch, backgroundColor: images[activeIndex].color }}>
                <span style={styles.placeholderLabel}>Image {images[activeIndex].label}</span>
              </div>
            )}

            {/* Arrows + dots row — bottom center */}
            <div style={styles.dotsOverlay}>
              {images.length > 1 && (
                <button
                  style={styles.arrowBtn}
                  onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}
                >
                  ‹
                </button>
              )}
              {images.map((_, i) => (
                <span
                  key={i}
                  style={{ ...styles.dot, ...(i === activeIndex ? styles.dotActive : {}) }}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
              {images.length > 1 && (
                <button
                  style={styles.arrowBtn}
                  onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
                >
                  ›
                </button>
              )}
            </div>

            {/* Heart + Share buttons — bottom right */}
            <div style={styles.imageBtnStack}>
              <button
                style={styles.imageActionBtn}
                onClick={() => setFavorited((f) => !f)}
                title={favorited ? "Remove from favorites" : "Add to favorites"}
              >
                <HeartIcon filled={favorited} />
              </button>
              <button
                style={styles.imageActionBtn}
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                title="Copy link to clipboard"
              >
                <ShareIcon />
              </button>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div style={styles.thumbnailStrip}>
            {images.map((img, i) => (
              <button
                key={i}
                style={{
                  ...styles.thumbnail,
                  ...(i === activeIndex ? styles.thumbnailActive : {}),
                  backgroundColor: hasRealImages ? "#e0e0e0" : img.color,
                }}
                onClick={() => setActiveIndex(i)}
              >
                {hasRealImages ? (
                  brokenImageIndexes.includes(i) ? (
                    <span style={styles.thumbnailLabel}>X</span>
                  ) : (
                    <img
                      src={img}
                      alt={`${listing.title || "Listing"} ${i + 1}`}
                      style={styles.thumbnailImg}
                      onError={() =>
                        setBrokenImageIndexes((prev) => (prev.includes(i) ? prev : [...prev, i]))
                      }
                    />
                  )
                ) : (
                  <span style={styles.thumbnailLabel}>{img.label}</span>
                )}
              </button>
            ))}
          </div>

        </div>

        <div style={styles.detailsColumn}>
          <h1>{listing.name}</h1>
          <p>{listing.description}</p>
          <h2>{priceLabel}</h2>

          <p>Seller: {listing.seller}</p>

          <button
            style={styles.messageBtn}
            onClick={handleMessageSeller}
          >
            Message seller to purchase
          </button>
          {/* Title + Category + Price */}
          <div style={styles.titlePriceRow}>
            <div style={styles.titleCategoryCol}>
              <h1 style={styles.title}>{listing.title || "Untitled listing"}</h1>
              <div style={styles.categoryBox}>{listing.category || "Category"}</div>
            </div>
            <div style={styles.priceBox}>{priceLabel}</div>
          </div>

          {/* Description */}
          <div style={styles.descriptionBox}>
            <p style={styles.descriptionText}>{listing.description || "No description provided."}</p>
          </div>

          {/* About the Creator */}
          <div style={styles.creatorRow}>
            <div style={styles.creatorAvatar}>
              <span style={styles.creatorInitial}>
                {sellerName ? sellerName[0].toUpperCase() : "S"}
              </span>
            </div>
            <div style={styles.creatorInfo}>
              <p style={styles.creatorLabel}>About the Creator</p>
              <p style={styles.creatorName}>{sellerName}</p>
            </div>
          </div>

          {/* Message seller */}
          <button style={styles.messageBtn}>
            Message seller to purchase
          </button>

          <button
            style={styles.sellBtn}
            onClick={() => navigateTo("/createlisting")}
          >
            Sell your own
          </button>
        </div>
      </div>

      {/* CHAT POPUP */}
      {chatOpen && (
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
  page: {
    minHeight: "100vh",
    background: "#fff5da",
    padding: "24px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    padding: "8px 0",
    marginBottom: "24px",
    fontFamily: "'Pally', sans-serif",
  },
  statusText: {
    margin: 0,
    fontSize: "16px",
    color: "#333",
    fontFamily: "'Pally', sans-serif",
  },
  errorText: {
    margin: 0,
    fontSize: "16px",
    color: "#941b32",
    fontFamily: "'Pally', sans-serif",
  },

  layout: {
    display: "flex",
    gap: "40px",
  },
  imageColumn: {
    width: "320px",
  },
  imageBox: {
    width: "100%",
    aspectRatio: "3/4",
    border: "1px solid #000",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderSwatch: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  messageBtn: {
    background: "#941b32",
    color: "white",
    padding: "14px",
    border: "1px solid black",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  sellBtn: {
    background: "#f39836",
    color: "white",
    padding: "12px",
    border: "1px solid black",
    borderRadius: "8px",
    cursor: "pointer",
  },
  backBtn: {
    marginBottom: "20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
};