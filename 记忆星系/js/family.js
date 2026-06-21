// family.js - 记忆星系

        function showFamilyMemberForm() {
            document.getElementById('familyMemberName').value = '';
            document.getElementById('familyMemberRole').value = '';
            document.getElementById('familyMemberAvatar').value = '';
            ModalManager.open('familyMemberOverlay');
        }
        function closeFamilyMemberForm(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('familyMemberOverlay');
        }
        function addFamilyMember() {
            const name = document.getElementById('familyMemberName').value.trim();
            const role = document.getElementById('familyMemberRole').value.trim();
            const avatar = document.getElementById('familyMemberAvatar').value.trim() || '👤';
            if (!name) { showCustomAlert('请输入姓名'); return; }
            if (!role) { showCustomAlert('请输入关系'); return; }
            familyMembers.push({ id: Date.now(), name, role, avatar });
            saveFamilyMembersData();
            renderFamilyMembers();
            closeFamilyMemberForm();
        }
        function deleteFamilyMember(id) {
            showCustomConfirm('确定要移除这位家庭成员吗？', function() {
                familyMembers = familyMembers.filter(m => m.id !== id);
                saveFamilyMembersData();
                renderFamilyMembers();
            }, '移除成员', '👨‍👩‍👧');
        }

        // ===== 数据导出/导入 =====

        function initFamilyMembers() {
            // 首次使用时用默认成员初始化
            if (familyMembers.length === 0) {
                familyMembers = JSON.parse(JSON.stringify(defaultFamilyMembers));
                saveFamilyMembersData();
            }
            renderFamilyMembers();
        }
        function renderFamilyMembers() {
            const container = document.getElementById('familyMembers');
            if (!container) return;
            container.innerHTML = familyMembers.map(member => `
                <div class="family-member family-member-card">
                    <button class="family-member-delete" onclick="deleteFamilyMember(${member.id})" title="移除">✕</button>
                    <div class="family-avatar">${escapeHtml(member.avatar || '👤')}</div>
                    <div class="family-name">${escapeHtml(member.name)}</div>
                    <div class="family-role">${escapeHtml(member.role)}</div>
                </div>
            `).join('');
        }

        function addFamilyMessage() {
            const author = document.getElementById('msgAuthor').value;
            const content = document.getElementById('msgContent').value;

            if (!author || !content) {
                showCustomAlert('请填写名字和留言内容', '提示', '✍️');
                return;
            }

            const message = { id: Date.now(), author, content, time: new Date().toLocaleString('zh-CN') };
            familyMessages.push(message);
            saveFamilyMessages();
            renderFamilyMessages();

            document.getElementById('msgAuthor').value = '';
            document.getElementById('msgContent').value = '';
        }

        function renderFamilyMessages() {
            const container = document.getElementById('messageCards');
            if (familyMessages.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <div class="empty-state-icon">
                            <svg class="svg-icon" viewBox="0 0 24 24" style="width:60px;height:60px;color:var(--gold);opacity:0.3;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </div>
                        <div class="empty-state-title">还没有家人留下话语</div>
                        <div class="empty-state-desc">成为第一个传递温暖的人</div>
                        <button class="btn btn-primary empty-state-btn" onclick="document.getElementById('msgContent').focus()">写下留言</button>
                    </div>
                `;
                // 动态生成的按钮需要刷新 AOS，否则 opacity 保持 0
                if (typeof AOS !== 'undefined') AOS.refresh();
                // 确保空状态按钮不被 AOS 的 opacity:0 卡住
                var emptyBtn = container.querySelector('.empty-state-btn');
                if (emptyBtn) {
                    emptyBtn.removeAttribute('data-aos');
                    emptyBtn.removeAttribute('data-aos-delay');
                    emptyBtn.style.opacity = '1';
                }
                return;
            }
            container.innerHTML = familyMessages.map(msg => `
                <div class="message-card">
                    <button class="card-delete" onclick="deleteFamilyMessage(${msg.id})" title="删除" aria-label="删除该留言">✕</button>
                    <div class="msg-header">
                        <div class="msg-avatar">👤</div>
                        <div class="msg-author">${escapeHtml(msg.author)}</div>
                        <div class="msg-time">${escapeHtml(msg.time)}</div>
                    </div>
                    <div class="msg-body">${escapeHtml(msg.content)}</div>
                </div>
            `).join('');
        }

        function deleteFamilyMessage(id) {
            showCustomConfirm('确定要删除这条留言吗？', function() {
                familyMessages = familyMessages.filter(m => m.id !== id);
                saveFamilyMessages();
                renderFamilyMessages();
            }, '删除留言', '🗑️');
        }

        // ===== 星尘爆发：点击行星时迸发细小粒子 =====

        function switchFamilyTab(tabName, btn) {
            document.querySelectorAll('.family-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.family-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('familyTab-' + tabName).classList.add('active');

            if (tabName === 'memories') renderMemoryWall();
            if (tabName === 'heritage') renderHeritageTree();
        }

        // ===== 家族回忆墙 =====
        const MEMORY_WALL_KEY = 'galaxy_memory_wall';
        let memoryWallItems = [];

        function loadMemoryWall() {
            try {
                const data = localStorage.getItem(MEMORY_WALL_KEY);
                memoryWallItems = data ? JSON.parse(data) : [];
            } catch(e) { memoryWallItems = []; }
        }
        function saveMemoryWall() {
            try { localStorage.setItem(MEMORY_WALL_KEY, JSON.stringify(memoryWallItems)); } catch(e) {
                showCustomAlert('存储空间不足，回忆墙数据未能保存', '存储已满', '⚠️');
            }
        }
        let memoryWallPhotoData = null;
        function handleMemoryWallPhoto(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                // 压缩图片到800px宽度，JPEG 0.8质量，防止localStorage超限（与纪念照片一致）
                compressImage(e.target.result, 800, 0.8, function(compressed) {
                    if (!compressed) {
                        showCustomAlert('图片处理失败，请换一张图片试试', '上传失败', '⚠️');
                        return;
                    }
                    memoryWallPhotoData = compressed;
                    const upload = document.getElementById('memoryWallPhotoUpload');
                    upload.innerHTML = `<img src="${compressed}" style="max-height:120px;border-radius:12px;display:block;margin:0 auto;">`;
                });
            };
            reader.onerror = function() {
                showCustomAlert('无法读取该文件，请确认图片未损坏', '读取失败', '⚠️');
            };
            reader.readAsDataURL(file);
        }
        function addMemoryWallItem() {
            const author = document.getElementById('memoryWallAuthor').value.trim() || '匿名';
            const title = document.getElementById('memoryWallTitle').value.trim();
            const story = document.getElementById('memoryWallStory').value.trim();

            if (!story && !memoryWallPhotoData) {
                showCustomAlert('请至少填写故事或上传照片', '提示', '📸');
                return;
            }

            const item = {
                id: Date.now(),
                author: author,
                title: title,
                story: story,
                photo: memoryWallPhotoData,
                time: new Date().toLocaleString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
            };
            memoryWallItems.unshift(item);
            saveMemoryWall();

            // 清空表单
            document.getElementById('memoryWallAuthor').value = '';
            document.getElementById('memoryWallTitle').value = '';
            document.getElementById('memoryWallStory').value = '';
            memoryWallPhotoData = null;
            document.getElementById('memoryWallPhotoUpload').innerHTML = `
                <div class="photo-upload-text">
                    <svg class="svg-icon" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/></svg>
                    <div>选择照片（可选）</div>
                </div>`;
            document.getElementById('memoryWallPhotoInput').value = '';

            renderMemoryWall();
            showCustomAlert('回忆已发布到回忆墙', '发布成功', '✓');
        }
        function renderMemoryWall() {
            const grid = document.getElementById('memoryWallGrid');
            if (!grid) return;
            if (memoryWallItems.length === 0) {
                grid.innerHTML = '<div style="text-align:center;color:var(--text-light);padding:60px 0;grid-column:1/-1;"><div style="margin-bottom:16px;"><svg class="svg-icon" viewBox="0 0 24 24" style="width:44px;height:44px;color:rgba(232,197,160,0.5);"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/></svg></div>还没有回忆，成为第一个分享的人吧</div>';
                return;
            }
            grid.innerHTML = memoryWallItems.map(item => `
                <div class="memory-card">
                    <button class="memory-card-delete" onclick="deleteMemoryWallItem(${item.id})">✕</button>
                    ${item.photo ? `<img src="${item.photo}" alt="${escapeHtml(item.title || '回忆')}" loading="lazy">` : ''}
                    <div class="memory-card-body">
                        ${item.title ? `<div style="font-size:15px;font-weight:600;color:var(--gold);margin-bottom:8px;">${escapeHtml(item.title)}</div>` : ''}
                        ${item.story ? `<div class="memory-card-story">${escapeHtml(item.story)}</div>` : ''}
                        <div class="memory-card-meta">
                            <span class="author">${escapeHtml(item.author)}</span>
                            <span>·</span>
                            <span>${escapeHtml(item.time)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        function deleteMemoryWallItem(id) {
            showCustomConfirm('确定要删除这条回忆吗？', function() {
                memoryWallItems = memoryWallItems.filter(m => m.id !== id);
                saveMemoryWall();
                renderMemoryWall();
            }, '删除回忆', '🗑️');
        }

        // ===== 代际传承树 =====
        const HERITAGE_KEY = 'galaxy_heritage_tree';
        let heritageMembers = [];
        let editingHeritageId = null;

        function loadHeritageTree() {
            try {
                const data = localStorage.getItem(HERITAGE_KEY);
                heritageMembers = data ? JSON.parse(data) : [];
            } catch(e) { heritageMembers = []; }
        }
        function saveHeritageTree() {
            try { localStorage.setItem(HERITAGE_KEY, JSON.stringify(heritageMembers)); } catch(e) {
                showCustomAlert('存储空间不足，传承树数据未能保存', '存储已满', '⚠️');
            }
        }
        function renderHeritageTree() {
            const container = document.getElementById('heritageTree');
            if (!container) return;

            if (heritageMembers.length === 0) {
                container.innerHTML = `
                    <div class="heritage-empty">
                        <div class="icon"><svg class="svg-icon" viewBox="0 0 24 24" style="width:48px;height:48px;color:rgba(232,197,160,0.5);"><path d="M12 2a5 5 0 0 0-5 5 4 4 0 0 0-1 7.9c0 1.5 1 2.8 2.5 3.1M12 2a5 5 0 0 1 5 5 4 4 0 0 1 1 7.9c0 1.5-1 2.8-2.5 3.1M12 14v8"/></svg></div>
                        <p>传承树还是空的</p>
                        <p style="font-size:13px;margin-top:8px;">添加家族成员，构建代际传承的族谱树</p>
                    </div>
                `;
                return;
            }

            // 按辈分分组
            const generations = [[], [], [], []];
            heritageMembers.forEach(m => {
                const gen = Math.max(0, Math.min(3, m.generation || 0));
                generations[gen].push(m);
            });

            const genLabels = ['第一代 · 祖辈', '第二代 · 父辈', '第三代 · 同辈', '第四代 · 晚辈'];

            let html = '';
            generations.forEach((members, genIdx) => {
                if (members.length === 0) return;
                html += `<div class="heritage-generation">`;
                html += `<div class="heritage-gen-label">${genLabels[genIdx]}</div>`;
                members.forEach(m => {
                    html += `
                        <div class="heritage-node ${m.deceased ? 'deceased' : ''}" onclick="showHeritageMemberForm(${m.id})">
                            <div class="heritage-node-avatar ${m.deceased ? 'deceased' : ''}">${escapeHtml(m.avatar || '👤')}</div>
                            <div class="heritage-node-name">${escapeHtml(m.name)}</div>
                            ${m.role ? `<div class="heritage-node-role">${escapeHtml(m.role)}</div>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
            });

            container.innerHTML = html;
        }
        function showHeritageMemberForm(id) {
            editingHeritageId = id || null;
            const overlay = document.getElementById('heritageMemberOverlay');
            const title = document.getElementById('heritageMemberTitle');

            if (id) {
                const member = heritageMembers.find(m => m.id === id);
                if (!member) return;
                title.textContent = '编辑成员';
                document.getElementById('heritageName').value = member.name || '';
                document.getElementById('heritageAvatar').value = member.avatar || '👤';
                document.getElementById('heritageRole').value = member.role || '';
                document.getElementById('heritageGeneration').value = member.generation || 0;
                document.getElementById('heritageDeceased').checked = !!member.deceased;
                document.getElementById('heritageDesc').value = member.desc || '';
            } else {
                title.textContent = '添加传承树成员';
                document.getElementById('heritageName').value = '';
                document.getElementById('heritageAvatar').value = '👤';
                document.getElementById('heritageRole').value = '';
                document.getElementById('heritageGeneration').value = 0;
                document.getElementById('heritageDeceased').checked = false;
                document.getElementById('heritageDesc').value = '';
            }
            ModalManager.open('heritageMemberOverlay');
        }
        function closeHeritageMemberForm() {
            ModalManager.close('heritageMemberOverlay');
            editingHeritageId = null;
        }
        function saveHeritageMember() {
            const name = document.getElementById('heritageName').value.trim();
            if (!name) {
                showCustomAlert('请输入成员姓名', '提示', '✍️');
                return;
            }
            const data = {
                name: name,
                avatar: document.getElementById('heritageAvatar').value.trim() || '👤',
                role: document.getElementById('heritageRole').value.trim(),
                generation: parseInt(document.getElementById('heritageGeneration').value),
                deceased: document.getElementById('heritageDeceased').checked,
                desc: document.getElementById('heritageDesc').value.trim()
            };

            if (editingHeritageId) {
                const idx = heritageMembers.findIndex(m => m.id === editingHeritageId);
                if (idx > -1) {
                    data.id = editingHeritageId;
                    heritageMembers[idx] = data;
                }
            } else {
                data.id = Date.now();
                heritageMembers.push(data);
            }
            saveHeritageTree();
            renderHeritageTree();
            closeHeritageMemberForm();
            showCustomAlert(editingHeritageId ? '成员信息已更新' : '成员已添加到传承树', '保存成功', '✓');
        }
        function deleteHeritageMember(id) {
            showCustomConfirm('确定要从传承树中移除该成员吗？', function() {
                heritageMembers = heritageMembers.filter(m => m.id !== id);
                saveHeritageTree();
                renderHeritageTree();
                closeHeritageMemberForm();
            }, '移除成员', '🗑️');
        }

        // ===== 初始化 =====