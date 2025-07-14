// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GoldRushDuel is ReentrancyGuard {
    IERC20 public immutable token;
    address public treasury;
    uint256 public duelCounter;
    uint256 public constant FEE_BPS = 500; // 5% fee (in basis points)
    uint256 public constant BPS_DENOMINATOR = 10000;

    enum DuelState { Open, Joined, Finished, Cancelled }

    struct Duel {
        address player1;
        address player2;
        uint256 stake;
        address winner;
        DuelState state;
    }

    mapping(uint256 => Duel) public duels;

    event DuelCreated(uint256 indexed duelId, address indexed player1, uint256 stake);
    event DuelJoined(uint256 indexed duelId, address indexed player2);
    event DuelFinished(uint256 indexed duelId, address indexed winner, uint256 payout, uint256 fee);
    event DuelCancelled(uint256 indexed duelId);

    constructor(address _token, address _treasury) {
        token = IERC20(_token);
        treasury = _treasury;
    }

    function createDuel(uint256 _stake) external nonReentrant returns (uint256) {
        require(_stake > 0, "Stake must be positive");
        duelCounter++;
        duels[duelCounter] = Duel({
            player1: msg.sender,
            player2: address(0),
            stake: _stake,
            winner: address(0),
            state: DuelState.Open
        });
        require(token.transferFrom(msg.sender, address(this), _stake), "Stake transfer failed");
        emit DuelCreated(duelCounter, msg.sender, _stake);
        return duelCounter;
    }

    function joinDuel(uint256 duelId) external nonReentrant {
        Duel storage duel = duels[duelId];
        require(duel.state == DuelState.Open, "Duel not open");
        require(duel.player1 != msg.sender, "Cannot join your own duel");
        duel.player2 = msg.sender;
        duel.state = DuelState.Joined;
        require(token.transferFrom(msg.sender, address(this), duel.stake), "Stake transfer failed");
        emit DuelJoined(duelId, msg.sender);
    }

    function submitWinner(uint256 duelId, address winner) external nonReentrant {
        Duel storage duel = duels[duelId];
        require(duel.state == DuelState.Joined, "Duel not in progress");
        require(msg.sender == duel.player1 || msg.sender == duel.player2, "Not a player");
        require(winner == duel.player1 || winner == duel.player2, "Invalid winner");
        duel.winner = winner;
        duel.state = DuelState.Finished;
        uint256 total = duel.stake * 2;
        uint256 fee = (total * FEE_BPS) / BPS_DENOMINATOR;
        uint256 payout = total - fee;
        require(token.transfer(winner, payout), "Payout failed");
        require(token.transfer(treasury, fee), "Fee transfer failed");
        emit DuelFinished(duelId, winner, payout, fee);
    }

    function cancelDuel(uint256 duelId) external nonReentrant {
        Duel storage duel = duels[duelId];
        require(duel.state == DuelState.Open, "Cannot cancel");
        require(msg.sender == duel.player1, "Only creator can cancel");
        duel.state = DuelState.Cancelled;
        require(token.transfer(duel.player1, duel.stake), "Refund failed");
        emit DuelCancelled(duelId);
    }

    function setTreasury(address _treasury) external {
        require(msg.sender == treasury, "Only treasury can update");
        treasury = _treasury;
    }
} 