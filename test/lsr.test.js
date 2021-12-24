const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const LSR = artifacts.require("LSR");

const toWei = web3.utils.toWei
contract("LSR - Starting streams", accounts => {
    const errorHandler = err => {
        if (err) throw err;
      };

    let sf;
    let air;
    let airx;
    const tokenProvider = accounts[9];
    const admin = accounts[9]

    before(async function() {
        await deployFramework(errorHandler, { web3: web3, from: admin });
        await deployTestToken(errorHandler, [":", "fair"], {
          web3: web3,
          from: admin
        });
        await deploySuperToken(errorHandler, [":", "fair"], {
          web3: web3,
          from: admin
        });

        sf = new SuperfluidSDK.Framework({
          web3: web3,
          tokens: ["fair"],
          version: "test"
        });
        await sf.initialize();
        airx = sf.tokens.fairx;
        const airAddress = await sf.tokens.fair.address;
        air = await sf.contracts.TestToken.at(airAddress);
        const tokenAmount = toWei("1000");
        await air.mint(tokenProvider, tokenAmount);
        await air.approve(airx.address,tokenAmount, {from: tokenProvider});
        await airx.upgrade(tokenAmount, {from: tokenProvider});
    });



    it("Case #1 - deploy and start stream", async () => {
        const lsr = await LSR.new();
        await airx.transfer(lsr.address, toWei("10"), {from: tokenProvider});
        await lsr.init(sf.host.address, sf.agreements.cfa.address, airx.address, accounts[5], "100000000000");
        const flow = await sf.cfa.getFlow({
          superToken: airx.address,
          sender: lsr.address,
          receiver: accounts[5]
        });
        assert.equal(flow.flowRate.toString(), "100000000000", "receiver not getting flow");
        assert.equal((await web3.eth.getCode(lsr.address)).toString(), "0x", "LSR not removed");
    });

});
