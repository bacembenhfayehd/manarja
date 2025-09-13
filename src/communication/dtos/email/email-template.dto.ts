
export class EmailTemplateDto {
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
  isActive: boolean;
}