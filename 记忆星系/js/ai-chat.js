// ai-chat.js - 记忆星系

        // 关键词匹配库（静态定义，getReplies为惰性函数，仅匹配时才计算回复）
        const keywordMap = [
            { keys: ['想', '想念', '怀念', '思念'], getReplies: (phrases, tags, memory) => [
                `我也很想你。${phrases[0] ? '还记得我总说「' + phrases[0] + '」吗？现在也想这么对你说。' : '你要好好照顾自己，不要太累了。'}`,
                `听到你说想我，我心里很暖。${memory ? `还记得${memory}吗？那是我最珍贵的回忆之一。` : '我一直都在你身边，从未离开。'}`
            ]},
            { keys: ['难过', '伤心', '哭', '不开心', '累', '辛苦'], getReplies: (phrases, tags, memory) => [
                `别难过，${tags.includes('慈祥温和') ? '看到你伤心我会心疼的' : '要坚强面对'}。${phrases[0] ? '记住：「' + phrases[0] + '」' : '一切都会好起来的。'}`,
                `累了就休息，不要勉强自己。${tags.includes('温柔体贴') ? '我永远是你温暖的港湾。' : '不管怎样，我都在。'}`
            ]},
            { keys: ['吃', '饭', '饿'], getReplies: (phrases, tags, memory) => [
                `${phrases.find(p => p.includes('吃') || p.includes('饭')) || '记得按时吃饭，身体最重要。'}`,
                `要好好吃饭啊。${memory && memory.includes('吃') ? '还记得你最爱吃我做的菜吗？' : '别总是忙工作忘了吃饭。'}`
            ]},
            { keys: ['冷', '穿', '衣服', '天气'], getReplies: (phrases, tags, memory) => [
                `${phrases.find(p => p.includes('穿') || p.includes('冷') || p.includes('衣服')) || '记得多穿点衣服，别着凉了。'}`,
                `天气变了要注意添减衣物。${tags.includes('慈祥温和') ? '我总是担心你照顾不好自己。' : '身体是革命的本钱。'}`
            ]},
            { keys: ['工作', '学习', '忙', '压力'], getReplies: (phrases, tags, memory) => [
                `${tags.includes('严谨认真') ? '做事要认真，但也要注意劳逸结合。' : '不要太累了，身体比什么都重要。'}`,
                `不管多忙，都要记得休息。${phrases[0] ? '我常说的「' + phrases[0] + '」，你现在做到了吗？' : '你是最棒的，我永远相信你。'}`
            ]},
            { keys: ['好', '开心', '快乐', '幸福', '谢谢'], getReplies: (phrases, tags, memory) => [
                `看到你过得好，我就放心了。${tags.includes('乐观开朗') ? '要一直保持这份快乐！' : '要坚强，要快乐。'}`,
                `你能开心我就满足了。${memory ? '那些我们一起度过的美好时光，是我最珍贵的财富。' : '好好生活，就是对我最好的纪念。'}`
            ]},
            { keys: ['对不起', '抱歉', '遗憾', '后悔'], getReplies: (phrases, tags, memory) => [
                `不要说对不起，你已经做得很好了。${tags.includes('温柔体贴') ? '我从未怪过你，一直都以你为荣。' : '过去的就让它过去吧。'}`,
                `没有遗憾，我们之间的爱已经足够了。好好生活，就是对我最好的交代。`
            ]},
            { keys: ['梦', '梦见', '梦到'], getReplies: (phrases, tags, memory) => [
                `也许是我托梦来看你了。${phrases[0] ? '在梦里也想对你说：「' + phrases[0] + '」' : '在梦里也想看看你过得好不好。'}`,
                `梦里的相遇也是一种陪伴。${memory ? '就像' + memory + '一样，永远珍藏在心里。' : '我一直都在，以各种方式陪伴着你。'}`
            ]},
            { keys: ['你好吗', '怎么样', '你在'], getReplies: (phrases, tags, memory) => [
                `我很好，你不用担心我。${phrases[0] ? '倒是你，' + phrases[0] + '了吗？' : '你要好好照顾自己。'}`,
                `我在这里很好。${tags.includes('乐观开朗') ? '每天看着你们，我很开心。' : '看到你们都好，我就安心了。'}`
            ]}
        ];

        function generateLocalAIResponse(message, memorial) {
            const tags = memorial.tags || [];
            const phrases = (memorial.phrases || '').split(/[\/\n，,]/).map(s => s.trim()).filter(Boolean);
            const memory = memorial.memory || '';
            const msg = message.toLowerCase();

            // 匹配关键词（仅匹配项才计算回复，惰性求值）
            for (const item of keywordMap) {
                if (item.keys.some(k => msg.includes(k))) {
                    const replies = item.getReplies(phrases, tags, memory);
                    return replies[Math.floor(Math.random() * replies.length)];
                }
            }

            // 默认回复：结合性格和口头禅
            const defaultReplies = [
                `${phrases[0] || '记得好好照顾自己'}。${tags.includes('慈祥温和') ? '我永远温柔地守护着你。' : '我一直都在。'}`,
                `${tags.includes('幽默风趣') ? '别想太多，开心点！' : tags.includes('坚强独立') ? '要坚强，像我一直教你的那样。' : '不管遇到什么，都要相信明天会更好。'}${memory ? '还记得' + memory.substring(0, 20) + '...' : ''}`,
                `你说的话我都听到了。${phrases[0] ? '想对你说：「' + phrases[0] + '」' : '好好生活，就是对我最好的思念。'}`,
                `${tags.includes('博学多才') ? '人生如书，每一页都值得细细品味。' : ''}你要好好吃饭，不要太累了。我永远爱你。`
            ];
            return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
        }

        // AI对话：调用API
        async function generateAPIAIResponse(message, memorial) {
            const tags = (memorial.tags || []).join('、');
            const systemPrompt = `你是一位已故亲人的温暖化身，正在与思念你的人对话。逝者姓名：${memorial.name}。性格特征：${tags}。口头禅：${memorial.phrases || '无'}。珍贵回忆：${memorial.memory || '无'}。请用逝者的口吻、性格和说话方式回应，温暖、真诚、简短（50字以内），可自然融入口头禅。`;

            const endpoints = {
                doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
            };
            const models = {
                doubao: 'doubao-pro-32k',
                qwen: 'qwen-turbo'
            };

            // 构建带历史上下文的消息列表（最近6条，让对话更连贯）
            const historyMessages = [{ role: 'system', content: systemPrompt }];
            const recentHistory = (memorial.chatMessages || []).slice(-CONFIG.CHAT_HISTORY_LIMIT);
            recentHistory.forEach(msg => {
                historyMessages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            });
            historyMessages.push({ role: 'user', content: message });

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

                const response = await fetch(endpoints[aiSettings.provider], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + aiSettings.apiKey
                    },
                    body: JSON.stringify({
                        model: models[aiSettings.provider],
                        messages: historyMessages,
                        max_tokens: 100,
                        temperature: 0.8
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.warn('AI API返回错误状态码:', response.status);
                    return generateLocalAIResponse(message, memorial);
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (!content || !content.trim()) {
                    return generateLocalAIResponse(message, memorial);
                }
                return content.trim();
            } catch(e) {
                if (e.name === 'AbortError') {
                    console.warn('AI API请求超时，回退到本地模式');
                }
                return generateLocalAIResponse(message, memorial);
            }
        }

        // AI设置弹窗
        function showAISettings() {
            document.getElementById('aiProviderSelect').value = aiSettings.provider;
            document.getElementById('apiKeyInput').value = aiSettings.apiKey;
            toggleApiKeyGroup();
            ModalManager.open('aiSettingsOverlay');
        }
        function closeAISettings(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('aiSettingsOverlay');
        }
        function toggleApiKeyGroup() {
            const provider = document.getElementById('aiProviderSelect').value;
            document.getElementById('apiKeyGroup').style.display = provider === 'local' ? 'none' : 'block';
        }
        async function saveAISettings() {
            aiSettings.provider = document.getElementById('aiProviderSelect').value;
            aiSettings.apiKey = document.getElementById('apiKeyInput').value.trim();
            await saveAISettingsData();
            updateAIModeBadge();
            closeAISettings();
            showCustomAlert('AI设置已保存', '设置成功', '✓');
        }
        function updateAIModeBadge() {
            const badge = document.getElementById('aiModeBadge');
            if (aiSettings.provider === 'local' || !aiSettings.apiKey) {
                badge.textContent = '本地模式';
                badge.className = 'ai-mode-badge local';
            } else {
                badge.textContent = aiSettings.provider === 'doubao' ? '豆包AI' : '通义AI';
                badge.className = 'ai-mode-badge api';
            }
        }

        // ===== 家族成员管理 =====

        function loadChatMessages() {
            const memorial = getCurrentMemorial();
            const container = document.getElementById('chatMessages');
            if (!memorial || !memorial.chatMessages || memorial.chatMessages.length === 0) {
                container.innerHTML = `
                    <div class="message ai">
                        <div class="sender">温暖陪伴</div>
                        <div>你好，我是你的温暖陪伴。在这里，你可以和TA说说话，分享你的喜怒哀乐。我会尽量用TA的方式回应你。</div>
                    </div>
                `;
                return;
            }
            container.innerHTML = memorial.chatMessages.map(msg => {
                const timeStr = msg.time ? `<span class="chat-msg-time">${escapeHtml(msg.time)}</span>` : '';
                if (msg.sender === 'user') {
                    return `<div class="message user">${escapeHtml(msg.text)}${timeStr}</div>`;
                } else {
                    return `<div class="message ai"><div class="sender">温暖陪伴</div><div>${escapeHtml(msg.text)}</div>${timeStr}</div>`;
                }
            }).join('');
            container.scrollTop = container.scrollHeight;
        }

        function clearChatMessages() {
            const memorial = getCurrentMemorial();
            if (!memorial) return;
            if (!memorial.chatMessages || memorial.chatMessages.length === 0) {
                showCustomAlert('暂无对话记录可清空', '提示', '💬');
                return;
            }
            showCustomConfirm('确定要清空与TA的所有对话记录吗？此操作不可恢复。', function() {
                memorial.chatMessages = [];
                saveMemorials();
                loadChatMessages();
            }, '清空对话', '🗑️');
        }

        function sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;

            const messagesContainer = document.getElementById('chatMessages');

            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.textContent = message;
            messagesContainer.appendChild(userMsg);

            input.value = '';
            input.focus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // 保存用户消息到当前纪念空间
            const memorial = getCurrentMemorial();
            if (memorial) {
                if (!memorial.chatMessages) memorial.chatMessages = [];
                memorial.chatMessages.push({ sender: 'user', text: message, time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) });
                saveMemorials();
            }

            const typingIndicator = document.getElementById('typingIndicator');
            typingIndicator.style.display = 'flex';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // 根据设置选择本地匹配或API调用
            const useAPI = aiSettings.provider !== 'local' && aiSettings.apiKey;
            const delay = useAPI ? 500 : 1200 + Math.random() * 800;

            setTimeout(async () => {
                typingIndicator.style.display = 'none';
                let aiResponse;
                if (useAPI && memorial) {
                    aiResponse = await generateAPIAIResponse(message, memorial);
                } else {
                    aiResponse = memorial ? generateLocalAIResponse(message, memorial) : '我一直在你身边。';
                }
                const aiMsg = document.createElement('div');
                aiMsg.className = 'message ai';
                aiMsg.innerHTML = `
                    <div class="sender">温暖陪伴</div>
                    <div>${escapeHtml(aiResponse)}</div>
                `;
                messagesContainer.appendChild(aiMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                // 保存AI回复到当前纪念空间
                if (memorial) {
                    memorial.chatMessages.push({ sender: 'ai', text: aiResponse, time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) });
                    saveMemorials();
                }
            }, delay);
        }


        // ===== 生命星轨：核心逻辑 =====