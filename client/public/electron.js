const electron = require('electron');
const { app, BrowserWindow, BrowserView, ipcMain } = electron;
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
});

ipcMain.on('ondragstart', (event, filePath) => {
    event.sender.startDrag({
        file: path.join(filePath),
        icon: filePath,
    })
})

const _RATIO = (3 / 5);
function calcYaaiis() {
    const contentBounds = mainWindow.getContentBounds();
    return {width:Math.round(contentBounds.width * _RATIO) - 1,height:contentBounds.height};
}
function calcAutomatic1111() {
    const contentBounds = mainWindow.getContentBounds();
    return {width:Math.round(contentBounds.width * (1 - _RATIO)) - 1,height:contentBounds.height};
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: "Yaaiis!",
    });

    // let devtools = new BrowserWindow();
    // mainWindow.webContents.setDevToolsWebContents(devtools.webContents)
    // mainWindow.webContents.openDevTools({ mode: 'detach' })

    mainWindow.loadURL(`file://${path.join(__dirname, '../build/electron-index.html')}`);
    mainWindow.loadURL(isDev ?
        `file://${path.join(__dirname, 'electron-index.html')}` :
        `file://${path.join(__dirname, '../build/electron-index.html')}`);

    mainWindow.on('page-title-updated', function (e) {
        e.preventDefault()

        const viewYaaiis = new BrowserView({
            webPreferences: {
            nodeIntegration: true,
                preload: path.join(__dirname, 'preload.js'),
        }
        });
        const viewAutomatic1111 = new BrowserView();

        function setYaaiisBounds() {
            viewYaaiis.setBounds({
                x: 0,
                y: 0,
                width: calcYaaiis().width,
                height: calcYaaiis().height
            });
        }

        function setAutomatic1111Bounds() {
            viewAutomatic1111.setBounds({
                x: calcYaaiis().width,
                y: 0,
                width: calcAutomatic1111().width,
                height: calcYaaiis().height
            });
        }

        mainWindow.addBrowserView(viewYaaiis);
        mainWindow.addBrowserView(viewAutomatic1111);

        // let devtools = new BrowserWindow();
        // viewYaaiis.webContents.setDevToolsWebContents(devtools.webContents)
        // viewYaaiis.webContents.openDevTools({ mode: 'detach' })

        setYaaiisBounds();
        setAutomatic1111Bounds();

        mainWindow.on('resize', () => {
            const contentBounds = mainWindow.getContentBounds();
            console.log(contentBounds)
            setYaaiisBounds();
            setAutomatic1111Bounds();
        })

        const yaaiisURL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;
        console.log(yaaiisURL);
        viewYaaiis.webContents.loadURL(
            yaaiisURL
        );
        viewAutomatic1111.webContents.loadURL('http://localhost:7860');

        mainWindow.on('closed', function () {
            mainWindow = null
        })
        mainWindow.on('page-title-updated', function (e) {
            e.preventDefault()
        });
    },1000);


}