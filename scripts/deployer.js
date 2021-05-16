const merkleFactory = artifacts.require("MerkleDistributor");

module.exports = async function (callback, argv) {
    try {
        const drop = await merkleFactory.new();
        console.log("drop deployed at", drop.address);
    } catch(err) {
        console.error(err);
    }
}