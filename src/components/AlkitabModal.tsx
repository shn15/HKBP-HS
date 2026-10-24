import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Search,
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Languages,
  BookMarked,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  ALKITAB_BOOKS_CATALOG,
  AlkitabBookInfo,
  DualAlkitabVerse,
  fetchDualAlkitabChapter,
  parseAlkitabReference,
  findBookByName
} from '../services/alkitabService';

interface AlkitabModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectVerseText?: (text: string) => void;
  onSelectVerse?: (verseText: string, referenceLabel: string) => void;
}

export default function AlkitabModal({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectVerseText,
  onSelectVerse
}: AlkitabModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [languageMode, setLanguageMode] = useState<'both' | 'indo' | 'batak'>('both');
  const [testamentFilter, setTestamentFilter] = useState<'all' | 'PL' | 'PB'>('all');

  // Selected book and chapter for browsing mode
  // Default to Yohanes / Johanes (id '43')
  const defaultBook = ALKITAB_BOOKS_CATALOG.find(b => b.id === '43') || ALKITAB_BOOKS_CATALOG[0];
  const [selectedBook, setSelectedBook] = useState<AlkitabBookInfo>(defaultBook);
  const [selectedChapter, setSelectedChapter] = useState<number>(3);

  // Loaded Verses State
  const [displayedVerses, setDisplayedVerses] = useState<DualAlkitabVerse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchSummary, setSearchSummary] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Filter books by testamen and search input
  const filteredBooks = useMemo(() => {
    return ALKITAB_BOOKS_CATALOG.filter(k => {
      if (testamentFilter !== 'all' && k.testament !== testamentFilter) return false;
      return true;
    });
  }, [testamentFilter]);

  // Load verses when modal opens or book/chapter changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialQuery) {
      setSearchQuery(initialQuery);
      handleExecuteSearch(initialQuery);
    } else {
      loadChapter(selectedBook, selectedChapter);
    }
  }, [isOpen, initialQuery]);

  const loadChapter = async (book: AlkitabBookInfo, chapter: number, startVerse?: number, endVerse?: number) => {
    setIsLoading(true);
    try {
      let verses = await fetchDualAlkitabChapter(book, chapter);
      if (startVerse && startVerse > 0) {
        const lastVerse = endVerse || startVerse;
        verses = verses.filter(v => v.verse >= startVerse && v.verse <= lastVerse);
        setSearchSummary(
          `${book.indonesia} (${book.batak}) ${chapter}:${startVerse}${
            lastVerse > startVerse ? '-' + lastVerse : ''
          }`
        );
      } else {
        setSearchSummary(`${book.indonesia} (${book.batak}) - Pasal ${chapter}`);
      }
      setDisplayedVerses(verses);
    } catch (err) {
      console.error('Error loading Alkitab chapter:', err);
      setDisplayedVerses([]);
      setSearchSummary(`Gagal memuat pasal ${chapter}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSearch = async (q: string) => {
    if (!q.trim()) {
      loadChapter(selectedBook, selectedChapter);
      return;
    }

    const parsed = parseAlkitabReference(q);
    if (parsed && parsed.book) {
      setSelectedBook(parsed.book);
      setSelectedChapter(parsed.chapter);
      await loadChapter(parsed.book, parsed.chapter, parsed.startVerse, parsed.endVerse);
    } else {
      // Search by book name
      const matchedBook = findBookByName(q);
      if (matchedBook) {
        setSelectedBook(matchedBook);
        setSelectedChapter(1);
        await loadChapter(matchedBook, 1);
      } else {
        setIsLoading(true);
        setSearchSummary(`Pencarian "${q}" - mencari nats Alkitab...`);
        // Fallback load current chapter
        await loadChapter(selectedBook, selectedChapter);
      }
    }
  };

  const handleCopyVerse = (verse: DualAlkitabVerse, index: number) => {
    const textToCopy = `[${selectedBook.indonesia} / ${selectedBook.batak} ${selectedChapter}:${verse.verse}]\nBahasa Indonesia: "${verse.textIndo}"\nBibel Batak: "${verse.textBatak}"`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);

    const fullFormatted = `${selectedBook.indonesia} ${selectedChapter}:${verse.verse} — ${verse.textIndo}`;
    if (onSelectVerseText) {
      onSelectVerseText(fullFormatted);
    }
    if (onSelectVerse) {
      onSelectVerse(
        `${verse.textIndo}\n\n(Bibel Batak): ${verse.textBatak}`,
        `${selectedBook.indonesia} ${selectedChapter}:${verse.verse}`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden font-sans"
        >
          {/* MODAL HEADER */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                <BookOpen className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md tracking-wider">
                    Official HKBP CDN API
                  </span>
                  <a
                    href="https://hkbp.or.id/alkitab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-200 hover:text-white flex items-center space-x-1 underline font-medium"
                  >
                    <span>hkbp.or.id/alkitab</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-0.5 tracking-tight">
                  Alkitab Terjemahan Baru & Bibel Batak Toba
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SEARCH & FILTER TOOLBAR */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch(searchQuery);
                  }
                }}
                placeholder="Cari nats/ayat (contoh: Yohanes 3:16, Johanes 3:16, Mateus 5:13-16, Psalmen 23:1, 1 Musa 1:1)..."
                className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-24 py-2.5 text-xs text-slate-800 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-sm"
              >
                Cari Nats
              </button>
            </div>

            {/* QUICK BOOK & CHAPTER SELECTOR STRIP */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                {/* Book Select */}
                <select
                  value={selectedBook.id}
                  onChange={(e) => {
                    const k = ALKITAB_BOOKS_CATALOG.find(x => x.id === e.target.value);
                    if (k) {
                      setSelectedBook(k);
                      setSelectedChapter(1);
                      setSearchQuery('');
                      loadChapter(k, 1);
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  {filteredBooks.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.indonesia} / {k.batak} ({k.testament})
                    </option>
                  ))}
                </select>

                {/* Chapter Select */}
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setSelectedChapter(p);
                    setSearchQuery('');
                    loadChapter(selectedBook, p);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  {Array.from({ length: selectedBook.totalChapters }, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>
                      Pasal {p}
                    </option>
                  ))}
                </select>

                {/* Previous & Next Chapter Buttons */}
                <button
                  type="button"
                  disabled={selectedChapter <= 1}
                  onClick={() => {
                    const prev = Math.max(1, selectedChapter - 1);
                    setSelectedChapter(prev);
                    loadChapter(selectedBook, prev);
                  }}
                  className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-xl transition text-slate-700 cursor-pointer shadow-2xs"
                  title="Pasal Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={selectedChapter >= selectedBook.totalChapters}
                  onClick={() => {
                    const next = Math.min(selectedBook.totalChapters, selectedChapter + 1);
                    setSelectedChapter(next);
                    loadChapter(selectedBook, next);
                  }}
                  className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-xl transition text-slate-700 cursor-pointer shadow-2xs"
                  title="Pasal Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Testament Filter Toggler */}
                <div className="flex items-center space-x-1 bg-slate-200/80 p-0.5 rounded-xl border border-slate-300 shrink-0">
                  <button
                    onClick={() => setTestamentFilter('all')}
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-lg cursor-pointer transition ${testamentFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Semua (66)
                  </button>
                  <button
                    onClick={() => setTestamentFilter('PL')}
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-lg cursor-pointer transition ${testamentFilter === 'PL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Padan Robi (39)
                  </button>
                  <button
                    onClick={() => setTestamentFilter('PB')}
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-lg cursor-pointer transition ${testamentFilter === 'PB' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Padan Imbaru (27)
                  </button>
                </div>
              </div>

              {/* Language Display Mode Toggle */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setLanguageMode('both')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition cursor-pointer ${
                    languageMode === 'both' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paralel (Indo & Batak)
                </button>
                <button
                  onClick={() => setLanguageMode('indo')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition cursor-pointer ${
                    languageMode === 'indo' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bahasa Indonesia (TB)
                </button>
                <button
                  onClick={() => setLanguageMode('batak')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition cursor-pointer ${
                    languageMode === 'batak' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bibel Batak Toba
                </button>
              </div>
            </div>
          </div>

          {/* DISPLAY VERSE LIST */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
            {searchSummary && (
              <div className="text-xs font-bold text-slate-700 bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{searchSummary}</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 font-black px-2 py-0.5 rounded-lg uppercase">
                  HKBP Official CDN
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-slate-600">
                  Mengambil nats Alkitab & Bibel dari CDN HKBP...
                </p>
              </div>
            ) : displayedVerses.length > 0 ? (
              displayedVerses.map((v, index) => (
                <div
                  key={v.verse}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 hover:border-blue-300 transition group"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {v.verse}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        {selectedBook.indonesia} ({selectedBook.batak}) {selectedChapter}:{v.verse}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyVerse(v, index)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-extrabold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Nats</span>
                          </>
                        )}
                      </button>

                      {(onSelectVerseText || onSelectVerse) && (
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyVerse(v, index);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          Terapkan
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {(languageMode === 'both' || languageMode === 'indo') && (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="text-[10px] font-extrabold uppercase text-blue-700 mb-1 flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-blue-600" />
                          <span>Bahasa Indonesia (Terjemahan Baru)</span>
                        </div>
                        {v.titleIndo && (
                          <h5 className="text-xs font-black text-slate-900 mb-1">{v.titleIndo}</h5>
                        )}
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans font-medium">
                          {v.textIndo}
                        </p>
                      </div>
                    )}

                    {(languageMode === 'both' || languageMode === 'batak') && (
                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                        <div className="text-[10px] font-extrabold uppercase text-amber-800 mb-1 flex items-center space-x-1">
                          <BookMarked className="w-3 h-3 text-amber-700" />
                          <span>Bibel Bahasa Batak Toba</span>
                        </div>
                        {v.titleBatak && (
                          <h5 className="text-xs font-black text-slate-900 mb-1">{v.titleBatak}</h5>
                        )}
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sans font-semibold">
                          {v.textBatak}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2 shadow-2xs">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-slate-700">Nats atau Ayat Tidak Ditemukan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Coba ketik nama kitab, pasal, dan ayat secara spesifik (contoh: <span className="font-bold text-slate-800">Yohanes 3:16</span>, <span className="font-bold text-slate-800">Mateus 5:13</span>, <span className="font-bold text-slate-800">Psalmen 23:1</span>, <span className="font-bold text-slate-800">1 Musa 1:1</span>).
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-slate-600 font-medium">
              Terintegrasi langsung dengan CDN Alkitab & Bibel HKBP: <a href="https://hkbp.or.id/alkitab" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-extrabold">https://hkbp.or.id/alkitab</a>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Tutup Modal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
