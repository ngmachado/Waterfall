const { execSync } = require("child_process");
const Waterfall = artifacts.require("Waterfall");

module.exports = async function (callback) {
    try {
        const network = process.argv[process.argv.length - 1];
        const drop = await Waterfall.new();
        console.log(`${network} - Waterfall@${drop.address}`);
        const cmd = `truffle run verify Waterfall@${drop.address} --network ${network}`;
        execSync(cmd, {
			stdio: 'inherit',
		} );
        callback();
    } catch(err) {
        console.error(err);
        callback(err);
    }
}
