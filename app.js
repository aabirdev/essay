const { useState } = React;
const { AlertCircle, CheckCircle, Flag, Wrench, Loader2 } = lucide;

function EssayAnalyzer() {
  const [essay, setEssay] = useState('');
  const [essayType, setEssayType] = useState('academic');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeEssay = async () => {
    if (!essay.trim()) {
      setError('Please enter an essay to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `You are an expert essay analyst. Analyze this ${essayType} essay and provide feedback in the following JSON format (respond ONLY with valid JSON, no markdown, no preamble):

{
  "aiDetection": {
    "aiProbability": 45,
    "confidenceScore": 87,
    "likelihood": "low/medium/high",
    "reasoning": "brief explanation",
    "indicators": ["indicator 1", "indicator 2", "indicator 3"]
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "flags": ["flag 1", "flag 2"],
  "fixes": ["fix 1", "fix 2", "fix 3"]
}

Note: 
- aiProbability should be 0-100 (percentage likelihood the text is AI-generated)
- confidenceScore should be 0-100 (how confident you are in the detection)
- Consider factors like: repetitive phrasing, unnatural transitions, generic language, perfect grammar, lack of personal voice, overly formal tone, predictable structure

Essay to analyze:
${essay}`
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');
      
      const cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setAnalysis(parsed);
    } catch (err) {
      setError('Failed to analyze essay. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLikelihoodColor = (likelihood) => {
    switch(likelihood) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Essay Analyzer</h1>
          <p className="text-gray-600 mb-6">Get AI-powered feedback on your essay</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Essay Type
            </label>
            <select
              value={essayType}
              onChange={(e) => setEssayType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="academic">Academic Essay</option>
              <option value="university">University Application Essay</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Your Essay
            </label>
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Paste your essay here..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {essay.split(/\s+/).filter(w => w).length} words
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={analyzeEssay}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Essay'
            )}
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                AI Detection Analysis
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">AI Probability</p>
                  <p className="text-5xl font-bold text-gray-800 mb-2">
                    {analysis.aiDetection.aiProbability}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(analysis.aiDetection.aiProbability)} transition-all duration-500`}
                      style={{ width: `${analysis.aiDetection.aiProbability}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Confidence Score</p>
                  <p className="text-5xl font-bold text-blue-600 mb-2">
                    {analysis.aiDetection.confidenceScore}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${analysis.aiDetection.confidenceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-xl border-2 mb-4 ${getLikelihoodColor(analysis.aiDetection.likelihood)}`}>
                <p className="font-bold text-lg mb-2">
                  Assessment: {analysis.aiDetection.likelihood.toUpperCase()}
                </p>
                <p className="text-sm leading-relaxed">{analysis.aiDetection.reasoning}</p>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <p className="font-semibold text-gray-800 mb-3">AI Indicators Detected:</p>
                <ul className="space-y-2">
                  {analysis.aiDetection.indicators.map((indicator, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-gray-400">▸</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Strengths
              </h2>
              <ul className="space-y-3">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-green-600 font-bold">•</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                Weaknesses
              </h2>
              <ul className="space-y-3">
                {analysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-orange-600 font-bold">•</span>
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Flag className="w-6 h-6 text-red-600" />
                Red Flags
              </h2>
              <ul className="space-y-3">
                {analysis.flags.map((flag, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-red-600 font-bold">•</span>
                    <span className="text-gray-700">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-600" />
                How to Fix & Improve
              </h2>
              <ul className="space-y-3">
                {analysis.fixes.map((fix, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-blue-600 font-bold">{idx + 1}.</span>
                    <span className="text-gray-700">{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EssayAnalyzer />);
