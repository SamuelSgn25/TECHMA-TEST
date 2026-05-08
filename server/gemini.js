const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const askDriveAI = async (prompt, history, fileContext) => {
  // Construire l'historique au format Gemini
  let contents = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // Gemini exige que le premier message soit 'user'
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  // Ajouter le prompt avec contexte fichier
  let fullPrompt = prompt;
  if (fileContext) {
    fullPrompt = `[Fichier: ${fileContext.name}]\n\n${prompt}`;
  }
  contents.push({ role: 'user', parts: [{ text: fullPrompt }] });

  try {
    const response = await axios.post(API_URL, { contents }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`✅ Réponse Gemini obtenue`);
    return text || "Pas de réponse générée.";
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`❌ Gemini Error (${status}):`, msg);

    if (status === 429) {
      return "⏳ Le quota d'appels Gemini est temporairement atteint. Réessayez dans environ 1 minute.";
    }
    if (status === 400) {
      return "❌ Requête invalide. Vérifiez votre clé API Gemini.";
    }
    return "Une erreur est survenue avec l'IA. Réessayez dans un instant.";
  }
};

module.exports = { askDriveAI };
