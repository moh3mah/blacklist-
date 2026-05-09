import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Upload } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface Props {
  dbUser: any;
  onClose: () => void;
}

export default function ProfileSettings({ dbUser, onClose }: Props) {
  const [displayName, setDisplayName] = useState(dbUser.displayName || '');
  const [previewImage, setPreviewImage] = useState<string | null>(dbUser.photoURL || null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        setErrorText("حجم الصورة يجب أن لا يتجاوز 500 كيلوبايت");
        return;
      }
      setErrorText('');
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorText("الاسم مطلوب");
      return;
    }
    setIsSaving(true);
    setErrorText('');

    try {
      await updateDoc(doc(db, 'users', dbUser.id), {
        displayName: displayName.trim(),
        photoURL: previewImage || ''
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorText("فشل حفظ التغييرات: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="absolute inset-0 bg-black/80 backdrop-blur-sm"
         onClick={onClose}
      />
      <motion.div 
         initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
         className="glass w-full max-w-md rounded-2xl p-6 relative z-10 shadow-2xl border border-blue-500/40"
      >
         <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 transition">
           <X className="w-5 h-5" />
         </button>
         
         <h3 className="text-xl font-bold mb-6 text-center text-blue-300">إعدادات الحساب</h3>

         {errorText && (
           <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
             {errorText}
           </div>
         )}

         <div className="flex flex-col gap-5">
           <div className="flex flex-col items-center gap-3">
             <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/50 bg-slate-800">
               {previewImage ? (
                 <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-blue-300 font-bold text-2xl">
                   {displayName.charAt(0).toUpperCase()}
                 </div>
               )}
               <label className="absolute inset-x-0 bottom-0 bg-black/60 h-1/3 flex items-center justify-center cursor-pointer hover:bg-black/80 transition text-white">
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                 <Upload className="w-4 h-4" />
               </label>
             </div>
             <p className="text-xs text-slate-400">اضغط لرفع صورة جديدة (اختياري)</p>
           </div>

           <div>
             <label className="block text-slate-400 text-sm mb-2 font-bold">الاسم</label>
             <input 
               type="text"
               value={displayName}
               onChange={e => setDisplayName(e.target.value)}
               className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 shadow-inner"
               maxLength={50}
             />
           </div>

           <button 
             onClick={handleSave}
             disabled={isSaving || !displayName.trim()}
             className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 mt-4 rounded-xl transition flex items-center justify-center shadow-lg"
           >
             {isSaving ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><Save className="w-4 h-4 ml-2" /> حفظ التغييرات</>}
           </button>
         </div>
      </motion.div>
    </div>
  );
}
