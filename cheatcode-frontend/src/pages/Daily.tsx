function Daily() {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          
          <h1 className="text-3xl font-bold mb-2">Today's Session 🔥</h1>
          <p className="text-gray-400 mb-10">Complete these in order</p>
  
          {/* Revision Question */}
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <span className="text-xs bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full">Revision</span>
            <h2 className="text-xl font-semibold mt-3 mb-1">Two Sum</h2>
            <p className="text-gray-400 text-sm mb-4">Arrays • Easy</p>
            <a href="#" className="text-indigo-400 hover:underline text-sm">Open on LeetCode →</a>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-red-900 hover:bg-red-800 text-red-300 py-2 rounded-xl text-sm transition">Forgot</button>
              <button className="flex-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-300 py-2 rounded-xl text-sm transition">Hard</button>
              <button className="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-300 py-2 rounded-xl text-sm transition">Okay</button>
              <button className="flex-1 bg-green-900 hover:bg-green-800 text-green-300 py-2 rounded-xl text-sm transition">Easy</button>
            </div>
          </div>
  
          {/* Today's Topic */}
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <span className="text-xs bg-purple-900 text-purple-300 px-3 py-1 rounded-full">Today's Topic</span>
            <h2 className="text-xl font-semibold mt-3 mb-1">Valid Anagram</h2>
            <p className="text-gray-400 text-sm mb-4">Arrays • Medium</p>
            <a href="#" className="text-indigo-400 hover:underline text-sm">Open on LeetCode →</a>
          </div>
  
          {/* Streak Protector */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <span className="text-xs bg-orange-900 text-orange-300 px-3 py-1 rounded-full">Streak Protector 🔒</span>
            <h2 className="text-xl font-semibold mt-3 mb-1">Contains Duplicate</h2>
            <p className="text-gray-400 text-sm mb-4">Arrays • Easy</p>
            <a href="#" className="text-indigo-400 hover:underline text-sm">Open on LeetCode →</a>
          </div>
  
        </div>
      </div>
    )
  }
  
  export default Daily