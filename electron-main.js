
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in development mode
const isDev = !app.isPackaged;

// Enforce single instance lock
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
}

// Disable GPU cache to avoid "Access is denied" errors on some Windows systems
app.commandLine.appendSwitch('disable-gpu-cache');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Safe & Save Medical Center",
    backgroundColor: '#f3f4f6',
    resizable: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Hide standard menu bar, let the React App handle navigation
  mainWindow.setMenuBarVisibility(false);
  
  // Maximize the window for the main application experience
  mainWindow.maximize();

  // Production path points to the main app entry
  const productionPath = path.join(__dirname, 'dist', 'index.html');

  if (isDev) {
    // In development, load from Vite dev server (default entry)
    mainWindow.loadURL('http://localhost:3000').catch(() => {
        // Fallback if dev server isn't running or path issue
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadFile(productionPath).catch(err => console.error('Fallback load failed:', err));
        }
    });
    // Optional: Open DevTools in dev mode
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the built index.html file
    mainWindow.loadFile(productionPath).then(() => {
        console.log('Main App loaded successfully');
    }).catch(err => {
        console.error('Failed to load Main App:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
