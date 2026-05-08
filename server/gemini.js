const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Analyse un fichier ou répond à une question basée sur le contexte
 * @param {string} prompt - La question de l'utilisateur
 * @param {Array} history - L'historique de la conversation
 * @param {Object} fileContext - (Optionnel) Contenu ou métadonnées du fichier
 */
const askDriveAI = async (prompt, history = [], fileContext = null) => {
  try {
    let contextString = "";
    if (fileContext) {
      contextString = `Contexte du fichier (${fileContext.name}): ${fileContext.content || "Fichier multimédia ou document volumineux"}. \n\n`;
    }

    const fullPrompt = `${contextString}Utilisateur: ${prompt}`;
    
    // Configuration du chat avec historique
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erreur Drive AI:", error);
    throw new Error("Désolé, l'assistant Drive AI rencontre un problème.");
  }
};

module.exports = { askDriveAI };
