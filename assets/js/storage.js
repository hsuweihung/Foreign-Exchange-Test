const FXStorage = {
    parseJSON(raw, fallback) {
        if (!raw) return fallback;

        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    },

    getJSON(key, fallback) {
        return this.parseJSON(localStorage.getItem(key), fallback);
    },

    setJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    getSavedQuestions() {
        return this.getJSON(FXConstants.storageKeys.savedQuestions, { remittance: [], trade: [] });
    },

    setSavedQuestions(value) {
        this.setJSON(FXConstants.storageKeys.savedQuestions, value);
    },

    getSavedPracticeQueue() {
        return this.getJSON(FXConstants.storageKeys.savedPracticeQueue, null);
    },

    setSavedPracticeQueue(value) {
        this.setJSON(FXConstants.storageKeys.savedPracticeQueue, value);
    },

    getExamHistory() {
        return this.getJSON(FXConstants.storageKeys.examHistory, []);
    },

    setExamHistory(value) {
        this.setJSON(FXConstants.storageKeys.examHistory, value);
    },

    getMistakeBank() {
        return this.getJSON(FXConstants.storageKeys.mistakeBank, {});
    },

    setMistakeBank(value) {
        this.setJSON(FXConstants.storageKeys.mistakeBank, value);
    },

    getLastResult() {
        return this.getJSON(FXConstants.storageKeys.lastResult, null);
    },

    setLastResult(value) {
        this.setJSON(FXConstants.storageKeys.lastResult, value);
    },

    getLastExamFull() {
        return this.getJSON(FXConstants.storageKeys.lastExamFull, null);
    },

    setLastExamFull(value) {
        this.setJSON(FXConstants.storageKeys.lastExamFull, value);
    },

    getExamSession(config) {
        return this.getJSON(FXConstants.getExamSessionKey(config), null);
    },

    setExamSession(config, value) {
        this.setJSON(FXConstants.getExamSessionKey(config), value);
    },

    clearExamSession(config) {
        this.remove(FXConstants.getExamSessionKey(config));
    }
};

window.FXStorage = FXStorage;
