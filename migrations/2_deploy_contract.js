const Remitter = artifacts.require('Remitter');

module.exports = (deployer, network, accounts) =>
  deployer.deploy(Remitter, { from: accounts[0] });

