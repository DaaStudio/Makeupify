import React, { useState, useEffect } from 'react';
import { Language, Gender, MakeupMethod, Translation } from './types';
import { TRANSLATIONS, MAKEUP_PRESETS, QUICK_TAGS } from './constants';
import LanguageSelector from './components/LanguageSelector';
import ImageUploader from './components/ImageUploader';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import { generateMakeup } from './services/geminiService';

type PostAdAction = 'generate' | 'download';

const App: React.FC = () => {
  // --- State ---
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [step, setStep] = useState<number>(1);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [method, setMethod] = useState<MakeupMethod>(MakeupMethod.PRESET);
  
  // Method Inputs
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // UI States
  const [isRecommendationOpen, setIsRecommendationOpen] = useState<boolean>(false);
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [postAdAction, setPostAdAction] = useState<PostAdAction>('generate');

  // Result
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t: Translation = TRANSLATIONS[language];
  const isRTL = language === Language.AR;

  // --- Effects ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Handlers ---

  const handleGenerateClick = () => {
    setPostAdAction('generate');
    setShowAdModal(true);
  };

  const handleDownloadClick = () => {
    setPostAdAction('download');
    setShowAdModal(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleWatchAd = () => {
    // 1. Close the modal state
    setShowAdModal(false);
    
    // 2. Open new tab with message
    const adWindow = window.open('', '_blank');
    if (adWindow) {
        adWindow.document.write(`
          <html>
            <head>
              <title>${t.adWatching}</title>
              <style>
                body { 
                  font-family: sans-serif; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  height: 100vh; 
                  background: #f3f4f6; 
                  color: #4b5563; 
                  margin: 0;
                }
                @media (prefers-color-scheme: dark) {
                  body { background: #111827; color: #e5e7eb; }
                }
                h1 { font-size: 2rem; }
              </style>
            </head>
            <body>
              <h1>${t.adWatching}</h1>
            </body>
          </html>
        `);
        
        // 3. Wait 5 seconds, close tab, perform action
        setTimeout(() => {
            adWindow.close();
            if (postAdAction === 'generate') {
              startGeneration();
            } else if (postAdAction === 'download') {
              performDownload();
            }
        }, 5000);
    } else {
        // Fallback if popup blocked
        alert("Popup blocked. Continuing anyway.");
        if (postAdAction === 'generate') {
          startGeneration();
        } else if (postAdAction === 'download') {
          performDownload();
        }
    }
  };

  const handleCancelAd = () => {
    setShowAdModal(false);
  };

  const startGeneration = async () => {
    if (!originalImage || !gender) return;

    setIsLoading(true);
    setError(null);
    setStep(4); // Move to loading/result screen

    try {
      let prompt = "";
      if (method === MakeupMethod.PRESET && selectedPreset) {
        const preset = MAKEUP_PRESETS.find(p => p.id === selectedPreset);
        prompt = preset ? preset.prompt : "";
      } else if (method === MakeupMethod.TEXT) {
        prompt = textPrompt;
      }

      const result = await generateMakeup({
        originalImage,
        method: method === MakeupMethod.TRANSFER ? 'transfer' : 'text',
        prompt,
        referenceImage: referenceImage || undefined,
        gender
      });

      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const performDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'makeupify-makeover.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetApp = () => {
    setStep(1);
    setOriginalImage(null);
    setGender(null);
    setGeneratedImage(null);
    setSelectedPreset(null);
    setTextPrompt('');
    setReferenceImage(null);
    setIsRecommendationOpen(false);
  };

  const addTagToPrompt = (tagValue: string) => {
    setTextPrompt(prev => {
        const trimmed = prev.trim();
        if (trimmed.length > 0 && !trimmed.endsWith(',')) {
            return `${trimmed}, ${tagValue}`;
        }
        return `${trimmed} ${tagValue}`;
    });
  };

  // --- Render Steps ---

  // Step 1: Upload
  const renderStep1 = () => (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 transition-colors">
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">{t.uploadStep}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t.uploadDesc}</p>
        <ImageUploader 
          label={t.uploadStep} 
          onImageSelected={(img) => {
            setOriginalImage(img);
            setStep(2);
          }} 
        />
      </div>
    </div>
  );

  // Step 2: Gender
  const renderStep2 = () => (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 transition-colors">
        <button onClick={() => setStep(1)} className="text-sm text-purple-600 dark:text-purple-400 mb-4 font-medium flex items-center hover:underline">
           &larr; {t.back}
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{t.genderStep}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => { setGender(Gender.FEMALE); setStep(3); }}
            className="flex flex-col items-center justify-center p-6 border-2 border-purple-100 dark:border-purple-900 rounded-2xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all group"
          >
            <span className="text-4xl mb-3">👩</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">{t.female}</span>
          </button>
          <button 
            onClick={() => { setGender(Gender.MALE); setStep(3); }}
            className="flex flex-col items-center justify-center p-6 border-2 border-purple-100 dark:border-purple-900 rounded-2xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all group"
          >
            <span className="text-4xl mb-3">👨</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">{t.male}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Step 3: Method Selection
  const renderStep3 = () => (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 md:p-8 relative transition-colors">
        <button onClick={() => setStep(2)} className="text-sm text-purple-600 dark:text-purple-400 mb-4 font-medium flex items-center hover:underline">
           &larr; {t.back}
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{t.methodStep}</h2>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
          {[MakeupMethod.PRESET, MakeupMethod.TEXT, MakeupMethod.TRANSFER].map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setError(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                method === m 
                  ? 'bg-white dark:bg-slate-600 text-purple-700 dark:text-purple-300 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {m === MakeupMethod.PRESET && t.methodPreset}
              {m === MakeupMethod.TEXT && t.methodText}
              {m === MakeupMethod.TRANSFER && t.methodTransfer}
            </button>
          ))}
        </div>

        {/* Collapsible Recommendation Tip */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg mb-6 overflow-hidden">
           <button 
            onClick={() => setIsRecommendationOpen(!isRecommendationOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
           >
             <div className="flex items-center gap-2">
               <span className="text-purple-600 dark:text-purple-400">💡</span>
               <span className="text-sm font-bold text-purple-900 dark:text-purple-200">{t.recommendationTitle}</span>
             </div>
             <span className={`text-purple-600 dark:text-purple-400 transform transition-transform ${isRecommendationOpen ? 'rotate-180' : ''}`}>▼</span>
           </button>
           {isRecommendationOpen && (
             <div className="px-4 pb-4 pt-0">
               <p className="text-sm text-purple-800 dark:text-purple-200 italic border-t border-purple-200 dark:border-purple-800 pt-2">
                 {t.recommendationBody}
               </p>
             </div>
           )}
        </div>

        {/* Dynamic Content */}
        <div className="mb-8 min-h-[200px]">
          {method === MakeupMethod.PRESET && (
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Styles</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MAKEUP_PRESETS.filter(p => p.gender.includes(gender!) && p.category === 'style').map((preset) => (
                        <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        className={`p-3 text-left rounded-xl border-2 transition-all ${
                            selectedPreset === preset.id 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' 
                            : 'border-gray-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-700'
                        }`}
                        >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mb-2"></div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">{t.presets[preset.labelKey]}</span>
                        </button>
                    ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Retouch & Fix</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MAKEUP_PRESETS.filter(p => p.gender.includes(gender!) && p.category === 'retouch').map((preset) => (
                        <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        className={`p-3 text-left rounded-xl border-2 transition-all ${
                            selectedPreset === preset.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                            : 'border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700'
                        }`}
                        >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 mb-2 flex items-center justify-center text-white text-xs">✨</div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">{t.presets[preset.labelKey]}</span>
                        </button>
                    ))}
                    </div>
                </div>
            </div>
          )}

          {method === MakeupMethod.TEXT && (
            <div>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder={t.textPlaceholder}
                className="w-full h-32 p-4 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none mb-3"
              />
              <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t.quickTagsLabel}</span>
                  <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => addTagToPrompt(tag.value)}
                            className="px-3 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 rounded-full text-xs font-medium transition-colors border border-gray-200 dark:border-slate-600"
                          >
                              + {t.tags[tag.labelKey]}
                          </button>
                      ))}
                  </div>
              </div>
            </div>
          )}

          {method === MakeupMethod.TRANSFER && (
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{t.methodTransferDesc}</p>
              {referenceImage ? (
                 <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                   <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                   <button 
                    onClick={() => setReferenceImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     ✕
                   </button>
                 </div>
              ) : (
                <ImageUploader 
                  label={t.transferPlaceholder} 
                  onImageSelected={setReferenceImage} 
                  compact 
                />
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerateClick}
          disabled={
            (method === MakeupMethod.PRESET && !selectedPreset) ||
            (method === MakeupMethod.TEXT && !textPrompt.trim()) ||
            (method === MakeupMethod.TRANSFER && !referenceImage)
          }
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {t.generate}
        </button>

      </div>
    </div>
  );

  // Step 4: Loading & Result
  const renderStep4 = () => (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
       <button onClick={() => setStep(3)} className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium flex items-center hover:text-gray-800 dark:hover:text-gray-200 md:hidden">
           &larr; {t.back}
        </button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 transition-colors">
           <div className="relative w-24 h-24 mb-6">
             <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-100 dark:border-purple-900 rounded-full"></div>
             <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-600 rounded-full animate-spin"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">✨</div>
           </div>
           <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 animate-pulse">{t.generating}</h3>
           <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs">AI is analyzing your features and applying the look...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center transition-colors">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">
            ⚠️
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t.error}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4">
             <button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700">{t.back}</button>
             <button onClick={handleGenerateClick} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">{t.retry}</button>
          </div>
        </div>
      )}

      {/* Success State */}
      {!isLoading && !error && generatedImage && originalImage && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-colors">
          <div className="p-4 md:p-8 flex flex-col md:flex-row gap-8 items-start">
            
            {/* Main Visual */}
            <div className="w-full md:w-2/3">
              <BeforeAfterSlider beforeImage={originalImage} afterImage={generatedImage} />
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
               <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl mb-4">
                 <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-1">Result Ready!</h4>
                 <p className="text-sm text-purple-700 dark:text-purple-400">Drag the slider to see the magic.</p>
               </div>

               <button 
                onClick={handleDownloadClick}
                className="w-full py-3 bg-gray-900 dark:bg-slate-950 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-md"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 {t.download}
               </button>

               <button 
                 onClick={handleGenerateClick} 
                 className="w-full py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
               >
                 {t.retry} / Re-run
               </button>

               <button 
                 onClick={resetApp} 
                 className="w-full py-3 text-purple-600 dark:text-purple-400 font-medium hover:underline"
               >
                 {t.startOver}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20 transition-colors duration-300">
      <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
      
      {/* Theme Toggle Button - Positioned top left */}
      <button 
        onClick={toggleTheme}
        className="absolute top-4 left-4 z-50 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-md text-gray-700 dark:text-yellow-400 border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle Theme"
      >
        {theme === 'light' ? (
          // Moon icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          // Sun icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        )}
      </button>

      <header className="pt-12 pb-8 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-2 tracking-tight">
          {t.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-light text-lg">{t.subtitle}</p>
      </header>

      <main className="container mx-auto px-4 pb-20">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>

      {/* Ad Modal */}
      {showAdModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 rounded-3xl backdrop-blur-sm bg-white/60 dark:bg-black/60">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-purple-100 dark:border-slate-700 animate-fade-in transform scale-100 transition-colors">
                  <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                          📺
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{t.adModalTitle}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                          {t.adModalBody}
                      </p>
                      <div className="flex gap-3">
                          <button 
                              onClick={handleCancelAd}
                              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          >
                              {t.no}
                          </button>
                          <button 
                              onClick={handleWatchAd}
                              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
                          >
                              {t.yes}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;