const { contextBridge, ipcRenderer } = require('electron')
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
    startDrag: (fileName) => {
        ipcRenderer.send('ondragstart', path.join(process.cwd(), fileName))
    }
})