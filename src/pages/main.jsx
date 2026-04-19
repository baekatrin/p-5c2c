import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from '../supabaseClient';
import './index.css'
import HomePage from "./homepage";
import CreateListing from "./createlisting";
import ViewListing from "./viewlisting";
import LoginPrompt from "./loginprompt";
import ProfileSetup from './profilesetup';

const ALLOWED_DOMAINS = [
    "g.hmc.edu", 
    "mymail.pomona.edu",
    "cmc.edu",
    "students.scrippscollege.edu", 
    "students.pitzer.edu",
]

export function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const checkProfile = useCallback(async (session) => {
    if (!session) {
      setHasProfile(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("User")
        .select("id")
        .eq("id", session.user.id)
        .single();
      
      if (error) {
        setHasProfile(false);
      } else {
        setHasProfile(true);
      }
    } catch (err) {
      setHasProfile(false);
    }
  }, []);

  const validateEmailDomain = useCallback((session) => {
    if (!session?.user) return false;

    // Azure OAuth stores email in metadata — check all possible locations
    const email =
      session.user.email ||
      session.user.user_metadata?.email ||
      session.user.user_metadata?.preferred_username;

    if (!email) {
      setEmailError("Could not retrieve your email address.");
      supabase.auth.signOut();
      return false;
    }

    const domain = email.split("@")[1]?.toLowerCase();
    const isValid = ALLOWED_DOMAINS.includes(domain);
    
    if (!isValid) {
      setEmailError("You must use a 5C student email to access this platform.");
      supabase.auth.signOut();
    } else {
      setEmailError(null);
    }
    
    return isValid;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !validateEmailDomain(session)) {
        setSession(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      await checkProfile(session);
      setLoading(false);
    }).catch((err) => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session && !validateEmailDomain(session)) {
            setSession(null);
            return;
          }
          setSession(session);
          await checkProfile(session);
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setHasProfile(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkProfile, validateEmailDomain]);

  if (loading) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<LoginPrompt emailError={emailError} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : !hasProfile ? (
          <>
            <Route path="/profile-setup" element={<ProfileSetup onProfileCreated={() => checkProfile(session)} />} />
            <Route path="*" element={<Navigate to="/profile-setup" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/createlisting" element={<CreateListing />} />
            <Route path="/product/:id" element={<ViewListing />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <App />
)