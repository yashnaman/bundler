var Web3 = require('web3')
var Biconomy = require('@biconomy/mexa')
const { config } = require('./config')
let sigUtil = require('eth-sig-util')
var web3
var contract
var erc20Contract
var biconomy
var netowrkName
var donations = []

const domainType = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
]

const permitType = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
]
const domainTypeEIP2585 = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
]
const MetaTransactionType = [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'chainId', type: 'uint256' },
    { name: 'replayProtection', type: 'address' },
    { name: 'nonce', type: 'bytes' },
    { name: 'data', type: 'bytes' },
    { name: 'innerMessageHash', type: 'bytes32' },
]
const domainData = {
    name: 'Forwarder',
    version: '1',
}
let domainDataERC20 = {
    version: '1',
}

const forwarderEIP2585 = async function (_data) {
    var EIP712ForwarderContract = new web3.eth.Contract(
        config.contract.EIP712forwarderABI,
        config[netowrkName].forwarder
    )
    signer = ethereum.selectedAddress
    var from = signer
    var to = config[netowrkName].bundler
    var value = 0
    var chainId = await web3.eth.net.getId()
    var replayProtection = config[netowrkName].forwarder
    console.log(chainId)
    var batchId = 0
    var batchNonce = await EIP712ForwarderContract.methods
        .getNonce(signer, batchId)
        .call()
    var value1 = batchId * Math.pow(2, 128) + batchNonce
    var valueBn = new web3.utils.BN(value1)
    var nonce = await web3.eth.abi.encodeParameter('uint256', valueBn)
    // var decoded = await web3.eth.abi.decodeParameter("uint256", nonce);
    // console.log(decoded);
    var data = _data
    var innerMessageHash =
        '0x0000000000000000000000000000000000000000000000000000000000000000'
    var forwardMessage = {
        from: from,
        to: to,
        value: 0,
        chainId,
        replayProtection: replayProtection,
        nonce: nonce,
        data,
        innerMessageHash: innerMessageHash,
    }
    var signatureData = {
        types: {
            EIP712Domain: domainTypeEIP2585,
            MetaTransaction: MetaTransactionType,
        },
        domain: domainData,
        primaryType: 'MetaTransaction',
        message: forwardMessage,
    }
    console.log(signatureData)
    var sigString = JSON.stringify(signatureData)
    web3.providers.HttpProvider.prototype.sendAsync =
        web3.providers.HttpProvider.prototype.send

    web3.currentProvider.sendAsync(
        {
            method: 'eth_signTypedData_v4',
            params: [signer, sigString],
            from: signer,
        },
        function (err, result) {
            if (err) {
                return console.error(err)
            }

            var signatureType = {
                SignatureType: 0,
            }
            console.log(forwardMessage)
            // var signatureType = 2;
            const signature = result.result
            console.log(signature)

            let tx = EIP712ForwarderContract.methods
                .forward(forwardMessage, 0, signature)
                .send({ from: signer }, (err, res) => {
                    if (err) console.log(err)
                    else console.log(res)
                })

            tx.on('transactionHash', function (hash) {
                console.log(`Transaction hash is ${hash}`)
                var a = document.createElement('a')
                let tempString
                if (netowrkName == 'ropsten') {
                    tempString = 'https://ropsten.etherscan.io/tx/' + hash
                }
                if (netowrkName == 'matic') {
                    tempString =
                        'https://mumbai-explorer.matic.today/tx/' + hash
                }
                a.href = tempString
                a.title = tempString
                var link = document.createTextNode(tempString)
                a.appendChild(link)
                // document.body.prepend(a)
                // var br = document.createElement('br')
                // a.appendChild(br)
                alert(a)
            }).once('confirmation', function (confirmationNumber, receipt) {
                console.log(receipt)
            })
        }
    )
}

