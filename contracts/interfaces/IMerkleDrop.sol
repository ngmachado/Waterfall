// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface IMerkleDrop {

    function newDistribuition(
        bytes32 merkleRoot,
        address token,
        uint96 startDate,
        uint96 endDate
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
}
