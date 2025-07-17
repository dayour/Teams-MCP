import { NLPUtils } from '../utils/nlpUtils';

/**
 * Simple test runner for the scheduling assistant
 */
class TestRunner {
    private tests: Array<{ name: string; fn: () => void }> = [];
    private passed = 0;
    private failed = 0;

    test(name: string, fn: () => void) {
        this.tests.push({ name, fn });
    }

    expect(actual: any) {
        return {
            toBe: (expected: any) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected null, but got ${actual}`);
                }
            },
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error(`Expected value to be defined`);
                }
            },
            toContain: (expected: any) => {
                if (!Array.isArray(actual) || !actual.includes(expected)) {
                    throw new Error(`Expected array to contain ${expected}`);
                }
            },
            not: {
                toBeNull: () => {
                    if (actual === null) {
                        throw new Error(`Expected value not to be null`);
                    }
                }
            }
        };
    }

    async run() {
        console.log('🧪 Running Tests for Teams Scheduling Assistant\n');
        console.log('=' .repeat(60));

        for (const test of this.tests) {
            try {
                test.fn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
                this.failed++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 Test Results:`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Total: ${this.tests.length}`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
        }
    }
}

// Create test runner instance
const runner = new TestRunner();

// NLP Utils Tests
runner.test('should parse basic scheduling request', () => {
    const text = 'Schedule a team standup meeting tomorrow at 10 AM';
    const result = NLPUtils.parseSchedulingRequest(text);
    
    runner.expect(result).not.toBeNull();
    runner.expect(result?.subject).toBe('team standup');
    runner.expect(result?.startTime).toBeDefined();
    runner.expect(result?.endTime).toBeDefined();
});

runner.test('should extract attendees from email addresses', () => {
    const text = 'Schedule a meeting with john@company.com and sarah@company.com at 2 PM';
    const result = NLPUtils.parseSchedulingRequest(text);
    
    runner.expect(result?.attendees).toContain('john@company.com');
    runner.expect(result?.attendees).toContain('sarah@company.com');
});

runner.test('should detect room requirements', () => {
    const text = 'Book a conference room for 10 people with projector tomorrow at 3 PM';
    const result = NLPUtils.parseSchedulingRequest(text);
    
    runner.expect(result?.needsRoom).toBe(true);
    runner.expect(result?.roomRequirements?.capacity).toBe(10);
    runner.expect(result?.roomRequirements?.equipment).toContain('projector');
});

runner.test('should extract duration correctly', () => {
    runner.expect(NLPUtils.extractDuration('Schedule a 2 hour meeting')).toBe(120);
    runner.expect(NLPUtils.extractDuration('Book a 30 minute call')).toBe(30);
    runner.expect(NLPUtils.extractDuration('Plan a 1h 30m session')).toBe(90);
});

runner.test('should detect urgency levels', () => {
    runner.expect(NLPUtils.detectUrgency('urgent meeting needed')).toBe('high');
    runner.expect(NLPUtils.detectUrgency('schedule something soon')).toBe('medium');
    runner.expect(NLPUtils.detectUrgency('plan a regular meeting')).toBe('low');
});

runner.test('should return null for non-scheduling text', () => {
    const text = 'How is the weather today?';
    const result = NLPUtils.parseSchedulingRequest(text);
    
    runner.expect(result).toBeNull();
});

runner.test('should extract location preferences', () => {
    const text = 'Schedule meeting in the main office building';
    const location = NLPUtils.extractLocationPreference(text);
    
    runner.expect(location).toBe('main office building');
});

// Manual test demonstrations
runner.test('should demonstrate practical scheduling scenarios', () => {
    console.log('\n📋 Practical Scheduling Examples:');
    
    const examples = [
        'Schedule a project review meeting tomorrow at 2 PM with john@team.com',
        'Book a conference room for 15 people with video conference equipment next Monday at 10 AM',
        'Arrange a quick standup call at 9 AM with the development team',
        'Plan an urgent client meeting today at 4 PM in the executive boardroom',
        'Set up a 2 hour workshop for next week with projector and whiteboard'
    ];

    examples.forEach((example, index) => {
        console.log(`\nExample ${index + 1}: "${example}"`);
        const result = NLPUtils.parseSchedulingRequest(example);
        console.log('Parsed result:', JSON.stringify(result, null, 2));
    });
});

// Export for external use
export default runner;

// Run tests if this file is executed directly
if (require.main === module) {
    runner.run().catch(console.error);
}
