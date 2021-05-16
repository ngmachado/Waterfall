const Tree = require("../scripts/merkle-tree");
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
const toBN = web3.utils.BN;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

contract("MerkleDrop - Claims testings", accounts => {
    const tokenProvider = accounts[0];

    it("Case #0 - Check deployment", async() => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        assert.equal((await token.balanceOf(tokenProvider)).toString(), mintAmount, "minted amount wrong");
    });

    it("Case #0.1 - should revert if register two identical userSet", async() => {
        const mintAmount = toWei("1000");
        const token1 = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const token2 = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new();
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        const root = tree.getHexRoot();
        await drop.newDistribuition(
            root,
            token1.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );

        await expectRevert(drop.newDistribuition(
            root,
            token2.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        ), "merkleRoot already register");
    });

    it("Case #0.2 - should revert if register without correct information", async() => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new();
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        const root = tree.getHexRoot();
        await expectRevert(drop.newDistribuition(
            "0x0",
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        ), "empty root");
        await expectRevert(drop.newDistribuition(
            root,
            ZERO_ADDRESS,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        ), "empty token");
        await expectRevert(drop.newDistribuition(
            root,
            token.address,
            nowTimestamp,
            nowTimestamp - 1,
            {from: tokenProvider}
        ), "wrong dates");
    });

    it("Case #1 - register multi-users MerkleDrop", async () => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        await drop.newDistribuition(
            tree.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        tree.userSet.forEach(async (user) => {
            await drop.claim(user.index, user.account, user.amount, user.hexproof);
            assert.equal(
                (await token.balanceOf(user.account)).toString(),
                user.amount,
                `user with index ${user.index} should receive tokens`
            );
        });
    });

    it("Case #1.1 - register multi-users multi-MerkleDrop", async () => {
        const mintAmount = toWei("1000");
        const token1 = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const token2 = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token1.approve(drop.address, mintAmount, {from: tokenProvider});
        await token2.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet1 = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const userSet2 = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000001"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree1 = Tree.build(userSet1);
        const tree2 = Tree.build(userSet2);
        await drop.newDistribuition(
            tree1.getHexRoot(),
            token1.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        await drop.newDistribuition(
            tree2.getHexRoot(),
            token2.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );

        tree1.userSet.forEach(async (user) => {
            await drop.claim(user.index, user.account, user.amount, user.hexproof);
            assert.equal(
                (await token1.balanceOf(user.account)).toString(),
                user.amount,
                `user with index ${user.index} should receive tokens`
            );
        });
        tree2.userSet.forEach(async (user) => {
            await drop.claim(user.index, user.account, user.amount, user.hexproof);
            assert.equal(
                (await token2.balanceOf(user.account)).toString(),
                user.amount,
                `user with index ${user.index} should receive tokens`
            );
        });
    });

    it("Case #1.2 - register some token to multi-drops", async () => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet1 = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const userSet2 = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000001"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree1 = Tree.build(userSet1);
        const tree2 = Tree.build(userSet2);
        await drop.newDistribuition(
            tree1.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        await drop.newDistribuition(
            tree2.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        for(const user of tree1.userSet) {
            await drop.claim(user.index, user.account, user.amount, user.hexproof);
            assert.equal(
                (await token.balanceOf(user.account)).toString(),
                user.amount,
                `userx with index ${user.index} should receive tokens`
            );
        }

        for(const user of tree2.userSet) {
            const oldBalance = await token.balanceOf(user.account);
            await drop.claim(user.index, user.account, user.amount, user.hexproof);
            const expectedBalance = oldBalance.add(new toBN(user.amount));
            assert.equal(
                (await token.balanceOf(user.account)).toString(),
                expectedBalance.toString(),
                `user with index ${user.index} should receive tokens`
            );
        }

    });

    it("Case #2 - identical leaf - claim are defined by proofs", async () => {
        const mintAmount = toWei("1000");
        const token1 = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const token2 = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token1.approve(drop.address, mintAmount, {from: tokenProvider});
        await token2.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet1 = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const userSet2 = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000001"}
        ];
        const tree1 = Tree.build(userSet1);
        const tree2 = Tree.build(userSet2);
        await drop.newDistribuition(
            tree1.getHexRoot(),
            token1.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        await drop.newDistribuition(
            tree2.getHexRoot(),
            token2.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        const user = tree1.userSet[1];
        const sameLeaf = tree2.userSet[1].leaf;
        const hexProof = tree2.userSet[1].hexproof;

        assert.ok(user.leaf.toString() === sameLeaf.toString());

        await drop.claim(user.index, user.account, user.amount, user.hexproof);
        await drop.claim(user.index, user.account, user.amount, hexProof);

    });

    it("Case #3 - claim out if time", async () => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        await drop.newDistribuition(
            tree.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp - 100,
            {from: tokenProvider}
        );
        const user = tree.userSet[0];
        await expectRevert(
            drop.claim(user.index, user.account, user.amount, user.hexproof),
            "out of time / wrong root"
        );
    });

    it("Case #4 - reverts if reuse claim", async () => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        await drop.newDistribuition(
            tree.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        const user = tree.userSet[1];
        await drop.claim(user.index, user.account, user.amount, user.hexproof);
        await expectRevert(drop.claim(user.index, user.account, user.amount, user.hexproof), "already claimed");
    });

    it("Case #5 - revert if fake claim", async () => {
        const mintAmount = toWei("1000");
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token.approve(drop.address, mintAmount, {from: tokenProvider});
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        await drop.newDistribuition(
            tree.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        const user = tree.userSet[0];
        await expectRevert(drop.claim(user.index, user.account, "50000000000000000001", user.hexproof), "out of time / wrong root");
    });

    it("Case #6 - revert if provider don't have balance to transfer", async () => {
        const mintAmount = 1;
        const token = await tokensFactory.new(mintAmount, {from: tokenProvider});
        const drop = await merkleFactory.new({from:tokenProvider});
        await token.approve(drop.address, toWei("1000"), {from: tokenProvider});
        const userSet = [
            {account: "0x00000a86986e8ba3557992df02883e4a646e8f25", amount: "50000000000000000000"},
            {account: "0x00009c99bffc538de01866f74cfec4819dc467f3", amount: "75000000000000000000"},
            {account: "0x00035a5f2c595c3bb53aae4528038dd7a85641c3", amount: "50000000000000000000"},
            {account: "0x1e27c325ba246f581a6dcaa912a8e80163454c75", amount: "10000000000000000000"}
        ];
        const tree = Tree.build(userSet);
        await drop.newDistribuition(
            tree.getHexRoot(),
            token.address,
            nowTimestamp - (24 * 60),
            nowTimestamp + (24 * 60),
            {from: tokenProvider}
        );
        const user = tree.userSet[0];
        await expectRevert(drop.claim(user.index, user.account, user.amount, user.hexproof), "ERC20: transfer amount exceeds balance");
    });
});