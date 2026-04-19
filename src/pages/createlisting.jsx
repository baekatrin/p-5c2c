import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const CATEGORIES = [
  { id: "beauty", label: "Beauty & Cosmetics" },
  { id: "art", label: "Art & Design" },
  { id: "clothing", label: "Clothing & Alterations" },
  { id: "rides", label: "Rides & Transport" },
  { id: "cooking", label: "Cooking & Baked Goods" },
  { id: "tutoring", label: "Tutoring" },
  { id: "other", label: "Other" },
];

const CATEGORY_PLACEHOLDERS = {
  beauty: `Help clients understand exactly what you offer and what to expect!\n\n• What services do you provide? (e.g. nails, makeup, hair styling, henna, skincare, lash extensions, brows)\n• How many years of experience do you have, and are you self-taught or formally trained?\n• What's your specialty or signature style — what do you do best?\n• Where are sessions held? (your dorm, client's room, a common space on campus?)\n• How long does a typical appointment take?\n• Do you supply your own products, or should clients bring anything?\n• Are there any styles, techniques, or requests you don't take on?`,

  art: `Give potential clients a clear picture of your work and process!\n\n• What do you create? (e.g. portraits, character art, logos, posters, digital illustration, music production, photography)\n• What's your medium and style — how would you describe your aesthetic?\n• How long have you been doing this, and do you have any formal training or notable projects?\n• What's your typical turnaround time for a standard commission?\n• How many rounds of revisions do you include, and what's your process for feedback?\n• What details do you need from a client to get started? (references, color palette, dimensions, etc.)\n• Are there any subjects, styles, or content types you don't take on?`,

  clothing: `Tell clients what you can make or alter, and how the process works!\n\n• What services do you offer? (e.g. hemming, tailoring, custom pieces, thrift flips, embroidery, patchwork)\n• How long have you been sewing or doing alterations? Any formal training?\n• What fabrics or garment types do you work best with?\n• What's your turnaround time for a typical piece?\n• Where do fittings or drop-offs happen — do you meet on campus, or is there another arrangement?\n• Do you source your own materials, or should clients provide fabric?\n• Any styles or garment types you don't work with?`,

  rides: `Let students know where you can take them and how it works!\n\n• What routes or destinations do you cover? (e.g. Ontario Airport, LAX, Costco, Target, In-N-Out, hiking spots)\n• Which campus are you based at, and what areas nearby are you comfortable driving to?\n• How many passengers can your car fit?\n• Do you charge per trip, per person, or per mile — and how do you handle split fares?\n• When are you generally available? (weekends only, weekday evenings, flexible?)\n• How much advance notice do you need for a booking?\n• Any restrictions on luggage, large items, or number of stops?`,

  cooking: `Tell people what you make and how to place an order!\n\n• What do you cook or bake? (e.g. custom cakes, cookies, cultural dishes, weekly meal prep, snacks)\n• How long have you been cooking or baking, and what are you known for?\n• Do you take fully custom orders, or do you offer a set menu — or both?\n• How far in advance do you need an order placed?\n• Where is pickup located — your dorm, dining hall, somewhere else on campus?\n• Do you offer delivery, and if so, where and for what extra charge?\n• What dietary needs can you accommodate? (vegan, gluten-free, nut-free, halal, kosher, etc.)\n• What's your typical order size, and do you have a minimum order amount?`,

  tutoring: `Help students figure out if you're the right fit before they reach out!\n\n• What subjects, courses, or exams do you tutor? (be specific — e.g. Chem 24, Multivariable Calc, CS 5, LSAT prep)\n• What school are you at, what year, and what's your major?\n• What's your background in these subjects — grades, coursework, research, or work experience?\n• How long are your sessions, and do you offer one-time help or ongoing support?\n• Do you prefer one-on-one or small groups?\n• Where do sessions take place — a library, your room, a study space, or online?\n• What's your teaching style? Do you work through problem sets, explain concepts, review notes, etc.?`,

  other: `Describe your service so students know exactly what they're getting!\n\n• What are you offering, and who is it most useful for?\n• How long have you been doing this, and what's your relevant background or experience?\n• What does a typical session or order look like from start to finish?\n• Where does this service take place, or is there a pickup/meetup location?\n• How much time does it take, and how far in advance should someone book?\n• What do clients need to bring, prepare, or know ahead of time?\n• Anything you don't offer or situations you can't accommodate?`,
};

const PRICING_TIERS = {
  beauty: ["Base Service", "Add-ons / Extra Designs"],
  art: ["Base Commission", "Detailed / Complex Piece"],
  clothing: ["Simple Alteration", "Custom / Complex Piece"],
  rides: ["Base Trip", "Long Distance"],
  cooking: ["Small Order", "Large / Custom Order"],
  tutoring: ["Per Hour", "Package (multiple sessions)"],
  other: ["Base Price", "Premium / Custom"],
};

