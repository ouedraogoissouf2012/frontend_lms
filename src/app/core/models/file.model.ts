import { User } from './user.model';

/**
 * Model File - Fichier uploadé
 */
export interface FileModel {
  id: number;
  user_id: number;
  fileable_id?: number;
  fileable_type?: string;
  original_name: string;
  stored_name: string;
  path: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  type: FileType;
  category?: string;
  description?: string;
  downloads_count: number;
  last_downloaded_at?: string;
  is_public: boolean;
  is_validated: boolean;
  virus_scan_status: VirusScanStatus;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  fileable?: any;

  // Helpers
  formatted_size?: string;
  download_url?: string;
}

export type FileType = 'document' | 'image' | 'video' | 'audio' | 'other';
export type VirusScanStatus = 'pending' | 'clean' | 'infected';

export interface FileFilters {
  type?: FileType;
  category?: string;
  user_id?: number;
  fileable_type?: string;
  fileable_id?: number;
  search?: string;
  sort?: 'recent' | 'name' | 'size' | 'downloads';
  per_page?: number;
  page?: number;
}

export interface UploadFileData {
  file: File;
  fileable_type?: string;
  fileable_id?: number;
  category?: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateFileData {
  category?: string;
  description?: string;
  is_public?: boolean;
}

export interface FileStats {
  total_files: number;
  total_size_bytes: number;
  total_size_formatted: string;
  total_downloads: number;
  by_type: Array<{
    type: string;
    count: number;
    total_size: number;
  }>;
  by_category: Array<{
    category: string;
    count: number;
  }>;
  recent_uploads: FileModel[];
}

/**
 * Helper pour la validation des fichiers
 */
export class FileHelper {
  static readonly MAX_FILE_SIZE = 52428800; // 50 MB

  static readonly ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'svg',
    'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip', 'rar'
  ];

  static isValidSize(file: File): boolean {
    return file.size <= this.MAX_FILE_SIZE;
  }

  static isValidExtension(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? this.ALLOWED_EXTENSIONS.includes(extension) : false;
  }

  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size > 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  static getFileIcon(extension: string): string {
    const iconMap: { [key: string]: string } = {
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'xls': 'table_chart',
      'xlsx': 'table_chart',
      'ppt': 'slideshow',
      'pptx': 'slideshow',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'movie',
      'avi': 'movie',
      'mp3': 'audiotrack',
      'zip': 'folder_zip',
      'rar': 'folder_zip'
    };
    return iconMap[extension.toLowerCase()] || 'insert_drive_file';
  }
}
