import { Request, Response } from "express";
import { geminiModel } from "./ai.service";



export const chatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // const reply = await getChatResponse(message);
   // 1. Start the chat session with the initial system instruction/history
const chat = geminiModel.startChat({
  history: [
    { 
      role: "user", 
      parts: [{ text: `You are a helpful medical store assistant.` }] 
    },
    { 
      role: "model", 
      parts: [{ text: "Understood. I am ready to assist customers with their medical store inquiries. How can I help you today?" }] 
    }
  ]
});

// 2. Send the user's specific message to the model
const result = await chat.sendMessage(message);

// 3. Get the text response
const response = await result.response;
const replyText = response.text();

console.log(replyText);
    res.json({
      success: true,
      data: { reply: replyText   },
    });
  }catch (error: any) {
  console.error("AI ERROR 👉", error);

  res.status(500).json({
    success: false,
    message: error.message || "Something went wrong",
  });
}
};