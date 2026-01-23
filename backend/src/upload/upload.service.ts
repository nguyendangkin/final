import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

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

  /**
   * Move a single file from temp to uploads folder
   * @param tempFilename The filename in the temp folder
   * @returns The new permanent URL or null if failed
   */
  moveFileToPermanent(tempFilename: string): string | null {
    try {
      // Sanitize filename to prevent directory traversal
      const safeFilename = path.basename(tempFilename);
      const tempPath = path.join(this.tempDir, safeFilename);
      const permanentPath = path.join(this.uploadsDir, safeFilename);

      if (!fs.existsSync(tempPath)) {
        this.logger.warn(`Temp file not found: ${safeFilename}`);
        return null;
      }

      // Copy file then delete original (works across different volumes/devices)
      // standard fs.rename fails with EXDEV across docker volumes
      fs.copyFileSync(tempPath, permanentPath);
      fs.unlinkSync(tempPath);

      this.logger.log(`Moved file to permanent storage: ${safeFilename}`);

      return safeFilename;
    } catch (error) {
      this.logger.error(
        `Failed to move file ${tempFilename}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Move multiple files from temp to uploads folder
   * @param urls Array of temp URLs (e.g., "http://localhost:3000/temp/abc123.jpg")
   * @returns Array of permanent URLs (e.g., "http://localhost:3000/uploads/abc123.jpg")
   */
  moveFilesToPermanent(urls: string[]): string[] {
    const permanentUrls: string[] = [];

    for (const url of urls) {
      if (!url) continue;

      // Extract filename from URL
      // URL format: "http://domain/temp/filename.jpg" -> "filename.jpg"
      const tempMatch = url.split('/temp/').pop();
      if (tempMatch) {
        const filename = path.basename(tempMatch);
        const moved = this.moveFileToPermanent(filename);
        if (moved) {
          // Replace /temp/ with /uploads/ in the URL
          const permanentUrl = url.replace('/temp/', '/uploads/');
          permanentUrls.push(permanentUrl);
        } else {
          // If file doesn't exist in temp, check if it's already in uploads
          // This handles re-uploads or already permanent files
          if (url.includes('/uploads/')) {
            permanentUrls.push(url);
          }
        }
      } else if (url.includes('/uploads/')) {
        // Already a permanent URL
        permanentUrls.push(url);
      }
    }

    return permanentUrls;
  }

  /**
   * Cron job to clean up old temporary files
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async cleanupTempFiles(): Promise<void> {
    this.logger.log('Starting temp files cleanup...');

    try {
      if (!fs.existsSync(this.tempDir)) {
        this.logger.log('Temp directory does not exist, skipping cleanup');
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAgeMs = this.TEMP_FILE_MAX_AGE_HOURS * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.tempDir, file);
          const stats = fs.statSync(filePath);

          // Check if file is older than max age
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
            deletedCount++;
            this.logger.log(`Deleted old temp file: ${file}`);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to process temp file ${file}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Temp cleanup completed. Deleted ${deletedCount} files.`);
    } catch (error) {
      this.logger.error(`Temp cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get the temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }

  /**
   * Delete image files from disk based on their URLs
   * @param urls Array of URLs or filenames
   */
  deleteFiles(urls: string[]): void {
    for (const url of urls) {
      if (!url) continue;

      try {
        // Extract filename from URL (handles both /temp/ and /uploads/)
        let filename = '';
        if (url.includes('/uploads/')) {
          filename = url.split('/uploads/').pop() || '';
        } else if (url.includes('/temp/')) {
          filename = url.split('/temp/').pop() || '';
        } else {
          filename = url; // Assume it's just a filename
        }

        if (filename) {
          const safeFilename = path.basename(filename);
          const isTemp = url.includes('/temp/');
          const filePath = path.join(
            isTemp ? this.tempDir : this.uploadsDir,
            safeFilename,
          );

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.logger.log(`Deleted file: ${safeFilename} from ${isTemp ? 'temp' : 'uploads'}`);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to delete file ${url}: ${error.message}`);
      }
    }
  }
}
