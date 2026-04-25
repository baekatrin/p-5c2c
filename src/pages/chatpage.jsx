import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ChatPopup from "./chatpopup";

export default function ChatPage() {
  const { id } = useParams();
  const navigateTo = useNavigate();
  const [listingName, setListingName] = useState("Listing");

  useEffect(() => {
    let isMounted = true;

    async function loadListingName() {
      if (!id) return;

      const { data: convo } = await supabase
        .from("conversations")
        .select("listing_id")
        .eq("id", id)
        .single();

      if (!isMounted) return;
      if (!convo?.listing_id) return;

      const { data: listing } = await supabase
        .from("listings")
        .select("title")
        .eq("id", convo.listing_id)
        .single();

      if (!isMounted) return;
      if (listing?.title) setListingName(listing.title);
    }

    loadListingName();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff5da" }}>
      <ChatPopup
        conversationId={id}
        listingName={listingName}
        onClose={() => navigateTo("/messages")}
        onOpenInbox={() => navigateTo("/messages")}
      />
    </div>
  );
}
