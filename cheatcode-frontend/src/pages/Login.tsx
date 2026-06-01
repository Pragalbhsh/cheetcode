function Login() {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back 👋</h1>
          <p className="text-gray-400 mb-8">Login to your Cheatcode account</p>
  
          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition">
              Login
            </button>
            <p className="text-gray-400 text-center text-sm">
              Don't have an account?{' '}
              <span className="text-indigo-400 cursor-pointer hover:underline">Register</span>
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  export default Login