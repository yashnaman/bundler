// const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const {
  balance,
  constants,
  expectEvent,
  expectRevert,
  time,
} = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { inTransaction } = require("@openzeppelin/test-helpers/src/expectEvent");
const {
  schemas,
  generators,
  eth_signTypedData,
  getSignatureParameters,
} = require("./utils");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { prototype } = require("@truffle/hdwallet-provider");

const BulkCheckout = artifacts.require("BulkCheckout");
const EIP712Forwarder = artifacts.require("EIP712Forwarder");
const TestToken = artifacts.require("TestToken");
const SelfDestruct = artifacts.require("SelfDestruct");
const EIP2612LikeERC20 = artifacts.require("EIP2612LikeERC20");
const DaiLikeERC20 = artifacts.require("DaiLikeERC20");

const MAX_UINT256 = constants.MAX_UINT256.toString();
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const { fromWei, toWei } = web3.utils;

contract("BulkCheckout", (accounts) => {
  const [owner, user, grant1, grant2, grant3, withdrawal] = accounts;

  let bulkCheckout;
  let link;
  let usdc;
  let univ2;
  let dai;
  let EIP2612LikeDomainData;
  let DaiLikeDomainData;

  beforeEach(async () => {
    chainId = await web3.eth.net.getId();
    //Deploy the forwarder contract
    forwarder = await EIP712Forwarder.new(chainId);
    // Deploy bulk checkout contract
    bulkCheckout = await BulkCheckout.new(forwarder.address, { from: owner });

    // Deploy a few test tokens
    link = await TestToken.new("link", "link");
    usdc = await TestToken.new("USD Coin", "USDC");

    // Mint a bunch to the user
    const mintAmount = toWei("100");
    link.mint(user, mintAmount);
    usdc.mint(user, mintAmount);

    // Approve bulkCheckout contract to spend our tokens
    link.approve(bulkCheckout.address, MAX_UINT256, { from: user });
    usdc.approve(bulkCheckout.address, MAX_UINT256, { from: user });

    univ2 = await EIP2612LikeERC20.new(chainId);
    dai = await DaiLikeERC20.new(chainId);
    univ2.mint(user, mintAmount);
    dai.mint(user, mintAmount);

    messegeTypeName = "Permit";
    EIP2612LikeDomainData = generators.getDomainData(
      "Uniswap V2", //name
      "1", //version
      chainId,
      univ2.address
    );
    DaiLikeDomainData = generators.getDomainData(
      "Dai Stablecoin", //name of the contract
      "1", //version
      chainId,
      dai.address
    );
  });
  // ======================================= Initialization ========================================

  it("should see the deployed BulkCheckout contract", async () => {
    expect(bulkCheckout.address.startsWith("0x")).to.be.true;
    expect(bulkCheckout.address.length).to.equal(42);
  });

  it("sets the owner upon deployment", async () => {
    expect(await bulkCheckout.owner()).to.equal(owner);
  });

  // ====================================== Single Donations =======================================
  it("lets the user submit only one donation for a token", async () => {
    const donations = [
      { token: link.address, amount: toWei("5"), dest: grant1 },
    ];
    const receipt = await bulkCheckout.donate(donations, { from: user });
    expect(fromWei(await link.balanceOf(user))).to.equal("95");
    expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
    expectEvent(receipt, "DonationSent", {
      token: link.address,
      amount: toWei("5"),
      dest: grant1,
      donor: user,
    });
  });

  it("lets the user submit only one donation of ETH", async () => {
    const donations = [
      { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
    ];
    let tracker = await balance.tracker(grant1);
    const receipt = await bulkCheckout.donate(donations, {
      from: user,
      value: toWei("5"),
    });
    expect(await tracker.delta()).to.be.bignumber.equal(toWei("5"));
    expectEvent(receipt, "DonationSent", {
      token: ETH_ADDRESS,
      amount: toWei("5"),
      dest: grant1,
      donor: user,
    });
  });

  // ======================================= Bulk Donations ========================================
  it("lets the user submit multiple donations of the same token", async () => {
    const donations = [
      { token: link.address, amount: toWei("5"), dest: grant1 },
      { token: link.address, amount: toWei("10"), dest: grant2 },
      { token: link.address, amount: toWei("25"), dest: grant3 },
    ];
    await bulkCheckout.donate(donations, { from: user });
    expect(fromWei(await link.balanceOf(user))).to.equal("60");
    expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
    expect(fromWei(await link.balanceOf(grant2))).to.equal("10");
    expect(fromWei(await link.balanceOf(grant3))).to.equal("25");
  });

  it("lets the user submit multiple donations of different tokens", async () => {
    const donations = [
      { token: link.address, amount: toWei("5"), dest: grant1 },
      { token: link.address, amount: toWei("10"), dest: grant2 },
      { token: usdc.address, amount: toWei("25"), dest: grant3 },
    ];
    await bulkCheckout.donate(donations, { from: user });
    expect(fromWei(await link.balanceOf(user))).to.equal("85");
    expect(fromWei(await usdc.balanceOf(user))).to.equal("75");
    expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
    expect(fromWei(await link.balanceOf(grant2))).to.equal("10");
    expect(fromWei(await usdc.balanceOf(grant3))).to.equal("25");
  });

  it("lets the user submit multiple donations of only ETH", async () => {
    let tracker1 = await balance.tracker(grant1);
    let tracker2 = await balance.tracker(grant2);
    let tracker3 = await balance.tracker(grant3);
    const donations = [
      { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
      { token: ETH_ADDRESS, amount: toWei("15"), dest: grant2 },
      { token: ETH_ADDRESS, amount: toWei("10"), dest: grant3 },
    ];
    await bulkCheckout.donate(donations, { from: user, value: toWei("30") });

    expect(await tracker1.delta()).to.be.bignumber.equal(toWei("5"));
    expect(await tracker2.delta()).to.be.bignumber.equal(toWei("15"));
    expect(await tracker3.delta()).to.be.bignumber.equal(toWei("10"));
  });

  it("lets the user submit multiple donations as mix of tokens and ETH", async () => {
    let tracker = await balance.tracker(grant2);
    const donations = [
      { token: link.address, amount: toWei("5"), dest: grant1 },
      { token: ETH_ADDRESS, amount: toWei("15"), dest: grant2 },
      { token: usdc.address, amount: toWei("25"), dest: grant3 },
    ];
    await bulkCheckout.donate(donations, { from: user, value: toWei("15") });
    expect(fromWei(await link.balanceOf(user))).to.equal("95");
    expect(fromWei(await usdc.balanceOf(user))).to.equal("75");
    expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
    expect(await tracker.delta()).to.be.bignumber.equal(toWei("15"));
    expect(fromWei(await usdc.balanceOf(grant3))).to.equal("25");
  });

  // =================================== Donation Error Handling ===================================
  it("reverts if too much ETH is sent", async () => {
    const donations = [
      { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
    ];
    await expectRevert(
      bulkCheckout.donate(donations, { from: user, value: toWei("50") }),
      "BulkCheckout: Too much ETH sent"
    );
  });

  it("reverts if too little ETH is sent", async () => {
    const donations = [
      { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
    ];
    await expectRevert(
      bulkCheckout.donate(donations, { from: user, value: toWei("0.5") }),
      "Address: insufficient balance"
    );
  });

  it("does not let ETH be transferred to the contract", async () => {
    await expectRevert.unspecified(
      web3.eth.sendTransaction({
        to: bulkCheckout.address,
        from: user,
        value: toWei("5"),
      })
    );
  });

  // ======================================== Admin Actions ========================================
  it("lets ownership be transferred by the owner", async () => {
    expect(await bulkCheckout.owner()).to.equal(owner);
    await bulkCheckout.transferOwnership(user, { from: owner });
    expect(await bulkCheckout.owner()).to.equal(user);
  });

  it("does not let anyone except the owner transfer ownership", async () => {
    await expectRevert(
      bulkCheckout.transferOwnership(user, { from: user }),
      "Ownable: caller is not the owner"
    );
  });

  it("lets the owner pause and unpause the contract", async () => {
    // Contract not paused. Make sure we cannot unpause
    expect(await bulkCheckout.paused()).to.equal(false);
    await expectRevert(
      bulkCheckout.unpause({ from: owner }),
      "Pausable: not paused"
    );

    // Pause it and make sure we can no longer send donations
    await bulkCheckout.pause({ from: owner });
    expect(await bulkCheckout.paused()).to.equal(true);
    const donations = [
      { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
    ];
    await expectRevert(
      bulkCheckout.donate(donations, { from: user, value: toWei("5") }),
      "Pausable: paused"
    );

    // Unpause and make sure everything still works
    await bulkCheckout.unpause({ from: owner });
    await bulkCheckout.donate(donations, { from: user, value: toWei("5") });
  });

  it("does not let anyone except the owner pause the contract", async () => {
    // Contract not paused. Make sure user cannot pause it
    expect(await bulkCheckout.paused()).to.equal(false);
    await expectRevert(
      bulkCheckout.pause({ from: user }),
      "Ownable: caller is not the owner"
    );

    // Pause contract and make sure user cannot unpause it
    await bulkCheckout.pause({ from: owner });
    expect(await bulkCheckout.paused()).to.equal(true);
    await expectRevert(
      bulkCheckout.unpause({ from: user }),
      "Ownable: caller is not the owner"
    );
  });

  it("lets only the owner recover stray tokens accidentally sent to the contract", async () => {
    // Send link to the contract
    link.mint(bulkCheckout.address, toWei("10"));
    expect(fromWei(await link.balanceOf(bulkCheckout.address))).to.equal("10");

    // Make sure user cannot withdrawn the tokens
    await expectRevert(
      bulkCheckout.withdrawToken(link.address, withdrawal, { from: user }),
      "Ownable: caller is not the owner"
    );

    // Make sure owner can withdraw
    expect(fromWei(await link.balanceOf(withdrawal))).to.equal("0");
    const receipt = await bulkCheckout.withdrawToken(link.address, withdrawal, {
      from: owner,
    });
    expect(fromWei(await link.balanceOf(withdrawal))).to.equal("10");
    expectEvent(receipt, "TokenWithdrawn", {
      token: link.address,
      amount: toWei("10"),
      dest: withdrawal,
    });
  });

  it("lets only the owner recover Ether forcibly sent to the contract", async () => {
    let tracker = await balance.tracker(withdrawal);

    // Deploy our self-destruct contract
    const selfDestruct = await SelfDestruct.new();

    // Send ETH to that contract
    await web3.eth.sendTransaction({
      to: selfDestruct.address,
      from: user,
      value: toWei("5"),
    });
    expect(fromWei(await balance.current(selfDestruct.address))).to.equal("5");

    // Self-destruct it
    await selfDestruct.forceEther(bulkCheckout.address, { from: user });
    expect(fromWei(await balance.current(bulkCheckout.address))).to.equal("5");

    // Make sure user cannot withdrawn the ETH
    await expectRevert(
      bulkCheckout.withdrawEther(withdrawal, { from: user }),
      "Ownable: caller is not the owner"
    );

    // Make sure owner can withdraw
    expect(await tracker.delta()).to.be.bignumber.equal(toWei("0")); // initial balance
    const receipt = await bulkCheckout.withdrawEther(withdrawal, {
      from: owner,
    });
    expect(await tracker.delta()).to.be.bignumber.equal(toWei("5"));
    expectEvent(receipt, "TokenWithdrawn", {
      token: ETH_ADDRESS,
      amount: toWei("5"),
      dest: withdrawal,
    });
  });

  // ======================= Permit and transfer Pattern Tests ===================================

  it("lets permit and doante EIP2612Like tokens", async function () {
    const donations = [
      { token: univ2.address, amount: toWei("5"), dest: grant1 },
      { token: univ2.address, amount: toWei("10"), dest: grant2 },
      { token: univ2.address, amount: toWei("25"), dest: grant3 },
    ];

    let owner = user;
    let spender = bulkCheckout.address;
    let value = MAX_UINT256;
    let nonce = (await univ2.nonces(user)).toString();
    let deadline = (await time.latest()) + 60 * 60;

    let message = {};
    message.owner = owner;
    message.spender = spender;
    message.value = value;
    message.nonce = nonce;
    message.deadline = deadline;

    let signatureData = generators.getRequestData(
      EIP2612LikeDomainData,
      messegeTypeName,
      schemas.eip2612LikePermit,
      message
    );
    // console.log(signatureData);
    let signature = await eth_signTypedData(user, signatureData);

    let { r, s, v } = getSignatureParameters(signature);

    let eip2612LikePermits = [];
    let permit = {};
    permit.token = univ2.address;
    permit.owner = owner;
    permit.spender = spender;
    permit.value = value;
    permit.nonce = nonce;
    permit.deadline = deadline;
    permit.r = r;
    permit.s = s;
    permit.v = v;

    eip2612LikePermits.push(permit);

    const receipt = await bulkCheckout.permitAndDonate2(
      donations,
      eip2612LikePermits,
      {
        from: user,
      }
    );
    expect(fromWei(await univ2.balanceOf(user))).to.equal("60");
    expect(fromWei(await univ2.balanceOf(grant1))).to.equal("5");
    expect(fromWei(await univ2.balanceOf(grant2))).to.equal("10");
    expect(fromWei(await univ2.balanceOf(grant3))).to.equal("25");
    expectEvent(receipt, "DonationSent", {
      token: univ2.address,
      amount: toWei("5"),
      dest: grant1,
      donor: user,
    });
  });
  it("lets permit and doante DAILike tokens", async function () {
    const donations = [
      { token: dai.address, amount: toWei("5"), dest: grant1 },
      { token: dai.address, amount: toWei("10"), dest: grant2 },
      { token: dai.address, amount: toWei("25"), dest: grant3 },
    ];

    let holder = user;
    let spender = bulkCheckout.address;
    let nonce = (await dai.nonces(user)).toString();
    let expiry = (await time.latest()) + 60 * 60;
    let allowed = true;

    let message = {};
    message.holder = holder;
    message.spender = spender;
    message.nonce = nonce;
    message.expiry = expiry;
    message.allowed = true;

    let signatureData = generators.getRequestData(
      DaiLikeDomainData,
      messegeTypeName,
      schemas.daiLikePermit,
      message
    );
    // console.log(signatureData);
    let signature = await eth_signTypedData(user, signatureData);

    let { r, s, v } = getSignatureParameters(signature);

    let daiLikePermits = [];
    let permit = {};
    permit.token = dai.address;
    permit.holder = holder;
    permit.spender = spender;
    permit.nonce = nonce;
    permit.expiry = expiry;
    permit.allowed = allowed;
    permit.r = r;
    permit.s = s;
    permit.v = v;

    daiLikePermits.push(permit);

    const receipt = await bulkCheckout.permitAndDonate1(
      donations,
      daiLikePermits,
      {
        from: user,
      }
    );
    expect(fromWei(await dai.balanceOf(user))).to.equal("60");
    expect(fromWei(await dai.balanceOf(grant1))).to.equal("5");
    expect(fromWei(await dai.balanceOf(grant2))).to.equal("10");
    expect(fromWei(await dai.balanceOf(grant3))).to.equal("25");
    expectEvent(receipt, "DonationSent", {
      token: dai.address,
      amount: toWei("5"),
      dest: grant1,
      donor: user,
    });
  });
  it("lets the user submit multiple donations of different tokens(part 2)", async () => {
    const donations = [
      { token: link.address, amount: toWei("5"), dest: grant1 },
      { token: dai.address, amount: toWei("10"), dest: grant2 },
      { token: univ2.address, amount: toWei("25"), dest: grant3 },
    ];

    //univ2
    let owner = user;
    let spender = bulkCheckout.address;
    let value = MAX_UINT256;
    let nonce = (await univ2.nonces(user)).toString();
    let deadline = (await time.latest()) + 60 * 60;

    let message = {};
    message.owner = owner;
    message.spender = spender;
    message.value = value;
    message.nonce = nonce;
    message.deadline = deadline;

    let signatureData = generators.getRequestData(
      EIP2612LikeDomainData,
      messegeTypeName,
      schemas.eip2612LikePermit,
      message
    );
    // console.log(signatureData);
    let signature = await eth_signTypedData(user, signatureData);

    // console.log(signature);

    let { r, s, v } = getSignatureParameters(signature);

    let eip2612LikePermits = [];
    let permit = {}; // ======================================= Initialization ========================================

    it("should see the deployed BulkCheckout contract", async () => {
      expect(bulkCheckout.address.startsWith("0x")).to.be.true;
      expect(bulkCheckout.address.length).to.equal(42);
    });

    it("sets the owner upon deployment", async () => {
      expect(await bulkCheckout.owner()).to.equal(owner);
    });

    // ====================================== Single Donations =======================================
    it("lets the user submit only one donation for a token", async () => {
      const donations = [
        { token: link.address, amount: toWei("5"), dest: grant1 },
      ];
      const receipt = await bulkCheckout.donate(donations, { from: user });
      expect(fromWei(await link.balanceOf(user))).to.equal("95");
      expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
      expectEvent(receipt, "DonationSent", {
        token: link.address,
        amount: toWei("5"),
        dest: grant1,
        donor: user,
      });
    });

    it("lets the user submit only one donation of ETH", async () => {
      const donations = [
        { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
      ];
      let tracker = await balance.tracker(grant1);
      const receipt = await bulkCheckout.donate(donations, {
        from: user,
        value: toWei("5"),
      });
      expect(await tracker.delta()).to.be.bignumber.equal(toWei("5"));
      expectEvent(receipt, "DonationSent", {
        token: ETH_ADDRESS,
        amount: toWei("5"),
        dest: grant1,
        donor: user,
      });
    });

    // ======================================= Bulk Donations ========================================
    it("lets the user submit multiple donations of the same token", async () => {
      const donations = [
        { token: link.address, amount: toWei("5"), dest: grant1 },
        { token: link.address, amount: toWei("10"), dest: grant2 },
        { token: link.address, amount: toWei("25"), dest: grant3 },
      ];
      await bulkCheckout.donate(donations, { from: user });
      expect(fromWei(await link.balanceOf(user))).to.equal("60");
      expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
      expect(fromWei(await link.balanceOf(grant2))).to.equal("10");
      expect(fromWei(await link.balanceOf(grant3))).to.equal("25");
    });

    it("lets the user submit multiple donations of different tokens", async () => {
      const donations = [
        { token: link.address, amount: toWei("5"), dest: grant1 },
        { token: link.address, amount: toWei("10"), dest: grant2 },
        { token: usdc.address, amount: toWei("25"), dest: grant3 },
      ];
      await bulkCheckout.donate(donations, { from: user });
      expect(fromWei(await link.balanceOf(user))).to.equal("85");
      expect(fromWei(await usdc.balanceOf(user))).to.equal("75");
      expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
      expect(fromWei(await link.balanceOf(grant2))).to.equal("10");
      expect(fromWei(await usdc.balanceOf(grant3))).to.equal("25");
    });

    it("lets the user submit multiple donations of only ETH", async () => {
      let tracker1 = await balance.tracker(grant1);
      let tracker2 = await balance.tracker(grant2);
      let tracker3 = await balance.tracker(grant3);
      const donations = [
        { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
        { token: ETH_ADDRESS, amount: toWei("15"), dest: grant2 },
        { token: ETH_ADDRESS, amount: toWei("10"), dest: grant3 },
      ];
      await bulkCheckout.donate(donations, { from: user, value: toWei("30") });

      expect(await tracker1.delta()).to.be.bignumber.equal(toWei("5"));
      expect(await tracker2.delta()).to.be.bignumber.equal(toWei("15"));
      expect(await tracker3.delta()).to.be.bignumber.equal(toWei("10"));
    });

    it("lets the user submit multiple donations as mix of tokens and ETH", async () => {
      let tracker = await balance.tracker(grant2);
      const donations = [
        { token: link.address, amount: toWei("5"), dest: grant1 },
        { token: ETH_ADDRESS, amount: toWei("15"), dest: grant2 },
        { token: usdc.address, amount: toWei("25"), dest: grant3 },
      ];
      await bulkCheckout.donate(donations, { from: user, value: toWei("15") });
      expect(fromWei(await link.balanceOf(user))).to.equal("95");
      expect(fromWei(await usdc.balanceOf(user))).to.equal("75");
      expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
      expect(await tracker.delta()).to.be.bignumber.equal(toWei("15"));
      expect(fromWei(await usdc.balanceOf(grant3))).to.equal("25");
    });

    // =================================== Donation Error Handling ===================================
    it("reverts if too much ETH is sent", async () => {
      const donations = [
        { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
      ];
      await expectRevert(
        bulkCheckout.donate(donations, { from: user, value: toWei("50") }),
        "BulkCheckout: Too much ETH sent"
      );
    });

    it("reverts if too little ETH is sent", async () => {
      const donations = [
        { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
      ];
      await expectRevert(
        bulkCheckout.donate(donations, { from: user, value: toWei("0.5") }),
        "Address: insufficient balance"
      );
    });

    it("does not let ETH be transferred to the contract", async () => {
      await expectRevert.unspecified(
        web3.eth.sendTransaction({
          to: bulkCheckout.address,
          from: user,
          value: toWei("5"),
        })
      );
    });

    // ======================================== Admin Actions ========================================
    it("lets ownership be transferred by the owner", async () => {
      expect(await bulkCheckout.owner()).to.equal(owner);
      await bulkCheckout.transferOwnership(user, { from: owner });
      expect(await bulkCheckout.owner()).to.equal(user);
    });

    it("does not let anyone except the owner transfer ownership", async () => {
      await expectRevert(
        bulkCheckout.transferOwnership(user, { from: user }),
        "Ownable: caller is not the owner"
      );
    });

    it("lets the owner pause and unpause the contract", async () => {
      // Contract not paused. Make sure we cannot unpause
      expect(await bulkCheckout.paused()).to.equal(false);
      await expectRevert(
        bulkCheckout.unpause({ from: owner }),
        "Pausable: not paused"
      );

      // Pause it and make sure we can no longer send donations
      await bulkCheckout.pause({ from: owner });
      expect(await bulkCheckout.paused()).to.equal(true);
      const donations = [
        { token: ETH_ADDRESS, amount: toWei("5"), dest: grant1 },
      ];
      await expectRevert(
        bulkCheckout.donate(donations, { from: user, value: toWei("5") }),
        "Pausable: paused"
      );

      // Unpause and make sure everything still works
      await bulkCheckout.unpause({ from: owner });
      await bulkCheckout.donate(donations, { from: user, value: toWei("5") });
    });

    it("does not let anyone except the owner pause the contract", async () => {
      // Contract not paused. Make sure user cannot pause it
      expect(await bulkCheckout.paused()).to.equal(false);
      await expectRevert(
        bulkCheckout.pause({ from: user }),
        "Ownable: caller is not the owner"
      );

      // Pause contract and make sure user cannot unpause it
      await bulkCheckout.pause({ from: owner });
      expect(await bulkCheckout.paused()).to.equal(true);
      await expectRevert(
        bulkCheckout.unpause({ from: user }),
        "Ownable: caller is not the owner"
      );
    });

    it("lets only the owner recover stray tokens accidentally sent to the contract", async () => {
      // Send link to the contract
      link.mint(bulkCheckout.address, toWei("10"));
      expect(fromWei(await link.balanceOf(bulkCheckout.address))).to.equal(
        "10"
      );

      // Make sure user cannot withdrawn the tokens
      await expectRevert(
        bulkCheckout.withdrawToken(link.address, withdrawal, { from: user }),
        "Ownable: caller is not the owner"
      );

      // Make sure owner can withdraw
      expect(fromWei(await link.balanceOf(withdrawal))).to.equal("0");
      const receipt = await bulkCheckout.withdrawToken(
        link.address,
        withdrawal,
        {
          from: owner,
        }
      );
      expect(fromWei(await link.balanceOf(withdrawal))).to.equal("10");
      expectEvent(receipt, "TokenWithdrawn", {
        token: link.address,
        amount: toWei("10"),
        dest: withdrawal,
      });
    });

    it("lets only the owner recover Ether forcibly sent to the contract", async () => {
      let tracker = await balance.tracker(withdrawal);

      // Deploy our self-destruct contract
      const selfDestruct = await SelfDestruct.new();

      // Send ETH to that contract
      await web3.eth.sendTransaction({
        to: selfDestruct.address,
        from: user,
        value: toWei("5"),
      });
      expect(fromWei(await balance.current(selfDestruct.address))).to.equal(
        "5"
      );

      // Self-destruct it
      await selfDestruct.forceEther(bulkCheckout.address, { from: user });
      expect(fromWei(await balance.current(bulkCheckout.address))).to.equal(
        "5"
      );

      // Make sure user cannot withdrawn the ETH
      await expectRevert(
        bulkCheckout.withdrawEther(withdrawal, { from: user }),
        "Ownable: caller is not the owner"
      );

      // Make sure owner can withdraw
      expect(await tracker.delta()).to.be.bignumber.equal(toWei("0")); // initial balance
      const receipt = await bulkCheckout.withdrawEther(withdrawal, {
        from: owner,
      });
      expect(await tracker.delta()).to.be.bignumber.equal(toWei("5"));
      expectEvent(receipt, "TokenWithdrawn", {
        token: ETH_ADDRESS,
        amount: toWei("5"),
        dest: withdrawal,
      });
    });

    // ======================= Permit and transfer Pattern Tests ===================================

    it("lets permit and doante EIP2612Like tokens", async function () {
      const donations = [
        { token: univ2.address, amount: toWei("5"), dest: grant1 },
        { token: univ2.address, amount: toWei("10"), dest: grant2 },
        { token: univ2.address, amount: toWei("25"), dest: grant3 },
      ];

      let owner = user;
      let spender = bulkCheckout.address;
      let value = MAX_UINT256;
      let nonce = (await univ2.nonces(user)).toString();
      let deadline = (await time.latest()) + 60 * 60;

      let message = {};
      message.owner = owner;
      message.spender = spender;
      message.value = value;
      message.nonce = nonce;
      message.deadline = deadline;

      let signatureData = generators.getRequestData(
        EIP2612LikeDomainData,
        messegeTypeName,
        schemas.eip2612LikePermit,
        message
      );
      // console.log(signatureData);
      let signature = await eth_signTypedData(user, signatureData);

      let { r, s, v } = getSignatureParameters(signature);

      let eip2612LikePermits = [];
      let permit = {};
      permit.token = univ2.address;
      permit.owner = owner;
      permit.spender = spender;
      permit.value = value;
      permit.nonce = nonce;
      permit.deadline = deadline;
      permit.r = r;
      permit.s = s;
      permit.v = v;

      eip2612LikePermits.push(permit);

      const receipt = await bulkCheckout.permitAndDonate2(
        donations,
        eip2612LikePermits,
        {
          from: user,
        }
      );
      expect(fromWei(await univ2.balanceOf(user))).to.equal("60");
      expect(fromWei(await univ2.balanceOf(grant1))).to.equal("5");
      expect(fromWei(await univ2.balanceOf(grant2))).to.equal("10");
      expect(fromWei(await univ2.balanceOf(grant3))).to.equal("25");
      expectEvent(receipt, "DonationSent", {
        token: univ2.address,
        amount: toWei("5"),
        dest: grant1,
        donor: user,
      });
    });
    it("lets permit and doante DAILike tokens", async function () {
      const donations = [
        { token: dai.address, amount: toWei("5"), dest: grant1 },
        { token: dai.address, amount: toWei("10"), dest: grant2 },
        { token: dai.address, amount: toWei("25"), dest: grant3 },
      ];

      let holder = user;
      let spender = bulkCheckout.address;
      let nonce = (await dai.nonces(user)).toString();
      let expiry = (await time.latest()) + 60 * 60;
      let allowed = true;

      let message = {};
      message.holder = holder;
      message.spender = spender;
      message.nonce = nonce;
      message.expiry = expiry;
      message.allowed = true;

      let signatureData = generators.getRequestData(
        DaiLikeDomainData,
        messegeTypeName,
        schemas.daiLikePermit,
        message
      );
      // console.log(signatureData);
      let signature = await eth_signTypedData(user, signatureData);

      let { r, s, v } = getSignatureParameters(signature);

      let daiLikePermits = [];
      let permit = {};
      permit.token = dai.address;
      permit.holder = holder;
      permit.spender = spender;
      permit.nonce = nonce;
      permit.expiry = expiry;
      permit.allowed = allowed;
      permit.r = r;
      permit.s = s;
      permit.v = v;

      daiLikePermits.push(permit);

      const receipt = await bulkCheckout.permitAndDonate1(
        donations,
        daiLikePermits,
        {
          from: user,
        }
      );
      expect(fromWei(await dai.balanceOf(user))).to.equal("60");
      expect(fromWei(await dai.balanceOf(grant1))).to.equal("5");
      expect(fromWei(await dai.balanceOf(grant2))).to.equal("10");
      expect(fromWei(await dai.balanceOf(grant3))).to.equal("25");
      expectEvent(receipt, "DonationSent", {
        token: dai.address,
        amount: toWei("5"),
        dest: grant1,
        donor: user,
      });
    });
    permit.token = univ2.address;
    permit.owner = owner;
    permit.spender = spender;
    permit.value = value;
    permit.nonce = nonce;
    permit.deadline = deadline;
    permit.r = r;
    permit.s = s;
    permit.v = v;

    eip2612LikePermits.push(permit);

    //dai
    let holder = user;
    spender = bulkCheckout.address;
    nonce = (await dai.nonces(user)).toString();
    let expiry = (await time.latest()) + 60 * 60;
    let allowed = true;

    message = {};
    message.holder = holder;
    message.spender = spender;
    message.nonce = nonce;
    message.expiry = expiry;
    message.allowed = true;

    signatureData = generators.getRequestData(
      DaiLikeDomainData,
      messegeTypeName,
      schemas.daiLikePermit,
      message
    );
    // console.log(signatureData);
    signature = await eth_signTypedData(user, signatureData);
    // console.log(signature);

    let daiSig = getSignatureParameters(signature);

    let daiLikePermits = [];
    permit = {};
    permit.token = dai.address;
    permit.holder = holder;
    permit.spender = spender;
    permit.nonce = nonce;
    permit.expiry = expiry;
    permit.allowed = allowed;
    permit.r = daiSig.r;
    permit.s = daiSig.s;
    permit.v = daiSig.v;

    daiLikePermits.push(permit);
    await bulkCheckout.permitAndDonate3(
      donations,
      daiLikePermits,
      eip2612LikePermits,
      { from: user }
    );
    // await bulkCheckout.donate(donations, { from: user });
    expect(fromWei(await link.balanceOf(user))).to.equal("95");
    expect(fromWei(await dai.balanceOf(user))).to.equal("90");
    expect(fromWei(await univ2.balanceOf(user))).to.equal("75");
    expect(fromWei(await link.balanceOf(grant1))).to.equal("5");
    expect(fromWei(await dai.balanceOf(grant2))).to.equal("10");
    expect(fromWei(await univ2.balanceOf(grant3))).to.equal("25");
  });

  //TODO add tests for gasless transactions using the EIP2585 forwarder contract
});