export default function CreateListing() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descFocused, setDescFocused] = useState(false);
  const [basePrice, setBasePrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricingNote, setPricingNote] = useState("");
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const placeholder =
    category && CATEGORY_PLACEHOLDERS[category]
      ? CATEGORY_PLACEHOLDERS[category]
      : "Select a category above to get writing prompts tailored to your service...";

  const pricingTiers =
    category && PRICING_TIERS[category]
      ? PRICING_TIERS[category]
      : ["Base Price", "Max / Complex Price"];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...previews].slice(0, 6));
    setImageFiles((prev) => [...prev, ...files].slice(0, 6));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    // Upload images to Supabase Storage
    const imageUrls = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file);
      if (uploadError) {
        setError("Image upload failed: " + uploadError.message);
        setPublishing(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);
      imageUrls.push(publicUrl);
    }

    // Insert listing into database
    const { error: insertError } = await supabase.from("listings").insert({
      seller_id: user.id,
      title,
      description,
      category,
      price_min: parseFloat(basePrice),
      price_max: maxPrice ? parseFloat(maxPrice) : null,
      pricing_note: pricingNote || null,
      images: imageUrls,
    });

    if (insertError) {
      setError("Failed to publish: " + insertError.message);
      setPublishing(false);
      return;
    }

    navigate("/");
  };


  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>5C2C</span>
          <span style={styles.headerDivider}>|</span>
          <span style={styles.headerTitle}>Create a Listing</span>
        </div>
      </div>

      <form onSubmit={handlePublish} style={styles.form}>

        {/* Step 1: Category */}
        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>01</span>
            <span>Choose a category</span>
          </div>
          <div style={styles.selectWrapper}>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setDescription("");
                setDescFocused(false);
              }}
              style={styles.select}
              required
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <span style={styles.selectArrow}>▾</span>
          </div>
        </section>

        {/* Step 2: Title */}
        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>02</span>
            <span>Name your listing</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder=""
            style={styles.input}
            maxLength={80}
            required
          />
          <span style={styles.charCount}>{title.length} / 80</span>
        </section>

        {/* Step 3: Description */}
        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>03</span>
            <span>Describe your service</span>
          </div>
          <div style={styles.descWrapper}>
            {/* Ghost placeholder shown when unfocused and empty */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setDescFocused(true)}
              onBlur={() => {
                if (description === "") setDescFocused(false);
              }}
              placeholder=""
              style={{
                ...styles.textarea,
                ...(descFocused || description ? styles.textareaFocused : {}),
                backgroundColor: "transparent",
                position: "relative",
                zIndex: 2,
              }}
              rows={9}
              required
            />
            {!descFocused && description === "" && (
              <div
                style={styles.placeholderOverlay}
                onClick={() => {
                  setDescFocused(true);
                  document.querySelector("textarea").focus();
                }}
              >
                {placeholder.split("\n").map((line, i) => {
                  if (line.startsWith("•"))
                    return <p key={i} style={styles.placeholderBullet}>{line}</p>;
                  if (i === 0)
                    return <p key={i} style={styles.placeholderHeading}>{line}</p>;
                  if (line === "") return <br key={i} />;
                  return <p key={i} style={styles.placeholderLine}>{line}</p>;
                })}
              </div>
            )}
          </div>
        </section>

        {/* Step 4: Photos */}
        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>04</span>
            <span>
              Add photos{" "}
              <span style={styles.optional}>(optional · up to 6)</span>
            </span>
          </div>
          <div style={styles.imageGrid}>
            {images.map((img, i) => (
              <div key={i} style={styles.imageThumb}>
                <img src={img.url} alt={img.name} style={styles.thumbImg} />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={styles.removeImg}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={styles.uploadBtn}
              >
                <span style={styles.uploadIcon}>+</span>
                <span style={styles.uploadText}>Upload</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </section>

        {/* Step 5: Pricing */}
        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>05</span>
            <span>Set your pricing</span>
          </div>
          <div style={styles.pricingRow}>
            <div style={styles.priceField}>
              <label style={styles.priceLabel}>{pricingTiers[0]}</label>
              <div style={styles.priceInputWrap}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  style={styles.priceInput}
                  required
                />
              </div>
            </div>
            <div style={styles.priceDivider}>—</div>
            <div style={styles.priceField}>
              <label style={styles.priceLabel}>{pricingTiers[1]} <span style={styles.optional}>— optional</span></label>
              <div style={styles.priceInputWrap}>
                <span style={styles.dollarSign}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="0.00"
                  style={styles.priceInput}
                />
              </div>
            </div>
          </div>
          <textarea
            value={pricingNote}
            onChange={(e) => setPricingNote(e.target.value)}
            placeholder="Any pricing notes? e.g. 'Price varies with complexity, # of colors, or customization. DM for a custom quote!'"
            style={{ ...styles.textarea, marginTop: "12px", minHeight: "72px" }}
            rows={3}
          />
        </section>

        {/* Publish */}
        <div style={styles.publishRow}>
          {error && <p style={{ color: "red", margin: 0, fontSize: "14px" }}>{error}</p>}
          <button
            type="submit"
            style={{
              ...styles.publishBtn,
              ...(!category || !title || !description || !basePrice || publishing
                ? styles.publishBtnDisabled
                : {}),
            }}
            disabled={!category || !title || !description || !basePrice || publishing}
          >
            {publishing ? "Publishing..." : "Publish Listing →"}
          </button>
          {(!category || !title || !description || !basePrice) && (
            <p style={styles.publishHint}>
              Fill in category, title, description, and base price to publish.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

const styles = {

  // ── Page shell — warm cream background from --color-bg
  page: {
    minHeight: "100vh",
    backgroundColor: "#fff5da",       // --color-bg
    color: "#111111",                  // --color-text
    fontFamily: "Arial, sans-serif",   // --font-body
    paddingBottom: "80px",
  },

  // ── Sticky header — surface color, black border like your global border style
  header: {
    backgroundColor: "#fffaec",        // --color-surface
    borderBottom: "1.5px solid #000000", // --color-border
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  
  headerInner: {
    maxWidth: "680px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    height: "60px",
  },

  // Logo uses Pally bold + crimson, matches your global nav style
  logoBtn: {
    fontFamily: "'Pally', sans-serif",  // --font-display
    fontWeight: "700",
    fontSize: "17px",
    letterSpacing: "-0.5px",
    color: "#941b32",                   // --color-primary
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  headerDivider: {
    color: "#555555",                   // --color-text-muted
    fontSize: "16px",
  },
  headerTitle: {
    fontFamily: "Arial, sans-serif",    // --font-body
    fontSize: "14px",
    color: "#555555",                   // --color-text-muted
    fontWeight: "400",
  },

  // ── Form container
  form: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "44px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "52px",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  // Step label — Pally font for the heading, crimson badge
  stepLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "17px",
    fontWeight: "700",
    fontFamily: "'Pally', sans-serif",  // --font-display
    color: "#111111",                   // --color-text
    letterSpacing: "-0.2px",
  },

  // Step number badge — crimson bg + cream text, matches --color-primary
  stepNum: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#ffffff",
    backgroundColor: "#941b32",         // --color-primary
    borderRadius: "5px",
    padding: "3px 7px",
    letterSpacing: "0.5px",
    fontFamily: "monospace",
  },

  optional: {
    fontSize: "13px",
    fontWeight: "400",
    color: "#555555",                   // --color-text-muted
    fontFamily: "Arial, sans-serif",    // --font-body
  },

  // ── Select dropdown — black border like global --color-border
  selectWrapper: {
    position: "relative",
    display: "inline-block",
    width: "100%",
  },
  select: {
    width: "100%",
    padding: "13px 40px 13px 16px",
    border: "1.5px solid #000000",      // --color-border
    borderRadius: "8px",                // matches global button border-radius
    fontSize: "0.95rem",                // matches global p/input font-size
    fontFamily: "Arial, sans-serif",    // --font-body
    backgroundColor: "#fffaec",         // --color-surface
    color: "#111111",                   // --color-text
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  selectArrow: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#555555",                   // --color-text-muted
    pointerEvents: "none",
  },

  // ── Text input — matches global input styling
  input: {
    width: "100%",
    padding: "13px 16px",
    border: "1.5px solid #000000",      // --color-border
    borderRadius: "8px",
    fontSize: "0.95rem",                // matches global input font-size
    fontFamily: "Arial, sans-serif",    // --font-body
    backgroundColor: "#fffaec",         // --color-surface
    outline: "none",
    boxSizing: "border-box",
    color: "#111111",                   // --color-text
    transition: "border-color 0.15s",
  },
  charCount: {
    fontSize: "12px",
    color: "#555555",                   // --color-text-muted
    textAlign: "right",
    marginTop: "-8px",
    fontFamily: "Arial, sans-serif",
  },

  // ── Description textarea
  descWrapper: {
    position: "relative",
  },
  placeholderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: "14px 16px",
    pointerEvents: "all",
    cursor: "text",
    zIndex: 1,
    backgroundColor: "#fffaec",         // --color-surface
    borderRadius: "8px",
    border: "1.5px solid #000000",      // --color-border
    overflowY: "auto",
    boxSizing: "border-box",
  },
  placeholderHeading: {
    margin: "0 0 10px 0",
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#555555",                   // --color-text-muted
    lineHeight: "1.4",
    fontFamily: "Arial, sans-serif",
  },
  placeholderBullet: {
    margin: "3px 0",
    fontSize: "13px",
    color: "#888888",
    lineHeight: "1.65",
    fontFamily: "Arial, sans-serif",
  },
  placeholderLine: {
    margin: "2px 0",
    fontSize: "13px",
    color: "#aaaaaa",
    fontFamily: "Arial, sans-serif",
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    border: "1.5px solid #000000",      // --color-border
    borderRadius: "8px",
    fontSize: "0.95rem",                // matches global textarea font-size
    fontFamily: "Arial, sans-serif",    // --font-body
    backgroundColor: "#fffaec",         // --color-surface
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    lineHeight: "1.65",
    minHeight: "200px",
    transition: "border-color 0.15s",
    position: "relative",
    zIndex: 2,
    color: "#111111",                   // --color-text
  },

  // On focus, border turns crimson — uses --color-primary
  textareaFocused: {
    borderColor: "#941b32",             // --color-primary
  },

  // ── Image upload grid
  imageGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  imageThumb: {
    position: "relative",
    width: "92px",
    height: "92px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1.5px solid #000000",      // --color-border
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  removeImg: {
    position: "absolute",
    top: "5px",
    right: "5px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#941b32",         // --color-primary
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    lineHeight: 1,
    padding: 0,
    zIndex: 2,
    fontFamily: "Arial, sans-serif",
  },

  // Upload button — dashed black border, cream bg, Pally font via global button styles
  uploadBtn: {
    width: "92px",
    height: "92px",
    borderRadius: "8px",
    border: "1.5px dashed #000000",     // --color-border dashed
    backgroundColor: "#fffaec",         // --color-surface
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontFamily: "'Pally', sans-serif",  // --font-display (global button font)
    transition: "opacity 0.15s",
  },
  uploadIcon: {
    fontSize: "24px",
    color: "#555555",                   // --color-text-muted
    lineHeight: 1,
  },
  uploadText: {
    fontSize: "11px",
    color: "#555555",                   // --color-text-muted
    fontWeight: "600",
    fontFamily: "'Pally', sans-serif",
  },

  // ── Pricing
  pricingRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
  },
  priceField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  priceLabel: {
    fontSize: "11px",
    fontWeight: "700",
    fontFamily: "'Pally', sans-serif",  // --font-display for labels
    color: "#555555",                   // --color-text-muted
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  priceInputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #000000",      // --color-border
    borderRadius: "8px",
    backgroundColor: "#fffaec",         // --color-surface
    overflow: "hidden",
    paddingLeft: "13px",
  },
  dollarSign: {
    fontSize: "14px",
    color: "#555555",                   // --color-text-muted
    fontWeight: "600",
    userSelect: "none",
    fontFamily: "Arial, sans-serif",
  },
  priceInput: {
    flex: 1,
    padding: "12px 12px",
    border: "none",
    outline: "none",
    fontSize: "0.95rem",
    fontFamily: "Arial, sans-serif",    // --font-body
    backgroundColor: "transparent",
    color: "#111111",                   // --color-text
    minWidth: 0,
  },
  priceDivider: {
    paddingBottom: "13px",
    color: "#555555",                   // --color-text-muted
    fontSize: "18px",
    fontWeight: "300",
    flexShrink: 0,
  },

  // ── Publish
  publishRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "10px",
    paddingTop: "4px",
  },

  // Publish button — matches global button: Pally, black border, rounded
  // Active state: crimson bg + white text (--color-primary)
  publishBtn: {
    fontFamily: "'Pally', sans-serif",  // --font-display (global button font)
    fontSize: "1rem",
    fontWeight: "700",
    backgroundColor: "#941b32",         // --color-primary
    color: "#ffffff",
    border: "1.5px solid #000000",      // --color-border
    borderRadius: "8px",                // global button border-radius
    padding: "16px 44px",
    cursor: "pointer",
    letterSpacing: "-0.2px",
    transition: "opacity 0.15s",
  },

  // Disabled state — muted, matches --color-text-muted tone
  publishBtnDisabled: {
    backgroundColor: "#cccccc",
    color: "#888888",
    borderColor: "#cccccc",
    cursor: "not-allowed",
  },
  publishHint: {
    fontSize: "13px",
    color: "#555555",                   // --color-text-muted
    margin: 0,
    fontFamily: "Arial, sans-serif",    // --font-body
  },
};
