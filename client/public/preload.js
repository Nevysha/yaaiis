const { contextBridge, ipcRenderer } = require('electron')
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
    startDrag: (filePath) => {
        filePath = path.join(filePath);
        console.log(`dragging:${filePath}`)
        ipcRenderer.send('ondragstart', filePath)
    }
})