#!/usr/bin/env node
require("dotenv").config();
const program = require("commander");
const axios = require("axios");
const loadJsonFile = require("load-json-file");
const MerkleTree = require("../scripts/merkle-tree");


async function main() {
    program
        .description("merkle-drop")
        .option("-f, --file [value]", "json formatted file");
    program.parse(process.argv);
    const options = program.opts();
    const userSet = await loadJsonFile(options.file);
    const tree = MerkleTree.build(userSet);

    const res = await upload(tree.userSet);
    //report
    console.log("Merkle Root: ", '0x'+tree.getRoot().toString("hex"));
    console.log("IPFS :", res);
}

async function upload(memoryData) {

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", memoryData, {
            headers: {
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
            },
        });
        return res.data;
    } catch(error) {
      console.error(error);
      throw error;
    }

  }

main();