const LexBrain = {
    // Memory of the last thing Lex said
    lastAction: null,

    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();
        
        // 1. REACTION LOGIC: Is the user answering Lex's previous question?
        if (this.lastAction === 'asked_status') {
            this.lastAction = 'replied_social';
            return this.handleFeedback(input);
        }

        // 2. SOCIAL DETECTION
        if (this.isSocial(input)) {
            if (input.includes('how are you')) {
                this.lastAction = 'asked_status';
                return "I'm doing great, honestly. Just keeping the gears turning. How are things on your end?";
            }
            return this.handleSocial(input);
        }

        // 3. TASK DETECTION: If it's not social, it's a task.
        this.lastAction = 'task';
        return this.handleTask(query, isDeep);
    },

    isSocial: function(input) {
        const socialKeys = ['hi', 'hello', 'hey', 'good', 'fine', 'thanks', 'cool', 'ok', 'wow', 'interesting'];
        // Short sentences (under 4 words) are usually social/feedback
        return input.split(' ').length < 4 || socialKeys.some(k => input.includes(k));
    },

    handleFeedback: function(input) {
        // This handles "i am good too", "doing well", etc.
        const positive = ['good', 'great', 'well', 'fine', 'okay', 'excellent'];
        const negative = ['bad', 'tired', 'stressed', 'busy'];

        if (positive.some(word => input.includes(word))) {
            return "Glad to hear that. It’s always better to tackle the day from a good head-space. What are we focusing on today?";
        }
        if (negative.some(word => input.includes(word))) {
            return "Sorry to hear that. Sometimes the load gets heavy. Anything I can take off your plate, or do you just want to talk through the chaos?";
        }
        return "Understood. I'm here when you're ready to dive into the heavy lifting. What's the move?";
    },

    handleSocial: function(input) {
        if (input.match(/^(hi|hello|hey|whats up)/)) {
            return "Hey. I was just syncing some data. What can I do for you?";
        }
        if (input.match(/^(thanks|thank you|thx)/)) {
            return "Of course. That's what I'm here for.";
        }
        return "Got it. Let me know if you want to dive into something specific or if you need me to look at a file.";
    },

    handleTask: function(query, isDeep) {
        // Professional logic ONLY triggers when there is a real request
        const queryLower = query.toLowerCase();
        
        let response = "";
        
        if (isDeep) {
            response = "I've run a deep-scan on that. ";
        }

        if (queryLower.includes('contract') || queryLower.includes('nda') || queryLower.includes('legal')) {
            response += "Looking at the legal implications here, the main friction point is usually the liability cap. We should ensure it's balanced against the total contract value.";
        } else if (queryLower.includes('business') || queryLower.includes('strategy') || queryLower.includes('market')) {
            response += "Strategically, the move here depends on your risk tolerance. If you want growth, we scale; if you want safety, we optimize the current margins.";
        } else {
            // General intelligent response that isn't "Solid point"
            response += "That’s an interesting angle. Usually, when people bring this up, they're looking for a way to streamline the process without losing quality. Is that what you're aiming for?";
        }

        return response;
    }
};
