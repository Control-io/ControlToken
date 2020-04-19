const ControlToken = artifacts.require("./ControlToken.sol");

module.exports = function(deployer) {
  deployer.deploy(ControlToken);
};
