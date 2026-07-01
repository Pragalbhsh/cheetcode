import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Onboarding() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState<any[]>([])
  const [showTopics, setShowTopics] = useState(false)
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    fetch('https://cheetcode-api.onrender.com/topics')
      .then(res => res.json())
      .then(data => setTopics(data))
  }, [])

  const selectTopic = async (topicId: string) => {
    await fetch('https://cheetcode-api.onrender.com/user/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, topicId })
    })
    navigate('/daily')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white p-6">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">Welcome to Cheatcode 🔥</h1>
        <p className="text-gray-400 mb-10">How would you describe yourself?</p>

        {!showTopics ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => selectTopic(topics[0]?.id)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition"
            >
              🌱 Beginner — start from scratch
            </button>
            <button
              onClick={() => setShowTopics(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 rounded-xl transition"
            >
              ⚡ Experienced — pick my topic
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-left max-h-96 overflow-y-auto">
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => selectTopic(topic.id)}
                className="bg-gray-800 hover:bg-indigo-600 text-white px-4 py-3 rounded-xl transition text-sm"
              >
                {topic.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Onboarding