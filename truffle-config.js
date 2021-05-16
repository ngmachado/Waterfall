const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    goerli: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        process.env.PROVIDER,
        0, //address_index
        10, // num_addresses
        true // shareNonce
      ),
      network_id: 5,
      gas: 8e6,
      gasPrice: + process.env.GAS_PRICE || 10e9,
      confirmations: 6,
      timeoutBlocks: 50,
      skipDryRun: false
    },

    mumbai: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.PROVIDER,
          0, //address_index
          10, // num_addresses
          true // shareNonce
        ),
      network_id: 80001,
      gas: 8e6,
      gasPrice: + process.env.GAS_PRICE || 1e9,
      confirmations: 6,
      timeoutBlocks: 50,
      skipDryRun: false,
    },

    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          process.env.PROVIDER,
          0, //address_index
          10, // num_addresses
          true // shareNonce
        ),
      network_id: 4,
      gas: process.env.GAS_PRICE,
      gasPrice: 1e9,
      confirmations: 6,
      timeoutBlocks: 50,
      skipDryRun: false,
    },

    ganache: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    }
  },
  plugins: [
    "solidity-coverage",
    "truffle-plugin-verify"
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: { showTimeSpent: true }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200
        }
      }
    }
  },
};
