const tokensFactory = artifacts.require("mERC20");
const merkleFactory = artifacts.require("MerkleDistributor");

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const traveler = require("ganache-time-traveler");

const toWei = web3.utils.toWei
const buf2hex = x => '0x'+x.toString('hex');
const nowTimestamp = Math.floor(new Date().getTime() / 1000);
const soliditySha3 = web3.utils.soliditySha3;

contract("MerkleDrop - Claims testings", accounts => {

    it("Case #0 - Check deployment", async() => {
        const mintAmount = toWei("1000", "ether");
        const erc20 = await tokensFactory.new(mintAmount, {from: accounts[0]});
        const drop = await merkleFactory.new({from:accounts[0]});
        assert.equal((await erc20.balanceOf(accounts[0])).toString(), mintAmount, "minted amount wrong");
    });

    it("Case #1 - register multi-users MerkleDrop", async () => {
        const mintAmount = toWei("1000", "ether");
        const erc20 = await tokensFactory.new(mintAmount, {from: accounts[0]});
        const drop = await merkleFactory.new({from:accounts[0]});
        await erc20.approve(drop.address, mintAmount, {from: accounts[0]});
        const leaves = [
            soliditySha3("0", "0x00000a86986e8ba3557992df02883e4a646e8f25", "50000000000000000000"),
            soliditySha3("1", "0x00009c99bffc538de01866f74cfec4819dc467f3", "75000000000000000000"),
            soliditySha3("2", "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", "50000000000000000000"),
            soliditySha3("3", "0x1e27c325ba246f581a6dcaa912a8e80163454c75", "10000000000000000000")
        ]
        const tree = new MerkleTree(leaves, keccak256, { sort: true });
        const root = tree.getHexRoot();
        const startTime = nowTimestamp - (24 * 60);
        const endTime = nowTimestamp + (24 * 60);
        await drop.newDistribuition(root, erc20.address, accounts[0], startTime, endTime);

        const leaf0 = soliditySha3("0","0x00000a86986e8ba3557992df02883e4a646e8f25","50000000000000000000");
        const leaf1 = soliditySha3("1","0x00009c99bffc538de01866f74cfec4819dc467f3","75000000000000000000");
        const leaf2 = soliditySha3("2","0x00035a5f2c595c3bb53aae4528038dd7a85641c3","50000000000000000000");
        const leaf3 = soliditySha3("3","0x1e27c325ba246f581a6dcaa912a8e80163454c75","10000000000000000000");

        const hexproof0 = tree.getProof(leaf0).map(x => buf2hex(x.data));
        const hexproof1 = tree.getProof(leaf1).map(x => buf2hex(x.data));
        const hexproof2 = tree.getProof(leaf2).map(x => buf2hex(x.data));
        const hexproof3 = tree.getProof(leaf3).map(x => buf2hex(x.data));

        await drop.claim("0", "0x00000a86986e8ba3557992df02883e4a646e8f25", "50000000000000000000", hexproof0);
        await drop.claim("1", "0x00009c99bffc538de01866f74cfec4819dc467f3", "75000000000000000000", hexproof1);
        await drop.claim("2", "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", "50000000000000000000", hexproof2);
        await drop.claim("3", "0x1e27c325ba246f581a6dcaa912a8e80163454c75", "10000000000000000000", hexproof3);

        assert.equal(
            (await erc20.balanceOf("0x00000a86986e8ba3557992df02883e4a646e8f25")).toString(),
            "50000000000000000000",
            "user 0 should receive tokens"
        );
        assert.equal(
            (await erc20.balanceOf("0x00009c99bffc538de01866f74cfec4819dc467f3")).toString(),
            "75000000000000000000",
            "user 1 should receive tokens"
        );
        assert.equal(
            (await erc20.balanceOf("0x00035a5f2c595c3bb53aae4528038dd7a85641c3")).toString(),
            "50000000000000000000",
            "user 2 should receive tokens"
        );
        assert.equal(
            (await erc20.balanceOf("0x1e27c325ba246f581a6dcaa912a8e80163454c75")).toString(),
            "10000000000000000000",
            "user 3 should receive tokens"
        );

    });

    it("Case #2 - register multi-users multi-MerkleDrop", async () => {
        const mintAmount = toWei("1000", "ether");
        const erc20first = await tokensFactory.new(mintAmount, {from: accounts[0]});
        const erc20second = await tokensFactory.new(mintAmount, {from: accounts[0]});
        const drop = await merkleFactory.new({from:accounts[0]});

        await erc20first.approve(drop.address, mintAmount, {from: accounts[0]});
        await erc20second.approve(drop.address, mintAmount, {from: accounts[0]});

        const leavesFirst = [
            soliditySha3("0", "0x00000a86986e8ba3557992df02883e4a646e8f25", "50000000000000000000"),
            soliditySha3("1", "0x00009c99bffc538de01866f74cfec4819dc467f3", "75000000000000000000"),
            soliditySha3("2", "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", "50000000000000000000"),
            soliditySha3("3", "0x1e27c325ba246f581a6dcaa912a8e80163454c75", "10000000000000000000")
        ]

        const leavesSecond = [
            soliditySha3("1", "0x00000a86986e8ba3557992df02883e4a646e8f25", "50000000000000000000"),
            soliditySha3("0", "0x00009c99bffc538de01866f74cfec4819dc467f3", "75000000000000000000"),
            soliditySha3("2", "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", "50000000000000000000"),
            soliditySha3("3", "0x1e27c325ba246f581a6dcaa912a8e80163454c75", "10000000000000000000")
        ]

        const treeFirst = new MerkleTree(leavesFirst, keccak256, { sort: true });
        const treeSecond = new MerkleTree(leavesSecond, keccak256, { sort: true });
        const rootFirst = treeFirst.getHexRoot();
        const rootSecond = treeSecond.getHexRoot();
        const startTime = nowTimestamp - (24 * 60);
        const endTime = nowTimestamp + (24 * 60);

        await drop.newDistribuition(rootFirst, erc20first.address, accounts[0], startTime, endTime);
        await drop.newDistribuition(rootSecond, erc20second.address, accounts[0], startTime, endTime);

        let leaf0 = soliditySha3("0","0x00000a86986e8ba3557992df02883e4a646e8f25","50000000000000000000");
        let leaf1 = soliditySha3("1","0x00009c99bffc538de01866f74cfec4819dc467f3","75000000000000000000");
        let leaf2 = soliditySha3("2","0x00035a5f2c595c3bb53aae4528038dd7a85641c3","50000000000000000000");
        let leaf3 = soliditySha3("3","0x1e27c325ba246f581a6dcaa912a8e80163454c75","10000000000000000000");

        let hexproof0 = treeFirst.getProof(leaf0).map(x => buf2hex(x.data));
        let hexproof1 = treeFirst.getProof(leaf1).map(x => buf2hex(x.data));
        let hexproof2 = treeFirst.getProof(leaf2).map(x => buf2hex(x.data));
        let hexproof3 = treeFirst.getProof(leaf3).map(x => buf2hex(x.data));

        await drop.claim("0", "0x00000a86986e8ba3557992df02883e4a646e8f25", "50000000000000000000", hexproof0);
        await drop.claim("1", "0x00009c99bffc538de01866f74cfec4819dc467f3", "75000000000000000000", hexproof1);
        await drop.claim("2", "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", "50000000000000000000", hexproof2);
        await drop.claim("3", "0x1e27c325ba246f581a6dcaa912a8e80163454c75", "10000000000000000000", hexproof3);

        assert.equal(
            (await erc20first.balanceOf("0x00000a86986e8ba3557992df02883e4a646e8f25")).toString(),
            "50000000000000000000",
            "user 0 should receive tokens"
        );
        assert.equal(
            (await erc20first.balanceOf("0x00009c99bffc538de01866f74cfec4819dc467f3")).toString(),
            "75000000000000000000",
            "user 1 should receive tokens"
        );
        assert.equal(
            (await erc20first.balanceOf("0x00035a5f2c595c3bb53aae4528038dd7a85641c3")).toString(),
            "50000000000000000000",
            "user 2 should receive tokens"
        );
        assert.equal(
            (await erc20first.balanceOf("0x1e27c325ba246f581a6dcaa912a8e80163454c75")).toString(),
            "10000000000000000000",
            "user 3 should receive tokens"
        );

        leaf0 = soliditySha3("1","0x00000a86986e8ba3557992df02883e4a646e8f25","50000000000000000000");
        leaf1 = soliditySha3("0","0x00009c99bffc538de01866f74cfec4819dc467f3","75000000000000000000");
        leaf2 = soliditySha3("2","0x00035a5f2c595c3bb53aae4528038dd7a85641c3","50000000000000000000");
        leaf3 = soliditySha3("3","0x1e27c325ba246f581a6dcaa912a8e80163454c75","10000000000000000000");

        hexproof0 = treeSecond.getProof(leaf0).map(x => buf2hex(x.data));
        hexproof1 = treeSecond.getProof(leaf1).map(x => buf2hex(x.data));
        hexproof2 = treeSecond.getProof(leaf2).map(x => buf2hex(x.data));
        hexproof3 = treeSecond.getProof(leaf3).map(x => buf2hex(x.data));

        await drop.claim("1", "0x00000a86986e8ba3557992df02883e4a646e8f25", "50000000000000000000", hexproof0);
        await drop.claim("0", "0x00009c99bffc538de01866f74cfec4819dc467f3", "75000000000000000000", hexproof1);
        await drop.claim("2", "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", "50000000000000000000", hexproof2);
        await drop.claim("3", "0x1e27c325ba246f581a6dcaa912a8e80163454c75", "10000000000000000000", hexproof3);

        assert.equal(
            (await erc20second.balanceOf("0x00000a86986e8ba3557992df02883e4a646e8f25")).toString(),
            "50000000000000000000",
            "user 0 should receive tokens"
        );
        assert.equal(
            (await erc20second.balanceOf("0x00009c99bffc538de01866f74cfec4819dc467f3")).toString(),
            "75000000000000000000",
            "user 1 should receive tokens"
        );
        assert.equal(
            (await erc20second.balanceOf("0x00035a5f2c595c3bb53aae4528038dd7a85641c3")).toString(),
            "50000000000000000000",
            "user 2 should receive tokens"
        );
        assert.equal(
            (await erc20second.balanceOf("0x1e27c325ba246f581a6dcaa912a8e80163454c75")).toString(),
            "10000000000000000000",
            "user 3 should receive tokens"
        );

    });

    it("Case #x - re-register one drop", async () => {});
    it("Case #x - register one MerkleDrop", async () => {});
    it("Case #x.x - claim one drop", async () => {});
    it("Case #x.x - claim multi drop", async () => {});
    it("Case #x.x - claim used drop", async () => {});
    it("Case #x.x - claim before time", async () => {});
    it("Case #x.x - claim after time", async () => {});
});