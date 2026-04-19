import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import catImage from "../assets/cat.png";

//random placeholders before we get images for these decorative listings 
const LISTINGS = [
    { name: "Hannah's Henna!",          price: "15",     img: "/images/henna.jpg" },
    { name: "Sarah's Shoe Shop",        price: "50-200", img: "/images/shoes.jpg" },
    { name: "Scripps Vintage Finds",    price: "20",     img: "/images/vintage.jpg" },
    { name: "Tanner Tattoo services",   price: "75-200", img: "/images/tattoo.jpg" },
    { name: "Custom Stickers",          price: "5",      img: "/images/sticker.jpg" },
    { name: "Claremont Postcards",      price: "30",     img: "/images/postcard.jpg" },
    { name: "Caricature Drawings",      price: "90",     img: "/images/caricature.jpg" },
    { name: "Temporary Tattoos!",       price: "15",     img: "/images/temptattoo.jpg" },
    { name: "Art Commission for Pets!", price: "20",     img: "/images/petdrawing.jpg" },
    { name: "Harry's Haircuts",         price: "20-40",  img: "/images/haircut.jpg" },
];

const PlaceholderSvg = () => (
    <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="90" height="70" rx="4" stroke="#b8b2a8" strokeWidth="2" fill="none" />
        <path d="M5 55 L28 35 L50 50 L70 30 L95 55" stroke="#b8b2a8" strokeWidth="2" fill="none" />
        <circle cx="30" cy="24" r="8" stroke="#b8b2a8" strokeWidth="2" fill="none" />
    </svg>
);

function ListingCard({ item }) {
    return (
        <div style={styles.listingCard}>
            <div style={styles.listingImg}>
                {item.img ? (
                    <img src={item.img} alt={item.name} style={styles.listingImgTag} />
                ) : (
                    <PlaceholderSvg />
                )}
            </div>
            <div style={styles.listingInfo}>
                <span style={styles.listingName}>{item.name}</span>
                <span style={styles.listingPrice}>{item.price ? `$${item.price}` : ""}</span>
            </div>
        </div>
    );
}

