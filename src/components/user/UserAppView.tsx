import React, { useState } from 'react';
import {
  Home,
  Heart,
  Activity,
  User as UserIcon,
  Phone,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Shield,
  HeartPulse,
  LayoutDashboard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EPDSScreeningResult } from '../../types';
import { EpdsScreeningModal } from './EpdsScreeningModal';
import { EpdsResultModal } from './EpdsResultModal';
import { SicringModuleView } from './SicringModuleView';
import { UserHistoryView } from './UserHistoryView';
import { UserConsultationModal } from './UserConsultationModal';
import { UserProfileModal } from './UserProfileModal';
import { EmergencyHelpModal } from './EmergencyHelpModal';

interface UserAppViewProps {
  onSwitchToAdmin: () => void;
}

export const UserAppView: React.FC<UserAppViewProps> = ({ onSwitchToAdmin }) => {
  const { currentUser, tpmbList, articles, cases, logout } = useApp();

  const [activeTab, setActiveTab] = useState<'beranda' | 'latihan' | 'riwayat'>('beranda');

  // Modals state
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [screeningResult, setScreeningResult] = useState<EPDSScreeningResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  const currentTpmb = tpmbList.find((t) => t.id === currentUser?.tpmbId) || tpmbList[0];

  // Check if current user has an active open case
  const userActiveCase = cases.find(
    (c) => c.userId === currentUser?.id && (c.status === 'baru' || c.status === 'dikonfirmasi')
  );

  const handleScreeningFinished = (result: EPDSScreeningResult) => {
    setIsScreeningOpen(false);
    setScreeningResult(result);
    setIsResultOpen(true);
  };

  const gestationalWeeks = currentUser?.gestationalWeeks ?? 26;
  const postpartumDays = currentUser?.postpartumDays ?? 14;
  const isPregnant = currentUser?.perinatalStage === 'hamil';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start">
      {/* Centered Mobile-First Proportional Layout Container */}
      <div className="w-full max-w-lg mx-auto bg-white min-h-screen shadow-xs border-x border-slate-200/70 flex flex-col relative">
        
        {/* Sticky App Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 px-4 py-3 sm:px-5 shadow-2xs">
          <div className="flex items-center justify-between">
            {/* Logo & Clinic info */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-sky-200">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-slate-800 text-base tracking-tight leading-tight">
                    MENTARI
                  </h1>
                  <span className="text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                    {currentUser?.responderCode || 'MNT-001'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                  {currentTpmb.name}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Emergency SOS Button */}
              <button
                type="button"
                onClick={() => setIsEmergencyOpen(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Bantuan Darurat Psikologis & Telepon Bidan"
              >
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                <span className="font-semibold text-xs">Bantuan</span>
              </button>

              {/* Switch to Admin Dashboard */}
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 p-2 rounded-xl transition-colors shadow-2xs"
                title="Buka Dashboard Bidan/Admin"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>

              {/* Profile button */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors font-bold text-xs"
                title="Profil & Consent"
              >
                {currentUser?.name ? currentUser.name.charAt(0) : <UserIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Perinatal Status Pill Banner */}
          <div className="mt-2.5 bg-gradient-to-r from-sky-50 via-sky-50/70 to-white border border-sky-200/80 rounded-2xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block leading-tight">
                  {isPregnant
                    ? `Fase Kehamilan: Usia ${gestationalWeeks} Minggu`
                    : `Fase Nifas: Hari ke-${postpartumDays} Pasca Persalinan`}
                </span>
                <span className="text-[11px] text-sky-700">
                  {isPregnant ? `HPL: ${currentUser?.hpl || '12 Jan 2027'}` : `Bidan: ${currentTpmb.midwifeName}`}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Aktif Terpantau
            </span>
          </div>
        </header>

        {/* Emergency Alert Banner if Case is Active */}
        {userActiveCase && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium text-[11px]">
                Kasus aktif terdeteksi. Bidan sedang menyiapkan tindak lanjut.
              </span>
            </div>
            <button
              onClick={() => setIsEmergencyOpen(true)}
              className="text-rose-700 font-bold underline text-[11px] shrink-0 ml-2"
            >
              Hubungi Bidan
            </button>
          </div>
        )}

        {/* Main Tab Content Body (Natural Window Scroll, Proper Mobile Proportions) */}
        <main className="flex-1 p-4 pb-24 sm:p-5 sm:pb-28">
          {activeTab === 'beranda' && (
            <div className="space-y-4">
              {/* Daily Action Card: EPDS Screening */}
              <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-100/50 rounded-3xl p-5 border-2 border-sky-200 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-sky-200/60">
                      Aksi Utama Hari Ini
                    </span>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800 mt-2">
                      Cek Kabar Singkat (EPDS)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
                      Bagaimana perasaan Ibu selama 7 hari terakhir? Hanya 10 pertanyaan santai, kurang dari 4 menit.
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-sky-200">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Instrumen standar tervalidasi
                  </span>
                  <button
                    onClick={() => setIsScreeningOpen(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-sky-200 transition-all active:scale-95"
                  >
                    <span>Mulai Cek Kabar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Access SICRING Card */}
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    Latihan Ketenangan SICRING
                  </h3>
                  <button
                    onClick={() => setActiveTab('latihan')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    Lihat Semua (5)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setActiveTab('latihan')}
                    className="p-3 bg-sky-50/70 hover:bg-sky-100/70 rounded-2xl border border-sky-100 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-900 block">Olah Tubuh</span>
                    <span className="text-[11px] text-slate-500">Pernapasan diafragma 4-4-6</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('latihan')}
                    className="p-3 bg-purple-50/70 hover:bg-purple-100/70 rounded-2xl border border-purple-100 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-900 block">Charging Ruhani</span>
                    <span className="text-[11px] text-slate-500">Afirmasi cinta diri & doa</span>
                  </div>
                </div>
              </div>

              {/* Educational Articles */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    Edukasi Kesehatan Jiwa Ibu
                  </h3>
                  <span className="text-[11px] text-slate-400">Ditinjau oleh Bidan</span>
                </div>

                {articles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="bg-white rounded-2xl border border-slate-200 p-3.5 hover:border-sky-300 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                        {art.category} &bull; {art.readTime}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {art.summary}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'latihan' && (
            <SicringModuleView
              onOpenConsultationModal={() => setIsConsultationOpen(true)}
            />
          )}

          {activeTab === 'riwayat' && (
            <UserHistoryView onStartScreening={() => setIsScreeningOpen(true)} />
          )}
        </main>

        {/* Proportional Fixed Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 z-40 flex items-center justify-around shadow-lg select-none">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'beranda'
                ? 'text-sky-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px]">Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('latihan')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'latihan'
                ? 'text-sky-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[11px]">SICRING</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'riwayat'
                ? 'text-sky-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[11px]">Riwayat</span>
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-600 font-medium transition-colors"
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[11px]">Profil</span>
          </button>
        </nav>
      </div>

      {/* Modals */}
      <EpdsScreeningModal
        isOpen={isScreeningOpen}
        onClose={() => setIsScreeningOpen(false)}
        onFinished={handleScreeningFinished}
      />

      <EpdsResultModal
        result={screeningResult}
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        onStartSicring={() => {
          setIsResultOpen(false);
          setActiveTab('latihan');
        }}
        onOpenEmergency={() => {
          setIsResultOpen(false);
          setIsEmergencyOpen(true);
        }}
      />

      <EmergencyHelpModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <UserConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={logout}
      />

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 p-6 text-slate-800 flex flex-col max-h-[85vh]">
            <span className="text-[10px] font-bold uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md self-start">
              {selectedArticle.category} &bull; {selectedArticle.readTime}
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-2">{selectedArticle.title}</h3>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Ditinjau oleh: {selectedArticle.reviewedBy}
            </span>

            <div className="my-4 overflow-y-auto text-xs text-slate-700 leading-relaxed space-y-3">
              <p>{selectedArticle.content}</p>
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-sky-900">
                <strong>Tips Bidan:</strong> Luangkan waktu 10 menit setiap hari untuk duduk tenang, bernapas wajar, dan berbincang dengan pendamping.
              </div>
            </div>

            <button
              onClick={() => setSelectedArticle(null)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              Tutup Artikel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
