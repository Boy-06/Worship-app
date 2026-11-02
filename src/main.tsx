import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // 確保這裡是指向同層的 ./App.jsx

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
