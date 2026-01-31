// import { prisma } from "../../lib/prisma";

// const getAllUsers = async () => {
//   return prisma.user.findMany({
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       role: true,
//       isActive: true,
//       createdAt: true,
//     },
//   });
// };

// const getSingleUser = async (id: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       role: true,
//       isActive: true,
//       createdAt: true,
//     },
//   });

//   if (!user) throw new Error("User not found");

//   return user;
// };

// const deleteUser = async (id: string) => {
//   return prisma.user.delete({
//     where: { id },
//     select: {
//       id: true,
//       email: true,
//     },
//   });
// };
// export const userService = {
//     getAllUsers,
//     getSingleUser,
//     deleteUser  
// }
