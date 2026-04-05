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
        setMessage({ type: "", text: ""});

        const { data: { user} } = await supabase.auth.getUser();

        const { error } = await supabase   
            .from("User")
            .insert({
                id: user.id,
                email: user.email,
                username, 
                firstName, 
                lastName, 
                bio, 
                school,
            });
        if (error) {
            setMessage({ type: "error", text: error.message});
        }
        else {
            if (onProfileCreated) await onProfileCreated();
            navigate("/");
        }
        setIsLoading(false);
    };
      return (
          <div>
              <h2>Set Up Your Profile</h2>

              <form onSubmit={handleSubmit}>
                  <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                  />
                  <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                  />
                  <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                  />
                  <select
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      required
                  >
                      <option value="">Select your school</option>
                      <option value="Harvey Mudd">Harvey Mudd</option>
                      <option value="Pomona">Pomona</option>
                      <option value="CMC">CMC</option>
                      <option value="Scripps">Scripps</option>
                      <option value="Pitzer">Pitzer</option>
                  </select>
                  <textarea
                      placeholder="Bio (optional)"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                  />
                  <button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Complete Setup"}
                  </button>
              </form>

              {message.text && (
                  <p style={{ color: message.type === "error" ? "red" : "green" }}>
                      {message.text}
                  </p>
              )}
          </div>
      );

  }

  