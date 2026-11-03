import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [step, setStep] = useState(1); // 1: 名字/頭像, 2: 選擇意向, 3: 確認送出, 4: 完成
  const [name, setName] = useState('');
  const [savedNames, setSavedNames] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  
// 10 個保證順利載入、自然圓潤的年青人頭像
  // 10 個穩定且高質素的年青人頭像
 const youthAvatars = [
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost2&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost3&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost4&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost5&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost6&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost7&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost8&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost9&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ghost10&backgroundColor=ffdfbf',
  ];

  const [availability, setAvailability] = useState({
    '10/11 主日': 'ok',
    '17/11 主日': 'ok',
    '24/11 主日': 'ok',
    '01/12 主日': 'ok',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 讀取本地儲存過的名字
  useEffect(() => {
    try {
      const stored = localStorage.getItem('worship_saved_names');
      if (stored) {
        setSavedNames(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 隨機切換頭像
  const randomizeAvatar = () => {
    const randomIndex = Math.floor(Math.random() * youthAvatars.length);
    setSelectedAvatar(randomIndex);
  };

  // 選擇已儲存的名字
  const handleSelectSavedName = (savedName) => {
    setName(savedName);
  };

  // 儲存名字到 LocalStorage
  const handleNextStep = () => {
    if (!name.trim()) {
      alert('請輸入或選擇你的名字');
      return;
    }
    const trimmed = name.trim();
    let updatedNames = savedNames.filter(n => n !== trimmed);
    updatedNames = [trimmed, ...updatedNames].slice(0, 5); // 最多記住5個
    setSavedNames(updatedNames);
    try {
      localStorage.setItem('worship_saved_names', JSON.stringify(updatedNames));
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
      setStep(4);
    } catch (err) {
      console.error('Submit error:', err.message);
      setErrorMessage(`提交時發生錯誤：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between font-sans">
      {/* 頂部進度條與標題 */}
      <header className="w-full bg-slate-800 border-b border-slate-700 px-6 py-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl font-bold tracking-wide text-blue-400">敬拜隊服侍意向表</h1>
          </div>
          <div className="text-sm font-semibold text-slate-400">
            步驟 {step} / 4
          </div>
        </div>
        {/* 進度條 */}
        <div className="max-w-3xl mx-auto mt-3 w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </header>

      {/* 主要內容區 (全螢幕響應式) */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        
        {/* 步驟一：名字與頭像設定 */}
        {step === 1 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-center text-blue-300">你是邊個位敬拜者？</h2>
            
            {/* 頭像預覽與隨機切換 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-28 h-28 rounded-full bg-slate-700 border-4 border-blue-500 overflow-hidden shadow-lg p-1 bg-white">
                <img 
                  src={youthAvatars[selectedAvatar]} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <button
                onClick={randomizeAvatar}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-300 px-3 py-1.5 rounded-full border border-slate-600 transition"
              >
                🎲 隨機切換造型
              </button>
            </div>

            {/* 輸入名字 */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300 font-medium">你的名字：</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：John / 頌恩"
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 快速選取曾記錄的名字 */}
            {savedNames.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400">快速選擇以前記錄的名字：</span>
                <div className="flex flex-wrap gap-2">
                  {savedNames.map((saved, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSavedName(saved)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        name === saved 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      👤 {saved}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleNextStep}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-200"
            >
              下一步 ➡️
            </button>
          </div>
        )}

        {/* 步驟二：選擇服侍意向 */}
        {step === 2 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-300">你好，{name}！請填寫服侍意向</h2>
              <button 
                onClick={() => setStep(1)} 
                className="text-xs text-slate-400 hover:text-white underline"
              >
                修改名字
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(availability).map((dateKey) => {
                const currentStatus = availability[dateKey];
                return (
                  <div key={dateKey} className="bg-slate-900/60 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{dateKey}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(dateKey, 'ok')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentStatus === 'ok' 
                            ? 'bg-emerald-600 text-white shadow' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        ✅ OK
                      </button>
                      <button
                        onClick={() => handleStatusChange(dateKey, 'no')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentStatus === 'no' 
                            ? 'bg-rose-600 text-white shadow' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        ❌ 不行
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl transition"
              >
                ⬅️ 上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition"
              >
                下一步 ➡️
              </button>
            </div>
          </div>
        )}

        {/* 步驟三：確認資料 */}
        {step === 3 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-center text-blue-300">確認你的資料！</h2>
            
            <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-xl space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-blue-500 overflow-hidden">
                  <img src={youthAvatars[selectedAvatar]} alt="Avatar" className="w-full h-full object-contain bg-white rounded-full p-1" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">敬拜者</div>
                  <div className="text-lg font-bold text-white">{name}</div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="text-xs text-slate-400">服侍意向清單：</div>
                {Object.entries(availability).map(([date, status]) => (
                  <div key={date} className="flex justify-between text-sm">
                    <span className="text-slate-300">{date}</span>
                    <span className={status === 'ok' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {status === 'ok' ? '✅ 可以服侍' : '❌ 無法服侍'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-900/50 border border-rose-700 text-rose-200 p-3 rounded-xl text-sm text-center">
                {errorMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-1/3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3.5 rounded-xl transition"
              >
                修改
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>上傳中...</span>
                  </>
                ) : (
                  <span>🚀 確認送出</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 步驟四：完成送出 */}
        {step === 4 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-blue-300">提交成功！</h2>
            <p className="text-slate-300 text-sm">
              多謝你 {name}！你的敬拜意向已經成功記錄到雲端資料庫。
            </p>
            <button
              onClick={() => {
                setStep(1);
                setName('');
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition"
            >
              🔄 填寫下一個或重新整理
            </button>
          </div>
        )}

      </main>

      {/* 底部版權 */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-800">
        Worship Team Scheduling App © 2026
      </footer>
    </div>
  );
}
