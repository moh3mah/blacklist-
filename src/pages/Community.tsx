import React from 'react';
import PostFeed from '../components/PostFeed';

interface Props {
  user: any;
  dbUser?: any;
  handleLogin: () => void;
}

export default function Community({ user, dbUser, handleLogin }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="w-full flex flex-col gap-4">
         <div className="flex items-center gap-2 mb-2 bg-gradient-to-r from-blue-900/50 to-transparent p-4 rounded-xl border-l-4 border-blue-500 glass">
           <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">التايم لاين</h2>
         </div>
         <PostFeed user={user} dbUser={dbUser} handleLogin={handleLogin} />
      </div>
    </div>
  );
}
