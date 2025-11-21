module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { essay, essayType } = req.body;

    if (!essay || !essayType) {
      return res.status(400).json({ error: 'Essay and essay type are required' });
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are an expert essay analyst. Analyze this ${essayType} essay and provide feedback in the following JSON format (respond ONLY with valid JSON, no markdown, no preamble):

{
  "aiDetection": {
    "aiProbability": 45,
    "confidenceScore": 87,
    "likelihood": "low",
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
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ 
        error: 'Anthropic API error', 
        details: errorData
      });
    }

    const data = await response.json();
    const text = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    
    const cleanText = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    return res.status(200).json(parsed);
    
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to analyze essay', 
      message: error.message
    });
  }
};
