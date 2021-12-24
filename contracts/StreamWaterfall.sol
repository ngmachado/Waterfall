// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./libraries/MerkleProofLib.sol";
import "./interfaces/IStreamWaterfall.sol";
import "./LSR.sol";
import {
    ISuperfluid, ISuperToken
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

/**
 * @dev StreamWaterfall implementation.
 *
 * author: Nuno Axe
 * github: https://github.com/ngmachado/waterfall
 *
 */
contract StreamWaterfall is IStreamWaterfall {

    IConstantFlowAgreementV1 immutable public cfa;
    ISuperfluid immutable public sf;
    string constant version = "streamwaterfall.v1";

    struct Config {
        ISuperToken token;
        uint96 startTime;
        address tokensProvider;
        uint96 endTime;
        uint96 streamDuration;
        mapping(uint256 => uint256) claimed;
    }

    // @dev Config for the merkleRoot.
    mapping(bytes32 => Config) public config;


    constructor(ISuperfluid _sf, IConstantFlowAgreementV1 _cfa) {
        require(address(_cfa) != address(0), "cfa");
        require(address(_sf) != address(0), "sf");
        cfa = _cfa;
        sf = _sf;
    }

    // @dev IStreamWaterfall.newDistribuition implementation.
    function newDistribuition(
        bytes32 merkleRoot,
        ISuperToken token,
        uint96 startTime,
        uint96 endTime,
        uint96 streamDuration
    ) external override {
        require(
            address(config[merkleRoot].token) == address(0),
            "merkleRoot already register"
        );
        require(merkleRoot != bytes32(0), "empty root");
        require(address(token) != address(0), "empty token");
        require(startTime < endTime, "wrong dates");
        require(streamDuration > 0, "invalid stream duration");

        Config storage _config = config[merkleRoot];
        _config.token = ISuperToken(token);
        _config.tokensProvider = msg.sender;
        _config.startTime = startTime;
        _config.endTime = endTime;
        _config.streamDuration = streamDuration;
        emit NewDistribuition(
            msg.sender,
            address(token),
            merkleRoot,
            startTime,
            endTime,
            streamDuration
        );
    }

    // @dev IStreamWaterfall.isClaimed implementation.
    function isClaimed(bytes32 merkleRoot, uint256 index)
        public
        view
        override
        returns (bool)
    {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = config[merkleRoot].claimed[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    // @dev Set index as claimed on specific merkleRoot
    function _setClaimed(bytes32 merkleRoot, uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        config[merkleRoot].claimed[claimedWordIndex] =
            config[merkleRoot].claimed[claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    // @dev IStreamWaterfall.claim implementation.
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProofs
    ) external override {
        bytes32 leaf = keccak256(abi.encodePacked(index, account, amount));
        bytes32 merkleRoot = MerkleProof.getMerkleRoot(merkleProofs, leaf);

        require(
            config[merkleRoot].startTime < block.timestamp &&
                config[merkleRoot].endTime >= block.timestamp,
            "out of time / wrong root"
        );

        require(!isClaimed(merkleRoot, index), "already claimed");
        _setClaimed(merkleRoot, index);

        int96 sendFlowRate = _toInt96(amount / uint256(config[merkleRoot].streamDuration));
        uint256 minFlowRequirement = cfa.getDepositRequiredForFlowRate(config[merkleRoot].token, sendFlowRate);
        bytes32 salt = keccak256(abi.encode(merkleRoot, account));
        address lsrAddress = _getLSRAddress(salt, address(this));

        require(config[merkleRoot].token.transferFrom(
            config[merkleRoot].tokensProvider,
            lsrAddress,
            amount + minFlowRequirement
        ), "transfer failed");
        _startStream(
            salt,
            config[merkleRoot].token,
            account,
            sendFlowRate
        );
        emit Claimed(account, address(config[merkleRoot].token), amount);
        emit StreamLSR(lsrAddress, account,address(config[merkleRoot].token), sendFlowRate);
    }

    function _getLSRAddress(bytes32 salt, address self) pure internal returns(address) {
        return address(uint160(uint256(
            keccak256(abi.encodePacked(
                hex"ff",self,salt,keccak256(abi.encodePacked(type(LSR).creationCode))
            ))
            ))
        );
    }

    function _startStream(bytes32 salt, ISuperToken token, address receiver, int96 flowRate) internal returns (address) {
        bytes memory code = type(LSR).creationCode;
        address addr;
        assembly {
            addr := create2(
                0,
                add(code, 0x20),
                mload(code),
                salt
            )

            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        bytes memory encodedOP;
        (,int96 nowFlowRate, , ) = cfa.getFlow(token, addr, receiver);
        if(nowFlowRate == 0) {
            encodedOP = abi.encodeWithSelector(
                cfa.createFlow.selector,
                token,
                receiver,
                flowRate,
                new bytes(0)
            );
        } else {
            encodedOP = abi.encodeWithSelector(
                cfa.updateFlow.selector,
                token,
                receiver,
                flowRate + (nowFlowRate),
                new bytes(0)
            );
        }
        LSR(addr).init(sf, cfa, encodedOP);
        return addr;
    }

    function _toInt96(uint256 value) internal pure returns(int96) {
        int256 _value = _toInt256(value);
        require(_value >= -2**95 && _value < 2**95, "cast not allowed");
        return int96(_value);
    }

    function _toInt256(uint256 value) internal pure returns(int256) {
        require(value <= uint256(type(int256).max), "cast not allowed");
        return int256(value);
    }
}
