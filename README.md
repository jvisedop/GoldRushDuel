# GoldRush Duel

## Overview
GoldRush Duel is a competitive web3 PvP game where players stake PAXG (mock ERC20 for local testing) in duels. The winner receives 95% of the pot, and 5% goes to the protocol treasury.

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
- Improve the duel flow to require both players to play and submit scores.
- Add more advanced game logic and anti-cheat features.
- Deploy to mainnet when ready. 