
import React, { useState, useRef } from 'react';
import { StockMetadata, AppState, CaptionStyle, CAPTION_STYLES, NewsCategory } from './types.ts';
import { processImageMetadata, ProcessingOptions } from './services/geminiService.ts';
import { embedMetadata } from './services/metadataService.ts';
import { EVENT_TEMPLATES } from './data/eventTemplates.ts';
import piexif from "piexifjs";

const CONCURRENCY_LIMIT = 3;

// Category colors for visual distinction
const CATEGORY_COLORS: Record<NewsCategory, string> = {
  politics: 'bg-red-100 text-red-700 border-red-200',
  sports: 'bg-green-100 text-green-700 border-green-200',
  entertainment: 'bg-purple-100 text-purple-700 border-purple-200',
  business: 'bg-blue-100 text-blue-700 border-blue-200',
  national: 'bg-amber-100 text-amber-700 border-amber-200',
  international: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  lifestyle: 'bg-pink-100 text-pink-700 border-pink-200',
  crime: 'bg-slate-100 text-slate-700 border-slate-200',
  environment: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  technology: 'bg-cyan-100 text-cyan-700 border-cyan-200'
};

const App: React.FC = () => {
  const [files, setFiles] = useState<(StockMetadata & { rawFile: File })[]>([]);
  const [userNotes, setUserNotes] = useState('');
  const [globalPhotographer, setGlobalPhotographer] = useState('Daily Star Staff');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [activeJobs, setActiveJobs] = useState(0);
  const [newTagInputs, setNewTagInputs] = useState<Record<number, string>>({});
  const [tagFilters, setTagFilters] = useState<Record<number, string>>({});
  const [editingTag, setEditingTag] = useState<{ fileIdx: number, tagIdx: number, value: string } | null>(null);
  const [isBatchArchiving, setIsBatchArchiving] = useState(false);
  const [showManifestMenu, setShowManifestMenu] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState<Record<number, boolean>>({});
  // NEW: Enhanced feature states
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('ap');
  const [highAccuracyMode, setHighAccuracyMode] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles: (StockMetadata & { rawFile: File })[] = [];

    for (const file of Array.from(e.target.files) as File[]) {
      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;

      let initialPhotographer = globalPhotographer;
      let initialCreateDate = new Date().toISOString().slice(0, 16);

      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        try {
          const exif = piexif.load(dataUrl);
          if (exif['0th'] && exif['0th'][piexif.ImageIFD.Artist]) {
            initialPhotographer = exif['0th'][piexif.ImageIFD.Artist];
          }
          if (exif['Exif'] && exif['Exif'][piexif.ExifIFD.DateTimeOriginal]) {
            const exifDate = exif['Exif'][piexif.ExifIFD.DateTimeOriginal];
            initialCreateDate = exifDate.replace(/:/g, (m: string, i: number) => i < 10 ? '-' : m).replace(' ', 'T').slice(0, 16);
          }
        } catch (e) {
          console.warn("Could not read original EXIF for", file.name);
        }
      }

      newFiles.push({
        filename: file.name,
        title: '',
        keywords: '',
        caption: '',
        photographer: initialPhotographer,
        creatorTool: 'TDS PhotoArchivePRO',
        createDate: initialCreateDate,
        modifyDate: new Date().toISOString().slice(0, 16),
        rights: `© ${initialPhotographer} / The Daily Star`,
        status: 'pending' as const,
        previewUrl: URL.createObjectURL(file),
        rawFile: file,
        isEmbedded: false
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateField = (index: number, field: keyof StockMetadata, value: any) => {
    setFiles(prev => {
      const updated = [...prev];
      if (updated[index]) {
        (updated[index] as any)[field] = value;

        // Automatically sync copyright if photographer name changes
        if (field === 'photographer') {
          updated[index].rights = `© ${value} / The Daily Star`;
        }
      }
      return updated;
    });
  };

  const addTags = (fileIndex: number) => {
    const rawInput = newTagInputs[fileIndex] || '';
    const tagsToAdd = rawInput.split(',')
      .map(t => t.trim().toLowerCase().replace(/\s+/g, ''))
      .filter(t => t.length > 0);

    if (tagsToAdd.length === 0) return;

    setFiles(prev => {
      const updated = [...prev];
      const currentTags = updated[fileIndex].keywords ? updated[fileIndex].keywords.split(',') : [];
      const newTags = [...currentTags];

      tagsToAdd.forEach(tag => {
        if (!newTags.includes(tag)) newTags.push(tag);
      });

      updated[fileIndex].keywords = newTags.join(',');
      return updated;
    });

    setNewTagInputs(prev => ({ ...prev, [fileIndex]: '' }));
  };

  const removeTag = (fileIndex: number, tagIndex: number) => {
    setFiles(prev => {
      const updated = [...prev];
      const currentTags = updated[fileIndex].keywords.split(',');
      currentTags.splice(tagIndex, 1);
      updated[fileIndex].keywords = currentTags.join(',');
      return updated;
    });
  };

  const clearTags = (fileIndex: number) => {
    if (!window.confirm("Clear all tags for this image?")) return;
    setFiles(prev => {
      const updated = [...prev];
      updated[fileIndex].keywords = '';
      return updated;
    });
  };

  const moveTag = (fileIndex: number, tagIndex: number, direction: 'left' | 'right') => {
    setFiles(prev => {
      const updated = [...prev];
      const currentTags = updated[fileIndex].keywords.split(',');
      const targetIndex = direction === 'left' ? tagIndex - 1 : tagIndex + 1;

      if (targetIndex >= 0 && targetIndex < currentTags.length) {
        const temp = currentTags[tagIndex];
        currentTags[tagIndex] = currentTags[targetIndex];
        currentTags[targetIndex] = temp;
        updated[fileIndex].keywords = currentTags.join(',');
      }
      return updated;
    });
  };

  const sortTags = (fileIndex: number) => {
    setFiles(prev => {
      const updated = [...prev];
      const currentTags = updated[fileIndex].keywords.split(',');
      updated[fileIndex].keywords = currentTags.sort().join(',');
      return updated;
    });
  };

  const saveEditedTag = () => {
    if (!editingTag) return;
    const { fileIdx, tagIdx, value } = editingTag;
    const cleanValue = value.trim().toLowerCase().replace(/\s+/g, '');

    setFiles(prev => {
      const updated = [...prev];
      const currentTags = updated[fileIdx].keywords.split(',');
      if (cleanValue) {
        currentTags[tagIdx] = cleanValue;
      } else {
        currentTags.splice(tagIdx, 1);
      }
      updated[fileIdx].keywords = currentTags.join(',');
      return updated;
    });
    setEditingTag(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const archiveImage = async (index: number, silent: boolean = false) => {
    const fileObj = files[index];
    if (fileObj.status !== 'completed' && fileObj.status !== 'embedding') return;

    setFiles(prev => {
      const updated = [...prev];
      updated[index].status = 'embedding';
      return updated;
    });

    try {
      const base64 = await fileToBase64(fileObj.rawFile);
      const embeddedDataUrl = await embedMetadata(base64, {
        title: fileObj.title,
        caption: fileObj.caption,
        keywords: fileObj.keywords,
        photographer: fileObj.photographer,
        creatorTool: fileObj.creatorTool,
        createDate: fileObj.createDate,
        modifyDate: fileObj.modifyDate,
        rights: fileObj.rights
      }, fileObj.rawFile.type);

      // Final filename: Photographername_orgingalfilename.extention
      const safePhotographer = fileObj.photographer.replace(/\s+/g, '');
      const downloadName = `${safePhotographer}_${fileObj.filename}`;

      const link = document.createElement("a");
      link.href = embeddedDataUrl;
      link.download = downloadName;
      link.click();

      setFiles(prev => {
        const updated = [...prev];
        updated[index].status = 'completed';
        updated[index].isEmbedded = true;
        return updated;
      });
    } catch (err) {
      console.error(err);
      if (!silent) alert("Archive failed. Check image format support.");
      setFiles(prev => {
        const updated = [...prev];
        updated[index].status = 'completed';
        return updated;
      });
    }
  };

  const batchArchiveAll = async () => {
    const completedIndices = files.map((f, i) => (f.status === 'completed' ? i : -1)).filter(i => i !== -1);
    if (completedIndices.length === 0) return;
    setIsBatchArchiving(true);
    for (const index of completedIndices) {
      await archiveImage(index, true);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsBatchArchiving(false);
  };

  const processSingleImage = async (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      if (updated[index]) updated[index].status = 'processing';
      return updated;
    });
    setActiveJobs(prev => prev + 1);

    try {
      const fileObj = files[index];
      const base64 = await fileToBase64(fileObj.rawFile);

      // Build processing options with new features
      const options: ProcessingOptions = {
        captionStyle,
        templateId: selectedTemplate || undefined,
        highAccuracyMode
      };

      const result = await processImageMetadata(base64, fileObj.rawFile.type, userNotes, options);

      setFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].title = result.title;
          updated[index].keywords = result.keywords;
          updated[index].caption = result.caption;
          updated[index].confidenceScore = result.confidenceScore;
          // NEW: Store enhanced metadata
          updated[index].category = result.category;
          updated[index].extractedText = result.extractedText;
          updated[index].identifiedFigures = result.identifiedFigures;
          updated[index].verificationNotes = result.verificationNotes;
          updated[index].quality = result.quality;
          updated[index].suggestedKeywords = result.suggestedKeywords;

          if (!updated[index].photographer || updated[index].photographer === 'Daily Star Staff') {
            updated[index].photographer = globalPhotographer;
            updated[index].rights = `© ${globalPhotographer} / The Daily Star`;
          }
          updated[index].status = 'completed';
        }
        return updated;
      });
    } catch (err: any) {
      setFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].status = 'error';
          updated[index].error = err.message || 'Processing failed';
        }
        return updated;
      });

    } finally {
      setActiveJobs(prev => prev - 1);
    }
  };

  const startProcessing = async () => {
    if (files.length === 0) return;
    setAppState(AppState.PROCESSING);
    const pendingIndices = files.map((f, i) => (f.status === 'pending' ? i : -1)).filter(i => i !== -1);
    const queue = [...pendingIndices];
    const workers: Promise<void>[] = [];
    const runWorker = async () => {
      while (queue.length > 0) {
        const nextIndex = queue.shift();
        if (nextIndex !== undefined) await processSingleImage(nextIndex);
      }
    };
    for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, queue.length); i++) workers.push(runWorker());
    await Promise.all(workers);
    setAppState(AppState.COMPLETED);
  };

  const exportCSV = () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return;
    const header = "filename,title,tags,comment,photographer,confidence,creatorTool,rights\n";
    const rows = completedFiles.map(f => `"${f.filename}","${f.title.replace(/"/g, '""')}","${f.keywords}","${f.caption.replace(/"/g, '""')}","${f.photographer}",${f.confidenceScore},"${f.creatorTool}","${f.rights}"`).join("\n");
    downloadFile(header + rows, `tds_manifest_${getTimestamp()}.csv`, 'text/csv');
  };

  const exportJSON = () => {
    const completedFiles = files.filter(f => f.status === 'completed').map(f => ({
      filename: f.filename, title: f.title, tags: f.keywords.split(','), editorialComment: f.caption,
      photographer: f.photographer, confidence: f.confidenceScore, archival: { creatorTool: f.creatorTool, createDate: f.createDate, modifyDate: f.modifyDate, rights: f.rights }
    }));
    if (completedFiles.length === 0) return;
    downloadFile(JSON.stringify(completedFiles, null, 2), `tds_manifest_${getTimestamp()}.json`, 'application/json');
  };

  const exportPressSheet = () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return;
    let content = `THE DAILY STAR - PHOTO ARCHIVE PRESS SHEET\nBATCH DATE: ${new Date().toLocaleDateString()}\nTOTAL ASSETS: ${completedFiles.length}\n------------------------------------------------------------\n\n`;
    completedFiles.forEach((f, idx) => {
      content += `${idx + 1}. FILENAME: ${f.filename}\n   TITLE: ${f.title}\n   CREDIT: ${f.photographer}\n   CAPTION: ${f.caption}\n   TAGS: ${f.keywords}\n   AI CONFIDENCE: ${f.confidenceScore}%\n   RIGHTS: ${f.rights}\n\n`;
    });
    content += `------------------------------------------------------------\nGenerated by TDS PhotoArchivePRO | Engineered by Imam Chowdhury\n`;
    downloadFile(content, `tds_press_sheet_${getTimestamp()}.txt`, 'text/plain');
  };

  const getTimestamp = () => new Date().toISOString().split('T')[0];

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
    setShowManifestMenu(false);
  };

  const clearAll = () => {
    if (files.length === 0) return;
    if (window.confirm("Are you sure you want to CLEAR ALL images from this batch?")) {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      setFiles([]); setAppState(AppState.IDLE); setUserNotes(''); setNewTagInputs({}); setTagFilters({});
    }
  };

  const isIdle = appState === AppState.IDLE;
  const isProcessing = appState === AppState.PROCESSING;
  const anyCompleted = files.some(f => f.status === 'completed');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-10 bg-blue-800 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200">TDS</div>
          <div>
            <h1 className="text-xl font-press text-slate-900 uppercase">PhotoArchive<span className="text-blue-700">PRO</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">The Daily Star Press Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {anyCompleted && (
            <>
              <button onClick={batchArchiveAll} disabled={isBatchArchiving} className="px-4 py-2 bg-blue-800 text-white text-xs font-black rounded-lg hover:bg-blue-900 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md active:scale-95">
                {isBatchArchiving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                BATCH DOWNLOAD
              </button>
              <div className="relative">
                <button onClick={() => setShowManifestMenu(!showManifestMenu)} className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-black transition-all flex items-center gap-2 shadow-md active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  MANIFEST TOOLS
                  <svg className={`w-3 h-3 transition-transform ${showManifestMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showManifestMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 z-50 overflow-hidden ring-4 ring-slate-900/5">
                    <button onClick={exportCSV} className="w-full px-4 py-3 text-left text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors flex items-center gap-3"><div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">CSV</div>EXCEL / DATA SHEET</button>
                    <button onClick={exportJSON} className="w-full px-4 py-3 text-left text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors flex items-center gap-3"><div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">JSON</div>DEVELOPER FORMAT</button>
                    <button onClick={exportPressSheet} className="w-full px-4 py-3 text-left text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-colors flex items-center gap-3 border-t border-slate-50"><div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg></div>PRESS SUMMARY (TXT)</button>
                  </div>
                )}
              </div>
            </>
          )}
          {files.length > 0 && !isProcessing && (
            <button onClick={clearAll} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg uppercase transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              CLEAR ALL
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 sticky top-24">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Photographer Credit</label>
              <input type="text" value={globalPhotographer} onChange={(e) => setGlobalPhotographer(e.target.value)} placeholder="Staff Name..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 outline-none transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Project Scenario</label>
              <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)} placeholder="Location, Event Name, Guest Names..." className="w-full h-24 px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 outline-none transition-all resize-none" />
            </div>

            {/* NEW: Event Template Selector */}
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Event Template</label>
              <button
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-left flex justify-between items-center hover:border-blue-400 transition-all"
              >
                <span className={selectedTemplate ? 'text-slate-900' : 'text-slate-400'}>
                  {selectedTemplate ? EVENT_TEMPLATES.find(t => t.id === selectedTemplate)?.name : 'Select template (optional)'}
                </span>
                <svg className={`w-4 h-4 transition-transform ${showTemplateMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showTemplateMenu && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                  <button onClick={() => { setSelectedTemplate(''); setShowTemplateMenu(false); }} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-400 hover:bg-slate-50">None (Auto-detect)</button>
                  {EVENT_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setShowTemplateMenu(false); }} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-t border-slate-50">
                      <span className="block">{t.name}</span>
                      <span className="text-[9px] text-slate-400">{t.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NEW: Caption Style Selector */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Caption Style</label>
              <select
                value={captionStyle}
                onChange={(e) => setCaptionStyle(e.target.value as CaptionStyle)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 outline-none transition-all"
              >
                {CAPTION_STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.description}</option>
                ))}
              </select>
            </div>

            {/* NEW: High Accuracy Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">High Accuracy Mode</span>
                <span className="text-[9px] text-amber-600">Deeper AI analysis, slower</span>
              </div>
              <button
                onClick={() => setHighAccuracyMode(!highAccuracyMode)}
                className={`w-12 h-6 rounded-full transition-all ${highAccuracyMode ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${highAccuracyMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <button onClick={startProcessing} disabled={isProcessing || files.length === 0} className="w-full py-4 bg-blue-800 hover:bg-blue-900 disabled:bg-slate-200 text-white font-black text-sm rounded-xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
              {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />ANALYZING...</> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>PROCESS BATCH</>}
            </button>
            {files.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2"><span>Batch Load</span><span>{files.length} Files</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(files.filter(f => f.status === 'completed').length / files.length) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-6">
          {isIdle && files.length === 0 && (
            <div onClick={() => fileInputRef.current?.click()} className="h-[400px] border-4 border-dashed border-slate-200 rounded-[2.5rem] bg-white flex flex-col items-center justify-center gap-6 group cursor-pointer hover:border-blue-700 transition-all">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:rotate-12 transition-all shadow-inner"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
              <div className="text-center"><h3 className="text-2xl font-black text-slate-900 uppercase">Ingest Press Archive</h3><p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Supports all image formats (JPG, PNG, WebP)</p></div>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {files.map((file, idx) => {
              const allTags = file.keywords ? file.keywords.split(',').filter(t => t.length > 0) : [];
              const filter = tagFilters[idx] || '';
              const filteredTags = allTags.map((tag, i) => ({ tag, originalIdx: i }))
                .filter(({ tag }) => tag.toLowerCase().includes(filter.toLowerCase()));
              const isAdvancedOpen = showAdvanced[idx] || false;

              return (
                <div key={idx} className={`bg-white rounded-[2rem] border overflow-hidden transition-all duration-500 shadow-sm ${file.status === 'processing' ? 'border-blue-500 ring-8 ring-blue-50 shadow-xl scale-[1.01]' : 'border-slate-200 hover:shadow-lg'}`}>
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-64 h-64 md:h-auto flex-shrink-0 relative group">
                      <img src={file.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4"><p className="text-[10px] text-white font-black uppercase tracking-tight truncate">{file.filename}</p></div>
                      {file.status === 'processing' && (
                        <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Scanning...</span>
                        </div>
                      )}
                      {file.isEmbedded && (
                        <div className="absolute top-4 left-4"><span className="bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl uppercase tracking-widest flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Archived</span></div>
                      )}
                    </div>

                    <div className="flex-1 p-8 space-y-6">
                      {file.status === 'completed' || file.status === 'embedding' ? (
                        <>
                          {/* NEW: Category Badge & Quality Indicators */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {file.category && (
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${CATEGORY_COLORS[file.category] || 'bg-slate-100 text-slate-600'}`}>
                                {file.category}
                              </span>
                            )}
                            {file.quality && (
                              <span className={`px-2 py-1 rounded-lg text-[8px] font-bold ${file.quality.printReady ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                {file.quality.sharpness} quality • {file.quality.exposure}
                              </span>
                            )}
                            {file.identifiedFigures && file.identifiedFigures.length > 0 && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-bold">
                                {file.identifiedFigures.length} person(s) identified
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Generated Title</label><input type="text" value={file.title} onChange={(e) => updateField(idx, 'title', e.target.value)} className="w-full bg-slate-50 border-0 border-b-2 border-slate-100 p-0 py-1 text-sm font-black text-slate-900 focus:border-blue-700 outline-none transition-all" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Creator Credit</label><input type="text" value={file.photographer} onChange={(e) => updateField(idx, 'photographer', e.target.value)} className="w-full bg-slate-50 border-0 border-b-2 border-slate-100 p-0 py-1 text-sm font-black text-slate-400 focus:border-blue-700 outline-none transition-all" /></div>
                          </div>

                          {/* NEW: Identified Figures Display */}
                          {file.identifiedFigures && file.identifiedFigures.length > 0 && (
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-2">AI-Identified Figures</label>
                              <div className="flex flex-wrap gap-2">
                                {file.identifiedFigures.map((figure, i) => (
                                  <span key={i} className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-800">{figure}</span>
                                ))}
                              </div>
                              {file.verificationNotes && (
                                <p className="mt-2 text-[9px] text-blue-500 italic">{file.verificationNotes.slice(0, 200)}...</p>
                              )}
                            </div>
                          )}

                          {/* NEW: Extracted Text Display */}
                          {file.extractedText && (
                            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                              <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">Extracted Text (OCR)</label>
                              <p className="text-[10px] font-medium text-amber-800">"{file.extractedText}"</p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Editorial Comment (AP Style)</label>
                            <textarea
                              value={file.caption}
                              onChange={(e) => updateField(idx, 'caption', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 leading-normal focus:border-blue-700 outline-none transition-all resize-none h-28"
                              placeholder="Full journalistic caption..."
                            />
                          </div>

                          <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <button onClick={() => setShowAdvanced(prev => ({ ...prev, [idx]: !isAdvancedOpen }))} className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-2"><svg className={`w-3 h-3 transition-transform ${isAdvancedOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>Advanced Archival Metadata (XMP/IPTC)</div>
                              <span className="text-[8px] opacity-50">Creator Tool, Rights, Dates</span>
                            </button>
                            {isAdvancedOpen && (
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white animate-in slide-in-from-top-1 duration-200">
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Creator Tool</label><input type="text" value={file.creatorTool} onChange={(e) => updateField(idx, 'creatorTool', e.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold" /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Copyright / Rights</label><input type="text" value={file.rights} onChange={(e) => updateField(idx, 'rights', e.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold" /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Create Date</label><input type="datetime-local" value={file.createDate} onChange={(e) => updateField(idx, 'createDate', e.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold" /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase">Modify Date</label><input type="datetime-local" value={file.modifyDate} onChange={(e) => updateField(idx, 'modifyDate', e.target.value)} className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold" /></div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Tags</label>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${allTags.length >= 40 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{allTags.length}/40</span>
                                <div className="flex gap-2">
                                  <button onClick={() => sortTags(idx)} className="text-[9px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded uppercase transition-colors flex items-center gap-1 shadow-sm"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>Sort A-Z</button>
                                  <button onClick={() => clearTags(idx)} className="text-[9px] font-black text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded uppercase transition-colors flex items-center gap-1 shadow-sm"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Clear All</button>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                  <input type="text" placeholder="Filter..." value={filter} onChange={(e) => setTagFilters(prev => ({ ...prev, [idx]: e.target.value }))} className="text-[10px] font-bold pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-700 outline-none transition-all w-32" />
                                  <svg className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="Add tags (news, sports...)" value={newTagInputs[idx] || ''} onChange={(e) => setNewTagInputs(prev => ({ ...prev, [idx]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addTags(idx)} className="text-[10px] font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-700 outline-none transition-all w-48" />
                                  <button onClick={() => addTags(idx)} className="w-9 h-9 bg-blue-800 hover:bg-blue-900 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-4 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-inner custom-scrollbar">
                              {filteredTags.map(({ tag, originalIdx }) => (
                                <div key={originalIdx} className={`group relative flex items-center rounded-xl px-3 py-2 transition-all border shadow-sm ${editingTag?.tagIdx === originalIdx ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                  {editingTag?.fileIdx === idx && editingTag?.tagIdx === originalIdx ? (
                                    <input autoFocus className="bg-transparent border-0 outline-none text-[10px] font-black text-blue-900 w-24" value={editingTag.value} onChange={(e) => setEditingTag({ ...editingTag, value: e.target.value })} onBlur={saveEditedTag} onKeyDown={(e) => e.key === 'Enter' && saveEditedTag()} />
                                  ) : (
                                    <span onClick={() => setEditingTag({ fileIdx: idx, tagIdx: originalIdx, value: tag })} className="text-[10px] font-black text-slate-700 cursor-text select-none">#{tag}</span>
                                  )}

                                  <div className="flex items-center ml-3 pl-2 border-l border-slate-100 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveTag(idx, originalIdx, 'left')} className="p-1 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-700 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                                    <button onClick={() => moveTag(idx, originalIdx, 'right')} className="p-1 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-700 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                                    <button onClick={() => removeTag(idx, originalIdx)} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-600 transition-colors ml-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                  </div>
                                </div>
                              ))}
                              {filteredTags.length === 0 && (
                                <div className="w-full py-6 text-center"><span className="text-[10px] text-slate-300 font-bold italic uppercase tracking-[0.2em]">{filter ? 'No matching archive tags' : 'Click "Analyze" to generate press tags'}</span></div>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-50 gap-4">
                            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">AI Press Integrity</span><span className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${file.confidenceScore && file.confidenceScore > 80 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{file.confidenceScore}% Certainty Match</span></div>
                            <button onClick={() => archiveImage(idx)} disabled={file.status === 'embedding'} className={`w-full sm:w-auto px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 ${file.status === 'embedding' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : file.isEmbedded ? 'bg-green-600 text-white shadow-green-100' : 'bg-blue-800 text-white hover:bg-blue-900 shadow-blue-100'}`}>
                              {file.status === 'embedding' ? <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>Inscribing...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>{file.isEmbedded ? 'Update Archive' : 'Embed & Download'}</>}
                            </button>
                          </div>
                        </>
                      ) : file.status === 'error' ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                          <div><p className="text-xs font-black text-blue-800 uppercase tracking-widest">{file.error}</p><button onClick={() => processSingleImage(idx)} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-black transition-all active:scale-95">Retry Scan</button></div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-center gap-6 animate-pulse py-4"><div className="h-4 w-1/3 bg-slate-100 rounded-full"></div><div className="grid grid-cols-2 gap-4"><div className="h-8 w-full bg-slate-50 rounded-xl"></div><div className="h-8 w-full bg-slate-50 rounded-xl"></div></div><div className="h-20 w-full bg-slate-100/50 rounded-3xl"></div><div className="h-24 w-full bg-slate-50 rounded-3xl"></div></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 grayscale opacity-30 group hover:grayscale-0 transition-all cursor-default">
            <div className="w-12 h-8 bg-slate-900 rounded flex items-center justify-center text-white text-[10px] font-black group-hover:bg-blue-800 transition-colors">TDS</div>
            <span className="text-[10px] font-black tracking-widest uppercase">TDS PhotoArchivePRO Engine v2.5</span>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center max-w-lg leading-relaxed">Automated newsroom archival system by The Daily Star. Supports industry standards via multi-format binary injection.<br /><span className="text-blue-700/50 mt-2 block">Engineered by Imam Chowdhury</span></p>
        </div>
      </footer>
    </div>
  );
};

export default App;
