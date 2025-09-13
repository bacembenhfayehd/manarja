export const BRANDING_CONSTANTS = {
  ERROR: {
    NOT_FOUND: 'Branding not found',
    COMPANY_NOT_FOUND: 'Company not found',
    INVALID_COLOR: 'Invalid color format',
    FILE_UPLOAD_FAILED: 'File upload failed',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_TOO_LARGE: 'File size too large'
  },
  SUCCESS: {
    UPDATED: 'Branding updated successfully',
    LOGO_UPLOADED: 'Logo uploaded successfully',
    FAVICON_UPLOADED: 'Favicon uploaded successfully'
  },
  VALIDATION: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/svg+xml'],
    ALLOWED_FAVICON_TYPES: ['image/x-icon', 'image/vnd.microsoft.icon']
  },
  DEFAULT: {
    PRIMARY_COLOR: '#4F46E5',
    SECONDARY_COLOR: '#10B981',
    FONT_FAMILY: 'Inter, sans-serif'
  }
};