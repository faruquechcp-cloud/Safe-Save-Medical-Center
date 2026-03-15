
import { AppDB } from '../db';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }
  
  // Flatten objects if needed or just take top level keys
  const headers = Object.keys(data[0]);
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header] ?? '';
      
      // Handle arrays or objects: stringify them first
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      
      // Convert to string and escape double quotes according to CSV standard (RFC 4180)
      // " becomes ""
      const stringVal = String(val);
      const escaped = stringVal.replace(/"/g, '""');
      
      // Wrap field in double quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  triggerDownload(url, `${filename}.csv`);
};

export const exportToJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  triggerDownload(url, `${filename}.json`);
};

export const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportFullDatabase = async (db: AppDB) => {
  try {
    const backup: any = {
      meta: {
        date: new Date().toISOString(),
        version: 1.0,
        appName: "SafeSaveMedical"
      },
      data: {}
    };

    // Dynamically get all tables using casting to any to bypass strict type check for .tables on AppDB
    const tables = (db as any).tables;
    
    for (const table of tables) {
      const rows = await table.toArray();
      backup.data[table.name] = rows;
    }

    exportToJSON(backup, `Full_System_Backup_${new Date().toISOString().split('T')[0]}`);
  } catch (error) {
    console.error("Export failed:", error);
    alert("System backup failed. Check console for details.");
  }
};

export const importFullDatabase = async (db: AppDB, jsonContent: string) => {
  try {
    const parsed = JSON.parse(jsonContent);
    // Support both old format (direct keys) and new format (nested under 'data')
    const dataToImport = parsed.data || parsed; 

    if (typeof dataToImport !== 'object' || dataToImport === null) {
      throw new Error("Invalid backup file format.");
    }

    // Casting db to any to access tables property
    const tables = (db as any).tables;
    
    console.log("Starting full database restore...");

    // 1. Clear all existing tables first (outside transaction to avoid heavy lock)
    for (const table of tables) {
      await table.clear();
    }

    // 2. Insert new data table by table
    for (const tableName of Object.keys(dataToImport)) {
      const table = (db as any).table(tableName);
      if (table) {
        const rows = dataToImport[tableName];
        if (Array.isArray(rows) && rows.length > 0) {
          console.log(`Importing ${rows.length} rows into ${tableName}...`);
          // Use bulkPut for better resilience
          await table.bulkPut(rows);
        }
      } else {
        console.warn(`Table ${tableName} found in backup but does not exist in current schema. Skipping.`);
      }
    }

    // Special handling for appSettings to ensure it has a valid ID 0
    const settings = await db.appSettings.get(0);
    if (!settings) {
      console.log("No settings found after import, re-seeding default settings...");
      await (db as any).seed();
    }

    alert("সিস্টেম রিস্টোর সফলভাবে সম্পন্ন হয়েছে! সফটওয়্যারটি এখন রিলোড হবে।");
    window.location.reload();

  } catch (e: any) {
    console.error("Restore failed:", e);
    alert(`ডাটা রিস্টোর করতে ব্যর্থ হয়েছে। দয়া করে সঠিক ব্যাকআপ ফাইলটি নির্বাচন করুন।\nError: ${e.message}`);
  }
};
