// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface IWaterfall {

    function newDistribuition(
        bytes32 merkleRoot,
        address token,
        uint96 startTime,
        uint96 endTime
    )
        external;

    function isClaimed(bytes32 merkleRoot, uint256 index) external view returns (bool);

    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProofs
    ) external;

    event Claimed(address account, address token, uint256 amount);
    event NewDistribuition(address indexed sender, address indexed token, bytes32 indexed merkleRoot, uint96 startTime, uint96 endTime);
}