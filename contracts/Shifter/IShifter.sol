pragma solidity ^0.5.8;

interface IShifter {
    function shiftIn(bytes32 _pHash, uint256 _amount, bytes32 _nHash, bytes calldata _sig) external returns (uint256);
    function shiftOut(bytes calldata _to, uint256 _amount) external returns (uint256);
}