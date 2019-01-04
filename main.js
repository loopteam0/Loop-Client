//@ts-check
const electron = require('electron');
const path = require('path');
const url  = require('url');

const ipc = electron.ipcMain;
const shell = electron.shell;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const app = electron.app;
const shortcut = electron.globalShortcut;
const downloadDir = `${app.getPath('downloads')}\\LoopClient\\`;
const rootPath = path.join(__dirname, 'dist', 'app');
let win;

// check for update at lunch time


function createWindow() {
  // Create the browser window.

  const windowOptions = {
    width: 1024,
    height: 650,
    show: false,
    minWidth: 960,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      scrollBounce: true,
    }
  }
  // check platform and set icon🎇
  if (process.platform === 'win32') {
    windowOptions.icon = path.join(rootPath, '/assets/icons/icon.win.ico')
  } else if (process.platform === 'linux') {
    windowOptions.icon = path.join(rootPath, '/assets/icons/icon.png')
  }  else if (process.platform === 'darwin') {
    windowOptions.icon = path.join(rootPath, '/assets/icons/icon.png')
  } 

  win = new BrowserWindow(windowOptions)

  // win.loadURL(url.format({
  //   pathname: path.join(rootPath, '/index.html'),
  //   protocol: 'file',
  //   slashes: true
  // }));

 win.loadURL(`http://localhost:4200`);

  // Event when the window is closed.
  win.on('closed', () => {
    win = null
  })

  win.once('ready-to-show', () => {
    win.show()
  });

}


app.on('window-all-closed', () => {
  // On macOS specific close process
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // macOS specific close process
  if (win === null) {
    createWindow()
  }
})


app.on('will-quit', () => {
  shortcut.unregisterAll()
})

// Handle all downloads
function downloadHandler() {
  win.webContents.session.on('will-download', (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.

    let fileName = `[LOOP] ${item.getFilename()}`;
    const downloadPath = `${downloadDir}\\${fileName}`;
    item.setSavePath(downloadPath)

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully');
        shell.beep();
        shell.openExternal(downloadPath);
      } else {
        console.log(`Download failed: ${state}`)
      }
    })
  })

}

function reloadWindow() {
  app.relaunch({
    args: process.argv.slice(1).concat(['--relaunch'])
  })
  app.exit(0)
}

function openDownloadPath() {
  shell.openExternal(downloadDir)
}

// when app is ready
app.on('ready', () => {
  // create window
  createWindow();
  // load menu
  Menu.setApplicationMenu(null);

  // register shortcuts
  shortcut.register('CommandOrControl+Shift+T', () => {
    win.webContents.openDevTools();
  })
  shortcut.register('CommandOrControl+D', () => {
    openDownloadPath();
  })

  // load contex-menu
  const menu = new Menu()
  menu.append(new MenuItem({
    role: 'cut',
  }))
  menu.append(new MenuItem({
    role: 'copy',
  }))
  menu.append(new MenuItem({
    role: 'paste',
    accelerator: '',
  }))
  menu.append(new MenuItem({
    role: 'selectall'
  }))
  menu.append(new MenuItem({
    type: 'separator'
  }))
  menu.append(new MenuItem({
    label: 'Reload',
    click: reloadWindow
  }))
  menu.append(new MenuItem({
    label: 'Open Download Location',
    click: openDownloadPath
  }))
  menu.append(new MenuItem({
    type: 'separator'
  }))
  menu.append(new MenuItem({
    label: 'Exit',
    role: 'close'
  }))
  win.webContents.on('context-menu', function (e, params) {
    // @ts-ignore
    menu.popup(win, params.x, params.y)
  })

  // handle downloads
  downloadHandler();
})

