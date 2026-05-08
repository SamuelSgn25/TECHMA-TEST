const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Liste de modèles à essayer dans l'ordre (le premier qui répond gagne)
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
];

const callGemini = async (modelName, contents) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await axios.post(url, { contents }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse.";
};

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

  // Ajouter le prompt actuel avec le contexte fichier si présent
  let fullPrompt = prompt;
  if (fileContext) {
    fullPrompt = `[Fichier: ${fileContext.name}]\n\n${prompt}`;
  }
  contents.push({ role: 'user', parts: [{ text: fullPrompt }] });

  // Essayer chaque modèle jusqu'à ce qu'un fonctionne
  for (const model of MODELS) {
    try {
      console.log(`🤖 Tentative avec ${model}...`);
      const text = await callGemini(model, contents);
      console.log(`✅ Réponse obtenue via ${model}`);
      return text;
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      console.log(`⚠️  ${model} échoué (${status}): ${msg}`);
      // Continuer avec le modèle suivant
    }
  }

  return "Erreur : aucun modèle Gemini n'a pu répondre. Vérifiez que votre clé API est valide et que l'API 'Generative Language' est activée dans votre console Google Cloud.";
};

module.exports = { askDriveAI };
