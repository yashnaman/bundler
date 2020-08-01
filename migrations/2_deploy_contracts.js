const Forwarder = artifacts.require("EIP712Forwarder");
const BulkCheckout = artifacts.require("BulkCheckout");

module.exports = function (deployer) {
  deployer.deploy(Forwarder).then(function () {
    return deployer.deploy(BulkCheckout, Forwarder.address);
  });
};
