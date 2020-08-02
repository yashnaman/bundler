let config = {}

config.ropsten = {
    daiLikeERC20: '0x17B953bBB15FDBcE26320da867996a4561bBC13b',
    eip2612LikeERC20: '0x259A559e034B162306296329aF99804886e20A68',
    forwarder: '0x4168ae58d74c1c7a8919315c3283013c434e1d9b',
    bundler: '0x17B953bBB15FDBcE26320da867996a4561bBC13b',
}
config.matic = {
    daiLikeERC20: '0x702e5c714AeCf0C45A680BD2821c281891646D48',
    eip2612LikeERC20: '0x65aceDc587d3cA86b2b43db79C1E8a7527b0555a',
    forwarder: '0x641d567874afD77B9318bDDb7Ea666416D41B96f',
    bundler: '0x4E52dEb55357d547140713b687E25a0D9803e37c',
}

config.contract = {
    EIP712forwarderABI: [
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: '_chainId',
                    type: 'uint256',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'constructor',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'from',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'chainId',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address',
                            name: 'replayProtection',
                            type: 'address',
                        },
                        {
                            internalType: 'bytes',
                            name: 'nonce',
                            type: 'bytes',
                        },
                        {
                            internalType: 'bytes',
                            name: 'data',
                            type: 'bytes',
                        },
                        {
                            internalType: 'bytes32',
                            name: 'innerMessageHash',
                            type: 'bytes32',
                        },
                    ],
                    internalType: 'struct Forwarder.Message',
                    name: 'message',
                    type: 'tuple',
                },
                {
                    internalType: 'enum Forwarder.SignatureType',
                    name: 'signatureType',
                    type: 'uint8',
                },
                {
                    internalType: 'bytes',
                    name: 'signature',
                    type: 'bytes',
                },
            ],
            name: 'forward',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
            payable: true,
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'to',
                            type: 'address',
                        },
                        {
                            internalType: 'bytes',
                            name: 'data',
                            type: 'bytes',
                        },
                        {
                            internalType: 'uint256',
                            name: 'value',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct EIP712Forwarder.Call[]',
                    name: 'calls',
                    type: 'tuple[]',
                },
            ],
            name: 'batch',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
            payable: true,
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'signer',
                    type: 'address',
                },
                {
                    internalType: 'bytes',
                    name: 'nonce',
                    type: 'bytes',
                },
            ],
            name: 'checkAndUpdateNonce',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'signer',
                    type: 'address',
                },
                {
                    internalType: 'uint128',
                    name: 'batchId',
                    type: 'uint128',
                },
            ],
            name: 'getNonce',
            outputs: [
                {
                    internalType: 'uint128',
                    name: '',
                    type: 'uint128',
                },
            ],
            stateMutability: 'view',
            type: 'function',
            constant: true,
        },
    ],
    bundlerABI: [
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '_forwarder',
                    type: 'address',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'constructor',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'dest',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'donor',
                    type: 'address',
                },
            ],
            name: 'DonationSent',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'previousOwner',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'newOwner',
                    type: 'address',
                },
            ],
            name: 'OwnershipTransferred',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'account',
                    type: 'address',
                },
            ],
            name: 'Paused',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'token',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'dest',
                    type: 'address',
                },
            ],
            name: 'TokenWithdrawn',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'account',
                    type: 'address',
                },
            ],
            name: 'Unpaused',
            type: 'event',
        },
        {
            inputs: [],
            name: 'owner',
            outputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
            ],
            stateMutability: 'view',
            type: 'function',
            constant: true,
        },
        {
            inputs: [],
            name: 'paused',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'view',
            type: 'function',
            constant: true,
        },
        {
            inputs: [],
            name: 'renounceOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'newOwner',
                    type: 'address',
                },
            ],
            name: 'transferOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address payable',
                            name: 'dest',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct BulkCheckout.Donation[]',
                    name: '_donations',
                    type: 'tuple[]',
                },
            ],
            name: 'donate',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
            payable: true,
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address payable',
                            name: 'dest',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct BulkCheckout.Donation[]',
                    name: '_donations',
                    type: 'tuple[]',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'holder',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'expiry',
                            type: 'uint256',
                        },
                        {
                            internalType: 'bool',
                            name: 'allowed',
                            type: 'bool',
                        },
                        {
                            internalType: 'uint8',
                            name: 'v',
                            type: 'uint8',
                        },
                        {
                            internalType: 'bytes32',
                            name: 'r',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'bytes32',
                            name: 's',
                            type: 'bytes32',
                        },
                    ],
                    internalType: 'struct BulkCheckout.DaiLikePermit[]',
                    name: '_daiLikePermits',
                    type: 'tuple[]',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'owner',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'value',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'deadline',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint8',
                            name: 'v',
                            type: 'uint8',
                        },
                        {
                            internalType: 'bytes32',
                            name: 'r',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'bytes32',
                            name: 's',
                            type: 'bytes32',
                        },
                    ],
                    internalType: 'struct BulkCheckout.EIP2612LikePermit[]',
                    name: '_EIP2612LikePermits',
                    type: 'tuple[]',
                },
            ],
            name: 'permitAndDonate',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
            payable: true,
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address payable',
                            name: 'dest',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct BulkCheckout.Donation[]',
                    name: '_donations',
                    type: 'tuple[]',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'holder',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'nonce',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'expiry',
                            type: 'uint256',
                        },
                        {
                            internalType: 'bool',
                            name: 'allowed',
                            type: 'bool',
                        },
                        {
                            internalType: 'uint8',
                            name: 'v',
                            type: 'uint8',
                        },
                        {
                            internalType: 'bytes32',
                            name: 'r',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'bytes32',
                            name: 's',
                            type: 'bytes32',
                        },
                    ],
                    internalType: 'struct BulkCheckout.DaiLikePermit[]',
                    name: '_daiLikePermits',
                    type: 'tuple[]',
                },
            ],
            name: 'permitAndDonate',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
            payable: true,
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address payable',
                            name: 'dest',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct BulkCheckout.Donation[]',
                    name: '_donations',
                    type: 'tuple[]',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'owner',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'spender',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'value',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'deadline',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint8',
                            name: 'v',
                            type: 'uint8',
                        },
                        {
                            internalType: 'bytes32',
                            name: 'r',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'bytes32',
                            name: 's',
                            type: 'bytes32',
                        },
                    ],
                    internalType: 'struct BulkCheckout.EIP2612LikePermit[]',
                    name: '_EIP2612LikePermits',
                    type: 'tuple[]',
                },
            ],
            name: 'permitAndDonate',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
            payable: true,
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '_tokenAddress',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: '_dest',
                    type: 'address',
                },
            ],
            name: 'withdrawToken',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address payable',
                    name: '_dest',
                    type: 'address',
                },
            ],
            name: 'withdrawEther',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'pause',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'unpause',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ],
    eip2612LikeERC20ABI: [
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'chainId',
                    type: 'uint256',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'constructor',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
            ],
            name: 'Approval',
            type: 'event',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
            ],
            name: 'approve',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
            ],
            name: 'mint',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'owner',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: 'spender',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
                {
                    internalType: 'uint256',
                    name: 'deadline',
                    type: 'uint256',
                },
                {
                    internalType: 'uint8',
                    name: 'v',
                    type: 'uint8',
                },
                {
                    internalType: 'bytes32',
                    name: 'r',
                    type: 'bytes32',
                },
                {
                    internalType: 'bytes32',
                    name: 's',
                    type: 'bytes32',
                },
            ],
            name: 'permit',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
            ],
            name: 'transfer',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
            ],
            name: 'Transfer',
            type: 'event',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                },
                {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256',
                },
            ],
            name: 'transferFrom',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
            ],
            name: 'allowance',
            outputs: [
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
            ],
            name: 'balanceOf',
            outputs: [
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'decimals',
            outputs: [
                {
                    internalType: 'uint8',
                    name: '',
                    type: 'uint8',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'DOMAIN_SEPARATOR',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: '',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'name',
            outputs: [
                {
                    internalType: 'string',
                    name: '',
                    type: 'string',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                },
            ],
            name: 'nonces',
            outputs: [
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'PERMIT_TYPEHASH',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: '',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'symbol',
            outputs: [
                {
                    internalType: 'string',
                    name: '',
                    type: 'string',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'totalSupply',
            outputs: [
                {
                    internalType: 'uint256',
                    name: '',
                    type: 'uint256',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
    ],
}

module.exports = { config }
