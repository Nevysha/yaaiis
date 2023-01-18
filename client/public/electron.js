const electron = require('electron');
const { app, BrowserWindow, BrowserView } = electron;
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

const _RATIO = (3 / 5);
function calcYaaiis() {
    const contentBounds = mainWindow.getContentBounds();
    return {width:Math.round(contentBounds.width * _RATIO) - 1,height:contentBounds.height};
}
function calcAutomatic1111() {
    const contentBounds = mainWindow.getContentBounds();
    return {width:Math.round(contentBounds.width * (1 - _RATIO)) - 1,height:contentBounds.height};
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 2420,
        height: 1080,
        title: "Yaaiis workspace"
    });

    mainWindow.loadFile(`electron-index.html`);
    mainWindow.on('page-title-updated', function (e) {
        e.preventDefault()

        const viewYaaiis = new BrowserView()
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

        setYaaiisBounds();
        setAutomatic1111Bounds();

        mainWindow.on('resize', () => {
            const contentBounds = mainWindow.getContentBounds();
            console.log(contentBounds)
            setYaaiisBounds();
            setAutomatic1111Bounds();
        })

        viewYaaiis.webContents.loadURL('http://localhost:3000');
        viewAutomatic1111.webContents.loadURL('http://localhost:7860');

        mainWindow.on('closed', function () {
            mainWindow = null
        })
        mainWindow.on('page-title-updated', function (e) {
            e.preventDefault()
        });
    });


}