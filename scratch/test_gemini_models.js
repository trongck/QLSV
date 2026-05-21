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

async function run() {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log('Testing gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Xin chào, bạn là ai? Trả lời rất ngắn gọn.');
    console.log('gemini-2.5-flash response:', result.response.text());
  } catch (error) {
    console.error('gemini-2.5-flash failed:', error.message);
  }

  try {
    console.log('Testing gemini-2.0-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Xin chào, bạn là ai? Trả lời rất ngắn gọn.');
    console.log('gemini-2.0-flash response:', result.response.text());
  } catch (error) {
    console.error('gemini-2.0-flash failed:', error.message);
  }
}

run();
