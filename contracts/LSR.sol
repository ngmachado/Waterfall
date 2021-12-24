// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {
    ISuperfluid,
    ISuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

/**
 * @dev Limited Stream Responsability implementation.
 *
 * author: Nuno Axe
 * github: https://github.com/ngmachado/waterfall
 *
 */

contract LSR {

    function init(ISuperfluid sf, IConstantFlowAgreementV1 cfa, bytes memory encodedCFAAction) external {
        sf.callAgreement(
            cfa,
            encodedCFAAction,
            "0x"
        );
        selfdestruct(payable(msg.sender));
    }
}