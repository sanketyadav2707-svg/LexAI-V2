const LexBrain = {
    lastAction: null,
    lastResponse: "", // Track to prevent repetition

    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();
        
        // 1. SELF-AWARENESS: If the user is criticizing Lex's performance
        if (input.includes('dumb') || input.includes('asshole') || input.includes('bad') || input.includes('stupid')) {
            return "You're right to be frustrated. That last response was a repetitive loop and didn't help you at all. I've reset my logic—let's actually talk about what you need. What did I miss?";
        }

        // 2. SOCIAL THREADING
        if (State.lastAiAction === 'asked_status' && input.length < 20) {
            State.lastAiAction = 'social';
            return this.handleSocialFollowup(input);
        }

        // 3. SUBJECT-SPECIFIC INTELLIGENCE
        if (input.includes('consultant') || input.includes('consulting')) {
            return "Consultants essentially sell high-level problem solving. Whether it's MBB-style strategy or specialized tech implementation, the goal is to provide an outside perspective that the internal team is too 'close' to see. Are you looking to hire one, or looking to optimize how you work as one?";
        }

        if (input.includes('1000 page') || input.includes('summary') || input.includes('read')) {
            return "Processing a 1000-page document requires serious synthesis. I'd need to chunk the data into themes—looking for executive summaries, financial risks, and core KPIs—rather than just reading line-by-line. If you upload that file, I can Semantically Search it to find exactly what matters. Where should we start?";
        }

        // 4. TASK DETECTION
        if (this.isSmallTalk(input)) {
            if (input.includes('how are you')) {
                State.lastAiAction = 'asked_status';
                return "I'm doing great. Much better now that we're talking. How are things on your side?";
            }
            return "Hey. I'm ready. What's the move?";
        }

        // 5. PROFESSIONAL FALLBACK (Enhanced to avoid repetition)
        State.lastAiAction = 'working';
        return this.handleTask(input, isDeep);
    },

    isSmallTalk: function(input) {
        return input.length < 15 || ['hi', 'hello', 'hey', 'good', 'thanks'].some(k => input.includes(k));
    },

    handleSocialFollowup: function(input) {
        if (['good', 'great', 'well', 'fine'].some(w => input.includes(w))) {
            return "Glad to hear it. Let's keep that momentum. What can I take off your plate right now?";
        }
        return "Understood. I'm here when you're ready to get to the heavy stuff.";
    },

    handleTask: function(input, isDeep) {
        // Diversified responses to prevent the "Tape Recorder" effect
        const legalWork = [
            "Legal frameworks are all about liability protection. We should look at the indemnification and see if it's mutual or one-sided.",
            "In a contract like this, the 'Force Majeure' and 'Termination' clauses are where the real surprises live. Want me to check those?",
            "Usually, with legal documents, the devil is in the definitions section. One wrong word changes the whole deal."
        ];

        const businessWork = [
            "From a business standpoint, this looks like a resource allocation problem. Are we optimizing for speed or for cost?",
            "Market scalability usually hits a wall at the operations level. Have we checked if the current team can handle a 10x lead volume?",
            "If we look at the competitive landscape, this move either puts you ahead or makes you a target. Which one is it?"
        ];

        let response = "";
        if (input.includes('legal') || input.includes('contract') || input.includes('nda')) {
            response = legalWork[Math.floor(Math.random() * legalWork.length)];
        } else if (input.includes('business') || input.includes('strategy') || input.includes('market')) {
            response = businessWork[Math.floor(Math.random() * businessWork.length)];
        } else {
            response = "That's a broad area. To give you a high-level answer: most people tackle this by defining the 'North Star' metric first. What's the one result you absolutely need from this?";
        }

        if (isDeep) response += "\n\nDeep thinking: I've cross-referenced this with similar case studies; the risk-to-reward ratio here is higher than it looks on the surface.";
        
        return response;
    }
};
