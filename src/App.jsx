import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [step, setStep] = useState(1); // 1: 名字/頭像, 2: 選擇意向, 3: 確認送出, 4: 完成
  const [name, setName] = useState('');
  const [savedProfiles, setSavedProfiles] = useState([]); // 儲存 { name, avatarIndex }
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  // 10 個穩定載入的頭像
  const youthAvatars = [
    'https://api.dicebear.com/10.x/thumbs/svg?tags=animation&seed=ev65u55b',
    'https://api.dicebear.com/10.x/fun-emoji/svg?seed=fe2t1u67',
    'https://api.dicebear.com/10.x/thumbs/svg?tags=animation&seed=on1evvov',
    'https://api.dicebear.com/10.x/thumbs/svg?tags=animation&seed=6hdm6mol',
    'https://api.dicebear.com/10.x/fun-emoji/svg?seed=6bmyevrt',
    'https://api.dicebear.com/10.x/thumbs/svg?tags=animation&seed=s8g8uswn',
    'https://api.dicebear.com/10.x/thumbs/svg?tags=animation&seed=hkw1645c',
    'https://api.dicebear.com/10.x/fun-emoji/svg?seed=cshuztbl',
    'https://api.dicebear.com/10.x/thumbs/svg?tags=animation&seed=06og1tfq',
  ];

  const [availability, setAvailability] = useState({
    '10/11 敬拜': 'ok',
    '17/11 敬拜': 'ok',
    '24/11 敬拜': 'ok',
    '01/12 敬拜': 'ok',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [allSubmissions, setAllSubmissions] = useState([]); // 所有已提交者的數據

  // 1. 讀取本地儲存過的名字與頭像
  useEffect(() => {
    try {
      const stored = localStorage.getItem('worship_saved_profiles');
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 2. 隨機切換頭像
  const randomizeAvatar = () => {
    const randomIndex = Math.floor(Math.random() * youthAvatars.length);
    setSelectedAvatar(randomIndex);
  };

  // 3. 點擊歷史紀錄：同時自動選擇「名字」和「對應頭像」
  const handleSelectSavedProfile = (profile) => {
    setName(profile.name);
    if (profile.avatarIndex !== undefined) {
      setSelectedAvatar(profile.avatarIndex);
    }
  };

  // 4. 下一步：記錄名字與頭像到 LocalStorage
  const handleNextStep = () => {
    if (!name.trim()) {
      alert('入你個名');
      return;
    }
    const trimmed = name.trim();
    
    // 移除舊的同名紀錄，加入最新紀錄（包含名字與頭像索引）
    let updatedProfiles = savedProfiles.filter(p => p.name !== trimmed);
    updatedProfiles = [{ name: trimmed, avatarIndex: selectedAvatar }, ...updatedProfiles].slice(0, 5);
    
    setSavedProfiles(updatedProfiles);
    try {
      localStorage.setItem('worship_saved_profiles', JSON.stringify(updatedProfiles));
    } catch (e) {
      console.error(e);
    }
    setStep(2);
  };

  const handleStatusChange = (dateKey, status) => {
    setAvailability(prev => ({
      ...prev,
      [dateKey]: status
    }));
  };

  // 5. 提交至 Supabase 並載入所有提交資料計算陣容組合
  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.from('users').insert([
        {
          name: name.trim(),
          avatar_index: selectedAvatar,
          availability: availability
        }
      ]);

      if (error) throw error;

      // 讀取所有隊員資料來生成組合
      const { data: fetchResults, error: fetchError } = await supabase
        .from('users')
        .select('*');
      
      if (!fetchError && fetchResults) {
        setAllSubmissions(fetchResults);
      }

      setStep(4);
    } catch (err) {
      console.error('Submit error:', err.message);
      setErrorMessage(`提交時發生錯誤：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. 計算每場敬拜的可用陣容組合
  const renderTeamCombinations = () => {
    const dateKeys = Object.keys(availability);
    
    return (
      <div className="space-y-4 text-left mt-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <span>🤝</span> 各場次可用服侍組合
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dateKeys.map(date => {
            // 找出該天 availability[date] === 'ok' 的所有隊員
            const availableMembers = allSubmissions.filter(sub => {
              return sub.availability && sub.availability[date] === 'ok';
            });

            return (
              <div key={date} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="font-bold text-blue-700 text-sm mb-2 flex items-center justify-between">
                  <span>{date}</span>
                  <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {availableMembers.length} 人 OK
                  </span>
                </div>
                {availableMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableMembers.map((member, i) => (
                      <div key={i} className="flex items-center space-x-1.5 bg-white border border-slate-200 shadow-2xs rounded-full px-2.5 py-1">
                        <img 
                          src={youthAvatars[member.avatar_index] || youthAvatars[0]} 
                          alt="avatar" 
                          className="w-5 h-5 rounded-full object-contain"
                        />
                        <span className="text-xs font-medium text-slate-700">{member.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">暫時未有人選擇此時段</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      {/* 頂部 Header：藍底白字 */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl font-extrabold tracking-wide text-blue-600">敬拜 Schedule</h1>
          </div>
          <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            步驟 {step} / 4
          </div>
        </div>
        {/* 進度條 */}
        <div className="max-w-3xl mx-auto mt-3 w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        
        {/* 步驟一：名字與頭像設定 */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-black text-center text-slate-800">你係邊個？</h2>
            
            {/* 頭像預覽與隨機切換 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-blue-500 overflow-hidden shadow-md p-1">
                <img 
                  src={youthAvatars[selectedAvatar]} 
                  alt="Avatar" 
                  className="w-full h-full object-contain rounded-full bg-white"
                />
              </div>
              <button
                onClick={randomizeAvatar}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold px-4 py-2 rounded-full border border-blue-200 transition shadow-2xs"
              >
                🎲 隨機轉你個樣
              </button>
            </div>

            {/* 輸入名字 */}
            <div className="space-y-2">
              <label className="text-sm text-slate-600 font-bold">你個名：</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="打喺度"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* 快速選取曾記錄的名字與頭像 */}
            {savedProfiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-slate-500 font-bold">你之前用過嘅名（點擊帶入頭像）：</span>
                <div className="flex flex-wrap gap-2">
                  {savedProfiles.map((profile, index) => (
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
                        src={youthAvatars[profile.avatarIndex] || youthAvatars[0]} 
                        alt="icon" 
                        className="w-4 h-4 rounded-full"
                      />
                      <span>{profile.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleNextStep}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition duration-200 text-lg active:scale-98"
            >
              下一步 ➡️
            </button>
          </div>
        )}

        {/* 步驟二：選擇服侍意向 */}
        {step === 2 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={youthAvatars[selectedAvatar]} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-blue-500" 
                />
                <h2 className="text-xl font-extrabold text-slate-800">早晨，{name}！請揀</h2>
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                修改名
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(availability).map((dateKey) => {
                const currentStatus = availability[dateKey];
                return (
                  <div key={dateKey} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                    <span className="font-bold text-slate-700">{dateKey}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(dateKey, 'ok')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                          currentStatus === 'ok' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' 
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}
                      >
                        ✅ OK
                      </button>
                      <button
                        onClick={() => handleStatusChange(dateKey, 'no')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition ${
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
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl transition"
              >
                ⬅️ 上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition"
              >
                下一步 ➡️
              </button>
            </div>
          </div>
        )}

        {/* 步驟三：確認資料 */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-black text-center text-slate-800">確認你填得啱</h2>
            
            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-blue-500 shadow-sm overflow-hidden">
                  <img src={youthAvatars[selectedAvatar]} alt="Avatar" className="w-full h-full object-contain bg-white rounded-full" />
                </div>
                <div>
                  <div className="text-xs text-blue-600 font-bold">敬拜者</div>
                  <div className="text-xl font-black text-slate-800">{name}</div>
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
                onClick={() => setStep(2)}
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

        {/* 步驟四：完成送出與組合建議 */}
        {step === 4 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="text-6xl animate-bounce">🎉</div>
            <h2 className="text-2xl font-black text-blue-600">提交成功！</h2>
            <p className="text-slate-600 font-medium text-sm">
              多謝你 {name}！已經幫你記低咗啦。
            </p>

            {/* 顯示所有已提交的可能服侍組合 */}
            {renderTeamCombinations()}

            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  setStep(1);
                  setName('');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition text-sm"
              >
                🔄 填寫下一個或重新整理
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
