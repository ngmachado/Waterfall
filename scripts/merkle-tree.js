const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256');

const toAddress = web3.utils.toChecksumAddress;
const isAddress = web3.utils.checkAddressChecksum;
const soliditySha3 = web3.utils.soliditySha3;

function parseData(data) {
    let result = new Array();
    let index = 0;
    for(const l of data) {
        const account = toAddress(l.account);
        assert.ok(isAddress(account));
        result.push({
            index: index,
            account:toAddress(account),
            amount: l.amount,
            hash: soliditySha3(index,toAddress(account), l.amount )
        })
        index++;
    }
    return result;
}

module.exports = {
    parseData
}