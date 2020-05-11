pragma solidity ^0.5.16;

import "github.com/oraclize/ethereum-api/provableAPI.sol";

contract ControlToken is usingProvable{
  string public name = "ControlToken";
  string public symbol = "CONT";
  string public standard = "Control Token v1.0";
  uint256 public totalSupply;
  // Latest store (to buy things with the token in)
  address public latest;
  // Owner address of the contract
  address public owner;
  // Mapping we're on today to track who already got tokens for the day
  uint256 public today;

  event Transfer(
    address indexed _from,
    address indexed _to,
    uint256 _value
    );

  event Approval(
    address indexed _owner,
    address indexed _spender,
    uint256 _value
    );

  // Event thrown when a user pays for an unlock on their desktop
  event Unlock(
    address indexed _from,
    uint256 _value,
    string _otp
    );

  // Event thrown when new tokens are minted (each day)
  event Mint(
    address indexed _receiver,
    uint256 _value
    );



  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;
  // Who has received their tokens for the day
  mapping(uint256 => mapping(address => bool)) private received;

  constructor() public {
    latest = 0x0000000000000000000000000000000000000000;
    owner = msg.sender;
    // No limit of supply
    totalSupply = 0;
    today = 0;
    startTimer();
  }

  /* Boilerplate ERC20 (transfer, approve, transferFrom) */

  function transfer(address _to, uint256 _value) public returns (bool success){
    require(balanceOf[msg.sender] >= _value,
      "Tokens transferred must be less or equal to account balance");
    balanceOf[msg.sender] -= _value;
    balanceOf[_to] += _value;
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  function approve(address _spender, uint256 _value) public returns (bool success){
    allowance[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value)
  public returns (bool success){
    require(balanceOf[_from] >= _value,
       "Tokens transferred must be less or equal to account balance");
    require(allowance[_from][msg.sender] >= _value,
       "Tokens transferred must be less or equal to allowance");

    balanceOf[_from] -= _value;
    balanceOf[_to] += _value;

    allowance[_from][msg.sender] -= _value;

    emit Transfer(_from, _to, _value);

    return true;

  }

    // Update the address of store
    function update (address _newVersion) public{
      require(msg.sender == owner, "Relay can only be updated by contract owner");
      latest = _newVersion;
    }

    // Buy hours off the smart contract
    function buyHours(uint256 _value, string memory _otp) public returns (bool success){
      require(balanceOf[msg.sender] >= _value,
        "Tokens transferred must be less or equal to account balance");

      // Owner gets tokens to be burned later
      balanceOf[msg.sender] -= _value;
      balanceOf[owner] += _value;

      emit Unlock(msg.sender, _value, _otp);
      return true;
    }

    // Get today's tokens, 200 tokens per day per user
    function getTokens() public returns (bool success){
      require(!received[today][msg.sender],
         "You can only get tokens once per day");
      balanceOf[msg.sender] += 200;
      received[today][msg.sender] = true;
      emit Mint(msg.sender,200);
      return true;
    }

    function startTimer() internal{
        provable_query(1*day, "URL", "");
    }

    function __callback(bytes32 myid, string memory result) public {
        require(msg.sender == provable_cbAddress(), "This function is only meant to be used as a callback from a one day query to reset the daily tokens");
        today++;
        startTimer();
    }

}
