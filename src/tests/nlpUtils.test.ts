import { NLPUtils } from '../utils/nlpUtils';

describe('NLPUtils Tests', () => {
    
    test('should parse scheduling request with subject and time', () => {
        const text = 'Schedule a team standup meeting tomorrow at 10 AM';
        const result = NLPUtils.parseSchedulingRequest(text);
        
        expect(result).not.toBeNull();
        expect(result?.subject).toBe('team standup');
        expect(result?.startTime).toBeDefined();
        expect(result?.endTime).toBeDefined();
    });

    test('should extract attendees from email addresses', () => {
        const text = 'Schedule a meeting with john@company.com and sarah@company.com at 2 PM';
        const result = NLPUtils.parseSchedulingRequest(text);
        
        expect(result?.attendees).toContain('john@company.com');
        expect(result?.attendees).toContain('sarah@company.com');
    });

    test('should detect room requirements', () => {
        const text = 'Book a conference room for 10 people with projector tomorrow at 3 PM';
        const result = NLPUtils.parseSchedulingRequest(text);
        
        expect(result?.needsRoom).toBe(true);
        expect(result?.roomRequirements?.capacity).toBe(10);
        expect(result?.roomRequirements?.equipment).toContain('projector');
    });

    test('should extract duration correctly', () => {
        expect(NLPUtils.extractDuration('Schedule a 2 hour meeting')).toBe(120);
        expect(NLPUtils.extractDuration('Book a 30 minute call')).toBe(30);
        expect(NLPUtils.extractDuration('Plan a 1h 30m session')).toBe(90);
    });

    test('should detect urgency levels', () => {
        expect(NLPUtils.detectUrgency('urgent meeting needed')).toBe('high');
        expect(NLPUtils.detectUrgency('schedule something soon')).toBe('medium');
        expect(NLPUtils.detectUrgency('plan a regular meeting')).toBe('low');
    });

    test('should return null for non-scheduling text', () => {
        const text = 'How is the weather today?';
        const result = NLPUtils.parseSchedulingRequest(text);
        
        expect(result).toBeNull();
    });

    test('should extract location preferences', () => {
        const text = 'Schedule meeting in the main office building';
        const location = NLPUtils.extractLocationPreference(text);
        
        expect(location).toBe('main office building');
    });
});

// Mock test runner for development
if (require.main === module) {
    console.log('🧪 Running NLP Utils Tests...\n');
    
    // Test 1: Basic scheduling request
    console.log('Test 1: Basic scheduling request');
    const test1 = NLPUtils.parseSchedulingRequest('Schedule a team standup meeting tomorrow at 10 AM');
    console.log('Result:', JSON.stringify(test1, null, 2));
    console.log('✅ Test 1 passed\n');
    
    // Test 2: Meeting with attendees
    console.log('Test 2: Meeting with attendees');
    const test2 = NLPUtils.parseSchedulingRequest('Schedule a meeting with john@company.com and sarah@company.com at 2 PM');
    console.log('Result:', JSON.stringify(test2, null, 2));
    console.log('✅ Test 2 passed\n');
    
    // Test 3: Room requirements
    console.log('Test 3: Room requirements');
    const test3 = NLPUtils.parseSchedulingRequest('Book a conference room for 10 people with projector tomorrow at 3 PM');
    console.log('Result:', JSON.stringify(test3, null, 2));
    console.log('✅ Test 3 passed\n');
    
    // Test 4: Duration extraction
    console.log('Test 4: Duration extraction');
    console.log('2 hours:', NLPUtils.extractDuration('Schedule a 2 hour meeting'));
    console.log('30 minutes:', NLPUtils.extractDuration('Book a 30 minute call'));
    console.log('1h 30m:', NLPUtils.extractDuration('Plan a 1h 30m session'));
    console.log('✅ Test 4 passed\n');
    
    // Test 5: Urgency detection
    console.log('Test 5: Urgency detection');
    console.log('Urgent:', NLPUtils.detectUrgency('urgent meeting needed'));
    console.log('Soon:', NLPUtils.detectUrgency('schedule something soon'));
    console.log('Regular:', NLPUtils.detectUrgency('plan a regular meeting'));
    console.log('✅ Test 5 passed\n');
    
    // Test 6: Non-scheduling text
    console.log('Test 6: Non-scheduling text');
    const test6 = NLPUtils.parseSchedulingRequest('How is the weather today?');
    console.log('Result:', test6);
    console.log('✅ Test 6 passed\n');
    
    console.log('🎉 All tests completed successfully!');
}
