const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  const uri = process.argv[2] || process.env.MONGO_URI;
  
  if (!uri) {
    console.error('Error: MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log(`Connecting to MongoDB at: ${uri}`);
    await client.connect();
    console.log('MongoDB connected successfully!');

    const db = client.db(); // Uses database name from the connection string or 'test' by default

    // Collections
    const users = db.collection('users');
    const exams = db.collection('exams');
    const questions = db.collection('questions');
    const submissions = db.collection('submissions');
    const violations = db.collection('violations');
    const snapshots = db.collection('snapshots');

    // Clear existing data
    await users.deleteMany({});
    await exams.deleteMany({});
    await questions.deleteMany({});
    await submissions.deleteMany({});
    await violations.deleteMany({});
    await snapshots.deleteMany({});
    console.log('Existing data cleared.');

    // 1. Create a Teacher
    const salt = await bcrypt.genSalt(10);
    const hashedTeacherPassword = await bcrypt.hash('teacher123', salt);
    const teacherResult = await users.insertOne({
      name: 'John Professor',
      email: 'teacher@example.com',
      password: hashedTeacherPassword,
      role: 'Teacher',
      profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      createdAt: new Date()
    });
    const teacherId = teacherResult.insertedId;
    console.log('Teacher created: teacher@example.com / teacher123');

    // 2. Create Multiple Students
    const hashedStudentPassword = await bcrypt.hash('student123', salt);
    const studentsData = [
      { name: 'Alice Smith', email: 'alice@example.com', roll_number: '1001', role: 'Student', password: hashedStudentPassword },
      { name: 'Bob Johnson', email: 'bob@example.com', roll_number: '1002', role: 'Student', password: hashedStudentPassword },
      { name: 'Charlie Davis', email: 'charlie@example.com', roll_number: '1003', role: 'Student', password: hashedStudentPassword },
      { name: 'Diana Miller', email: 'diana@example.com', roll_number: '1004', role: 'Student', password: hashedStudentPassword },
      { name: 'Ethan Hunt', email: 'ethan@example.com', roll_number: '1005', role: 'Student', password: hashedStudentPassword },
      { name: 'Student Account', email: 'student@example.com', roll_number: 'S123', role: 'Student', password: hashedStudentPassword }
    ];

    const studentInsertResults = await users.insertMany(studentsData.map(s => ({
      ...s,
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name.split(' ')[0]}`,
      createdAt: new Date()
    })));
    
    // Convert the result object to an array of student objects for later use
    const studentIds = Object.values(studentInsertResults.insertedIds);
    console.log(`Created ${studentIds.length} students (passwords: student123).`);

    // 3. Create Exams
    const now = new Date();

    const exam1Result = await exams.insertOne({
      title: 'Advanced JavaScript Concepts',
      subject: 'Computer Science',
      duration: 60,
      startTime: new Date(now.getTime() - 1000 * 60 * 120),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 48),
      teacherId: teacherId,
      isPublished: true,
      createdAt: new Date()
    });
    const exam1Id = exam1Result.insertedId;

    const exam2Result = await exams.insertOne({
      title: 'Python for Data Science',
      subject: 'Data Science',
      duration: 45,
      startTime: new Date(now.getTime() - 1000 * 60 * 30),
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      teacherId: teacherId,
      isPublished: true,
      createdAt: new Date()
    });
    const exam2Id = exam2Result.insertedId;
    console.log('Exams created.');

    // 4. Create Questions
    await questions.insertMany([
      {
        examId: exam1Id,
        question: 'Which of the following is not a primitive data type in JavaScript?',
        type: 'mcq',
        options: ['String', 'Number', 'Object', 'Boolean'],
        correctAnswer: 'Object'
      },
      {
        examId: exam1Id,
        question: 'What is the output of "console.log(typeof null)"?',
        type: 'mcq',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctAnswer: '"object"'
      },
      {
        examId: exam1Id,
        question: 'The _____ keyword is used to create a constant variable in ES6.',
        type: 'fill_blank',
        options: [],
        correctAnswer: 'const'
      },
      {
        examId: exam2Id,
        question: 'Which library is primarily used for data manipulation and analysis in Python?',
        type: 'mcq',
        options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
        correctAnswer: 'Pandas'
      },
      {
        examId: exam2Id,
        question: 'What is the correct file extension for Python files?',
        type: 'mcq',
        options: ['.py', '.python', '.pyt', '.pt'],
        correctAnswer: '.py'
      }
    ]);
    console.log('Questions inserted for both exams.');

    // 5. Create Sample Violations
    const violationTypes = ['TAB_SWITCH', 'MULTIPLE_FACES', 'NO_FACE', 'SUSPICIOUS_GAZE', 'CELL_PHONE_DETECTED', 'BOOK_DETECTED'];
    const sampleViolations = [];

    for (let i = 0; i < 15; i++) {
      const randomStudentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const randomExamId = Math.random() > 0.5 ? exam1Id : exam2Id;
      const randomType = violationTypes[Math.floor(Math.random() * violationTypes.length)];

      sampleViolations.push({
        studentId: randomStudentId,
        examId: randomExamId,
        violationType: randomType,
        timestamp: new Date(now.getTime() - Math.random() * 1000 * 60 * 60)
      });
    }
    await violations.insertMany(sampleViolations);
    console.log('Sample violations inserted.');

    // 6. Create initial Snapshots
    const sampleSnapshots = [];
    const triggerReasons = ['PERIODIC', 'SUSPICIOUS_GAZE', 'CELL_PHONE_DETECTED', 'MULTIPLE_FACES'];

    for (let i = 0; i < 12; i++) {
      const randomStudentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const randomExamId = Math.random() > 0.5 ? exam1Id : exam2Id;
      const randomReason = triggerReasons[Math.floor(Math.random() * triggerReasons.length)];

      sampleSnapshots.push({
        examId: randomExamId,
        studentId: randomStudentId,
        imageUrl: `/uploads/snapshots/dummy_${i}.png`,
        triggerReason: randomReason,
        timestamp: new Date(now.getTime() - Math.random() * 1000 * 60 * 30)
      });
    }
    await snapshots.insertMany(sampleSnapshots);
    console.log('Sample snapshots inserted.');

    // 7. Create Sample Submissions
    await submissions.insertMany([
      {
        examId: exam1Id,
        studentId: studentIds[0],
        score: 100,
        correctCount: 3,
        incorrectCount: 0,
        autoSubmitted: false,
        submittedAt: new Date(now.getTime() - 1000 * 60 * 45),
        answers: [
          { questionId: 'q1_id_placeholder', answer: 'Object' },
          { questionId: 'q2_id_placeholder', answer: '"object"' },
          { questionId: 'q3_id_placeholder', answer: 'const' }
        ]
      }
    ]);
    console.log('Sample submissions inserted.');

    console.log('\x1b[32m%s\x1b[0m', 'DATABASE SEEDING COMPLETED SUCCESSFULLY WITH MONGODB DRIVER!');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'DATABASE SEEDING FAILED:');
    console.error(error);
  } finally {
    await client.close();
    process.exit(0);
  }
};

seedDatabase();
