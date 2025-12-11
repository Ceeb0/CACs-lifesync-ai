import React from 'react';
import { Icons } from './Icon';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-8">
            {/* Spinner Rings */}
            <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
               <Icons.Sparkles className="w-8 h-8 text-blue-600 animate-bounce" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight animate-pulse">
            LifeSync AI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium tracking-wide uppercase text-[10px]">
            Organizing your world
          </p>
        </div>
      </div>
  );
};

export default Loader;