import { db } from '../db';
import { exportDB } from 'dexie-export-import';
import { BackupSettings } from '../types';

export async function createDatabaseBackup(): Promise<string> {
  const blob = await exportDB(db, {
    prettyJson: true
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

const getApiUrl = (path: string) => {
  const baseUrl = (import.meta as any).env.VITE_APP_URL || '';
  if (window.location.protocol === 'file:' && baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
};

export async function uploadBackupToGoogleDrive(
  content: string, 
  settings: BackupSettings,
  onSuccess?: (fileId: string) => void
): Promise<boolean> {
  if (!settings.googleTokens) return false;

  try {
    const response = await fetch(getApiUrl('/api/backup/upload'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokens: settings.googleTokens,
        content: content,
        fileName: `SafeSave_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      })
    });

    const result = await response.json();
    if (result.success) {
      if (onSuccess) onSuccess(result.fileId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Backup upload failed:', error);
    return false;
  }
}

export async function listBackupsFromGoogleDrive(settings: BackupSettings): Promise<any[]> {
  if (!settings.googleTokens) return [];

  try {
    const response = await fetch(getApiUrl('/api/backup/list'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: settings.googleTokens })
    });

    const result = await response.json();
    return result.success ? result.files : [];
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

export async function downloadBackupFromGoogleDrive(fileId: string, settings: BackupSettings): Promise<string | null> {
  if (!settings.googleTokens) return null;

  try {
    const response = await fetch(getApiUrl('/api/backup/download'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: settings.googleTokens, fileId })
    });

    const result = await response.json();
    if (result.success) {
      return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    }
    return null;
  } catch (error) {
    console.error('Failed to download backup:', error);
    return null;
  }
}

export async function checkAndTriggerAutoBackup(
  settings: BackupSettings,
  updateSettings: (updates: Partial<BackupSettings>) => void
) {
  if (!settings.autoBackupEnabled || !settings.googleTokens || !window.navigator.onLine) return;

  const lastBackup = settings.lastBackupDate ? new Date(settings.lastBackupDate) : new Date(0);
  const now = new Date();
  const diffHours = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

  if (diffHours >= settings.backupIntervalHours) {
    console.log('Triggering auto backup...');
    const content = await createDatabaseBackup();
    const success = await uploadBackupToGoogleDrive(content, settings);
    if (success) {
      updateSettings({ lastBackupDate: now.toISOString() });
    }
  }
}
