/**
 * 5C2C — Homepage
 *
 * STRUCTURE OVERVIEW:
 * ┌─────────────────────────────────────┐
 * │  <HomePage />        (this file)    │
 * │  ├── <Navbar />      (top bar)      │
 * │  └── <ProductGrid /> (main content) │
 * │       └── <ProductCard /> × 8       │
 * └─────────────────────────────────────┘
 *
 * ROUTING NOTE:
 * We're using a simple `currentPage` state variable to simulate
 * navigation. When you're ready to use a real router (like
 * React Router), every `navigate("some-page")` call here maps
 * directly to a <Route path="some-page"> you'd add later.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo3.png";
import Card from "./card";


// ─── PLACEHOLDER PRODUCT DATA ──────────────────────────────────────────────
// In a real app, this would be fetched from a backend/database.
// Each product has a unique `id` used to navigate to its own page.
const PRODUCTS = [
  { id: 1, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100,  aspectRatio: "3/2" },
  { id: 2, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 150, aspectRatio: "1/2" },
  { id: 3, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, aspectRatio: "4/5" },
  { id: 4, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 200, aspectRatio: "2/3" },
  { id: 5, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, aspectRatio: "1/3" },
  { id: 6, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, aspectRatio: "3/2" },
  { id: 7, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 150, aspectRatio: "2/5" },
  { id: 8, name: "Listing Name", seller: "Shop Name", images: [], description: "A short description of this listing.", priceMin: 100, priceMax: 100, aspectRatio: "4/3" },
];

// ─── SVG ICONS ────────────────────────────────────────────────────────────
// Clean inline SVG icons so we don't need an icon library dependency.

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);


const InboxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);


// ─── NAVBAR COMPONENT ─────────────────────────────────────────────────────
/**
 * Navbar — sits at the top of every page.
 *
 * Props:
 *  navigate(pageName) — call this to switch pages.
 *                        pageName can be: "home", "createlisting",
 *                        "favorites", "checkout", "messages", "profile"
 */
