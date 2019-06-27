export default {
  description: [
    `Write a simple version of the Power ball rewarding contract. We mock the result of Power ball to bytes7(0) at first. We are going to replace the result by getting it from the Lottery community later.`,
    `Copy-paste QueryInterface to the top of your smart contract. This interface acts as the gateway to access curated data available on Band Protocol securely. Notice that its query function takes bytes and returns bytes32.`,
    `Instantiate a QueryInterface object with Lottery community contract address at 0x6863019Ec1A5f675ce64699020A338Ee2256B981. Power ball result can be obtained by query with key PWB/20190420. Note Power ball result consist of 7 number, so we represent it by using bytes7.`,
  ],
  h1: `Integrate Off-Chain lottery Data to Your Smart Contracts in Minutes!`,
  h2: `Looking for a simple, decentralized, and secured way for your Dapps to consume trusted lottery information? We got you covered!`,
  example: `Say you have a simple Power ball rewarding contract. Participant can pay 1 finney to submit his/her guess to the contract before 04/20/2019. Participant can claim reward (all ETH in the contract) if he/she has submitted the right guess. 👇👇👇`,
  contractName: 'PowerBallContract',
  dataFormat: {
    description: `The return value from community's contract always bytes32. For ... TODO`,
  },
  keyFormat: {
    crypto: {
      header: 'List of Available Pairs',
      description: 'TODO ......',
      keys: [['TODO', 'TODO', 'TODO']],
    },
  },
  solidity: [
    `
  pragma solidity 0.5.9;






  contract PowerBallContract {
    // keep the record of guesses submitted by each participant
    mapping (address => bytes7) public guesses;

    function guess(bytes7 _guess) public payable  {
        // sender should never submit his/her guess before
        require(guesses[msg.sender] == bytes7(0));
        // Anyone can particippate util 04/20/2019 @ 12:00am (UTC)
        require(now <= 1555718400);
        // sender should pay 1 finney to submit his/her guess
        require(msg.value == 1 finney);
        guesses[msg.sender] = _guess;
    }

    function claimReward() public payable {


        // Mock PowerBall result
        bytes7 result = bytes7(0);
        // sender should provide the right guess before getting reward (all ETH in this contract)
        require(result == guesses[msg.sender]);
        // give all ETH in this contract to the sender
        msg.sender.transfer(address(this).balance);
    }
  }
  `,
    `
  pragma solidity 0.5.9;

  interface QueryInterface {
  function query(bytes calldata input) external payable returns (bytes32);
  function queryPrice() external view returns (uint256);
  }

  contract PowerBallContract {
    // keep the record of guesses submitted by each participant
    mapping (address => bytes7) public guesses;

    function guess(bytes7 _guess) public payable  {
        // sender should never submit his/her guess before
        require(guesses[msg.sender] == bytes7(0));
        // Anyone can particippate util 04/20/2019 @ 12:00am (UTC)
        require(now <= 1555718400);
        // sender should pay 1 finney to submit his/her guess
        require(msg.value == 1 finney);
        guesses[msg.sender] = _guess;
    }

    function claimReward() public payable {


        // Mock PowerBall result
        bytes7 result = bytes7(0);
        // sender should provide the right guess before getting reward (all ETH in this contract)
        require(result == guesses[msg.sender]);
        // give all ETH in this contract to the sender
        msg.sender.transfer(address(this).balance);
    }
  }
  `,
    `
  pragma solidity 0.5.9;

  interface QueryInterface {
  function query(bytes calldata input) external payable returns (bytes32);
  function queryPrice() external view returns (uint256);
  }

  contract PowerBallContract {
    // keep the record of guesses submitted by each participant
    mapping (address => bytes7) public guesses;

    function guess(bytes7 _guess) public payable  {
        // sender should never submit his/her guess before
        require(guesses[msg.sender] == bytes7(0));
        // Anyone can particippate util 04/20/2019 @ 12:00am (UTC)
        require(now <= 1555718400);
        // sender should pay 1 finney to submit his/her guess
        require(msg.value == 1 finney);
        guesses[msg.sender] = _guess;
    }

    function claimReward() public payable {
        // Create a QueryInterface pointing to Lottery community contract
        QueryInterface q = QueryInterface(0x6863019Ec1A5f675ce64699020A338Ee2256B981);
        // Get PowerBall result from Lottery community
        bytes7 result = bytes7(q.query.value(q.queryPrice())("PWB/20190420"));
        // sender should provide the right guess before getting reward (all ETH in this contract)
        require(result == guesses[msg.sender]);
        // give all ETH in this contract to the sender
        msg.sender.transfer(address(this).balance);
    }
  }
  `,
  ],
}
