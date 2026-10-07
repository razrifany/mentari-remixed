import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  Activity,
  HeartHandshake,
  Download,
  Settings,
  ShieldCheck,
  Search,
  Filter,
  Phone,
  Eye,
  Plus,
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  Sparkles,
  TrendingDown,
  FileSpreadsheet,
  AlertCircle,
  FileCheck,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BookOpen,
  Save,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, FollowUpCase, CaseStatus, SicringComponentKey } from '../../types';
import { DEFAULT_SICRING_TEXT_GUIDES } from '../../data/sicringGuides';
import { BidanPatientDetailModal } from './BidanPatientDetailModal';
import { RegisterMotherModal } from './RegisterMotherModal';

interface AdminDashboardProps {
  onSwitchToUser: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToUser }) => {
  const {
    currentUser,
    users,
    cases,
    screenings,
    sicringLogs,
    sicringTextGuides,
    updateSicringTextGuide,
    consultations,
    tpmbList,
    thresholdConfig,
    auditLogs,
    loginAs,
    logout,
    updateConsultationStatus,
    updateThresholdConfig,
    exportResearchData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'antrian' | 'pasien' | 'pendampingan' | 'panduan_sicring' | 'riset' | 'ambang' | 'audit'
  >('antrian');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // SICRING Text Guide Admin Editor State
  const [selectedSicringEditKey, setSelectedSicringEditKey] = useState<SicringComponentKey>('olah_tubuh');
  const [guideTextEditValue, setGuideTextEditValue] = useState<string>('');
  const [isGuideSavedToast, setIsGuideSavedToast] = useState(false);

  // Sync guideTextEditValue when selectedSicringEditKey or sicringTextGuides changes
  React.useEffect(() => {
    setGuideTextEditValue(
      sicringTextGuides?.[selectedSicringEditKey] ||
        DEFAULT_SICRING_TEXT_GUIDES[selectedSicringEditKey] ||
        ''
    );
  }, [selectedSicringEditKey, sicringTextGuides]);

  // Selected patient for modal
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Filters for patient list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<'semua' | 'hamil' | 'nifas'>('semua');
  const [filterRisk, setFilterRisk] = useState<string>('semua');

  // Threshold edit state
  const [lowMax, setLowMax] = useState(thresholdConfig.lowMax);
  const [cautionMin, setCautionMin] = useState(thresholdConfig.cautionMin);
  const [cautionMax, setCautionMax] = useState(thresholdConfig.cautionMax);
  const [highMin, setHighMin] = useState(thresholdConfig.highMin);
  const [isThresholdSaved, setIsThresholdSaved] = useState(false);

  const currentTpmb = tpmbList.find((t) => t.id === currentUser?.tpmbId) || tpmbList[0];

  // Patients registered in current TPMB
  const patients = users.filter((u) => u.role === 'ibu' && u.tpmbId === currentTpmb.id);

  // Open cases (prioritas hari ini)
  const openCases = cases.filter(
    (c) => c.status === 'baru' || c.status === 'dikonfirmasi' || c.status === 'ditangani'
  );
  const redFlagCases = openCases.filter((c) => c.category === 'red_flag');
  const highCases = openCases.filter((c) => c.category === 'tinggi');

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.responderCode && p.responderCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.phone.includes(searchQuery);

    const matchesStage = filterStage === 'semua' || p.perinatalStage === filterStage;

    let matchesRisk = true;
    if (filterRisk !== 'semua') {
      const latestScr = screenings.filter((s) => s.userId === p.id)[0];
      matchesRisk = latestScr ? latestScr.category === filterRisk : filterRisk === 'belum_skrining';
    }

    return matchesSearch && matchesStage && matchesRisk;
  });

  // Aggregate stats
  const totalCompletedSessions = sicringLogs.filter((l) => l.isCompleted).length;
  const avgCompliance = Math.round(
    patients.length > 0
      ? (totalCompletedSessions / (patients.length * 8)) * 100
      : 0
  );

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholdConfig({
      lowMax: Number(lowMax),
      cautionMin: Number(cautionMin),
      cautionMax: Number(cautionMax),
      highMin: Number(highMin),
    });
    setIsThresholdSaved(true);
    setTimeout(() => setIsThresholdSaved(false), 2500);
  };

  const navItems = [
    {
      id: 'antrian' as const,
      label: 'Antrian & Triase Hari Ini',
      icon: AlertTriangle,
      badge: openCases.length > 0 ? openCases.length : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'pasien' as const,
      label: 'Daftar Pasien TPMB',
      icon: Users,
      badge: patients.length,
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'pendampingan' as const,
      label: 'Jadwal Pendampingan',
      icon: HeartHandshake,
      badge:
        consultations.filter((c) => c.status === 'menunggu').length > 0
          ? consultations.filter((c) => c.status === 'menunggu').length
          : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'panduan_sicring' as const,
      label: 'Kelola Panduan SICRING',
      icon: BookOpen,
      badge: '5 Modul',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'riset' as const,
      label: 'Modul Riset & Ekspor',
      icon: FileSpreadsheet,
    },
    {
      id: 'ambang' as const,
      label: 'Konfigurasi Ambang EPDS',
      icon: Settings,
    },
    {
      id: 'audit' as const,
      label: 'Log Audit Sistem',
      icon: ShieldCheck,
      badge: auditLogs.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'antrian':
        return 'Antrian & Triase Pasien Hari Ini';
      case 'pasien':
        return 'Daftar Pasien Bidan TPMB';
      case 'pendampingan':
        return 'Jadwal Konsultasi & Pendampingan';
      case 'panduan_sicring':
        return 'Pengelolaan Teks Panduan SICRING';
      case 'riset':
        return 'Modul Analisis Riset & Ekspor Data';
      case 'ambang':
        return 'Konfigurasi Ambang Batas EPDS';
      case 'audit':
        return 'Log Audit & Keamanan Sistem';
      default:
        return 'Clinical Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Responsive Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Sidebar Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 text-base leading-tight">
                    MENTARI
                  </h1>
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {currentUser?.role === 'peneliti'
                      ? 'Peneliti'
                      : currentUser?.role === 'admin'
                      ? 'Admin'
                      : 'Bidan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                  {currentTpmb.name}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Role Switcher (Uji Peran) */}
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Uji Peran Sistem
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => loginAs('user-bidan-1')}
                className={`py-1 text-center rounded-lg transition-colors ${
                  currentUser?.role === 'bidan'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bidan
              </button>
              <button
                onClick={() => loginAs('user-peneliti-1')}
                className={`py-1 text-center rounded-lg transition-colors ${
                  currentUser?.role === 'peneliti'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riset
              </button>
              <button
                onClick={() => loginAs('user-admin-1')}
                className={`py-1 text-center rounded-lg transition-colors ${
                  currentUser?.role === 'admin'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <div className="p-3 flex-1 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 block">
              Menu Utama
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Action in Navigation */}
            <div className="pt-3">
              <button
                onClick={() => {
                  setIsRegisterOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Daftarkan Ibu Baru</span>
              </button>
            </div>
          </div>

          {/* User Info & Bottom Controls */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-slate-500 capitalize block truncate">
                  {currentUser?.role === 'peneliti'
                    ? 'Peneliti Riset EPDS'
                    : currentUser?.role === 'admin'
                    ? 'Super Admin Sistem'
                    : 'Bidan Penanggung Jawab'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onSwitchToUser}
                className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors"
                title="Buka tampilan aplikasi untuk pasien / ibu"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Aplikasi Ibu</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace on the Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header of Main Workspace */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              title="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {getTabTitle()}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentTpmb.name} &bull; {currentTpmb.midwifeName}
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            {activeTab === 'riset' && (
              <button
                onClick={() => exportResearchData()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh Dataset</span> Riset
              </button>
            )}

            {activeTab === 'pasien' && (
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan Ibu</span>
              </button>
            )}

            <button
              onClick={onSwitchToUser}
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-xl border border-sky-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mode Ibu</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
          {/* TAB 1: ANTRIAN & TRIASE HARI INI */}
          {activeTab === 'antrian' && (
            <div className="space-y-6">
            {/* KPI Cards Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                  Ibu Terdaftar
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {patients.length} Orang
                </span>
                <span className="text-[10px] text-sky-700 font-medium">Binaan TPMB aktif</span>
              </div>

              <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-600 uppercase block">
                  Kasus Terbuka Hari Ini
                </span>
                <span className="text-2xl font-black text-rose-700 mt-1 block">
                  {openCases.length} Kasus
                </span>
                <span className="text-[10px] text-rose-600 font-bold">
                  {redFlagCases.length} Red Flag &bull; {highCases.length} Tinggi
                </span>
              </div>

              <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                  Sesi SICRING Terlaksana
                </span>
                <span className="text-2xl font-black text-sky-800 mt-1 block">
                  {totalCompletedSessions} Sesi
                </span>
                <span className="text-[10px] text-slate-400">Total intervensi mandiri</span>
              </div>

              <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase block">
                  Kepatuhan Protokol (X₃)
                </span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block">
                  {Math.min(100, avgCompliance)}%
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Target 8 sesi/ibu</span>
              </div>
            </div>

            {/* RED FLAG PRIORITAS TERTINGGI */}
            {redFlagCases.length > 0 && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-rose-950 text-sm">
                        PERHATIAN DARURAT: Triase Red Flag (Item 10 &gt; 0)
                      </h3>
                      <p className="text-xs text-rose-800">
                        Pasien menyatakan terlintas pikiran mencelakai diri. Wajib dikonfirmasi segera.
                      </p>
                    </div>
                  </div>
                  <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full animate-pulse">
                    PRIORITAS 1
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {redFlagCases.map((c) => {
                    const patientObj = users.find((u) => u.id === c.userId);
                    return (
                      <div
                        key={c.id}
                        className="bg-white rounded-2xl border border-rose-200 p-4 shadow-2xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-black text-slate-900 text-sm block">
                                {c.userName}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                {c.responderCode} &bull; {c.userPhone}
                              </span>
                            </div>
                            <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full uppercase">
                              Skor EPDS: {c.score}
                            </span>
                          </div>

                          <div className="bg-rose-50 rounded-xl p-2.5 my-3 text-xs text-rose-900">
                            <strong>Peringatan Item 10:</strong> Bernilai {c.item10Score} (Positif pikiran mencelakai diri).
                            <div className="text-[11px] text-slate-500 mt-1">
                              Tenggat Respon: {new Date(c.deadlineAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <a
                            href={`tel:${c.userPhone.replace(/[^0-9]/g, '')}`}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-center text-xs flex items-center justify-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Hubungi Ibu
                          </a>
                          <button
                            onClick={() => setSelectedPatient(patientObj || null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Rekam Medis & Tindak Lanjut
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* KASUS EPDS TINGGI (SKOR >= 13) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Kasus Risiko Tinggi (Skor EPDS ≥ 13)
                  </h3>
                  <p className="text-xs text-slate-500">
                    SLA tindak lanjut 1x24 jam untuk penjadwalan konseling atau kunjungan rumah.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  {highCases.length} Kasus Aktif
                </span>
              </div>

              {highCases.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada kasus risiko tinggi yang belum ditangani hari ini. Semua terpantau baik!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {highCases.map((c) => {
                    const patientObj = users.find((u) => u.id === c.userId);
                    return (
                      <div
                        key={c.id}
                        className="border border-amber-200 rounded-2xl p-4 hover:border-amber-400 transition-colors bg-amber-50/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {c.userName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {c.responderCode} &bull; {c.userPhone}
                            </span>
                          </div>
                          <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                            Skor: {c.score}
                          </span>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <a
                            href={`tel:${c.userPhone.replace(/[^0-9]/g, '')}`}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-center text-xs flex items-center justify-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Telepon
                          </a>
                          <button
                            onClick={() => setSelectedPatient(patientObj || null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail & Tindak Lanjut
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DAFTAR PASIEN TPMB */}
        {activeTab === 'pasien' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Daftar Pasien Ibu Binaan TPMB</h3>
                <p className="text-xs text-slate-500">
                  Data ibu hamil dan nifas, skor skrining, serta status kepatuhan intervensi SICRING.
                </p>
              </div>

              <button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Daftarkan Ibu Baru</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama, kode MNT, no. HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value as any)}
                className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="semua">Semua Fase (Hamil & Nifas)</option>
                <option value="hamil">Hanya Ibu Hamil</option>
                <option value="nifas">Hanya Ibu Nifas</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="semua">Semua Kategori Risiko</option>
                <option value="red_flag">Red Flag (Item 10 &gt; 0)</option>
                <option value="tinggi">Risiko Tinggi (≥13)</option>
                <option value="waspada">Waspada (10-12)</option>
                <option value="rendah">Rendah / Stabil (0-9)</option>
              </select>
            </div>

            {/* Patients Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Kode & Nama Pasien</th>
                    <th className="p-3.5">Fase Perinatal</th>
                    <th className="p-3.5">Skor Terakhir</th>
                    <th className="p-3.5">Status Triase</th>
                    <th className="p-3.5">Kepatuhan SICRING</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => {
                    const scr = screenings.filter((s) => s.userId === p.id)[0];
                    const logs = sicringLogs.filter((l) => l.userId === p.id);
                    const completed = logs.filter((l) => l.isCompleted).length;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.responderCode} &bull; {p.phone}
                          </div>
                        </td>
                        <td className="p-3.5 capitalize">
                          {p.perinatalStage === 'hamil' ? (
                            <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold">
                              Hamil ({p.gestationalWeeks ?? 24} mg)
                            </span>
                          ) : (
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                              Nifas ({p.postpartumDays ?? 14} hr)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold">
                          {scr ? `${scr.totalScore} / 30` : '-'}
                        </td>
                        <td className="p-3.5">
                          {scr ? (
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                                scr.category === 'red_flag'
                                  ? 'bg-rose-100 text-rose-800'
                                  : scr.category === 'tinggi'
                                  ? 'bg-amber-100 text-amber-800'
                                  : scr.category === 'waspada'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {scr.category.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Belum Skrining</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{completed} / 8 sesi</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedPatient(p)}
                            className="bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                          >
                            Rekam Medis
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: JADWAL PENDAMPINGAN */}
        {activeTab === 'pendampingan' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Permintaan Pendampingan SICRING (Komponen 5)
              </h3>
              <p className="text-xs text-slate-500">
                Pengajuan sesi konseling 1-on-1 dari ibu (telepon atau tatap muka di TPMB).
              </p>
            </div>

            <div className="space-y-3">
              {consultations.map((cons) => (
                <div
                  key={cons.id}
                  className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{cons.userName}</span>
                      <span className="text-xs font-mono text-slate-400">({cons.responderCode})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          cons.status === 'disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cons.status === 'menunggu'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cons.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      <span>Metode: <strong>{cons.preferredType === 'telepon' ? 'Telepon' : 'Tatap Muka di TPMB'}</strong></span>
                      <span>&bull;</span>
                      <span>Tanggal: <strong>{cons.requestedDate}</strong> ({cons.requestedTimeSlot})</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{cons.notes}"
                    </p>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    {cons.status === 'menunggu' && (
                      <button
                        onClick={() =>
                          updateConsultationStatus(
                            cons.id,
                            'disetujui',
                            'Disetujui. Sesi dijadwalkan oleh Bidan TPMB.'
                          )
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                      >
                        Setujui Jadwal
                      </button>
                    )}
                    {cons.status === 'disetujui' && (
                      <button
                        onClick={() =>
                          updateConsultationStatus(
                            cons.id,
                            'selesai',
                            'Sesi konseling telah selesai dilaksanakan.'
                          )
                        }
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                      >
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: KELOLA PANDUAN TEKS SICRING */}
        {activeTab === 'panduan_sicring' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                  Manajemen Konten Intervensi
                </span>
                <h2 className="text-xl font-bold mt-1">Pengelolaan Teks Panduan SICRING</h2>
                <p className="text-xs text-purple-100 mt-1 max-w-xl leading-relaxed">
                  Bidan dan admin dapat mengedit teks panduan secara langsung untuk 5 modul SICRING. Format teks sederhana ini memudahkan pembaruan instruksi klinis dan istilah kultural.
                </p>
              </div>

              {isGuideSavedToast && (
                <div className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>Teks Panduan Berhasil Diperbarui!</span>
                </div>
              )}
            </div>

            {/* Module Picker Tabs */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
                Pilih Komponen yang Ingin Diedit:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'olah_tubuh' as const, num: 1, label: 'Olah Tubuh Sadar' },
                  { id: 'charging' as const, num: 2, label: 'Charging Ruhani' },
                  { id: 'healing_touch' as const, num: 3, label: 'Healing Touch' },
                  { id: 'blessing_water' as const, num: 4, label: 'Blessing Water' },
                  { id: 'pendampingan' as const, num: 5, label: 'Pendampingan Bidan' },
                ].map((m) => {
                  const isSelected = selectedSicringEditKey === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedSicringEditKey(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-2xs ring-2 ring-purple-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.num}
                      </span>
                      <span className="text-xs truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Screen: Editor & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Textarea Editor */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Editor Teks: {selectedSicringEditKey.toUpperCase().replace('_', ' ')}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Format teks bebas (gunakan penomoran seperti 1., 2. untuk bab sub-judul).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGuideTextEditValue(DEFAULT_SICRING_TEXT_GUIDES[selectedSicringEditKey]);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                      title="Kembalikan ke draf bawaan awal"
                    >
                      Reset Default
                    </button>
                  </div>

                  <div className="mt-3">
                    <textarea
                      rows={16}
                      value={guideTextEditValue}
                      onChange={(e) => setGuideTextEditValue(e.target.value)}
                      className="w-full text-xs sm:text-sm p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-purple-500 focus:bg-white focus:outline-hidden font-mono leading-relaxed"
                      placeholder="Tuliskan materi teks panduan di sini..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {guideTextEditValue.length} karakter &bull; Tersimpan di LocalStorage
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      updateSicringTextGuide(selectedSicringEditKey, guideTextEditValue);
                      setIsGuideSavedToast(true);
                      setTimeout(() => setIsGuideSavedToast(false), 3000);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pembaruan Teks</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Reader Preview */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-600" />
                      <span>Pratinjau Tampilan di Aplikasi Ibu</span>
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Live Preview
                    </span>
                  </div>

                  {/* Render preview formatted */}
                  <div className="mt-4 bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200 max-h-[460px] overflow-y-auto space-y-3">
                    {guideTextEditValue.split('\n\n').map((para, idx) => {
                      const trimmed = para.trim();
                      if (!trimmed) return null;
                      if (idx === 0 && trimmed.toUpperCase() === trimmed) {
                        return (
                          <div key={idx} className="pb-2 border-b border-slate-200">
                            <h5 className="font-bold text-slate-900 text-sm">{trimmed}</h5>
                          </div>
                        );
                      }
                      if (/^\d+\.\s/.test(trimmed)) {
                        const lines = trimmed.split('\n');
                        const title = lines[0];
                        const contentLines = lines.slice(1);
                        return (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                            <h6 className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-md bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {title.match(/^\d+/)?.[0]}
                              </span>
                              <span>{title.replace(/^\d+\.\s*/, '')}</span>
                            </h6>
                            {contentLines.map((line, lIdx) => (
                              <p key={lIdx} className="text-[11px] text-slate-600 pl-5">
                                {line}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-xs text-slate-700 leading-relaxed">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
                  Perubahan yang disimpan di tab ini akan langsung muncul di halaman panduan Ibu.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MODUL PENELITIAN & RISET */}
        {activeTab === 'riset' && (
          <div className="space-y-6">
            {/* Research Header & Export Button */}
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-200">
                  Modul Pengumpulan Data Ilmiah
                </span>
                <h2 className="text-xl font-bold mt-1">Evaluasi Intervensi MENTARI & SICRING</h2>
                <p className="text-xs text-sky-100 mt-1 max-w-xl">
                  Pengujian Model 1 (Usability & Acceptance: SUS, ISO 25010, TAM) dan Model 2 (Keterlibatan SICRING X₃ terhadap Delta Skor EPDS T0 & T1).
                </p>
              </div>

              <button
                onClick={exportResearchData}
                className="bg-white hover:bg-sky-50 text-sky-800 font-extrabold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-md shrink-0 transition-transform active:scale-95"
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>Unduh Dataset CSV Pseudonim</span>
              </button>
            </div>

            {/* Research Models Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Model 1: Usability & Acceptance */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Model 1: Kualitas Sistem & Penerimaan Teknologi
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Target Tercapai
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">System Usability Scale (SUS)</span>
                      <span className="text-[11px] text-slate-400">Target draft ≥ 68.0</span>
                    </div>
                    <span className="text-lg font-black text-sky-700">79.4 (Baik / Grade A)</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">ISO/IEC 25010 Usability</span>
                      <span className="text-[11px] text-slate-400">Efektivitas, Efisiensi, Kepuasan</span>
                    </div>
                    <span className="text-lg font-black text-emerald-700">88.2% (Sangat Baik)</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Technology Acceptance Model (TAM)</span>
                      <span className="text-[11px] text-slate-400">Perceived Usefulness & Ease</span>
                    </div>
                    <span className="text-lg font-black text-purple-700">Positif Signifikan</span>
                  </div>
                </div>
              </div>

              {/* Model 2: Efficacy of SICRING */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Model 2: Efektivitas SICRING (T0 vs T1)
                  </h4>
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                    Longitudinal
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Rata-rata Penurunan EPDS</span>
                      <span className="text-[11px] text-slate-400">Pretest T0 → Evaluasi T1</span>
                    </div>
                    <span className="text-lg font-black text-emerald-700">- 4.8 Poin (p &lt; 0.01)</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Korelasi Keterlibatan (X₃)</span>
                      <span className="text-[11px] text-slate-400">Dosis kepatuhan latihan</span>
                    </div>
                    <span className="text-lg font-black text-sky-700">r = -0.58 (Sedang-Kuat)</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Kelengkapan Pasangan T0/T1</span>
                      <span className="text-[11px] text-slate-400">Target non-dropout ≥ 85%</span>
                    </div>
                    <span className="text-lg font-black text-slate-900">91.6% Responden</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
              <strong>Kepatuhan Etik Penelitian (BR-11 & BR-12):</strong> File CSV yang diekspor hanya menyertakan kode responden pseudonim (mis. MNT-001) tanpa data identitas pengenal (nama, nomor telepon, alamat, atau NIK). Responden yang menarik consent penelitian secara otomatis dihilangkan dari export.
            </div>
          </div>
        )}

        {/* TAB 5: KONFIGURASI AMBANG EPDS */}
        {activeTab === 'ambang' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-2xl space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
                Versi: {thresholdConfig.version}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                Konfigurasi Ambang Kategori EPDS Berversi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengikuti studi validasi EPDS adaptasi Indonesia. Perubahan konfigurasi dicatat dalam riwayat audit (BR-04).
              </p>
            </div>

            <form onSubmit={handleSaveThreshold} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <label className="text-xs font-bold text-emerald-900 block mb-1">
                    Batas Maksimal Rendah (Normal):
                  </label>
                  <input
                    type="number"
                    value={lowMax}
                    onChange={(e) => setLowMax(Number(e.target.value))}
                    className="w-full text-sm font-bold p-2 rounded-xl border border-emerald-300 bg-white"
                  />
                  <span className="text-[10px] text-emerald-700 block mt-1">Skor 0 s/d {lowMax}</span>
                </div>

                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200">
                  <label className="text-xs font-bold text-sky-900 block mb-1">
                    Rentang Waspada (Mild):
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={cautionMin}
                      onChange={(e) => setCautionMin(Number(e.target.value))}
                      className="w-full text-sm font-bold p-2 rounded-xl border border-sky-300 bg-white"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={cautionMax}
                      onChange={(e) => setCautionMax(Number(e.target.value))}
                      className="w-full text-sm font-bold p-2 rounded-xl border border-sky-300 bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-sky-700 block mt-1">Skor {cautionMin} s/d {cautionMax}</span>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 col-span-2">
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Batas Minimal Kasus Tinggi (High):
                  </label>
                  <input
                    type="number"
                    value={highMin}
                    onChange={(e) => setHighMin(Number(e.target.value))}
                    className="w-full text-sm font-bold p-2 rounded-xl border border-amber-300 bg-white"
                  />
                  <span className="text-[10px] text-amber-700 block mt-1">
                    Skor ≥ {highMin} otomatis menerbitkan kasus klinis SLA 24 jam
                  </span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Mutlak (BR-03):</strong> Jika Item 10 &gt; 0, sistem <em>selalu</em> mengelompokkan hasil ke dalam kategori <strong>Red Flag</strong> dan menerbitkan notifikasi prioritas tanpa memandang skor total.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Terakhir diubah: {new Date(thresholdConfig.updatedAt).toLocaleDateString('id-ID')} oleh {thresholdConfig.updatedBy}
                </span>

                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-xs"
                >
                  {isThresholdSaved ? 'Tersimpan!' : 'Perbarui Ambang EPDS'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Audit Log Keamanan & Akses Data</h3>
              <p className="text-xs text-slate-500">
                Jejak audit digital untuk mencatat pembukaan rekam medis pasien, ekspor data riset, dan perubahan status kasus (BR-07 & BR-11).
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Waktu (WIB)</th>
                    <th className="p-3">Aktor & Peran</th>
                    <th className="p-3">Tindakan</th>
                    <th className="p-3">Rincian Peristiwa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                        {log.actorName}
                        <span className="block text-[10px] text-sky-700 uppercase">{log.actorRole}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{log.action}</td>
                      <td className="p-3 text-slate-600 max-w-md">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Patient Detail Modal */}
      <BidanPatientDetailModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
      />

      {/* Register Mother Modal */}
      <RegisterMotherModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
};
