export type AppTab = 'input' | 'stream' | 'editor' | 'export';

export interface PatentProject {
  docId: string;
  title: string;
  applicant: string;
  ipcClass: string;
  kipoScore: number;
  version: string;
  lastSavedText: string;
  problemPurpose: string;
  techField: string;
  keyComponents: string;
  priorArt: string;
  q1Answer: string;
  q2Selected: string;
  q2Custom: string;
  isClaim2Fixed: boolean;
  aiModel: string;
  apiKey: string;
}

export interface DrawingItem {
  id: string;
  title: string;
  type: string;
  svgCode?: string;
  desc: string;
}

export interface VersionSnapshot {
  version: string;
  timeAgo: string;
  title: string;
  description: string;
  isCurrent?: boolean;
}
