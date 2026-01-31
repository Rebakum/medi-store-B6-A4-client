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
  access_secret: process.env.JWT_ACCESS_SECRET || "",
  refresh_secret: process.env.JWT_REFRESH_SECRET || "",
  access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "7d",
  refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
},


  bcrypt: {
    salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  },
  super_admin_email: process.env.SUPER_ADMIN_EMAIL || "",
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD || "",
  auto_seed_super_admin: process.env.AUTO_SEED_SUPER_ADMIN === "true"? "true": "false",
 
};



export default config;
