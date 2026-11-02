import { supabase } from './src/supabase'
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

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Jack', 'Maria', 'Zoe', 'Alexander', 'Sophia', 'Leo', 'Oliver', 'Maya'];

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('wizard'); // 'wizard' | 'admin'
  const [step, setStep] = useState(1); // Steps 1 -> 5
  
  const [memberName, setMemberName] = useState('');
  const [selectedRole, setSelectedRole] = useState('worship_lead');
  const [avatarSeed, setAvatarSeed] = useState('Felix');
  const [availabilityMap, setAvailabilityMap] = useState({
    '2026-11-01': true,
    '2026-11-08': true,
    '2026-11-15': true,
    '2026-11-22': true,
  });

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [scheduleResult, setScheduleResult] = useState(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 提交問卷到 Supabase
  const handleSubmitSurvey = async () => {
    if (!memberName.trim()) {
      alert('請輸入你的名字！');
      return;
    }

    playSound('success', soundEnabled);
    setConfettiTrigger((prev) => prev + 1);
    setLoading(true);

    try {
      // 1. 寫入隊員資料到 users 表
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          { 
            name: memberName, 
            role: selectedRole, 
            avatar_seed: avatarSeed 
          }
        ])
        .select();

      if (userError) throw userError;
      const userId = userData[0].id;

      // 2. 寫入該隊員填報的時間到 availability 表
      const availabilityRecords = Object.entries(availabilityMap).map(([date, isAvailable]) => ({
        user_id: userId,
        date: date,
        status: isAvailable ? 'available' : 'unavailable'
      }));

      const { error: avlError } = await supabase
        .from('availability')
        .insert(availabilityRecords);

      if (avlError) throw avlError;

      setStep(5); // 進入成功頁面
    } catch (error) {
      console.error('提交失敗:', error.message);
      alert('提交時發生錯誤：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 管理員讀取所有提交數據
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: users, error: userErr } = await supabase.from('users').select('*');
      if (userErr) throw userErr;

      const { data: avls, error: avlErr } = await supabase.from('availability').select('*');
      if (avlErr) throw avlErr;

      const combined = users.map(user => ({
        ...user,
        availability: avls.filter(a => a.user_id === user.id)
      }));

      setAdminSubmissions(combined);
      runAutoSchedule(combined);
    } catch (err) {
      console.error('讀取後台數據失敗', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 自動排班演算法
  const runAutoSchedule = (submissions) => {
    if (!submissions || submissions.length === 0) return;

    const assignments = {};
    const memberServiceCount = {};
    submissions.forEach((m) => (memberServiceCount[m.id] = 0));

    SUNDAYS.forEach((s) => {
      const sundayRoster = {};
      const assignedThisSunday = new Set();

      ROLES.forEach((role) => {
        const candidates = submissions.filter((m) => {
          if (assignedThisSunday.has(m.id)) return false;
          const avl = m.availability.find(a => a.date === s.id);
          const isAvailable = avl ? avl.status === 'available' : false;
          const matchRole = m.role === role.name || Math.random() > 0.3; // 支援跨崗位
          return isAvailable && matchRole;
        });

        if (candidates.length > 0) {
          candidates.sort((a, b) => (memberServiceCount[a.id] || 0) - (memberServiceCount[b.id] || 0));
          const chosen = candidates[0];
          sundayRoster[role.id] = chosen;
          assignedThisSunday.add(chosen.id);
          memberServiceCount[chosen.id] = (memberServiceCount[chosen.id] || 0) + 1;
        } else {
          sundayRoster[role.id] = null;
        }
      });

      assignments[s.id] = sundayRoster;
    });

    setScheduleResult({ assignments, memberServiceCount });
  };

  // 複製廣播文字
  const copyBroadcastText = () => {
    playSound('click', soundEnabled);
    if (!scheduleResult) return;

    let text = `✨ 【本月敬拜隊服侍陣容名單】 ✨\n各位隊友辛苦了！以下是雲端自動配對陣容：\n\n`;

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
            雲端問卷模式
          </span>
        </div>

        <button
          onClick={() => {
            const nextMode = viewMode === 'wizard' ? 'admin' : 'wizard';
            setViewMode(nextMode);
            playSound('click', soundEnabled);
            if (nextMode === 'admin') fetchAdminData();
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

      {/* Mobile Device Frame Container */}
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
              
              {/* STEP 1: NAME & AVATAR */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">你叫咩名？</h2>
                    <p className="text-xs font-extrabold text-slate-400">請輸入你的真實姓名或暱稱</p>
                  </div>

                  <div className="flex flex-col items-center py-2">
                    <div className="w-24 h-24 rounded-2xl border-4 border-slate-800 bg-emerald-50 flex items-center justify-center overflow-hidden shadow-inner mb-3">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`}
                        alt="Avatar"
                        className="w-20 h-20"
                      />
                    </div>
                    <button
                      onClick={() => {
                        playSound('click', soundEnabled);
                        const rand = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
                        setAvatarSeed(rand);
                      }}
                      className="flex items-center gap-1 text-xs font-black text-[#1CB0F6] bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200 hover:bg-sky-100 transition"
                    >
                      <RefreshCw size={14} /> 隨機切換造型
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="例如：Walter / 頌恩"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-bold focus:outline-none focus:border-[#58CC02] shadow-sm transition"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT ROLE */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">你的主要服侍崗位？</h2>
                    <p className="text-xs font-extrabold text-slate-400">請選擇你最常負責的崗位</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1">
                    {ROLES.map((role) => {
                      const isSelected = selectedRole === role.name;
                      return (
                        <button
                          key={role.id}
                          onClick={() => {
                            playSound('click', soundEnabled);
                            setSelectedRole(role.name);
                          }}
                          className={`p-3.5 rounded-2xl font-black text-sm flex flex-col items-center justify-center space-y-2 transition-all border-b-4 ${
                            isSelected
                              ? `${role.color} border-slate-900 shadow-sm scale-105`
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

              {/* STEP 3: SELECT AVAILABILITY */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-slate-800">哪些主日你可以出席？</h2>
                    <p className="text-xs font-extrabold text-slate-400">點擊切換「得閒 🎉」或「忙碌 😴」</p>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto p-1">
                    {SUNDAYS.map((sunday) => {
                      const isAvailable = !!availabilityMap[sunday.id];
                      return (
                        <div
                          key={sunday.id}
                          onClick={() => {
                            playSound('toggle', soundEnabled);
                            setAvailabilityMap(prev => ({
                              ...prev,
                              [sunday.id]: !isAvailable
                            }));
                          }}
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
                              <div className={`text-[10px] font-black ${isAvailable ? 'text-[#46A302]' : 'text-rose-500'}`}>
                                {isAvailable ? '得閒 (可用)' : '忙碌 / 休假'}
                              </div>
                            </div>
                          </div>

                          <div className={`px-3 py-1 rounded-xl text-xs font-black border-b-2 ${
                            isAvailable ? 'bg-[#58CC02] text-white border-[#46A302]' : 'bg-rose-400 text-white border-rose-600'
                          }`}>
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
                    <p className="text-xs font-extrabold text-slate-400">核對無誤後即可送出至雲端資料庫</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center space-x-3 border-b-2 border-slate-100 pb-3">
                      <div className="w-12 h-12 rounded-2xl border-2 border-slate-800 bg-emerald-50 flex items-center justify-center">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`} alt="avatar" className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="font-black text-base text-slate-800">{memberName || '未填寫名字'}</div>
                        <div className="text-xs text-[#58CC02] font-black">崗位：{selectedRole}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-black text-slate-400 mb-1">主日出席狀況：</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SUNDAYS.map((s) => {
                          const isOk = availabilityMap[s.id];
                          return (
                            <div key={s.id} className={`p-2 rounded-xl text-xs font-black flex items-center justify-between border ${
                              isOk ? 'bg-emerald-50 text-[#46A302] border-[#58CC02]' : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
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
                    <p className="text-xs font-bold text-slate-400">資料已順利同步至 Supabase 雲端資料庫 🙏</p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setViewMode('admin');
                        fetchAdminData();
                      }}
                      className="w-full py-3.5 bg-[#1CB0F6] hover:bg-[#189cdb] text-white border-b-4 border-[#1482b8] rounded-2xl font-black text-sm flex items-center justify-center space-x-2 active:translate-y-1 transition-all shadow-md"
                    >
                      <Shield className="w-4 h-4" />
                      <span>查看管理員排班後台</span>
                    </button>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 border-b-4 border-slate-300 rounded-2xl font-black text-xs active:translate-y-0.5 transition-all"
                    >
                      重新填寫 / 修改資料
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Button Action Area */}
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
                    disabled={loading}
                    className="w-full py-3.5 bg-[#FFC800] hover:bg-[#ffb700] text-slate-900 border-b-4 border-[#e5a900] active:border-b-0 active:translate-y-1 rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>{loading ? '上傳中...' : '確認並提交到雲端 🎉'}</span>
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
              <div className="bg-[#1CB0F6] text-white p-4 rounded-2xl border-b-4 border-[#1482b8] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base flex items-center">
                    <Shield className="w-5 h-5 mr-1.5 text-yellow-300" />
                    隊長雲端後台
                  </h3>
                  <button
                    onClick={fetchAdminData}
                    className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-white/30"
                  >
                    <RefreshCw size={10} /> 重新整理
                  </button>
                </div>
                <p className="text-[11px] text-sky-100 font-bold">
                  已收到 {adminSubmissions.length} 位隊員的雲端填報數據。
                </p>
              </div>

              {/* Schedule Results Preview */}
              {scheduleResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider">📅 自動排班結果</h4>
                    <button
                      onClick={copyBroadcastText}
                      className="px-3 py-1.5 bg-[#58CC02] text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1 hover:bg-[#46A302]"
                    >
                      <Copy size={12} /> {copiedNotification ? '已複製！' : '一鍵複製名單'}
                    </button>
                  </div>

                  {SUNDAYS.map((s) => {
                    const roster = scheduleResult.assignments[s.id];
                    return (
                      <div key={s.id} className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-sm space-y-2">
                        <div className="font-black text-xs text-[#1CB0F6] border-b border-slate-100 pb-1 flex justify-between">
                          <span>{s.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          {ROLES.map((r) => {
                            const assignedMember = roster ? roster[r.id] : null;
                            return (
                              <div key={r.id} className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <span className="font-bold text-slate-500">{r.icon} {r.shortName}</span>
                                <span className={`font-black ${assignedMember ? 'text-slate-800' : 'text-rose-500'}`}>
                                  {assignedMember ? assignedMember.name : '⚠️ 缺人'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 mt-4">
              <button
                onClick={() => setViewMode('wizard')}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-black text-xs transition-all"
              >
                返回填報問卷
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
