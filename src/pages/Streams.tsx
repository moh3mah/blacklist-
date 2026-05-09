import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Play, Radio, Plus, Square, X, Edit, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  dbUser?: any;
}

function MemberStreamCard({ member }: { member: any }) {
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    if (member.kickUsername) {
      fetch(`/api/kick-status/${member.kickUsername}`)
        .then(res => res.json())
        .then(data => setIsLive(data.isLive))
        .catch(() => setIsLive(false));
    } else {
      setIsLive(false);
    }
  }, [member.kickUsername]);

  if (!isLive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)] group flex flex-col"
    >
      <div className="relative aspect-video bg-black/60 border-b border-white/5 flex items-center justify-center overflow-hidden">
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500" />
        ) : (
          <Video className="w-16 h-16 text-slate-800" />
        )}
        
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">بث من عضو العصابة</h3>
          <p className="text-green-400 text-sm font-bold flex flex-wrap gap-2 items-center">
            @ {member.kickUsername} ({member.name})
          </p>
        </div>
        
        <div className="mt-auto pt-4 flex gap-3">
          <a 
            href={`https://kick.com/${member.kickUsername}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition bg-green-500/20 text-green-100 hover:bg-green-500 border border-green-500/50"
          >
            <Play className="w-4 h-4" /> شاهد الآن
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function Streams({ dbUser }: Props) {
  const [streams, setStreams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [streamerName, setStreamerName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('live');
  const [editId, setEditId] = useState<string | null>(null);

  const isAdmin = dbUser && ['admin', 'owner'].includes(dbUser.role);

  useEffect(() => {
    const qStreams = query(collection(db, 'streams'), orderBy('createdAt', 'desc'));
    const unsubStreams = onSnapshot(qStreams, snap => {
      setStreams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const qMembers = query(collection(db, 'gangMembers'), orderBy('createdAt', 'asc'));
    const unsubMembers = onSnapshot(qMembers, snap => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => {
      unsubStreams();
      unsubMembers();
    };
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setTitle('');
    setUrl('');
    setStreamerName('');
    setImageUrl('');
    setStatus('live');
    setIsModalOpen(true);
  };

  const openEditModal = (stream: any) => {
    setEditId(stream.id);
    setTitle(stream.title || '');
    setUrl(stream.url || '');
    setStreamerName(stream.streamerName || '');
    setImageUrl(stream.imageUrl || '');
    setStatus(stream.status || 'live');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !streamerName) return;

    try {
      const payload: any = {
        title,
        url,
        status,
        streamerName,
      };
      if (imageUrl) payload.imageUrl = imageUrl;

      if (editId) {
        await updateDoc(doc(db, 'streams', editId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'streams'), payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل تريد حذف هذا البث؟")) {
      try {
        await deleteDoc(doc(db, 'streams', id));
      } catch (err: any) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px]" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-purple-500/20 p-4 rounded-full border border-purple-500/30">
            <Radio className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">البثوث المباشرة</h2>
            <p className="text-slate-400 text-sm mt-1">تابع أحدث البثوث والفعاليات لأعضاء العصابة</p>
          </div>
        </div>

        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 relative z-10"
          >
            <Plus className="w-5 h-5" /> إضافة بث
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <MemberStreamCard key={member.id} member={member} />
        ))}
        {streams.map((stream, idx) => (
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
             key={stream.id} 
             className={`glass rounded-2xl overflow-hidden border ${stream.status === 'live' ? 'border-red-500/40' : 'border-white/10'} shadow-lg group flex flex-col`}
          >
            <div className="relative aspect-video bg-black/60 border-b border-white/5 flex items-center justify-center overflow-hidden">
              {stream.imageUrl ? (
                <img src={stream.imageUrl} alt={stream.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500" />
              ) : (
                <Video className="w-16 h-16 text-slate-800" />
              )}
              
              <div className="absolute top-3 right-3 flex gap-2">
                {stream.status === 'live' ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                    OFFLINE
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4 flex-1">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{stream.title}</h3>
                <p className="text-purple-400 text-sm font-bold flex flex-wrap gap-2 items-center">
                  @ {stream.streamerName}
                </p>
              </div>
              
              <div className="mt-auto pt-4 flex gap-3">
                <a 
                  href={stream.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition ${stream.status === 'live' ? 'bg-red-500/20 text-red-100 hover:bg-red-500 border border-red-500/50' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'}`}
                >
                  <Play className="w-4 h-4" /> {stream.status === 'live' ? 'شاهد الآن' : 'مشاهدة الإعادة'}
                </a>
              </div>

              {isAdmin && (
                <div className="flex gap-2 border-t border-white/5 pt-4 mt-2">
                  <button onClick={() => openEditModal(stream)} className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1">
                    <Edit className="w-4 h-4" /> تعديل
                  </button>
                  <button onClick={() => handleDelete(stream.id)} className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1">
                    <X className="w-4 h-4" /> حذف
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {streams.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold bg-black/20 rounded-2xl border border-white/5">
            لا توجد بثوث مسجلة حالياً
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg glass rounded-2xl p-6 md:p-8 border border-white/10"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">
                {editId ? 'تعديل البث' : 'إضافة بث جديد'}
              </h2>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2 font-bold">عنوان البث</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-purple-500 transition" placeholder="مثال: بطولة كود" />
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2 font-bold">اسم الستريمر</label>
                  <input required value={streamerName} onChange={e => setStreamerName(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-purple-500 transition" placeholder="مثال: Ahmed" />
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2 font-bold">رابط البث (Twitch/YouTube/Kick)</label>
                  <input required type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-purple-500 transition" placeholder="https://" />
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2 font-bold">رابط صورة مصغرة (اختياري)</label>
                  <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-purple-500 transition" placeholder="https://" />
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2 font-bold">حالة البث</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-purple-500 transition">
                    <option value="live">مباشر الآن (LIVE)</option>
                    <option value="offline">موقف (OFFLINE)</option>
                  </select>
                </div>
                
                <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2">
                  {editId ? 'حفظ التعديلات' : 'إضافة البث'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
