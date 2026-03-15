
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
// const url = require('url'); // Not strictly needed for loadFile

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true, // Explicitly ensure the window frame (title bar) is visible
    webPreferences: {
      // Enables Node.js integration in the renderer process (your React app).
      // This allows your React code to access `process.env` (e.g., for API_KEY)
      // and other Node.js modules if needed.
      // SECURITY NOTE: Be cautious with nodeIntegration if loading remote/untrusted content.
      // For purely local applications, it's often used for convenience.
      nodeIntegration: true,
      // contextIsolation is typically true for security with preload scripts.
      // When nodeIntegration is true, contextIsolation is often set to false,
      // though modern Electron might handle this differently.
      // For direct `process.env` access without a preload script, this combination is common.
      contextIsolation: false,
      // preload: path.join(__dirname, 'preload.js'), // Example if you were using a preload script
    },
    icon: path.join(__dirname, 'assets', 'icon.png') // Path to your app icon (create this)
  });

  // Load the index.html of the app.
  // This assumes your React app is built into a 'dist' folder at the project root.
  // If electron-main.js is at the root, __dirname is the project root.
  const startPath = path.join(__dirname, 'dist', 'index.html');
  
  mainWindow.loadFile(startPath)
    .then(() => console.log('App loaded successfully from:', startPath))
    .catch(err => console.error('Failed to load app:', err));

  // Open the DevTools (optional, for development)
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Create a basic application menu (optional)
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
