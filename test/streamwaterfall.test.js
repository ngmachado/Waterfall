const Tree = require("../scripts/merkle-tree");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");

const StreamWaterfall = artifacts.require("StreamWaterfall");
const { expectEvent } = require("@openzeppelin/test-helpers");

const toWei = web3.utils.toWei
const nowTimestamp = Math.floor(new Date().getTime() / 1000);
const toBN = web3.utils.BN;

contract("StreamWaterfall Drop Stream - Claims testings", accounts => {

  const errorHandler = err => {
    if (err) throw err;
  };

  let sf;
  let air;
  let airx;
  const tokenProvider = accounts[0];
  const admin = accounts[9]

  before(async function () {
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
    await air.approve(airx.address, tokenAmount, { from: tokenProvider });
    await airx.upgrade(tokenAmount, { from: tokenProvider });
  });

  it("Case #x - claim a stream air", async () => {
    const drop = await StreamWaterfall.new(sf.host.address, sf.agreements.cfa.address);
    const distributionTime = 86400;
    await airx.approve(drop.address, toWei("1000"), { from: tokenProvider });
    const userSet = [
      { account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "75000000000000000000" }
    ];
    const tree = Tree.build(userSet);
    const root = tree.getHexRoot();
    await drop.newDistribuition(
      root,
      airx.address,
      nowTimestamp - (24 * 60),
      nowTimestamp + (24 * 60),
      distributionTime,
      { from: tokenProvider }
    );

    const tx = await drop.claim(
      tree.userSet[0].index,
      tree.userSet[0].account,
      tree.userSet[0].amount,
      tree.userSet[0].hexproof
    );
    const shouldFlow = Math.floor(tree.userSet[0].amount / distributionTime);
    const newLSREvent = expectEvent(tx, 'StreamLSR', {
      account: tree.userSet[0].account,
      token: airx.address
    });
    const flow = await sf.cfa.getFlow({
      superToken: airx.address,
      sender: newLSREvent.args.LSR,
      receiver: tree.userSet[0].account
    });
    assert.equal(shouldFlow.toString(), newLSREvent.args.flowRate.toString(), "wrong flowRate LSR");
    assert.equal(shouldFlow.toString(), flow.flowRate.toString(), "wrong flowRate CFA");
    assert.equal((await web3.eth.getCode(newLSREvent.args.LSR)).toString(), "0x", "LSR not removed");
  });

  it("Case #x - two claim for the same receiver - update receiver stream", async () => {
    const drop = await StreamWaterfall.new(sf.host.address, sf.agreements.cfa.address);
    const distributionTime = 86400;
    await airx.approve(drop.address, toWei("1000"), { from: tokenProvider });
    const userSet = [
      { account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "7500000000000000" },
      { account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "2500000000000000" }
    ];
    const tree = Tree.build(userSet);
    const root = tree.getHexRoot();
    await drop.newDistribuition(
      root,
      airx.address,
      nowTimestamp - (24 * 60),
      nowTimestamp + (24 * 60),
      distributionTime,
      { from: tokenProvider }
    );
    await drop.claim(
      tree.userSet[0].index,
      tree.userSet[0].account,
      tree.userSet[0].amount,
      tree.userSet[0].hexproof
    );
    const tx = await drop.claim(
      tree.userSet[1].index,
      tree.userSet[1].account,
      tree.userSet[1].amount,
      tree.userSet[1].hexproof
    );
    const firstClaim = new toBN(tree.userSet[0].amount);
    const secondClaim = new toBN(tree.userSet[1].amount);
    const flowRate = firstClaim.add(secondClaim).div(new toBN(distributionTime));
    const shouldFlow = Math.floor(flowRate);
    const newLSREvent = expectEvent(tx, 'StreamLSR', {
      account: tree.userSet[0].account,
      token: airx.address
    });
    const flow = await sf.cfa.getFlow({
      superToken: airx.address,
      sender: newLSREvent.args.LSR,
      receiver: tree.userSet[1].account
    });
    assert.equal(shouldFlow.toString(), flow.flowRate.toString(), "wrong flowRate CFA");
    assert.equal((await web3.eth.getCode(newLSREvent.args.LSR)).toString(), "0x", "LSR not removed");
  });
});
