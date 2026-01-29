import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  node_env: process.env.NODE_ENV || "development",
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  database_url: process.env.DATABASE_URL || "",
  frontend_url: process.env.FRONTEND_URL || "",
  app_email_host:process.env.APP_EMAIL_HOST || "smtp.gmail.com",
  app_email_port: process.env.APP_EMAIL_PORT || 587,
  app_user: process.env.APP_USER || "",
  app_password: process.env.APP_PASSWORD || "",
  app_email_from:process.env.APP_EMAIL_FROM|| `My App <${process.env.APP_USER}`,
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET as string,
    refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  },
 
};

if (!config.jwt.access_secret || !config.jwt.refresh_secret) {
  throw new Error("JWT secrets are missing in .env");
}

export default config;
