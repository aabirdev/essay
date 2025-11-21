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
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `You are an expert essay analyst. Analyze this ${essayType} essay and provide feedback in the following JSON format (respond ONLY with valid JSON, no markdown, no preamble):

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
- likelihood should be "low", "medium", or "high"
- Consider factors like: repetitive phrasing, unnatural transitions, generic language, perfect grammar, lack of personal voice, overly formal tone, predictable structure

Essay to analyze:
${essay}`;

    // FIXED: Changed to v1 API and correct model name
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return res.status(500).json({ 
        error: 'Gemini API error', 
        details: errorData
      });
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean and parse JSON
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

