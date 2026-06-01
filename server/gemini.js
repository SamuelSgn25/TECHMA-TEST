const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  throw new Error('Erreur : La variable GEMINI_API_KEY n\'est pas définie dans votre fichier .env.');
}

const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: MODEL });

const askDriveAI = async (prompt, history = [], fileContext) => {
  const conversationHistory = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const fullPrompt = fileContext
    ? `[Fichier: ${fileContext.name}]\n\n${prompt}`
    : prompt;

  const chat = model.startChat({ history: conversationHistory });

  try {
    const response = await chat.sendMessage(fullPrompt);
    const text = response?.response?.candidates?.[0]?.content?.parts
      ?.filter(part => part.text)
      .map(part => part.text)
      .join(' ')
      .trim();

    console.log('✅ Réponse Gemini obtenue');
    return text || 'Pas de réponse générée.';
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`❌ Gemini Error (${status}):`, msg);

    if (status === 429) {
      return '⏳ Le quota d\'appels Gemini est temporairement atteint. Réessayez dans environ 1 minute.';
    }
    if (status === 400) {
      return '❌ Requête invalide. Vérifiez votre clé API Gemini.';
    }
    return 'Une erreur est survenue avec l\'IA. Réessayez dans un instant.';
  }
};

module.exports = { askDriveAI };