function Navbar({ navigate }) {
  const [searchValue, setSearchValue] = useState("");

  function handleSearch(e) {
    // Prevent the page from refreshing when user hits Enter
    e.preventDefault();
    // TODO: wire this up to a real search results page
    console.log("Searching for:", searchValue);
  }

  return (
    <nav style={styles.navbar}>
      {/* ── LOGO ── clicking it returns you to the homepage */}
      <button
        style={styles.logo}
        onClick={() => navigate("home")}
        title="Go to homepage"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={logo} alt="5C2C logo" style={{ height: "40px", transform: "translateY(3px)" }} />
          <p style={{ margin: 0, fontSize: "11px", fontFamily: "'Pally', sans-serif", letterSpacing: "2px" }}>MARKETPLACE</p>
        </div>
      </button>

      {/* ── SEARCH BAR ── controlled input (React tracks every keystroke) */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search content"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </form>

      {/* ── CREATE LISTING BUTTON ── routes to the create listing page */}
      <button
        style={styles.createBtn}
        onClick={() => navigate("/createlisting")}
      >
        + Create Listing
      </button>

      {/* ── RIGHT-SIDE ICON CLUSTER ── */}
      <div style={styles.iconCluster}>

        {/* Favorites heart → favorites page */}
        <button style={styles.iconBtn} onClick={() => navigate("/favorites")} title="Favorites">
          <HeartIcon />
        </button>

        {/* Inbox → messages page */}
        <button style={styles.iconBtn} onClick={() => navigate("/messages")} title="Messages">
          <InboxIcon />
        </button>

        {/* User avatar → sign up / profile page */}
        <button style={styles.avatarBtn} onClick={() => navigate("/profile")} title="Profile">
          <div style={styles.avatarCircle}>
            <span style={styles.avatarInitials}>U</span>
          </div>
        </button>

      </div>
    </nav>
  );
}

// ─── PRODUCT GRID COMPONENT ───────────────────────────────────────────────
/**
 * ProductGrid — lays out all ProductCards in a responsive 4-column grid.
 */
function ProductGrid({ navigate }) {
  const columns = [[], [], [], []];
  PRODUCTS.forEach((product, index) => {
    columns[index % 4].push({ product, index });
  });

  return (
    <main style={styles.gridWrapper}>
      <div style={styles.grid}>
        {columns.map((col, colIndex) => (
          <div key={colIndex} style={styles.column}>
            {col.map(({ product }) => (
              <Card
                key={product.id}
                listing={product}
                onClick={() => navigate(`/product/${product.id}`)}
                aspectRatio={product.aspectRatio}
              />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

// ─── HOMEPAGE (ROOT COMPONENT) ────────────────────────────────────────────
/**
 * HomePage — the root component. Manages which "page" is currently visible.
 *
 * HOW NAVIGATION WORKS HERE:
 * We store the current page name in `currentPage` state.
 * The `navigate` function updates that state.
 * The bottom of this component decides what to render based on `currentPage`.
 *
 * When you add React Router later, you'd replace this with <Routes> / <Route>.
 */

// export default function HomePage() {
//   // `currentPage` starts as "home". It's a string like "favorites" or "product/3".
//   const [currentPage, setCurrentPage] = useState("home");

//   // This is the navigate function we pass to every child component
//   function navigate(pageName) {
//     setCurrentPage(pageName);
//     // Scroll back to top whenever you navigate
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }
export default function HomePage() {   // ← also capitalize: HomePage not homepage
  const navigateTo = useNavigate();

  function navigate(path) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigateTo(path);
  }

  return (
    <div style={styles.appShell}>
      <Navbar navigate={navigate} />
      <ProductGrid navigate={navigate} />
    </div>
  );
}

//   // ── Decide what main content to show ──
//   let mainContent;

//   if (currentPage === "home") {
//     mainContent = <ProductGrid navigate={navigate} />;
//   } else if (currentPage.startsWith("product/")) {
//     // Product detail page — extract the ID from "product/3" → "3"
//     const productId = currentPage.split("/")[1];
//     mainContent = <PlaceholderPage pageName={`Product Page (ID: ${productId})`} navigate={navigate} />;
//   } else {
//     // All other pages (favorites, checkout, messages, profile, createlisting)
//     const pageLabels = {
//       "createlisting": "Create Listing Page",
//       "favorites":      "Favorites Page",
//       "checkout":       "Checkout Page",
//       "messages":       "Messages Page",
//       "profile":        "Profile Page",
//     };
//     const label = pageLabels[currentPage] || currentPage;
//     mainContent = <PlaceholderPage pageName={label} navigate={navigate} />;
//   }

//   return (
//     <div style={styles.appShell}>
//       {/* Navbar always visible at the top */}
//       <Navbar navigate={navigate} />

//       {/* Main content area switches based on currentPage */}
//       {mainContent}
//     </div>
//   );
// }

// ─── STYLES ───────────────────────────────────────────────────────────────
/**
 * All styles live here as a plain JS object.
 * This is called "inline styles" in React — no separate CSS file needed.
 * Each key (e.g. `navbar`) maps to a style object you apply with style={styles.navbar}.
 */
const styles = {
  // ── App shell
  appShell: {
    minHeight: "100vh",
    backgroundColor: "#fff5da",
    fontFamily: "'Pally', sans-serif",
  },

  // ── Navbar
  navbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 28px",
    backgroundColor: "#fffaec",
    borderBottom: "1px solid #000000",
    position: "sticky",           // Stays at top when scrolling
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "-1px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#111",
    padding: "0 8px 0 0",
    flexShrink: 0,
  },
  searchForm: {
    flex: 1,                       // Takes up all remaining space between logo and buttons
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#fafafa",
    boxSizing: "border-box",
  },
  createBtn: {
    padding: "10px 20px",
    backgroundColor: "#941b32",
    color: "#fff",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  signUpBtn: {
    padding: "10px 20px",
    backgroundColor: "#f39836",
    color: "#fff",
    border: "1.5px solid #000000",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  iconCluster: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    color: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  avatarBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    marginLeft: "4px",
  },
  avatarCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitials: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#555",
  },

  // ── Product Grid
  gridWrapper: {
    padding: "28px 32px",
  },
  grid: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    flex: 1,
  },

  // ── Product Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e8e8e8",
    overflow: "hidden",
    cursor: "pointer",
    transition: "box-shadow 0.2s, transform 0.2s",
  },
  cardImage: {
    width: "100%",
    aspectRatio: "4/5",            // Tall portrait ratio like your mockup
    backgroundColor: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    padding: "12px 14px 14px",
  },
  cardName: {
    margin: "0 0 4px",
    fontSize: "14px",
    color: "#333",
    fontWeight: "500",
  },
  cardPrice: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#111",
  },

  // ── Placeholder page
  placeholderPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px",
    textAlign: "center",
    padding: "40px",
  },
  placeholderTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#111",
    margin: 0,
  },
  placeholderText: {
    fontSize: "16px",
    color: "#777",
    margin: 0,
  },
};