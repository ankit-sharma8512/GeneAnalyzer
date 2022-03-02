const fs = require("fs");
const path = require("path");
const MongoClient = require("mongodb").MongoClient;
const dbUri = 'mongodb://localhost:27017';
const dbName = 'Genes';

// Insert into database 'Genes' all Gene Info given by the user
const insertIntoDB = (geneName, gene) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(dbUri, function (err, client) {
      if (err) reject(false);
      const db = client.db(dbName);
      const collection = db.collection(geneName);
      collection.insertMany(gene, (err, result) => {
        if (err) {
          client.close();
          reject(false);
        }
        else {
          client.close();
          resolve(true);
        }
      });
    });
  });
}

// Return all Gene Info's present in the database matching with searchFor
const getGenes = (searchFor) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(dbUri, function (err, client) {
      if (err) reject(false);
      const db = client.db(dbName);
      let collectionsNames = [];
      db.listCollections().toArray(function (err, names) {
        if (err) reject(false);
        const regex = new RegExp(searchFor, 'i');
        for (let i = 0; i < names.length; i++) {
          if (searchFor != '') {
            if (names[i].name.match(regex) != null)
              collectionsNames.push(names[i].name);
          }
          else{
            collectionsNames.push(names[i].name);
          }

        }
        client.close();
        resolve(collectionsNames);
      });
    });
  });
};

// Make a txt file out of the chosen Gene Info collection
const makeGeneFile = (geneName) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(dbUri, function (err, client) {
      if (err) reject(false);
      const db = client.db(dbName);
      const collection = db.collection(geneName);
      collection.find({}).toArray(function (err, docs) {
        if (err) reject(false);
        exportToFile(docs);
        client.close();
        resolve(true);
      });
    });
  });
}

//Helper Function to make and save the file into the system at Tempfiles directory
const exportToFile = (docs) => {
  const filename = 'temp.txt';
  fs.writeFileSync(path.join(__dirname, '..', 'TempFiles', filename), '');
  for (let i = 0; i < docs.length; i++) {
    fs.appendFileSync(path.join(__dirname, '..', 'TempFiles', filename), '>' + docs[i].Metadata + '\n');
    const AA = docs[i].AASeq;
    const lines = Math.floor(AA.length / 70);
    let j = 0;
    for (j = 0; j < lines; j++)
      fs.appendFileSync(path.join(__dirname, '..', 'TempFiles', filename), AA.substr(j * 70, 70) + '\n');
    if (AA.substr(j * 70).length > 0)
      fs.appendFileSync(path.join(__dirname, '..', 'TempFiles', filename), AA.substr(j * 70) + '\n');
  }
}

module.exports = { insertIntoDB, getGenes, makeGeneFile };