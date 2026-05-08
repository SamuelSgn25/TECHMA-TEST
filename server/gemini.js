const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const askDriveAI = async (prompt, history, fileContext) => {
  try {
    // On utilise 1.5-flash : c'est le plus rapide et le plus généreux en version gratuite
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let cleanedHistory = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    while (cleanedHistory.length > 0 && cleanedHistory[0].role !== 'user') {
      cleanedHistory.shift();
    }

    let fullPrompt = prompt;
    if (fileContext) {
      fullPrompt = `CONTEXTE FICHIER: ${fileContext.name}\n${prompt}`;
    }

    const chat = model.startChat({
      history: cleanedHistory,
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    
    // Si flash échoue, on tente le pro (fallback)
    if (error.message.includes("404") || error.message.includes("500")) {
      try {
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await modelPro.generateContent(prompt);
        return result.response.text();
      } catch (e) {
        return "Erreur : Les modèles Gemini sont saturés ou votre clé API est limitée. Réessayez dans une minute.";
      }
    }
    return "Une erreur est survenue lors de la communication avec l'IA.";
  }
};

module.exports = { askDriveAI };
