import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ProfileSetup({ onProfileCreated }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("User")
      .insert({ id: user.id, email: user.email, username, firstName, lastName, bio, school });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      if (onProfileCreated) await onProfileCreated();
      navigate("/");
    }
    setIsLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>5C2C</span>
          <span style={styles.divider}>|</span>
          <span style={styles.headerTitle}>Set Up Your Profile</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>01</span><span>Username</span></div>
          <input
            type="text"
            placeholder="e.g. clairepaints"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
        </section>

        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>02</span><span>Your name</span></div>
          <div style={styles.nameRow}>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={styles.input}
            />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>03</span><span>School</span></div>
          <div style={styles.selectWrapper}>
            <select value={school} onChange={(e) => setSchool(e.target.value)} style={styles.select} required>
              <option value="">Select your school</option>
              <option value="Harvey Mudd">Harvey Mudd</option>
              <option value="Pomona">Pomona</option>
              <option value="CMC">CMC</option>
              <option value="Scripps">Scripps</option>
              <option value="Pitzer">Pitzer</option>
            </select>
            <span style={styles.selectArrow}>▾</span>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>04</span>
            <span>Bio <span style={styles.optional}>(optional)</span></span>
          </div>
          <textarea
            placeholder="Tell the community a bit about yourself — what you sell, your skills, your campus..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={styles.textarea}
            rows={5}
          />
        </section>

        {message.text && (
          <p style={{ color: message.type === "error" ? "#ef4444" : "#22c55e", fontSize: 14, margin: 0 }}>
            {message.text}
          </p>
        )}

        <div style={styles.submitRow}>
          <button
            type="submit"
            disabled={isLoading}
            style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}
          >
            {isLoading ? "Saving..." : "Complete Setup →"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "var(--color-bg)",
    fontFamily: "var(--font-body)",
    paddingBottom: 80,
  },
  header: {
    backgroundColor: "var(--color-surface)",
    borderBottom: "1.5px solid var(--color-border)",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 680,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
    height: 60,
  },
  logo: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: 17,
    color: "var(--color-primary)",
  },
  divider: { color: "#ddd", fontSize: 16 },
  headerTitle: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "#999",
    fontWeight: 500,
  },
  form: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "44px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 44,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stepLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 17,
    fontWeight: 700,
    fontFamily: "var(--font-display)",
    color: "var(--color-text)",
  },
  stepNum: {
    fontSize: 10,
    fontWeight: 700,
    color: "var(--color-primary)",
    backgroundColor: "#fde8eb",
    borderRadius: 5,
    padding: "3px 7px",
    letterSpacing: "0.5px",
    fontFamily: "monospace",
  },
  optional: {
    fontSize: 13,
    fontWeight: 400,
    color: "#bbb",
    fontFamily: "var(--font-body)",
  },
  nameRow: {
    display: "flex",
    gap: 12,
  },
  input: {
    flex: 1,
    width: "100%",
    padding: "13px 16px",
    border: "1.5px solid var(--color-border)",
    borderRadius: 11,
    fontSize: 15,
    fontFamily: "var(--font-body)",
    backgroundColor: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
    color: "var(--color-text)",
  },
  selectWrapper: {
    position: "relative",
    width: "100%",
  },
  select: {
    width: "100%",
    padding: "13px 40px 13px 16px",
    border: "1.5px solid var(--color-border)",
    borderRadius: 11,
    fontSize: 15,
    fontFamily: "var(--font-body)",
    backgroundColor: "#ffffff",
    color: "var(--color-text)",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  selectArrow: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    color: "#999",
    pointerEvents: "none",
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    border: "1.5px solid var(--color-border)",
    borderRadius: 11,
    fontSize: 14,
    fontFamily: "var(--font-body)",
    backgroundColor: "#ffffff",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    lineHeight: "1.65",
    minHeight: 120,
    color: "var(--color-text)",
  },
  submitRow: {
    display: "flex",
    alignItems: "center",
  },
  submitBtn: {
    padding: "14px 44px",
    backgroundColor: "var(--color-primary)",
    color: "#fff",
    border: "1.5px solid var(--color-border)",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "var(--font-display)",
    cursor: "pointer",
  },
  submitBtnDisabled: {
    backgroundColor: "#ccc",
    borderColor: "#ccc",
    cursor: "not-allowed",
  },
};
