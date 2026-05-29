export interface Document {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  storagePath?: string;
  extractedText?: string;
}
