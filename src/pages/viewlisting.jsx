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

  const priceLabel =
    listing.priceMin === listing.priceMax
      ? `$${listing.priceMin}`
      : `$${listing.priceMin} – $${listing.priceMax}`;

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