import { useState } from "react";
import { supabase } from "../supabaseClient";

// Claremont colleges domain names for students 
const ALLOWED_DOMAINS = [
    "g.hmc.edu", 
    "mymail.pomona.edu",
    "cmc.edu",
    "students.scrippscollege.edu", 
    "students.pitzer.edu",
]

export default function LoginPrompt({ emailError }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/',
                }
            });

            if (error) {
                setMessage({ type: "error", text: error.message });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed to sign in with Google" });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>5C2C Marketplace</h1>
                <p style={styles.subtitle}>For Claremont Colleges Students Only</p>

                {emailError && (
                    <p style={{
                        color: "#ef4444",
                        fontSize: "14px",
                        marginBottom: "20px",
                        padding: "12px",
                        backgroundColor: "#fee2e2",
                        borderRadius: "8px",
                    }}>
                        {emailError}
                    </p>
                )}

                <button 
                    onClick={handleGoogleSignIn} 
                    disabled={isLoading}
                    style={styles.googleButton}
                >
                    {isLoading ? "Signing in..." : "Sign in with Google"}
                </button>

                {message.text && (
                    <p style={{
                        color: message.type === "error" ? "#ef4444" : "#22c55e",
                        marginTop: "16px",
                        fontSize: "14px"
                    }}>
                        {message.text}
                    </p>
                )}

                <p style={styles.disclaimer}>
                    You must use your 5C student email to sign in.
                </p>
            </div>
        </div>
    )
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
        margin: "0 0 32px 0",
        fontSize: "14px",
        color: "#6b7280",
    },
    googleButton: {
        width: "100%",
        padding: "12px 16px",
        fontSize: "16px",
        fontWeight: "500",
        backgroundColor: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s",
    },
    disclaimer: {
        marginTop: "24px",
        fontSize: "12px",
        color: "#9ca3af",
    }
}


