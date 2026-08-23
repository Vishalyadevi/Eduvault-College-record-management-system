import path from 'path';
import fs from 'fs';

/**
 * Parses records array from req.body (handles both JSON request body & FormData stringified records)
 */
export const parseBulkRecords = (req) => {
  let records = req.body.records || req.body.rows;
  if (typeof records === 'string') {
    try {
      records = JSON.parse(records);
    } catch (e) {
      records = [];
    }
  }
  return Array.isArray(records) ? records : [];
};

/**
 * Fallback stubs for legacy helper calls
 */
export const getAttachedFileMap = () => ({});
export const matchFileBuffer = () => null;
export const saveFileToDisk = () => null;

