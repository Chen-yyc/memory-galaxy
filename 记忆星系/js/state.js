// state.js - 记忆星系

        // ===== 全局配置常量 =====
        const CONFIG = {
            MAX_WISHES: 6,
            MAX_PHOTO_WIDTH: 800,
            PHOTO_QUALITY: 0.8,
            CHAT_HISTORY_LIMIT: 6,
            API_TIMEOUT: 15000,
            ORBIT_API_TIMEOUT: 20000,
            SAVE_DEBOUNCE: 500,
            SPARK_POOL_SIZE: 12,
            RITUAL_HOLD_DURATION: 1500,
            ANNIVERSARY_REMINDER_DAYS: 7,
            FESTIVAL_YEARS_AHEAD: 10,
        };

        // ===== 全局状态 =====
        let memorials = [];
        let currentMemorialId = null;
        let memorialViewMode = 'list';
        let isEditMode = false;
        let editingMemorialId = null;
        let uploadedPhotoData = null;
        let orbitData = {};          // { memorialId: { fragments: [], chapters: [] } }
        let orbitChatState = null;   // 采编对话状态
        let familyMessages = [];
        let familyMembers = [];
        let isTransitioning = false;

        // 心愿星系状态
        let wishGalaxies = {};          // { "外婆": { deceasedName, wishes: [] }, ... }
        let currentGalaxyName = null;   // 当前查看的星系（逝者名）
        let wishViewMode = 'main';      // 'main' | 'galaxy'
        let globalNickName = '';        // 全局认领昵称
        const MAX_WISHES = CONFIG.MAX_WISHES;           // 每个星系最大心愿数

        // AI对话设置
        let aiSettings = { provider: 'local', apiKey: '' };

        const STORAGE_KEY = 'memoryGalaxy_memorials_v1';
        const WISH_STORAGE_KEY = 'memoryGalaxy_wishes_v1';
        const NICKNAME_KEY = 'memoryGalaxy_nickname';
        const MEMORIAL_STAR_KEY = 'memoryGalaxy_memorialStars_v1';
        const FAMILY_MSG_KEY = 'memoryGalaxy_familyMessages_v1';
        const FAMILY_MEMBERS_KEY = 'memoryGalaxy_familyMembers_v1';
        const STORY_KEY = 'memoryGalaxy_stories_v1';      // 旧key，用于迁移
        const ORBIT_KEY_PREFIX = 'memoryGalaxy_orbit_';   // 新key前缀，按memorialId隔离
        const AI_SETTINGS_KEY = 'memoryGalaxy_aiSettings_v1';
        const ONBOARDING_KEY = 'memoryGalaxy_onboarded_v1';

        // 永久纪念星（已完成心愿放飞后化作）
        let memorialStars = [];


        // ===== localStorage 持久化 =====
        function loadMemorials() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                memorials = data ? JSON.parse(data) : [];
            } catch(e) {
                memorials = [];
            }
        }
        // 使用通用 debounce 函数实现保存防抖（debounce 定义在 utils.js，延迟初始化以避免加载顺序问题）
        let _saveMemorialsDebounced = null;
        function saveMemorials() {
            if (!_saveMemorialsDebounced) {
                _saveMemorialsDebounced = debounce(() => {
                    saveMemorialsNow();
                }, CONFIG.SAVE_DEBOUNCE);
            }
            _saveMemorialsDebounced();
        }
        function saveMemorialsNow() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(memorials));
            } catch(e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    compressAllPhotosAndSave();
                }
            }
        }

        // 配额超限时：自动压缩所有照片后重试保存
        function compressAllPhotosAndSave() {
            const photoMemorials = memorials.filter(m => m.photo);
            if (photoMemorials.length === 0) {
                showCustomAlert('存储空间不足，建议导出备份后删除部分纪念空间或清理对话记录', '存储已满', '⚠️');
                return;
            }
            let compressed = 0;
            const total = photoMemorials.length;
            photoMemorials.forEach(memorial => {
                compressImage(memorial.photo, 400, 0.5, function(compressedData) {
                    memorial.photo = compressedData;
                    compressed++;
                    if (compressed === total) {
                        try {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(memorials));
                            showCustomAlert('照片已自动压缩以适应存储空间', '存储优化', '✓');
                        } catch(e2) {
                            showCustomAlert('存储空间不足，建议导出备份后删除部分纪念空间或清理对话记录', '存储已满', '⚠️');
                        }
                    }
                });
            });
        }
        function getCurrentMemorial() {
            return memorials.find(m => m.id === currentMemorialId) || null;
        }
        // 复用元素以优化 escapeHtml 性能（避免每次调用都创建 DOM 节点）
        const _escapeEl = document.createElement('span');
        function escapeHtml(text) {
            _escapeEl.textContent = text || '';
            return _escapeEl.innerHTML;
        }

        // ===== 心愿星系数据持久化 =====
        function loadWishGalaxies() {
            try {
                const data = localStorage.getItem(WISH_STORAGE_KEY);
                wishGalaxies = data ? JSON.parse(data) : {};
            } catch(e) {
                wishGalaxies = {};
            }
        }
        function saveWishGalaxies() {
            try {
                localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(wishGalaxies));
            } catch(e) {
                showCustomAlert('存储空间不足，心愿数据未能保存', '存储已满', '⚠️');
            }
        }
        function getWishGalaxy(name) {
            if (!wishGalaxies[name]) {
                wishGalaxies[name] = { deceasedName: name, wishes: [] };
            }
            return wishGalaxies[name];
        }
        function loadNickName() {
            try {
                globalNickName = localStorage.getItem(NICKNAME_KEY) || '';
            } catch(e) {
                globalNickName = '';
            }
        }
        function saveNickName(name) {
            globalNickName = name;
            try {
                localStorage.setItem(NICKNAME_KEY, name);
            } catch(e) {}
        }

        // ===== 永久纪念星持久化 =====
        function loadMemorialStars() {
            try {
                const data = localStorage.getItem(MEMORIAL_STAR_KEY);
                memorialStars = data ? JSON.parse(data) : [];
            } catch(e) {
                memorialStars = [];
            }
        }
        function saveMemorialStars() {
            try {
                localStorage.setItem(MEMORIAL_STAR_KEY, JSON.stringify(memorialStars));
            } catch(e) {}
        }
        // 渲染所有永久纪念星到星空背景（优化：使用DocumentFragment）
        function renderMemorialStars() {
            const layer = document.getElementById('starLayer1');
            if (!layer) return;
            // 先移除旧的纪念星
            layer.querySelectorAll('.memorial-star').forEach(s => s.remove());
            const w = window.innerWidth;
            const h = window.innerHeight;
            const fragment = document.createDocumentFragment();
            memorialStars.forEach((star, i) => {
                const el = document.createElement('div');
                el.className = 'memorial-star';
                const size = 3 + (star.size || 0);
                el.style.cssText = 'left:' + star.x + 'px;top:' + star.y + 'px;width:' + size + 'px;height:' + size + 'px;animation-delay:' + ((i % 5) * 0.6) + 's;';
                el.title = star.title ? (star.galaxy || '') + ' · ' + star.title : '已完成的心愿';
                fragment.appendChild(el);
            });
            layer.appendChild(fragment);
        }
        // 添加一颗永久纪念星（位置取屏幕上方区域）
        function addMemorialStar(galaxy, title) {
            const w = window.innerWidth;
            const star = {
                id: Date.now(),
                x: Math.random() * w * 0.8 + w * 0.1,
                y: Math.random() * (window.innerHeight * 0.35) + 20,
                size: Math.random() * 1.5,
                galaxy: galaxy || '',
                title: title || '',
                date: new Date().toLocaleDateString('zh-CN')
            };
            memorialStars.push(star);
            saveMemorialStars();
            renderMemorialStars();
            return star;
        }

        // ===== 家族留言持久化 =====
        function loadFamilyMessages() {
            try {
                const data = localStorage.getItem(FAMILY_MSG_KEY);
                familyMessages = data ? JSON.parse(data) : [];
            } catch(e) { familyMessages = []; }
        }
        function saveFamilyMessages() {
            try { localStorage.setItem(FAMILY_MSG_KEY, JSON.stringify(familyMessages)); } catch(e) {
                showCustomAlert('存储空间不足，留言未能保存', '存储已满', '⚠️');
            }
        }

        // ===== 家族成员持久化 =====
        function loadFamilyMembersData() {
            try {
                const data = localStorage.getItem(FAMILY_MEMBERS_KEY);
                familyMembers = data ? JSON.parse(data) : [];
            } catch(e) { familyMembers = []; }
        }
        function saveFamilyMembersData() {
            try { localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(familyMembers)); } catch(e) {
                showCustomAlert('存储空间不足，成员数据未能保存', '存储已满', '⚠️');
            }
        }

        // ===== 生命星轨持久化 =====
        function getOrbitKey(memorialId) {
            return ORBIT_KEY_PREFIX + memorialId;
        }

        function loadOrbitData(memorialId) {
            try {
                const data = localStorage.getItem(getOrbitKey(memorialId));
                const parsed = data ? JSON.parse(data) : null;
                if (parsed && parsed.fragments && parsed.chapters) {
                    orbitData[memorialId] = parsed;
                } else {
                    orbitData[memorialId] = { fragments: [], chapters: [] };
                }
            } catch(e) {
                orbitData[memorialId] = { fragments: [], chapters: [] };
            }
            return orbitData[memorialId];
        }

        function saveOrbitData(memorialId) {
            try {
                const data = orbitData[memorialId];
                if (data) {
                    localStorage.setItem(getOrbitKey(memorialId), JSON.stringify(data));
                }
            } catch(e) {
                showCustomAlert('存储空间不足，星轨数据未能保存', '存储已满', '⚠️');
            }
        }

        function getCurrentOrbitData() {
            const memorial = getCurrentMemorial();
            if (!memorial) return null;
            if (!orbitData[memorial.id]) {
                loadOrbitData(memorial.id);
            }
            return orbitData[memorial.id];
        }

        // 旧数据迁移：把5个固定问答转成初始碎片+章节
        function migrateOldStoryData() {
            try {
                const oldData = localStorage.getItem(STORY_KEY);
                if (!oldData) return;
                const parsed = JSON.parse(oldData);
                if (!parsed || !Array.isArray(parsed.answers) || parsed.answers.length === 0) return;

                // 找到第一个纪念空间作为迁移目标
                if (memorials.length === 0) return;
                const targetMemorial = memorials[0];
                const orbit = loadOrbitData(targetMemorial.id);

                // 如果已经迁移过（有碎片），跳过
                if (orbit.fragments.length > 0) return;

                const oldQuestions = [
                    "TA 最喜欢的食物是什么？",
                    "TA 最大的爱好是什么？",
                    "TA 最常说的一句话是什么？",
                    "TA 最骄傲的事情是什么？",
                    "你想对TA说的最后一句话是？"
                ];

                // 把每个回答转成一个碎片
                parsed.answers.forEach((answer, index) => {
                    if (!answer) return;
                    orbit.fragments.push({
                        id: 'frag_migrated_' + index,
                        memorialId: targetMemorial.id,
                        theme: '生命概览',
                        rawContent: answer,
                        fragments: [answer],
                        mood: '',
                        createdAt: Date.now() - (5 - index) * 1000,
                        woven: false
                    });
                });

                // 如果有3个以上碎片，生成初始章节
                if (orbit.fragments.length >= 1) {
                    const content = orbit.fragments.map((f, i) => {
                        return oldQuestions[i] + '\n' + f.rawContent;
                    }).join('\n\n');
                    orbit.chapters.push({
                        id: 'chap_migrated',
                        memorialId: targetMemorial.id,
                        theme: '生命概览',
                        title: targetMemorial.name + '的生命故事',
                        content: content,
                        sourceFragmentIds: orbit.fragments.map(f => f.id),
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                    orbit.fragments.forEach(f => f.woven = true);
                }

                saveOrbitData(targetMemorial.id);
                // 清除旧数据标记（不删除，避免其他版本需要）
                console.log('生命故事书旧数据已迁移至生命星轨');
            } catch(e) {
                console.warn('旧数据迁移失败:', e);
            }
        }

        // 删除纪念空间时清除星轨数据
        function deleteOrbitData(memorialId) {
            try {
                localStorage.removeItem(getOrbitKey(memorialId));
                delete orbitData[memorialId];
            } catch(e) {}
        }

        // ===== AI设置持久化（使用 SubtleCrypto 加密存储 API Key） =====
        async function encryptApiKey(key) {
            const encoder = new TextEncoder();
            const data = encoder.encode(key);
            const password = await crypto.subtle.digest('SHA-256', encoder.encode('memory-galaxy-salt'));
            const cryptoKey = await crypto.subtle.importKey('raw', password, 'AES-GCM', false, ['encrypt', 'decrypt']);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
            return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
        }
        async function decryptApiKey(encrypted) {
            const encoder = new TextEncoder();
            const password = await crypto.subtle.digest('SHA-256', encoder.encode('memory-galaxy-salt'));
            const cryptoKey = await crypto.subtle.importKey('raw', password, 'AES-GCM', false, ['encrypt', 'decrypt']);
            const iv = new Uint8Array(encrypted.iv);
            const data = new Uint8Array(encrypted.data);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
            return new TextDecoder().decode(decrypted);
        }
        async function loadAISettings() {
            try {
                const data = localStorage.getItem(AI_SETTINGS_KEY);
                if (data) {
                    const parsed = JSON.parse(data);
                    // 兼容旧版明文存储：如果有加密的 apiKey 则解密，否则直接使用
                    if (parsed.encryptedApiKey) {
                        parsed.apiKey = await decryptApiKey(parsed.encryptedApiKey);
                        delete parsed.encryptedApiKey;
                    }
                    aiSettings = parsed;
                }
            } catch(e) {}
            // 异步解密完成后更新AI模式徽章
            if (typeof updateAIModeBadge === 'function') updateAIModeBadge();
        }
        async function saveAISettingsData() {
            try {
                const toSave = { provider: aiSettings.provider };
                if (aiSettings.apiKey) {
                    toSave.encryptedApiKey = await encryptApiKey(aiSettings.apiKey);
                }
                localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(toSave));
            } catch(e) {}
        }

        // ===== 自定义弹窗组件 =====

        const ORBIT_THEMES = [
            '日常习惯与癖好', '食物与味道', '工作与热爱', '家庭角色',
            '兴趣爱好', '旅行与冒险', '性格与口头禅', '人生转折',
            '难忘对话', '遗憾与未竟之事', '生命概览'
        ];

        // 离线兜底开场白
        const ORBIT_FALLBACK_OPENERS = [
            "今天想聊聊TA的哪一面呢？比如，TA在厨房里的样子、TA工作时的神情、或者你们之间某个特别的清晨……想到什么都可以。",
            "闭上眼睛，脑海中浮现的第一个关于TA的画面是什么？可以是一句话、一个动作、或者一个场景。",
            "如果让你用一个瞬间来代表TA，你会想到哪个画面？"
        ];

        const quotes = [
            "今天也要好好吃饭，不要太累了。",
            "记得多穿点衣服，别着凉了。",
            "不管遇到什么困难，都要坚强面对。",
            "你是最棒的，我永远相信你。",
            "累了就休息，不要勉强自己。",
            "记得按时吃饭，身体最重要。",
            "无论走多远，家永远是你的港湾。",
            "要对自己好一点，别总是为别人着想。"
        ];

        // 默认家族成员（首次使用时初始化）
        const defaultFamilyMembers = [
            { id: 1, name: "爸爸", role: "父亲", avatar: "👨" },
            { id: 2, name: "妈妈", role: "母亲", avatar: "👩" },
            { id: 3, name: "哥哥", role: "长子", avatar: "👦" },
            { id: 4, name: "妹妹", role: "次女", avatar: "👧" },
            { id: 5, name: "爷爷", role: "祖父", avatar: "👴" },
            { id: 6, name: "奶奶", role: "祖母", avatar: "👵" }
        ];

        // ===== 页面切换（核心） =====