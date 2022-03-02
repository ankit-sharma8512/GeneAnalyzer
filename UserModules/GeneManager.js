const fs = require("fs");
const path = require("path");
const readline = require("readline");
const AminoAcid = require("./AminoAcidMap");
const StoreDB = require("./StoreDB");

// Bases and Codons Info
const bases = ['A', 'T', 'G', 'C', 'U'];
const startCodons = ['ATG', 'GTG', 'TTG', 'ATT', 'AGA',
    'GAT', 'CTG', 'GTC', 'GGC', 'GAG',
    'GAA', 'CAT', 'CAA', 'AGC', 'TCC',
    'ACC', 'TAC', 'ATA', 'ATC', 'AAC',
    'GCC', 'CGC', 'GTT', 'TAT', 'TTC',
    'TTA', 'GGA', 'CCA', 'TGG', 'GGT',
    'TGC', 'GCA', 'GTA', 'CAG', 'ACT',
    'TGT', 'CCG', 'AAT', 'GCG', 'TTT',
    'AAG', 'GAC', 'CGT', 'CTA'];

const endCodons = [
    'TGA', 'TAA', 'TAG', 'GCA', 'GAA',
    'TGC', 'TAT', 'GCT', 'ATT', 'CCG',
    'AAG', 'GCC', 'CTT', 'ACT', 'GAT',
    'AGC', 'CAG', 'GGT', 'ATG', 'AAT',
    'GGC', 'GCG', 'CAA', 'GTG', 'AGG',
    'TCC', 'ATC', 'GTT', 'CGC', 'GAC',
    'TAC', 'GTA', 'ACG'
];

// const endCodons = [
//     'TGA', 'TAA', 'TAG'
//   ];

// metadata = array of metadata of all genes present in file
// nucSeq = array of nucSeq of all genes present in file

// Checking functions
// Reads the file specified by the path and check for its validity
// If valid, [metadata,nucSeq] is returned
// Else request is rejected
const checkIfValid = (geneInfoPath) => {
    return new Promise((resolve, reject) => {
        let file;
        try{
                file = readline.createInterface({
                input: fs.createReadStream(geneInfoPath),
                output: process.stdout,
                terminal: false
            });
        }
        catch{
            reject(false);
        }
        
        let metadata = [];
        let nucSeq = [];

        file.on('line', (line) => {
            try{
                if (line[0] === '>') {
                    metadata.push(line);
                    nucSeq.push("");
                }
                else if (bases.includes(line[0].toUpperCase()) === true) {
                    nucSeq[nucSeq.length - 1] += line.toUpperCase();
                }
                else {
                    reject(false);
                }
            }
            catch{
                reject(false);
            }
        });

        file.on("close", () => {
            checkContentValidity(metadata, nucSeq).then(() => resolve([metadata, nucSeq])).catch(() => reject(false));
        });
    });
}

//Check if the given metadata and nucSeq array has correct Nucleotide Sequence of all genes
const checkContentValidity = (metadata, nucSeq) => {
    return new Promise((resolve, reject) => {
        flag = true;
        if (metadata.length != nucSeq.length) {
            flag = false;
            console.log("length mismatch");
        }

        for (let i = 0; i < nucSeq.length && flag; i++) {
            for (let j = 0; j < nucSeq[i].length; j++)
                if (bases.includes(nucSeq[i][j]) === false) {
                    console.log(i, " base mismatch");
                    flag = false;
                    break;
                }
        }

        for (let i = 0; i < nucSeq.length && flag; i++) {
            if (startCodons.includes(nucSeq[i].substring(0, 3)) === false) {
                console.log(i, " start mismatch");
                flag = false;
                break;
            }
        }

        for (let i = 0; i < nucSeq.length && flag; i++) {
            if (endCodons.includes(nucSeq[i].substr(nucSeq[i].length - 3)) === false) {
                console.log(i, " aend mismatch");
                flag = false;
                break;
            }
        }

        // for (let i = 0; i < nucSeq.length && flag; i++) 
        // {
        //     for (let j = 0; j < endCodons.length; j++) 
        //     {
        //         let pos = nucSeq[i].indexOf(endCodons[j]);
        //         if (pos != -1 && pos % 3 == 0 && pos != (nucSeq[i].length-3)) {
        //             console.log(i,pos,endCodons[j], " end mismatch");
        //             flag = false;
        //             break;
        //         }
        //     }
        // }

        if (flag === true)
            resolve(true);
        else
            reject(false);
    });
}

// Data Writing Functions
// This function writes given geneName and its data to a MongoDB database
// data is a array of size two where data[0] = metadata, data[1] = nucSeq
const addDatatoDB = (geneName, data) => {
    return new Promise((resolve, reject) => {
        const metadata = data[0];
        const nucSeq = data[1];
        const aaSeq = [];
        const geneLen = [];
        const gcContent = [];

        for (let i = 0; i < nucSeq.length; i++) {
            aaSeq.push("");
            const temp = nucSeq[i].toUpperCase();
            geneLen.push(nucSeq[i].length);
            for (let j = 0; j < nucSeq[i].length; j += 3) {
                const curr = temp.substr(j, 3);
                aaSeq[i] += AminoAcid.aminoAcid[curr];
            }
            let count = 0;
            for (let j = 0; j < nucSeq[i].length; j++) {
                if (temp[j] === 'G' || temp[j] === 'C') {
                    count++;
                }

            }
            gcContent.push(count / nucSeq[i].length);
        }
        allGenes = [];
        for (let i = 0; i < nucSeq.length; i++) {
            let gene = {};
            gene.GeneName = geneName;
            gene.Metadata = metadata[i].substring(1);
            gene.NucSeq = nucSeq[i];
            gene.AASeq = aaSeq[i];
            gene.GeneLength = geneLen[i].toString();
            gene.GCContent = gcContent[i].toString();
            allGenes.push(gene);
        }
        StoreDB.insertIntoDB(geneName, allGenes).then(resolve(true)).catch(reject(false));
    });
}

module.exports = { checkIfValid, addDatatoDB };