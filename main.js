const { app, BrowserWindow, session, Menu, contextBridge, ipcMain } = require("electron");
const path = require("path");

function createWindow(url = "https://www.google.com") {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the specified URL (default to Google)
  win.loadURL(url);

  // Remove default menu for minimalism
  Menu.setApplicationMenu(null);
  
  // Add context menu (right-click menu)
  win.webContents.on('context-menu', (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      // If there's link text under the cursor, add option to open in new window
      params.linkURL && {
        label: 'Open Link in New Window',
        click: () => createWindow(params.linkURL)
      },
      // Always add new window option
      {
        label: 'New Window',
        click: () => createWindow()
      },
      { type: 'separator' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'toggleDevTools' }
    ].filter(Boolean)); // filter to remove null/undefined items
    
    contextMenu.popup({ window: win });
  });

  // Customize cookie handling: block all cookies
  const filter = {
    urls: ["*://*/*"],
  };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Remove cookie headers from outgoing requests
    delete details.requestHeaders["Cookie"];
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    // Strip Set-Cookie headers from responses
    if (details.responseHeaders["Set-Cookie"]) {
      delete details.responseHeaders["Set-Cookie"];
    }
    // Some servers use lowercase header names
    if (details.responseHeaders["set-cookie"]) {
      delete details.responseHeaders["set-cookie"];
    }
    callback({ responseHeaders: details.responseHeaders });
  });

  // Handle window close to clean up any resources
  win.on('closed', () => {
    // Do any needed cleanup here
  });
  
  return win;
}

app.whenReady().then(() => {
  createWindow();

  // Register a global shortcut for Ctrl+T to open a new window
  const { globalShortcut } = require('electron');
  globalShortcut.register('CommandOrControl+T', () => {
    createWindow();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  // Unregister all shortcuts when the app is about to quit
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
