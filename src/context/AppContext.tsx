import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  TPMB,
  EPDSScreeningResult,
  FollowUpCase,
  SicringModule,
  SicringSessionLog,
  ConsultationRequest,
  EducationalArticle,
  AuditLog,
  ThresholdConfig,
  TriageCategory,
  SicringComponentKey,
} from '../types';
import {
  INITIAL_TPMB_LIST,
  INITIAL_USERS,
  INITIAL_SCREENINGS,
  INITIAL_CASES,
  INITIAL_SICRING_MODULES,
  INITIAL_SICRING_LOGS,
  INITIAL_CONSULTATIONS,
  INITIAL_ARTICLES,
  INITIAL_THRESHOLD_CONFIG,
  INITIAL_AUDIT_LOGS,
  EPDS_ITEMS,
} from '../data/mockData';
import { DEFAULT_SICRING_TEXT_GUIDES } from '../data/sicringGuides';
import { downloadCSV, generateResearchCSV } from '../utils/csvExport';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  tpmbList: TPMB[];
  screenings: EPDSScreeningResult[];
  cases: FollowUpCase[];
  sicringModules: SicringModule[];
  sicringLogs: SicringSessionLog[];
  sicringTextGuides: Record<SicringComponentKey, string>;
  consultations: ConsultationRequest[];
  articles: EducationalArticle[];
  thresholdConfig: ThresholdConfig;
  auditLogs: AuditLog[];
  notificationBadgeCount: number;

  // Actions
  loginAs: (userId: string) => void;
  logout: () => void;
  submitEPDSScreening: (answers: { [itemId: number]: number }, waveType?: 'T0' | 'rutin' | 'T1') => EPDSScreeningResult;
  recordSicringSession: (logData: Omit<SicringSessionLog, 'id' | 'timestamp' | 'responderCode'>) => void;
  updateSicringTextGuide: (moduleId: SicringComponentKey, newText: string) => void;
  updateCaseStatus: (caseId: string, newStatus: FollowUpCase['status'], notes: string, referralTarget?: string) => void;
  requestConsultation: (req: Omit<ConsultationRequest, 'id' | 'userId' | 'userName' | 'responderCode' | 'tpmbId' | 'status'>) => void;
  updateConsultationStatus: (consultationId: string, status: ConsultationRequest['status'], midwifeNotes?: string) => void;
  registerNewMother: (data: {
    name: string;
    phone: string;
    tpmbId: string;
    stage: 'hamil' | 'nifas';
    weeks?: number;
    days?: number;
    emergencyName?: string;
    emergencyPhone?: string;
  }) => User;
  updateConsent: (userId: string, appUsage: boolean, research: boolean, midwifeShare: boolean) => void;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  updateThresholdConfig: (newConfig: Partial<ThresholdConfig>) => void;
  exportResearchData: () => void;
  addAuditLog: (action: string, details: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'mentari_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or use initial
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [tpmbList] = useState<TPMB[]>(INITIAL_TPMB_LIST);

  const [screenings, setScreenings] = useState<EPDSScreeningResult[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}screenings`);
    return saved ? JSON.parse(saved) : INITIAL_SCREENINGS;
  });

  const [cases, setCases] = useState<FollowUpCase[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}cases`);
    return saved ? JSON.parse(saved) : INITIAL_CASES;
  });

  const [sicringModules, setSicringModules] = useState<SicringModule[]>(INITIAL_SICRING_MODULES);

  const [sicringTextGuides, setSicringTextGuides] = useState<Record<SicringComponentKey, string>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sicring_text_guides`);
    return saved ? JSON.parse(saved) : DEFAULT_SICRING_TEXT_GUIDES;
  });

  const [sicringLogs, setSicringLogs] = useState<SicringSessionLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sicring_logs`);
    return saved ? JSON.parse(saved) : INITIAL_SICRING_LOGS;
  });

  const [consultations, setConsultations] = useState<ConsultationRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}consultations`);
    return saved ? JSON.parse(saved) : INITIAL_CONSULTATIONS;
  });

  const [articles] = useState<EducationalArticle[]>(INITIAL_ARTICLES);

  const [thresholdConfig, setThresholdConfig] = useState<ThresholdConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}thresholds`);
    return saved ? JSON.parse(saved) : INITIAL_THRESHOLD_CONFIG;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit_logs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}screenings`, JSON.stringify(screenings));
  }, [screenings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}cases`, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sicring_logs`, JSON.stringify(sicringLogs));
  }, [sicringLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sicring_text_guides`, JSON.stringify(sicringTextGuides));
  }, [sicringTextGuides]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}consultations`, JSON.stringify(consultations));
  }, [consultations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser?.id || 'guest',
      actorName: currentUser?.name || 'Pengguna Publik',
      actorRole: currentUser?.role || 'ibu',
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const loginAs = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      addAuditLog(
        'Login Berhasil',
        `User ${found.name} login dengan peran ${found.role.toUpperCase()}`
      );
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('Logout', `User ${currentUser.name} keluar dari sistem`);
    }
    setCurrentUser(null);
  };

  // EPDS Calculation adhering strictly to scoring tables & business rules
  const submitEPDSScreening = (
    answers: { [itemId: number]: number },
    waveType: 'T0' | 'rutin' | 'T1' = 'rutin'
  ): EPDSScreeningResult => {
    if (!currentUser) throw new Error('User harus login untuk mengisi EPDS');

    let totalScore = 0;
    EPDS_ITEMS.forEach((item) => {
      const score = answers[item.id] ?? 0;
      totalScore += score;
    });

    const item10Score = answers[10] ?? 0;

    // BR-03: Item 10 > 0 ALWAYS triggers Red Flag
    let category: TriageCategory = 'rendah';
    if (item10Score > 0) {
      category = 'red_flag';
    } else if (totalScore >= thresholdConfig.highMin) {
      category = 'tinggi';
    } else if (totalScore >= thresholdConfig.cautionMin) {
      category = 'waspada';
    } else {
      category = 'rendah';
    }

    const screeningId = `scr-${Date.now()}`;
    let followUpCaseId: string | undefined = undefined;

    // If red_flag or tinggi, create FollowUpCase automatically (Flow 2 & 3)
    if (category === 'red_flag' || category === 'tinggi') {
      const caseId = `case-${Date.now()}`;
      followUpCaseId = caseId;

      // Find assigned midwife for this TPMB
      const assignedMidwife =
        users.find((u) => u.role === 'bidan' && u.tpmbId === currentUser.tpmbId) ||
        users.find((u) => u.role === 'bidan')!;

      // SLA: 4 hours for red flag, 24 hours for high
      const slaHours = category === 'red_flag' ? 4 : 24;
      const deadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

      const newCase: FollowUpCase = {
        id: caseId,
        screeningId,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        responderCode: currentUser.responderCode || 'MNT-XXX',
        tpmbId: currentUser.tpmbId,
        category,
        score: totalScore,
        item10Score,
        createdAt: new Date().toISOString(),
        deadlineAt: deadline,
        assignedMidwifeId: assignedMidwife.id,
        assignedMidwifeName: assignedMidwife.name,
        status: 'baru',
        isEscalated: false,
        history: [
          {
            id: `chist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorName: 'Sistem Triase MENTARI',
            action:
              category === 'red_flag'
                ? 'Triase RED FLAG Otomatis'
                : 'Kasus Risiko Tinggi Diterbitkan',
            notes:
              category === 'red_flag'
                ? `Item 10 bernilai ${item10Score} (ada pikiran menyakiti diri). Notifikasi darurat SLA ${slaHours} jam.`
                : `Skor total EPDS mencapai ${totalScore} (≥${thresholdConfig.highMin}). Notifikasi tindak lanjut bidan SLA 24 jam.`,
          },
        ],
      };

      setCases((prev) => [newCase, ...prev]);

      // Update current user's activeCaseId
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, activeCaseId: caseId } : u))
      );
      setCurrentUser((prev) => (prev ? { ...prev, activeCaseId: caseId } : null));
    }

    const newScreening: EPDSScreeningResult = {
      id: screeningId,
      userId: currentUser.id,
      responderCode: currentUser.responderCode || 'MNT-000',
      tpmbId: currentUser.tpmbId,
      date: new Date().toISOString(),
      totalScore,
      item10Score,
      category,
      answers,
      waveType,
      scoringRuleVersion: thresholdConfig.version,
      followUpCaseId,
    };

    setScreenings((prev) => [newScreening, ...prev]);

    addAuditLog(
      'Skrining EPDS Selesai',
      `Ibu ${currentUser.name} (${currentUser.responderCode}) menyelesaikan EPDS: Skor ${totalScore}, Kategori ${category.toUpperCase()}`
    );

    return newScreening;
  };

  const recordSicringSession = (
    logData: Omit<SicringSessionLog, 'id' | 'timestamp' | 'responderCode'>
  ) => {
    if (!currentUser) return;
    const newLog: SicringSessionLog = {
      ...logData,
      id: `sess-${Date.now()}`,
      timestamp: new Date().toISOString(),
      responderCode: currentUser.responderCode || 'MNT-000',
    };
    setSicringLogs((prev) => [newLog, ...prev]);
    addAuditLog(
      'Latihan SICRING Selesai',
      `Ibu ${currentUser.name} menyelesaikan sesi: ${logData.moduleTitle} (${Math.round(
        logData.durationSecondsPlayed / 60
      )} menit, mood: ${logData.postMood || 'netral'})`
    );
  };

  const updateSicringTextGuide = (moduleId: SicringComponentKey, newText: string) => {
    setSicringTextGuides((prev) => ({
      ...prev,
      [moduleId]: newText,
    }));
    // Also sync in sicringModules
    setSicringModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, textGuide: newText } : m))
    );
    addAuditLog(
      'Pembaruan Panduan SICRING',
      `Teks panduan modul ${moduleId.toUpperCase()} berhasil diperbarui oleh ${currentUser?.name || 'Admin/Bidan'}`
    );
  };

  const updateCaseStatus = (
    caseId: string,
    newStatus: FollowUpCase['status'],
    notes: string,
    referralTarget?: string
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const actionTitle =
            newStatus === 'dikonfirmasi'
              ? 'Konfirmasi Kasus'
              : newStatus === 'ditangani'
              ? 'Tindakan Selesai / Home Visit'
              : newStatus === 'dirujuk'
              ? `Rujukan Medis ke ${referralTarget || 'Faskes Lanjutan'}`
              : newStatus === 'ditutup'
              ? 'Kasus Selesai Ditutup'
              : 'Pembaruan Pemantauan';

          const newHistory = [
            ...c.history,
            {
              id: `hist-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actorName: currentUser?.name || 'Bidan Penanggung Jawab',
              action: actionTitle,
              notes,
              referralTarget,
            },
          ];

          return {
            ...c,
            status: newStatus,
            history: newHistory,
          };
        }
        return c;
      })
    );

    addAuditLog(
      'Kasus Tindak Lanjut Diperbarui',
      `Kasus ${caseId} diubah status menjadi "${newStatus.toUpperCase()}" oleh ${currentUser?.name || 'Bidan'}`
    );
  };

  const requestConsultation = (
    req: Omit<ConsultationRequest, 'id' | 'userId' | 'userName' | 'responderCode' | 'tpmbId' | 'status'>
  ) => {
    if (!currentUser) return;
    const newReq: ConsultationRequest = {
      ...req,
      id: `cons-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      responderCode: currentUser.responderCode || 'MNT-000',
      tpmbId: currentUser.tpmbId,
      status: 'menunggu',
    };
    setConsultations((prev) => [newReq, ...prev]);
    addAuditLog(
      'Pengajuan Pendampingan SICRING',
      `Ibu ${currentUser.name} mengajukan pendampingan (${req.preferredType}) untuk tanggal ${req.requestedDate}`
    );
  };

  const updateConsultationStatus = (
    consultationId: string,
    status: ConsultationRequest['status'],
    midwifeNotes?: string
  ) => {
    setConsultations((prev) =>
      prev.map((item) =>
        item.id === consultationId
          ? {
              ...item,
              status,
              midwifeNotes: midwifeNotes || item.midwifeNotes,
              confirmedSchedule:
                status === 'disetujui'
                  ? `${item.requestedDate}T${item.requestedTimeSlot.split(' ')[0]}:00`
                  : item.confirmedSchedule,
            }
          : item
      )
    );
    addAuditLog(
      'Jadwal Pendampingan Diperbarui',
      `Permintaan konsultasi ${consultationId} status: ${status.toUpperCase()} (${midwifeNotes || '-'})`
    );
  };

  const registerNewMother = (data: {
    name: string;
    phone: string;
    tpmbId: string;
    stage: 'hamil' | 'nifas';
    weeks?: number;
    days?: number;
    emergencyName?: string;
    emergencyPhone?: string;
  }): User => {
    const ibuCount = users.filter((u) => u.role === 'ibu').length + 1;
    const responderCode = `MNT-${String(ibuCount).padStart(3, '0')}`;
    const newId = `user-ibu-${Date.now()}`;

    const newUser: User = {
      id: newId,
      name: data.name,
      phone: data.phone,
      role: 'ibu',
      tpmbId: data.tpmbId,
      responderCode,
      avatar: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80`,
      perinatalStage: data.stage,
      gestationalWeeks: data.stage === 'hamil' ? data.weeks || 20 : undefined,
      postpartumDays: data.stage === 'nifas' ? data.days || 7 : undefined,
      emergencyContact: data.emergencyName
        ? {
            name: data.emergencyName,
            relation: 'Keluarga',
            phone: data.emergencyPhone || '-',
          }
        : undefined,
      consentGiven: {
        appUsage: true,
        researchParticipation: true,
        dataShareMidwife: true,
        timestamp: new Date().toISOString(),
        version: 'v1.0.0',
      },
    };

    setUsers((prev) => [...prev, newUser]);
    addAuditLog(
      'Pendaftaran Ibu Baru',
      `Ibu ${newUser.name} berhasil didaftarkan dengan kode pseudonim ${responderCode} di TPMB ${data.tpmbId}`
    );
    return newUser;
  };

  const updateConsent = (
    userId: string,
    appUsage: boolean,
    research: boolean,
    midwifeShare: boolean
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              consentGiven: {
                appUsage,
                researchParticipation: research,
                dataShareMidwife: midwifeShare,
                timestamp: new Date().toISOString(),
                version: 'v1.0.0',
              },
            }
          : u
      )
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              consentGiven: {
                appUsage,
                researchParticipation: research,
                dataShareMidwife: midwifeShare,
                timestamp: new Date().toISOString(),
                version: 'v1.0.0',
              },
            }
          : null
      );
    }
    addAuditLog(
      'Pembaruan Informed Consent',
      `User ${userId} memperbarui status persetujuan data (Penelitian: ${research ? 'YA' : 'TIDAK'})`
    );
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...data } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
    }
    addAuditLog(
      'Pembaruan Profil Pengguna',
      `Profil pengguna ${userId} berhasil diperbarui`
    );
  };

  const updateThresholdConfig = (newConfig: Partial<ThresholdConfig>) => {
    setThresholdConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Administrator',
      };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}thresholds`, JSON.stringify(updated));
      return updated;
    });
    addAuditLog(
      'Konfigurasi Ambang EPDS Diubah',
      `Ambang EPDS diperbarui: Rendah(<= ${newConfig.lowMax ?? thresholdConfig.lowMax}), Waspada(${newConfig.cautionMin ?? thresholdConfig.cautionMin}-${newConfig.cautionMax ?? thresholdConfig.cautionMax}), Tinggi(>= ${newConfig.highMin ?? thresholdConfig.highMin})`
    );
  };

  const exportResearchData = () => {
    const csvContent = generateResearchCSV(users, screenings, sicringLogs);
    downloadCSV(
      csvContent,
      `MENTARI_Dataset_Penelitian_Pseudonim_${new Date().toISOString().split('T')[0]}.csv`
    );
    addAuditLog(
      'Export Data Penelitian',
      `Peneliti ${currentUser?.name || 'Anonim'} mengekspor dataset CSV pseudonim (${users.filter((u) => u.role === 'ibu').length} responden)`
    );
  };

  // Compute active notification badge for Bidan / Admin
  const openCasesCount = cases.filter(
    (c) => c.status === 'baru' || c.status === 'dikonfirmasi'
  ).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        tpmbList,
        screenings,
        cases,
        sicringModules,
        sicringLogs,
        sicringTextGuides,
        consultations,
        articles,
        thresholdConfig,
        auditLogs,
        notificationBadgeCount: openCasesCount,
        loginAs,
        logout,
        submitEPDSScreening,
        recordSicringSession,
        updateSicringTextGuide,
        updateCaseStatus,
        requestConsultation,
        updateConsultationStatus,
        registerNewMother,
        updateConsent,
        updateUserProfile,
        updateThresholdConfig,
        exportResearchData,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
