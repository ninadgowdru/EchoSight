// Multimodal Visual Assistant API Client (Gemini 1.5 Flash)

/**
 * Send captured frame and voice query to Gemini 1.5 Flash
 * Handles Backend Web Service request with automatic Direct-API fallback
 */
export async function analyzeSceneWithGemini({
  imageBase64,
  question,
  customApiKey = '',
}) {
  const startTime = Date.now();
  const trimmedQuestion = question?.trim() || 'What is directly in front of me and are there any obstacles?';

  // 1. First, attempt to call the Node.js Render Web Service backend
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        question: trimmedQuestion,
        customApiKey: customApiKey || undefined,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        answer: data.answer,
        durationMs: data.durationMs || (Date.now() - startTime),
        source: 'backend',
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      // If backend returns 401 or key missing, check if we have a direct key to fall back to
      if (customApiKey && (response.status === 401 || response.status === 500)) {
        console.warn('Backend returned error, trying direct Gemini API with custom key...');
        return await callGeminiDirectly({ imageBase64, question: trimmedQuestion, apiKey: customApiKey, startTime });
      }
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }
  } catch (backendError) {
    console.warn('Backend call failed:', backendError.message);

    // 2. Direct Gemini 1.5 Flash REST API Fallback if customApiKey is available
    if (customApiKey) {
      try {
        return await callGeminiDirectly({ imageBase64, question: trimmedQuestion, apiKey: customApiKey, startTime });
      } catch (directError) {
        throw new Error(`Gemini direct API failed: ${directError.message}`);
      }
    }

    // 3. If neither backend nor API key is configured, return clear instructions
    if (backendError.message.includes('API Key missing') || backendError.message.includes('401')) {
      throw new Error('Gemini API key is not configured. Please add your free key in Settings or set GEMINI_API_KEY on the server.');
    }

    throw backendError;
  }
}

/**
 * Direct call to Google Gemini 1.5 Flash endpoint (useful for standalone client testing)
 */
async function callGeminiDirectly({ imageBase64, question, apiKey, startTime }) {
  let cleanBase64 = imageBase64;
  let mimeType = 'image/jpeg';

  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    cleanBase64 = parts[1];
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: question,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: `You are EchoSight, a rapid visual assistant AI for visually impaired and blind users.
Answer in 1 to 2 clear spoken sentences.
Directly address the user's specific question.
Include immediate spatial guidance (e.g., 'directly ahead about two steps', 'to your left at waist level').
Warn immediately if any trip hazards, stairs, obstacles, or safety risks exist.
Do NOT use markdown asterisks (*), bullet points, or emojis, because text will be read aloud by speech synthesis.
If image is unclear or pitch black, kindly advise them to adjust the camera or enable the flashlight.`,
        },
      ],
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 120,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  let answer = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!answer) {
    answer = 'I could not see anything clear enough to answer. Please try pointing the camera again.';
  }

  // Remove any stray formatting
  answer = answer.replace(/[*#_~`]/g, '').trim();

  return {
    success: true,
    answer,
    durationMs: Date.now() - startTime,
    source: 'direct-gemini',
  };
}
