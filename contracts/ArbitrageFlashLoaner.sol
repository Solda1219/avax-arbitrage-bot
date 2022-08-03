//SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
contract ArbitrageFlashLoaner {
    using SafeMath for uint;
    address public owner;
    IUniswapV2Router02 public toRouter;
    IUniswapV2Router02 public fromRouter;
    constructor(        
    ) public {
        owner=msg.sender;
    }


    function flashCall(
        uint256 _amount0,
        uint256 _amount1,
        bytes memory _data /**+-Makes sure that this is not empty so it will Trigger the FlashLoan.(IGNORE THIS).*/
    ) internal {
        address addr_from;
        address addr_to;
        assembly {
              addr_from := mload(add(_data, 20))
              addr_to := mload(add(_data, 40))
        }       
        address[] memory path = new address[](2);
        address[] memory path_recursive = new address[](2);
        uint256[] memory amountRequired = new uint256[](2);
        uint256 amountToken = _amount0 == 0 ? _amount1 : _amount0;

        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();

        require(_amount0 == 0 || _amount1 == 0, "one should be zero");

        path[0] = _amount0 == 0 ? token1 : token0;
        path[1] = _amount0 == 0 ? token0 : token1;
        path_recursive[0]=path[1];
        path_recursive[1]=path[0];
        IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);

        toRouter=IUniswapV2Router02(address(addr_to));
        fromRouter=IUniswapV2Router02(address(addr_from));
        token.approve(address(addr_to), amountToken);


        amountRequired = fromRouter.getAmountsIn(amountToken, path_recursive);
        uint256 amountReceived =
            toRouter.swapExactTokensForTokens(
                amountToken, /**+-Ammount of Tokens we are going to Sell.*/
                amountRequired[0], /**+-Minimum Ammount of Tokens that we expect to receive in exchange for our Tokens.*/
                path, /**+-We tell Dex what Token to Sell and what Token to Buy.*/
                address(this), /**+-Address of this S.C. where the Output Tokens are going to be received.*/
                block.timestamp+1 days /**+-Time Limit after which an order will be rejected by Dex(It is mainly useful if you send an Order directly from your wallet).*/
            )[1];
        IERC20 otherToken = IERC20(_amount0 == 0 ? token0 : token1);
        otherToken.transfer(msg.sender, amountRequired[0]);
        otherToken.transfer(
            owner, 
            amountReceived - amountRequired[0]
        );
    }

    function pangolinCall(
        address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data /**+-Makes sure that this is not empty so it will Trigger the FlashLoan.(IGNORE THIS).*/
    ) external {
        flashCall(_amount0, _amount1, _data);
    }
    function joeCall(
         address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data /**+-Makes sure that this is not empty so it will Trigger the FlashLoan.(IGNORE THIS).*/
    ) external {
        flashCall(_amount0, _amount1, _data);
    }
    function uniswapV2Call(
         address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data /**+-Makes sure that this is not empty so it will Trigger the FlashLoan.(IGNORE THIS).*/
    ) external {
        
        flashCall(_amount0, _amount1, _data);
    }
    function dmmSwapCall(
         address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data /**+-Makes sure that this is not empty so it will Trigger the FlashLoan.(IGNORE THIS).*/
    ) external {
        flashCall(_amount0, _amount1, _data);
    }
    function lydiaCall(
         address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data /**+-Makes sure that this is not empty so it will Trigger the FlashLoan.(IGNORE THIS).*/
    ) external {
        flashCall(_amount0, _amount1, _data);
    }
}
