pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

/**
 * @dev We use ABIEncoderV2 to enable encoding/decoding of the array of structs. The pragma
 * is required, but ABIEncoderV2 is no longer considered experimental as of Solidity 0.6.0
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./EIP2585/ForwarderReceiverBase.sol";

interface DaiLike {
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

interface EIP2612Like {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

contract BulkCheckout is
    Ownable,
    Pausable,
    ReentrancyGuard,
    ForwarderReceiverBase
{
    using Address for address payable;
    using SafeMath for uint256;
    /**
     * @notice Placeholder token address for ETH donations. This address is used in various other
     * projects as a stand-in for ETH
     */
    address constant ETH_TOKEN_PLACHOLDER = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
     * @notice Required parameters for each donation
     */
    struct Donation {
        address token; // address of the token to donate
        uint256 amount; // amount of tokens to donate
        address payable dest; // grant address
    }
    /**
     *@notice required parameters for each permit(There can be multiple contracts
     * which has the dai like permit function)
     */
    struct DaiLikePermit {
        address token;
        address holder;
        address spender;
        uint256 nonce;
        uint256 expiry;
        bool allowed;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct EIP2612LikePermit {
        address token;
        address owner;
        address spender;
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /**
     * @dev Emitted on each donation
     */
    event DonationSent(
        address indexed token,
        uint256 indexed amount,
        address dest,
        address indexed donor
    );

    /**
     * @dev Emitted when a token or ETH is withdrawn from the contract
     */
    event TokenWithdrawn(
        address indexed token,
        uint256 indexed amount,
        address indexed dest
    );

    constructor(address _forwarder) public ForwarderReceiverBase(_forwarder) {}

    function _donate(Donation[] memory _donations) internal {
        // We track total ETH donations to ensure msg.value is exactly correct
        uint256 _ethDonationTotal = 0;

        for (uint256 i = 0; i < _donations.length; i++) {
            emit DonationSent(
                _donations[i].token,
                _donations[i].amount,
                _donations[i].dest,
                _getTxSigner()
            );
            if (_donations[i].token != ETH_TOKEN_PLACHOLDER) {
                // Token donation
                // This method throws on failure, so there is no return value to check
                SafeERC20.safeTransferFrom(
                    IERC20(_donations[i].token),
                    _getTxSigner(),
                    _donations[i].dest,
                    _donations[i].amount
                );
            } else {
                // ETH donation
                // See comments in Address.sol for why we use sendValue over transer
                _donations[i].dest.sendValue(_donations[i].amount);
                _ethDonationTotal = _ethDonationTotal.add(_donations[i].amount);
            }
        }

        // Revert if the wrong amount of ETH was sent
        require(
            msg.value == _ethDonationTotal,
            "BulkCheckout: Too much ETH sent"
        );
    }

    /**
     * @notice Bulk gitcoin grant donations
     * @dev We assume all token approvals were already executed
     * @param _donations Array of donation structs
     */
    function donate(Donation[] calldata _donations)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        _donate(_donations);
    }

    function _daiLikePermit(DaiLikePermit[] memory _daiLikePermits) internal {
        for (uint256 i = 0; i < _daiLikePermits.length; i++) {
            DaiLike(_daiLikePermits[i].token).permit(
                _daiLikePermits[i].holder,
                _daiLikePermits[i].spender,
                _daiLikePermits[i].nonce,
                _daiLikePermits[i].expiry,
                _daiLikePermits[i].allowed,
                _daiLikePermits[i].v,
                _daiLikePermits[i].r,
                _daiLikePermits[i].s
            );
        }
    }

    function _EIP2585LikePermit(EIP2612LikePermit[] memory _EIP2612LikePermits)
        internal
    {
        for (uint256 i = 0; i < _EIP2612LikePermits.length; i++) {
            EIP2612Like(_EIP2612LikePermits[i].token).permit(
                _EIP2612LikePermits[i].owner,
                _EIP2612LikePermits[i].spender,
                _EIP2612LikePermits[i].value,
                _EIP2612LikePermits[i].deadline,
                _EIP2612LikePermits[i].v,
                _EIP2612LikePermits[i].r,
                _EIP2612LikePermits[i].s
            );
        }
    }

    /**
     * @notice Bulk gitcoin grant donations but with the permit parameters of tokens that has dailike permit function(i.e. DAI or CHAI)
     * @dev We assume all token approvals were already executed
     * @param _donations Array of donation structs
     *@param _daiLikePermits Array of permits
     */
    function permitAndDonate1(
        Donation[] calldata _donations,
        DaiLikePermit[] calldata _daiLikePermits
    ) external payable nonReentrant whenNotPaused {
        _daiLikePermit(_daiLikePermits);
        _donate(_donations);
    }

    /**
     * @notice Bulk gitcoin grant donations but with the permit parameters of tokens that has EIP2612LikePermits permit function(i.e. Uniswap LP)
     * @dev We assume all token approvals were already executed
     * @param _donations Array of donation structs
     *@param  _EIP2612LikePermits Array of permits
     */
    function permitAndDonate2(
        Donation[] calldata _donations,
        EIP2612LikePermit[] calldata _EIP2612LikePermits
    ) external payable nonReentrant whenNotPaused {
        _EIP2585LikePermit(_EIP2612LikePermits);
        _donate(_donations);
    }

    function permitAndDonate3(
        Donation[] calldata _donations,
        DaiLikePermit[] calldata _daiLikePermits,
        EIP2612LikePermit[] calldata _EIP2612LikePermits
    ) external payable nonReentrant whenNotPaused {
        _daiLikePermit(_daiLikePermits);
        _EIP2585LikePermit(_EIP2612LikePermits);
        _donate(_donations);
    }

    /**
     * @notice Transfers all tokens of the input adress to the recipient. This is
     * useful tokens are accidentally sent to this contrasct
     * @param _tokenAddress address of token to send
     * @param _dest destination address to send tokens to
     */
    function withdrawToken(address _tokenAddress, address _dest)
        external
        onlyOwner
    {
        uint256 _balance = IERC20(_tokenAddress).balanceOf(address(this));
        emit TokenWithdrawn(_tokenAddress, _balance, _dest);
        SafeERC20.safeTransfer(IERC20(_tokenAddress), _dest, _balance);
    }

    /**
     * @notice Transfers all Ether to the specified address
     * @param _dest destination address to send ETH to
     */
    function withdrawEther(address payable _dest) external onlyOwner {
        uint256 _balance = address(this).balance;
        emit TokenWithdrawn(ETH_TOKEN_PLACHOLDER, _balance, _dest);
        _dest.sendValue(_balance);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner whenPaused {
        _unpause();
    }
}
