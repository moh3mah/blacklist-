import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, UserCog, User, Trash2, Search } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Props {
  dbUser: any;
}

export default function AdminDashboard({ dbUser }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'members'>('users');

  useEffect(() => {
    // Only query if admin
    if (!dbUser || !['admin', 'owner'].includes(dbUser.role)) return;

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), snap => setUsers(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), snap => setPosts(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    const unsubMembers = onSnapshot(query(collection(db, 'gangMembers'), orderBy('createdAt', 'desc')), snap => setMembers(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
    
    return () => {
      unsubUsers();
      unsubPosts();
      unsubMembers();
    };
  }, [dbUser]);

  if (!dbUser || !['admin', 'owner'].includes(dbUser.role)) {
    return <div className="text-center p-12 text-red-400 font-bold glass rounded-2xl">Access Denied</div>;
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (dbUser.role !== 'owner') {
      alert("Only the Owner can change user roles.");
      return;
    }
    if (window.confirm("متأكد من تغيير الرتبة؟")) {
      try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-6 border-l-4 border-red-500 shadow-lg">
         <h1 className="text-2xl font-bold flex items-center gap-3 text-red-400">
           <Shield className="w-8 h-8" /> 
           لوحة تحكم الإدارة
         </h1>
         <p className="text-slate-400 mt-2 text-sm">
           صلاحية: {dbUser.role.toUpperCase()}
         </p>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col gap-4">
        <div className="flex justify-between items-center bg-black/30 p-2 rounded-xl">
           <div className="flex gap-2 text-sm max-w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
             <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'users' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}>المستخدمين</button>
             <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'posts' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}>المنشورات</button>
             <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'members' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}>إدارة أعضاء العصابة</button>
           </div>
        </div>

        {activeTab === 'users' && (
          <div className="flex flex-col gap-4">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="بحث عن مستخدم..." 
                 className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500/50"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               <Search className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-slate-900/50 text-slate-400 border-y border-white/5">
                   <tr>
                     <th className="px-4 py-3 font-medium">المستخدم</th>
                     <th className="px-4 py-3 font-medium">البريد</th>
                     <th className="px-4 py-3 font-medium">الرتبة</th>
                     <th className="px-4 py-3 font-medium">إجراء</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {filteredUsers.map(u => (
                     <tr key={u.id} className="hover:bg-white/5 transition">
                       <td className="px-4 py-3 flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800">
                           {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover"/> : <User className="w-full h-full p-1 text-slate-500"/>}
                         </div>
                         <span className="font-bold text-slate-200">{u.displayName}</span>
                       </td>
                       <td className="px-4 py-3 text-slate-400">{u.email}</td>
                       <td className="px-4 py-3">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'owner' ? 'bg-red-500/20 text-red-400' : u.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                           {u.role}
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         {dbUser.role === 'owner' && u.id !== dbUser.id && (
                           <select 
                             value={u.role} 
                             onChange={(e) => handleRoleChange(u.id, e.target.value)}
                             className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                           >
                             <option value="user">User</option>
                             <option value="admin">Admin</option>
                           </select>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="flex flex-col gap-4">
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-slate-900/50 text-slate-400 border-y border-white/5">
                   <tr>
                     <th className="px-4 py-3 font-medium">الكاتب</th>
                     <th className="px-4 py-3 font-medium">المحتوى</th>
                     <th className="px-4 py-3 font-medium">النوع</th>
                     <th className="px-4 py-3 font-medium">إجراء</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {posts.map(p => (
                     <tr key={p.id} className="hover:bg-white/5 transition">
                       <td className="px-4 py-3 font-bold text-blue-300">{p.author}</td>
                       <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{p.text}</td>
                       <td className="px-4 py-3 text-slate-400">{p.imageUrl ? 'صورة' : p.videoUrl ? 'فيديو' : 'نص'}</td>
                       <td className="px-4 py-3">
                         <button 
                           onClick={async () => {
                             if(window.confirm('حذف هذا المنشور؟')) {
                               try {
                                 await deleteDoc(doc(db, 'posts', p.id));
                               } catch (err: any) { alert("حدث خطأ: " + err.message); }
                             }
                           }} 
                           className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg transition"
                         >
                           حذف
                         </button>
                       </td>
                     </tr>
                   ))}
                   {posts.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-500">لا توجد منشورات</td></tr>}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="flex flex-col gap-4">
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-slate-900/50 text-slate-400 border-y border-white/5">
                   <tr>
                     <th className="px-4 py-3 font-medium">صورة</th>
                     <th className="px-4 py-3 font-medium">الاسم</th>
                     <th className="px-4 py-3 font-medium">الوظيفة</th>
                     <th className="px-4 py-3 font-medium">إجراء</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {members.map(m => (
                     <tr key={m.id} className="hover:bg-white/5 transition">
                       <td className="px-4 py-3">
                         <img src={m.image} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                       </td>
                       <td className="px-4 py-3 font-bold text-white">{m.name}</td>
                       <td className="px-4 py-3 text-slate-300">{m.role}</td>
                       <td className="px-4 py-3">
                         <button 
                           onClick={async () => {
                             if(window.confirm('حذف هذا العضو؟')) {
                               try {
                                 await deleteDoc(doc(db, 'gangMembers', m.id));
                               } catch (err: any) { alert("حدث خطأ: " + err.message); }
                             }
                           }} 
                           className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg transition"
                         >
                           حذف
                         </button>
                       </td>
                     </tr>
                   ))}
                   {members.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-500">لا يوجد أعضاء</td></tr>}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
