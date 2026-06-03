export interface SavedResult {
  id: string;
  caseId: string;
  documentId?: string;
  analysisResultId?: string;
  title: string;
  note?: string;
  resultText: string;
  prompt?: string;
  provider?: string;
  model?: string;
  createdAt: string;
}
