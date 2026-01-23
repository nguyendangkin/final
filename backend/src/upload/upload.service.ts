import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp');
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  // Files older than this (in hours) will be cleaned up
  private readonly TEMP_FILE_MAX_AGE_HOURS = 24;

  constructor() {
    // Ensure directories exist on startup
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.log('Created temp directory');
    }
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log('Created uploads directory');
    }
  }

  private async deleteFileWithRetry(
    filePath: string,
    maxRetries = 3,
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.promises.unlink(filePath);
        return;
      } catch (error: any) {
        if (i === maxRetries - 1) {
          this.logger.warn(
            `Failed to delete ${path.basename(filePath)} after ${maxRetries} retries: ${error.message}`,
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }
  }

  /**
   * Optimize and move a single file from temp to uploads folder
   * @param tempFilename The filename in the temp folder
   * @returns The new permanent URL or null if failed
   */
  async moveAndOptimizeFile(tempFilename: string): Promise<string | null> {
    try {
      const safeFilename = path.basename(tempFilename);
      const tempPath = path.join(this.tempDir, safeFilename);

      // Use webp for better compression
      const outputFilename = `${path.parse(safeFilename).name}.webp`;
      const permanentPath = path.join(this.uploadsDir, outputFilename);

      if (!fs.existsSync(tempPath)) {
        this.logger.warn(`Temp file not found: ${safeFilename}`);
        return null;
      }

      await sharp(tempPath)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(permanentPath);

      if (fs.existsSync(permanentPath)) {
        await this.deleteFileWithRetry(tempPath);
        this.logger.log(
          `Optimized and moved to permanent storage: ${outputFilename}`,
        );
        return outputFilename;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to process image ${tempFilename}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Synchronize images: move new ones to permanent, delete removed ones
   */
  async syncImages(
    oldUrls: string[] = [],
    newUrls: string[] = [],
  ): Promise<string[]> {
    const finalUrls: string[] = [];

    // 1. Process new images (those with /temp/ prefix)
    for (const url of newUrls) {
      if (!url) continue;

      if (url.includes('/temp/')) {
        const tempFilename = url.split('/temp/').pop();
        if (tempFilename) {
          const processedName = await this.moveAndOptimizeFile(tempFilename);
          if (processedName) {
            finalUrls.push(`/uploads/${processedName}`);
          }
        }
      } else if (url.includes('/uploads/')) {
        // Keep existing permanent images
        finalUrls.push(url);
      }
    }

    // 2. Identify and delete removed images
    const newFilenames = finalUrls.map((url) => path.basename(url));
    const imagesToDelete = oldUrls.filter((oldUrl) => {
      if (!oldUrl) return false;
      const oldFilename = path.basename(oldUrl);
      return !newFilenames.includes(oldFilename);
    });

    if (imagesToDelete.length > 0) {
      await this.deleteFiles(imagesToDelete);
    }

    return finalUrls;
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async cleanupTempFiles(): Promise<void> {
    this.logger.log('Starting temp files cleanup...');
    try {
      if (!fs.existsSync(this.tempDir)) return;

      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAgeMs = this.TEMP_FILE_MAX_AGE_HOURS * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }
      this.logger.log(`Temp cleanup completed. Deleted ${deletedCount} files.`);
    } catch (error) {
      this.logger.error(`Temp cleanup failed: ${error.message}`);
    }
  }

  /**
   * Delete a single file by filename from temp or uploads
   */
  async deleteFile(filename: string, isTemp = true): Promise<boolean> {
    try {
      const safeName = path.basename(filename);
      const filePath = path.join(
        isTemp ? this.tempDir : this.uploadsDir,
        safeName,
      );
      if (fs.existsSync(filePath)) {
        await this.deleteFileWithRetry(filePath);
        this.logger.log(
          `Deleted ${isTemp ? 'temp' : 'permanent'} file: ${safeName}`,
        );
        return true;
      }
      return false;
    } catch (error) {
      this.logger.warn(`Failed to delete file ${filename}: ${error.message}`);
      return false;
    }
  }

  async deleteFiles(urls: string[]): Promise<void> {
    for (const url of urls) {
      if (!url) continue;
      const filename = path.basename(url);
      const isTemp = url.includes('/temp/');
      await this.deleteFile(filename, isTemp);
    }
  }

  /**
   * Move multiple files from temp to permanent storage
   * @param filenames Array of filenames or URLs
   * @returns Array of permanent URLs
   */
  async moveFilesToPermanent(filenames: string[]): Promise<string[]> {
    const movedFiles: string[] = [];
    for (const filename of filenames) {
      if (!filename) continue;

      // If it's already a permanent URL, keep it
      if (filename.includes('/uploads/')) {
        movedFiles.push(filename);
        continue;
      }

      // Extract filename if it was a URL
      const baseName = path.basename(filename);
      const moved = await this.moveAndOptimizeFile(baseName);
      if (moved) {
        movedFiles.push(`/uploads/${moved}`);
      }
    }
    return movedFiles;
  }

  getTempDir(): string {
    return this.tempDir;
  }
}
