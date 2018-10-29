const Remittance = artifacts.require('Remittance');

module.exports = (deployer, network, accounts) =>
  deployer.deploy(Remittance, { from: accounts[0] });

