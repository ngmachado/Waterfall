// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

contract mockERC20 is ERC20PresetFixedSupply {
    constructor(
        uint256 initialSupply
    ) ERC20PresetFixedSupply("MockERC20", "M-20", initialSupply, msg.sender) {
    }
}