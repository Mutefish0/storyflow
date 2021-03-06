const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

const { configShortcuts } =  require('./shortcuts')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let mainURL 
if (process.env.NODE_ENV === 'development') {
	mainURL = 'http://localhost:8081'
} else {
	mainURL = url.format({
		pathname: path.join(__dirname, '../browser/index.html'),
		protocol: 'file'
	})
}

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({ 
		width: 840, height: 680, minWidth: 640, titleBarStyle: 'hiddenInset',
		webPreferences: { experimentalFeatures: true, devTools: process.env.NODE_ENV === 'development' }
	})

	// and load the index.html of the app.
	mainWindow.loadURL(mainURL)

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})

	const webContents = mainWindow.webContents
	webContents.on('will-navigate', function (e, url) {
		if (!/^file|^http:\/\/localhost/.test(url)) {
			const shell = electron.shell
			shell.openExternal(url)
		}
		e.preventDefault()
	})

	configShortcuts(webContents)

	if (process.env.NODE_ENV == 'development') {
		const installExtentions = require('./devtools')
		installExtentions()
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

if (process.env.NODE_ENV != 'development') {
	// 启动本地服务器·
	require('../backend')
}
