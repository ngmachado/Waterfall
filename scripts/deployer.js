const { execSync } = require("child_process");
const merkleFactory = artifacts.require("Waterfall");

module.exports = async function (callback) {
    try {
        const network = process.argv[process.argv.length - 1];
        const drop = await merkleFactory.new();
        console.log(`${network} - WaterfallContract@${drop.address}`);
        const cmd = `truffle run verify WaterfallContract@${drop.address} --network ${network}`;
        execSync(cmd, {
			stdio: 'inherit',
		} );
        callback();
    } catch(err) {
        console.error(err);
        callback(err);
    }
}