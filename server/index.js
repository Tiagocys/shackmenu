import "dotenv/config";

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isDevelopment = process.env.NODE_ENV === "development";
const port = Number(process.env.PORT || (isDevelopment ? 8788 : 3000));

const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const r2Bucket = process.env.R2_BUCKET || "shackmenu";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials:
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
      : undefined,
});

app.use(express.json({ limit: "1mb" }));

app.get("/api/config", (_request, response) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(503).json({
      error: "Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env.",
    });
  }

  return response.json({ supabaseUrl, supabaseAnonKey });
});

async function authenticate(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return response.status(401).json({ error: "Sessão inválida." });
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!authResponse.ok) {
      return response.status(401).json({ error: "Sessão expirada. Entre novamente com o Google." });
    }

    const user = await authResponse.json();
    if (!user.id) {
      return response.status(401).json({ error: "Sessão inválida." });
    }

    request.user = user;
    return next();
  } catch (error) {
    console.error("Could not validate Supabase session", error);
    return response.status(503).json({
      error: "Não foi possível validar sua sessão com o Supabase. Tente novamente.",
    });
  }
}

function createImageUploadHandler(getKey) {
  return async (request, response) => {
    const contentType = request.get("content-type")?.split(";")[0];
    const size = request.body?.length || 0;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedTypes.has(contentType)) {
      return response.status(400).json({ error: "Use uma imagem JPG, PNG ou WebP." });
    }

    if (!Number.isInteger(size) || size <= 0 || size > 5 * 1024 * 1024) {
      return response.status(400).json({ error: "A imagem deve ter no máximo 5 MB." });
    }

    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return response.status(503).json({ error: "As credenciais do Cloudflare R2 não estão configuradas." });
    }

    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[contentType];
    const key = getKey(request.user.id, extension);

    try {
      await r2.send(new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: request.body,
        ContentType: contentType,
        ContentLength: size,
      }));
      return response.json({ key });
    } catch (error) {
      console.error("Could not create R2 upload URL", error);
      return response.status(500).json({ error: "Não foi possível preparar o upload da imagem." });
    }
  };
}

const parseImage = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "5mb",
});

app.post(
  "/api/uploads/logo",
  authenticate,
  parseImage,
  createImageUploadHandler((userId, extension) =>
    `restaurants/${userId}/logo-${crypto.randomUUID()}.${extension}`),
);

app.post(
  "/api/uploads/product",
  authenticate,
  parseImage,
  createImageUploadHandler((userId, extension) =>
    `restaurants/${userId}/products/product-${crypto.randomUUID()}.${extension}`),
);

app.delete("/api/uploads", authenticate, async (request, response) => {
  const key = typeof request.query.key === "string" ? request.query.key : "";
  const userPrefix = `restaurants/${request.user.id}/`;

  if (!key.startsWith(userPrefix) || key.includes("..")) {
    return response.status(400).json({ error: "Arquivo inválido." });
  }

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
    return response.status(204).end();
  } catch (error) {
    console.error("Could not delete R2 object", error);
    return response.status(500).json({ error: "Não foi possível remover a imagem." });
  }
});

app.get("/api/media", async (request, response) => {
  const key = typeof request.query.key === "string" ? request.query.key : "";

  if (!key.startsWith("restaurants/") || key.includes("..")) {
    return response.status(400).send("Invalid media key");
  }

  try {
    const mediaUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: r2Bucket, Key: key }),
      { expiresIn: 3600 },
    );
    return response.redirect(302, mediaUrl);
  } catch (error) {
    console.error("Could not read R2 object", error);
    return response.status(404).send("Media not found");
  }
});

app.use("/api", (error, _request, response, next) => {
  if (response.headersSent) return next(error);

  console.error("Unhandled API error", error);
  return response.status(500).json({ error: "Ocorreu um erro interno na API." });
});

if (isDevelopment) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "../vite.config.js"),
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_request, response) => response.sendFile(path.join(distPath, "index.html")));
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Shack Menu running on http://localhost:${port}`);
});
