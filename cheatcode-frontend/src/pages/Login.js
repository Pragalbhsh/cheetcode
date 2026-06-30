import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleLogin = async () => {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            navigate('/daily');
        }
        else {
            setError(data.error);
        }
    };
    return (<div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back 👋</h1>
        <p className="text-gray-400 mb-8">Login to your Cheatcode account</p>

        <div className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleLogin} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition">
            Login
          </button>
          <p className="text-gray-400 text-center text-sm">
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} className="text-indigo-400 cursor-pointer hover:underline">Register</span>
          </p>
        </div>
      </div>
    </div>);
}
export default Login;
