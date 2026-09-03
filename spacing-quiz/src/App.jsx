import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 퀴즈 데이터셋 (원하는 만큼 자유롭게 추가 가능합니다)
const QUIZ_DATA = [
  { problem: '오늘도열심히공부했다.', answer: '오늘도 열심히 공부했다.' },
  { problem: '아버지가방에들어가신다.', answer: '아버지가 방에 들어가신다.' },
  { problem: '한국어는어렵지만재밌다.', answer: '한국어는 어렵지만 재밌다.' },
  { problem: '밥은먹고다니냐.', answer: '밥은 먹고 다니냐.' },
  { problem: '그때그사람이보고싶다.', answer: '그때 그 사람이 보고 싶다.' },
];

export default function App() {
  const [gameState, setGameState] = useState('start'); // 'start' | 'playing' | 'result' | 'ending'
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  
  // 💡 안 푼 문제들을 보관하는 문제 은행 state
  const [unseenQuestions, setUnseenQuestions] = useState([...QUIZ_DATA]);
  const [isPoolReset, setIsPoolReset] = useState(false); // 리셋 알림 플래그

  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'
  const [timer, setTimer] = useState(5);

  const inputRef = useRef(null);

  // 게임 시작 및 안 푼 문제에서 무작위 추출
  const handleStartGame = () => {
    let pool = [...unseenQuestions];
    let resetNotice = false;

    // 만약 안 푼 남은 문제가 없다면 전체 데이터셋에서 다시 리셋
    if (pool.length === 0) {
      pool = [...QUIZ_DATA];
      resetNotice = true;
    }

    // 안 푼 문제 무작위 셔플
    const shuffledPool = pool.sort(() => Math.random() - 0.5);

    // 한 판당 출제할 문제 수 (예: 5개씩 추출)
    const ROUND_SIZE = 5; 
    const currentRoundQuestions = shuffledPool.slice(0, ROUND_SIZE);
    const remainingPool = shuffledPool.slice(ROUND_SIZE);

    // 상태 업데이트
    setUnseenQuestions(remainingPool);
    setShuffledQuestions(currentRoundQuestions);
    setIsPoolReset(resetNotice);

    setGameState('playing');
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserInput('');
    setFeedback(null);
  };

  // 띄어쓰기 정제 함수
  const normalizeText = (text) => {
    let cleaned = text.trim().replace(/\s+/g, ' ');
    if (cleaned.endsWith('.')) {
      cleaned = cleaned.slice(0, -1).trim();
    }
    return cleaned;
  };

  // 다음 문제로 이동 (마지막 문제면 최종 결과 화면으로!)
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < shuffledQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserInput('');
      setFeedback(null);
      setGameState('playing');
    } else {
      // 💡 이번 판의 모든 문제를 다 풀었으면 최종 결과 화면으로 이동
      setGameState('ending');
    }
  };

  // 제출 처리
  const handleSubmit = (e) => {
    e.preventDefault();

    if (gameState === 'result') {
      handleNextQuestion();
      return;
    }

    if (!userInput.trim()) return;

    const currentProblem = shuffledQuestions[currentQuestionIndex];
    const normalizedUserAnswer = normalizeText(userInput);
    const normalizedCorrectAnswer = normalizeText(currentProblem.answer);

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setFeedback('correct');
      setScore((prev) => prev + 1);
    } else {
      setFeedback('incorrect');
    }

    setGameState('result');
    setTimer(5);
  };

  // 결과 화면 타이머 & Space 키 감지
  useEffect(() => {
    if (gameState !== 'result') return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, currentQuestionIndex, shuffledQuestions]);

  // 문제 화면 포커스
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [gameState, currentQuestionIndex]);

  const currentProblem = shuffledQuestions[currentQuestionIndex];

  return (
    <div className="App">
      <div className="main-content">
        {/* 상단 픽셀 로고 */}
        <div className="pixel-logo-container">
          <img src="./logo.svg" alt="로고" className="logo-img" />
        </div>

        {/* 메인 퀴즈 카드 */}
        <div className="quiz-card">
          {/* 1. 시작 화면 */}
          {gameState === 'start' && (
            <div className="card-content-start">
              <h2 className="title-text">띄어쓰기 퀴즈</h2>
              <p className="subtitle-text">당신의 띄어쓰기 능력을 확인해보세요 ✏️</p>
              <button className="pixel-button" onClick={handleStartGame}>
                start!
              </button>
            </div>
          )}

          {/* 2. 문제 입력 화면 */}
          {gameState === 'playing' && (
            <div className="card-content-playing">
              <div className="card-header">
                <span className="question-counter">Q. {currentQuestionIndex + 1}</span>
                <span className="score-display">score: {score}</span>
              </div>

              <div className="problem-text-container">
                <p className="problem-text">{currentProblem?.problem}</p>
              </div>

              <form onSubmit={handleSubmit} className="input-area">
                <input
                  ref={inputRef}
                  type="text"
                  className="pixel-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="pixel-button">
                  제출
                </button>
              </form>
            </div>
          )}

          {/* 3. 문제별 정답 / 오답 피드백 화면 */}
          {gameState === 'result' && (
            <div className="card-content-playing">
              <div className="card-header">
                <span className="question-counter">Q. {currentQuestionIndex + 1}</span>
                <span className="score-display">score: {score}</span>
              </div>

              <div className="feedback-overlay">
                <p className={`feedback-text ${feedback}`}>
                  {feedback === 'correct' ? '정답입니다 ! 🎉' : '오답입니다 ! 😭'}
                </p>

                <input
                  type="text"
                  className={`pixel-input ${feedback}`}
                  value={userInput}
                  readOnly
                />

                {feedback === 'incorrect' && (
                  <p className="correct-answer-guide">
                    정답: <span>{currentProblem?.answer}</span>
                  </p>
                )}

                <div className="button-group">
                  <button className="pixel-button" onClick={handleNextQuestion}>
                    다음 문제
                  </button>
                </div>
                <p className="timer-text">{timer}초 후 다음 문제로 이동 (Space)</p>
              </div>
            </div>
          )}

          {/* 4. 💡 최종 점수 / 퀴즈 종료 화면 */}
          {gameState === 'ending' && (
            <div className="card-content-start">
              <h2 className="title-text">🎉 퀴즈 종료!</h2>
              <p className="subtitle-text">
                총 <strong>{shuffledQuestions.length}</strong>문제 중 <strong>{score}</strong>문제를 맞혔습니다!
              </p>
              
              {isPoolReset && (
                <p className="reset-notice-text">
                  💡 모든 문제를 풀어 문제 은행이 다시 리셋되었습니다!
                </p>
              )}

              <p className="remaining-count-text">
                (남은 미풀이 문제: {unseenQuestions.length}개)
              </p>

              <button className="pixel-button large" onClick={handleStartGame}>
                다시 도전
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}