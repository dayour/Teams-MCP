import { NLPUtils } from '../utils/nlpUtils';

console.log('🔍 Debugging Duration Extraction...\n');

const testCases = [
    'Schedule a 2 hour meeting',
    'Book a 30 minute call', 
    'Plan a 1h 30m session'
];

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: "${testCase}"`);
    const result = NLPUtils.extractDuration(testCase);
    console.log(`Result: ${result}\n`);
    
    // Let's test the regex patterns manually
    const patterns = [
        /(\d+)\s*(?:hour|hours|hr|hrs)/i,
        /(\d+)\s*(?:minute|minutes|min|mins)/i,
        /(\d+)\s*h\s*(\d+)\s*m/i, // 1h 30m format
    ];
    
    patterns.forEach((pattern, patternIndex) => {
        const match = testCase.match(pattern);
        console.log(`  Pattern ${patternIndex + 1} (${pattern.source}): ${match ? JSON.stringify(match) : 'no match'}`);
    });
    console.log('---');
});
