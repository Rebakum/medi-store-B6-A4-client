import { Router } from "express";

import { validateRequest } from "../../middleware/validateRequest";

import { authValidation } from "./auth.validate";
import { authController } from "./auth.controller";
import { authorize } from "../../middleware/authorize";
import { authenticate } from "../../middleware/auth";

const authRouter = Router();
authRouter.get("/admin", authenticate, authorize("ADMIN"), (req, res) => {
  res.json({ success: true, message: "Welcome Admin" });
});

authRouter.post("/register", validateRequest(authValidation.register), authController.register);
authRouter.post("/login", validateRequest(authValidation.login), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.put("/profile", 
   authenticate, authorize( "CUSTOMER", "ADMIN", "USER"),
     validateRequest(authValidation.updateProfile), authController.updateProfile);
authRouter.get("/users",
    //  authenticate, authorize( "ADMIN"),
      authController.getAllUsers);
authRouter.get("/users/:id", 
    //  authenticate, authorize( "USER"),
 authController.getSingleUser)
authRouter.delete("/users/:id",
    //   authenticate, authorize( "ADMIN"),
       authController.deleteUser)

export default authRouter;