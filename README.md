# Waterfall

[![Coverage Status](https://coveralls.io/repos/github/ngmachado/Waterfall/badge.svg?branch=master)](https://coveralls.io/github/ngmachado/Waterfall?branch=master)

---
## Introduction

With Waterfall is easy to make Merkle Tree Distribuition without having to code. For each supported EVM network exist one Waterfall that anyone can register one or many distribuition.

Each distribuition __can__ be bound to a time interval, this means that you can define the start and end date for your air drop.

Waterfall don't manage any funds, for each valid claim _(user asking for tokens)_ this contract will perform a ERC20 `transferFrom` from the tokenProvider account.

Waterfall is capable of managing differents drops even for the same token at the same time. _(Recursive drops)_

Anyone can make a claim to a specific user, this makes easier if you want to implement some type of meta-transaction and pay the user gas fees.

**Waterfall contract don't have or need administrative powers**

## How to use - conceptual steps

- Generete drop data, follow a specific format (see detail).
- Generate the merkle tree root based with drop data.
- In your token contract `approve` Waterfall address with the total amount of tokens to be transfer.
- Register the merkle drop information in the smart contract: merkleRoot, token, tokensProvider, startTime, endTime.
- Publish the merkle tree data, each user need this information to make a claim.

## Details and concepts

`drop` - A set of users can claim a particular token.

`merkleRoot` - generated from user set of data, each singular drop is represent in a leaf.

`user set data` - Information needed to make a claim.

`leaf` - user claim that follow the format: `index account amount`

`token` - ERC20 contract that are making the drop.

`tokensProvider` - account that is feeding the tokens to the drop.

`startTime`, `endTime` - Define the interval for valid claims to be processed.

## Next steps

- Make all the steps automatic asking only drop data set.
- Create scripts to enable automatic interactions from different protocols.
- Create a web interface to operate the smart contract.
- Make a proper audit to this project.

## Q/A

(Q): Why?

(A): First merkle distribuion are cool.
Facilitating the distribuiton of tokens in a mix offchain - onchain settings let projects to easly distribute tokens to a large number of users.
Merkle distributions avoid spamming, the user have to claim the tokens he wants.

(Q): This is not the first smart contract doing merkle distribuition...

(A): True, the value of this project in my opinion is to set the infrastruture necessary to make merkle distribuion easy to anybody.

(Q): Can anyone register my token to a drop?

(A): Yes.

(Q): Can i use Waterfall to make different drops from the **same token and same user set data**?

(A): No, this version is only capable of making one drop per _user set data_, if the data is different, then you can make multi drops from the same token. _Any change in data will do the job._

(Q): Someone register my token blocking me from making my own drop, can you solve that?

(A):  No, Waterfall is **literally a permissionless system**.

_This is very unlikly to happen, but in the case you are dealing with this problem, just change any data point on the `data set`. Any change on this file will generate a new merkleRoot._

(Q): If `tokenProvider` removes the allowance in the middle of a drop?

(A): The claim will revert when trying to transfer the token. We don't ask to lock tokens in Waterfall contracts.

## Limitations

**This project has not audit.**

This means in my best effort to make the code correct, providing unit-tests and coverage analysis, but the project can still have bugs.

**Use at your responsability**

That define the merkle root is the set of user data, in the case of two token use identical data, only one can be register and used. This can overcame by chainging something in the data like swap two indexes or just add 1 to any claimable amount.

Waterfall contract don't manage or hold any tokens, if tokenProvider don't approve or doesn't have enough token amount, eventually the claim will revert. (_this is not a limitation, is a feature_)

The merkle tree generated from given data can generate a unbalanced tree. We are not adding fake or double information to balance the tree.

## Kudos

- [merkle-distributor](https://github.com/Uniswap/merkle-distributor)
- [merkletreejs](https://github.com/miguelmota/merkletreejs)
