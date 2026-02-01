 export const publicPathFromFile = (file: Express.Multer.File) => {
  const idx = file.path.lastIndexOf("uploads");
  const rel = file.path.slice(idx).replace(/\\/g, "/");
  return `/${rel}`;
};