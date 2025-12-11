import React, { useState, useEffect, useRef } from 'react';
import { Reminder, ReminderCategory, Priority, User } from '../types';
import { Icons } from './Icon';
import { parseNaturalLanguageReminder, getCategoryTip, transcribeAudio } from '../services/geminiService';
import Clock from './Clock';
import SettingsModal from './SettingsModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  toggleTheme: () => void;
  setThemeMode: (dark: boolean) => void;
  isDarkMode: boolean;
  onSetBackground: (url: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

// Sound Assets
const SOUNDS = {
  // Success chime for completion
  complete: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', 
  // Bell ring for alarms
  alarm: 'https://assets.mixkit.co/active_storage/sfx/1862/1862-preview.mp3'
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, toggleTheme, setThemeMode, isDarkMode, onSetBackground, setGlobalLoading }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | ReminderCategory>('All');
  
  // Track which reminders have already rung to avoid repeat ringing
  const notifiedRef = useRef<Set<string>>(new Set());
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Form State
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual');
  const [aiInput, setAiInput] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ReminderCategory>(ReminderCategory.FOOD);
  const [formPriority, setFormPriority] = useState<Priority>(Priority.MEDIUM);
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  // Init some fake data
  useEffect(() => {
    setReminders([
      { id: '1', title: 'Meal Prep: Chicken & Rice', category: ReminderCategory.FOOD, priority: Priority.HIGH, completed: false, date: new Date().toISOString(), createdAt: Date.now() },
      { id: '2', title: 'Leg Day Workout', category: ReminderCategory.GYM, priority: Priority.MEDIUM, completed: false, date: new Date(Date.now() + 86400000).toISOString(), createdAt: Date.now() }
    ]);
  }, []);

  // Sound Helper
  const playSound = (url: string) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play blocked or failed:', err));
  };

  // Alarm Check Loop
  useEffect(() => {
      const checkAlarms = () => {
          const now = Date.now();
          reminders.forEach(r => {
              if (r.completed) return;
              
              const reminderTime = new Date(r.date).getTime();
              // If time is passed but was within the last 60 seconds, and we haven't rung yet
              if (reminderTime <= now && reminderTime > now - 60000) {
                  if (!notifiedRef.current.has(r.id)) {
                      playSound(SOUNDS.alarm);
                      notifiedRef.current.add(r.id);
                  }
              }
          });
      };

      // Check every 5 seconds
      const intervalId = setInterval(checkAlarms, 5000);
      return () => clearInterval(intervalId);
  }, [reminders]);

  const handleDelete = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setReminders(prev => prev.map(r => {
        if (r.id === id) {
            const isNowComplete = !r.completed;
            if (isNowComplete) {
                playSound(SOUNDS.complete);
            }
            return { ...r, completed: isNowComplete };
        }
        return r;
    }));
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory(ReminderCategory.FOOD);
    setFormPriority(Priority.MEDIUM);
    setFormDate('');
    setFormTime('');
    setAiInput('');
    setInputMode('manual');
    setShowAddModal(false);
    stopRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          
          setGlobalLoading(true);
          try {
             const text = await transcribeAudio(base64String, mimeType);
             setAiInput(prev => {
                 const newText = prev.trim() ? `${prev} ${text}` : text;
                 return newText;
             });
          } catch (e) {
             console.error(e);
          } finally {
             setGlobalLoading(false);
          }
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const handleAddReminder = async () => {
    setGlobalLoading(true);
    
    try {
      if (inputMode === 'ai' && aiInput) {
        const parsed = await parseNaturalLanguageReminder(aiInput);
        
        const newReminder: Reminder = {
          id: Date.now().toString(),
          title: parsed.title,
          category: parsed.category,
          priority: parsed.priority,
          description: parsed.description,
          completed: false,
          createdAt: Date.now(),
          date: parsed.suggestedTime || new Date().toISOString()
        };

        // Artificial delay to show off the loader
        await new Promise(resolve => setTimeout(resolve, 1500));

        setReminders(prev => [newReminder, ...prev]);
        
        // Fetch a tip for the user silently or display in toast in future
        // const newTip = await getCategoryTip(parsed.category);
        
        resetForm();
        
      } else {
        // Manual add
        if (!formTitle) return;
        const dateObj = (formDate && formTime) ? new Date(`${formDate}T${formTime}`) : new Date();
        
        const newReminder: Reminder = {
          id: Date.now().toString(),
          title: formTitle,
          category: formCategory,
          priority: formPriority,
          completed: false,
          createdAt: Date.now(),
          date: dateObj.toISOString()
        };
        
        // Artificial delay to show off the loader
        await new Promise(resolve => setTimeout(resolve, 1500));

        setReminders(prev => [newReminder, ...prev]);
        resetForm();
      }
    } catch (error) {
        alert("Error creating task. Please try again.");
    } finally {
        setGlobalLoading(false);
    }
  };

  const getCategoryIcon = (cat: ReminderCategory) => {
    switch (cat) {
      case ReminderCategory.FOOD: return <Icons.Utensils className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case ReminderCategory.GYM: return <Icons.Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case ReminderCategory.WORK: return <Icons.Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case ReminderCategory.HEALTH: return <Icons.HeartPulse className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <Icons.MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getCategoryColor = (cat: ReminderCategory) => {
    switch (cat) {
      case ReminderCategory.FOOD: return 'bg-green-100/50 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case ReminderCategory.GYM: return 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case ReminderCategory.WORK: return 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case ReminderCategory.HEALTH: return 'bg-red-100/50 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'text-red-500 dark:text-red-400 font-bold';
      case Priority.MEDIUM: return 'text-yellow-600 dark:text-yellow-400 font-medium';
      case Priority.LOW: return 'text-slate-500 dark:text-slate-400';
    }
  };

  const filteredReminders = activeTab === 'All' 
    ? reminders 
    : reminders.filter(r => r.category === activeTab);

  const totalCompleted = reminders.filter(r => r.completed).length;
  const totalPending = reminders.length - totalCompleted;

  return (
    <div className="min-h-screen pb-20 md:pb-0 flex flex-col md:flex-row transition-colors bg-transparent">
      
      {/* Sidebar / Mobile Top Bar - Glass Effect */}
      <div className="md:w-64 md:h-screen z-20 flex flex-col border-r border-white/20 dark:border-slate-700/30 transition-colors glass sticky top-0">
        <div className="p-6 border-b border-white/20 dark:border-slate-700/30 flex justify-between items-center md:block">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{user.username}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back!</p>
                </div>
            </div>
            <div className="flex items-center gap-2 md:hidden">
                 <button onClick={() => setShowSettingsModal(true)} className="p-2 text-slate-500 hover:text-blue-500 dark:text-slate-400">
                     <Icons.Settings className="w-5 h-5" />
                 </button>
            </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 hidden md:block">
             <div className="flex justify-between items-center mb-4 pl-2 pr-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categories</div>
                <button onClick={() => setShowSettingsModal(true)} className="p-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors">
                     <Icons.Settings className="w-4 h-4" />
                </button>
             </div>
            
            {(Object.values(ReminderCategory) as ReminderCategory[]).map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === cat ? 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 font-semibold shadow-sm border border-blue-100/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                >
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                </button>
            ))}
             <button
                    onClick={() => setActiveTab('All')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'All' ? 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 font-semibold shadow-sm border border-blue-100/20' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                >
                    <Icons.MoreHorizontal className="w-5 h-5" />
                    <span>All Tasks</span>
                </button>
        </nav>

        <div className="p-4 border-t border-white/20 dark:border-slate-700/30 hidden md:block">
            <button onClick={onLogout} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-2 w-full rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20">
                <Icons.LogOut className="w-5 h-5" />
                <span className="font-medium">Log Out</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto h-screen no-scrollbar">
        
        <Clock />

        {/* Header Stats - Glass Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <div className="glass p-4 rounded-2xl shadow-lg transition-colors group hover:-translate-y-1 duration-300">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{reminders.length}</p>
             </div>
             <div className="glass p-4 rounded-2xl shadow-lg transition-colors group hover:-translate-y-1 duration-300">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-500 drop-shadow-sm">{totalPending}</p>
             </div>
             <div className="glass p-4 rounded-2xl shadow-lg transition-colors group hover:-translate-y-1 duration-300">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-500 drop-shadow-sm">{totalCompleted}</p>
             </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 cursor-pointer hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center text-white border border-white/10"
             >
                <Icons.Plus className="w-6 h-6 mb-1" />
                <span className="font-bold text-sm">New Task</span>
             </button>
        </div>

        {/* Mobile Category Pills */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
            <button onClick={() => setActiveTab('All')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all backdrop-blur-md ${activeTab === 'All' ? 'bg-slate-800/90 dark:bg-slate-100/90 text-white dark:text-slate-900 shadow-lg' : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 border border-white/20'}`}>All</button>
            {(Object.values(ReminderCategory) as ReminderCategory[]).map(cat => (
                 <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all backdrop-blur-md ${activeTab === cat ? 'bg-slate-800/90 dark:bg-slate-100/90 text-white dark:text-slate-900 shadow-lg' : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 border border-white/20'}`}>{cat}</button>
            ))}
        </div>

        {/* Reminder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
            {filteredReminders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 glass rounded-3xl">
                    <Icons.Sparkles className="w-12 h-12 mb-4 text-slate-400 dark:text-slate-500 opacity-50" />
                    <p className="text-slate-600 dark:text-slate-300">No tasks found for {activeTab}.</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline">Create one now</button>
                </div>
            ) : (
                filteredReminders.map(reminder => (
                    <div key={reminder.id} className={`group relative glass rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${reminder.completed ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border border-white/10 ${getCategoryColor(reminder.category)}`}>
                                {reminder.category}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleToggleComplete(reminder.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-transparent ${reminder.completed ? 'bg-green-500 text-white shadow-md' : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-400'}`}
                                >
                                    <Icons.Check className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(reminder.id)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 md:opacity-0 opacity-100"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <h3 className={`font-bold text-lg text-slate-800 dark:text-white mb-1 ${reminder.completed ? 'line-through decoration-2 decoration-slate-300 dark:decoration-slate-600' : ''}`}>
                            {reminder.title}
                        </h3>
                        
                        {reminder.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">{reminder.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/20 dark:border-slate-700/20">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <Icons.Clock className="w-3 h-3" />
                                {new Date(reminder.date).toLocaleDateString()} • {new Date(reminder.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span className={`text-xs uppercase tracking-wider ${getPriorityColor(reminder.priority)}`}>
                                {reminder.priority}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
          <SettingsModal 
            onClose={() => setShowSettingsModal(false)}
            setThemeMode={setThemeMode}
            isDarkMode={isDarkMode}
            onSetBackground={onSetBackground}
          />
      )}

      {/* Add Modal - Glassmorphism */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-white/20 dark:border-slate-700/50">
                
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white">New Task</h3>
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Close</button>
                </div>

                <div className="p-6">
                     {/* Toggle Mode */}
                     <div className="flex gap-2 mb-6 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        <button 
                            onClick={() => setInputMode('manual')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${inputMode === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Manual
                        </button>
                        <button 
                            onClick={() => setInputMode('ai')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${inputMode === 'ai' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <Icons.Sparkles className="w-4 h-4" />
                            Smart Add
                        </button>
                     </div>

                     {inputMode === 'ai' ? (
                         <div className="space-y-4">
                             <div className="relative">
                                 <textarea
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    disabled={isRecording}
                                    placeholder="e.g., Reminder to meal prep chicken salad for lunch next Monday at 9am, high priority."
                                    className={`w-full h-40 p-4 pb-12 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 placeholder:text-slate-400 transition-all ${isRecording ? 'ring-2 ring-red-500/50 border-red-500/50 bg-red-50/10' : ''}`}
                                 ></textarea>
                                 
                                 {/* Mic Button */}
                                 <button
                                    onClick={toggleRecording}
                                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'}`}
                                    title={isRecording ? "Stop Recording" : "Start Voice Input"}
                                 >
                                     {isRecording ? <Icons.Square className="w-5 h-5" /> : <Icons.Mic className="w-5 h-5" />}
                                 </button>
                                 
                                 {isRecording && (
                                     <span className="absolute bottom-4 right-14 text-xs font-semibold text-red-500 animate-pulse">Recording...</span>
                                 )}
                             </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400">
                                 Powered by Gemini. Type naturally or use voice to describe your task.
                             </p>
                         </div>
                     ) : (
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Title</label>
                                 <input 
                                    type="text" 
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white"
                                    placeholder="What do you need to do?"
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
                                     <select 
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value as ReminderCategory)}
                                        className="w-full px-4 py-2 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white"
                                     >
                                         {Object.values(ReminderCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Priority</label>
                                     <select 
                                        value={formPriority}
                                        onChange={(e) => setFormPriority(e.target.value as Priority)}
                                        className="w-full px-4 py-2 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white"
                                     >
                                         {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                     </select>
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
                                     <input 
                                        type="date"
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Time</label>
                                     <input 
                                        type="time"
                                        value={formTime}
                                        onChange={(e) => setFormTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white"
                                     />
                                 </div>
                             </div>
                         </div>
                     )}
                </div>

                <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 flex justify-end gap-3">
                    <button onClick={resetForm} className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors">Cancel</button>
                    <button 
                        onClick={handleAddReminder}
                        disabled={(inputMode === 'manual' && !formTitle) || (inputMode === 'ai' && !aiInput)}
                        className={`px-6 py-2 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all transform active:scale-95 ${inputMode === 'ai' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {inputMode === 'ai' ? 'Generate Task' : 'Add Task'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;