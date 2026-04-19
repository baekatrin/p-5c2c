import { useState } from "react";
import { supabase } from "../supabaseClient";

const ALLOWED_DOMAINS = [
    "g.hmc.edu",
    "mymail.pomona.edu",
    "cmc.edu",
    "students.scrippscollege.edu",
    "students.pitzer.edu",
]

export default function LoginPrompt({ emailError }) {
    const [mode, setMode] = useState("signin"); // "signin" | "signup"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const validateDomain = (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        return ALLOWED_DOMAINS.includes(domain);
    };

    const handleSubmit = async () => {
        setMessage({ type: "", text: "" });

        if (!email || !password) {
            setMessage({ type: "error", text: "Please fill in all fields." });
            return;
        }

        if (!validateDomain(email)) {
            setMessage({ type: "error", text: "You must use a 5C student email to access this platform." });
            return;
        }

        if (mode === "signup") {
            if (password !== confirmPassword) {
                setMessage({ type: "error", text: "Passwords do not match." });
                return;
            }
            if (password.length < 6) {
                setMessage({ type: "error", text: "Password must be at least 6 characters." });
                return;
            }
        }

        setIsLoading(true);

        try {
            if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) setMessage({ type: "error", text: error.message });
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    setMessage({ type: "error", text: error.message });
                } else {
                    setMessage({ type: "success", text: "Account created! Check your email to confirm your account, then sign in." });
                    setMode("signin");
                    setPassword("");
                    setConfirmPassword("");
                }
            }
        } catch (err) {
            setMessage({ type: "error", text: "Something went wrong. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit();
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>5C2C Marketplace</h1>
                <p style={styles.subtitle}>For Claremont Colleges Students Only</p>

                {emailError && (
                    <p style={styles.errorBanner}>{emailError}</p>
                )}

                <div style={styles.tabRow}>
                    <button
                        onClick={() => { setMode("signin"); setMessage({ type: "", text: "" }); }}
                        style={{ ...styles.tab, ...(mode === "signin" ? styles.tabActive : {}) }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode("signup"); setMessage({ type: "", text: "" }); }}
                        style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }}
                    >
                        Sign Up
                    </button>
                </div>

                <input
                    type="email"
                    placeholder="your@g.hmc.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={styles.input}
                    disabled={isLoading}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={styles.input}
                    disabled={isLoading}
                />

                {mode === "signup" && (
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={styles.input}
                        disabled={isLoading}
                    />
                )}

                {message.text && (
                    <p style={{
                        ...styles.messageBanner,
                        backgroundColor: message.type === "error" ? "#fee2e2" : "#dcfce7",
                        color: message.type === "error" ? "#ef4444" : "#16a34a",
                    }}>
                        {message.text}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    style={styles.submitButton}
                >
                    {isLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                </button>

                <p style={styles.disclaimer}>
                    You must use your 5C student email to sign in.
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    card: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%",
    },
    title: {
        margin: "0 0 8px 0",
        fontSize: "28px",
        fontWeight: "600",
        color: "#1f2937",
    },
    subtitle: {
        margin: "0 0 24px 0",
        fontSize: "14px",
        color: "#6b7280",
    },
    tabRow: {
        display: "flex",
        marginBottom: "20px",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
    },
    tab: {
        flex: 1,
        padding: "10px",
        fontSize: "14px",
        fontWeight: "500",
        border: "none",
        backgroundColor: "transparent",
        cursor: "pointer",
        color: "#6b7280",
        transition: "all 0.15s",
    },
    tabActive: {
        backgroundColor: "#1f2937",
        color: "white",
    },
    input: {
        width: "100%",
        padding: "12px 14px",
        fontSize: "15px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        marginBottom: "12px",
        boxSizing: "border-box",
        outline: "none",
        transition: "border-color 0.15s",
    },
    submitButton: {
        width: "100%",
        padding: "12px 16px",
        fontSize: "16px",
        fontWeight: "500",
        backgroundColor: "#1f2937",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "4px",
        transition: "background-color 0.2s",
    },
    errorBanner: {
        color: "#ef4444",
        fontSize: "14px",
        marginBottom: "20px",
        padding: "12px",
        backgroundColor: "#fee2e2",
        borderRadius: "8px",
    },
    messageBanner: {
        fontSize: "14px",
        marginBottom: "12px",
        padding: "12px",
        borderRadius: "8px",
        textAlign: "left",
    },
    disclaimer: {
        marginTop: "20px",
        fontSize: "12px",
        color: "#9ca3af",
    },
};