import { useNavigate } from 'react-router-dom';
function Landing() {
    const navigate = useNavigate();
    return (<div className="min-h-screen bg-gray-950 text-white">
  
        {/* Navbar */}
        <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-indigo-400">Cheatcode 🔥</h1>
          <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition">Login</button>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition">
              Get Started
            </button>
          </div>
        </nav>
  
        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center px-4 py-32">
          <span className="bg-indigo-900 text-indigo-300 text-sm px-4 py-1 rounded-full mb-6">
            Striver SDE Sheet + Neetcode 150
          </span>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Stop forgetting what <br />
            <span className="text-indigo-400">you already solved</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mb-10">
            Cheatcode gives you a daily revision session based on spaced repetition. 
            Never forget Two Sum again.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold px-8 py-4 rounded-2xl transition">
            Start Revising Free →
          </button>
        </div>
  
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24 max-w-5xl mx-auto">
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-lg font-semibold mb-2">Spaced Repetition</h3>
            <p className="text-gray-400 text-sm">SM-2 algorithm schedules exactly when to revisit each problem based on how well you remember it.</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-lg font-semibold mb-2">Daily Session</h3>
            <p className="text-gray-400 text-sm">Every day get 3 questions — one revision, one new topic question, one to protect your LeetCode streak.</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Auto Import</h3>
            <p className="text-gray-400 text-sm">Already solved 100 problems? Connect your LeetCode or GFG account and we'll sync your progress instantly.</p>
          </div>
        </div>
  
      </div>);
}
export default Landing;
