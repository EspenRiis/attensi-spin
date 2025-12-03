import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const useQuizGame = (sessionId, userId) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Game state
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, in_progress, completed
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    participants: [],
    leaderboard: [],
    results: null,
  });

  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!sessionId || !userId) return;

    console.log('🔌 Connecting to WebSocket...', { sessionId, userId });

    const newSocket = io(WS_URL, {
      query: {
        session_id: sessionId,
        user_id: userId,
      },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setConnected(false);
    });

    newSocket.on('error', (data) => {
      console.error('WebSocket error:', data);
      setError(data.message);
    });

    // Game events
    newSocket.on('player_joined', (data) => {
      console.log('👤 Player joined:', data);
      setGameState((prev) => ({
        ...prev,
        participantCount: data.participant_count,
      }));
    });

    newSocket.on('quiz_started', (data) => {
      console.log('🎮 Quiz started:', data);
      setGameState((prev) => ({
        ...prev,
        status: 'in_progress',
        currentQuestionIndex: data.current_question_index,
        totalQuestions: data.total_questions,
      }));
    });

    newSocket.on('question', (data) => {
      console.log('❓ New question:', data);
      setGameState((prev) => ({
        ...prev,
        currentQuestion: data.question,
        currentQuestionIndex: data.current_question_index,
        totalQuestions: data.total_questions,
        results: null, // Clear previous results
      }));
    });

    newSocket.on('answer_submitted', (data) => {
      console.log('✍️ Answer submitted:', data);
    });

    newSocket.on('answer_revealed', (data) => {
      console.log('🎯 Answer revealed:', data);
      setGameState((prev) => ({
        ...prev,
        results: {
          correctAnswer: data.correct_answer,
          results: data.results,
        },
        leaderboard: data.leaderboard,
      }));
    });

    newSocket.on('next_question', (data) => {
      console.log('➡️ Next question:', data);
      setGameState((prev) => ({
        ...prev,
        currentQuestionIndex: data.current_question_index,
      }));
    });

    newSocket.on('quiz_completed', (data) => {
      console.log('🏁 Quiz completed:', data);
      setGameState((prev) => ({
        ...prev,
        status: 'completed',
        leaderboard: data.final_leaderboard,
      }));
    });

    // Cleanup
    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      newSocket.close();
    };
  }, [sessionId, userId]);

  // Host actions
  const startQuiz = useCallback(() => {
    console.log('▶️ Starting quiz...');
    socketRef.current?.emit('start_quiz');
  }, []);

  const revealAnswer = useCallback((questionId) => {
    console.log('🔍 Revealing answer...', questionId);
    socketRef.current?.emit('reveal_answer', { question_id: questionId });
  }, []);

  const nextQuestion = useCallback(() => {
    console.log('⏭️ Next question...');
    socketRef.current?.emit('next_question');
  }, []);

  const endQuiz = useCallback(() => {
    console.log('⏹️ Ending quiz...');
    socketRef.current?.emit('end_quiz');
  }, []);

  // Player actions
  const submitAnswer = useCallback((questionId, answer, timeTaken, participantId) => {
    console.log('📝 Submitting answer...', { questionId, answer, timeTaken });
    socketRef.current?.emit('submit_answer', {
      question_id: questionId,
      answer,
      time_taken: timeTaken,
      participant_id: participantId,
    });
  }, []);

  return {
    // Connection state
    connected,
    error,

    // Game state
    gameState,

    // Host actions
    startQuiz,
    revealAnswer,
    nextQuestion,
    endQuiz,

    // Player actions
    submitAnswer,
  };
};
