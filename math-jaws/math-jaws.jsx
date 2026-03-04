const { useState, useEffect } = React;
const { Anchor, Zap, Users, Timer, AlertTriangle, Waves } = Lucide; 

const JawsMathGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [timeLeft, setTimeLeft] = useState(90);
  const [sharkDistance, setSharkDistance] = useState(100); // 100 = far away, 0 = attack
  const [swimmersRescued, setSwimmersRescued] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dangerLevel, setDangerLevel] = useState(1); // 1-5 difficulty
  const [showSharkAttack, setShowSharkAttack] = useState(false);
  const [mayorPressure, setMayorPressure] = useState(0);
  
  // Swimmers in water
  const [swimmers, setSwimmers] = useState([
    { id: 1, distance: 80, name: 'Alex', rescued: false },
    { id: 2, distance: 60, name: 'Sarah', rescued: false },
    { id: 3, distance: 40, name: 'Mike', rescued: false }
  ]);

  const generateProblem = () => {
    const operations = ['×', '÷'];
    // 70% multiplication, 30% division
    const operation = Math.random() < 0.7 ? '×' : '÷';
    
    let num1, num2, answer;
    
    if (operation === '×') {
      // Times tables up to 12 x 12
      num1 = Math.floor(Math.random() * 12) + 1; // 1-12
      num2 = Math.floor(Math.random() * 12) + 1; // 1-12
      answer = num1 * num2;
    } else {
      // Division with clean answers, max 144
      num2 = Math.floor(Math.random() * 12) + 1; // 1-12 (divisor)
      answer = Math.floor(Math.random() * 12) + 1; // 1-12 (quotient)
      num1 = num2 * answer; // This ensures clean division and max of 12×12=144
    }
    
    return { num1, num2, operation, answer };
  };

  const triggerSharkAttack = () => {
    setShowSharkAttack(true);
    setTimeout(() => setShowSharkAttack(false), 2000);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setFuel(100);
    setTimeLeft(120);
    setSharkDistance(100);
    setSwimmersRescued(0);
    setTotalProblems(0);
    setCorrectAnswers(0);
    setStreak(0);
    setDangerLevel(1);
    setMayorPressure(0);
    setSwimmers([
      { id: 1, distance: 80, name: 'Alex', rescued: false },
      { id: 2, distance: 60, name: 'Sarah', rescued: false },
      { id: 3, distance: 40, name: 'Mike', rescued: false }
    ]);
    setCurrentProblem(generateProblem());
  };

  const checkAnswer = () => {
    const isCorrect = parseInt(userAnswer) === currentProblem.answer;
    setTotalProblems(totalProblems + 1);
    
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
      setScore(score + (50 * dangerLevel) + (streak * 10));
      setStreak(streak + 1);
      setFuel(prev => Math.min(100, prev + 8));
      setSharkDistance(prev => Math.min(100, prev + 20));
      
      // Rescue swimmers more easily
      setSwimmers(prev => prev.map(swimmer => {
        if (!swimmer.rescued && swimmer.distance <= 30) {
          setSwimmersRescued(prev => prev + 1);
          return { ...swimmer, rescued: true };
        }
        return swimmer;
      }));
      
      // Level progression based on streak, not operation changes
      if (streak + 1 >= 8) {
        setDangerLevel(prev => Math.min(5, prev + 1));
        setStreak(0);
      }
    } else {
      setStreak(0);
      setFuel(prev => Math.max(0, prev - 5));
      setSharkDistance(prev => Math.max(0, prev - 15));
      setMayorPressure(prev => prev + 1);
      
      if (sharkDistance <= 20) {
        triggerSharkAttack();
      }
    }
    
    setUserAnswer('');
    setCurrentProblem(generateProblem());
  };

  // Game timer and systems
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setFuel(prev => Math.max(0, prev - 0.3 - (dangerLevel * 0.1)));
        setSharkDistance(prev => Math.max(0, prev - 0.1 - (dangerLevel * 0.05)));
        
        // Move swimmers toward shore more quickly
        setSwimmers(prev => prev.map(swimmer => 
          swimmer.rescued ? swimmer : { ...swimmer, distance: Math.max(0, swimmer.distance - 2) }
        ));
        
      }, 1000);
      return () => clearTimeout(timer);
    } else if ((timeLeft === 0 || fuel <= 0 || sharkDistance <= 0) && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [timeLeft, gameState, fuel, sharkDistance, dangerLevel]);

  const getWaterColor = () => {
    if (sharkDistance > 60) return 'from-blue-400 to-blue-600';
    if (sharkDistance > 30) return 'from-blue-500 to-yellow-500';
    if (sharkDistance > 10) return 'from-yellow-500 to-red-500';
    return 'from-red-500 to-red-700';
  };

  const getBackgroundClass = () => {
    if (sharkDistance > 60) return 'from-sky-300 via-blue-200 to-blue-400';
    if (sharkDistance > 30) return 'from-orange-200 via-yellow-200 to-blue-300';
    if (sharkDistance > 10) return 'from-orange-300 via-red-200 to-red-300';
    return 'from-red-400 via-red-300 to-gray-600';
  };

  const SharkAttackOverlay = () => {
    if (!showSharkAttack) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900 bg-opacity-95 animate-pulse">
        <div className="text-center p-4">
          <div className="text-6xl sm:text-8xl mb-4 animate-bounce">🦈</div>
          <div className="text-2xl sm:text-4xl font-bold text-white animate-pulse">SHARK ATTACK!</div>
          <div className="text-lg sm:text-xl text-red-200 mt-2">Get those swimmers to safety!</div>
        </div>
      </div>
    );
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 via-blue-300 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm border-4 border-blue-500 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
          <div className="text-6xl sm:text-8xl mb-4">🦈</div>
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-900 mb-2">JAWS</h1>
          <h2 className="text-lg sm:text-2xl font-bold text-red-600 mb-1">Amity Island</h2>
          <h3 className="text-base sm:text-xl font-bold text-blue-700 mb-6">Harbor Patrol</h3>
          
          <button 
            onClick={startGame} 
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg border-2 border-blue-400 mb-4"
          >
            <Anchor className="inline mr-2" size={20} />
            Start Patrol
          </button>
          
          <div className="text-xs sm:text-sm text-blue-800 bg-blue-100 p-3 sm:p-4 rounded-lg border border-blue-300">
            <p className="mb-2">🏊‍♀️ Solve multiplication & division problems</p>
            <p className="mb-2">🛥️ Manage your fuel wisely</p>
            <p>🦈 Keep the shark away from the beach!</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;
    const survived = timeLeft > 0 && fuel > 0 && sharkDistance > 0;
    
    // Positive messages based on performance
    const getMotivationalMessage = () => {
      if (swimmersRescued === 3) {
        return "🌟 AMAZING! You're a true hero - all swimmers are safe!";
      } else if (swimmersRescued === 2) {
        return "🎉 GREAT JOB! You saved most of the swimmers!";
      } else if (swimmersRescued === 1) {
        return "👏 WELL DONE! You saved a swimmer - every life counts!";
      } else if (accuracy >= 70) {
        return "🧠 FANTASTIC MATH SKILLS! Your accuracy is impressive!";
      } else if (correctAnswers >= 5) {
        return "💪 NICE WORK! You solved lots of problems correctly!";
      } else {
        return "⭐ GOOD EFFORT! Every problem you solve makes you stronger!";
      }
    };

    const getEncouragementMessage = () => {
      if (swimmersRescued === 3) {
        return "You're getting really good at multiplication and division!";
      } else if (accuracy >= 80) {
        return "Your math skills are really improving! Keep it up!";
      } else if (streak >= 5) {
        return "That streak shows you're learning fast!";
      } else {
        return "Practice makes perfect - you're doing great!";
      }
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-200 via-green-200 to-blue-300 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm border-4 border-green-400 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
          <div className="text-6xl sm:text-8xl mb-4">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-green-700 mb-2">
            Math Hero!
          </h2>
          
          <div className="text-sm sm:text-base text-green-800 font-semibold mb-4 px-2">
            {getMotivationalMessage()}
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 sm:p-6 mb-4 space-y-2 sm:space-y-3 border-2 border-green-200">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-700">Score:</span>
              <span className="text-xl sm:text-2xl font-bold text-blue-600">{score}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-700">Swimmers Saved:</span>
              <span className="text-lg sm:text-xl font-bold text-green-600">{swimmersRescued}/3 🏊‍♀️</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-700">Problems Solved:</span>
              <span className="text-lg sm:text-xl font-bold text-purple-600">{correctAnswers}/{totalProblems}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-700">Best Streak:</span>
              <span className="text-lg sm:text-xl font-bold text-orange-600">{streak} 🔥</span>
            </div>
          </div>
          
          <div className="text-xs sm:text-sm text-blue-700 font-medium mb-4 px-2 italic">
            {getEncouragementMessage()}
          </div>
          
          <button 
            onClick={() => setGameState('menu')} 
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 sm:px-6 rounded-xl font-bold text-sm sm:text-base hover:from-green-600 hover:to-blue-600 transition-all shadow-lg"
          >
            🚁 Ready for Another Rescue Mission?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getBackgroundClass()} p-2 sm:p-4`}>
      <SharkAttackOverlay />
      
      {/* Header Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-400 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center justify-center bg-blue-100 rounded-lg p-2">
            <Zap size={16} className="mr-1 text-yellow-600" />
            <span className="font-bold text-blue-800">{Math.round(fuel)}%</span>
          </div>
          <div className="flex items-center justify-center bg-green-100 rounded-lg p-2">
            <Anchor size={16} className="mr-1 text-green-600" />
            <span className="font-bold text-green-800">{score}</span>
          </div>
          <div className="flex items-center justify-center bg-purple-100 rounded-lg p-2">
            <Users size={16} className="mr-1 text-purple-600" />
            <span className="font-bold text-purple-800">{swimmersRescued}</span>
          </div>
          <div className="flex items-center justify-center bg-red-100 rounded-lg p-2">
            <Timer size={16} className="mr-1 text-red-600" />
            <span className="font-bold text-red-800">{timeLeft}s</span>
          </div>
        </div>
        
        {/* Danger Level & Streak */}
        <div className="flex justify-between items-center mt-2 text-xs sm:text-sm">
          <div className="text-red-700 font-bold">Alert Level: {dangerLevel}</div>
          <div className="text-blue-700 font-bold">Streak: {streak}</div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="bg-white/90 backdrop-blur-sm border-4 border-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 text-center mb-4">
        {/* Problem Display */}
        {currentProblem && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-xl text-blue-700 mb-2 sm:mb-4 font-bold">
              🚨 SHARK ALERT - SOLVE TO RESCUE! 🚨
            </h3>
            
            <div className="bg-blue-50 p-4 sm:p-6 rounded-xl border-2 border-blue-300 mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 font-mono">
                <span>{currentProblem.num1}</span>
                <span>{currentProblem.operation}</span>
                <span>{currentProblem.num2}</span>
                <span>=</span>
                <input 
                  type="number" 
                  value={userAnswer} 
                  onChange={(e) => setUserAnswer(e.target.value)} 
                  onKeyPress={(e) => { if (e.key === 'Enter' && userAnswer.trim() !== '') checkAnswer(); }} 
                  className="w-20 sm:w-24 lg:w-28 text-2xl sm:text-3xl lg:text-4xl font-bold text-center bg-white border-4 border-blue-400 rounded-lg py-2 px-2 focus:border-red-500 focus:outline-none text-blue-800 font-mono" 
                  placeholder="?" 
                  autoFocus 
                />
              </div>
            </div>
            
            <button 
              onClick={checkAnswer} 
              disabled={userAnswer.trim() === ''} 
              className="w-full max-w-xs bg-gradient-to-r from-red-600 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-sm sm:text-lg hover:from-red-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 border-2 border-red-400"
            >
              <AlertTriangle className="inline mr-2" size={16} />
              RESCUE SWIMMERS!
            </button>
          </div>
        )}
      </div>

      {/* Ocean View */}
      <div className="bg-white/70 backdrop-blur-sm border-2 border-blue-400 rounded-xl p-3 sm:p-4">
        <h3 className="text-blue-800 font-bold mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
          <Waves className="mr-2" size={16} />
          AMITY ISLAND BEACH STATUS
        </h3>
        
        {/* Water with shark distance visualization */}
        <div className={`h-16 sm:h-20 bg-gradient-to-r ${getWaterColor()} rounded-lg mb-3 sm:mb-4 relative overflow-hidden border-2 border-blue-300`}>
          {/* Shark fin */}
          <div 
            className="absolute top-2 text-xl sm:text-2xl transition-all duration-1000 transform"
            style={{ 
              left: `${100 - sharkDistance}%`,
              transform: sharkDistance < 10 ? 'scale(1.5)' : 'scale(1)'
            }}
          >
            🦈
          </div>
          
          {/* Beach/Shore */}
          <div className="absolute right-0 top-0 h-full w-8 sm:w-12 bg-yellow-300 border-l-2 border-yellow-600 flex items-center justify-center">
            <span className="text-xs sm:text-sm">🏖️</span>
          </div>
        </div>

        {/* Swimmers Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
          {swimmers.map(swimmer => (
            <div key={swimmer.id} className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${swimmer.rescued ? 'bg-green-200 border border-green-400' : 'bg-blue-100 border border-blue-300'}`}>
              <div className="font-bold text-center">{swimmer.rescued ? '✅' : '🏊‍♀️'} {swimmer.name}</div>
              <div className="text-center mt-1">
                {swimmer.rescued ? 'SAFE!' : `${Math.round(swimmer.distance)}m from shore`}
              </div>
            </div>
          ))}
        </div>

        {/* Fuel Gauge */}
        <div className="mb-2">
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span className="text-gray-700">⛽ Boat Fuel</span>
            <span className="font-bold">{Math.round(fuel)}%</span>
          </div>
          <div className="bg-gray-300 rounded-full h-2 sm:h-3">
            <div 
              className={`h-2 sm:h-3 rounded-full transition-all ${fuel > 50 ? 'bg-green-500' : fuel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
              style={{ width: `${fuel}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-xs sm:text-sm text-gray-700 bg-gray-100 p-2 sm:p-3 rounded-lg">
          Problems: {correctAnswers}/{totalProblems} | Accuracy: {totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0}%
          {mayorPressure > 0 && <span className="text-red-600 ml-2">| Mayor Pressure: {mayorPressure}</span>}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<JawsMathGame />);