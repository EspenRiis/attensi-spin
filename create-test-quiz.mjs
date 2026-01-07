import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxmapoiddadngoaofsti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWFwb2lkZGFkbmdvYW9mc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODIxNjksImV4cCI6MjA3NDk1ODE2OX0.83mPVlUm8wyGOEm8BXXMcvzKZ2K5WtfMWimUQnjOJyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestQuiz() {
  console.log('🎮 Creating test quiz for 3D Racing...\n');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('❌ No user logged in. Please log in first.');
    return;
  }

  console.log(`✅ Creating quiz for user: ${user.email}\n`);

  // Create quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      user_id: user.id,
      name: '🏎️ Test Racing Quiz',
      description: 'A test quiz to see the 3D racing in action!'
    })
    .select()
    .single();

  if (quizError) {
    console.error('❌ Error creating quiz:', quizError);
    return;
  }

  console.log(`✅ Quiz created: "${quiz.name}" (${quiz.id})\n`);

  // Create questions
  const questions = [
    {
      quiz_id: quiz.id,
      text: 'What is the capital of France?',
      question_type: 'multiple_choice',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correct_answer: 'Paris',
      time_limit: 10,
      order_index: 0
    },
    {
      quiz_id: quiz.id,
      text: 'Is the Earth round?',
      question_type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True',
      time_limit: 10,
      order_index: 1
    },
    {
      quiz_id: quiz.id,
      text: 'What is 2 + 2?',
      question_type: 'multiple_choice',
      options: ['3', '4', '5', '22'],
      correct_answer: '4',
      time_limit: 10,
      order_index: 2
    },
    {
      quiz_id: quiz.id,
      text: 'JavaScript was created in 1995',
      question_type: 'true_false',
      options: ['True', 'False'],
      correct_answer: 'True',
      time_limit: 10,
      order_index: 3
    },
    {
      quiz_id: quiz.id,
      text: 'What color is the sky on a clear day?',
      question_type: 'multiple_choice',
      options: ['Green', 'Blue', 'Red', 'Yellow'],
      correct_answer: 'Blue',
      time_limit: 10,
      order_index: 4
    }
  ];

  const { data: createdQuestions, error: questionsError } = await supabase
    .from('questions')
    .insert(questions)
    .select();

  if (questionsError) {
    console.error('❌ Error creating questions:', questionsError);
    return;
  }

  console.log(`✅ Created ${createdQuestions.length} questions\n`);

  console.log('🎉 Test quiz ready!');
  console.log('');
  console.log('📝 Quiz Details:');
  console.log(`   ID: ${quiz.id}`);
  console.log(`   Name: ${quiz.name}`);
  console.log(`   Questions: ${createdQuestions.length}`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Go to Quiz Builder: http://localhost:5173/quiz-builder');
  console.log('   2. You should see the test quiz listed');
  console.log('   3. Click "Start Session" to begin');
  console.log('   4. Join with players and start the quiz');
  console.log('   5. Click "🏎️ 3D View" to see the racing!');
}

createTestQuiz();
