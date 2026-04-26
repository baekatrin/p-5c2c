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

  const [listing, setListing] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sellerName, setSellerName] = useState("Shop Name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenImageIndexes, setBrokenImageIndexes] = useState([]);

  const hasRealImages = useMemo(
    () => Array.isArray(listing?.images) && listing.images.length > 0,
    [listing?.images]
  );

  const displayImages = useMemo(() => {
    if (hasRealImages && listing?.images) return listing.images;
    return PLACEHOLDER_IMAGES;
  }, [hasRealImages, listing]);

  const priceLabel = useMemo(() => {
    const min = listing?.price_min;
    const max = listing?.price_max;

    if (min == null && max == null) return "Price TBD";
    if (max == null || min === max) return `$${min}`;
    return `$${min} – $${max}`;
  }, [listing?.price_min, listing?.price_max]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    let isMounted = true;

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

  useEffect(() => {
    let isMounted = true;

    async function loadFavoriteStatus() {
      if (!listing?.id) {
        if (isMounted) setFavorited(false);
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        if (isMounted) setFavorited(false);
        return;
      }

      const { data: favoriteRow } = await supabase
        .from("favorites")
        .select("id")
        .eq("userID", userId)
        .eq("serviceID", listing.id)
        .maybeSingle();

      if (!isMounted) return;
      setFavorited(Boolean(favoriteRow));
    }

    loadFavoriteStatus();

    return () => {
      isMounted = false;
    };
  }, [listing?.id]);

  if (loading) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} type="button" onClick={() => navigateTo(-1)}>
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
        <button style={styles.backBtn} type="button" onClick={() => navigateTo(-1)}>
          <BackIcon />
          Back
        </button>
        <p style={styles.errorText}>{error || "Listing not found."}</p>
      </div>
    );
  }

  const handleMessageSeller = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const buyerId = userData?.user?.id;

    if (!buyerId) return;

    const sellerId = listing.seller_id;

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

  const handleFavoriteToggle = async () => {
    if (!listing?.id || favoriteBusy) return;

    setFavoriteBusy(true);
    const nextFavorited = !favorited;
    setFavorited(nextFavorited);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) {
      setFavorited(false);
      setFavoriteBusy(false);
      return;
    }

    if (nextFavorited) {
      const { error: insertError } = await supabase
        .from("favorites")
        .insert({ userID: userId, serviceID: listing.id });

      if (insertError) {
        setFavorited(false);
      }
    } else {
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("userID", userId)
        .eq("serviceID", listing.id);

      if (deleteError) {
        setFavorited(true);
      }
    }

    setFavoriteBusy(false);
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} type="button" onClick={() => navigateTo(-1)}>
        <BackIcon />
        Back
      </button>

      <div style={styles.layout}>
        <div style={styles.imageColumn}>
          <div style={styles.imageBox}>
            {hasRealImages ? (
              brokenImageIndexes.includes(activeIndex) ? (
                <div style={{ ...styles.placeholderSwatch, backgroundColor: "#d4c5b0" }}>
                  <span style={styles.placeholderLabel}>Image unavailable</span>
                </div>
              ) : (
                <img
                  src={displayImages[activeIndex]}
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
              <div
                style={{
                  ...styles.placeholderSwatch,
                  backgroundColor: displayImages[activeIndex].color,
                }}
              >
                <span style={styles.placeholderLabel}>
                  Image {displayImages[activeIndex].label}
                </span>
              </div>
            )}

            <div style={styles.dotsOverlay}>
              {displayImages.length > 1 && (
                <button
                  type="button"
                  style={styles.arrowBtn}
                  onClick={() => setActiveIndex((i) => (i - 1 + displayImages.length) % displayImages.length)}
                >
                  ‹
                </button>
              )}
              {displayImages.map((_, i) => (
                <span
                  key={i}
                  style={{ ...styles.dot, ...(i === activeIndex ? styles.dotActive : {}) }}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
              {displayImages.length > 1 && (
                <button
                  type="button"
                  style={styles.arrowBtn}
                  onClick={() => setActiveIndex((i) => (i + 1) % displayImages.length)}
                >
                  ›
                </button>
              )}
            </div>

            <div style={styles.imageBtnStack}>
              <button
                type="button"
                style={styles.imageActionBtn}
                onClick={handleFavoriteToggle}
                title={favorited ? "Remove from favorites" : "Add to favorites"}
                disabled={favoriteBusy}
              >
                <HeartIcon filled={favorited} />
              </button>
              <button
                type="button"
                style={styles.imageActionBtn}
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                title="Copy link to clipboard"
              >
                <ShareIcon />
              </button>
            </div>
          </div>

          <div style={styles.thumbnailStrip}>
            {displayImages.map((img, i) => (
              <button
                type="button"
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
          <div style={styles.titlePriceRow}>
            <div style={styles.titleCategoryCol}>
              <h1 style={styles.title}>{listing.title || "Untitled listing"}</h1>
              <div style={styles.categoryBox}>{listing.category || "Category"}</div>
            </div>
            <div style={styles.priceBox}>{priceLabel}</div>
          </div>

          <div style={styles.descriptionBox}>
            <p style={styles.descriptionText}>{listing.description || "No description provided."}</p>
          </div>

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

          {currentUserId && listing?.seller_id === currentUserId ? (
            <button type="button" style={styles.editBtn} onClick={() => navigateTo(`/editlisting/${id}`)}>
              Edit Listing
            </button>
          ) : (
            <button type="button" style={styles.messageBtn} onClick={handleMessageSeller}>
              Message seller to purchase
            </button>
          )}

        </div>
      </div>

      {chatOpen && (
        <ChatPopup
          conversationId={conversationId}
          listingName={listing.title || "Listing"}
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
    flexWrap: "wrap",
    gap: "40px",
  },
  imageColumn: {
    width: "320px",
  },
  imageBox: {
    position: "relative",
    width: "100%",
    aspectRatio: "3/4",
    border: "1px solid #000",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  placeholderSwatch: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#333",
    fontFamily: "'Pally', sans-serif",
  },
  dotsOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  arrowBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "1px solid #000",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    padding: 0,
    fontFamily: "'Pally', sans-serif",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.25)",
    cursor: "pointer",
  },
  dotActive: {
    backgroundColor: "#000",
  },
  imageBtnStack: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    display: "flex",
    gap: "6px",
  },
  imageActionBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1.5px solid #000",
    background: "rgba(255,255,255,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  thumbnailStrip: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  thumbnail: {
    width: "56px",
    height: "56px",
    borderRadius: "8px",
    border: "1.5px solid #000",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "#e0e0e0",
  },
  thumbnailActive: {
    outline: "2px solid #941b32",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbnailLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#333",
  },
  detailsColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "240px",
  },
  titlePriceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  titleCategoryCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "900",
    color: "#111",
    fontFamily: "'Pally', sans-serif",
  },
  categoryBox: {
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 10px",
    border: "1px solid #000",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  priceBox: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#111",
    fontFamily: "'Pally', sans-serif",
  },
  descriptionBox: {
    marginTop: "4px",
  },
  descriptionText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.5,
    color: "#333",
    whiteSpace: "pre-wrap",
  },
  creatorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "8px",
  },
  creatorAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #000",
  },
  creatorInitial: {
    fontSize: "16px",
    fontWeight: "800",
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    margin: 0,
    fontSize: "12px",
    color: "#666",
  },
  creatorName: {
    margin: "4px 0 0",
    fontSize: "16px",
    fontWeight: "700",
  },
  messageBtn: {
    background: "#f39836",
    color: "white",
    padding: "14px",
    border: "1px solid black",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Pally', sans-serif",
  },
  sellBtn: {
    background: "#f39836",
    color: "white",
    padding: "12px 20px",
    border: "1px solid black",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontFamily: "'Pally', sans-serif",
    alignSelf: "flex-start",
  },
  editBtn: {
    background: "#ffffff",
    color: "#1a1a1a",
    padding: "12px",
    border: "1px solid black",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontFamily: "'Pally', sans-serif",
  },
};
