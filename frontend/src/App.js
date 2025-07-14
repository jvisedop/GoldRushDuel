import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import GoldRushGame from "./GoldRushGame";
import './App.css';

// GoldRushDuel ABI (MVP functions + duel getter)
const DUEL_ABI = [
  "function createDuel(uint256 _stake) public returns (uint256)",
  "function joinDuel(uint256 duelId) public",
  "function submitWinner(uint256 duelId, address winner) public",
  "function duels(uint256) public view returns (address player1, address player2, uint256 stake, address winner, uint8 state)",
  "function duelCounter() public view returns (uint256)"
];
// ERC20 ABI (balanceOf, approve, allowance)
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Arbitrum Sepolia network configuration
const ARBITRUM_SEPOLIA = {
  chainId: "0x66eee", // 421614 in hex
  chainName: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://arb-sepolia.g.alchemy.com/v2/Pvj8SFYciqesO2AvHZC5f"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
};

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [duelAddress, setDuelAddress] = useState("");
  const [duelContract, setDuelContract] = useState(null);
  const [txStatus, setTxStatus] = useState("");
  const [network, setNetwork] = useState(null);
  // Token
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [allowance, setAllowance] = useState("");
  // Create duel
  const [stake, setStake] = useState("");
  // Join duel
  const [joinId, setJoinId] = useState("");
  // Submit winner
  const [winnerId, setWinnerId] = useState("");
  const [winnerAddr, setWinnerAddr] = useState("");
  // Duels
  const [duels, setDuels] = useState([]);
  const [loadingDuels, setLoadingDuels] = useState(false);

  // Integration state
  const [duelPhase, setDuelPhase] = useState("lobby"); // lobby, waiting, playing, finished
  const [activeDuelId, setActiveDuelId] = useState(null);
  const [playerScore, setPlayerScore] = useState(null);
  const [winnerSubmitted, setWinnerSubmitted] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const ethProvider = new BrowserProvider(window.ethereum);
      setProvider(ethProvider);
    }
  }, []);

  useEffect(() => {
    if (signer && duelAddress) {
      setDuelContract(new Contract(duelAddress, DUEL_ABI, signer));
    } else {
      setDuelContract(null);
    }
  }, [signer, duelAddress]);

  useEffect(() => {
    if (signer && tokenAddress) {
      setTokenContract(new Contract(tokenAddress, ERC20_ABI, signer));
    } else {
      setTokenContract(null);
    }
  }, [signer, tokenAddress]);

  // Fetch token balance and allowance
  useEffect(() => {
    const fetchBalanceAndAllowance = async () => {
      if (tokenContract && address && duelAddress) {
        try {
          const bal = await tokenContract.balanceOf(address);
          setTokenBalance(formatEther(bal));
          const allow = await tokenContract.allowance(address, duelAddress);
          setAllowance(formatEther(allow));
        } catch (e) {
          setTokenBalance("");
          setAllowance("");
        }
      } else {
        setTokenBalance("");
        setAllowance("");
      }
    };
    fetchBalanceAndAllowance();
  }, [tokenContract, address, duelAddress, txStatus]);

  // Fetch duels
  useEffect(() => {
    const fetchDuels = async () => {
      if (!duelContract) return;
      setLoadingDuels(true);
      try {
        const count = await duelContract.duelCounter();
        const duelsArr = [];
        for (let i = 1; i <= count; i++) {
          const d = await duelContract.duels(i);
          duelsArr.push({
            duelId: i,
            player1: d.player1,
            player2: d.player2,
            stake: formatEther(d.stake),
            winner: d.winner,
            state: d.state
          });
        }
        setDuels(duelsArr);
      } catch (e) {
        setDuels([]);
      }
      setLoadingDuels(false);
    };
    fetchDuels();
  }, [duelContract, txStatus]);

  // When duel is ready (both players joined), allow playing
  useEffect(() => {
    if (!activeDuelId || !duelContract) return;
    const checkDuelState = async () => {
      try {
        const d = await duelContract.duels(activeDuelId);
        if (d.player1 && d.player2 && d.state === 1) {
          setDuelPhase("playing");
        } else if (d.state === 2) {
          setDuelPhase("finished");
        }
      } catch {}
    };
    checkDuelState();
  }, [activeDuelId, duelContract, txStatus]);

  const switchToArbitrumSepolia = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ARBITRUM_SEPOLIA],
          });
        } catch (addError) {
          console.error('Error adding Arbitrum Sepolia:', addError);
        }
      }
    }
  };

  const connectWallet = async () => {
    if (!provider) return;
    
    try {
      // First switch to Arbitrum Sepolia
      await switchToArbitrumSepolia();
      
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setSigner(signer);
      setAddress(await signer.getAddress());
      
      // Get current network
      const network = await provider.getNetwork();
      setNetwork(network);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setTxStatus("Error connecting wallet: " + error.message);
    }
  };

  const disconnectWallet = () => {
    setSigner(null);
    setAddress("");
    setDuelContract(null);
    setTokenContract(null);
    setTokenBalance("");
    setAllowance("");
    setNetwork(null);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!tokenContract || !duelAddress || !approveAmount) return;
    setTxStatus("Approving token...");
    try {
      const tx = await tokenContract.approve(duelAddress, parseEther(approveAmount));
      await tx.wait();
      setTxStatus("Token approved!");
    } catch (err) {
      setTxStatus("Error: " + (err.reason || err.message));
    }
  };

  const handleCreateDuel = async (e) => {
    e.preventDefault();
    if (!duelContract || !stake) return;
    setTxStatus("Creating duel...");
    try {
      const tx = await duelContract.createDuel(parseEther(stake));
      const receipt = await tx.wait();
      setTxStatus("Duel created!");
      setDuelPhase("waiting");
      // Find the new duel id (assume it's the latest)
      const count = await duelContract.duelCounter();
      setActiveDuelId(Number(count));
    } catch (err) {
      setTxStatus("Error: " + (err.reason || err.message));
    }
  };

  const handleJoinDuel = async (e) => {
    e.preventDefault();
    if (!duelContract || !joinId) return;
    setTxStatus("Joining duel...");
    try {
      const tx = await duelContract.joinDuel(joinId);
      await tx.wait();
      setTxStatus("Joined duel!");
      setDuelPhase("playing");
      setActiveDuelId(Number(joinId));
    } catch (err) {
      setTxStatus("Error: " + (err.reason || err.message));
    }
  };

  // Handle game end
  const handleGameEnd = (score) => {
    setPlayerScore(score);
    setDuelPhase("finished"); // For MVP, finish after one play
  };

  // Submit winner (for MVP, always submit self)
  const handleSubmitWinner = async () => {
    if (!duelContract || !activeDuelId || !address) return;
    setTxStatus("Submitting winner...");
    try {
      const tx = await duelContract.submitWinner(activeDuelId, address);
      await tx.wait();
      setTxStatus("Winner submitted!");
      setWinnerSubmitted(true);
    } catch (err) {
      setTxStatus("Error: " + (err.reason || err.message));
    }
  };

  // UI rendering
  return (
    <div className="App" style={{ padding: 32, maxWidth: 520, margin: '0 auto' }}>
      <h1>GoldRush Duel</h1>
      {/* Wallet connect */}
      {!address ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <p>Connected: {address}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </>
      )}
      <hr />
      {/* Token approval */}
      <div style={{ marginBottom: 16 }}>
        <label>GoldRushDuel Contract Address:<br />
          <input
            type="text"
            value={duelAddress}
            onChange={e => setDuelAddress(e.target.value)}
            style={{ width: '100%' }}
            placeholder="0x..."
          />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Mock Token Address:<br />
          <input
            type="text"
            value={tokenAddress}
            onChange={e => setTokenAddress(e.target.value)}
            style={{ width: '100%' }}
            placeholder="0x..."
          />
        </label>
        {tokenBalance && <div>Token Balance: {tokenBalance}</div>}
        {allowance && duelAddress && <div>Allowance for Duel Contract: {allowance}</div>}
        <form onSubmit={handleApprove} style={{ marginTop: 8 }}>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Approve amount"
            value={approveAmount}
            onChange={e => setApproveAmount(e.target.value)}
            style={{ width: '70%' }}
          />
          <button type="submit" style={{ width: '28%', marginLeft: '2%' }}>Approve</button>
        </form>
      </div>
      {/* Duel lobby and game logic */}
      {duelPhase === "lobby" && (
        <>
          <form onSubmit={handleCreateDuel} style={{ marginBottom: 16 }}>
            <h3>Create Duel</h3>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Stake (e.g. 0.1)"
              value={stake}
              onChange={e => setStake(e.target.value)}
              style={{ width: '100%' }}
            />
            <button type="submit" style={{ width: '100%', marginTop: 8 }}>Create Duel</button>
          </form>
          <form onSubmit={handleJoinDuel} style={{ marginBottom: 16 }}>
            <h3>Join Duel</h3>
            <input
              type="number"
              min="1"
              placeholder="Duel ID"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              style={{ width: '100%' }}
            />
            <button type="submit" style={{ width: '100%', marginTop: 8 }}>Join Duel</button>
          </form>
        </>
      )}
      {duelPhase === "waiting" && (
        <div style={{ margin: 24 }}>
          <h3>Waiting for another player to join duel #{activeDuelId}...</h3>
        </div>
      )}
      {duelPhase === "playing" && (
        <div style={{ margin: 24 }}>
          <h3>Play the Gold Rush Game!</h3>
          <GoldRushGame onGameEnd={handleGameEnd} />
        </div>
      )}
      {duelPhase === "finished" && (
        <div style={{ margin: 24 }}>
          <h3>Game Finished!</h3>
          <div>Your Score: {playerScore}</div>
          {!winnerSubmitted ? (
            <button onClick={handleSubmitWinner} style={{ marginTop: 16 }}>Submit as Winner</button>
          ) : (
            <div style={{ color: 'green', marginTop: 16 }}>Winner submitted! Await payout.</div>
          )}
        </div>
      )}
      <hr />
      <h3>Open Duels</h3>
      {loadingDuels ? <div>Loading duels...</div> : (
        <table style={{ width: '100%', fontSize: 14 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Player 1</th>
              <th>Player 2</th>
              <th>Stake</th>
              <th>State</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {duels.length === 0 && <tr><td colSpan={6}>No duels found</td></tr>}
            {duels.map(d => (
              <tr key={d.duelId} style={{ background: d.state === 0 ? '#ffe' : d.state === 1 ? '#eef' : '#eee' }}>
                <td>{d.duelId}</td>
                <td style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.player1}</td>
                <td style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.player2}</td>
                <td>{d.stake}</td>
                <td>{["Open", "Joined", "Finished", "Cancelled"][d.state]}</td>
                <td style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.winner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {txStatus && <div style={{ marginTop: 16, color: txStatus.startsWith('Error') ? 'red' : 'green' }}>{txStatus}</div>}
    </div>
  );
}

export default App;
