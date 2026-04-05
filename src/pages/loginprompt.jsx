import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Claremont colleges domain names for students 
const ALLOWED_DOMAINS = [
    "g.hmc.edu", 
    "mymail.pomona.edu",
    "cmc.edu",
    "students.scrippscollege.edu", 
    "students.pitzer.edu",
]

export default function LoginPrompt() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("signup"); // "signup" or "login"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState( { type: "", text: ""});
    const [is5CStudent, setIs5CStudent] = useState(null);

    const handleSubmit = async (e) => {
        // Stops form from doing a full page reload
        e.preventDefault();
        setIsLoading(true);
        setMessage( { type: "", text: ""});

        // Checks email domain belongs to 5C student
        const domain = email.split("@")[1]; 
        if (!ALLOWED_DOMAINS.includes(domain)) {
            setMessage( { type: "error", text: "Please use your 5C student email."});
            setIsLoading(false);
            return;
        }

        if (mode === "signup") { 
            const { error } = await supabase.auth.signUp({ email, password});
            if (error) {
                setMessage({ type: "error", text: error.message});
            } 
            else {
                setMessage( { type: "success", text: "Check your email to confirm your account."});
            }
        } 
        else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage({ type: "error", text: error.message});
            } 
            else {
                navigate("/");
            }
        }
        setIsLoading(false);
    }

    return ( 
        <div>
            {is5CStudent === null && (
                <div>
                    <h2>Are you a 5C student?</h2>
                    <button onClick={() => setIs5CStudent(true)}>Yes</button>
                    <button onClick={() => setIs5CStudent(false)}>No</button>
                </div>
            )}

            {is5CStudent === false && (
                <div> 
                    <h2>Sorry, this platform is only for 5C students.</h2>
                    <p>cat picture here</p>
                    <button onClick={() => setIs5CStudent(null)}>Go back</button>
                </div>
            )}

            {is5CStudent === true && (
            <div>
                <h2>{mode === "signup" ? "Sign Up" : "Log In"}</h2>

                <form onSubmit={handleSubmit}>
                      <input
                          type="email"
                          placeholder="Your 5C email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                      />

                      <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                      />
                      <button type="submit" disabled={isLoading}> 
                          {isLoading ? "Loading..." : mode === "signup" ? "Sign Up" : "Log In"}
                      </button>
                  </form>

                     {message.text && (
                      <p style={{ color: message.type === "error" ? "red" : "green" }}>
                          {message.text}
                      </p>
                    )}

                    <p>
                      {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                      <button onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
                          {mode === "signup" ? "Log in" : "Sign up"}
                      </button>
                  </p>
              </div>
          )}
        </div>
    )


}


