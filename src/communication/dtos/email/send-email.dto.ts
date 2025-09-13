
export class SendEmailDto {
  to: string[];
  subject: string;
  htmlContent: string;
  cc?: string[];
  bcc?: string[];
  from?: string;
  attachments?: Array<{
    content: string; // base64 encoded
    filename: string;
    type: string;
  }>;
}