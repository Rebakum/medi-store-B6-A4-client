import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import config from "../config";

let io: Server | null = null;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://medi-store-fontend.vercel.app",
  // config.frontend_url (jodi thake)
].filter(Boolean) as string[];

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Postman / server-to-server
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Socket CORS blocked: ${origin}`), false);
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(" Socket Connected:", socket.id);

    // room join (customer/seller/admin notify)
    socket.on("join", ({ userId, role }: { userId?: string; role?: string }) => {
      if (userId) socket.join(`user:${userId}`);
      if (role) socket.join(`role:${role}`);
    });

    socket.on("disconnect", () => {
      console.log(" Socket Disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return io;
};
