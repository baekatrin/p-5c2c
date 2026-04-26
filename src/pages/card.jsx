import React from "react";

const ImagePlaceholderIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

/**
 * Card — a product listing card.
 *
 * Props:
 *  listing — {
 *    name        : string           — listing title
 *    seller      : string           — shop / seller name
 *    images      : string[]         — array of 1–6 image URLs (first is thumbnail)
 *    description : string           — listing description
 *    priceMin    : number           — low end of price range
 *    priceMax    : number           — high end (set equal to priceMin for fixed price)
 *  }
 *  onClick — optional callback when card is clicked
 *  onFavoriteToggle — optional async callback when heart is clicked (return a Promise)
 */
export default function Card({
  listing,
  onClick,
  aspectRatio = "4/5",
  isFavorited = false,
  onFavoriteToggle,
}) {
  const images = listing.images && listing.images.length > 0 ? listing.images : [null];

  const priceLabel =
    listing.priceMin === listing.priceMax
      ? `$${listing.priceMin}`
      : `$${listing.priceMin} – $${listing.priceMax}`;

  return (
    <div style={styles.card} onClick={onClick}>

      {/* ── IMAGE AREA ── */}
      <div style={styles.imageArea}>
        {images[0] ? (
          <img
            src={images[0]}
            alt={listing.name}
            style={styles.image}
          />
        ) : (
          <ImagePlaceholderIcon />
        )}


        {onFavoriteToggle && (
          <button
            type="button"
            style={{
              ...styles.favoriteBtn,
              ...(isFavorited ? styles.favoriteBtnActive : {}),
            }}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            onClick={async (e) => {
              e.stopPropagation();
              await onFavoriteToggle();
            }}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        )}
      </div>

      {/* ── INFO AREA ── */}
      <div style={styles.info}>

        {/* Listing name */}
        <p style={styles.name}>{listing.name}</p>

        {/* Seller / shop name */}
        <p style={styles.seller}>{listing.seller}</p>

        {/* Description */}
        <p style={styles.description}>{listing.description}</p>

        {/* Price range */}
        <p style={styles.price}>{priceLabel}</p>

      </div>
    </div>
  );
}

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#941b32" : "none"} stroke={filled ? "#941b32" : "#333"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);


// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "none",
    overflow: "hidden",
    cursor: "pointer",
    transition: "box-shadow 0.2s, transform 0.2s",
    fontFamily: "Arial, sans-serif",
  },

  imageArea: {
    position: "relative",
    width: "100%",
    minHeight: "80px",
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "auto",
    display: "block",
  },

  // Prev / next arrow buttons
  arrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.75)",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    fontSize: "18px",
    lineHeight: "1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  // Dot row at bottom of image
  dots: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "5px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.55)",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  dotActive: {
    backgroundColor: "#fff",
  },

  favoriteBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "1.5px solid rgba(0,0,0,0.25)",
    background: "rgba(255,255,255,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  favoriteBtnActive: {
    background: "rgba(255,255,255,1)",
    border: "1.5px solid #000",
  },

  // Text section
  info: {
    padding: "12px 14px 14px",
  },
  name: {
    margin: "0 0 2px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#111",
    fontFamily: "'Pally', sans-serif",
  },
  seller: {
    margin: "0 0 8px",
    fontSize: "12px",
    color: "#888",
    fontWeight: "400",
    fontFamily: "'Pally', sans-serif",
  },
  description: {
    margin: "0 0 10px",
    fontSize: "12px",
    color: "#555",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  price: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#111",
    fontFamily: "'Pally', sans-serif",
  },
};
