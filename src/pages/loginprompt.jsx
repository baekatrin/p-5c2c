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
    const [loadingProvider, setLoadingProvider] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleSignIn = async (provider) => {
        setLoadingProvider(provider);
        setMessage({ type: "", text: "" });

        try {
            const options = {
                redirectTo: window.location.origin + '/',
            };

            // Azure requires scopes to get the email back
            if (provider === 'azure') {
                options.scopes = 'email profile openid';
            }

            const { error } = await supabase.auth.signInWithOAuth({ provider, options });

            if (error) {
                setMessage({ type: "error", text: error.message });
            }
        } catch (err) {
            setMessage({ type: "error", text: `Failed to sign in with ${provider}` });
        } finally {
            setLoadingProvider(null);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>5C2C Marketplace</h1>
                <p style={styles.subtitle}>For Claremont Colleges Students Only</p>

                {emailError && (
                    <p style={styles.errorBanner}>{emailError}</p>
                )}

                <button
                    onClick={() => handleSignIn('google')}
                    disabled={loadingProvider !== null}
                    style={styles.providerButton}
                >
                    <GoogleIcon />
                    {loadingProvider === 'google' ? "Signing in..." : "Sign in with Google"}
                </button>

                <button
                    onClick={() => handleSignIn('azure')}
                    disabled={loadingProvider !== null}
                    style={styles.providerButton}
                >
                    <OutlookIcon />
                    {loadingProvider === 'azure' ? "Signing in..." : "Sign in with Outlook"}
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
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
    );
}

function OutlookIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18">
            <rect width="10" height="10" x="8" y="0" fill="#0078d4" rx="1"/>
            <rect width="4.5" height="4.5" x="8" y="0" fill="#50a8f0"/>
            <rect width="4.5" height="4.5" x="13.5" y="0" fill="#1a8fe3"/>
            <rect width="4.5" height="4.5" x="8" y="5.5" fill="#1a8fe3"/>
            <rect width="4.5" height="4.5" x="13.5" y="5.5" fill="#0078d4"/>
            <rect width="10.5" height="13" x="0" y="5" fill="#0078d4" rx="1.5"/>
            <ellipse cx="5.25" cy="11.5" rx="2.8" ry="3.5" fill="white"/>
        </svg>
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
        margin: "0 0 32px 0",
        fontSize: "14px",
        color: "#6b7280",
    },
    errorBanner: {
        color: "#ef4444",
        fontSize: "14px",
        marginBottom: "20px",
        padding: "12px",
        backgroundColor: "#fee2e2",
        borderRadius: "8px",
    },
    providerButton: {
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
        marginBottom: "12px",
    },
    disclaimer: {
        marginTop: "24px",
        fontSize: "12px",
        color: "#9ca3af",
    },
};