const connectWallet = async function () {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        // Ethereum user detected. You can now use the provider.
        const provider = window['ethereum']
        let accounts = await provider.enable()

        console.log(provider.networkVersion)
        var _chainId = provider.networkVersion

        //var chainId = parseInt(_chainId);
        domainDataERC20.chainId = _chainId
        console.log(_chainId)

        if (_chainId == 3) {
            netowrkName = 'ropsten'
        }
        if (_chainId == 80001) {
            netowrkName = 'matic'
        }

        web3 = new Web3(provider)
        if (netowrkName == 'ropsten') {
            biconomy = new Biconomy(window.ethereum, {
                apiKey: '_rMvkdN7f.3d929d4a-d558-4473-9f09-bfd2112696db',
                debug: 'true',
            })
            web3 = new Web3(biconomy)
            biconomy
                .onEvent(biconomy.READY, async () => {
                    console.log('hello')

                    //await justTrying();
                })
                .onEvent(biconomy.ERROR, (error, message) => {
                    console.log(error)
                })
        }
        if (netowrkName == 'matic') {
            biconomy = new Biconomy(window.ethereum, {
                apiKey: '43lNBVjhk.b269dd5c-2944-4bb2-b4a6-f1d5f42b95a1',
                debug: 'true',
            })
            web3 = new Web3(biconomy)
            biconomy
                .onEvent(biconomy.READY, async () => {
                    console.log('hello')
                    //await justTrying();
                })
                .onEvent(biconomy.ERROR, (error, message) => {
                    console.log(error)
                })
        }
        contract = new web3.eth.Contract(
            config.contract.bundlerABI,
            config[netowrkName].bundler
        )
        let dests = [
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000002',
            '0x0000000000000000000000000000000000000003',
            '0x0000000000000000000000000000000000000004',
            '0x0000000000000000000000000000000000000005',
            '0x0000000000000000000000000000000000000006',
            '0x0000000000000000000000000000000000000007',
            '0x0000000000000000000000000000000000000008',
            '0x0000000000000000000000000000000000000009',
            '0x000000000000000000000000000000000000000a',
        ]
        let tokens = [
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
            '0x259A559e034B162306296329aF99804886e20A68',
        ]
        let amounts = [
            web3.utils.toWei('10'),
            web3.utils.toWei('20'),
            web3.utils.toWei('30'),
            web3.utils.toWei('40'),
            web3.utils.toWei('50'),
            web3.utils.toWei('10'),
            web3.utils.toWei('20'),
            web3.utils.toWei('30'),
            web3.utils.toWei('40'),
            web3.utils.toWei('50'),
        ]

        for (let i = 0; i < dests.length; i++) {
            let donation = {}
            donation.token = tokens[i]
            donation.amount = amounts[i]
            donation.dest = dests[i]

            donations.push(donation)
        }
        // let data = contract.methods.donate(donations).encodeABI()
        // forwarderEIP2585(data)

        //console.log(await contract.methods.getQuote().call());
    } else {
        alert('Install meatamask first:  https://metamask.io/ ')
    }
}
const getSignatureParameters = (signature) => {
    if (!web3.utils.isHexStrict(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        )
    }
    var r = signature.slice(0, 66)
    var s = '0x'.concat(signature.slice(66, 130))
    var v = '0x'.concat(signature.slice(130, 132))
    v = web3.utils.hexToNumber(v)
    if (![27, 28].includes(v)) v += 27
    return {
        r: r,
        s: s,
        v: v,
    }
}
const sendPermitTransaction = async (
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s
) => {
    if (web3 && erc20Contract) {
        try {
            console.log('hi::::::::::')
            let gasLimit = await erc20Contract.methods
                .permit(owner, spender, value, deadline, v, r, s)
                .estimateGas({ from: owner })
            let gasPrice = await web3.eth.getGasPrice()
            console.log(gasLimit)
            console.log(gasPrice)
            let tx = erc20Contract.methods
                .permit(owner, spender, value, deadline, v, r, s)
                .send({
                    from: owner,
                    gasPrice: web3.utils.toHex(gasPrice),
                    gasLimit: web3.utils.toHex(gasLimit),
                })

            tx.on('transactionHash', function (hash) {
                console.log(`Transaction hash is ${hash}`)
            }).once('confirmation', function (confirmationNumber, receipt) {
                let elements = document.getElementsByClassName('loader')
                elements[0].style.display = 'none'
                console.log(receipt)
                alert('tokens unlocked')
            })
        } catch (error) {
            console.log(error)
        }
    }
}
const getNow = async function () {
    var latestBlock = await web3.eth.getBlock('latest')
    var now = latestBlock.timestamp
    return parseInt(now)
}
const permitAndDonate = async function () {
    // let value = web3.utils.toWei(_value)
    let value = web3.utils.toWei('100000000')
    erc20Contract = new web3.eth.Contract(
        config.contract.eip2612LikeERC20ABI,
        config[netowrkName].eip2612LikeERC20
    )
    console.log(config[netowrkName].eip2612LikeERC20)
    console.log(erc20Contract)
    let message = {}
    var userAddress = ethereum.selectedAddress
    var owner = userAddress
    var spender = config[netowrkName].bundler
    var now = await getNow()
    var deadline = now + 60 * 60
    var nonce = await erc20Contract.methods.nonces(userAddress).call()

    message.owner = userAddress
    message.spender = spender
    message.value = value
    message.nonce = parseInt(nonce)
    message.deadline = deadline

    domainDataERC20.name = 'Uniswap V2'
    domainDataERC20.verifyingContract = config[netowrkName].eip2612LikeERC20

    const dataToSign = {
        types: {
            EIP712Domain: domainType,
            Permit: permitType,
        },
        domain: domainDataERC20,
        primaryType: 'Permit',
        message: message,
    }
    const sigString = JSON.stringify(dataToSign)
    console.log(dataToSign)

    web3.currentProvider.send(
        {
            jsonrpc: '2.0',
            id: 999999999999,
            method: 'eth_signTypedData_v4',
            params: [userAddress, sigString],
        },
        function (error, response) {
            console.log(response)

            let { r, s, v } = getSignatureParameters(response.result)

            let eip2612LikePermits = []
            let permit = {}
            permit.token = config[netowrkName].eip2612LikeERC20
            permit.owner = owner
            permit.spender = spender
            permit.value = value
            permit.deadline = deadline
            permit.v = v
            permit.r = r
            permit.s = s

            eip2612LikePermits.push(permit)

            let data = contract.methods
                .permitAndDonate(donations, [permit])
                .encodeABI()
            // let data = contract.methods.donate(donations).encodeABI()
            forwarderEIP2585(data)

            // forwarderEIP2585(data)
            // sendPermitTransaction(owner, spender, value, deadline, v, r, s)
        }
    )
}

// init();

var moduleTry = {
    connectWallet,
    permitAndDonate,
}
module.exports = moduleTry
