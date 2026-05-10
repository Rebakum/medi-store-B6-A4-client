import { Response } from "express";
import { geminiModel } from "./ai.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

export const chatController = catchAsync(async (req: any, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return sendResponse(res, {
      success: false,
      statusCode: 400,
      message: "Message is required",
    });
  }

  const chat = geminiModel.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "You are a helpful medical store assistant." }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to assist customers with their medical store inquiries. How can I help you today?" }],
      },
    ],
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  const replyText = response.text();

  sendResponse(res, {
    message: "AI response generated",
    data: { reply: replyText },
  });
});