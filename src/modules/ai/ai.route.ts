import express from "express";
import { chatController } from "../ai/ai.controller";

const router = express.Router();

router.post("/chat", chatController);

export default router;