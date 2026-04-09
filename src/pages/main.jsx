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

export function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  const checkProfile = useCallback(async (session) => {
    if (!session) {
      setHasProfile(false);
      return;
    }
    const { data } = await supabase
      .from("User")
      .select("id")
      .eq("id", session.user.id)
      .single();
    setHasProfile(!!data);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      await checkProfile(session);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        await checkProfile(session);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [checkProfile]);

  if (loading) return <p>Loading...</p>;

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<LoginPrompt />} />
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
