import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxmapoiddadngoaofsti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWFwb2lkZGFkbmdvYW9mc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODIxNjksImV4cCI6MjA3NDk1ODE2OX0.83mPVlUm8wyGOEm8BXXMcvzKZ2K5WtfMWimUQnjOJyI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuizCreation() {
  console.log('🧪 Testing quiz creation...\n');

  // Try to create a quiz (this will fail with permission error if user not logged in)
  const testQuiz = {
    user_id: '00000000-0000-0000-0000-000000000000', // Dummy ID to test table existence
    name: 'Test Quiz',
    description: 'Just a test'
  };

  const { data, error } = await supabase
    .from('quizzes')
    .insert(testQuiz)
    .select();

  if (error) {
    if (error.message.includes('new row violates row-level security')) {
      console.log('✅ Table exists! (RLS is working - this is good)');
      console.log('   You need to be logged in to create quizzes\n');
      console.log('📝 To create a quiz:');
      console.log('   1. Go to: http://localhost:5173/quiz-builder');
      console.log('   2. Make sure you\'re logged in');
      console.log('   3. Click "Create New Quiz"');
      console.log('   4. Add a name and description');
      console.log('   5. Click "Create"');
      console.log('   6. Add questions in the editor');
    } else {
      console.error('❌ Error:', error.message);
      console.log('\n⚠️  The quizzes table might not exist or have wrong permissions');
    }
  } else {
    console.log('✅ Quiz created successfully!', data);
  }
}

testQuizCreation();
