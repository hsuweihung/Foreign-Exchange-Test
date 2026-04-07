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

    compactReply(text, { maxChars = 220, maxLines = 6 } = {}) {
        if (!text) return FXConstants.gemini.noReply;

        const normalized = text
            .replace(/\r/g, '')
            .replace(/#{1,6}\s*/g, '')
            .replace(/\*\*/g, '')
            .replace(/^\s*[-*]\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        const lines = normalized
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, maxLines);

        let compact = lines.join('\n');
        if (compact.length > maxChars) {
            compact = `${compact.slice(0, maxChars).trim()}...`;
        }

        return compact || FXConstants.gemini.noReply;
    },

    buildQuestionPrompt({ questionText, options, answerIndex, mode, detailLevel = 'summary' }) {
        const labels = FXConstants.getOptionLabels();
        const optionText = options.map((option, index) => `${labels[index]} ${option}`).join('\n');

        if (mode === 'exam') {
            if (detailLevel === 'full') {
                return [
                    '你是外匯考試教練。請用繁體中文說明解題方向、判斷依據與容易混淆的地方。',
                    '不要直接只丟結論，請像在帶學生一樣說明，但篇幅控制在重點範圍內。',
                    '可以分成 3 段：判斷重點、容易誤判處、作答提醒。',
                    '不要直接公布正確答案代號。',
                    `題目：${questionText}`,
                    `選項：\n${optionText}`
                ].join('\n\n');
            }
            return [
                '你是外匯考試教練。請用繁體中文回答，而且只給精簡摘要。',
                '格式固定為 3 點：',
                '1. 判斷方向',
                '2. 易錯點',
                '3. 作答提醒',
                '每點 1 句，不要超過 20 字，不要直接公布正確答案，不要寫長篇解析。',
                `題目：${questionText}`,
                `選項：\n${optionText}`
            ].join('\n\n');
        }

        if (detailLevel === 'full') {
            return [
                '你是外匯考試教練。請用繁體中文說明正確答案、判斷依據與容易混淆的地方。',
                '請以教學口吻回答，但避免冗長鋪陳；重點要完整、可讀。',
                '建議分成 3 段：正確觀念、為什麼容易錯、實戰判斷方式。',
                `題目：${questionText}`,
                `選項：\n${optionText}`,
                `正確答案：${labels[answerIndex]} ${options[answerIndex]}`
            ].join('\n\n');
        }

        return [
            '你是外匯考試教練。請用繁體中文回答，而且只給精簡摘要。',
            '格式固定為 3 點：',
            '1. 正確觀念',
            '2. 易錯點',
            '3. 判斷口訣',
            '每點 1 到 2 句，不要超過 60 字，不要重寫題目，不要長篇教學。',
            `題目：${questionText}`,
            `選項：\n${optionText}`,
            `正確答案：${labels[answerIndex]} ${options[answerIndex]}`
        ].join('\n\n');
    },

    buildWeaknessPrompt({ subjectName, wrongTexts }) {
        return [
            `你是 ${subjectName} 的考前教練。`,
            '請用繁體中文做精簡摘要，不要長篇說明。',
            '請整理為 3 點：',
            '1. 最常見的弱點',
            '2. 建議優先補強的觀念',
            '3. 下次作答提醒',
            '每點最多 2 句。',
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
        transformReply,
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

            const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || FXConstants.gemini.noReply;
            const reply = transformReply ? transformReply(rawReply) : rawReply;
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
