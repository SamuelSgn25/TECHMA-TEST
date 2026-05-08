const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialisation avec la clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askDriveAI = async (prompt, history, fileContext) => {
  try {
    // Utilisation du modèle flash 1.5 (version stable)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Nettoyage de l'historique pour Gemini
    let cleanedHistory = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Gemini exige que le premier message soit 'user'
    while (cleanedHistory.length > 0 && cleanedHistory[0].role !== 'user') {
      cleanedHistory.shift();
    }

    let fullPrompt = prompt;
    if (fileContext) {
      fullPrompt = `[CONTEXTE FICHIER]\nNom: ${fileContext.name}\nLien: ${fileContext.path}\n\n[QUESTION]\n${prompt}`;
    }

    const chat = model.startChat({
      history: cleanedHistory,
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ Gemini Error Details:", error.message);
    if (error.message.includes("404")) {
      return "Désolé, le modèle Gemini est actuellement indisponible ou le nom du modèle est incorrect. Veuillez vérifier votre clé API.";
    }
    throw error;
  }
};

module.exports = { askDriveAI };
