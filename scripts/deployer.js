const { execSync } = require("child_process");
const merkleFactory = artifacts.require("MerkleDistributor");

module.exports = async function (callback) {
    try {
        const network = process.argv[process.argv.length - 1];
        const drop = await merkleFactory.new();
        console.log(`${network} - MerkleDistributor@${drop.address}`);
        const cmd = `truffle run verify MerkleDistributor@${drop.address} --network ${network}`;
        execSync(cmd, {
			stdio: 'inherit',
		} );
        callback();
    } catch(err) {
        console.error(err);
        callback(err);
    }
}