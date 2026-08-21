const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

// Replace CompanionSparkRecord
const sparkRegex = /export interface CompanionSparkRecord \{[\s\S]*?\}/;
const newSparkRecord = `export interface CompanionSparkRecord {
  companionId: string;
  sparkCount: number;
  lastIgnited: number;
  streakDays?: number;
  lastInteractionDate?: string;
  isIgnitedToday?: boolean;
  totalInteractions?: number;
}`;

code = code.replace(sparkRegex, newSparkRecord);
fs.writeFileSync('src/types.ts', code, 'utf-8');
