// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "./libraries/MerkleProofLib.sol";
import "./interfaces/IMerkleDrop.sol";
import "./interfaces/IERC20.sol";

contract MerkleDistributor is IMerkleDrop {

    struct Config {
        IERC20 token;
        address tokensProvider;
        uint96 startDate;
        uint96 endDate;
        mapping(uint256 => uint256) claimed;
    }

    mapping(bytes32 => Config) public config;

    function newDistribuition(
        bytes32 merkleRoot,
        address token,
        address tokensProvider,
        uint96 startDate,
        uint96 endDate
    )
        external
        override
    {

        require(address(config[merkleRoot].token) == address(0), "merkleRoot already register");
        require(startDate < endDate, "wrong dates");

        Config storage _config = config[merkleRoot];
        _config.token = IERC20(token);
        _config.tokensProvider = tokensProvider;
        _config.startDate = startDate;
        _config.endDate = endDate;
    }

    function isClaimed(bytes32 merkleRoot, uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = config[merkleRoot].claimed[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(bytes32 merkleRoot, uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        config[merkleRoot].claimed[claimedWordIndex] = config[merkleRoot].claimed[claimedWordIndex] | (1 << claimedBitIndex);
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProofs) external override {
        bytes32 leaf = keccak256(abi.encodePacked(index, account, amount));
        bytes32 merkleRoot = MerkleProof.getMerkleRoot(merkleProofs, leaf);

        require(
            config[merkleRoot].startDate < block.timestamp
            && config[merkleRoot].endDate > block.timestamp
            ,"out of time / wrong merkleTree"
        );

        require(!isClaimed(merkleRoot, index), "already claimed");
        _setClaimed(merkleRoot, index);

        require(
            config[merkleRoot].token.transferFrom(
                config[merkleRoot].tokensProvider,
                account,
                amount
            )
        , "transfer failed");
    }
}
