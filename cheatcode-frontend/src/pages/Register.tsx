import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async () => {
    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST', // POST request to the server to register the user
      headers: { 'Content-Type': 'application/json' }, // headers are the additional information that are sent with the request like the data iam sending is json type.
      body: JSON.stringify({ email, username, password }) // body is the data that is sent with the request
    })

    const data = await res.json() // get back the data from the server (token and userId)

    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      navigate('/onboarding')
    } else {
      setError(data.error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Create an account 🚀</h1>
        <p className="text-gray-400 mb-8">Start your DSA revision journey</p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleRegister} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition">
            Register
          </button>
          <p className="text-gray-400 text-center text-sm">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} className="text-indigo-400 cursor-pointer hover:underline">Login</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register