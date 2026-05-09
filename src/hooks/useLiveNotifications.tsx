import { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { Play } from 'lucide-react';
import React from 'react';

export function useLiveNotifications() {
  const [members, setMembers] = useState<any[]>([]);
  const knownLiveRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Fetch members once
    const fetchMembers = async () => {
      const q = query(collection(db, 'gangMembers'));
      const snap = await getDocs(q);
      const m = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(m);
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length === 0) return;

    let mounted = true;

    const checkLiveStatus = async () => {
      for (const member of members) {
        if (!member.kickUsername || !mounted) continue;
        try {
          const res = await fetch(`/api/kick-status/${member.kickUsername}`);
          const data = await res.json();
          
          const isLive = data.isLive;
          const wasLive = knownLiveRef.current.has(member.kickUsername);

          if (isLive && !wasLive) {
            // Just went live!
            knownLiveRef.current.add(member.kickUsername);
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-black/80 border border-green-500/50 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                 <div className="flex-1 w-0 p-4">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 pt-0.5">
                       <img className="h-10 w-10 rounded-full object-cover" src={member.image || 'https://i.postimg.cc/XYL01bDB/Picsart-26-05-03-15-13-04-980.png'} alt="" />
                     </div>
                     <div className="ml-3 flex-1">
                       <p className="text-sm font-bold text-white mb-1">
                         {member.name}
                       </p>
                       <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                         بث مباشر الآن على Kick!
                       </p>
                     </div>
                   </div>
                 </div>
                 <div className="flex border-r border-white/10 rtl:border-l rtl:border-r-0">
                   <button
                     onClick={() => {
                        toast.dismiss(t.id);
                        window.open(`https://kick.com/${member.kickUsername}`, '_blank');
                     }}
                     className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-green-400 hover:text-green-300 hover:bg-white/5 transition focus:outline-none"
                   >
                     مشاهدة
                   </button>
                 </div>
              </div>
            ), { duration: 8000 });
          } else if (!isLive && wasLive) {
            knownLiveRef.current.delete(member.kickUsername);
          }
        } catch (err) {
          // ignore error
        }
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 60000); // Check every minute

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [members]);
}
