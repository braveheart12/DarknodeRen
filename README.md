# Ethereum Republic

> This library is an active WIP.

The Ethereum Republic library is the official reference implementation of the Republic Protocol on Ethereum, written in Solidity. The Republic Protocol does not explicitly require an Ethereum implementation, and future implementations may be developed on other blockchains. For now, Ethereum is used because it is the biggest and most reputable smart contract platform available.

## Smart contracts

The Ethereum Republic library is made up of several different smart contracts that work together to implement the required on-chain functionality. These smart contracts are used by off-chain miners and traders to provide secure decentralized order matching computations.

1. The Ren ERC20 contract implements the Republic Token, used to provide economic incentives.
2. The Miner Registrar contract implements miner registrations and epochs.
3. The Trader Registrar contract implements trader registrations.
4. The Order Book contract implements the opening, closing, and expiration of orders.

None of the contract expose orders, including the Order Book, which only holds order IDs. Orders are never passed to the Republic network under any circumstances, and order fragments are never passed to the blockchain.

## Tests

Install all NPM modules and Truffle as a global command.

```
npm install --global truffle
npm install
```

Run the `ganache` script. This script needs to continue running in the background; either run it in a separate terminal, or append the `&` symbol.

```sh
./ganache
```

Run the Truffle test suite.

```sh
truffle test
```

## Republic

The Ethereum Republic library was developed by the Republic Protocol team and is available under the MIT license. For more information, see our website https://republicprotocol.com.

## Contributors

* Noah noah@republicprotocol.com
* Susruth susruth@republicprotocol.com
* Loong loong@republicprotocol.com