export default function LandingPage() {
    const navigate = useNavigate();
    const trackRef = useRef(null);

    // Doubled list so the scroll animation loops seamlessly
    const doubledListings = [...LISTINGS, ...LISTINGS];

    // Match the animation-speed logic from the original HTML (5s per card)
    useEffect(() => {
        if (trackRef.current) {
            const baseDuration = 5;
            trackRef.current.style.animationDuration = `${LISTINGS.length * baseDuration}s`;
        }
    }, []);

    // Both buttons route to /login. Non-5C emails are blocked by
    // validateEmailDomain() in main.jsx, which surfaces emailError on LoginPrompt.
    const goToLogin = (e) => {
        e.preventDefault();
        navigate("/login");
    };

    return (
        <>
            {/* Scoped styles for animations, pseudo-elements, and hover effects that
                inline styles can't handle. Only the landing page uses these classes. */}
            <style>{landingPageStyles}</style>

            <div style={styles.page}>
                {/* ===== NAVBAR ===== */}
                <nav style={styles.nav}>
                    <a href="/" style={styles.logo} onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                        5C<span style={styles.logoAccent}>2</span>C
                    </a>
                </nav>

                {/* ===== MAIN ===== */}
                <main style={styles.main}>
                    {/* LEFT: passive decorative scroll */}
                    <div className="lp-left-panel" aria-hidden="true">
                        <div className="lp-scroll-track" ref={trackRef}>
                            {doubledListings.map((item, idx) => (
                                <ListingCard item={item} key={`${item.name}-${idx}`} />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: welcome + gate */}
                    <div style={styles.rightPanel}>
                        <div style={styles.welcomeContent}>
                            <img
                            src={catImage} alt="" style={styles.welcomeImage}
                            />
                            <h1 style={styles.welcomeTitle}>
                                Welcome to <em style={styles.welcomeTitleEm}>5C&#x2011;2C</em>
                            </h1>
                            <div style={styles.dividerLine} />
                            <p style={styles.question}>Are you a 5C student?</p>
                            <div style={styles.btnRow}>
                                <a
                                    href="/login"
                                    className="lp-btn lp-btn-yes"
                                    onClick={goToLogin}
                                >
                                    Yes!
                                </a>
                                <a
                                    href="/login"
                                    className="lp-btn lp-btn-no"
                                    onClick={goToLogin}
                                >
                                    No…
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f2ec",
        color: "#2a2520",
        fontFamily: "'Pally', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    nav: {
        height: "52px",
        background: "#ffffff",
        borderBottom: "1px solid #e0dbd0",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        flexShrink: 0,
    },
    logo: {
        fontSize: "22px",
        letterSpacing: "-0.5px",
        color: "#2a2520",
        textDecoration: "none",
        cursor: "pointer",
        userSelect: "none",
    },
    logoAccent: { color: "#c45e3e" },
    main: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
    },
    rightPanel: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 48px",
        position: "relative",
        overflow: "hidden",
    },
    welcomeContent: {
        textAlign: "center",
        maxWidth: "360px",
    welcomeImage: {               
        width: "100%",
        maxWidth: "280px",
        height: "auto",
        display: "block",
        margin: "0 auto 16px",
    },
    },
    welcomeTitle: {
        fontSize: "clamp(38px, 5vw, 56px)",
        lineHeight: 1.1,
        letterSpacing: "-1px",
        color: "#2a2520",
        marginBottom: "10px",
    },
    welcomeTitleEm: {
        color: "#c45e3e",
        fontStyle: "italic",
    },
    dividerLine: {
        width: "1px",
        height: "60px",
        background: "#d4cfc5",
        margin: "0 auto 32px",
    },
    question: {
        fontSize: "17px",
        fontWeight: 400,
        color: "#2a2520",
        marginBottom: "20px",
    },
    btnRow: {
        display: "flex",
        gap: "14px",
        justifyContent: "center",
    },
    listingCard: {
        background: "#ffffff",
        border: "1px solid #e0dbd0",
        borderRadius: "10px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    listingImg: {
        width: "100%",
        aspectRatio: "4/3",
        background: "#ede9e1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    listingImgTag: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    listingInfo: {
        padding: "10px 12px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "8px",
    },
    listingName: {
        fontSize: "13px",
        fontWeight: 400,
        color: "#2a2520",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    listingPrice: {
        fontSize: "13px",
        fontWeight: 500,
        color: "#c45e3e",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },
};

//  STYLES that need full CSS 

const landingPageStyles = `


    .lp-left-panel {
        width: 52%;
        overflow: hidden;
        position: relative;
        pointer-events: none;
        user-select: none;
        border-right: 1px solid #e0dbd0;
    }
    .lp-left-panel::before,
    .lp-left-panel::after {
        content: '';
        position: absolute;
        left: 0; right: 0;
        height: 80px;
        z-index: 2;
        pointer-events: none;
    }
    .lp-left-panel::before {
        top: 0;
        background: linear-gradient(to bottom, #f5f2ec, transparent);
    }
    .lp-left-panel::after {
        bottom: 0;
        background: linear-gradient(to top, #f5f2ec, transparent);
    }

    .lp-scroll-track {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 16px;
        animation: lp-scroll-up 60s linear infinite;
        will-change: transform;
    }

    @keyframes lp-scroll-up {
        from { transform: translateY(0); }
        to   { transform: translateY(-50%); }
    }

    .lp-left-panel svg {
        width: 40%;
        height: 40%;
        opacity: 0.25;
    }

    .lp-btn {
        font-family: 'Pally', sans-serif;
        font-size: 15px;
        font-weight: 500;
        padding: 12px 32px;
        border-radius: 999px;
        border: 1.5px solid #2a2520;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.18s, color 0.18s, transform 0.1s;
        min-width: 110px;
        background: transparent;
        color: #2a2520;
    }
    .lp-btn:hover {
        background: #2a2520;
        color: #f5f2ec;
    }
    .lp-btn:active { transform: scale(0.97); }

    .lp-btn-yes {
        background: #2a2520;
        color: #f5f2ec;
        border-color: #2a2520;
    }
    .lp-btn-yes:hover {
        background: #c45e3e;
        border-color: #c45e3e;
        color: #fff;
    }

    .lp-btn-no {
        background: transparent;
        color: #2a2520;
        border-color: #d4cfc5;
    }
    .lp-btn-no:hover {
        background: #2a2520;
        color: #f5f2ec;
        border-color: #2a2520;
    }
`;
