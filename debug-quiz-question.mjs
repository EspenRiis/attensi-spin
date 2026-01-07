import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxmapoiddadngoaofsti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWFwb2lkZGFkbmdvYW9mc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODIxNjksImV4cCI6MjA3NDk1ODE2OX0.83mPVlUm8wyGOEm8BXXMcvzKZ2K5WtfMWimUQnjOJyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuizQuestion() {
  console.log('🔍 Fetching recent quiz and questions...\n');

  // Get the most recent quiz
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!quizzes || quizzes.length === 0) {
    console.log('❌ No quizzes found');
    return;
  }

  const quiz = quizzes[0];
  console.log(`✅ Quiz: "${quiz.name}" (${quiz.id})\n`);

  // Get questions for this quiz
  const { data: questions } = await supabase
    .from('questions')
    .eq('quiz_id', quiz.id)
    .select('*')
    .order('order_index', { ascending: true });

  const count = questions ? questions.length : 0;
  console.log(`📝 Found ${count} questions:\n`);

  if (questions) {
    questions.forEach((q, i) => {
      console.log(`Question ${i + 1}:`);
      console.log(`  Text: ${q.text}`);
      console.log(`  Type: ${q.question_type}`);
      console.log(`  Options:`, q.options);
      console.log(`  Correct Answer:`, q.correct_answer);
      console.log(`  Type of correct_answer:`, typeof q.correct_answer);
      console.log(`  Is Array:`, Array.isArray(q.correct_answer));
      console.log('');
    });
  }
}

debugQuizQuestion();
