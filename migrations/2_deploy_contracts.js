const Forwarder = artifacts.require("EIP712Forwarder");
const BulkCheckout = artifacts.require("BulkCheckout");
const DaiLikeERC20 = artifacts.require("DaiLikeERC20");
const EIP2612LikeERC20 = artifacts.require("EIP2612LikeERC20");
const TestToken = artifacts.require("TestToken");
module.exports = async function (deployer, network, accounts) {
  const chainId = await web3.eth.net.getId();
  const forwarder = await Forwarder.new(chainId);
  const bulkCheckout = await BulkCheckout.new(Forwarder.address);

  const daiLikeERC20 = await DaiLikeERC20.new(chainId);
  const eIP2612LikeERC20 = await EIP2612LikeERC20.new(chainId);

  const testToken = await TestToken.new("Test", "TST");

  //mint a bunch to the user
  const mintAmount = web3.utils.toWei("100");
  await daiLikeERC20.mint(accounts[0], mintAmount);
  await eIP2612LikeERC20.mint(accounts[0], mintAmount);
  await testToken.mint(accounts[0], mintAmount);
  //print addresses
  console.log("Forwarder:\t" + forwarder.address);
  console.log("Bundler:\t" + bulkCheckout.address);
  console.log("DaiLikeERC20\t" + daiLikeERC20.address);
  console.log("EIP2612LikeERC20\t" + eIP2612LikeERC20.address);
  console.log("testToken\t" + testToken.address);
};
