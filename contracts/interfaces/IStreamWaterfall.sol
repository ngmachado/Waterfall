// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
 * @dev Waterfall contract interface
 *
 * @author Nuno Axe
 *
 */

 import {
    ISuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IStreamWaterfall {

    /**
     * @dev Create a new token distribution.
     * @notice If distribuition is not bound to a time interval, startTime = 0 (zero) and endTime = ype(uint96).max
     * @param merkleRoot Top node of a merkle tree structure.
     * @param token ERC20 compatible token address that will be distribuited.
     * @param startTime Start accepting claims in the distribuition.
     * @param endTime Stop accepting claims in the distribuition.
     */
    function newDistribuition(
        bytes32 merkleRoot,
        ISuperToken token,
        uint96 startTime,
        uint96 endTime,
        uint96 streamDuration
    )
        external;

    /**
     * @dev New Distribution Event.
     * @param sender Address that register a new distribution.
     * @param token ERC20 compatible token address that will be distribuited.
     * @param merkleRoot Top node of a merkle tree structure.
     * @param startTime timestamp to accept claims in the distribuition.
     * @param endTime timestamp to stop accepting claims in the distribuition.
     */
    event NewDistribuition(address indexed sender, address indexed token, bytes32 indexed merkleRoot, uint96 startTime, uint96 endTime, uint96 streamDuration);

    /**
     * @dev Check if claim was executed.
     * @param merkleRoot Top node of a merkle tree structure.
     * @param index Position of the leaf in the merkle tree
     */
    function isClaimed(bytes32 merkleRoot, uint256 index) external view returns (bool);

    /**
     * @dev Make a single distribuion.
     * @notice claim data combined with merkleProofs will compute the merkle tree root.
     * @param index Position of the leaf in the merkle tree
     * @param account Address entitled to make the claim.
     * @param amount Number of tokens to transfer.
     * @param merkleProofs of the tree.
     */
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProofs
    ) external;

    /**
     * @dev Claimed Event.
     * @param account Address that received tokens from claim function.
     * @param token ERC20 compatible token address that has be distribuited.
     * @param amount Number of tokens transfered.
     */
    event Claimed(address account, address token, uint256 amount);

    /**
     * @dev LSR Event.
     */
    event StreamLSR(address indexed LSR, address indexed account, address indexed token, int96 flowRate);
}