// memorial.js - 记忆星系

        function handlePhotoUpload(event) {
            const file = event.target.files[0];
            if (file) {
                // 存储空间预警检查
                if (!checkStorageBeforePhoto()) return;
                const reader = new FileReader();
                reader.onload = function(e) {
                    // 压缩图片到800px宽度，JPEG 0.8质量，防止localStorage超限
                    compressImage(e.target.result, CONFIG.MAX_PHOTO_WIDTH, CONFIG.PHOTO_QUALITY, function(compressed) {
                        if (!compressed) {
                            showCustomAlert('图片处理失败，请换一张图片试试', '上传失败', '⚠️');
                            return;
                        }
                        uploadedPhotoData = compressed;
                        const uploadArea = document.getElementById('photoUpload');
                        uploadArea.innerHTML = `<img src="${compressed}" loading="lazy" alt="纪念照片">`;
                        uploadArea.classList.add('has-image');
                    });
                };
                reader.onerror = function() {
                    showCustomAlert('无法读取该文件，请确认图片未损坏', '读取失败', '⚠️');
                };
                reader.readAsDataURL(file);
            }
        }

        // 照片上传占位（SVG图标，替代emoji）
        const PHOTO_UPLOAD_HTML = '<div class="photo-upload-text"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.5"/></svg><div>点击上传照片</div></div>';

        function resetCreateForm() {
            document.getElementById('memName').value = '';
            document.getElementById('memBirth').value = '';
            document.getElementById('memDeath').value = '';
            document.getElementById('memBirthday').value = '';
            document.getElementById('memDeathDay').value = '';
            document.getElementById('memBio').value = '';
            document.getElementById('memPhrases').value = '';
            document.getElementById('memMemory').value = '';
            document.querySelectorAll('.personality-tag').forEach(tag => tag.classList.remove('selected'));
            uploadedPhotoData = null;
            const uploadArea = document.getElementById('photoUpload');
            uploadArea.innerHTML = PHOTO_UPLOAD_HTML;
            uploadArea.classList.remove('has-image');
            // 清空文件选择，便于重复选择同一文件
            const fileInput = document.getElementById('photoInput');
            if (fileInput) fileInput.value = '';
        }

        function fillFormForEdit(memorial) {
            document.getElementById('memName').value = memorial.name || '';
            document.getElementById('memBirth').value = memorial.birth || '';
            document.getElementById('memDeath').value = memorial.death || '';
            document.getElementById('memBirthday').value = memorial.memBirthday || '';
            document.getElementById('memDeathDay').value = memorial.memDeathDay || '';
            document.getElementById('memBio').value = memorial.bio || '';
            document.getElementById('memPhrases').value = memorial.phrases || '';
            document.getElementById('memMemory').value = memorial.memory || '';
            document.querySelectorAll('.personality-tag').forEach(tag => {
                if (memorial.tags && memorial.tags.includes(tag.dataset.value)) {
                    tag.classList.add('selected');
                } else {
                    tag.classList.remove('selected');
                }
            });
            uploadedPhotoData = memorial.photo || null;
            const uploadArea = document.getElementById('photoUpload');
            if (memorial.photo) {
                uploadArea.innerHTML = `<img src="${memorial.photo}" loading="lazy" alt="纪念照片">`;
                uploadArea.classList.add('has-image');
            } else {
                uploadArea.innerHTML = PHOTO_UPLOAD_HTML;
                uploadArea.classList.remove('has-image');
            }
        }

        function updateCreateFormUI() {
            const title = document.getElementById('createPageTitle');
            const desc = document.getElementById('createPageDesc');
            const btn = document.getElementById('createSubmitBtn');
            if (isEditMode) {
                title.textContent = '编辑纪念空间';
                desc.textContent = '修改以下信息，更新TA的记忆之星';
                btn.innerHTML = '保存修改';
            } else {
                title.textContent = '创建纪念空间';
                desc.textContent = '填写以下信息，为珍贵的TA点亮一颗记忆之星';
                btn.innerHTML = '创建纪念空间';
            }
        }

        function prepareNewMemorial() {
            resetCreateForm();
            isEditMode = false;
            editingMemorialId = null;
            updateCreateFormUI();
        }

        function editCurrentMemorial() {
            const memorial = getCurrentMemorial();
            if (!memorial) return;
            isEditMode = true;
            editingMemorialId = memorial.id;
            fillFormForEdit(memorial);
            updateCreateFormUI();
            showPage('create');
        }

        function createMemorial() {
            const name = document.getElementById('memName').value.trim();
            const birth = document.getElementById('memBirth').value.trim();
            const death = document.getElementById('memDeath').value.trim();
            const memBirthday = document.getElementById('memBirthday').value.trim();
            const memDeathDay = document.getElementById('memDeathDay').value.trim();
            const bio = document.getElementById('memBio').value.trim();
            const phrases = document.getElementById('memPhrases').value.trim();
            const memory = document.getElementById('memMemory').value.trim();
            const selectedTags = Array.from(document.querySelectorAll('.personality-tag.selected')).map(tag => tag.dataset.value);

            if (!name) {
                showCustomAlert('请输入姓名', '提示', '✍️');
                return;
            }

            if (isEditMode && editingMemorialId) {
                // 编辑已有纪念空间
                const memorial = memorials.find(m => m.id === editingMemorialId);
                if (memorial) {
                    memorial.name = name;
                    memorial.birth = birth;
                    memorial.death = death;
                    memorial.memBirthday = memBirthday;
                    memorial.memDeathDay = memDeathDay;
                    memorial.bio = bio;
                    memorial.phrases = phrases;
                    memorial.memory = memory;
                    memorial.tags = selectedTags;
                    memorial.photo = uploadedPhotoData;
                    currentMemorialId = memorial.id;
                }
            } else {
                // 创建新纪念空间
                const newMemorial = {
                    id: Date.now(),
                    name, birth, death, memBirthday, memDeathDay, bio, phrases, memory,
                    tags: selectedTags,
                    photo: uploadedPhotoData,
                    chatMessages: []
                };
                memorials.push(newMemorial);
                currentMemorialId = newMemorial.id;
            }

            saveMemorials();

            // 重置编辑状态
            isEditMode = false;
            editingMemorialId = null;

            // 进入该纪念空间的详情视图
            memorialViewMode = 'detail';
            renderMemorialDetail(currentMemorialId);
            showPage('memorial');
        }

        // ===== 纪念空间列表与详情 =====
        function renderMemorialList() {
            const container = document.getElementById('memorialList');
            if (memorials.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <div class="planet-body" style="opacity:0.3;background: radial-gradient(circle at 32% 28%, #FFE6C2, #E8B86D 55%, #9C6A2A);box-shadow: 0 0 22px rgba(232,184,109,0.2), inset -6px -6px 14px rgba(90,50,10,0.4);"></div>
                        </div>
                        <div class="empty-state-title">这里还很安静...</div>
                        <div class="empty-state-desc">第一颗星，等待被你点亮</div>
                        <button class="btn btn-primary empty-state-btn" onclick="prepareNewMemorial(); enterPageByPlanet('create')">创建纪念空间</button>
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
            container.innerHTML = memorials.map(m => `
                <div class="memorial-list-card" onclick="showMemorialDetailView(${m.id})">
                    <button class="card-delete" onclick="event.stopPropagation(); deleteMemorial(${m.id})" title="删除" aria-label="删除该纪念空间">✕</button>
                    <div class="card-photo">${m.photo ? `<img src="${m.photo}" loading="lazy" alt="${escapeHtml(m.name)}">` : '<svg class="svg-icon" viewBox="0 0 24 24" style="width:40px;height:40px;color:rgba(232,197,160,0.45);"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'}</div>
                    <div class="card-name">${escapeHtml(m.name)}</div>
                    <div class="card-dates">${m.birth && m.death ? `${escapeHtml(m.birth)} - ${escapeHtml(m.death)}` : (m.birth || m.death || '')}</div>
                    <div class="card-bio">${escapeHtml(m.bio || '暂无生平简介')}</div>
                </div>
            `).join('');
        }

        function deleteMemorial(id) {
            const memorial = memorials.find(m => m.id === id);
            if (!memorial) return;
            showCustomConfirm(`确定要删除「${memorial.name}」的纪念空间吗？该操作不可恢复，与之关联的基本信息和对话记录都将被清除。`, function() {
                memorials = memorials.filter(m => m.id !== id);
                saveMemorials();
                deleteOrbitData(id);
                if (currentMemorialId === id) currentMemorialId = null;
                memorialViewMode = 'list';
                renderMemorialList();
            }, '删除确认', '⚠️');
        }

        function renderMemorialView() {
            const listView = document.getElementById('memorialListView');
            const detailView = document.getElementById('memorialDetailView');
            if (memorialViewMode === 'detail' && currentMemorialId) {
                listView.style.display = 'none';
                detailView.style.display = 'block';
            } else {
                listView.style.display = 'block';
                detailView.style.display = 'none';
                renderMemorialList();
            }
        }

        function showMemorialListView() {
            memorialViewMode = 'list';
            renderMemorialView();
        }

        function showMemorialDetailView(id) {
            currentMemorialId = id;
            memorialViewMode = 'detail';
            renderMemorialDetail(id);
            renderMemorialView();
        }

        function renderMemorialDetail(id) {
            const memorial = memorials.find(m => m.id === id);
            if (!memorial) return;

            document.getElementById('memDisplayName').textContent = memorial.name;
            document.getElementById('memDisplayDates').textContent = memorial.birth && memorial.death ? `${memorial.birth} - ${memorial.death}` : (memorial.birth || memorial.death || '');
            document.getElementById('memDisplayBio').textContent = memorial.bio || '暂无生平简介';
            document.getElementById('chatName').textContent = memorial.name;

            const tagsContainer = document.getElementById('memDisplayTags');
            tagsContainer.innerHTML = (memorial.tags || []).map(tag => `<span class="memorial-tag">${escapeHtml(tag)}</span>`).join('');

            document.getElementById('timelineMemory').textContent = memorial.memory || '尚未添加回忆';

            // 照片
            const memPhoto = document.getElementById('memPhoto');
            const memPhotoPlaceholder = document.getElementById('memPhotoPlaceholder');
            if (memorial.photo) {
                memPhoto.src = memorial.photo;
                memPhoto.style.display = 'block';
                memPhotoPlaceholder.style.display = 'none';
            } else {
                memPhoto.style.display = 'none';
                memPhotoPlaceholder.style.display = 'flex';
            }
        }

        // ===== 性格标签选择 =====
        document.querySelectorAll('.personality-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
        });

        // ===== 温暖寄语 =====
        function refreshQuote() {
            const quoteText = document.getElementById('dailyQuote');
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            quoteText.style.opacity = '0';
            setTimeout(() => {
                quoteText.textContent = randomQuote;
                quoteText.style.opacity = '1';
            }, 300);
        }

        // ===== AI对话 =====