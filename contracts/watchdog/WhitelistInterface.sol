
contract WhitelistInterface {
  function is_white_listed(address _to, uint _value, bytes _data) returns (bool);
}