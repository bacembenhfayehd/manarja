import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException 
} from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number; 
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {}

  transform(file: Express.Multer.File | Express.Multer.File[], metadata: ArgumentMetadata) {
    if (!file && this.options.required) {
      throw new BadRequestException('File is required');
    }

    if (!file) {
      return file;
    }

    
    if (Array.isArray(file)) {
      return file.map(f => this.validateSingleFile(f));
    }

   
    return this.validateSingleFile(file);
  }

  private validateSingleFile(file: Express.Multer.File): Express.Multer.File {
    
    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.formatBytes(this.options.maxSize)}`
      );
    }

    
    if (this.options.allowedMimeTypes && !this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`
      );
    }

    
    if (this.options.allowedExtensions) {
      const extension = this.getFileExtension(file.originalname);
      if (!this.options.allowedExtensions.includes(extension)) {
        throw new BadRequestException(
          `File extension ${extension} is not allowed. Allowed extensions: ${this.options.allowedExtensions.join(', ')}`
        );
      }
    }

    return file;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}


@Injectable()
export class ImageValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    });
  }
}

@Injectable()
export class DocumentValidationPipe extends FileValidationPipe {
  constructor() {
    super({
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ],
      allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']
    });
  }
}
