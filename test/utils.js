//This structre of testing is adopted from https://github.com/AudiusProject/audius-protocol/tree/master/contracts/test

const schemas = {};
//This can be different for some contracts but mostly its the same
/* contract signing domain */
schemas.domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];
//Example: Uniswap v2 tokens
schemas.eip2612LikePermit = [
  { name: "owner", type: "address" },
  { name: "spender", type: "address" },
  { name: "value", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
];
//Example : DAI and CHAI
schemas.daiLikePermit = [
  { name: "holder", type: "address" },
  { name: "spender", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "expiry", type: "uint256" },
  { name: "allowed", type: "bool" },
];

const generators = {};

generators.getRequestData = function (
  domainData,
  messageTypeName,
  messageSchema,
  message
) {
  const types = {
    EIP712Domain: schemas.domain,
  };
  types[messageTypeName] = messageSchema;
  return {
    types: types,
    domain: domainData,
    primaryType: messageTypeName,
    message: message,
  };
};

generators.getDomainData = function (
  contractName,
  signatureVersion,
  chainId,
  contractAddress
) {
  return {
    name: contractName,
    version: signatureVersion,
    chainId: chainId,
    verifyingContract: contractAddress,
  };
};

const eth_signTypedData = (userAddress, signatureData) => {
  return new Promise(function (resolve, reject) {
    // fix per https://github.com/ethereum/web3.js/issues/1119
    // truffle uses an outdated version of web3
    web3.providers.HttpProvider.prototype.sendAsync =
      web3.providers.HttpProvider.prototype.send;
    web3.currentProvider.sendAsync(
      {
        method: "eth_signTypedData",
        params: [userAddress, signatureData],
        from: userAddress,
      },
      function (err, result) {
        if (err) {
          reject(err);
        } else if (result.error) {
          reject(result.error);
        } else {
          resolve(result.result);
        }
      }
    );
  });
};
const getSignatureParameters = (signature) => {
  if (!web3.utils.isHexStrict(signature)) {
    throw new Error(
      'Given value "'.concat(signature, '" is not a valid hex string.')
    );
  }
  var r = signature.slice(0, 66);
  var s = "0x".concat(signature.slice(66, 130));
  var v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;
  return {
    r: r,
    s: s,
    v: v,
  };
};

module.exports = {
  schemas,
  generators,
  eth_signTypedData,
  getSignatureParameters,
};
