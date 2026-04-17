const sharp = require("sharp");
const fs = require("fs").promises;

const optimizeImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        // We only process images
        if (!file.mimetype.startsWith("image/")) return;

        const buffer = await fs.readFile(file.path);
        const image = sharp(buffer);
        const metadata = await image.metadata();

        let optimizer = image.resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        });

        if (metadata.format === "jpeg" || metadata.format === "jpg") {
          optimizer = optimizer.jpeg({ quality: 80, mozjpeg: true });
        } else if (metadata.format === "png") {
          optimizer = optimizer.png({ quality: 80, compressionLevel: 8 });
        } else if (metadata.format === "webp") {
          optimizer = optimizer.webp({ quality: 80 });
        }

        const optimizedBuffer = await optimizer.toBuffer();
        await fs.writeFile(file.path, optimizedBuffer);
      })
    );
    next();
  } catch (error) {
    console.error("Image optimization error:", error);
    next(error);
  }
};

module.exports = { optimizeImages };
