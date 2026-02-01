import fs from "fs";
import path from "path";

export function toAbsoluteUploadPath(publicPath: string) {
  // publicPath: /uploads/medicines/<id>/cover.jpg
  const normalized = publicPath.replace(/^\/+/, "");
  return path.join(process.cwd(), normalized);
}

export function safeUnlink(publicPath?: string | null) {
  if (!publicPath) return;
  try {
    const abs = toAbsoluteUploadPath(publicPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    // ignore
  }
}

export function splitCoverGallery(images: string[] = []) {
  return {
    cover: images[0] ?? null,
    gallery: images.length ? images.slice(1) : [],
  };
}

export function isCoverPath(pathStr: string, images: string[] = []) {
  return images[0] === pathStr;
}
