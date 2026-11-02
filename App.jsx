import { supabase } from './supabase' // 如果 supabase.js 跟 App.jsx 在同一層就用 './supabase'
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, User, Calendar, CheckCircle2, XCircle, Sparkles, 
  Copy, RefreshCw, Award, Volume2, VolumeX, Shield, Play, 
  ChevronRight, ChevronLeft, Users, Check, AlertCircle, Heart,
  Send, ArrowRight, Smartphone, Share2, Plus, Edit2
} from 'lucide-react';

// --- Web Audio API Sound Synthesizer ---
const playSound = (type, enabled = true) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'toggle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
      osc.start();
      osc.stop(now + 0.45);
    } else if (type === 'back') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {
    console.error(e);
  }
};

// --- Confetti FX Component ---
const ConfettiFX = ({ trigger }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ['#58CC02', '#FFC800', '#FF4B4B', '#1CB0F6', '#2B70C9', '#CE82FF'];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 2500);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-bounce"
          style={{
            left: `${p.x}%`,
            top: `${p.vy * 18}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            transition: 'all 2s ease-out',
          }}
        />
      ))}
    </div>
  );
};

// --- Master Roles Configuration ---
const ROLES = [
  { id: 'worship_lead', name: 'Worship Lead', shortName: '主領', icon: '🎤', color: 'bg-amber-400 border-amber-600 text-amber-950' },
  { id: 'vocal', name: 'Vocal', shortName: '歌手', icon: '🎵', color: 'bg-rose-400 border-rose-600 text-rose-950' },
  { id: 'keys', name: 'Keys', shortName: '琴手', icon: '🎹', color: 'bg-sky-400 border-sky-600 text-sky-950' },
  { id: 'acoustic_guitar', name: 'Acoustic Guitar', shortName: '木吉他', icon: '🎸', color: 'bg-emerald-400 border-emerald-600 text-emerald-950' },
  { id: 'drum', name: 'Drum', shortName: '爵士鼓', icon: '🥁', color: 'bg-purple-400 border-purple-600 text-purple-950' },
  { id: 'bass', name: 'Bass', shortName: '貝斯', icon: '🎸', color: 'bg-orange-400 border-orange-600 text-orange-950' },
];

// --- Sundays for Current Month ---
const SUNDAYS = [
  { id: '2026-11-01', label: '11/01 主日' },
  { id: '2026-11-08', label: '11/08 主日' },
  { id: '2026-11-15', label: '11/15 主日' },
  { id: '2026-11-22', label: '11/22 主日' },
];

// --- Initial Team Members Data ---
const INITIAL_MEMBERS = [
  {
    id: 'm1',
    name: 'David (大衛)',
    avatarSeed: 'Felix',
    bgStyle: 'b6e3f4',
    roles: ['worship_lead', 'acoustic_guitar'],
    availability: { '2026-11-01': true, '2026-11-08': true, '2026-11-15': true, '2026-11-22': false },
    submitted: true,
  },
  {
    id: 'm2',
    name: 'Sarah (莎拉)',
    avatarSeed: 'Aneka',
    bgStyle: 'ffd5dc',
    roles: ['worship_lead', 'vocal'],
    availability: { '2026-11-01': true, '2026-11-08': false, '2026-11-15': true, '2026-11-22': true },
    submitted: true,
  },
  {
    id: 'm3',
    name: 'Peter (彼得)',
    avatarSeed: 'Jack',
    bgStyle: 'd1d4f9',
    roles: ['drum', 'bass'],
    availability: { '2026-11-01': true, '2026-11-08': true, '2026-11-15': true, '2026-11-22': true },
    submitted: true,
  },
  {
    id: 'm4',
    name: 'Hannah (哈拿)',
    avatarSeed: 'Maria',
    bgStyle: 'c0aede',
    roles: ['keys', 'vocal'],
    availability: { '2026-11-01': true, '2026-11-08': true, '2026-11-15': false, '2026-11-22': true },
    submitted: true,
  },
  {
    id: 'm5',
    name: 'Paul (保羅)',
    avatarSeed: 'Zoe',
    bgStyle: 'ffdfbf',
    roles: ['acoustic_guitar', 'bass'],
    availability: { '2026-11-01': false, '2026-11-08': true, '2026-11-15': true, '2026-11-22': true },
    submitted: true,
  },
  {
    id: 'm6',
    name: 'John (約翰)',
    avatarSeed: 'Alexander',
    bgStyle: 'c1f2c7',
    roles: ['keys', 'worship_lead'],
    availability: { '2026-11-01': true, '2026-11-08': true, '2026-11-15': true, '2026-11-22': false },
    submitted: true,
  },
  {
    id: 'm7',
    name: 'Esther (以斯帖)',
    avatarSeed: 'Sophia',
    bgStyle: 'fde2e4',
    roles: ['vocal'],
    availability: { '2026-11-01': true, '2026-11-08': true, '2026-11-15': true, '2026-11-22': true },
    submitted: true,
  },
  {
    id: 'm8',
    name: 'Joshua (約書亞)',
    avatarSeed: 'Leo',
    bgStyle: 'e2ece9',
    roles: ['bass', 'drum'],
    availability: { '2026-11-01': true, '2026-11-08': false, '2026-11-15': true, '2026-11-22': true },
    submitted: false,
  },
];

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Jack', 'Maria', 'Zoe', 'Alexander', 'Sophia', 'Leo', 'Oliver', 'Maya'];
const BG_COLORS = ['b6e3f4', 'ffd5dc', 'd1d4f9', 'c0aede', 'ffdfbf', 'c1f2c7'];

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('wizard'); // 'wizard' | 'admin'
  const [step, setStep] = useState(1); // Steps 1 -> 5
  
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [selectedMemberId, setSelectedMemberId] = useState('m1');
  
  // Editable state during survey
  const [tempMember, setTempMember] = useState({ ...INITIAL_MEMBERS[0] });
  
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [scheduleResult, setScheduleResult] = useState(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync temp member whenever user changes choice in Step 1
  const handleSelectMember = (id) => {
    playSound('click', soundEnabled);
    setSelectedMemberId(id);
    const m = members.find((item) => item.id === id) || members[0];
    setTempMember(JSON.parse(JSON.stringify(m)));
  };

  // Step 2 Role Toggle
  const toggleTempRole = (roleId) => {
    playSound('click', soundEnabled);
    setTempMember((prev) => {
      const has = prev.roles.includes(roleId);
      if (has && prev.roles.length === 1) return prev; // keep at least 1
      const newRoles = has ? prev.roles.filter((r) => r !== roleId) : [...prev.roles, roleId];
      return { ...prev, roles: newRoles };
    });
  };

  // Step 3 Availability Toggle
  const toggleTempAvailability = (sundayId) => {
    playSound('toggle', soundEnabled);
    setTempMember((prev) => {
      const current = !!prev.availability[sundayId];
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [sundayId]: !current,
        },
      };
    });
  };

  // Submit survey
  const handleSubmitSurvey = () => {
    playSound('success', soundEnabled);
    setConfettiTrigger((prev) => prev + 1);
    
    setMembers((prev) =>
      prev.map((m) => (m.id === tempMember.id ? { ...tempMember, submitted: true } : m))
    );
    setStep(5); // Move to Success Step
  };

  // --- Auto Scheduling Algorithm ---
  const autoSchedule = () => {
    playSound('success', soundEnabled);
    setConfettiTrigger((prev) => prev + 1);

    const assignments = {};
    const memberServiceCount = {};
    members.forEach((m) => (memberServiceCount[m.id] = 0));

    SUNDAYS.forEach((s) => {
      const avail = members.filter((m) => m.availability[s.id]);
      const sundayRoster = {};
      const assignedThisSunday = new Set();

      ROLES.forEach((role) => {
        const candidates = avail.filter(
          (m) => !assignedThisSunday.has(m.id) && m.roles.includes(role.id)
        );

        if (candidates.length > 0) {
          candidates.sort((a, b) => memberServiceCount[a.id] - memberServiceCount[b.id]);
          const chosen = candidates[0];
          sundayRoster[role.id] = chosen;
          assignedThisSunday.add(chosen.id);
          memberServiceCount[chosen.id] += 1;
        } else {
          sundayRoster[role.id] = null;
        }
      });

      assignments[s.id] = sundayRoster;
    });

    setScheduleResult({
      assignments,
      memberServiceCount,
      generatedAt: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  useEffect(() => {
    autoSchedule();
  }, []);

  // Copy Broadcast String
  const copyBroadcastText = () => {
    playSound('click', soundEnabled);
    if (!scheduleResult) return;

    let text = `✨ 【本月敬拜隊服侍陣容名單】 ✨\n各位隊友辛苦了！以下是自動配對陣容：\n\n`;

    SUNDAYS.forEach((s) => {
      text += `📅 ${s.label}\n`;
      const roster = scheduleResult.assignments[s.id];
      ROLES.forEach((r) => {
        const assigned = roster ? roster[r.id] : null;
        text += `  • ${r.icon} ${r.shortName}: ${assigned ? assigned.name : '⚠️ [缺人，需支援]'}\n`;
      });
      text += `\n`;
    });

    text += `請大家查閱並預備心！願主祝福大家的服侍 🙏✨`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const nextStep = () => {
    playSound('click', soundEnabled);
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    playSound('back', soundEnabled);
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-2 sm:p-6 text-slate-800 font-sans select-none">
      <ConfettiFX trigger={confettiTrigger} />

      {/* Top Controller & Mode Switcher */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playSound('click', !soundEnabled);
            }}
            className="p-2 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 shadow-sm active:translate-y-0.5"
            title="音效開關"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-[#1CB0F6]" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          <span className="text-xs font-black text-slate-500 bg-white px-3 py-1.5 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center">
            <Smartphone className="w-3.5 h-3.5 mr-1 text-[#58CC02]" />
            手機問卷模式
          </span>
        </div>

        <button
          onClick={() => {
            setViewMode(viewMode === 'wizard' ? 'admin' : 'wizard');
            playSound('click', soundEnabled);
          }}
          className={`px-3 py-1.5 rounded-2xl font-black text-xs border-b-4 transition-all flex items-center space-x-1 shadow-sm ${
            viewMode === 'wizard'
              ? 'bg-[#FF9600] text-white border-[#E08400]'
              : 'bg-[#58CC02] text-white border-[#46A302]'
          }`}
        >
          {viewMode === 'wizard' ? (
            <>
              <Shield className="w-3.5 h-3.5" />
              <span>切換隊長後台</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>返回隊員問卷</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Device Frame Container (Max Width 420px) */}
      <div className="w-full max-w-[420px] bg-white rounded-[36px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative min-h-[680px]">
        
        {/* Mobile Top Status Notch Bar */}
        <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs font-bold">
          <span>9:41</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full" />
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px]">5G</span>
            <div className="w-3.5 h-2.5 bg-white rounded-sm" />
          </div>
        </div>

        {/* ================= VIEW MODE 1: STEP-BY-STEP QUESTIONNAIRE WIZARD ================= */}
        {viewMode === 'wizard' && (
          <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9FA]">
            
            {/* Wizard Header & Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {step > 1 && step < 5 ? (
                  <button
                    onClick={prevStep}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[3]" />
                  </button>
                ) : (
                  <div className="w-9" />
                )}

                <div className="flex items-center space-x-1">
                  <Music className="w-5 h-5 text-[#58CC02] stroke-[3]" />
                  <span className="font-extrabold text-slate-800 text-base">敬拜隊服侍意向表</span>
                </div>

                <span className="text-xs font-black text-slate-400">
                  {step <= 4 ? `${step}/4` : '完成'}
                </span>
              </div>

              {/* Duolingo Style Green Progress Bar */}
              <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="bg-[#58CC02] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Content Card Container */}
            <div className="my-auto py-2">
              
              {/* STEP 1: SELECT MEMBER */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">你是哪一位隊員？</h2>
                    <p className="text-xs font-extrabold text-slate-400">請挑選你的名字以載入個人設定</p>
                  </div>

                  {/* Avatar & Name Grid Options */}
                  <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto p-1">
                    {members.map((m) => {
                      const isSelected = tempMember.id === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMember(m.id)}
                          className={`p-3 rounded-2xl border-b-4 font-black flex items-center space-x-2.5 transition-all text-left ${
                            isSelected
                              ? 'bg-emerald-50 border-[#58CC02] text-slate-900 ring-2 ring-[#58CC02]'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-xl border-2 border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: `#${m.bgStyle}` }}
                          >
                            <img
                              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${m.avatarSeed}`}
                              alt="avatar"
                              className="w-8 h-8"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black truncate">{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">
                              {m.submitted ? '已填寫 ✅' : '未填寫 ⏳'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Avatar Customization Strip */}
                  <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">自訂頭像：</span>
                    <div className="flex space-x-1.5">
                      {AVATAR_SEEDS.slice(0, 5).map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            playSound('click', soundEnabled);
                            setTempMember((prev) => ({ ...prev, avatarSeed: s }));
                          }}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${
                            tempMember.avatarSeed === s ? 'border-[#58CC02] bg-emerald-50 scale-110' : 'border-slate-200'
                          }`}
                        >
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s}`}
                            alt={s}
                            className="w-5 h-5"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT ROLES */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">這個月你可以事奉哪些崗位？</h2>
                    <p className="text-xs font-extrabold text-slate-400">(可多選，至少選擇一個崗位)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
                    {ROLES.map((role) => {
                      const isSelected = tempMember.roles.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          onClick={() => toggleTempRole(role.id)}
                          className={`p-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center space-y-2 transition-all border-b-4 ${
                            isSelected
                              ? `${role.color} border-slate-900 shadow-sm scale-100`
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-3xl">{role.icon}</span>
                          <span className="text-xs">{role.shortName}</span>
                          <span className="text-[10px] font-bold opacity-80">{role.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT SUNDAY AVAILABILITY */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">哪些主日你可以出席服侍？</h2>
                    <p className="text-xs font-extrabold text-slate-400">點擊切換「得閒 🎉」或「忙碌 😴」</p>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto p-1">
                    {SUNDAYS.map((sunday) => {
                      const isAvailable = !!tempMember.availability[sunday.id];
                      return (
                        <div
                          key={sunday.id}
                          onClick={() => toggleTempAvailability(sunday.id)}
                          className={`p-3.5 rounded-2xl border-b-4 transition-all cursor-pointer flex items-center justify-between ${
                            isAvailable
                              ? 'bg-[#E5F8D0] border-[#58CC02] text-slate-900 shadow-sm'
                              : 'bg-rose-50 border-rose-300 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{isAvailable ? '🎉' : '😴'}</span>
                            <div>
                              <div className="font-black text-sm">{sunday.label}</div>
                              <div
                                className={`text-[10px] font-black ${
                                  isAvailable ? 'text-[#46A302]' : 'text-rose-500'
                                }`}
                              >
                                {isAvailable ? '得閒 (可用)' : '忙碌 / 休假'}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`px-3 py-1 rounded-xl text-xs font-black border-b-2 ${
                              isAvailable
                                ? 'bg-[#58CC02] text-white border-[#46A302]'
                                : 'bg-rose-400 text-white border-rose-600'
                            }`}
                          >
                            {isAvailable ? '出席' : '缺席'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {step === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">確認你的資料！</h2>
                    <p className="text-xs font-extrabold text-slate-400">核對無誤後即可提交排班系統</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm space-y-4">
                    {/* User Summary Header */}
                    <div className="flex items-center space-x-3 border-b-2 border-slate-100 pb-3">
                      <div
                        className="w-12 h-12 rounded-2xl border-2 border-slate-800 flex items-center justify-center"
                        style={{ backgroundColor: `#${tempMember.bgStyle}` }}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${tempMember.avatarSeed}`}
                          alt="avatar"
                          className="w-10 h-10"
                        />
                      </div>
                      <div>
                        <div className="font-black text-base text-slate-800">{tempMember.name}</div>
                        <div className="text-xs text-[#58CC02] font-black">敬拜隊核心成員</div>
                      </div>
                    </div>

                    {/* Roles Summary */}
                    <div>
                      <div className="text-xs font-black text-slate-400 mb-1.5">可服侍崗位：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {tempMember.roles.map((rId) => {
                          const rObj = ROLES.find((r) => r.id === rId);
                          return (
                            <span
                              key={rId}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200"
                            >
                              {rObj?.icon} {rObj?.shortName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Availability Summary */}
                    <div>
                      <div className="text-xs font-black text-slate-400 mb-1.5">主日出席狀況：</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SUNDAYS.map((s) => {
                          const isOk = tempMember.availability[s.id];
                          return (
                            <div
                              key={s.id}
                              className={`p-2 rounded-xl text-xs font-black flex items-center justify-between border ${
                                isOk ? 'bg-emerald-50 text-[#46A302] border-[#58CC02]' : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              <span>{s.label}</span>
                              <span>{isOk ? '✅ OK' : '❌ 不行'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS PAGE */}
              {step === 5 && (
                <div className="text-center space-y-5 animate-fadeIn py-4">
                  <div className="w-20 h-20 bg-[#58CC02] text-white rounded-3xl border-b-4 border-[#46A302] mx-auto flex items-center justify-center text-4xl shadow-lg animate-bounce">
                    🎉
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800">提交成功！</h2>
                    <p className="text-xs font-bold text-slate-400">
                      感謝你的參與，隊長將在統籌後發布最終排班表。
                    </p>
                  </div>

                  <div className="bg-emerald-50 border-2 border-[#58CC02] p-4 rounded-2xl text-left space-y-2">
                    <div className="font-black text-xs text-[#46A302] flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      資料已存入系統
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                      你可以隨時返回修改填報，或者切換至「隊長後台」檢視整體排班進度。
                    </p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => setViewMode('admin')}
                      className="w-full py-3.5 bg-[#1CB0F6] hover:bg-[#189cdb] text-white border-b-4 border-[#1482b8] rounded-2xl font-black text-sm flex items-center justify-center space-x-2 active:translate-y-1 transition-all shadow-md"
                    >
                      <Shield className="w-4 h-4" />
                      <span>查看全隊排班進度 (隊長)</span>
                    </button>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border-b-4 border-slate-300 rounded-2xl font-black text-xs active:translate-y-0.5 transition-all"
                    >
                      修改我的填報項目
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Button Action Area (Duolingo Style 3D Button) */}
            {step <= 4 && (
              <div className="pt-3 border-t-2 border-slate-100">
                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    className="w-full py-3.5 bg-[#58CC02] hover:bg-[#46A302] text-white border-b-4 border-[#3b8a02] active:border-b-0 active:translate-y-1 rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>下一頁</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitSurvey}
                    className="w-full py-3.5 bg-[#FFC800] hover:bg-[#ffb700] text-slate-900 border-b-4 border-[#e5a900] active:border-b-0 active:translate-y-1 rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>確認並提交 🎉</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW MODE 2: ADMIN DASHBOARD & AUTO ROSTER ================= */}
        {viewMode === 'admin' && (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#F7F9FA] overflow-y-auto max-h-[610px]">
            <div className="space-y-4">
              {/* Admin Banner Header */}
              <div className="bg-[#1CB0F6] text-white p-4 rounded-2xl border-b-4 border-[#1482b8] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base flex items-center">
                    <Shield className="w-5 h-5 mr-1.5 text-yellow-300" />
                    隊長統籌後台
                  </h3>
                  <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full">
                    8 人團隊
                  </span>
                </div>
                <p className="text-[11px] text-sky-100 font-bold">
                  檢視隊員填寫狀態，並點擊一鍵算牌進行最佳崗位分配。
                </p>
              </div>

              {/* Members Submission Status List */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-1">
                  <span>隊員填寫進度</span>
                  <span>{members.filter((m) => m.submitted).length} / {members.length} 已填</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-extrabold text-slate-700 truncate max-w-[80px]">
                        {m.name}
                      </span>
                      {m.submitted ? (
                        <span className="text-[#58CC02] font-black">✅ 完成</span>
                      ) : (
                        <span className="text-amber-500 font-black">⏳ 填寫中</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Scheduling Action */}
              <button
                onClick={autoSchedule}
                className="w-full py-3 bg-[#FFC800] hover:bg-[#ffb700] text-slate-900 border-b-4 border-[#e5a900] active:border-b-0 active:translate-y-1 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>一鍵智能自動排班</span>
              </button>

              {/* Generated Roster Results Card */}
              {scheduleResult && (
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                    <span className="font-black text-xs text-slate-800">本月自動排班成果</span>
                    <button
                      onClick={copyBroadcastText}
                      className="px-2.5 py-1 bg-[#58CC02] text-white border-b-2 border-[#46A302] rounded-xl font-black text-[10px] flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>複製廣播訊息</span>
                    </button>
                  </div>

                  {copiedNotification && (
                    <div className="text-[10px] font-black text-[#46A302] bg-emerald-50 p-1.5 rounded-lg text-center animate-pulse">
                      ✅ 已複製廣播訊息！可貼至 WhatsApp 發佈。
                    </div>
                  )}

                  {/* Sunday Cards Roster */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {SUNDAYS.map((s) => {
                      const roster = scheduleResult.assignments[s.id];
                      return (
                        <div key={s.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                          <div className="font-black text-xs text-slate-800 border-b border-slate-200 pb-1 flex justify-between">
                            <span>{s.label}</span>
                            <span className="text-[#1CB0F6]">陣容</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            {ROLES.map((r) => {
                              const assigned = roster ? roster[r.id] : null;
                              return (
                                <div key={r.id} className="flex items-center justify-between bg-white p-1 rounded border border-slate-100">
                                  <span className="text-slate-500 font-bold">{r.icon} {r.shortName}:</span>
                                  <span className="font-black text-slate-800">{assigned ? assigned.name.split(' ')[0] : '缺人'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="pt-3">
              <button
                onClick={() => setViewMode('wizard')}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 border-b-4 border-slate-300 rounded-2xl font-black text-xs active:translate-y-0.5 transition-all"
              >
                ← 返回問卷填寫頁
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
