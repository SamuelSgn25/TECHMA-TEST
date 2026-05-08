const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askDriveAI = async (prompt, history, fileContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Nettoyage de l'historique : Gemini exige que le premier message soit 'user'
    // On retire les messages tant qu'on n'a pas un message 'user'
    let cleanedHistory = history
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Si le premier message n'est pas 'user', on le retire
    while (cleanedHistory.length > 0 && cleanedHistory[0].role !== 'user') {
      cleanedHistory.shift();
    }

    // Ajout du contexte fichier au prompt si présent
    let fullPrompt = prompt;
    if (fileContext) {
      fullPrompt = `Contexte fichier (${fileContext.name}) : ${fileContext.path}\n\nQuestion : ${prompt}`;
    }

    const chat = model.startChat({
      history: cleanedHistory,
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

module.exports = { askDriveAI };
