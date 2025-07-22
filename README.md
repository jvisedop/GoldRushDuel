# GoldRush Duel

## Overview
GoldRush Duel is a competitive Web3 PvP game where players stake PAXG (tokenized gold) to duel each other for on-chain rewards.
- Players join duels, play the Gold Rush minigame, and the winner takes 95% of the pot — the remaining 5% goes to the protocol treasury.
- The game logic runs on a dedicated Arbitrum Orbit chain, optimized for fast gameplay and low fees.
- All gameplay actions (duel creation, score submission, leaderboard updates) are recorded on the Orbit chain using high-performance Stylus smart contracts (Rust).
- Duel outcomes trigger settlement on Arbitrum One, where the actual token stakes are managed and payouts occur.

Gold Rush minigame mechanics:
- In the Gold Rush minigame, players control a mechanical claw that attempts to grab moving gold nuggets. Nuggets scroll across the screen from left to right, varying in speed and size.
- Players must time their claw drop precisely to catch nuggets as they pass by — the more nuggets you catch, the higher your score.
- The duel winner is determined by the highest score after both players have completed their turns.

This simple yet competitive mechanic forms the core of the PvP experience, combining skill-based gameplay with on-chain staking and rewards.

GoldRush Duel showcases a full-stack Web3 gaming architecture:
- Orbit Layer (L3) for scalable, low-cost game logic.
- Stylus Smart Contracts for efficient computation and gameplay state management.
- Arbitrum One (L2) for secure token escrow and payout settlements.

This project is a proof-of-concept for hybrid on-chain games that blend fast L3 gameplay with secure L2 financial interactions.

## Contracts
- `MockERC20.sol`: Simple ERC20 token for local testing, with minting functionality.
- `GoldRushDuel.sol`: Main game contract for creating/joining duels, submitting results, and payouts.

## Getting Started

### 1. Install Dependencies

```
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers @openzeppelin/contracts
cd frontend && npm install
```

### 2. Compile Contracts (Local Dev)

```
npx hardhat compile
```

### 3. Deploy Contracts (Local Dev)

Write a deploy script (e.g., `scripts/deploy.js`) to deploy `MockERC20` and `GoldRushDuel`.

### 4. Mint Test Tokens (Local Dev)

After deploying `MockERC20`, use the `mint` function to allocate tokens to test accounts.

### 5. Run Tests (Local Dev)

Write Hardhat tests to simulate duel creation, joining, and payout flows.

---

## Running on Arbitrum Sepolia Testnet

### 1. Deploy Contracts to Arbitrum Sepolia

```
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```
- Save the deployed contract addresses for `MockERC20` and `GoldRushDuel`.

### 2. Configure MetaMask
- Add the Arbitrum Sepolia network to MetaMask (if not present).
- Set the RPC URL to your Alchemy endpoint:
  - `https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- Switch your wallet to Arbitrum Sepolia.

### 3. Run the Frontend

```
npm start --prefix frontend
```
- The app will use the Alchemy RPC for all blockchain interactions.

### 4. Using the Dapp
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Connect your wallet.
- Enter the deployed contract addresses for `GoldRushDuel` and `MockERC20` in the UI fields.
- Approve tokens for the duel contract.
- Create or join a duel.
- When the duel is ready, play the Gold Rush game (claw minigame).
- After playing, submit yourself as the winner (MVP flow).
- Await payout.

### 5. Game Flow
- Players stake tokens and join a duel.
- When both players have joined, the Gold Rush game appears.
- Each player plays the game; the winner is submitted to the contract.
- The winner receives 95% of the pot, 5% goes to the treasury.

---

## Notes
- For local development, use the local Hardhat network and the mock token.
- For testnet, use the provided Alchemy RPC and deployed contract addresses.
- You can mint more test tokens using the Hardhat console if needed.
- The frontend is fully integrated with the game and duel logic.

---

## Next Steps
- Add variation of gold nugget size and speed in minigame
- Deploy the Orbit chain for GoldRush gameplay, using Arbitrum’s Orbit SDK or RaaS provider.
- Develop core game logic in Stylus (Rust) to handle duels, score tracking, and leaderboard updates on the Orbit chain.
- Integrate the Orbit chain with the Arbitrum One settlement layer, ensuring duel outcomes trigger token payouts securely.
- Build a cross-chain bridge logic (manual or relayer) to connect Orbit gameplay results with Arbitrum One settlements.
- Enhance the gameplay mechanics and anti-cheat features within Stylus contracts for verifiable on-chain actions.
- Expand the frontend to support both Orbit and Arbitrum One interactions seamlessly in the user experience.
- Test full end-to-end flow: staking on Arbitrum One → gameplay on Orbit → settlement on Arbitrum One.
- Deploy on public testnets (Orbit Testnet + Arbitrum Sepolia) for community feedback and stress testing.
- Explore Orbit analytics tools to monitor gameplay activity, fees, and user interactions.
- Consider ecosystem grants or hackathon submission to showcase the use of Orbit + Stylus in gaming + DeFi crossovers.
