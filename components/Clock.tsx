import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';

const QUOTES = [
  "Time is what we want most, but what we use worst.",
  "The future depends on what you do today.",
  "Don't watch the clock; do what it does. Keep going.",
  "Your time is limited, so don't waste it living someone else's life.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue.",
  "Believe you can and you're halfway there.",
  "It always seems impossible until it's done.",
  "Action is the foundational key to all success.",
  "Don't wait. The time will never be just right.",
  "You are never too old to set another goal or to dream a new dream.",
  "Energy and persistence conquer all things.",
  "Perseverance is not a long race; it is many short races one after the other.",
  "Small deeds done are better than great deeds planned.",
  "Productivity is being able to do things that you were never able to do before.",
  "Focus on being productive instead of busy.",
  "Until we can manage time, we can manage nothing else.",
  "Lost time is never found again.",
  "You may delay, but time will not.",
  "He who has a why to live can bear almost any how.",
  "Discipline is choosing between what you want now and what you want most.",
  "The best way to predict the future is to create it.",
  "Well done is better than well said.",
  "Quality is not an act, it is a habit."
];

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTime(now);
        // Update quote based on the current hour (0-23)
        const hour = now.getHours();
        setQuote(QUOTES[hour % QUOTES.length]);
    }, 1000);
    
    // Initial set
    setQuote(QUOTES[new Date().getHours() % QUOTES.length]);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass w-full rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl transition-all hover:shadow-2xl overflow-hidden relative group">
      
      {/* Decorative background blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/30 transition-all duration-500"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-400/30 transition-all duration-500"></div>

      <div className="flex flex-col items-center md:items-start z-10">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-2 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <Icons.Clock className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Local Time</h2>
        </div>
        <div className="flex items-baseline gap-1 text-slate-800 dark:text-white drop-shadow-sm">
            <span className="text-6xl md:text-8xl font-bold font-mono tracking-tighter leading-none">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <span className="text-2xl md:text-3xl font-mono text-slate-500 dark:text-slate-400 font-medium opacity-80 w-[2ch]">
                :{time.toLocaleTimeString([], { second: '2-digit' }).split(' ')[0].split(':')[2] || '00'}
            </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-medium mt-2 text-lg px-1">
            {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <div className="hidden md:block h-20 w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent mx-4"></div>
      
      <div className="text-center md:text-right max-w-sm z-10 relative">
         <Icons.Sparkles className="w-6 h-6 text-yellow-500 absolute -top-6 -right-2 md:right-0 opacity-50 animate-pulse" />
         <p className="text-lg md:text-xl text-slate-700 dark:text-slate-200 italic font-serif leading-relaxed drop-shadow-sm">
           "{quote}"
         </p>
         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide font-semibold opacity-70">
             Daily Wisdom
         </p>
      </div>
    </div>
  );
};

export default Clock;