import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxmapoiddadngoaofsti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWFwb2lkZGFkbmdvYW9mc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODIxNjksImV4cCI6MjA3NDk1ODE2OX0.83mPVlUm8wyGOEm8BXXMcvzKZ2K5WtfMWimUQnjOJyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuizData() {
  console.log('🔍 Checking quiz data...\n');

  // Check quizzes
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select('id, name, user_id')
    .limit(5);

  if (quizzesError) {
    console.error('❌ Error fetching quizzes:', quizzesError);
  } else {
    console.log(`✅ Found ${quizzes?.length || 0} quizzes:`);
    quizzes?.forEach(q => console.log(`   - ${q.name} (${q.id})`));
  }

  console.log('');

  // Check questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('quiz_id, id, text, question_type')
    .limit(10);

  if (questionsError) {
    console.error('❌ Error fetching questions:', questionsError);
  } else {
    console.log(`✅ Found ${questions?.length || 0} questions total`);

    if (questions && questions.length > 0) {
      // Group by quiz_id
      const byQuiz = questions.reduce((acc, q) => {
        acc[q.quiz_id] = (acc[q.quiz_id] || 0) + 1;
        return acc;
      }, {});

      console.log('   Questions per quiz:');
      Object.entries(byQuiz).forEach(([quizId, count]) => {
        const quiz = quizzes?.find(q => q.id === quizId);
        console.log(`   - ${quiz?.name || 'Unknown'} (${quizId}): ${count} questions`);
      });
    }
  }

  // Check the specific quiz from the error
  const problematicQuizId = 'ce687484-9da9-4fe6-a8af-76167ebcae8';
  console.log(`\n🔎 Checking specific quiz: ${problematicQuizId}`);

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', problematicQuizId)
    .single();

  if (quizError) {
    console.log('   ❌ Quiz not found in database');
  } else {
    console.log(`   ✅ Quiz found: "${quiz.name}"`);

    const { data: quizQuestions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', problematicQuizId);

    if (qError) {
      console.log('   ❌ Error fetching questions:', qError);
    } else {
      console.log(`   📝 Questions for this quiz: ${quizQuestions?.length || 0}`);
      if (quizQuestions && quizQuestions.length > 0) {
        quizQuestions.forEach((q, i) => {
          console.log(`      ${i + 1}. ${q.text?.substring(0, 50)}...`);
        });
      } else {
        console.log('   ⚠️  NO QUESTIONS FOUND - This is the problem!');
      }
    }
  }
}

checkQuizData();
