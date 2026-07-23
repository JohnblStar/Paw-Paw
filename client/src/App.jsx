import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')

  useEffect(() => {
    axios.get('http://localhost:8000/health')
      .then((res) => {
        if (res.data.database === 'connected') {
          setConnectionStatus('Frontend ↔ Backend ─ MongoDB Atlas 연결 성공! 🎉')
        } else {
          setConnectionStatus('백엔드 서버는 응답하나 데이터베이스 연결이 불안정합니다. ⚠️')
        }
      })
      .catch(() => {
        setConnectionStatus('백엔드 API 서버(Port 8000)가 꺼져 있습니다. ❌')
      })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl bg-white p-8 shadow-xl text-center max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Paw:Paw Infrastructure Test</h1>
        <p className="text-lg font-medium text-indigo-600">{connectionStatus}</p>
      </div>
    </div>
  )
}

export default App