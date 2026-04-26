import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const CATEGORIES = [
  { id: "beauty",   label: "Beauty & Cosmetics" },
  { id: "art",      label: "Art & Design" },
  { id: "clothing", label: "Clothing & Alterations" },
  { id: "rides",    label: "Rides & Transport" },
  { id: "cooking",  label: "Cooking & Baked Goods" },
  { id: "tutoring", label: "Tutoring" },
  { id: "other",    label: "Other" },
];

const PRICING_TIERS = {
  beauty: ["Base Service", "Add-ons / Extra Designs"],
  art: ["Base Commission", "Detailed / Complex Piece"],
  clothing: ["Simple Alteration", "Custom / Complex Piece"],
  rides: ["Base Trip", "Long Distance"],
  cooking: ["Small Order", "Large / Custom Order"],
  tutoring: ["Per Hour", "Package (multiple sessions)"],
  other: ["Base Price", "Premium / Custom"],
};

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricingNote, setPricingNote] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pricingTiers = PRICING_TIERS[category] ?? ["Base Price", "Max / Complex Price"];

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: listing } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (!listing) { navigate("/"); return; }
      if (listing.seller_id !== user?.id) { navigate("/"); return; }

      setCategory(listing.category ?? "");
      setTitle(listing.title ?? "");
      setDescription(listing.description ?? "");
      setBasePrice(listing.price_min?.toString() ?? "");
      setMaxPrice(listing.price_max?.toString() ?? "");
      setPricingNote(listing.pricing_note ?? "");
      setExistingImages(listing.images ?? []);
      setLoading(false);
    }
    load();
  }, [id, navigate]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const total = existingImages.length + newImageFiles.length;
    const slots = Math.max(0, 6 - total);
    const toAdd = files.slice(0, slots);
    setNewImageFiles((prev) => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removeExisting = (index) => setExistingImages((prev) => prev.filter((_, i) => i !== index));
  const removeNew = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setSaving(false); return; }

    const uploadedUrls = [];
    for (const file of newImageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file);
      if (uploadError) { setError("Image upload failed: " + uploadError.message); setSaving(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(path);
      uploadedUrls.push(publicUrl);
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        category,
        title,
        description,
        price_min: parseFloat(basePrice),
        price_max: maxPrice ? parseFloat(maxPrice) : null,
        pricing_note: pricingNote || null,
        images: [...existingImages, ...uploadedUrls],
      })
      .eq("id", id);

    if (updateError) { setError("Failed to save: " + updateError.message); setSaving(false); return; }

    navigate(`/product/${id}`);
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;

  const totalImages = existingImages.length + newImagePreviews.length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>5C2C</span>
          <span style={styles.divider}>|</span>
          <span style={styles.headerTitle}>Edit Listing</span>
        </div>
      </div>

      <form onSubmit={handleSave} style={styles.form}>

        {/* Category */}
        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>01</span><span>Category</span></div>
          <div style={styles.selectWrapper}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select} required>
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
            <span style={styles.selectArrow}>▾</span>
          </div>
        </section>

        {/* Title */}
        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>02</span><span>Listing title</span></div>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} maxLength={80} required />
          <span style={styles.charCount}>{title.length} / 80</span>
        </section>

        {/* Description */}
        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>03</span><span>Description</span></div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={styles.textarea} rows={9} required />
        </section>

        {/* Photos */}
        <section style={styles.section}>
          <div style={styles.stepLabel}>
            <span style={styles.stepNum}>04</span>
            <span>Photos <span style={styles.optional}>(optional · up to 6)</span></span>
          </div>
          <div style={styles.imageGrid}>
            {existingImages.map((url, i) => (
              <div key={`e${i}`} style={styles.imageThumb}>
                <img src={url} alt="" style={styles.thumbImg} />
                <button type="button" onClick={() => removeExisting(i)} style={styles.removeImg}>×</button>
              </div>
            ))}
            {newImagePreviews.map((url, i) => (
              <div key={`n${i}`} style={styles.imageThumb}>
                <img src={url} alt="" style={styles.thumbImg} />
                <button type="button" onClick={() => removeNew(i)} style={styles.removeImg}>×</button>
              </div>
            ))}
            {totalImages < 6 && (
              <button type="button" onClick={() => fileInputRef.current.click()} style={styles.uploadBtn}>
                <span style={styles.uploadIcon}>+</span>
                <span style={styles.uploadText}>Upload</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
        </section>

        {/* Pricing */}
        <section style={styles.section}>
          <div style={styles.stepLabel}><span style={styles.stepNum}>05</span><span>Pricing</span></div>
          <div style={styles.pricingRow}>
            <div style={styles.priceField}>
              <label style={styles.priceLabel}>{pricingTiers[0]}</label>
              <div style={styles.priceInputWrap}>
                <span style={styles.dollarSign}>$</span>
                <input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0.00" style={styles.priceInput} required />
              </div>
            </div>
            <div style={styles.priceDivider}>—</div>
            <div style={styles.priceField}>
              <label style={styles.priceLabel}>{pricingTiers[1]} <span style={styles.optional}>— optional</span></label>
              <div style={styles.priceInputWrap}>
                <span style={styles.dollarSign}>$</span>
                <input type="number" min="0" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="0.00" style={styles.priceInput} />
              </div>
            </div>
          </div>
          <textarea value={pricingNote} onChange={(e) => setPricingNote(e.target.value)} placeholder="Any pricing notes?" style={{ ...styles.textarea, marginTop: 12, minHeight: 72 }} rows={3} />
        </section>

        <div style={styles.publishRow}>
          {error && <p style={{ color: "red", margin: 0, fontSize: 14 }}>{error}</p>}
          <button type="submit" style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} disabled={saving}>
            {saving ? "Saving..." : "Save Changes →"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#FAFAF7", fontFamily: "'DM Sans', Arial, sans-serif", color: "#1a1a1a", paddingBottom: 80 },
  header: { backgroundColor: "#ffffff", borderBottom: "1.5px solid #EAEAE4", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 },
  headerInner: { maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, height: 60 },
  logo: { fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px", color: "#2D6A4F" },
  divider: { color: "#ddd", fontSize: 16 },
  headerTitle: { fontSize: 14, color: "#999", fontWeight: 500 },
  form: { maxWidth: 680, margin: "0 auto", padding: "44px 24px", display: "flex", flexDirection: "column", gap: 52 },
  section: { display: "flex", flexDirection: "column", gap: 14 },
  stepLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 700, color: "#1a1a1a" },
  stepNum: { fontSize: 10, fontWeight: 700, color: "#2D6A4F", backgroundColor: "#E8F5EE", borderRadius: 5, padding: "3px 7px", letterSpacing: "0.5px", fontFamily: "monospace" },
  optional: { fontSize: 13, fontWeight: 400, color: "#bbb" },
  selectWrapper: { position: "relative", display: "inline-block", width: "100%" },
  select: { width: "100%", padding: "13px 40px 13px 16px", border: "1.5px solid #EAEAE4", borderRadius: 11, fontSize: 15, fontFamily: "inherit", backgroundColor: "#ffffff", color: "#1a1a1a", outline: "none", appearance: "none", cursor: "pointer", boxSizing: "border-box" },
  selectArrow: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#999", pointerEvents: "none" },
  input: { width: "100%", padding: "13px 16px", border: "1.5px solid #EAEAE4", borderRadius: 11, fontSize: 15, fontFamily: "inherit", backgroundColor: "#ffffff", outline: "none", boxSizing: "border-box", color: "#1a1a1a" },
  charCount: { fontSize: 12, color: "#ccc", textAlign: "right", marginTop: -8 },
  textarea: { width: "100%", padding: "14px 16px", border: "1.5px solid #EAEAE4", borderRadius: 11, fontSize: 14, fontFamily: "inherit", backgroundColor: "#ffffff", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: "1.65", minHeight: 200 },
  imageGrid: { display: "flex", flexWrap: "wrap", gap: 10 },
  imageThumb: { position: "relative", width: 92, height: 92, borderRadius: 10, overflow: "hidden", border: "1.5px solid #EAEAE4" },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  removeImg: { position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.55)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", lineHeight: 1, padding: 0, zIndex: 2 },
  uploadBtn: { width: 92, height: 92, borderRadius: 10, border: "1.5px dashed #C8C8C0", backgroundColor: "#ffffff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 },
  uploadIcon: { fontSize: 24, color: "#aaa", lineHeight: 1 },
  uploadText: { fontSize: 11, color: "#bbb", fontWeight: 500 },
  pricingRow: { display: "flex", alignItems: "flex-end", gap: 12 },
  priceField: { flex: 1, display: "flex", flexDirection: "column", gap: 7 },
  priceLabel: { fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px" },
  priceInputWrap: { display: "flex", alignItems: "center", border: "1.5px solid #EAEAE4", borderRadius: 11, backgroundColor: "#ffffff", overflow: "hidden", paddingLeft: 13 },
  dollarSign: { fontSize: 14, color: "#999", fontWeight: 600, userSelect: "none" },
  priceInput: { flex: 1, padding: "12px 12px", border: "none", outline: "none", fontSize: 15, fontFamily: "inherit", backgroundColor: "transparent", color: "#1a1a1a", minWidth: 0 },
  priceDivider: { paddingBottom: 13, color: "#ccc", fontSize: 18, fontWeight: 300, flexShrink: 0 },
  publishRow: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, paddingTop: 4 },
  saveBtn: { backgroundColor: "#2D6A4F", color: "#ffffff", border: "none", borderRadius: 12, padding: "16px 44px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  saveBtnDisabled: { backgroundColor: "#C8C8C0", cursor: "not-allowed" },
};
