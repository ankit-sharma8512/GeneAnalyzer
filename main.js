const electron = require("electron");
const path = require("path");
const GeneManager = require("./UserModules/GeneManager");
const StoreDB = require("./UserModules/StoreDB");
const {app, BrowserWindow,ipcMain} = electron;

let mainWindow;
// MainWindow on ready, loads homepage 
app.on("ready",() =>{
    mainWindow = new BrowserWindow({
        webPreferences:{
            preload: path.join(__dirname,"preload.js"),
            nodeIntegration:false,
            contextIsolation:true
        }
    });
    mainWindow.loadURL(path.join(__dirname,"HTMLFiles","index.html"));

    mainWindow.on("close",()=>{
        mainWindow = null;
    });
});

// index.html functions
// When the user selects Go to Add page for a gene info, this event is triggered
ipcMain.on("goToAddPage",()=>{
    mainWindow.loadURL(path.join(__dirname,"HTMLFiles","addGeneInfo.html"));
});
// When the user selects Exit, this event is triggered
ipcMain.on("searchGene",()=>{
    mainWindow.loadURL(path.join(__dirname,"HTMLFiles","searchGeneInfo.html"));
});
// When the user selects Exit, this event is triggered
ipcMain.on("exitApp",()=>{
    app.quit();
});


// addGeneInfo.html functions
// When the user selects Go Back to homepage, this event is triggered
ipcMain.on("goToHomePage",()=>{
    mainWindow.loadURL(path.join(__dirname,"HTMLFiles","index.html"));
});

// On successful getting the path of geneFileInfo, AddDatatoDB is called
// which reads the file and do validation and writes the required contents to GeneInfo.json file
// Contents are: SlNo, Gene Info, Nucleotide Sequence, Gene Length, G+C content, AA sequence, Remark
ipcMain.on("geneFilePath", (event,geneName,geneInfoPath)=> AddData(geneName,geneInfoPath));
const AddData = async(geneName,geneInfoPath) =>{
    let ret;
    mainWindow.loadURL(path.join(__dirname,"HTMLFiles","loading.html"));
    try{
        ret = await GeneManager.checkIfValid(geneInfoPath);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","verified.html"));
        await Sleep(2000);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","loading.html"));
        await GeneManager.addDatatoDB(geneName,ret);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","done.html"));
        await Sleep(2000);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","index.html"));
    }
    catch{
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","error.html"));
        await Sleep(2000);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","index.html"));
    }
}

// searchGeneInfo.html
ipcMain.on("listGene", (event,searchFor)=> ListGenes(searchFor));

// Get gene files matching with search and show them in the screen
const ListGenes = async(searchFor)=>{
    try{
        let names = await StoreDB.getGenes(searchFor);
        mainWindow.webContents.send('displayGenes',names);
    }
    catch{
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","error.html"));
        await Sleep(2000);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","index.html"));
    }   
}

ipcMain.on("download", (event,geneNameReq)=> downloadFile(geneNameReq));
// make a file of the gene Info requested and make it available to download
const downloadFile = async(geneNameReq)=>{
    try{
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","loading.html"));
        await StoreDB.makeGeneFile(geneNameReq);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","download.html"));
    }
    catch{
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","error.html"));
        await Sleep(2000);
        mainWindow.loadURL(path.join(__dirname,"HTMLFiles","index.html"));
    }   
}

// auxiliary functions
const Sleep = (ms)=>{
    return new Promise((resolve,reject)=>{
        setTimeout(resolve,ms);
    })
}
