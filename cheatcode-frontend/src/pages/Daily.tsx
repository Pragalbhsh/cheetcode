import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
 

function Daily() {
  const [session, setSession] = useState<any>(null)
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    fetch(`http://localhost:3000/daily/${userId}`)
      .then(res => res.json())
      .then(data => setSession(data))
  }, [])

  if (!session) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">

      <button
  onClick={() => {
    localStorage.clear()
    navigate('/login')
  }}
  className="fixed top-4 right-4 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm px-4 py-2 rounded-xl transition"
>
  Logout
</button>
        
        <h1 className="text-3xl font-bold mb-2">Today's Session 🔥</h1>
        <p className="text-gray-400 mb-10">Complete these in order</p>

        {/* Revision Question */}
        {session.revisionQuestion ? (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <span className="text-xs bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full">Revision</span>
            <h2 className="text-xl font-semibold mt-3 mb-1">{session.revisionQuestion.title}</h2>
            <p className="text-gray-400 text-sm mb-4">{session.revisionQuestion.difficulty}</p>
            <a href={`https://leetcode.com/problems/${session.revisionQuestion.leetcodeSlug}`} target="_blank" className="text-indigo-400 hover:underline text-sm">Open on LeetCode →</a>
            <div className="flex gap-3 mt-6">
             {['FORGOT', 'HARD', 'OKAY', 'EASY'].map((rating) => (
             <button
               key={rating}
                onClick={async () => {
                  await fetch('http://localhost:3000/revision/rate', {
                  method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  problemId: session.revisionQuestion.id,
                  rating
          })
        })
        alert(`Marked as ${rating}!`)
      }}
      className="flex-1 bg-gray-800 hover:bg-indigo-600 text-white py-2 rounded-xl text-sm transition"
    >
      {rating}
    </button>
  ))}
</div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6 text-gray-400">No revision due today 🎉</div>
        )}

        {/* Today's Topic */}
        {session.topicQuestion && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <span className="text-xs bg-purple-900 text-purple-300 px-3 py-1 rounded-full">Today's Topic</span>
            <h2 className="text-xl font-semibold mt-3 mb-1">{session.topicQuestion.title}</h2>
            <p className="text-gray-400 text-sm mb-4">{session.topicQuestion.difficulty}</p>
            <a href={`https://leetcode.com/problems/${session.topicQuestion.leetcodeSlug}`} target="_blank" className="text-indigo-400 hover:underline text-sm">Open on LeetCode →</a>
            <button
  onClick={async () => {
    await fetch('http://localhost:3000/problem/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        problemId: session.topicQuestion.id
      })
    })
    alert('Problem marked as solved! ✅')
  }}
  className="mt-4 w-full bg-green-800 hover:bg-green-700 text-green-300 font-semibold py-2 rounded-xl transition"
>
  Mark as Solved ✅
</button>
          </div>
        )}

        {/* Streak Protector */}
        {session.streakQuestion && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <span className="text-xs bg-orange-900 text-orange-300 px-3 py-1 rounded-full">Streak Protector 🔒</span>
            <h2 className="text-xl font-semibold mt-3 mb-1">{session.streakQuestion.title}</h2>
            <p className="text-gray-400 text-sm mb-4">{session.streakQuestion.difficulty}</p>
            <a href={`https://leetcode.com/problems/${session.streakQuestion.leetcodeSlug}`} target="_blank" className="text-indigo-400 hover:underline text-sm">Open on LeetCode →</a>
          </div>
        )}

      </div>
    </div>
  )
}

export default Daily