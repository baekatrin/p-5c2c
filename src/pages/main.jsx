import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { supabase } from '../supabaseClient';
import './index.css'
import HomePage, { AppNavbar } from "./homepage";
import CreateListing from "./createlisting";
import ViewListing from "./viewlisting";
import ViewProfile from "./viewprofile";
import LoginPrompt from "./loginprompt";
import ProfileSetup from './profilesetup';
import Inbox from './inbox'; 
import Favorites from "./favorites";
import ChatPage from "./chatpage";
import MyProfile from './myprofile';


const ALLOWED_DOMAINS = [
    "g.hmc.edu", 
    "hmc.edu",
    "g.hmc.edu",
    "mymail.pomona.edu",
    "cmc.edu",
    "students.scrippscollege.edu", 
    "students.pitzer.edu",
]

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const onHome = location.pathname === "/";

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div style={layoutStyles.shell}>
      {!onHome && (
        <AppNavbar
          navigate={(path) => navigate(path)}
          onLogout={handleLogout}
        />
      )}
      <main style={onHome ? layoutStyles.contentHome : layoutStyles.content}>
        <Outlet />
      </main>
    </div>
  );
}

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
        .maybeSingle();

      if (error) {
        if (error.message?.includes('AbortError') || error.name === 'AbortError') {
          return;
        }
        console.error("Error checking profile:", error.message);
        return;
      }

      setHasProfile(data !== null);
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('AbortError') || err.message?.includes('Lock broken')) {
        return;
      }
      console.error("Unexpected error checking profile:", err);
    }
  }, []);

  const validateEmailDomain = useCallback((session) => {
    if (!session?.user?.email) return false;

    const domain = session.user.email.split("@")[1]?.toLowerCase();
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
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && !validateEmailDomain(session)) {
          setSession(null);
          return;
        }

        setSession(session);
        await checkProfile(session);
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        // Always runs — no more stuck loading screen
        setLoading(false);
      }
    };

    initSession();

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
    <HashRouter>
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
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage userId={session?.user?.id} />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/createlisting" element={<CreateListing />} />
              <Route path="/product/:id" element={<ViewListing />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/profile/:id" element={<ViewProfile />} />
              <Route path="/messages" element={<Inbox />} />
              <Route path="/chat/:id" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </>
        )}
      </Routes>
    </HashRouter>
  );
}

const layoutStyles = {
  shell: {
    minHeight: "100vh",
    backgroundColor: "#fff5da",
  },
  content: {
    paddingTop: "12px",
  },
  contentHome: {
    paddingTop: 0,
  },
};

createRoot(document.getElementById('root')).render(
  <App />
)