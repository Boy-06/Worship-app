import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('form'); // 'form': 填寫流程, 'schedule': 查看總更表
  const [step, setStep] = useState(1); // 1: 名字/頭像, 2: 選擇崗位, 3: 選擇意向, 4: 確認送出, 5: 完成
  const [name, setName] = useState('');
  const [savedProfiles, setSavedProfiles] = useState([]); // 儲存 { name, avatarSeed, roles }
  const [avatarSeed, setAvatarSeed] = useState('worship_default');
  const [roles, setRoles] = useState(['Vocal']); // 預設崗位（複選）
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0); // 目前選擇的組合方案 (0: 組合 1, 1: 組合 2...)

  const rolesList = [
    { id: 'Worship Leader', label: '👑 Worship Leader' },
    { id: 'Vocal', label: '🎤 Vocal' },
    { id: 'Guitarist', label: '🎸 Guitarist' },
    { id: 'Bass', label: '🎸 Bass' },
    { id: 'Drum', label: '🥁 Drum' },
    { id: 'Keys', label: '🎹 Keys' },
  ];

  // 💡 將任意名字轉為穩定整數 Hash，對應資料庫 avatar_index 並保證絕不重複
  const stringToHash = (str) => {
    let hash = 0;
    if (!str) return 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; 
    }
    return Math.abs(hash);
  };

  // 💡 以名字為基礎的 100% 獨一無二頭像生成器
  const getAvatarUrl = (seedString) => {
    const numericSeed = stringToHash(seedString);
    return `https://api.dicebear.com/10.x/gaze/svg?backgroundColor=0f0f12&bodyColor=ff2e88,00e5ff,7cff00,ffe600,ff6a00,b400ff&tags=animation&seed=${numericSeed}`;
  };

  const [availability, setAvailability] = useState({
    '10/11 敬拜': 'ok',
    '17/11 敬拜': 'ok',
    '24/11 敬拜': 'ok',
    '01/12 敬拜': 'ok',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [allSubmissions, setAllSubmissions] = useState([]); // 所有已提交者的數據

  // 1. 讀取本地儲存數據 & Supabase
  useEffect(() => {
    try {
      const stored = localStorage.getItem('worship_saved_profiles');
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        setAllSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id, memberName) => {
    if (!window.confirm(`確定要刪除「${memberName}」的登記紀錄嗎？`)) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setAllSubmissions(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(`刪除失敗：${err.message}`);
    }
  };

  const randomizeAvatar = () => {
    const randomSeed = name.trim() ? `${name.trim()}_${Math.random().toString(36).substring(2, 7)}` : Math.random().toString(36).substring(2, 9);
    setAvatarSeed(randomSeed);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (val.trim()) {
      setAvatarSeed(val.trim());
    }
  };

  const handleSelectSavedProfile = (profile) => {
    setName(profile.name);
    setAvatarSeed(profile.avatarSeed || profile.name);
    if (profile.roles && Array.isArray(profile.roles)) {
      setRoles(profile.roles);
    } else if (profile.role) {
      setRoles([profile.role]);
    }
  };

  const toggleRole = (roleId) => {
    setRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleNextStep1 = () => {
    if (!name.trim()) {
      alert('入你個名');
      return;
    }
    const trimmed = name.trim();
    let updatedProfiles = savedProfiles.filter(p => p.name !== trimmed);
    updatedProfiles = [{ name: trimmed, avatarSeed: avatarSeed, roles: roles }, ...updatedProfiles].slice(0, 5);
    
    setSavedProfiles(updatedProfiles);
    try {
      localStorage.setItem('worship_saved_profiles', JSON.stringify(updatedProfiles));
    } catch (e) {
      console.error(e);
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (roles.length === 0) {
      alert('請至少選擇一個崗位/樂器！');
      return;
    }
    setStep(3);
  };

  const handleStatusChange = (dateKey, status) => {
    setAvailability(prev => ({
      ...prev,
      [dateKey]: status
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const numericAvatarIndex = stringToHash(avatarSeed);
      const { error } = await supabase.from('users').insert([
        {
          name: name.trim(),
          avatar_index: numericAvatarIndex,
          role: roles.join(', '),
          availability: availability
        }
      ]);

      if (error) throw error;
      await fetchSubmissions();
      setStep(5);
    } catch (err) {
      console.error('Submit error:', err.message);
      setErrorMessage(`提交時發生錯誤：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 💡 多重組合演算法：計算出所有可能的組合版本（例如 組合 1、組合 2...）
  const calculateAllCombinations = () => {
    const dates = Object.keys(availability);
    
    // 生成兩種不同的輪替方案（組合1：預設最佳輪替；組合2：反向/交替輪替）
    const combinations = [];

    // 組合 1: 順序輪替 (正向)
    // 組合 2: 逆序輪替 (反向，讓輪休的人當正選)
    [0, 1].forEach((offset) => {
      const scheduleOption = {};
      const roleAssignmentsCount = {};

      dates.forEach((date, dateIndex) => {
        scheduleOption[date] = {};

        rolesList.forEach(roleItem => {
          const roleName = roleItem.id;
          if (!roleAssignmentsCount[roleName]) roleAssignmentsCount[roleName] = {};

          const candidates = allSubmissions.filter(member => {
            const isOk = member.availability && member.availability[date] === 'ok';
            const hasRole = member.role && member.role.includes(roleName);
            return isOk && hasRole;
          });

          if (candidates.length > 0) {
            candidates.forEach(c => {
              if (roleAssignmentsCount[roleName][c.name] === undefined) {
                roleAssignmentsCount[roleName][c.name] = 0;
              }
            });

            // 根據 offset 調整排列順序，形成不同的組合方案
            const sortedCandidates = [...candidates].sort((a, b) => {
              const countA = roleAssignmentsCount[roleName][a.name];
              const countB = roleAssignmentsCount[roleName][b.name];
              if (countA !== countB) return countA - countB;
              return ((candidates.indexOf(a) + dateIndex + offset) % candidates.length) - ((candidates.indexOf(b) + dateIndex + offset) % candidates.length);
            });

            const assigned = sortedCandidates[0];
            roleAssignmentsCount[roleName][assigned.name] += 1;
            const backups = sortedCandidates.slice(1);

            scheduleOption[date][roleName] = { assigned, backups };
          } else {
            scheduleOption[date][roleName] = null;
          }
        });
      });

      combinations.push(scheduleOption);
    });

    return combinations;
  };

  // 9. 渲染總更表（含組合切換按鈕）
  const renderTeamCombinations = () => {
    const dates = Object.keys(availability);
    const allOptions = calculateAllCombinations();
    const currentSchedule = allOptions[selectedOptionIndex] || allOptions[0];
    
    return (
      <div className="space-y-4 text-left mt-4 tracking-normal">
        
        {/* 🌟 頂部組合選擇切換標籤 🌟 */}
        <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200">
          <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between px-1">
            <span>🔀 選擇服侍組合方案：</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-extrabold">
              共 {allOptions.length} 種可能組合
            </span>
          </div>
          <div className="flex gap-2">
            {allOptions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOptionIndex(idx)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  selectedOptionIndex === idx
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>✨ 組合 {idx + 1}</span>
                {selectedOptionIndex === idx && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 顯示目前組合的各場次名單 */}
        {dates.map(date => {
          const dateRoles = currentSchedule[date];
          return (
            <div key={date} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="font-black text-blue-700 text-base mb-3 border-b pb-2 flex items-center justify-between">
                <span>📅 {date} 陣容（組合 {selectedOptionIndex + 1}）</span>
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-md border">
                  每崗位限 1 人
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rolesList.map(r => {
                  const item = dateRoles[r.id];
                  const memberAvatarUrl = item && item.assigned ? getAvatarUrl(item.assigned.name) : '';
                  return (
                    <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-500 min-w-[70px]">{r.label}:</span>
                        {item && item.assigned ? (
                          <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 rounded-full pl-1.5 pr-2 py-0.5">
                            <img 
                              src={memberAvatarUrl} 
                              alt="avatar" 
                              className="w-4 h-4 rounded-full shrink-0"
                            />
                            <span className="text-xs font-black text-blue-900">{item.assigned.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-400 font-semibold italic">尚空缺</span>
                        )}
                      </div>

                      {item && item.backups.length > 0 && (
                        <div className="text-[10px] text-slate-400" title={`輪休中: ${item.backups.map(b => b.name).join(', ')}`}>
                          (輪休: {item.backups.length}人)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 成員管理列表 (可刪除) */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 mt-6">
          <h4 className="text-xs font-bold text-slate-600 mb-2">已登記隊員總覽（點擊 ✕ 可刪除紀錄）：</h4>
          <div className="flex flex-wrap gap-2">
            {allSubmissions.map(member => (
              <div key={member.id} className="flex items-center space-x-1 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-2xs">
                <img src={getAvatarUrl(member.name)} alt="avatar" className="w-4 h-4 rounded-full" />
                <span className="text-xs font-bold text-slate-700">{member.name}</span>
                <span className="text-[10px] text-slate-400">({member.role})</span>
                <button
                  onClick={() => handleDeleteMember(member.id, member.name)}
                  className="w-3.5 h-3.5 text-[9px] bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-400 rounded-full flex items-center justify-center transition ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between font-sans tracking-normal leading-normal text-left">
      {/* 頂部 Header */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-2xs sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xl sm:text-2xl">🎵</span>
            <h1 className="text-lg sm:text-xl font-extrabold text-blue-600 whitespace-nowrap">敬拜 Schedule</h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                activeTab === 'form' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📝 登記意向
            </button>
            <button
              onClick={() => {
                setActiveTab('schedule');
                fetchSubmissions();
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'schedule' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📅 總更表</span>
              {allSubmissions.length > 0 && (
                <span className="bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {allSubmissions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'form' && (
          <div className="max-w-3xl mx-auto mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300" 
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        )}
      </header>

      {/* 主要內容區 */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {/* === 頁面一：填寫流程 === */}
        {activeTab === 'form' && (
          <>
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <h2 className="text-2xl font-black text-center text-slate-800">你係邊個？</h2>
                
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-blue-500 overflow-hidden shadow-md p-1">
                    <img 
                      src={getAvatarUrl(avatarSeed)} 
                      alt="Avatar" 
                      className="w-full h-full object-contain rounded-full bg-white"
                    />
                  </div>
                  <button
                    onClick={randomizeAvatar}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold px-4 py-2 rounded-full border border-blue-200 transition shadow-2xs"
                  >
                    🎲 隨機換個獨特造型
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-600 font-bold">你個名：</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="打喺度"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {savedProfiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 font-bold">你之前用過嘅名（點擊帶入數據）：</span>
                    <div className="flex flex-wrap gap-2">
                      {savedProfiles.map((profile, index) => {
                        const displayRoles = profile.roles ? profile.roles.join(', ') : profile.role;
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectSavedProfile(profile)}
                            className={`text-xs px-3 py-2 rounded-xl border font-bold transition flex items-center gap-1.5 shadow-2xs ${
                              name === profile.name 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <img 
                              src={getAvatarUrl(profile.avatarSeed || profile.name)} 
                              alt="icon" 
                              className="w-4 h-4 rounded-full"
                            />
                            <span>{profile.name}</span>
                            {displayRoles && <span className="opacity-75">({displayRoles})</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleNextStep1}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition text-lg"
                >
                  下一步 ➡️
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-center text-slate-800">你可以服侍嘅崗位/樂器？</h2>
                  <p className="text-xs text-center text-slate-400 mt-1">（可多選）</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {rolesList.map((r) => {
                    const isSelected = roles.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleRole(r.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border font-extrabold text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{r.label}</span>
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ml-1 ${
                          isSelected ? 'bg-white text-blue-600' : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl transition"
                  >
                    ⬅️ 上一步
                  </button>
                  <button
                    onClick={handleNextStep2}
                    className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition"
                  >
                    下一步 ➡️
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={getAvatarUrl(avatarSeed)} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full border-2 border-blue-500 shrink-0" 
                    />
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800">{name}</h2>
                      <span className="text-xs text-blue-600 font-bold">{roles.join(', ')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(1)} 
                    className="text-xs text-blue-600 font-bold hover:underline shrink-0"
                  >
                    修改資料
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.keys(availability).map((dateKey) => {
                    const currentStatus = availability[dateKey];
                    return (
                      <div key={dateKey} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                        <span className="font-bold text-slate-700 text-sm sm:text-base">{dateKey}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(dateKey, 'ok')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition ${
                              currentStatus === 'ok' 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' 
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                          >
                            ✅ OK
                          </button>
                          <button
                            onClick={() => handleStatusChange(dateKey, 'no')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition ${
                              currentStatus === 'no' 
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-200' 
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                          >
                            ❌ 唔得閒
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl transition"
                  >
                    ⬅️ 上一步
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition"
                  >
                    下一步 ➡️
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <h2 className="text-2xl font-black text-center text-slate-800">確認你填得啱</h2>
                
                <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-blue-500 shadow-sm overflow-hidden shrink-0">
                      <img src={getAvatarUrl(avatarSeed)} alt="Avatar" className="w-full h-full object-contain bg-white rounded-full" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-600 font-bold">敬拜者資訊</div>
                      <div className="text-xl font-black text-slate-800">{name}</div>
                      <div className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md inline-block mt-1">
                        {roles.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-blue-100 pt-3 space-y-2">
                    <div className="text-xs text-slate-500 font-bold">服侍清單：</div>
                    {Object.entries(availability).map(([date, status]) => (
                      <div key={date} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-600 font-medium">{date}</span>
                        <span className={status === 'ok' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                          {status === 'ok' ? '✅ 嚟到' : '❌ 嚟唔到'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-sm text-center font-bold">
                    {errorMessage}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep(3)}
                    disabled={loading}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl transition"
                  >
                    修改
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>上傳中...</span>
                      </>
                    ) : (
                      <span>🚀 送出</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
                <div className="text-6xl animate-bounce">🎉</div>
                <h2 className="text-2xl font-black text-blue-600">提交成功！</h2>
                <p className="text-slate-600 font-medium text-sm">
                  多謝你 {name}（{roles.join(', ')}）！已經幫你記低咗啦。
                </p>

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setStep(1);
                      setName('');
                    }}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition text-sm"
                  >
                    🔄 填寫下一個
                  </button>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition text-sm"
                  >
                    📅 查看總更表 ➡️
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* === 頁面二：查看總更表 === */}
        {activeTab === 'schedule' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                  <span>🤝</span> 服侍輪替更表
                </h2>
                <p className="text-xs text-slate-400 mt-1">點擊下方「組合 1 / 組合 2」可預覽不同備選方案</p>
              </div>
              <button
                onClick={fetchSubmissions}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold px-3 py-1.5 rounded-xl transition border border-slate-200 shrink-0"
              >
                🔄 重新整理
              </button>
            </div>

            {renderTeamCombinations()}

            <div className="pt-4 border-t text-center">
              <button
                onClick={() => {
                  setActiveTab('form');
                  setStep(1);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition text-sm"
              >
                ➕ 我要登記服侍意向
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 底部版權 */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        Worship Team Scheduling App © 2026
      </footer>
    </div>
  );
}
