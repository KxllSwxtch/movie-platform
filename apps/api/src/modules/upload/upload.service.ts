import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import { StorageService } from "../storage/storage.service";

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor(
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {
    this.uploadDir = this.config.get<string>("UPLOAD_DIR", "./uploads");
    // Ensure upload directories exist
    for (const sub of ["images", "videos"]) {
      const dir = path.join(this.uploadDir, sub);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Upload an image file
   */
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Недопустимый тип файла: ${file.mimetype}. Разрешены: ${allowedTypes.join(", ")}`,
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(1)}МБ. Максимум: 10МБ`,
      );
    }

    const ext = path.extname(file.originalname) || ".jpg";
    const filename = `${uuidv4()}${ext}`;
    const key = `covers/${filename}`;
    const url = await this.storage.uploadFile(
      "thumbnails",
      key,
      file.buffer,
      file.mimetype,
    );

    return { url, filename };
  }

  /**
   * Upload a video file
   * Supports both disk-stored files (via Multer diskStorage) and buffer files
   */
  async uploadVideo(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string; filePath: string }> {
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Недопустимый тип файла: ${file.mimetype}. Разрешены: ${allowedTypes.join(", ")}`,
      );
    }

    // If file was stored to disk via diskStorage, file.path is set
    if (file.path) {
      const key = `previews/${file.filename}`;
      const url = await this.storage.uploadFromPath(
        "videos",
        key,
        file.path,
        file.mimetype,
      );
      await fs.promises.unlink(file.path).catch(() => undefined);
      return { url, filename: file.filename, filePath: file.path };
    }

    // Fallback: buffer-based upload (image endpoint style)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(0)}МБ. Максимум: 2048МБ`,
      );
    }

    const ext = path.extname(file.originalname) || ".mp4";
    const filename = `${uuidv4()}${ext}`;
    const key = `previews/${filename}`;
    const url = await this.storage.uploadFile(
      "videos",
      key,
      file.buffer,
      file.mimetype,
    );
    const filePath = `videos/${key}`;

    return { url, filename, filePath };
  }
}
