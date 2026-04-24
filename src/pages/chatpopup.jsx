import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

/**
 * ChatPopup — floating chat modal shown over listing page.
 */
export default function ChatPopup({
  conversationId,
  listingName,
  onClose,
  onOpenInbox,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUserName, setOtherUserName] = useState("Seller");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // ── 1. current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // ── 2. load other user name
  useEffect(() => {
    if (!currentUser || !conversationId || conversationId === "demo") return;

    async function loadOtherUser() {
      const { data: convo } = await supabase
        .from("conversations")
        .select("buyer_id, seller_id")
        .eq("id", conversationId)
        .single();

      if (!convo) return;

      const otherId =
        currentUser.id === convo.buyer_id
          ? convo.seller_id
          : convo.buyer_id;

      const { data: otherUser } = await supabase
        .from("User")
        .select("username")
        .eq("id", otherId)
        .single();

      if (otherUser?.username) {
        setOtherUserName(otherUser.username);
      }
    }

    loadOtherUser();
  }, [currentUser, conversationId]);

  // ── 3. load messages + realtime
  useEffect(() => {
    if (!conversationId || conversationId === "demo") {
      setMessages([]);
      return;
    }

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    const channel = supabase
      .channel(`popup:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  // ── 4. auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 5. send message
  async function handleSend() {
    const text = newMessage.trim();
    if (!text || !currentUser || sending) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: text,
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
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* popup */}
      <div style={styles.popup}>
        {/* header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <p style={styles.headerName}>{otherUserName}</p>
            <p style={styles.headerListing}>Re: {listingName}</p>
          </div>

          <div style={styles.headerActions}>
            <button style={styles.inboxBtn} onClick={onOpenInbox}>
              ↗ Inbox
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* messages */}
        <div style={styles.messageList}>
          {messages.length === 0 && (
            <p style={styles.emptyText}>No messages yet — say hi!</p>
          )}

          {messages.map((msg) => {
            const isMine =
              currentUser && msg.sender_id === currentUser.id;

            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    backgroundColor: isMine ? "#941b32" : "#fff",
                    color: isMine ? "#fff" : "#111",
                    borderBottomRightRadius: isMine ? 4 : 16,
                    borderBottomLeftRadius: isMine ? 16 : 4,
                  }}
                >
                  <p style={styles.bubbleText}>{msg.content}</p>
                  <p
                    style={{
                      ...styles.bubbleTime,
                      color: isMine
                        ? "rgba(255,255,255,0.7)"
                        : "#999",
                    }}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* input */}
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
            style={{
              ...styles.sendBtn,
              opacity: sending || !newMessage.trim() ? 0.5 : 1,
            }}
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

/* ───────────────── styles ───────────────── */

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 200,
  },

  popup: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 201,
    width: 420,
    height: 520,
    backgroundColor: "#fff5da",
    border: "1.5px solid #000",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Pally', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "#fffaec",
    borderBottom: "1.5px solid #000",
  },

  headerInfo: { flex: 1 },
  headerName: { margin: 0, fontWeight: 700 },
  headerListing: { margin: 0, fontSize: 11, color: "#888" },

  headerActions: { display: "flex", gap: 8 },
  inboxBtn: {
    border: "1px solid #ccc",
    background: "none",
    fontSize: 12,
    padding: "4px 10px",
    cursor: "pointer",
  },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: 16,
    cursor: "pointer",
  },

  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: 14,
  },

  emptyText: {
    textAlign: "center",
    color: "#999",
  },

  messageRow: {
    display: "flex",
    marginBottom: 8,
  },

  bubble: {
    maxWidth: "75%",
    padding: "8px 12px",
    borderRadius: 16,
    border: "1.5px solid #000",
  },

  bubbleText: { margin: 0, fontSize: 13 },

  bubbleTime: { fontSize: 10, textAlign: "right" },

  inputBar: {
    display: "flex",
    gap: 8,
    padding: 10,
    borderTop: "1.5px solid #000",
    backgroundColor: "#fffaec",
  },

  input: {
    flex: 1,
    padding: 8,
    border: "1.5px solid #000",
    borderRadius: 8,
    resize: "none",
  },

  sendBtn: {
    padding: "8px 14px",
    backgroundColor: "#941b32",
    color: "#fff",
    border: "1.5px solid #000",
    borderRadius: 8,
    cursor: "pointer",
  },
};