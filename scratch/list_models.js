const fs = require('fs');
const path = require('path');

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
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      const geminiModels = data.models
        .filter(m => m.name.toLowerCase().includes('gemini-') && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name);
      console.log('Gemini Models supporting generateContent:', geminiModels);
    } else {
      console.log('No models key found in response:', data);
    }
  } catch (error) {
    console.error('List models failed:', error);
  }
}

run();
