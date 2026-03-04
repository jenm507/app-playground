import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Trophy,
    Settings,
    RefreshCw,
    Play,
    Pause,
    CheckCircle2,
    AlertCircle,
    Eye,
    Clock,
    LayoutGrid,
    Maximize2,
    ChevronDown
} from 'lucide-react';

// --- VISUALLY DIVERSE EMOJI BANK ---
const EMOJI_POOL = [
    '🎯', '⭐', '💎', '🍀', '🍎', '⚽', '🌙', '☀️',
    '🦋', '🦞', 'REX', '🚲', '🎸', '🗼', '🛸', '🌵',
    '🕸️', '🧬', '🧭', '🎇', '🎲', '🧩', '🥨', '🧶',
    '♻️', '🔱', '🌀', '⚛️', '☣️', '☯️', '🧿', '💢'
];

const STREAK_FOR_DIFFICULTY = 6; // Shrink every 6 matches
const SHRINK_AMOUNT = 0.97; // 3% shrink

const App = () => {
    // --- SESSION CONFIG STATE ---
    const [targetMinutes, setTargetMinutes] = useState(5);
    const [selectedGrid, setSelectedGrid] = useState('auto');

    // --- GAME STATE ---
    const [gameState, setGameState] = useState('menu'); // menu, playing, complete
    const [gridConfig, setGridConfig] = useState({ rows: 3, cols: 2 });
    const [scaleFactor, setScaleFactor] = useState(1.0);
    const [paddingScale, setPaddingScale] = useState(1.0);
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [consecutiveMatches, setConsecutiveMatches] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [difficultyLevel, setDifficultyLevel] = useState(1);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    });

    // --- WINDOW RESIZE HANDLING ---
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- GRID CALCULATION ---
    const determineGridConfig = useCallback(() => {
        if (selectedGrid !== 'auto') {
            // Expecting value format "rowsxcols"
            const [r, c] = selectedGrid.split('x').map(Number);
            return { rows: r, cols: c };
        }

        // Auto Logic
        if (windowSize.width < 640) return { rows: 3, cols: 2 };
        if (windowSize.width < 1024) return { rows: 4, cols: 3 };
        return { rows: 4, cols: 4 };
    }, [windowSize, selectedGrid]);

    const tileDimensions = useMemo(() => {
        const headerHeight = windowSize.width < 640 ? 48 : 64;
        const paddingBuffer = 40;

        const availWidth = (windowSize.width - paddingBuffer);
        const availHeight = (windowSize.height - headerHeight - paddingBuffer);

        const baseTileW = (availWidth / gridConfig.cols);
        const baseTileH = (availHeight / gridConfig.rows);

        const size = Math.min(baseTileW, baseTileH) * 0.92 * scaleFactor;
        const gap = (size * 0.12) * paddingScale;

        return { size, gap };
    }, [windowSize, gridConfig, scaleFactor, paddingScale]);

    // --- GAME LOGIC ---
    const generateBoard = useCallback((config = gridConfig) => {
        const totalCells = config.rows * config.cols;
        const pairCount = Math.floor(totalCells / 2);

        const shuffledPool = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
        let selectedEmojis = [];
        for (let i = 0; i < pairCount; i++) {
            const emoji = shuffledPool[i % shuffledPool.length];
            selectedEmojis.push(emoji, emoji);
        }

        if (selectedEmojis.length < totalCells) {
            selectedEmojis.push(shuffledPool[pairCount % shuffledPool.length]);
        }

        const shuffled = selectedEmojis
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({
                id: index,
                emoji,
                isMatched: false
            }));

        setCards(shuffled);
        setFlipped([]);
    }, [gridConfig]);

    const startGame = () => {
        const config = determineGridConfig();
        setGridConfig(config);
        setGameState('playing');
        setTotalSeconds(0);
        setConsecutiveMatches(0);
        setDifficultyLevel(1);
        setScaleFactor(1.0);
        setPaddingScale(1.0);
        generateBoard(config);
    };

    const handleCardClick = (id) => {
        if (isPaused || flipped.length === 2 || cards[id].isMatched || flipped.includes(id)) return;

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            const [firstId, secondId] = newFlipped;
            if (cards[firstId].emoji === cards[secondId].emoji) {
                setTimeout(() => {
                    setCards(prev => {
                        const nextCards = prev.map(card =>
                            (card.id === firstId || card.id === secondId)
                                ? { ...card, isMatched: true }
                                : card
                        );
                        if (nextCards.every(c => c.isMatched)) {
                            setTimeout(() => generateBoard(), 400);
                        }
                        return nextCards;
                    });
                    setFlipped([]);
                    handleProgression(true);
                }, 500);
            } else {
                setTimeout(() => {
                    setFlipped([]);
                    handleProgression(false);
                }, 800);
            }
        }
    };

    const handleProgression = (isSuccess) => {
        if (isSuccess) {
            setConsecutiveMatches(prev => {
                const next = prev + 1;
                if (next >= STREAK_FOR_DIFFICULTY) {
                    adaptDifficulty();
                    return 0;
                }
                return next;
            });
        } else {
            setConsecutiveMatches(0);
        }
    };

    const adaptDifficulty = () => {
        setDifficultyLevel(d => d + 1);
        setScaleFactor(prev => Math.max(0.15, prev * SHRINK_AMOUNT));
        setPaddingScale(prev => Math.max(0.15, prev * (SHRINK_AMOUNT + 0.01)));
    };

    const bailOut = () => {
        setScaleFactor(1.0);
        setPaddingScale(1.0);
        setConsecutiveMatches(0);
    };

    // --- TIMER ---
    useEffect(() => {
        let interval;
        if (gameState === 'playing' && !isPaused) {
            interval = setInterval(() => {
                setTotalSeconds(s => {
                    if (s >= targetMinutes * 60) {
                        setGameState('complete');
                        return s;
                    }
                    return s + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, isPaused, targetMinutes]);

    const formatTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-white font-sans text-slate-900 select-none overflow-hidden flex flex-col">
            <header className="h-12 sm:h-16 border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between bg-white z-10 shadow-sm transition-all">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-blue-600 p-1 rounded sm:p-1.5 sm:rounded-lg">
                        <Eye className="text-white w-4 h-4 sm:w-5 h-5" />
                    </div>
                    <h1 className="text-sm sm:text-lg font-black tracking-tight uppercase">
                        AVT <span className="text-blue-600">Active</span>
                    </h1>
                </div>

                {gameState === 'playing' && (
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="bg-slate-100 px-3 sm:px-4 py-1 rounded-full flex items-center gap-1.5 sm:gap-2">
                            <Clock className="w-3.5 h-3.5 sm:w-4 h-4 text-blue-600" />
                            <span className="font-mono font-bold text-xs sm:text-base">{formatTime(totalSeconds)} / {targetMinutes}:00</span>
                        </div>
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            {isPaused ? <Play className="w-5 h-5 sm:w-6 h-6 fill-current text-blue-600" /> : <Pause className="w-5 h-5 sm:w-6 h-6 fill-current text-slate-400" />}
                        </button>
                    </div>
                )}
            </header>

            <main className="flex-1 relative flex items-center justify-center bg-slate-50/50 overflow-auto p-2 sm:p-4">
                {gameState === 'menu' && (
                    <div className="max-w-md w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 sm:w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <Settings className="w-6 h-6 sm:w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6">Session Setup</h2>

                        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 text-left">
                            <div>
                                <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1.5 sm:mb-2 ml-1">Training Duration</label>
                                <div className="relative">
                                    <select
                                        value={targetMinutes}
                                        onChange={(e) => setTargetMinutes(Number(e.target.value))}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold appearance-none focus:border-blue-500 outline-none cursor-pointer text-sm sm:text-base"
                                    >
                                        <option value={3}>3 Minutes</option>
                                        <option value={5}>5 Minutes</option>
                                        <option value={10}>10 Minutes</option>
                                        <option value={15}>15 Minutes</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 h-5" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1.5 sm:mb-2 ml-1">Initial Grid Layout</label>
                                <div className="relative">
                                    <select
                                        value={selectedGrid}
                                        onChange={(e) => setSelectedGrid(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold appearance-none focus:border-blue-500 outline-none cursor-pointer text-sm sm:text-base"
                                    >
                                        <option value="auto">Auto (responsive)</option>
                                        <option value="3x2">2x3 (small portrait)</option>
                                        <option value="2x3">3x2 (small landscape)</option>
                                        <option value="4x3">3x4 (portrait)</option>
                                        <option value="3x4">4x3 (landscape)</option>
                                        <option value="4x4">4x4 (max size)</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3"
                        >
                            <Play className="fill-current w-5 h-5 sm:w-6 h-6" /> START TRAINING
                        </button>
                        <p className="mt-4 sm:mt-6 text-[9px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                            Patch Strong Eye • Focus Near
                        </p>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-start pointer-events-none z-10">
                            <div className="bg-white/95 backdrop-blur px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-md flex items-center gap-3 sm:gap-5 pointer-events-auto">
                                <div className="text-center">
                                    <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Level</span>
                                    <span className="text-base sm:text-xl font-black text-blue-600 leading-none">{difficultyLevel}</span>
                                </div>
                                <div className="w-px h-6 sm:h-8 bg-slate-200" />
                                <div className="text-center">
                                    <span className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5">Streak</span>
                                    <div className="flex gap-1 sm:gap-1.5">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${consecutiveMatches > i ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={bailOut}
                                className="bg-red-600 text-white px-3 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black shadow-lg shadow-red-200 pointer-events-auto flex items-center gap-1.5 sm:gap-2 hover:bg-red-700 active:scale-95 transition-all"
                            >
                                <AlertCircle className="w-3 h-3 sm:w-4 h-4" /> <span className="hidden sm:inline">RESET TILE SIZE</span><span className="sm:hidden">RESET</span>
                            </button>
                        </div>

                        <div
                            className="transition-all duration-700 ease-in-out"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                                gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                                gap: `${tileDimensions.gap}px`,
                            }}
                        >
                            {cards.map((card, idx) => {
                                const isSelected = flipped.includes(idx);
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleCardClick(idx)}
                                        className={`
                      relative cursor-pointer transition-all duration-200 flex items-center justify-center rounded-[20%]
                      ${card.isMatched ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100'}
                      ${isSelected
                                                ? 'bg-blue-600 scale-105 ring-4 sm:ring-8 ring-blue-100 shadow-2xl z-20'
                                                : 'bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 shadow-sm'}
                    `}
                                        style={{
                                            width: `${tileDimensions.size}px`,
                                            height: `${tileDimensions.size}px`,
                                        }}
                                    >
                                        <span
                                            className={`select-none leading-none transition-all ${isSelected ? 'scale-110 brightness-200' : ''}`}
                                            style={{ fontSize: `${tileDimensions.size * 0.6}px` }}
                                        >
                                            {card.emoji}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {isPaused && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-16 h-16 sm:w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                                    <Pause className="w-8 h-8 sm:w-12 h-12 text-blue-600 fill-current" />
                                </div>
                                <h3 className="text-2xl sm:text-4xl font-black mb-6 sm:mb-8">Training Paused</h3>
                                <button
                                    onClick={() => setIsPaused(false)}
                                    className="bg-blue-600 text-white px-8 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black text-xl sm:text-2xl shadow-xl shadow-blue-100"
                                >
                                    RESUME
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'complete' && (
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl text-center border border-slate-100">
                        <div className="w-16 h-16 sm:w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                            <Trophy className="w-8 h-8 sm:w-12 h-12 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black mb-3 text-slate-900">Session Done!</h2>
                        <p className="text-sm sm:text-base text-slate-500 mb-8 sm:mb-10 font-medium">Excellent dedication to your visual health.</p>
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl mb-8 sm:mb-10 flex justify-around">
                            <div>
                                <span className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">Minutes</span>
                                <span className="text-xl sm:text-2xl font-black text-slate-800">{targetMinutes}</span>
                            </div>
                            <div className="w-px h-8 sm:h-10 bg-slate-200 my-auto" />
                            <div>
                                <span className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">Max Level</span>
                                <span className="text-xl sm:text-2xl font-black text-blue-600">{difficultyLevel}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setGameState('menu')}
                            className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:bg-black transition-all flex items-center justify-center gap-2 sm:gap-3"
                        >
                            <RefreshCw className="w-4 h-4 sm:w-5 h-5" /> RESTART SESSION
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;