let currentTab = 'remittance';
let allQuestions = {};
let geminiHistory = [];
let geminiLoading = false;
let geminiCurrentKey = null;

function buildIndex() {
    if (typeof DATA === 'undefined') return;

    for (const sub in DATA) {
        for (const session in DATA[sub]) {
            DATA[sub][session].forEach((question) => {
                allQuestions[`${sub}_${session}_${question.id}`] = { ...question, session, sub };
            });
        }
    }
}

function updateCounts() {
    const saved = FXStorage.getSavedQuestions();
    const remittanceCount = (saved.remittance || []).length;
    const tradeCount = (saved.trade || []).length;

    document.getElementById('count-remittance').textContent = remittanceCount;
    document.getElementById('count-trade').textContent = tradeCount;
    document.getElementById('count-total').textContent = remittanceCount + tradeCount;
    document.getElementById('badge-remittance').textContent = remittanceCount;
    document.getElementById('badge-trade').textContent = tradeCount;
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-remittance').classList.toggle('active', tab === 'remittance');
    document.getElementById('tab-trade').classList.toggle('active', tab === 'trade');
    renderList();
}

function renderList() {
    const labels = FXConstants.getOptionLabels();
    const saved = FXStorage.getSavedQuestions();
    const list = saved[currentTab] || [];
    const container = document.getElementById('question-list');
    const emptyState = document.getElementById('empty-state');
    const practiceBar = document.getElementById('practice-bar');

    container.innerHTML = '';

    if (!list.length) {
        emptyState.style.display = 'block';
        practiceBar.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    practiceBar.style.display = 'block';

    list.forEach((ref) => {
        const key = `${currentTab}_${ref.session}_${ref.id}`;
        const question = allQuestions[key];
        if (!question) return;

        const card = document.createElement('div');
        card.className = 'q-card';

        const optionsHTML = question.options.map((option, index) => `
            <div class="opt-item${index === question.answer ? ' correct' : ''}">
                <span class="opt-label">${labels[index]}</span>
                <span>${option}</span>
            </div>
        `).join('');

        const analysisHTML = `<div class="analysis-box"><b class="analysis-title">解析：</b><br>${question.analysis || FXConstants.fallbackAnalysis}</div>`;

        card.innerHTML = `
            <div class="q-card-header">
                <div class="q-card-meta">${FXConstants.getSessionLabel(question.session)} / 題號 ${question.id}</div>
                <button class="remove-btn" type="button">移除</button>
            </div>
            <div class="q-card-text">${question.text}</div>
            <div class="options-list">${optionsHTML}</div>
            ${analysisHTML}
            <button class="ask-gemini-card-btn" type="button">問 Gemini</button>
        `;

        card.querySelector('.remove-btn').addEventListener('click', () => {
            removeItem(currentTab, ref.session, ref.id);
        });

        card.querySelector('.ask-gemini-card-btn').addEventListener('click', () => {
            openGemini(question);
        });

        container.appendChild(card);
    });
}

function removeItem(sub, session, id) {
    const saved = FXStorage.getSavedQuestions();
    saved[sub] = (saved[sub] || []).filter((item) =>
        !(String(item.id) === String(id) && String(item.session) === String(session))
    );
    FXStorage.setSavedQuestions(saved);
    updateCounts();
    renderList();
}

function clearCurrentTab() {
    const subjectName = FXConstants.getSubjectLabel(currentTab);
    if (!confirm(`確定要清空「${subjectName}」的收藏題目嗎？`)) return;

    const saved = FXStorage.getSavedQuestions();
    saved[currentTab] = [];
    FXStorage.setSavedQuestions(saved);
    updateCounts();
    renderList();
}

function startPractice() {
    const saved = FXStorage.getSavedQuestions();
    const refs = saved[currentTab] || [];
    if (!refs.length) return;

    FXStorage.setSavedPracticeQueue({ sub: currentTab, refs });
    window.location.href = `exam.html?s=saved&sub=${currentTab}&m=practice`;
}

function openGemini(question) {
    const key = `${question.session}_${question.id}`;
    FXCommon.openDrawer();

    if (geminiCurrentKey === key) return;

    geminiCurrentKey = key;
    geminiHistory = [];
    document.getElementById('chat-body').innerHTML = '';

    const prompt = FXCommon.buildQuestionPrompt({
        questionText: question.text,
        options: question.options,
        answerIndex: question.answer,
        mode: 'practice'
    });

    callGemini(prompt);
}

function closeGemini() {
    FXCommon.closeDrawer();
}

function appendMsg(role, text) {
    return FXCommon.appendMsg(document.getElementById('chat-body'), role, text);
}

function typewriterMsg(text) {
    FXCommon.typewriterMsg(document.getElementById('chat-body'), text);
}

async function callGemini(userText) {
    geminiLoading = true;

    await FXCommon.requestGemini({
        bodyEl: document.getElementById('chat-body'),
        sendBtn: document.getElementById('chat-send'),
        inputEl: document.getElementById('chat-input'),
        history: geminiHistory,
        userText,
        temperature: 0.2,
        maxOutputTokens: 280,
        onReply: (reply) => typewriterMsg(reply),
        onError: (message) => appendMsg('gemini', `${FXConstants.gemini.errorPrefix}${message}`),
        onFinally: () => {
            geminiLoading = false;
            document.getElementById('chat-input').focus();
        }
    });
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || geminiLoading) return;

    input.value = '';
    appendMsg('user', text);
    await callGemini(text);
}

function bindUI() {
    document.getElementById('clear-current-tab-btn').addEventListener('click', clearCurrentTab);
    document.getElementById('start-practice-btn').addEventListener('click', startPractice);
    document.getElementById('close-gemini-btn').addEventListener('click', closeGemini);
    document.getElementById('chat-send').addEventListener('click', sendChat);
    FXCommon.bindEnterToSend(document.getElementById('chat-input'), sendChat);
    document.querySelectorAll('.tab').forEach((button) => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
}

function initPage() {
    buildIndex();
    bindUI();
    updateCounts();
    renderList();
}

window.onload = initPage;
