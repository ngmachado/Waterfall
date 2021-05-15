# merkle-drop

## Intro

Easy way to make Merkle Tree distribuition without coding. For each supported EVM network exist one merkle-drop contract that anyone can register one distribuition.

Each distribuition is bound to a set of time, soo you can decide how much time will the distribuion run.

Merkle-drop don't manage funds, for each valid claim will this contract will perform a ERC20 transferFrom from the tokenProvider account.

**Merkle-drop don't have administrative powers**

## How to use - main steps

- Generete data for each user drop, follow a specific format (detail).
- Generate the merkle tree root based on user drop data.
- In ERC20 token to be distributed `approve` merkle-drop contract with the total amount of tokens to be transfer.
- Register the merkle drop in the smart contract: merkleRoot, token, tokensProvider, startTime, endTime

## Details and concepts

`drop` - A set of users can claim a particular token.

`merkleRoot` - generated from user set of data, each user claim represent a leaf.

`leaf` - user claim that follow the format: `index account amount`

`token` - ERC20 contract that are making the drop.

`tokensProvider` - account that is feeding the tokens to the drop.

`startTime`, `endTime` - Define the interval for valid claims to be processed.

## Next steps

- Create a web interface to operate the smart contract.
- Make more gas optimizations.
- Make a proper audit to this project.

## Q/A

(Q): Why?

(A): First merkle distribuion are cool.
Facilitating the distribuiton of tokens in a mix offchain - onchain settings let projects to easly distribute tokens to a large amount of users.
Merkle distributions avoid spamming, the user have to claim the tokens he wants.

(Q): This is not the first smart contract doing merkle distribuition...

(A): True, the value of this project in my opinion is to set the infrastruture necessary to make merkle distribuion easy to anybody.

(Q): Can anyone register my token to a drop?

(A): Yes.

(Q): Can i use merkle-drop to make different drops from the **same token and same user set data**?

(A): No, this version is only capable of making one drop per _user set data_, if the data is different, then you can make multi drops from the same token.

(Q): Someone register my token blocking me from making my own drop, can you solve that?

(A): No, merkle-drop is **literally a permissionless system**. One way to overcome that is to use different set of data, generating a different merkleRoot.

(Q): If `tokenProvider` removes the allowance in the middle of a drop?

(A): The claim will revert when trying to transfer the token.

## Limitations

**This project has not audit.**

This means in my best effort to make the code correct, providing unit-tests and coverage analysis this project can have bugs.

**Use at your responsability**

That define the merkle root is the set of user data, in the case of two token use identical data, only one can be register and used. This can overcame by chainging something in the data like swap two indexes or just add 1 to any claimable amount.

Merkle-drop don't manage or hold tokens, if tokenProvider don't approve or doesn't have enough token amount, eventually the claim will revert.

## Kudos

- [merkle-distributor](https://github.com/Uniswap/merkle-distributor)
- [merkletreejs](https://github.com/miguelmota/merkletreejs)
