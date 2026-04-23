import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

/**
 * ChatPopup — floating chat modal shown over the listing page.
 *
 * Props:
 *   conversationId  — the conversation UUID from Supabase
 *   listingName     — shown in the popup header
 *   onClose()       — called when user clicks X
 *   onOpenInbox()   — called when user clicks "Open in inbox"
 */
export default function ChatPopup({ conversationId, listingName, onClose, onOpenInbox }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUserName, setOtherUserName] = useState("Seller");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // ── 1. Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  // ── 2. Load other user's name
  useEffect(() => {
    if (!currentUser || !conversationId) return;

    async function loadOtherUser() {
      const { data: convo } = await supabase
        .from("conversations")
        .select("buyer_id, seller_id")
        .eq("id", conversationId)
        .single();

      if (!convo) return;

      const otherId = currentUser.id === convo.buyer_id ? convo.seller_id : convo.buyer_id;

      const { data: otherUser } = await supabase
        .from("User")
        .select("name") // ← adjust if your column is named differently
        .eq("id", otherId)
        .single();

      if (otherUser?.name) setOtherUserName(otherUser.name);
    }

    loadOtherUser();
  }, [currentUser, conversationId]);

  // ── 3. Load messages + subscribe to realtime
  useEffect(() => {
    if (!conversationId) return;

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });

    const channel = supabase
      .channel(`popup:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  // ── 4. Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 5. Send message
  async function handleSend() {
    const trimmed = newMessage.trim();
    if (!trimmed || !currentUser || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: trimmed,
    });
    if (!error) setNewMessage("");
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      {/* Dark overlay behind popup */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Popup card */}
      <div style={styles.popup}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <p style={styles.headerName}>{otherUserName}</p>
            <p style={styles.headerListing}>Re: {listingName}</p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.inboxBtn} onClick={onOpenInbox} title="Open full inbox">
              ↗ Inbox
            </button>
            <button style={styles.closeBtn} onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Message list */}
        <div style={styles.messageList}>
          {messages.length === 0 && (
            <p style={styles.emptyText}>No messages yet — say hi!</p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} style={{ ...styles.messageRow, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                <div style={{
                  ...styles.bubble,
                  backgroundColor: isMine ? "#941b32" : "#fff",
                  color: isMine ? "#fff" : "#111",
                  borderBottomRightRadius: isMine ? 4 : 16,
                  borderBottomLeftRadius: isMine ? 16 : 4,
                }}>
                  <p style={styles.bubbleText}>{msg.content}</p>
                  <p style={{ ...styles.bubbleTime, color: isMine ? "rgba(255,255,255,0.7)" : "#999" }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={styles.inputBar}>
          <textarea
            style={styles.input}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, opacity: sending || !newMessage.trim() ? 0.5 : 1 }}
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
          >
            Send
          </button>
        </div>

      </div>
    </>
  );
}

const styles = {
  // Semi-transparent backdrop
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 200,
  },

  // Popup card — centered on screen
  popup: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 201,
    width: 420,
    maxWidth: "calc(100vw - 32px)",
    height: 520,
    maxHeight: "calc(100vh - 64px)",
    backgroundColor: "#fff5da",
    border: "1.5px solid #000",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Pally', sans-serif",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "#fffaec",
    borderBottom: "1.5px solid #000",
    flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  headerName: { margin: 0, fontSize: 15, fontWeight: 700, color: "#111" },
  headerListing: { margin: "2px 0 0", fontSize: 11, color: "#888" },
  headerActions: { display: "flex", alignItems: "center", gap: 8 },
  inboxBtn: {
    background: "none",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    cursor: "pointer",
    fontFamily: "'Pally', sans-serif",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    color: "#555",
    cursor: "pointer",
    padding: "4px 6px",
    lineHeight: 1,
  },

  // Message list
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyText: { textAlign: "center", color: "#999", fontSize: 13, marginTop: 32 },
  messageRow: { display: "flex" },
  bubble: {
    maxWidth: "75%",
    padding: "8px 12px",
    borderRadius: 16,
    border: "1.5px solid #000",
  },
  bubbleText: { margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  bubbleTime: { margin: "3px 0 0", fontSize: 10, textAlign: "right" },

  // Input bar
  inputBar: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    backgroundColor: "#fffaec",
    borderTop: "1.5px solid #000",
    flexShrink: 0,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    fontSize: 13,
    border: "1.5px solid #000",
    borderRadius: 8,
    outline: "none",
    backgroundColor: "#fff",
    fontFamily: "'Pally', sans-serif",
    resize: "none",
    lineHeight: 1.5,
  },
  sendBtn: {
    padding: "8px 16px",
    backgroundColor: "#941b32",
    color: "#fff",
    border: "1.5px solid #000",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Pally', sans-serif",
    cursor: "pointer",
    flexShrink: 0,
  },
};
