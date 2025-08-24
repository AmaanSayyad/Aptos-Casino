"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { useSelector } from 'react-redux';

export default function GameControls({ onBet, onRowChange, onRiskLevelChange, onBetAmountChange, initialRows = 16, initialRiskLevel = "Medium" }) {
  const userBalance = useSelector((state) => state.balance.userBalance);
  
  const [gameMode, setGameMode] = useState("manual");
  const [betAmount, setBetAmount] = useState("0.00");
  const [numberOfBets, setNumberOfBets] = useState("1");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [riskLevel, setRiskLevel] = useState(initialRiskLevel);
  const [rows, setRows] = useState(initialRows);
  const [showRiskDropdown, setShowRiskDropdown] = useState(false);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);
  const [autoBetInterval, setAutoBetInterval] = useState(null);

  const riskLevels = ["Low", "Medium", "High"];
  const rowOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Update local state when props change
  useEffect(() => {
    setRiskLevel(initialRiskLevel);
    setRows(initialRows);
  }, [initialRiskLevel, initialRows]);

  // Cleanup auto betting interval when component unmounts or game mode changes
  useEffect(() => {
    return () => {
      if (autoBetInterval) {
        console.log('Cleaning up auto betting interval on unmount/mode change');
        clearInterval(autoBetInterval);
      }
    };
  }, [autoBetInterval, gameMode]);

  const handleBetAmountChange = (value) => {
    // Allow user to type freely
    if (typeof value === 'string') {
      // If it's a string (from input), just set it as is
      setBetAmount(value);
      
      // Also notify parent with parsed value
      const numValue = parseFloat(value) || 0;
      if (onBetAmountChange) {
        onBetAmountChange(numValue);
      }
      return;
    }
    
    // If it's a number (from buttons), format it
    const numValue = parseFloat(value) || 0;
    setBetAmount(numValue.toFixed(2));
    
    // Notify parent component about bet amount change
    if (onBetAmountChange) {
      onBetAmountChange(numValue);
    }
  };

  const handleHalfBet = () => {
    const currentBet = parseFloat(betAmount) || 0;
    const newBet = (currentBet / 2).toFixed(2);
    setBetAmount(newBet);
    
    // Notify parent component
    if (onBetAmountChange) {
      onBetAmountChange(parseFloat(newBet));
    }
  };

  const handleDoubleBet = () => {
    const currentBet = parseFloat(betAmount) || 0;
    const newBet = (currentBet * 2).toFixed(2);
    setBetAmount(newBet);
    
    // Notify parent component
    if (onBetAmountChange) {
      onBetAmountChange(parseFloat(newBet));
    }
  };

  const handleBet = () => {
    const betValue = parseFloat(betAmount);
    const currentBalanceReduxUnit = parseFloat(userBalance);
    const currentBalanceAPT = currentBalanceReduxUnit / 100000000;
    
    console.log('handleBet called with betValue:', betValue, 'currentBalance (APT):', currentBalanceAPT);
    
    if (betValue <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }
    
    if (betValue > currentBalanceAPT) {
      alert(`Insufficient balance! You have ${currentBalanceAPT.toFixed(3)} APT but need ${betValue} APT`);
      return;
    }
    
    if (onBetAmountChange) {
      onBetAmountChange(betValue);
    }
    
    if (gameMode === "auto") {
      console.log('Starting auto betting...');
      setIsAutoPlaying(true);
      startAutoBetting();
    } else if (onBet) {
      console.log('Manual bet...');
      onBet();
    }
  };

  const startAutoBetting = () => {
    const totalBets = parseInt(numberOfBets) || 1;
    let currentBet = 0;
    
    // Check if we have enough balance for all bets
    const totalBetAmount = totalBets * parseFloat(betAmount);
    const totalBetAmountInReduxUnit = totalBetAmount * 100000000;
    const currentBalance = parseFloat(userBalance);
    
    console.log('Auto betting balance check:', {
      totalBets,
      betAmount,
      totalBetAmount,
      totalBetAmountInReduxUnit,
      currentBalance,
      balanceInAPT: (currentBalance / 100000000).toFixed(3)
    });
    
    if (totalBetAmountInReduxUnit > currentBalance) {
      alert(`Insufficient balance for ${totalBets} bets of ${betAmount} APT each. You need ${totalBetAmount.toFixed(3)} APT but have ${(currentBalance / 100000000).toFixed(3)} APT`);
      setIsAutoPlaying(false);
      return;
    }
    
    console.log('Auto betting started with', totalBets, 'bets');
    console.log('onBet function exists:', !!onBet);
    
    // Start first bet immediately
    if (onBet) {
      console.log('First bet starting...');
      // Notify parent that auto betting has started
      if (onBetAmountChange) {
        onBetAmountChange(parseFloat(betAmount));
      }
      onBet();
      currentBet++;
      setNumberOfBets((totalBets - currentBet).toString());
      console.log('First bet completed, remaining:', totalBets - currentBet);
    }
    
    // Then continue with interval - 0.3 seconds between bets
    const interval = setInterval(() => {
      console.log('Interval triggered, currentBet:', currentBet, 'totalBets:', totalBets, 'isAutoPlaying:', isAutoPlaying);
      
      if (currentBet >= totalBets) {
        console.log('Auto betting finished - all bets completed');
        clearInterval(interval);
        setIsAutoPlaying(false);
        setAutoBetInterval(null);
        // Reset to original value when all bets are completed
        setNumberOfBets("1");
        return;
      }
      
      if (onBet) {
        console.log('Auto bet', currentBet + 1, 'starting...');
        // Notify parent about each auto bet
        if (onBetAmountChange) {
          onBetAmountChange(parseFloat(betAmount));
        }
        onBet();
        currentBet++;
        // Update the remaining bets count
        setNumberOfBets((totalBets - currentBet).toString());
        console.log('Auto bet completed, remaining:', totalBets - currentBet);
      }
    }, 300); // 0.3 second delay between bets
    
    // Store the interval ID in state so we can clear it later
    setAutoBetInterval(interval);
    console.log('Auto bet interval set with ID:', interval);
  };

  const stopAutoBetting = () => {
    console.log('Stop auto betting called');
    
    // Clear the interval if it exists
    if (autoBetInterval) {
      console.log('Clearing interval with ID:', autoBetInterval);
      clearInterval(autoBetInterval);
      setAutoBetInterval(null);
    }
    
    setIsAutoPlaying(false);
    // Don't reset numberOfBets - keep showing remaining bets
  };

  const handleRowChange = (newRows) => {
    setRows(newRows);
    setShowRowsDropdown(false);
    
    // Don't reset bet amount, keep it for consistency
    console.log('GameControls: Row changed, keeping bet amount:', betAmount);
    
    // Notify parent component about row change
    if (onRowChange) {
      onRowChange(newRows);
    }
  };

  const handleRiskLevelChange = (newRiskLevel) => {
    setRiskLevel(newRiskLevel);
    setShowRiskDropdown(false);
    
    // Don't reset bet amount, keep it for consistency
    console.log('GameControls: Risk level changed, keeping bet amount:', betAmount);
    
    // Notify parent component about risk level change
    if (onRiskLevelChange) {
      onRiskLevelChange(newRiskLevel);
    }
  };

  // Check if user has sufficient balance for current bet
  const hasSufficientBalance = () => {
    const betValue = parseFloat(betAmount);
    const currentBalance = parseFloat(userBalance);
    const betAmountInReduxUnit = betValue * 100000000;
    return betAmountInReduxUnit <= currentBalance && betValue > 0;
  };

  // Check if user has sufficient balance for auto betting
  const hasSufficientBalanceForAutoBet = () => {
    const betValue = parseFloat(betAmount);
    const totalBets = parseInt(numberOfBets) || 1;
    const totalBetAmount = totalBets * betValue;
    const totalBetAmountInReduxUnit = totalBetAmount * 100000000;
    const currentBalance = parseFloat(userBalance);
    return totalBetAmountInReduxUnit <= currentBalance && betValue > 0;
  };

  // Get current balance in APT for display
  const getCurrentBalanceInAPT = () => {
    return (parseFloat(userBalance) / 100000000).toFixed(3);
  };

  return (
    <div className="bg-[#1A0015] rounded-xl border border-[#333947] p-6">
      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-[#2A0025] rounded-lg p-1">
          <button
            onClick={() => setGameMode("manual")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              gameMode === "manual"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setGameMode("auto")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              gameMode === "auto"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bet Amount
        </label>
        <div className="mb-2">
          <span className="text-2xl font-bold text-white">{betAmount} APT</span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => handleBetAmountChange(e.target.value)}
            onBlur={(e) => {
              const numValue = parseFloat(e.target.value) || 0;
              setBetAmount(numValue.toFixed(2));
              if (onBetAmountChange) {
                onBetAmountChange(numValue);
              }
            }}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            placeholder="0.00"
            step="1"
            min="0"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col">
            <button
              onClick={() => handleBetAmountChange(parseFloat(betAmount || 0) + 0.10)}
              className="text-gray-400 hover:text-white p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleBetAmountChange(parseFloat(betAmount || 0) - 0.10)}
              className="text-gray-400 hover:text-white p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleHalfBet}
            className="flex-1 bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-sm text-white hover:bg-[#3A0035] transition-colors"
          >
            1/2
          </button>
          <button
            onClick={handleDoubleBet}
            className="flex-1 bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-sm text-white hover:bg-[#3A0035] transition-colors"
          >
            2x
          </button>
        </div>
        
        {/* Quick Bet Amounts */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => handleBetAmountChange(0.01)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.01 APT
          </button>
          <button
            onClick={() => handleBetAmountChange(0.05)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0025] transition-colors"
          >
            0.05 APT
          </button>
          <button
            onClick={() => handleBetAmountChange(0.1)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.1 APT
          </button>
          <button
            onClick={() => handleBetAmountChange(0.25)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.25 APT
          </button>
          <button
            onClick={() => handleBetAmountChange(0.5)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0035] transition-colors"
          >
            0.5 APT
          </button>
          <button
            onClick={() => handleBetAmountChange(1)}
            className="bg-[#2A0025] border border-[#333947] rounded-lg py-2 text-xs text-white hover:bg-[#3A0025] transition-colors"
          >
            1.0 APT
          </button>
        </div>
      </div>

      {/* Number of Bets - Only show in Auto mode */}
      {gameMode === "auto" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {isAutoPlaying ? 'Remaining Bets' : 'Number of Bets'}
          </label>
          <input
            type="number"
            value={numberOfBets}
            onChange={(e) => setNumberOfBets(e.target.value)}
            className={`w-full border border-[#333947] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 ${
              isAutoPlaying ? 'bg-[#1A0015] cursor-not-allowed' : 'bg-[#2A0025]'
            }`}
            placeholder="1"
            step="1"
            min="1"
            max="100"
            readOnly={isAutoPlaying}
          />
          <div className="text-xs text-gray-400 mt-1">
            How many bets to place automatically
          </div>
        </div>
      )}

      {/* Risk Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Risk
        </label>
        <div className="relative">
          <button
            onClick={() => setShowRiskDropdown(!showRiskDropdown)}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-[#3A0035] transition-colors"
          >
            <span>{riskLevel}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRiskDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A0025] border border-[#333947] rounded-lg overflow-hidden z-10">
              {riskLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleRiskLevelChange(level)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#3A0035] transition-colors"
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rows (8-16)
        </label>
        <div className="relative">
          <button
            onClick={() => setShowRowsDropdown(!showRowsDropdown)}
            className="w-full bg-[#2A0025] border border-[#333947] rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-[#3A0035] transition-colors"
          >
            <span>{rows}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRowsDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A0025] border border-[#333947] rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
              {rowOptions.map((row) => (
                <button
                  key={row}
                  onClick={() => handleRowChange(row)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-[#3A0035] transition-colors"
                >
                  {row}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          More rows = more complex gameplay
        </div>
      </div>

      {/* Bet Button */}
      {gameMode === "auto" && isAutoPlaying ? (
        <button 
          onClick={stopAutoBetting}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-4 px-6 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
        >
          Stop
        </button>
      ) : (
        <div className="space-y-3">
          {/* Current Balance Display */}
          <div className="text-center p-3 bg-[#2A0025] rounded-lg border border-[#333947]">
            <span className="text-sm text-gray-400">Current Balance:</span>
            <div className="text-lg font-bold text-green-400">{getCurrentBalanceInAPT()} APT</div>
          </div>
          
          {/* Bet Button */}
          <button 
            onClick={gameMode === "auto" ? startAutoBetting : handleBet}
            disabled={gameMode === "auto" ? !hasSufficientBalanceForAutoBet() : !hasSufficientBalance()}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 ${
              (gameMode === "auto" ? hasSufficientBalanceForAutoBet() : hasSufficientBalance())
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {gameMode === "auto" ? "Start Auto Betting" : "Bet"}
          </button>
          
          {/* Insufficient Balance Warning */}
          {((gameMode === "auto" && !hasSufficientBalanceForAutoBet()) || (!gameMode === "auto" && !hasSufficientBalance())) && parseFloat(betAmount) > 0 && (
            <div className="text-center text-red-400 text-sm">
              {gameMode === "auto" 
                ? `Insufficient balance for ${numberOfBets} bets of ${betAmount} APT each` 
                : `Insufficient balance for ${betAmount} APT bet`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
