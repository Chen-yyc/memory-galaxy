// orbit.js - 记忆星系


        // --- 星轨渲染 ---
        function renderOrbit() {
            const memorial = getCurrentMemorial();
            const orbit = getCurrentOrbitData();
            const scene = document.getElementById('orbitScene');
            const emptyEl = document.getElementById('orbitEmpty');
            const nameEl = document.getElementById('orbitCenterName');

            if (nameEl) nameEl.textContent = memorial ? memorial.name : 'TA';

            // 清除旧星点
            scene.querySelectorAll('.orbit-point').forEach(p => p.remove());

            if (!orbit || (orbit.fragments.length === 0 && orbit.chapters.length === 0)) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }
            if (emptyEl) emptyEl.style.display = 'none';

            // 合并所有星点：章节（大星点）+ 未编织碎片（小星点）+ 已编织碎片（暗星点）
            const allPoints = [];

            // 章节作为大星点
            orbit.chapters.forEach(ch => {
                allPoints.push({ type: 'chapter', data: ch, createdAt: ch.createdAt });
            });

            // 碎片作为小/暗星点
            orbit.fragments.forEach(frag => {
                allPoints.push({
                    type: frag.woven ? 'woven' : 'fragment',
                    data: frag,
                    createdAt: frag.createdAt
                });
            });

            // 按时间排序
            allPoints.sort((a, b) => a.createdAt - b.createdAt);

            // 计算每个星点在轨道上的位置
            const total = allPoints.length;
            const radius = 44; // 百分比半径

            allPoints.forEach((point, index) => {
                // 从顶部（12点钟）开始，顺时针排列
                const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                const el = document.createElement('div');
                el.className = 'orbit-point ' + point.type;
                el.style.left = x + '%';
                el.style.top = y + '%';
                el.style.transform = 'translate(-50%, -50%)';

                // tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'orbit-tooltip';
                if (point.type === 'chapter') {
                    tooltip.textContent = point.data.title;
                } else {
                    tooltip.textContent = point.data.rawContent.substring(0, 30) + (point.data.rawContent.length > 30 ? '...' : '');
                }
                el.appendChild(tooltip);

                el.onclick = function() { showOrbitDetail(point.type, point.data); };
                scene.appendChild(el);
            });
        }

        // --- 采编对话 ---
        function startOrbitChat() {
            const memorial = getCurrentMemorial();
            if (!memorial) {
                showCustomAlert('请先选择一个纪念空间', '需要选择', '⭐');
                showPage('memorial');
                return;
            }

            // 初始化采编状态
            orbitChatState = {
                memorialId: memorial.id,
                theme: null,
                fragments: [],   // 本次采编收集的片段
                followUpCount: 0,
                phase: 'opening' // opening | collecting | ending
            };

            const messagesEl = document.getElementById('orbitChatMessages');
            messagesEl.innerHTML = '';
            ModalManager.open('orbitDrawerOverlay');

            // AI 选主题开场
            sendOrbitAIOpening();
        }

        async function sendOrbitAIOpening() {
            const messagesEl = document.getElementById('orbitChatMessages');
            const memorial = getCurrentMemorial();
            const orbit = getCurrentOrbitData();

            // 已聊过的主题
            const usedThemes = orbit.fragments.map(f => f.theme);
            const availableThemes = ORBIT_THEMES.filter(t => !usedThemes.includes(t));

            showOrbitTyping();

            const useAPI = aiSettings.provider !== 'local' && aiSettings.apiKey;
            let opener = '';

            if (useAPI) {
                try {
                    opener = await callOrbitAI('opening', {
                        memorialName: memorial.name,
                        availableThemes: availableThemes.length > 0 ? availableThemes : ORBIT_THEMES
                    });
                    // 解析 theme
                    const themeMatch = opener.match(/【主题】(.+?)【/);
                    const contentMatch = opener.match(/【内容】(.+)/s);
                    if (themeMatch) orbitChatState.theme = themeMatch[1].trim();
                    opener = contentMatch ? contentMatch[1].trim() : opener;
                } catch(e) {
                    opener = getFallbackOpener();
                }
            } else {
                opener = getFallbackOpener();
            }

            hideOrbitTyping();
            appendOrbitMessage('ai', opener);
            orbitChatState.phase = 'collecting';
        }

        function getFallbackOpener() {
            const orbit = getCurrentOrbitData();
            const usedThemes = orbit.fragments.map(f => f.theme);
            const availableThemes = ORBIT_THEMES.filter(t => !usedThemes.includes(t));
            if (availableThemes.length > 0) {
                orbitChatState.theme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
            } else {
                orbitChatState.theme = ORBIT_THEMES[Math.floor(Math.random() * ORBIT_THEMES.length)];
            }
            return ORBIT_FALLBACK_OPENERS[Math.floor(Math.random() * ORBIT_FALLBACK_OPENERS.length)];
        }

        async function sendOrbitMessage() {
            const input = document.getElementById('orbitChatInput');
            const message = input.value.trim();
            if (!message || !orbitChatState) return;

            appendOrbitMessage('user', message);
            orbitChatState.fragments.push(message);
            input.value = '';
            input.style.height = 'auto';

            // 禁用发送按钮
            document.getElementById('orbitSendBtn').disabled = true;

            showOrbitTyping();

            const useAPI = aiSettings.provider !== 'local' && aiSettings.apiKey;
            let aiResponse = '';

            if (useAPI) {
                try {
                    aiResponse = await callOrbitAI('followup', {
                        memorialName: getCurrentMemorial().name,
                        theme: orbitChatState.theme,
                        userMessage: message,
                        followUpCount: orbitChatState.followUpCount
                    });
                } catch(e) {
                    aiResponse = "我刚刚没接上，你可以继续说，或者我们换个话题。";
                }
            } else {
                // 离线模式：1轮后直接收尾
                if (orbitChatState.followUpCount >= 1) {
                    aiResponse = "这些我都记下了。要不要再聊一段，还是先到这里？";
                    orbitChatState.phase = 'ending';
                } else {
                    aiResponse = "听起来很珍贵。能再多说一点吗？比如当时的场景或者你的感受。";
                }
            }

            hideOrbitTyping();
            appendOrbitMessage('ai', aiResponse);

            orbitChatState.followUpCount++;

            // 判断是否进入收尾阶段
            if (orbitChatState.followUpCount >= 2 && orbitChatState.phase !== 'ending') {
                orbitChatState.phase = 'ending';
            }

            document.getElementById('orbitSendBtn').disabled = false;
        }

        function endOrbitChat() {
            if (!orbitChatState || orbitChatState.fragments.length === 0) {
                closeOrbitDrawer();
                return;
            }

            // 保存碎片
            const memorial = getCurrentMemorial();
            const orbit = getCurrentOrbitData();

            const fragment = {
                id: 'frag_' + Date.now(),
                memorialId: memorial.id,
                theme: orbitChatState.theme || '生命概览',
                rawContent: orbitChatState.fragments.join('\n'),
                fragments: [...orbitChatState.fragments],
                mood: '',
                createdAt: Date.now(),
                woven: false
            };

            orbit.fragments.push(fragment);
            saveOrbitData(memorial.id);

            // 检查是否需要自动编织
            checkAutoWeave(fragment.theme);

            closeOrbitDrawer();
            renderOrbit();
            renderOrbitList();

            showCustomAlert('一段新的回忆已收入星轨', '回忆已保存', '✨');
        }

        function closeOrbitDrawer(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('orbitDrawerOverlay');
            orbitChatState = null;
        }

        // --- AI 调用 ---
        async function callOrbitAI(type, params) {
            const endpoints = {
                doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
            };
            const models = {
                doubao: 'doubao-pro-32k',
                qwen: 'qwen-turbo'
            };

            let systemPrompt = '';
            let userPrompt = '';

            if (type === 'opening') {
                systemPrompt = `你是一位温柔的回忆采集者，正在帮助用户收集关于逝去亲人${params.memorialName}的回忆。你的任务：从以下主题中选一个用户还没聊过的维度，用一个温柔、有画面感的开场白引导用户回忆。开场白不超过2句话，不要问"请讲讲TA"这种空泛问题，要给一个具体的切入点。回复格式：【主题】主题名【内容】开场白`;
                userPrompt = `可选主题：${params.availableThemes.join('、')}`;
            } else if (type === 'followup') {
                systemPrompt = `你是一位温柔的回忆采集者。用户正在分享关于逝去亲人${params.memorialName}的回忆，当前主题是「${params.theme}」。规则：只基于用户已说的内容追问一个具体细节，不引入新主题；聚焦感官细节、具体场景、情感瞬间；一次只问一个问题；语气温柔不催促，不评判，不做心理疏导；如果已追问${params.followUpCount}轮（≥2轮），改为温柔收尾："这些我都记下了。要不要再聊一段，还是先到这里？"。回复只包含要发给用户的话，不超过50字。`;
                userPrompt = `用户说：${params.userMessage}`;
            } else if (type === 'weave') {
                systemPrompt = `你是一位温柔的传记写作者。请把用户提供的关于逝者${params.memorialName}的回忆碎片，编织成一篇300-500字的叙事散文。规则：只用提供的素材，绝不添加虚构细节；叙事而非罗列，有场景感和情感流动；第三人称，温柔克制的笔触；生成一个贴合内容的标题。${params.existingContent ? '这是已有章节，请在原有基础上自然延伸续写，不重复已写内容。' : ''}回复格式：{"title":"标题","content":"正文"}`;
                userPrompt = `回忆碎片：\n${params.fragments.map((f, i) => (i+1) + '. ' + f).join('\n')}${params.existingContent ? '\n\n已有章节正文：\n' + params.existingContent : ''}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.ORBIT_API_TIMEOUT);

            const response = await fetch(endpoints[aiSettings.provider], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + aiSettings.apiKey
                },
                body: JSON.stringify({
                    model: models[aiSettings.provider],
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: type === 'weave' ? 800 : 150,
                    temperature: 0.8
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('API error: ' + response.status);
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content || !content.trim()) throw new Error('Empty response');
            return content.trim();
        }

        // --- 编织章节 ---
        async function checkAutoWeave(theme) {
            const orbit = getCurrentOrbitData();
            const unwovenFragments = orbit.fragments.filter(f => f.theme === theme && !f.woven);

            if (unwovenFragments.length >= 3) {
                await weaveChapter(theme, false);
            }
        }

        async function weaveChapter(theme, isManual) {
            const memorial = getCurrentMemorial();
            const orbit = getCurrentOrbitData();
            const unwovenFragments = orbit.fragments.filter(f => f.theme === theme && !f.woven);

            if (unwovenFragments.length === 0) {
                showCustomAlert('该主题还没有可编织的碎片', '无法编织', '⚠️');
                return;
            }

            // 查找已有章节（续写）
            const existingChapter = orbit.chapters.find(c => c.theme === theme);
            const fragmentTexts = unwovenFragments.map(f => f.rawContent);

            // 显示编织中动画
            showOrbitWeavingIndicator(theme);

            const useAPI = aiSettings.provider !== 'local' && aiSettings.apiKey;
            let title, content;

            if (useAPI) {
                try {
                    const result = await callOrbitAI('weave', {
                        memorialName: memorial.name,
                        fragments: fragmentTexts,
                        existingContent: existingChapter ? existingChapter.content : null
                    });

                    // 尝试解析 JSON
                    try {
                        const parsed = JSON.parse(result);
                        title = parsed.title;
                        content = parsed.content;
                    } catch(e) {
                        // 解析失败，尝试提取
                        title = theme;
                        content = result;
                    }
                } catch(e) {
                    hideOrbitWeavingIndicator();
                    showCustomAlert('编织暂时没成功，稍后再试', '编织失败', '⚠️');
                    return;
                }
            } else {
                // 离线降级：碎片拼接
                title = theme;
                content = fragmentTexts.join('\n\n');
                if (existingChapter) {
                    content = existingChapter.content + '\n\n' + content;
                }
            }

            // 标记碎片为已编织
            const wovenIds = unwovenFragments.map(f => f.id);
            orbit.fragments.forEach(f => {
                if (wovenIds.includes(f.id)) f.woven = true;
            });

            if (existingChapter) {
                // 续写
                existingChapter.content = content;
                existingChapter.title = title;
                existingChapter.sourceFragmentIds = [...new Set([...existingChapter.sourceFragmentIds, ...wovenIds])];
                existingChapter.updatedAt = Date.now();
            } else {
                // 新建章节
                orbit.chapters.push({
                    id: 'chap_' + Date.now(),
                    memorialId: memorial.id,
                    theme: theme,
                    title: title,
                    content: content,
                    sourceFragmentIds: wovenIds,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }

            saveOrbitData(memorial.id);
            hideOrbitWeavingIndicator();
            renderOrbit();
            renderOrbitList();

            if (isManual) {
                showCustomAlert('章节已编织完成', '编织成功', '📖');
            }
        }

        function showOrbitWeavingIndicator(theme) {
            // 在轨道上找到该主题的碎片，添加编织动画
            const orbit = getCurrentOrbitData();
            const unwovenFrags = orbit.fragments.filter(f => f.theme === theme && !f.woven);
            // 简单提示
            const scene = document.getElementById('orbitScene');
            const indicator = document.createElement('div');
            indicator.id = 'orbitWeavingIndicator';
            indicator.className = 'orbit-empty';
            indicator.style.pointerEvents = 'none';
            indicator.style.color = 'var(--gold)';
            indicator.innerHTML = '编织中…<br>回忆正在汇聚成章';
            scene.appendChild(indicator);
        }

        function hideOrbitWeavingIndicator() {
            const indicator = document.getElementById('orbitWeavingIndicator');
            if (indicator) indicator.remove();
        }

        // --- 星点详情 ---
        function showOrbitDetail(type, data) {
            const contentEl = document.getElementById('orbitDetailContent');
            const memorial = getCurrentMemorial();
            const date = new Date(data.createdAt).toLocaleDateString('zh-CN');

            if (type === 'chapter') {
                contentEl.innerHTML = `
                    <div class="orbit-detail-theme">${escapeHtml(data.theme)}</div>
                    <h3>${escapeHtml(data.title)}</h3>
                    <div class="orbit-detail-meta">编织于 ${date} · 关联 ${data.sourceFragmentIds.length} 段回忆</div>
                    <div class="orbit-detail-content" id="orbitChapterContent">${escapeHtml(data.content)}</div>
                    <div class="orbit-detail-actions">
                        <button class="btn btn-secondary" onclick="closeOrbitDetail()">关闭</button>
                        <button class="btn btn-secondary" onclick="editOrbitChapter('${data.id}')">编辑</button>
                        <button class="btn btn-secondary" onclick="regenerateOrbitChapter('${data.id}')">重新生成</button>
                        <button class="btn btn-secondary" style="color:rgba(224,100,100,0.8);" onclick="deleteOrbitChapter('${data.id}')">删除</button>
                    </div>
                `;
            } else {
                const orbit = getCurrentOrbitData();
                const chapter = orbit.chapters.find(c => c.sourceFragmentIds.includes(data.id));
                const weaveBtn = chapter
                    ? `<button class="btn btn-secondary" onclick="closeOrbitDetail()">关闭</button>`
                    : `<button class="btn btn-primary" onclick="weaveChapter('${data.theme}', true); closeOrbitDetail();">编织成章</button>`;

                contentEl.innerHTML = `
                    <div class="orbit-detail-theme">${escapeHtml(data.theme)}</div>
                    <h3>记忆碎片</h3>
                    <div class="orbit-detail-meta">采集于 ${date}${data.woven ? ' · 已编织' : ''}</div>
                    <div class="orbit-detail-content">${escapeHtml(data.rawContent)}</div>
                    <div class="orbit-detail-actions">
                        <button class="btn btn-secondary" onclick="closeOrbitDetail()">关闭</button>
                        ${weaveBtn}
                    </div>
                `;
            }

            ModalManager.open('orbitDetailOverlay');
        }

        function closeOrbitDetail(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('orbitDetailOverlay');
        }

        function editOrbitChapter(chapterId) {
            const orbit = getCurrentOrbitData();
            const chapter = orbit.chapters.find(c => c.id === chapterId);
            if (!chapter) return;

            const contentDiv = document.getElementById('orbitChapterContent');
            const isEditing = contentDiv.classList.contains('editing');

            if (!isEditing) {
                contentDiv.classList.add('editing');
                contentDiv.contentEditable = true;
                contentDiv.focus();
            } else {
                contentDiv.classList.remove('editing');
                contentDiv.contentEditable = false;
                chapter.content = contentDiv.innerText;
                saveOrbitData(getCurrentMemorial().id);
                showCustomAlert('章节已更新', '保存成功', '✓');
            }
        }

        async function regenerateOrbitChapter(chapterId) {
            const orbit = getCurrentOrbitData();
            const chapter = orbit.chapters.find(c => c.id === chapterId);
            if (!chapter) return;

            // 把关联的碎片标记为未编织，重新编织
            orbit.fragments.forEach(f => {
                if (chapter.sourceFragmentIds.includes(f.id)) f.woven = false;
            });
            orbit.chapters = orbit.chapters.filter(c => c.id !== chapterId);
            saveOrbitData(getCurrentMemorial().id);
            closeOrbitDetail();
            await weaveChapter(chapter.theme, true);
        }

        function deleteOrbitChapter(chapterId) {
            showCustomConfirm('确定删除这个章节吗？关联的碎片会保留为未编织状态。', function() {
                const orbit = getCurrentOrbitData();
                const chapter = orbit.chapters.find(c => c.id === chapterId);
                if (chapter) {
                    orbit.fragments.forEach(f => {
                        if (chapter.sourceFragmentIds.includes(f.id)) f.woven = false;
                    });
                    orbit.chapters = orbit.chapters.filter(c => c.id !== chapterId);
                    saveOrbitData(getCurrentMemorial().id);
                    renderOrbit();
                    renderOrbitList();
                    closeOrbitDetail();
                }
            }, '删除确认', '⚠️');
        }

        // --- 碎片列表视图 ---
        function toggleOrbitListView() {
            const listView = document.getElementById('orbitListView');
            if (listView.classList.contains('show')) {
                listView.classList.remove('show');
            } else {
                renderOrbitList();
                listView.classList.add('show');
            }
        }

        function renderOrbitList() {
            const orbit = getCurrentOrbitData();
            const container = document.getElementById('orbitListContainer');
            if (!orbit || orbit.fragments.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light);font-size:14px;text-align:center;padding:20px;">还没有记忆碎片</p>';
                return;
            }

            container.innerHTML = orbit.fragments.map(frag => `
                <div class="orbit-list-item">
                    <div class="orbit-list-item-content">
                        <div class="orbit-list-item-theme">${escapeHtml(frag.theme)}${frag.woven ? ' · 已编织' : ''}</div>
                        <div class="orbit-list-item-text">${escapeHtml(frag.rawContent.substring(0, 100))}${frag.rawContent.length > 100 ? '...' : ''}</div>
                    </div>
                    <button class="orbit-list-item-delete" onclick="deleteOrbitFragment('${frag.id}')" title="删除">×</button>
                </div>
            `).join('');
        }

        function deleteOrbitFragment(fragmentId) {
            showCustomConfirm('确定删除这段记忆碎片吗？', function() {
                const orbit = getCurrentOrbitData();
                const frag = orbit.fragments.find(f => f.id === fragmentId);
                if (frag && frag.woven) {
                    showCustomAlert('该碎片已编入章节，请先删除关联章节', '无法删除', '⚠️');
                    return;
                }
                orbit.fragments = orbit.fragments.filter(f => f.id !== fragmentId);
                saveOrbitData(getCurrentMemorial().id);
                renderOrbit();
                renderOrbitList();
            }, '删除确认', '⚠️');
        }

        // --- 导出 ---
        function openOrbitExport() {
            const orbit = getCurrentOrbitData();
            const memorial = getCurrentMemorial();
            if (!orbit || orbit.chapters.length === 0) {
                showCustomAlert('还没有编织完成的章节，无法导出', '无法导出', '⚠️');
                return;
            }

            // 按主题顺序排列章节
            const sortedChapters = [...orbit.chapters].sort((a, b) => a.createdAt - b.createdAt);
            let text = `${memorial.name}的生命星轨\n`;
            text += `导出于 ${new Date().toLocaleDateString('zh-CN')}\n`;
            text += `${'='.repeat(40)}\n\n`;

            sortedChapters.forEach((ch, i) => {
                text += `${ch.title}\n`;
                text += `${'-'.repeat(30)}\n`;
                text += `${ch.content}\n\n`;
            });

            document.getElementById('orbitExportText').value = text;
            ModalManager.open('orbitExportOverlay');
        }

        function closeOrbitExport(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('orbitExportOverlay');
        }

        function copyOrbitExport() {
            const text = document.getElementById('orbitExportText');
            text.select();
            try {
                document.execCommand('copy');
                showCustomAlert('已复制到剪贴板', '复制成功', '✓');
            } catch(e) {
                showCustomAlert('请手动选择文本复制', '复制失败', '⚠️');
            }
        }

        // --- 采编对话 UI 辅助 ---
        function appendOrbitMessage(role, text) {
            const messagesEl = document.getElementById('orbitChatMessages');
            const msg = document.createElement('div');
            msg.className = 'orbit-chat-msg ' + role;
            msg.textContent = text;
            messagesEl.appendChild(msg);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function showOrbitTyping() {
            const messagesEl = document.getElementById('orbitChatMessages');
            const existing = document.getElementById('orbitTypingIndicator');
            if (existing) return;
            const typing = document.createElement('div');
            typing.className = 'orbit-chat-typing';
            typing.id = 'orbitTypingIndicator';
            typing.innerHTML = '<span></span><span></span><span></span>';
            messagesEl.appendChild(typing);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function hideOrbitTyping() {
            const typing = document.getElementById('orbitTypingIndicator');
            if (typing) typing.remove();
        }

        // ===== 心愿传承星系 =====