// import { RequestHandler } from "express";
// import { userService } from "./user.service";

// const getAllUsers: RequestHandler = async (_req, res) => {
//   const users = await userService.getAllUsers();

//   res.json({
//     success: true,
//     data: users,
//   });
// };

// const getSingleUser: RequestHandler = async (req, res) => {
//   const user = await userService.getSingleUser(req.params.id as string);

//   res.json({
//     success: true,
//     data: user,
//   });
// };

// const deleteUser: RequestHandler = async (req, res) => {
//   await userService.deleteUser(req.params.id as string);

//   res.json({
//     success: true,
//     message: "User deleted successfully",
//   });
// };
// export const userController = {
//     getAllUsers,
//     getSingleUser,
//     deleteUser  
// }
