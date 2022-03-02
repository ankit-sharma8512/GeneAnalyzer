window.addEventListener("DOMContentLoaded", doneLoading);

// Preload can access both DOM elements and node modules
// doneLoading is called when the DOM is loaded successfully
function doneLoading() {
    const { ipcRenderer } = require("electron");
    const path = require("path");

    // index.html functions
    // Adding event listener to 'Add Gene Info' button in homepage
    const getBtn = document.querySelector("#addGeneInfo");
    if (getBtn != null) {
        getBtn.addEventListener('click', (event) => {
            ipcRenderer.send("goToAddPage");
        });
    }

    // Adding event listener to 'Seacrh for a gene info' button in homepage
    const searchBtn = document.querySelector("#searchGeneInfo");
    if (searchBtn != null) {
        searchBtn.addEventListener('click', (event) => {
            ipcRenderer.send("searchGene");
        });
    }


    // Adding event listener to 'Exit' button in homepage
    const exitBtn = document.querySelector("#exitApp");
    if (exitBtn != null) {
        exitBtn.addEventListener('click', (event) => {
            ipcRenderer.send("exitApp");
        });
    }

    // Adding event listener to submit form in in add gene info page
    // which will send the file path to gene info file to the electron app
    const geneForm = document.querySelector("#geneFileUpload");
    if (geneForm != null) {
        geneForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const geneName = document.getElementById("geneName").value;
            const geneSeq = document.querySelector("#geneSeqFile").files[0];
            ipcRenderer.send("geneFilePath", geneName, geneSeq.path);
        });
    }

    // addGeneInfo.html functions
    // Adding event listener to 'Go Back' button in add gene info page
    const backBtn = document.querySelector("#goBackToHomePage");
    if (backBtn != null) {
        backBtn.addEventListener('click', (event) => {
            ipcRenderer.send("goToHomePage");
        });
    }

    // searchGeneInfo.html functions
    // Searches the genes matching with the input
    // If blank input, show all
    const geneSearchForm = document.querySelector("#geneSearch");
    if (geneSearchForm != null) {
        geneSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const geneSearch = document.getElementById("geneSearchName").value;
            ipcRenderer.send("listGene", geneSearch);
        });
    }

    //Display all Gene Files present in the names parameter
    ipcRenderer.on("displayGenes", (event, names) => {
        var ele = document.getElementsByClassName('geneSearchResult');
        while (ele[0]) {
            ele[0].parentNode.removeChild(ele[0]);
        }
        for (let i = 0; i < names.length; i++) {
            var tag = document.createElement("a");
            var text = document.createTextNode(names[i]);
            tag.appendChild(text);
            tag.className = 'geneSearchResult';
            tag.addEventListener('click', (event) => {
                ipcRenderer.send("download", names[i]);
            })
            var element = document.querySelector("#searchResults");
            element.appendChild(tag);
        }
    });

    // download.html functions
    const downloadBtn = document.querySelector("#downloadBtn");
    if (downloadBtn != null) {
        downloadBtn.setAttribute('href', path.join(__dirname, 'TempFiles', 'temp.txt'));
    }
}


