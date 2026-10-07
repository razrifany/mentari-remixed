import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Users,
  Smile,
  Meh,
  Frown,
  Check,
  ChevronRight,
  Heart,
  Volume2,
} from 'lucide-react';
import { SicringModule, SicringComponentKey } from '../../types';
import { useApp } from '../../context/AppContext';

interface SicringModuleViewProps {
  onOpenConsultationModal: () => void;
}

export const SicringModuleView: React.FC<SicringModuleViewProps> = ({
  onOpenConsultationModal,
}) => {
  const { sicringModules, sicringLogs, recordSicringSession, currentUser } = useApp();

  const [selectedModule, setSelectedModule] = useState<SicringModule | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [isSafetyAcknowledged, setIsSafetyAcknowledged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalSecondsPlayed, setTotalSecondsPlayed] = useState(0);
  const [showMoodCheckModal, setShowMoodCheckModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<'lebih_tenang' | 'sama_saja' | 'lebih_berat'>('lebih_tenang');
  const [journalNote, setJournalNote] = useState('');

  // Weekly stats for current user
  const userLogs = sicringLogs.filter((l) => l.userId === currentUser?.id);
  const completedCount = userLogs.filter((l) => l.isCompleted).length;
  const totalMinutes = Math.round(
    userLogs.reduce((acc, curr) => acc + curr.durationSecondsPlayed, 0) / 60
  );

  // Handle module click
  const handleSelectModule = (module: SicringModule) => {
    if (module.id === 'pendampingan') {
      onOpenConsultationModal();
      return;
    }
    setSelectedModule(module);
    setShowSafetyModal(true);
    setIsSafetyAcknowledged(false);
    setCurrentStepIdx(0);
    setTotalSecondsPlayed(0);
    setIsPlaying(false);
  };

  const handleStartSession = () => {
    if (!selectedModule) return;
    setShowSafetyModal(false);
    const firstStepDuration = selectedModule.steps[0]?.durationSeconds || 60;
    setSecondsRemaining(firstStepDuration);
    setIsPlaying(true);
  };

  // Timer loop for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedModule && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
        setTotalSecondsPlayed((prev) => prev + 1);
      }, 1000);
    } else if (isPlaying && secondsRemaining === 0 && selectedModule) {
      // Step finished, move to next step or complete
      if (currentStepIdx < selectedModule.steps.length - 1) {
        const nextIdx = currentStepIdx + 1;
        setCurrentStepIdx(nextIdx);
        setSecondsRemaining(selectedModule.steps[nextIdx].durationSeconds);
      } else {
        // Completed entire session
        setIsPlaying(false);
        setShowMoodCheckModal(true);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, secondsRemaining, selectedModule, currentStepIdx]);

  const handleFinishSession = () => {
    if (!selectedModule) return;
    const totalModuleDuration = selectedModule.steps.reduce((a, b) => a + b.durationSeconds, 0);
    const isCompleted = totalSecondsPlayed >= totalModuleDuration * 0.8 || totalSecondsPlayed >= 30;

    recordSicringSession({
      userId: currentUser?.id || 'guest',
      moduleId: selectedModule.id as SicringComponentKey,
      moduleTitle: selectedModule.title,
      durationSecondsPlayed: Math.max(totalSecondsPlayed, 60),
      totalDurationSeconds: totalModuleDuration,
      isCompleted,
      postMood: selectedMood,
      journalNote: journalNote.trim() || undefined,
    });

    setShowMoodCheckModal(false);
    setSelectedModule(null);
    setJournalNote('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Banner / X3 Progress */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-100">
            <Sparkles className="w-4 h-4 text-sky-200" />
            Intervensi Mandiri SICRING
          </div>
          <h2 className="text-xl font-bold mt-1">5 Komponen Pemulihan Batin</h2>
          <p className="text-xs text-sky-100 mt-1 max-w-md leading-relaxed">
            Metode psikospiritual terpadu untuk meredakan kecemasan dan menguatkan ikatan kasih ibu-janin/bayi.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-sky-400/50">
            <div className="bg-sky-700/50 backdrop-blur-xs rounded-xl p-2.5">
              <span className="text-[11px] text-sky-200 block">Sesi Selesai</span>
              <span className="text-xl font-black text-white">{completedCount} Sesi</span>
            </div>
            <div className="bg-sky-700/50 backdrop-blur-xs rounded-xl p-2.5">
              <span className="text-[11px] text-sky-200 block">Total Menit Latihan</span>
              <span className="text-xl font-black text-white">{totalMinutes} Menit</span>
            </div>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Module Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between">
          <span>Pilih Latihan Hari Ini</span>
          <span className="text-xs text-sky-600 font-normal">Dosis harian 1-2 sesi</span>
        </h3>

        {sicringModules.map((module) => {
          const isPendampingan = module.id === 'pendampingan';
          const logsForThis = userLogs.filter((l) => l.moduleId === module.id);
          const hasDone = logsForThis.length > 0;

          return (
            <div
              key={module.id}
              onClick={() => handleSelectModule(module)}
              className="group bg-white rounded-2xl border border-sky-100 hover:border-sky-300 p-4 transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 transition-transform group-hover:scale-105 ${
                    isPendampingan
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {module.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                      {module.title}
                    </h4>
                    {hasDone && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        Pernah
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{module.subtitle}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                    <span>⏱ {module.durationMinutes} menit</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      {module.targetAudience === 'ibu_dan_pendamping' ? (
                        <>
                          <Users className="w-3 h-3 text-amber-500" /> Bersama Suami/Keluarga
                        </>
                      ) : (
                        <>
                          <Heart className="w-3 h-3 text-sky-500" /> Mandiri di Rumah
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-sky-50 group-hover:bg-sky-600 text-sky-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Guideline Modal */}
      {showSafetyModal && selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 p-6 text-slate-800">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Panduan Keamanan {selectedModule.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Demi keselamatan Ibu dan buah hati, mohon perhatikan petunjuk di bawah sebelum memulai:
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 my-4 text-xs text-amber-900 leading-relaxed">
              <strong className="block text-amber-950 mb-1">Catatan Keamanan Klinis:</strong>
              {selectedModule.safetyGuideline}
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSafetyAcknowledged}
                onChange={(e) => setIsSafetyAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-sky-600 rounded-xs border-slate-300 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 leading-tight">
                Saya memahami petunjuk keamanan ini dan siap melakukan latihan dalam posisi nyaman.
              </span>
            </label>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!isSafetyAcknowledged}
                onClick={handleStartSession}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                  isSafetyAcknowledged
                    ? 'bg-sky-600 hover:bg-sky-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Mulai Latihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Player */}
      {selectedModule && !showSafetyModal && !showMoodCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-sky-50/90 border-b border-sky-100 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  Latihan Sedang Berlangsung
                </span>
                <h3 className="font-bold text-slate-900 text-base">{selectedModule.title}</h3>
              </div>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setShowMoodCheckModal(true);
                }}
                className="text-xs bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600"
              >
                Selesaikan Sesi
              </button>
            </div>

            {/* Breathing Animation Visualizer */}
            <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-sky-50/50 to-white">
              <div className="relative flex items-center justify-center w-48 h-48 my-2">
                {/* Outer pulsing ring */}
                <div
                  className={`absolute inset-0 rounded-full bg-sky-200/50 transition-all duration-1000 ${
                    isPlaying ? 'animate-ping opacity-30' : ''
                  }`}
                />
                {/* Middle breathing circle */}
                <div
                  className={`w-36 h-36 rounded-full bg-sky-400/20 border-2 border-sky-400 flex items-center justify-center transition-transform duration-1000 ${
                    isPlaying ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl font-black text-sky-800 tracking-tight">
                      {formatTime(secondsRemaining)}
                    </span>
                    <span className="block text-[10px] uppercase font-bold text-sky-600 mt-1">
                      {isPlaying ? 'Tarik & Hembuskan' : 'Dijeda'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audio tone simulator */}
              <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100 mt-2">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Relaksasi Gelombang Alfa & Suara Alam</span>
              </div>
            </div>

            {/* Step Instructions */}
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 mb-2">
                <span>
                  Langkah {currentStepIdx + 1} dari {selectedModule.steps.length}
                </span>
                <span>
                  {selectedModule.steps[currentStepIdx]?.title}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 leading-relaxed shadow-2xs">
                {selectedModule.steps[currentStepIdx]?.instruction}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSecondsRemaining(selectedModule.steps[currentStepIdx]?.durationSeconds || 60);
                }}
                className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                title="Ulangi Langkah Ini"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-sky-200 transition-all text-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Jeda Sejenak</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Lanjutkan Latihan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentStepIdx < selectedModule.steps.length - 1) {
                    const next = currentStepIdx + 1;
                    setCurrentStepIdx(next);
                    setSecondsRemaining(selectedModule.steps[next].durationSeconds);
                  } else {
                    setIsPlaying(false);
                    setShowMoodCheckModal(true);
                  }
                }}
                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Langkah Berikut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Rating & Reflection Modal (Feeds into Research X3 log) */}
      {showMoodCheckModal && selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 p-6 text-slate-800">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Latihan Selesai! Bagaimana Perasaan Ibu?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Catatan ini membantu Ibu dan Bidan memantau efektivitas modul SICRING.
            </p>

            {/* 3 Mood Choices */}
            <div className="grid grid-cols-3 gap-2.5 my-4">
              <button
                type="button"
                onClick={() => setSelectedMood('lebih_tenang')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  selectedMood === 'lebih_tenang'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Smile className="w-7 h-7 text-emerald-500" />
                <span className="text-xs font-bold">Lebih Tenang</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMood('sama_saja')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  selectedMood === 'sama_saja'
                    ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Meh className="w-7 h-7 text-sky-500" />
                <span className="text-xs font-bold">Sama Saja</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMood('lebih_berat')}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  selectedMood === 'lebih_berat'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Frown className="w-7 h-7 text-amber-500" />
                <span className="text-xs font-bold">Lebih Berat</span>
              </button>
            </div>

            {/* Optional Reflection Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Jurnal Refleksi Singkat (Opsional):
              </label>
              <textarea
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                rows={2}
                placeholder="Contoh: Pundak terasa lebih ringan setelah napas 4-4-6..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={handleFinishSession}
              className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl text-sm shadow-md shadow-sky-200 transition-colors"
            >
              Simpan & Catat Kemajuan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
