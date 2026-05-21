const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value;
  }
});

const apiKey = envVars.GEMINI_API_KEY;
console.log('Using API key:', apiKey ? 'FOUND' : 'MISSING');

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: 'You are a helpful assistant.'
    });
    const result = await model.generateContent('Hi');
    console.log(`  Success! Response: "${result.response.text().trim()}"`);
    return true;
  } catch (error) {
    console.error(`  Failed! Error message: "${error.message}"`);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-pro'
  ];
  for (const m of models) {
    await testModel(m);
  }
}

run();
