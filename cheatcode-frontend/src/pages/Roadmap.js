import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
function Roadmap() {
    const [topics, setTopics] = useState([]);
    const [problems, setProblems] = useState({});
    const [expanded, setExpanded] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        fetch('https://cheetcode-api.onrender.com/topics')
            .then(res => res.json())
            .then(data => setTopics(data));
    }, []);
    const loadProblems = async (topicId) => {
        if (expanded === topicId) {
            setExpanded(null);
            return;
        }
        if (!problems[topicId]) {
            const res = await fetch(`https://cheetcode-api.onrender.com/problems/${topicId}`);
            const data = await res.json();
            setProblems(prev => ({ ...prev, [topicId]: data }));
        }
        setExpanded(topicId);
    };
    return (<div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Roadmap 🗺️</h1>
          <button onClick={() => navigate('/daily')} className="text-indigo-400 hover:underline text-sm">
            Go to Daily →
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {topics.map((topic, index) => (<div key={topic.id} className="bg-gray-900 rounded-2xl overflow-hidden">
              <button onClick={() => loadProblems(topic.id)} className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-6">{index + 1}</span>
                  <span className="font-semibold">{topic.name}</span>
                </div>
                <span className="text-gray-400">{expanded === topic.id ? '▲' : '▼'}</span>
              </button>

              {expanded === topic.id && problems[topic.id] && (<div className="border-t border-gray-800">
                  {problems[topic.id].map((problem) => (<div key={problem.id} className="flex justify-between items-center px-6 py-3 border-b border-gray-800 last:border-0">
                      <span className="text-sm text-gray-300">{problem.title}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${problem.difficulty === 'EASY' ? 'bg-green-900 text-green-300' :
                        problem.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-red-900 text-red-300'}`}>
                          {problem.difficulty}
                        </span>
                        <a href={`https://leetcode.com/problems/${problem.leetcodeSlug}`} target="_blank" className="text-indigo-400 hover:underline text-xs">
                          LC →
                        </a>
                      </div>
                    </div>))}
                </div>)}
            </div>))}
        </div>
      </div>
    </div>);
}
export default Roadmap;
