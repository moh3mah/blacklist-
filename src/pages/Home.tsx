import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Plus, Edit, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

interface Props {
  dbUser?: any;
}

export default function Home({ dbUser }: Props) {
  const [members, setMembers] = useState<any[]>([]);
  const isAdmin = dbUser && ['admin', 'owner'].includes(dbUser.role);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'gangMembers'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return unsub;
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف ${name}؟`)) {
      try {
        await deleteDoc(doc(db, 'gangMembers', id));
      } catch (err: any) { alert(err.message); }
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {isModalOpen && isAdmin && (
        <MemberModal 
          member={editingMember} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* Members Grid */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mt-4">
        <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
          أعضاء العصابة
        </h2>
        {isAdmin && (
          <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg">
             <Plus className="w-4 h-4" /> إضافة عضو
          </button>
        )}
      </div>

      {members.length === 0 && (
        <div className="text-center p-8 text-slate-500 glass rounded-2xl">
          لا يوجد أعضاء مضافين بعد
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
        {members.map((member, idx) => (
           <MemberCard 
             key={member.id} 
             member={member} 
             index={idx} 
             isAdmin={isAdmin}
             onEdit={() => openEditModal(member)}
             onDelete={() => handleDelete(member.id, member.name)}
           />
        ))}
      </div>

      <div className="mt-8 mb-4">
        <Link to="/community" className="w-full relative glass rounded-2xl h-32 flex flex-col items-center justify-center border border-blue-500/30 hover:border-blue-500 hover:bg-white/5 transition group overflow-hidden">
           <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition duration-500" />
           <Camera className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition" />
           <span className="font-bold text-white text-lg z-10 group-hover:text-blue-200 transition">دخول قسم المجتمع (صور & شات)</span>
        </Link>
      </div>
    </div>
  );
}

function MemberModal({ member, onClose }: { member: any, onClose: () => void }) {
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || '');
  const [image, setImage] = useState(member?.image || '');
  const [twitter, setTwitter] = useState(member?.twitter || '');
  const [kick, setKick] = useState(member?.kick || '');
  const [kickUsername, setKickUsername] = useState(member?.kickUsername || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !image) {
      setError('الاسم والوظيفة والصورة (رابط) مطلوبة');
      return;
    }
    setLoading(true);
    setError('');
    
    // We create a random ID if not exists
    const id = member?.id || doc(collection(db, 'gangMembers')).id;

    const data: any = {
      name, role, image
    };
    if (twitter) data.twitter = twitter;
    if (kick) data.kick = kick;
    if (kickUsername) data.kickUsername = kickUsername;

    try {
      if (member?.id) {
        await updateDoc(doc(db, 'gangMembers', id), data);
      } else {
        data.createdAt = serverTimestamp();
        await setDoc(doc(db, 'gangMembers', id), data);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="glass w-full max-w-md rounded-2xl p-6 relative z-10 shadow-2xl border border-blue-500/40 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 transition">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold mb-6 text-center text-blue-300">{member ? 'تعديل عضو' : 'إضافة عضو'}</h3>
        
        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1 font-bold">الاسم *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1 font-bold">الوظيفة/الرتبة *</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1 font-bold">رابط الصورة (URL مباشر) *</label>
            <input type="url" value={image} onChange={e => setImage(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1 font-bold">حساب Twitter (رابط اختياري)</label>
            <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-left" dir="ltr" />
          </div>
          <div>
             <label className="block text-slate-400 text-xs mb-1 font-bold">حساب Kick (رابط اختياري)</label>
             <input type="url" value={kick} onChange={e => setKick(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-left" dir="ltr" />
          </div>
          <div>
             <label className="block text-slate-400 text-xs mb-1 font-bold">اسم المستخدم بحساب Kick (لمعرفة البث المباشر)</label>
             <input type="text" value={kickUsername} onChange={e => setKickUsername(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-left" dir="ltr" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 mt-4 rounded-xl transition">
            {loading ? 'جار الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
    </div>
  )
}

function MemberCard({ member, index, isAdmin, onEdit, onDelete }: { key?: any, member: any, index: number, isAdmin: boolean, onEdit: () => void, onDelete: () => void }) {
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    if (member.kickUsername) {
      fetch(`/api/kick-status/${member.kickUsername}`)
        .then(res => res.json())
        .then(data => setIsLive(data.isLive))
        .catch(() => setIsLive(false));
    }
  }, [member.kickUsername]);

  const isBoss = member.role.toLowerCase().includes("boss");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`glass rounded-xl flex flex-col gap-3 p-3 lg:p-4 ${isBoss ? "boss-glow border border-blue-500/40" : "border border-white/10"}`}
    >
      <div className="relative aspect-square md:aspect-auto md:h-64 rounded-xl overflow-hidden border border-blue-500/30">
         <img 
           src={member.image} 
           alt={member.name} 
           className="w-full h-full object-cover"
         />
         <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black p-4">
            {isLive && (
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-green-500 status-pulse"></span>
                <span className="text-[10px] text-green-400 uppercase font-bold tracking-wider">Live on Kick</span>
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight flex items-center gap-2 flex-wrap">
               {member.name} 
               <span className="text-blue-500 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{member.role}</span>
            </h2>
         </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-center mt-2">
        {member.twitter && (
          <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 border border-white/5 p-2 rounded-lg transition-colors text-xs flex flex-col items-center justify-center gap-1 group">
            <span className="text-slate-400 font-bold group-hover:text-blue-300">Twitter</span>
            <span className="text-blue-400 break-all text-[10px]" style={{ direction: 'ltr' }}>{member.twitter.split('/').pop() || '@Twitter'}</span>
          </a>
        )}
        {member.kick && (
          <a href={member.kick} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 border border-white/5 p-2 rounded-lg transition-colors text-xs flex flex-col items-center justify-center gap-1 group">
            <span className="text-slate-400 font-bold group-hover:text-green-300">Kick</span>
            <span className="text-green-400 underline break-all text-[10px]" style={{ direction: 'ltr' }}>{member.kickUsername}</span>
          </a>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-2 mt-2 pt-3 border-t border-white/10">
           <button onClick={onEdit} className="bg-white/5 hover:bg-blue-500/20 text-blue-400 font-bold py-1.5 px-3 rounded-lg text-xs flex-1 transition flex items-center justify-center gap-1">
             <Edit className="w-3.5 h-3.5" /> تعديل
           </button>
           <button onClick={onDelete} className="bg-white/5 hover:bg-red-500/20 text-red-400 font-bold py-1.5 px-3 rounded-lg text-xs flex-1 transition flex items-center justify-center gap-1">
             <Trash2 className="w-3.5 h-3.5" /> حذف
           </button>
        </div>
      )}
    </motion.div>
  );
}
