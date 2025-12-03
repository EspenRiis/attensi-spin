import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Don't show header on auth pages
  const authPages = ['/login', '/signup', '/reset-password'];
  if (authPages.includes(location.pathname)) {
    return null;
  }

  if (loading) {
    return null; // Or a loading skeleton
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <button onClick={() => navigate('/')} className="logo-btn">
            <span className="logo-icon">🎡</span>
            <span className="logo-text">Name Roulette</span>
          </button>
        </div>

        <nav className="header-nav">
          {user ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="nav-link">
                Dashboard
              </button>
              <button onClick={() => navigate('/')} className="nav-link">
                Spin Wheel
              </button>
              <button onClick={() => navigate('/squad-scramble')} className="nav-link">
                Squad Scramble
              </button>
              <button onClick={() => navigate('/quiz-builder')} className="nav-link">
                Quiz Race
              </button>
              <div className="user-menu">
                <span className="user-email">{user.email}</span>
                <button onClick={handleSignOut} className="btn-signout">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="nav-link">
                Login
              </button>
              <button onClick={() => navigate('/signup')} className="btn-signup">
                Sign Up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
