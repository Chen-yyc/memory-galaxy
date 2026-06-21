// utils.js - 记忆星系

        let pendingConfirmCallback = null;

        // ===== 通用弹窗管理器（统一处理打开/关闭、active 类切换、栈式管理、焦点陷阱） =====
        const ModalManager = {
            _stack: [],
            _focusTrapHandler: null,
            _lastFocusedElement: null,
            open(overlayId, options = {}) {
                const overlay = document.getElementById(overlayId);
                if (!overlay) return;
                // 记录当前焦点元素，关闭时恢复
                if (!this._lastFocusedElement) {
                    this._lastFocusedElement = document.activeElement;
                }
                overlay.classList.add('active');
                this._stack.push(overlay);
                // 自动聚焦第一个可交互元素
                if (options.autofocus !== false) {
                    const focusable = overlay.querySelector('input, textarea, select, button:not([aria-label="关闭"])');
                    if (focusable) setTimeout(() => focusable.focus(), 100);
                }
                // 安装焦点陷阱
                this._installFocusTrap(overlay);
            },
            close(overlayId) {
                const overlay = document.getElementById(overlayId);
                if (!overlay) return;
                overlay.classList.remove('active');
                this._stack = this._stack.filter(o => o !== overlay);
                // 如果栈空了，恢复焦点并卸载陷阱
                if (this._stack.length === 0) {
                    this._uninstallFocusTrap();
                }
            },
            closeTop() {
                // 跳过已被其他方式（如 inline onclick）关闭的弹窗
                while (this._stack.length > 0) {
                    const top = this._stack[this._stack.length - 1];
                    if (top.classList.contains('active')) {
                        top.classList.remove('active');
                        this._stack.pop();
                        // 如果栈空了，恢复焦点
                        if (this._stack.length === 0) {
                            this._uninstallFocusTrap();
                        }
                        return true;
                    }
                    this._stack.pop();
                }
                return false;
            },
            _installFocusTrap(overlay) {
                // 卸载旧的陷阱
                this._uninstallFocusTrap();
                this._focusTrapHandler = (e) => {
                    if (e.key !== 'Tab') return;
                    const topOverlay = this._stack[this._stack.length - 1];
                    if (!topOverlay) return;
                    const focusables = topOverlay.querySelectorAll(
                        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusables.length === 0) return;
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    if (e.shiftKey) {
                        if (document.activeElement === first) {
                            e.preventDefault();
                            last.focus();
                        }
                    } else {
                        if (document.activeElement === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                };
                document.addEventListener('keydown', this._focusTrapHandler);
            },
            _uninstallFocusTrap() {
                if (this._focusTrapHandler) {
                    document.removeEventListener('keydown', this._focusTrapHandler);
                    this._focusTrapHandler = null;
                }
                // 恢复焦点到触发元素
                if (this._lastFocusedElement) {
                    try { this._lastFocusedElement.focus(); } catch(e) {}
                    this._lastFocusedElement = null;
                }
            }
        };

        // 全局 ESC 键关闭最上层弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const closed = ModalManager.closeTop();
                // 如果关闭的是 customModalOverlay，清理 confirm callback
                if (closed && pendingConfirmCallback) {
                    pendingConfirmCallback = null;
                }
            }
        });

        // ===== 通用防抖函数 =====
        function debounce(fn, delay) {
            let timer = null;
            return function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }

        // 弹窗图标映射：emoji → SVG线条图标（去除彩色emoji的AI感）
        const alertIconMap = {
            '💾': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
            '📂': '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>',
            '💬': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
            '🗑️': '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
            '🌌': '<circle cx="12" cy="12" r="10"/><path d="M12 6v.01M16 10v.01M8 14v.01M14 16v.01"/>',
            '🕯️': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
            '👨\u200d👩\u200d👧': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
            '⭐': '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
            '💡': '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
            '📸': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/>',
            '🌳': '<path d="M12 2a5 5 0 0 0-5 5 4 4 0 0 0-1 7.9c0 1.5 1 2.8 2.5 3.1M12 2a5 5 0 0 1 5 5 4 4 0 0 1 1 7.9c0 1.5-1 2.8-2.5 3.1M12 14v8"/>',
            '⚠️': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
            '✓': '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'
        };
        function renderAlertIcon(icon) {
            const path = alertIconMap[icon] || alertIconMap['💡'];
            return '<svg class="svg-icon" viewBox="0 0 24 24" style="width:40px;height:40px;color:var(--gold);">' + path + '</svg>';
        }
        // 节日/仪式图标映射：emoji → SVG线条图标
        const ritualIconMap = {
            '🕯️': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
            '🌸': '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
            '🙇': '<circle cx="12" cy="5" r="3"/><path d="M9 8c-2 3-3 6-3 9h12c0-3-1-6-3-9"/><path d="M8 17l-2 4M16 17l2 4"/>',
            '🏮': '<ellipse cx="12" cy="12" rx="6" ry="8"/><path d="M12 2v2M12 20v2M8 12h8"/>',
            '🪔': '<path d="M12 2v6M8 8h8l-2 6a4 4 0 0 1-4 2 4 4 0 0 1-4-2z"/><path d="M9 22h6"/>',
            '🥟': '<path d="M4 12c0-4 4-7 8-7s8 3 8 7c0 0-3 4-8 4s-8-4-8-4z"/><path d="M4 12c2 1 5 1 8 1s6 0 8-1"/>',
            '🍵': '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h3a2 2 0 0 1 0 4h-3M7 2c-1 1-1 2 0 3M11 2c-1 1-1 2 0 3"/>',
            '🎆': '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>',
            '🥂': '<path d="M8 3h8l-1 6a3 3 0 0 1-6 0z"/><path d="M8 3l-2 1M16 3l2 1M12 9v8M8 21h8M10 17h4v4h-4z"/>',
            '❄️': '<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>',
            '🧧': '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M12 3v18"/>'
        };
        function renderRitualIcon(icon, size) {
            const s = size || 40;
            const path = ritualIconMap[icon] || ritualIconMap['🕯️'];
            return '<svg class="svg-icon" viewBox="0 0 24 24" style="width:' + s + 'px;height:' + s + 'px;color:var(--gold);">' + path + '</svg>';
        }
        // ===== 统一弹窗接口（合并 alert/confirm） =====
        function showModal({ type = 'alert', message, title, icon, onConfirm }) {
            document.getElementById('customModalIcon').innerHTML = renderAlertIcon(icon);
            document.getElementById('customModalTitle').textContent = title || (type === 'confirm' ? '请确认' : '提示');
            document.getElementById('customModalMessage').textContent = message;
            if (type === 'confirm') {
                pendingConfirmCallback = onConfirm;
                document.getElementById('customModalActions').innerHTML =
                    '<button class="btn btn-secondary" onclick="closeCustomModal()">取消</button>' +
                    '<button class="btn btn-primary" onclick="confirmCustomModal()">确认</button>';
            } else {
                document.getElementById('customModalActions').innerHTML =
                    '<button class="btn btn-primary" style="width:100%;" onclick="closeCustomModal()">知道了</button>';
            }
            ModalManager.open('customModalOverlay');
        }
        function showCustomAlert(message, title, icon) {
            return showModal({ type: 'alert', message, title, icon });
        }
        function showCustomConfirm(message, onConfirm, title, icon) {
            return showModal({ type: 'confirm', message, title, icon, onConfirm });
        }
        function confirmCustomModal() {
            const cb = pendingConfirmCallback;
            pendingConfirmCallback = null;
            ModalManager.close('customModalOverlay');
            if (cb) cb();
        }
        function closeCustomModal() {
            ModalManager.close('customModalOverlay');
            pendingConfirmCallback = null;
        }

        // ===== 照片压缩 =====

        function compressImage(dataUrl, maxWidth, quality, callback) {
            const img = new Image();
            img.onload = function() {
                try {
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    callback(canvas.toDataURL('image/jpeg', quality));
                } catch(err) {
                    console.warn('compressImage canvas error:', err);
                    callback(null);
                }
            };
            img.onerror = function() {
                console.warn('compressImage: image load failed');
                callback(null);
            };
            img.src = dataUrl;
        }

        // ===== AI对话：本地智能匹配 =====

        function exportData() {
            const data = {
                version: 3,
                exportDate: new Date().toISOString(),
                memorials: memorials,
                wishGalaxies: wishGalaxies,
                familyMessages: familyMessages,
                familyMembers: familyMembers,
                memorialStars: memorialStars,
                storyAnswers: orbitData,
                nickname: globalNickName,
                favoriteQuotes: favoriteQuotes,
                memoryWallItems: memoryWallItems,
                heritageMembers: heritageMembers
            };
            // 安全过滤：确保导出数据不包含 API Key（防止敏感信息泄露）
            if (data.aiSettings) {
                delete data.aiSettings.apiKey;
                delete data.aiSettings.encryptedApiKey;
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `记忆星系备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showCustomAlert('备份文件已下载，请妥善保存', '导出成功', '💾');
        }
        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);

                    // 格式校验：至少包含一个可识别的数据字段
                    if (!data || typeof data !== 'object' ||
                        (!data.memorials && !data.wishGalaxies && !data.familyMessages)) {
                        showCustomAlert('文件格式不正确，请选择记忆星系导出的备份文件', '导入失败', '⚠️');
                        return;
                    }

                    // ===== Schema 校验：检查字段名和类型 =====
                    const importSchema = {
                        version: 'number',
                        exportDate: 'string',
                        memorials: 'array',
                        wishGalaxies: 'object',
                        familyMessages: 'array',
                        familyMembers: 'array',
                        memorialStars: 'array',
                        storyAnswers: 'object',
                        nickname: 'string',
                        favoriteQuotes: 'array',
                        memoryWallItems: 'array',
                        heritageMembers: 'array'
                    };
                    for (const key in data) {
                        const expectedType = importSchema[key];
                        if (expectedType === undefined) {
                            console.warn('导入数据包含未知字段:', key);
                            continue;
                        }
                        if (data[key] === null) continue;
                        const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
                        if (actualType !== expectedType) {
                            showCustomAlert('字段「' + key + '」类型不正确（期望' + expectedType + '，实际' + actualType + '），文件可能已损坏', '导入失败', '⚠️');
                            return;
                        }
                    }

                    // ===== 存储空间检查：预估导入数据大小是否超过 localStorage 剩余空间 =====
                    const dataStr = JSON.stringify(data);
                    const dataSize = dataStr.length * 2; // UTF-16 编码，每个字符2字节
                    let usedSpace = 0;
                    for (let key in localStorage) {
                        if (localStorage.hasOwnProperty(key)) {
                            usedSpace += (localStorage.getItem(key) || '').length * 2;
                        }
                    }
                    const remainingSpace = 5 * 1024 * 1024 - usedSpace; // localStorage 通常限制为 5MB
                    if (dataSize > remainingSpace) {
                        showCustomAlert('导入数据大小（' + (dataSize / 1024 / 1024).toFixed(2) + 'MB）超过剩余存储空间（' + (remainingSpace / 1024 / 1024).toFixed(2) + 'MB），请先清理旧数据', '导入失败', '⚠️');
                        return;
                    }

                    // ===== XSS 过滤：检查图片数据 URL 格式是否为 data:image/ =====
                    if (Array.isArray(data.memorials)) {
                        for (const m of data.memorials) {
                            if (m && m.photo && typeof m.photo === 'string') {
                                if (!m.photo.startsWith('data:image/')) {
                                    showCustomAlert('检测到无效的图片数据格式，可能存在安全风险（XSS）', '导入失败', '⚠️');
                                    return;
                                }
                            }
                        }
                    }

                    showCustomConfirm('导入将覆盖当前所有数据，确定继续吗？', function() {
                        // 安全导入：逐字段校验类型
                        if (Array.isArray(data.memorials)) { memorials = data.memorials; saveMemorials(); }
                        if (data.wishGalaxies && typeof data.wishGalaxies === 'object') { wishGalaxies = data.wishGalaxies; saveWishGalaxies(); }
                        if (Array.isArray(data.familyMessages)) { familyMessages = data.familyMessages; saveFamilyMessages(); }
                        if (Array.isArray(data.familyMembers)) { familyMembers = data.familyMembers; saveFamilyMembersData(); }
                        if (Array.isArray(data.memorialStars)) { memorialStars = data.memorialStars; saveMemorialStars(); }
                        if (data.storyAnswers && typeof data.storyAnswers === 'object') { orbitData = data.storyAnswers; Object.keys(orbitData).forEach(mid => saveOrbitData(mid)); }
                        if (typeof data.nickname === 'string' && data.nickname) { saveNickName(data.nickname); }
                        if (Array.isArray(data.favoriteQuotes)) { favoriteQuotes = data.favoriteQuotes; saveFavoriteQuotes(); }
                        if (Array.isArray(data.memoryWallItems)) { memoryWallItems = data.memoryWallItems; saveMemoryWall(); }
                        if (Array.isArray(data.heritageMembers)) { heritageMembers = data.heritageMembers; saveHeritageTree(); }
                        renderMemorialList();
                        renderWishMainPage();
                        renderFamilyMembers();
                        renderFamilyMessages();
                        renderMemorialStars();
                        renderMemoryWall();
                        renderHeritageTree();
                        showHomeDailyQuote();
                        updateStorageUsageDisplay();
                        showCustomAlert('数据恢复成功，刷新页面以完全生效', '导入成功', '✓');
                    }, '导入确认', '📂');
                } catch(err) {
                    showCustomAlert('文件格式错误，无法导入。请确保选择了正确的备份文件', '导入失败', '⚠️');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // ===== 新手引导 =====

        function checkOnboarding() {
            try {
                if (!localStorage.getItem(ONBOARDING_KEY)) {
                    const bubble = document.getElementById('onboardingBubble');
                    if (bubble) bubble.style.display = 'flex';
                }
            } catch(e) {}
        }
        function dismissOnboarding() {
            document.getElementById('onboardingBubble').style.display = 'none';
            try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch(e) {}
        }

        // ===== 存储用量查询 =====
        function getStorageUsage() {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('memoryGalaxy_')) {
                    total += (localStorage.getItem(key) || '').length * 2;
                }
            }
            return {
                used: (total / 1024 / 1024).toFixed(2),
                remaining: ((5 * 1024 * 1024 - total) / 1024 / 1024).toFixed(2),
                percentage: ((total / (5 * 1024 * 1024)) * 100).toFixed(1)
            };
        }

        // ===== 图片存储预警 =====
        function checkStorageBeforePhoto() {
            const usage = getStorageUsage();
            if (parseFloat(usage.percentage) > 50) {
                showCustomAlert('照片存储空间即将不足，建议导出备份后清理旧照片，或降低图片质量。', '存储空间预警', '⚠️');
                return false;
            }
            return true;
        }

        // ===== 更新存储用量显示 =====
        function updateStorageUsageDisplay() {
            const el = document.getElementById('storageUsageText');
            if (!el) return;
            const usage = getStorageUsage();
            const pct = parseFloat(usage.percentage);
            let color = 'rgba(255,255,255,0.5)';
            if (pct > 80) color = 'rgba(255,100,100,0.8)';
            else if (pct > 50) color = 'rgba(255,200,100,0.7)';
            el.style.color = color;
            el.textContent = `存储空间：已用 ${usage.used}MB / 5MB (${usage.percentage}%)`;
            if (pct > 80) {
                el.textContent += ' ⚠️ 空间不足，建议导出备份';
            }
        }

        // ===== 永久星位置响应窗口变化 =====