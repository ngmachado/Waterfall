const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256');
const web3 = require("web3");

const toAddress = web3.utils.toChecksumAddress;
const isAddress = web3.utils.checkAddressChecksum;
const soliditySha3 = web3.utils.soliditySha3;
const buf2hex = x => '0x'+x.toString('hex');

function build(data) {

    const leaves = new Array();
    const resultData = new Array();
    for(let i = 0; i < data.length; i++) {
        let account = toAddress(data[i].account);
        if(!isAddress(account)) {
            throw Error("failed checkAddressChecksum to address ", account);
        }
        account = toAddress(account)
        const leaf = soliditySha3(i, account, data[i].amount);
        resultData.push({
            index: i,
            account: account,
            amount: data[i].amount,
            leaf: leaf
        })
        leaves.push(leaf);
    }
    let tree = new MerkleTree(leaves, keccak256, { sort: true });
    for(let i = 0; i < data.length; i++) {
        resultData[i].hexproof = tree.getProof(resultData[i].leaf).map(x => buf2hex(x.data));
    }
    tree.userSet = resultData;
    return tree;
}

module.exports = {
    build
}