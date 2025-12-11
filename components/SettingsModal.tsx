import React, { useRef } from 'react';
import { Icons } from './Icon';

interface SettingsModalProps {
  onClose: () => void;
  setThemeMode: (dark: boolean) => void;
  isDarkMode: boolean;
  onSetBackground: (url: string) => void;
}

interface ThemePreset {
  name: string;
  mode: 'light' | 'dark';
  bg: string;
  previewColor: string;
}

const THEMES: ThemePreset[] = [
  { 
      name: 'Default Light', 
      mode: 'light', 
      bg: '', 
      previewColor: 'bg-gradient-to-br from-blue-100 to-pink-100' 
  },
  { 
      name: 'Default Dark', 
      mode: 'dark', 
      bg: '', 
      previewColor: 'bg-gradient-to-br from-slate-900 to-indigo-950' 
  },
  { 
      name: 'Ocean Breeze', 
      mode: 'light', 
      bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2946&auto=format&fit=crop',
      previewColor: 'bg-blue-300'
  },
  { 
      name: 'Midnight Space', 
      mode: 'dark', 
      bg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2944&auto=format&fit=crop',
      previewColor: 'bg-indigo-900'
  },
  { 
      name: 'Forest Mist', 
      mode: 'light', 
      bg: 'https://images.unsplash.com/photo-1519681393798-3828fb4090bb?q=80&w=2940&auto=format&fit=crop',
      previewColor: 'bg-green-300'
  },
  { 
      name: 'Urban Sunset', 
      mode: 'dark', 
      bg: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2940&auto=format&fit=crop',
      previewColor: 'bg-orange-900'
  },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, setThemeMode, isDarkMode, onSetBackground }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSetBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeClick = (theme: ThemePreset) => {
      setThemeMode(theme.mode === 'dark');
      onSetBackground(theme.bg);
  };

  const setRandomBackground = () => {
    // Just pick a random image from the presets for now, or an external source
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    if (randomTheme.bg) {
        onSetBackground(randomTheme.bg);
    } else {
        // Fallback to a nice image if random picked a default gradient
        onSetBackground('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2940&auto=format&fit=crop');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-white/20 dark:border-slate-700/50">
        
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                <Icons.Settings className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Theme Gallery</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          
          {/* Themes Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Curated Themes</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Current: {isDarkMode ? 'Dark' : 'Light'} Mode</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {THEMES.map((theme, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleThemeClick(theme)}
                        className="group relative flex flex-col items-center gap-2 p-2 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105"
                    >
                        <div 
                            className={`w-full aspect-video rounded-lg shadow-sm group-hover:shadow-md transition-all bg-cover bg-center border border-slate-200 dark:border-slate-700 overflow-hidden relative ${theme.previewColor}`}
                            style={theme.bg ? { backgroundImage: `url(${theme.bg})` } : {}}
                        >
                            {/* Badge for Light/Dark */}
                            <div className="absolute top-2 right-2 p-1 bg-black/20 backdrop-blur-md rounded-full">
                                {theme.mode === 'dark' 
                                    ? <Icons.Moon className="w-3 h-3 text-white" /> 
                                    : <Icons.Sun className="w-3 h-3 text-white" />}
                            </div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{theme.name}</span>
                    </button>
                ))}
            </div>
          </section>

          {/* Advanced Customization */}
          <section className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Custom Override</h4>
            <p className="text-xs text-slate-500 mb-4">Manually override the theme background with your own image.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                    onClick={setRandomBackground}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all group"
                >
                    <Icons.Shuffle className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                    <span className="font-medium text-slate-600 dark:text-slate-300">Random Wallpaper</span>
                </button>
                
                <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-all group"
                >
                    <Icons.Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                    <span className="font-medium text-slate-600 dark:text-slate-300">Upload Image</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;