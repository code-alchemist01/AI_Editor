import * as dotenv from 'dotenv';

dotenv.config();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const DEFAULT_MODEL = 'gemini-2.5-flash';
