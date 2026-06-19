import { useNavigate } from 'react-router-dom'

function Onboarding() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">Welcome to Cheatcode 🔥</h1>
        <p className="text-gray-400 mb-10">How would you describe yourself?</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/daily')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition"
          >
            🌱 I'm a beginner — start from scratch
          </button>
          <button
            onClick={() => navigate('/daily')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 rounded-xl transition"
          >
            ⚡ I'm experienced — let me pick my topic
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding