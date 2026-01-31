import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { authValidation } from "./auth.validate";
import { authController } from "./auth.controller";
import { authorize } from "../../middleware/authorize";
import { authenticate } from "../../middleware/auth";

const authRouter = Router();

// health/admin test
authRouter.get("/admin", authenticate, authorize("ADMIN"), (_req, res) => {
  res.json({ success: true, message: "Welcome Admin" });
});

// auth
authRouter.post(
  "/register",
  validateRequest(authValidation.register),
  authController.register
);

authRouter.post(
  "/login",
  validateRequest(authValidation.login),
  authController.login
);

// refresh uses cookie refreshToken (no authenticate needed)
authRouter.post("/refresh", authController.refresh);

// logout clears cookie (no authenticate required, but ok if you want)
authRouter.post("/logout", authController.logout);

// profile (must be logged in)
authRouter.put(
  "/profile",
  authenticate,
  validateRequest(authValidation.updateProfile),
  authController.updateProfile
);

// admin: users management
authRouter.get("/users", authenticate, authorize("ADMIN"), authController.getAllUsers);

authRouter.get("/users/:id", authenticate, authorize("ADMIN"), authController.getSingleUser);

authRouter.delete("/users/:id", authenticate, authorize("ADMIN"), authController.deleteUser);

export default authRouter;
