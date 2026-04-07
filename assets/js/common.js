const FXCommon = {
    openDrawer(drawerId = 'gemini-drawer') {
        document.getElementById(drawerId)?.classList.add('open');
    },

    closeDrawer(drawerId = 'gemini-drawer') {
        document.getElementById(drawerId)?.classList.remove('open');
    },

    appendMsg(bodyEl, role, text) {
        const div = document.createElement('div');
        div.className = role === 'user' ? 'msg-user' : 'msg-gemini';
        div.textContent = text;
        bodyEl.appendChild(div);
        bodyEl.scrollTop = bodyEl.scrollHeight;
        return div;
    },

    appendLoading(bodyEl, text = FXConstants.gemini.loading) {
        const div = document.createElement('div');
        div.className = 'msg-loading';
        div.innerHTML = `<div class="dot-bounce"><span></span><span></span><span></span></div> ${text}`;
        bodyEl.appendChild(div);
        bodyEl.scrollTop = bodyEl.scrollHeight;
        return div;
    },

    typewriterMsg(bodyEl, text, speedFactor = 120) {
        const div = document.createElement('div');
        div.className = 'msg-gemini';
        bodyEl.appendChild(div);

        let i = 0;
        const step = Math.max(1, Math.floor(text.length / speedFactor));
        const timer = setInterval(() => {
            i += step;
            div.textContent = text.slice(0, i);
            bodyEl.scrollTop = bodyEl.scrollHeight;
            if (i >= text.length) {
                div.textContent = text;
                clearInterval(timer);
            }
        }, 16);

        return div;
    },

    bindEnterToSend(inputEl, handler) {
        inputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handler();
            }
        });
    },

    buildQuestionPrompt({ questionText, options, answerIndex, mode }) {
        const labels = FXConstants.getOptionLabels();
        const optionText = options.map((option, index) => `${labels[index]} ${option}`).join('\n');

        if (mode === 'exam') {
            return [
                '你是外匯考試教練。請只提供解題方向與判斷重點，不要直接公布正確答案。',
                `題目：${questionText}`,
                `選項：\n${optionText}`
            ].join('\n\n');
        }

        return [
            '你是外匯考試教練。請用繁體中文說明正確答案、判斷依據與容易混淆的地方。',
            `題目：${questionText}`,
            `選項：\n${optionText}`,
            `正確答案：${labels[answerIndex]} ${options[answerIndex]}`
        ].join('\n\n');
    },

    buildWeaknessPrompt({ subjectName, wrongTexts }) {
        return [
            `你是 ${subjectName} 的考前教練。`,
            '請根據以下錯題整理：',
            '1. 最常見的弱點類型',
            '2. 建議加強的觀念',
            '3. 接下來練習時要特別注意的判斷方式',
            '',
            wrongTexts.join('\n')
        ].join('\n');
    },

    async requestGemini({
        bodyEl,
        sendBtn,
        inputEl,
        history,
        userText,
        onLoadingText = FXConstants.gemini.loading,
        temperature = 0.4,
        maxOutputTokens = 2048,
        onReply,
        onError,
        onFinally
    }) {
        if (sendBtn) sendBtn.disabled = true;
        if (inputEl) inputEl.disabled = true;

        history.push({ role: 'user', parts: [{ text: userText }] });
        const loader = this.appendLoading(bodyEl, onLoadingText);

        try {
            const response = await fetch(FXConstants.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: history.filter((item) => item.role && item.parts),
                    generationConfig: { temperature, maxOutputTokens }
                })
            });

            const data = await response.json();
            loader.remove();

            if (data.error) {
                history.pop();
                onError?.(data.error.message || FXConstants.gemini.noReply);
                return;
            }

            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || FXConstants.gemini.noReply;
            history.push({ role: 'model', parts: [{ text: reply }] });
            onReply?.(reply);
        } catch (error) {
            loader.remove();
            history.pop();
            onError?.(error.message || FXConstants.gemini.noReply);
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            if (inputEl) inputEl.disabled = false;
            onFinally?.();
        }
    }
};

window.FXCommon = FXCommon;
