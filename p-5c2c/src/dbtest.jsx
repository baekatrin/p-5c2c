/**
 * User Sign-Up Form – Supabase integration example
 *
 * This app demonstrates how to connect a React form to a Supabase table
 * and insert new user records. Ensure your Supabase table has:
 * - id (uuid, default: gen_random_uuid())
 * - createdAt (timestamptz, default: now())
 * - email, firstName, lastName, bio, school, profilePic, userID (text or as needed)
 *
 * Environment: Create a .env file with:
 *   VITE_SUPABASE_URL=your-project-url
 *   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
 */

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./dbtest.css";

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------
// createClient() connects your app to Supabase using the project URL and
// the "anon" (public) key. The anon key is safe to use in the browser;
// Row Level Security (RLS) in Supabase controls what each key can do.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// ---------------------------------------------------------------------------
// Table name in your Supabase project
// ---------------------------------------------------------------------------
// Change this to match your actual table name (e.g. "user_profiles" or "users").
const USERS_TABLE = "User";

function App() {
  // -------------------------------------------------------------------------
  // Form state – one state variable per input
  // -------------------------------------------------------------------------
  // We keep form values in React state so inputs are "controlled":
  // the value is always state, and onChange updates state.
  const [formData, setFormData] = useState({
    userID: "",
    email: "",
    firstName: "",
    lastName: "",
    bio: "",
    school: "",
    profilePic: "",
     // In production, this often comes from Supabase Auth (auth.uid())
  });

  // -------------------------------------------------------------------------
  // UI state – loading and feedback messages
  // -------------------------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // -------------------------------------------------------------------------
  // Update a single field when the user types
  // -------------------------------------------------------------------------
  // This handler is used by every input. It takes the field name and new
  // value, then updates formData by spreading the previous state and
  // overwriting only that field. This keeps all other fields unchanged.
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // -------------------------------------------------------------------------
  // Submit: send form data to Supabase
  // -------------------------------------------------------------------------
  // 1. Prevent the browser’s default form submit (page reload).
  // 2. Show loading state and clear any previous message.
  // 3. Build the payload. We only send columns that exist in your table.
  //    id and createdAt are usually auto-set by the database (defaults).
  // 4. Call supabase.from(TABLE).insert(payload). Supabase returns
  //    { data, error }. We check error to show success or failure.
  async function handleSubmit(e) {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    // Build the object that matches your table columns.
    // Omit id and createdAt if your table has DEFAULT gen_random_uuid()
    // and DEFAULT now() for them.
    const payload = {
      email: formData.email.trim() || null,
      firstName: formData.firstName.trim() || null,
      lastName: formData.lastName.trim() || null,
      bio: formData.bio.trim() || null,
      school: formData.school.trim() || null,
      profilePic: formData.profilePic.trim() || null,
      userID: formData.userID.trim() || null,
      // Optional: set createdAt manually if your table has no default:
      // createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase.from(USERS_TABLE).insert(payload);

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "User created successfully!" });
    // Clear form after successful insert
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      bio: "",
      school: "",
      profilePic: "",
      userID: "",
    });
  }

  return (
    <div className="app">
      <header className="header">
        <h1>User Sign Up</h1>
        <p className="subtitle">
          Dummy form – data is sent to your Supabase user table
        </p>
      </header>

      <form onSubmit={handleSubmit} className="form" noValidate>
        {/* Each input is "controlled": value comes from state, onChange updates state. */}
        
        <div className="field">
          <label htmlFor="userID">User ID *</label>
          <input
            id="userID"
            type="text"
            name="userID"
            value={formData.userID}
            onChange={handleChange}
            placeholder="e.g. 5C2C"
            disabled={isSubmitting}
          />
          <span className="hint">
            In a real app, this often comes from Supabase Auth after sign-up.
          </span>
        </div>

        <div className="field">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="firstName">First name *</label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Jane"
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="A short bio..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="school">School *</label>
          <input
            id="school"
            type="text"
            name="school"
            value={formData.school}
            onChange={handleChange}
            placeholder="Your school name"
            disabled={isSubmitting}
          />
        </div>

        <div className="field">
          <label htmlFor="profilePic">Profile picture URL</label>
          <input
            id="profilePic"
            type="url"
            name="profilePic"
            value={formData.profilePic}
            onChange={handleChange}
            placeholder="https://..."
            disabled={isSubmitting}
          />
        </div>

        {message.text && (
          <div className={`message message--${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        <button type="submit" className="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Create user"}
        </button>
      </form>
    </div>
  );
}

export default App;
