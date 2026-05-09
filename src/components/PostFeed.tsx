import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { filterProfanity } from '../lib/badwords';
import { MessageCircle, Upload, Video, Image as ImageIcon, Send, X, Trash2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';

interface Props {
  user: any;
  dbUser?: any;
  handleLogin: () => void;
}

export default function PostFeed({ user, dbUser, handleLogin }: Props) {
  const [posts, setPosts] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const qPhotos = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(qPhotos, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => console.error(err));
    return unsub;
  }, []);

  useEffect(() => {
    // Fetch users for their updated profile info
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.forEach(doc => {
        map[doc.id] = doc.data();
      });
      setUsersMap(map);
    });
    return unsubUsers;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setErrorText("حجم الصورة يجب أن لا يتجاوز 500 كيلوبايت");
        return;
      }
      setErrorText('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setMediaType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async () => {
    if (!user) return;
    if (!postText.trim() && mediaType === 'none') {
       setErrorText('لا يمكن نشر بوست فارغ');
       return;
    }

    setIsUploading(true);
    setErrorText('');

    let finalMediaUrl = '';
    if (mediaType === 'image' && previewImage) finalMediaUrl = previewImage;
    if (mediaType === 'video' && videoUrl.trim()) finalMediaUrl = videoUrl.trim();

    try {
      await addDoc(collection(db, 'posts'), {
        text: filterProfanity(postText.trim()),
        author: user.displayName || 'Visitor',
        userId: user.uid,
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaUrl ? mediaType : 'none',
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorText("فشل النشر: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setPostText('');
    setPreviewImage(null);
    setVideoUrl('');
    setMediaType('none');
  }

  const isAdmin = dbUser && ['admin', 'owner'].includes(dbUser.role);

  return (
      <div className="flex flex-col gap-6">
          <div className="glass rounded-2xl p-4 border border-blue-500/20 shadow-lg">
             <div className="flex gap-4">
               <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-blue-500/30">
                 {user?.photoURL ? <img src={user.photoURL} alt="user" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold">{(user?.displayName || '?').charAt(0).toUpperCase()}</div>}
               </div>
               <div className="flex-1">
                 {user ? (
                   <div onClick={() => setIsModalOpen(true)} className="w-full bg-black/30 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-slate-400 text-sm cursor-pointer transition">
                     ماذا يحدث يا {user.displayName}؟
                   </div>
                 ) : (
                   <div onClick={handleLogin} className="w-full bg-black/30 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-slate-400 text-sm cursor-pointer transition text-center font-bold">
                     سجل دخولك للنشر وتفاعل مع العصابة
                   </div>
                 )}
                 <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                   <div className="flex gap-2">
                     <button onClick={() => { if(user) { setMediaType('image'); setIsModalOpen(true); } else handleLogin();}} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-full transition flex items-center gap-1 group">
                       <ImageIcon className="w-5 h-5 group-hover:scale-110 transition" /> <span className="text-xs font-bold md:block hidden">صورة</span>
                     </button>
                     <button onClick={() => { if(user) { setMediaType('video'); setIsModalOpen(true); } else handleLogin();}} className="text-green-400 hover:bg-green-500/10 p-2 rounded-full transition flex items-center gap-1 group">
                       <Video className="w-5 h-5 group-hover:scale-110 transition" /> <span className="text-xs font-bold md:block hidden">فيديو (رابط)</span>
                     </button>
                   </div>
                   <button onClick={() => { if(user) setIsModalOpen(true); else handleLogin();}} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-6 rounded-full text-sm transition">
                     نشر
                   </button>
                 </div>
               </div>
             </div>
          </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {posts.map(post => (
               <PostItem key={post.id} post={post} user={user} dbUser={dbUser} handleLogin={handleLogin} usersMap={usersMap} />
            ))}
          </AnimatePresence>
          {posts.length === 0 && (
             <div className="glass p-12 rounded-2xl text-center text-slate-500 border border-white/5 flex flex-col items-center">
                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                <span>لا توجد منشورات حالياً. كن أول من ينشر!</span>
             </div>
          )}
        </div>

        {/* Modal for posting */}
        <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
               onClick={() => { setIsModalOpen(false); resetForm(); }}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="glass w-full max-w-xl rounded-2xl p-6 relative z-10 shadow-2xl border border-blue-500/40"
            >
               <button onClick={() => {setIsModalOpen(false); resetForm();}} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 transition">
                 <X className="w-5 h-5" />
               </button>
               
               <h3 className="text-xl font-bold mb-4">إنشاء منشور</h3>

               {errorText && (
                 <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
                   {errorText}
                 </div>
               )}

               <div className="flex flex-col gap-4">
                 <textarea
                   placeholder="ماذا يحدث؟"
                   className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[100px] text-white placeholder-white/40"
                   value={postText}
                   onChange={e => setPostText(e.target.value)}
                   maxLength={1000}
                 />

                 {mediaType === 'image' && (
                   <div className="mt-2">
                     {!previewImage ? (
                        <label className="border-2 border-dashed border-blue-500/30 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-500/5 transition">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          <Upload className="w-8 h-8 text-blue-400 mb-2" />
                          <span className="text-sm text-blue-200/80">اختر صورة (الحد 500KB)</span>
                        </label>
                     ) : (
                        <div className="relative rounded-xl overflow-hidden shadow-lg h-48 border border-white/10">
                           <img src={previewImage} className="w-full h-full object-cover" />
                           <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-black/80 shadow-md">
                             <X className="w-4 h-4" />
                           </button>
                        </div>
                     )}
                   </div>
                 )}

                 {mediaType === 'video' && (
                    <div className="mt-2 text-sm bg-black/30 p-3 rounded-xl border border-white/5">
                      <label className="block text-slate-400 mb-2 font-bold">رابط الفيديو (YouTube)</label>
                      <input 
                        type="url" 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 shadow-inner"
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                      />
                    </div>
                 )}

                 <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-2">
                   <div className="flex gap-2">
                     <button onClick={() => setMediaType('image')} className={`p-2 rounded-full transition ${mediaType==='image'?'text-blue-400 bg-blue-500/20':'text-slate-400 hover:bg-white/5'}`}>
                       <ImageIcon className="w-5 h-5" />
                     </button>
                     <button onClick={() => setMediaType('video')} className={`p-2 rounded-full transition ${mediaType==='video'?'text-green-400 bg-green-500/20':'text-slate-400 hover:bg-white/5'}`}>
                       <Video className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <button 
                     onClick={handlePostSubmit} 
                     disabled={isUploading || (!postText.trim() && !previewImage && !videoUrl.trim())}
                     className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-full transition flex items-center justify-center shadow-lg"
                   >
                     {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : 'نشر'}
                   </button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

      </div>
  );
}

function PostItem({ post, user, dbUser, handleLogin, usersMap }: {key?: any, post:any, user:any, dbUser?:any, handleLogin:any, usersMap: Record<string, any>}) {
   const postUser = usersMap[post.userId] || null;
   const authorName = postUser?.displayName || post.author;
   const authorPhoto = postUser?.photoURL || null;

   const renderMedia = () => {
     if (post.mediaType === 'image' && post.mediaUrl) {
       return <div className="mt-3 rounded-xl overflow-hidden border border-white/10 shadow-lg"><img src={post.mediaUrl} alt="post" className="w-full object-cover max-h-[500px]" /></div>;
     }
     if (post.mediaType === 'video' && post.mediaUrl) {
       let embedUrl = post.mediaUrl;
       if (embedUrl.includes('youtube.com/watch')) {
          const urlParams = new URL(embedUrl).searchParams;
          embedUrl = `https://www.youtube.com/embed/${urlParams.get('v')}`;
       } else if (embedUrl.includes('youtu.be/')) {
          embedUrl = `https://www.youtube.com/embed/${embedUrl.split('youtu.be/')[1]}`;
       }
       
       if (embedUrl.includes('youtube.com/embed')) {
         return (
           <div className="w-full aspect-video mt-3 rounded-xl overflow-hidden border border-white/10 shadow-lg relative z-0">
             <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
           </div>
         )
       }

       return (
         <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mt-3 bg-blue-500/10 text-blue-400 p-4 rounded-xl border border-blue-500/20 text-center text-sm font-bold hover:bg-blue-500/20 transition shadow-inner">
           رابط فيديو خارجي: اضغط للمشاهدة
         </a>
       )
     }
     return null;
   }

   return (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 rounded-2xl border border-white/10 shadow-sm hover:border-white/20 transition">
       <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-blue-300 font-bold shrink-0 overflow-hidden">
            {authorPhoto ? <img src={authorPhoto} alt={authorName} className="w-full h-full object-cover" /> : authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
               <span className="font-bold text-slate-200">{authorName}</span>
               {post.createdAt?.toDate && (
                 <span className="text-[10px] text-slate-500">
                   {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
                 </span>
               )}
             </div>
             
             {post.text && <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{post.text}</p>}
             {renderMedia()}

             <div className="flex items-center gap-6 mt-4 border-t border-white/5 pt-3 select-none justify-end">
               {(user?.uid === post.userId || (dbUser && ['admin', 'owner'].includes(dbUser.role))) && (
                 <button onClick={async () => {
                   if (window.confirm('هل تريد فعلا حذف هذا المنشور؟')) {
                     try {
                       await deleteDoc(doc(db, 'posts', post.id));
                     } catch(err: any) { alert("حدث خطأ أثناء الحذف " + err.message); }
                   }
                 }} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition group mr-auto">
                   <div className="p-1.5 rounded-full group-hover:bg-red-500/20 transition"><Trash2 className="w-4 h-4" /></div>
                   <span>حذف</span>
                 </button>
               )}
             </div>
          </div>
       </div>
     </motion.div>
   )
}
