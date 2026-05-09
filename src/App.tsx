import React, { useState, useEffect } from 'react';
import { User, Settings, Moon, Sun } from 'lucide-react';
import { auth, db } from './firebase';
import { getDoc, setDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSettings from './components/ProfileSettings';
import Streams from './pages/Streams';
import { useLiveNotifications } from './hooks/useLiveNotifications';

function App() {
  useLiveNotifications();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [errorText, setErrorText] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [isDarker, setIsDarker] = useState(() => {
    return localStorage.getItem('theme') === 'darker';
  });

  useEffect(() => {
    if (isDarker) {
      document.body.classList.add('theme-darker');
      localStorage.setItem('theme', 'darker');
    } else {
      document.body.classList.remove('theme-darker');
      localStorage.setItem('theme', 'default');
    }
  }, [isDarker]);

  const toggleTheme = () => setIsDarker(prev => !prev);

  useEffect(() => {
    let unsubDbUser: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Subscribe to user doc
        unsubDbUser = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (!docSnap.exists()) {
            // Check if they are the special owner email
            const newRole = currentUser.email === 'zwahraahmad31@gmail.com' ? 'owner' : 'user';
            const newUser = {
              displayName: currentUser.displayName || 'Visitor',
              photoURL: currentUser.photoURL || '',
              email: currentUser.email || '',
              role: newRole,
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', currentUser.uid), newUser);
          } else {
            setDbUser({ id: docSnap.id, ...docSnap.data() });
          }
        });
      } else {
        setDbUser(null);
        if (unsubDbUser) unsubDbUser();
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubDbUser) unsubDbUser();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.log("Login popup closed by user");
        return;
      }
      console.error("Login Error:", err);
      setErrorText("خطأ في تسجيل الدخول. " + err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 gap-6" dir="rtl">
      <Toaster position="top-center" />
      {/* Header Container */}
      <header className="relative w-full rounded-2xl overflow-hidden glass border-blue-500/40 shrink-0 min-h-[128px] flex flex-col justify-center">
        <Link to="/" className="absolute inset-0 z-0">
          <img 
            src="https://pbs.twimg.com/profile_banners/2024917430720458752/1778245746/1080x360"
            className="absolute inset-0 w-full h-full object-cover opacity-40 hover:opacity-50 transition"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-transparent to-black/80 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:px-10 gap-4 w-full">
            <div className="flex items-center gap-6">
              <Link to="/">
                <img src="https://i.postimg.cc/XYL01bDB/Picsart-26-05-03-15-13-04-980.png" className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition" />
              </Link>
              <div className="flex flex-col text-center md:text-right">
                <Link to="/">
                  <h1 className="text-3xl md:text-4xl font-black tracking-widest text-blue-400 italic" style={{ fontFamily: "'Oswald', sans-serif" }}>BLACK LIST GANG</h1>
                </Link>
                <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Elite Gaming Organization</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <button 
                onClick={toggleTheme} 
                className="bg-black/40 hover:bg-black/60 p-2 rounded-xl border border-white/5 transition flex items-center justify-center text-slate-400 hover:text-white"
                title={isDarker ? "الوضع الأساسي" : "الوضع المظلم"}
              >
                {isDarker ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link to="/streams" className="text-green-400 hover:text-green-300 font-bold text-sm bg-black/40 px-4 py-2 rounded-xl border border-white/5 hover:bg-black/60 transition flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> البثوث المباشرة
              </Link>
              <Link to="/community" className="text-blue-400 hover:text-blue-300 font-bold text-sm bg-black/40 px-4 py-2 rounded-xl border border-white/5 hover:bg-black/60 transition">
                المجتمع / التايم لاين
              </Link>
              {dbUser && ['admin', 'owner'].includes(dbUser.role) && (
                <Link to="/admin" className="text-red-400 hover:text-red-300 font-bold text-sm bg-black/40 px-4 py-2 rounded-xl border border-white/5 hover:bg-black/60 transition">
                  <Settings className="w-4 h-4 inline-block ml-1" /> لوحة التحكم
                </Link>
              )}
              {user ? (
                <div className="flex gap-2 relative">
                  <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-700 transition border border-white/5" onClick={() => setIsProfileOpen(true)}>
                      <span className="text-sm font-bold text-blue-300">{dbUser?.displayName ?? user.displayName}</span>
                      <img src={dbUser?.photoURL || user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-md border border-blue-500/50 object-cover" />
                  </div>
                  <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 transition">
                    خروج
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="bg-slate-800/80 px-6 py-2 rounded-xl font-bold hover:bg-slate-700 transition flex items-center gap-2 text-blue-400 border border-white/5">
                  <User className="w-4 h-4" /> تسجيل الدخول
                </button>
              )}
            </div>
        </div>
      </header>

      {errorText && (
        <div className="max-w-7xl mx-auto w-full">
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
            {errorText}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full gap-6">
        <Routes>
          <Route path="/" element={<Home dbUser={dbUser} />} />
          <Route path="/community" element={<Community user={user} dbUser={dbUser} handleLogin={handleLogin} />} />
          <Route path="/streams" element={<Streams dbUser={dbUser} />} />
          <Route path="/admin" element={<AdminDashboard dbUser={dbUser} />} />
        </Routes>
      </main>

      {isProfileOpen && dbUser && (
        <ProfileSettings dbUser={dbUser} onClose={() => setIsProfileOpen(false)} />
      )}
    </div>
  );
}

export default App;
