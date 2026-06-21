// wish.js - 记忆星系


        // 渲染主页：星系缩略图列表
        function renderWishMainPage() {
            const container = document.getElementById('galaxyThumbGrid');
            if (memorials.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg class="svg-icon" viewBox="0 0 24 24" style="width:60px;height:60px;color:var(--gold);opacity:0.3;"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
                        </div>
                        <div class="empty-state-title">星空在等待你的第一个心愿</div>
                        <div class="empty-state-desc">让思念化作星辰，永远闪耀</div>
                        <button class="btn btn-primary empty-state-btn" onclick="enterPageByPlanet('create')">许下心愿</button>
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
            container.innerHTML = memorials.map(m => {
                const galaxy = getWishGalaxy(m.name);
                const count = galaxy.wishes.length;
                return `
                    <div class="galaxy-thumb-card" onclick="enterWishGalaxy('${escapeHtml(m.name)}')">
                        <div class="galaxy-thumb-preview">
                            <div class="galaxy-thumb-star"></div>
                            ${count > 0 ? '<div class="galaxy-thumb-orbit o1"></div>' : ''}
                            ${count > 1 ? '<div class="galaxy-thumb-orbit o2"></div>' : ''}
                            ${count > 2 ? '<div class="galaxy-thumb-orbit o3"></div>' : ''}
                        </div>
                        <div class="galaxy-thumb-name">${escapeHtml(m.name)}的心愿星系</div>
                        <div class="galaxy-thumb-count"><span class="num">${count}</span> 个心愿</div>
                    </div>
                `;
            }).join('');
        }

        // 进入单个心愿星系（带动画）
        function enterWishGalaxy(name) {
            currentGalaxyName = name;
            wishViewMode = 'galaxy';

            // 播放进入动画
            const overlay = document.getElementById('wishEnterOverlay');
            const nameEl = document.getElementById('wishEnterName');
            nameEl.textContent = `${name}的心愿星系`;
            overlay.classList.add('active');

            setTimeout(() => {
                // 渲染星系
                renderWishGalaxy(name);
                // 切换视图
                document.getElementById('wishMainView').style.display = 'none';
                document.getElementById('wishGalaxyView').style.display = 'flex';
                // 名字淡出
                nameEl.style.opacity = '0';
                nameEl.style.transform = 'scale(1.2)';
            }, 1400);

            setTimeout(() => {
                // 遮罩淡出
                overlay.classList.remove('active');
                nameEl.style.opacity = '';
                nameEl.style.transform = '';
                // 进入星系后显示新手引导（仅首次）
                checkOnboarding();
            }, 2200);
        }

        // 返回心愿主页
        function returnToWishMain() {
            wishViewMode = 'main';
            currentGalaxyName = null;
            // 隐藏新手引导气泡
            const bubble = document.getElementById('onboardingBubble');
            if (bubble) bubble.style.display = 'none';
            document.getElementById('wishGalaxyView').style.display = 'none';
            document.getElementById('wishMainView').style.display = 'block';
            renderWishMainPage();
        }

        // 渲染单个心愿星系
        function renderWishGalaxy(name) {
            const galaxy = getWishGalaxy(name);
            const scene = document.getElementById('wishGalaxyScene');
            const wishes = galaxy.wishes;

            let html = `
                <div class="wish-central-star"></div>
                <div class="wish-star-label">${escapeHtml(name)}</div>
            `;

            // 为每个心愿创建一个轨道+行星
            wishes.forEach((wish, index) => {
                const orbitSize = 28 + index * 13; // 轨道大小递增
                const duration = 20 + index * 8;   // 公转周期递增
                const direction = index % 2 === 0 ? 'normal' : 'reverse';
                let planetClass = wish.status; // pending / claimed / completed
                // 已放飞的完成行星使用更小更明亮的样式
                if (wish.status === 'completed' && wish.released) planetClass += ' released';

                html += `
                    <div class="wish-orbit" style="
                        width: ${orbitSize}%;
                        height: ${orbitSize}%;
                        animation-duration: ${duration}s;
                        animation-direction: ${direction};
                    ">
                        <div class="wish-planet-wrap">
                            <div class="wish-planet ${planetClass}" data-wish-id="${wish.id}" style="
                                animation-duration: ${duration}s;
                                animation-direction: ${direction};
                            " onclick="showWishDetail(${wish.id})">
                                <div class="wish-planet-tooltip">${escapeHtml(wish.title)}</div>
                                ${wish.status === 'claimed' && wish.claimerName ? `<div class="wish-claimer-tag">${escapeHtml(wish.claimerName)}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            scene.innerHTML = html;

            // 更新心愿数量提示
            const countInfo = document.getElementById('wishCountInfo');
            if (countInfo) {
                countInfo.textContent = `${wishes.length} / ${MAX_WISHES} 颗心愿`;
            }

            // 触屏设备tooltip适配：长按行星显示标题
            scene.querySelectorAll('.wish-planet').forEach(planet => {
                let touchTimer = null;
                planet.addEventListener('touchstart', function(e) {
                    touchTimer = setTimeout(() => {
                        const tooltip = this.querySelector('.wish-planet-tooltip');
                        if (tooltip) {
                            tooltip.classList.add('touch-show');
                            e.preventDefault();
                        }
                    }, 500);
                });
                planet.addEventListener('touchend', function() {
                    if (touchTimer) clearTimeout(touchTimer);
                    const tooltip = this.querySelector('.wish-planet-tooltip');
                    if (tooltip) {
                        setTimeout(() => tooltip.classList.remove('touch-show'), 2000);
                    }
                });
                planet.addEventListener('touchmove', function() {
                    if (touchTimer) clearTimeout(touchTimer);
                });
            });
        }

        // 显示心愿详情弹窗
        function showWishDetail(wishId) {
            if (!currentGalaxyName) return;
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;

            const content = document.getElementById('wishDetailContent');

            let statusTag = '';
            let claimerInfo = '';
            let actionBtn = '';

            if (wish.status === 'pending') {
                statusTag = '<span class="wish-modal-status pending">漂浮中</span>';
                actionBtn = `<button class="btn btn-primary" onclick="claimWish(${wish.id})"><span>🤝</span> 我来完成</button>`;
            } else if (wish.status === 'claimed') {
                statusTag = `<span class="wish-modal-status claimed">已被 ${escapeHtml(wish.claimerName)} 接取</span>`;
                const avatar = wish.claimerName.charAt(0).toUpperCase();
                claimerInfo = `
                    <div class="wish-modal-claimer">
                        <div class="wish-modal-claimer-avatar">${escapeHtml(avatar)}</div>
                        <div>
                            <div class="wish-modal-claimer-name">${escapeHtml(wish.claimerName)}</div>
                            <div class="wish-modal-claimer-date">认领于 ${escapeHtml(wish.claimedDate || '')}</div>
                        </div>
                    </div>
                `;
                // 只有认领人自己可以确认完成
                if (wish.claimerName === globalNickName) {
                    actionBtn = `<button class="btn btn-primary" style="background: var(--planet-wish);" onclick="completeWish(${wish.id})"><span>✓</span> 确认已完成</button>`;
                } else {
                    actionBtn = `<button class="btn btn-secondary" disabled>等待 ${escapeHtml(wish.claimerName)} 完成</button>`;
                }
            } else if (wish.status === 'completed') {
                statusTag = '<span class="wish-modal-status completed">已完成</span>';
                const avatar = wish.claimerName ? wish.claimerName.charAt(0).toUpperCase() : '✓';
                claimerInfo = `
                    <div class="wish-modal-claimer">
                        <div class="wish-modal-claimer-avatar">${escapeHtml(avatar)}</div>
                        <div>
                            <div class="wish-modal-claimer-name">${escapeHtml(wish.claimerName || '已匿名完成')}</div>
                            <div class="wish-modal-claimer-date">完成于 ${escapeHtml(wish.completedDate || '')}</div>
                        </div>
                    </div>
                `;
                actionBtn = `<button class="btn btn-secondary" disabled>已完成 ✓</button>`;
            }

            content.innerHTML = `
                <div class="wish-modal-title">${escapeHtml(wish.title)}</div>
                ${statusTag}
                <div class="wish-modal-desc">${escapeHtml(wish.description || '暂无描述')}</div>
                ${claimerInfo}
                <div class="wish-modal-actions">
                    <button class="btn btn-secondary" onclick="closeWishDetail()">关闭</button>
                    ${wish.status === 'pending' ? `<button class="btn btn-secondary" onclick="editWish(${wish.id})">编辑</button>` : ''}
                    ${actionBtn}
                    <button class="btn btn-secondary" style="color:#ff9a9a;border-color:rgba(224,100,100,0.3);" onclick="deleteWish(${wish.id})">删除</button>
                </div>
            `;

            ModalManager.open('wishDetailOverlay');
        }

        function deleteWish(wishId) {
            if (!currentGalaxyName) return;
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;
            showCustomConfirm(`确定要删除心愿「${wish.title}」吗？此操作不可恢复。`, function() {
                galaxy.wishes = galaxy.wishes.filter(w => w.id !== wishId);
                saveWishGalaxies();
                closeWishDetail();
                renderWishGalaxy(currentGalaxyName);
            }, '删除心愿', '⚠️');
        }

        function closeWishDetail(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('wishDetailOverlay');
        }

        // 编辑心愿
        function editWish(wishId) {
            if (!currentGalaxyName) return;
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;

            const content = document.getElementById('wishDetailContent');
            content.innerHTML = `
                <div class="wish-modal-title">编辑心愿</div>
                <div class="form-group" style="margin-bottom:12px;">
                    <input type="text" class="form-input" id="editWishTitle" value="${escapeHtml(wish.title)}" placeholder="心愿标题" style="margin-bottom:12px;">
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <textarea class="form-input" id="editWishDesc" placeholder="详细描述..." rows="3" style="resize:vertical;">${escapeHtml(wish.description || '')}</textarea>
                </div>
                <div class="wish-modal-actions">
                    <button class="btn btn-secondary" onclick="showWishDetail(${wishId})">取消</button>
                    <button class="btn btn-primary" onclick="saveWishEdit(${wishId})"><span>✓</span> 保存</button>
                </div>
            `;
        }

        function saveWishEdit(wishId) {
            if (!currentGalaxyName) return;
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;

            const title = document.getElementById('editWishTitle').value.trim();
            const desc = document.getElementById('editWishDesc').value.trim();
            if (!title) {
                showCustomAlert('请输入心愿标题', '提示', '✍️');
                return;
            }
            wish.title = title;
            wish.description = desc;
            saveWishGalaxies();
            closeWishDetail();
            renderWishGalaxy(currentGalaxyName);
            showCustomAlert('心愿已更新', '保存成功', '✓');
        }

        // 认领心愿
        function claimWish(wishId) {
            if (!currentGalaxyName) return;
            // 检查是否设置了昵称
            if (!globalNickName) {
                closeWishDetail();
                showNickNameForm();
                return;
            }
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;

            wish.status = 'claimed';
            wish.claimerName = globalNickName;
            wish.claimerAvatar = globalNickName.charAt(0).toUpperCase();
            wish.claimedDate = new Date().toLocaleDateString('zh-CN');
            saveWishGalaxies();

            closeWishDetail();
            renderWishGalaxy(currentGalaxyName);
        }

        // 完成心愿（感恩弹窗 + 放飞动画）
        let pendingReleaseWishId = null;

        function completeWish(wishId) {
            if (!currentGalaxyName) return;
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;

            wish.status = 'completed';
            wish.released = true;
            wish.completedDate = new Date().toLocaleDateString('zh-CN');
            saveWishGalaxies();

            pendingReleaseWishId = wishId;
            closeWishDetail();

            // 详情弹窗关闭后显示感恩弹窗
            setTimeout(() => showGratitudePopup(wish), 320);
        }

        // 感恩弹窗
        function showGratitudePopup(wish) {
            document.getElementById('wishGratitudeText').textContent = '谢谢你帮TA完成了这个心愿';
            document.getElementById('wishGratitudeSub').textContent = '「' + (wish.title || '这个心愿') + '」已化作星光，永远闪耀在星空中';
            ModalManager.open('wishGratitudeOverlay');
        }

        function closeGratitudePopup(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('wishGratitudeOverlay');

            // 关闭感恩弹窗后播放放飞动画
            if (pendingReleaseWishId !== null) {
                const wishId = pendingReleaseWishId;
                pendingReleaseWishId = null;
                setTimeout(() => playReleaseAnimation(wishId), 420);
            }
        }

        // 放飞动画（行星脱离轨道向上飘飞 + 金色光粒 + 化作永久星）
        function playReleaseAnimation(wishId) {
            if (!currentGalaxyName) return;
            const galaxy = getWishGalaxy(currentGalaxyName);
            const wish = galaxy.wishes.find(w => w.id === wishId);
            if (!wish) return;

            // 找到当前 DOM 中的行星（此时仍为 claimed 样式，尚未重新渲染）
            const planet = document.querySelector('#wishGalaxyScene .wish-planet[data-wish-id="' + wishId + '"]');
            if (!planet) {
                renderWishGalaxy(currentGalaxyName);
                return;
            }

            const rect = planet.getBoundingClientRect();

            // 创建漂浮的行星副本
            const floatPlanet = document.createElement('div');
            floatPlanet.style.cssText =
                'position:fixed;left:' + rect.left + 'px;top:' + rect.top + 'px;' +
                'width:' + rect.width + 'px;height:' + rect.height + 'px;' +
                'border-radius:50%;' +
                'background:radial-gradient(circle at 32% 28%, #FFE6C2, #E8C5A0 55%, #9C7A4A);' +
                'box-shadow:0 0 18px rgba(232,197,160,0.5),0 0 36px rgba(244,184,96,0.3),inset -4px -4px 10px rgba(100,70,30,0.4);' +
                'z-index:9999;pointer-events:none;';
            document.body.appendChild(floatPlanet);

            // 隐藏原行星
            planet.style.visibility = 'hidden';

            const flyDistance = window.innerHeight * 0.72;
            const duration = 2800;
            const driftX = (Math.random() - 0.5) * 70;

            // 漂浮上升 + 缩小 + 淡出
            const flyAnim = floatPlanet.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: 'translate(' + driftX + 'px, ' + (-flyDistance) + 'px) scale(0.12)', opacity: 0 }
            ], { duration: duration, easing: 'cubic-bezier(0.33, 0, 0.5, 1)', fill: 'forwards' });

            // 沿途洒落金色光粒（孔明灯效果）
            const particleTimer = registerTimer(setInterval(() => {
                const r = floatPlanet.getBoundingClientRect();
                if (r.width === 0) return;
                const p = document.createElement('div');
                p.className = 'wish-release-particle';
                p.style.left = (r.left + r.width / 2 + (Math.random() - 0.5) * 22) + 'px';
                p.style.top = (r.top + r.height / 2) + 'px';
                document.body.appendChild(p);
                p.animate([
                    { opacity: 1, transform: 'scale(1) translate(0,0)' },
                    { opacity: 0, transform: 'scale(0.2) translate(' + ((Math.random() - 0.5) * 44) + 'px,' + (22 + Math.random() * 32) + 'px)' }
                ], { duration: 1200, easing: 'ease-out', fill: 'forwards' });
                setTimeout(() => p.remove(), 1200);
            }, 85));

            flyAnim.onfinish = () => {
                clearInterval(particleTimer);
                floatPlanet.remove();
                // 添加永久纪念星
                addMemorialStar(currentGalaxyName, wish.title);
                // 重新渲染星系（新已完成行星出现在原轨道）
                renderWishGalaxy(currentGalaxyName);
            };
        }

        // ===== 许愿长按仪式 =====
        let wishRitualHoldStart = 0;
        let wishRitualActive = false;

        function initWishAddButton() {
            const btn = document.getElementById('wishAddBtn');
            if (!btn) return;

            const startRitual = (e) => {
                if (e.cancelable) e.preventDefault();
                if (!currentGalaxyName) return;
                wishRitualHoldStart = Date.now();
                wishRitualActive = true;
                const overlay = document.getElementById('wishRitualOverlay');
                const light = document.getElementById('wishRitualLight');
                const hint = document.getElementById('wishRitualHint');
                overlay.classList.remove('fading');
                overlay.classList.add('active');
                light.classList.remove('fading');
                light.classList.add('active');
                setTimeout(() => { if (wishRitualActive) hint.classList.add('active'); }, 350);
            };

            const endRitual = () => {
                if (!wishRitualActive) return;
                wishRitualActive = false;
                const held = Date.now() - wishRitualHoldStart;
                const overlay = document.getElementById('wishRitualOverlay');
                const light = document.getElementById('wishRitualLight');
                const hint = document.getElementById('wishRitualHint');
                hint.classList.remove('active');

                if (held >= CONFIG.RITUAL_HOLD_DURATION) {
                    // 仪式完成：光点爆发后渐隐，弹出表单
                    light.style.animation = 'none';
                    light.style.transition = 'transform 0.45s ease, opacity 0.45s ease';
                    light.style.transform = 'translate(-50%, -50%) scale(2.8)';
                    light.style.opacity = '0';
                    setTimeout(() => {
                        overlay.classList.add('fading');
                        overlay.classList.remove('active');
                        resetRitualLight();
                        showNewWishForm();
                    }, 450);
                } else {
                    // 提前松开：快速渐隐，仍弹出表单（兜底）
                    light.classList.remove('active');
                    overlay.classList.add('fading');
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        overlay.classList.remove('fading');
                        resetRitualLight();
                        showNewWishForm();
                    }, 350);
                }
            };

            btn.addEventListener('mousedown', startRitual);
            btn.addEventListener('touchstart', startRitual, { passive: false });
            document.addEventListener('mouseup', endRitual);
            document.addEventListener('touchend', endRitual);
            btn.addEventListener('mouseleave', () => { if (wishRitualActive) endRitual(); });
        }

        function resetRitualLight() {
            const light = document.getElementById('wishRitualLight');
            light.style.animation = '';
            light.style.transition = '';
            light.style.transform = '';
            light.style.opacity = '';
            light.classList.remove('active');
        }

        // 显示新心愿表单
        function showNewWishForm() {
            if (!currentGalaxyName) return;
            document.getElementById('newWishTitle').value = '';
            document.getElementById('newWishDesc').value = '';
            ModalManager.open('wishFormOverlay');
        }

        function closeWishForm(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('wishFormOverlay');
        }

        // 提交新心愿（带增强流星 + 行星凝聚动画）
        function submitNewWish() {
            const title = document.getElementById('newWishTitle').value.trim();
            const desc = document.getElementById('newWishDesc').value.trim();

            if (!title) {
                showCustomAlert('请输入心愿标题', '提示', '✍️');
                return;
            }
            if (!currentGalaxyName) return;

            // 心愿数量上限检查
            const galaxy = getWishGalaxy(currentGalaxyName);
            if (galaxy.wishes.length >= MAX_WISHES) {
                showCustomAlert('每个星系最多容纳' + MAX_WISHES + '个心愿，请先完成或删除一些心愿', '心愿已满', '🌌');
                return;
            }

            closeWishForm();

            // 播放增强流星动画，到达轨道后凝聚成行星
            playMeteorAnimation(() => {
                const galaxy = getWishGalaxy(currentGalaxyName);
                const newWish = {
                    id: Date.now(),
                    title: title,
                    description: desc,
                    status: 'pending',
                    claimerName: '',
                    claimerAvatar: '',
                    completedDate: '',
                    claimedDate: '',
                    createdAt: new Date().toISOString()
                };
                galaxy.wishes.push(newWish);
                saveWishGalaxies();
                renderWishGalaxy(currentGalaxyName);

                // 为新行星播放凝聚动画
                const planets = document.querySelectorAll('#wishGalaxyScene .wish-planet');
                const newPlanet = planets[planets.length - 1];
                if (newPlanet) {
                    playPlanetFormation(newPlanet);
                }
            });
        }

        // 行星凝聚动画（透明→实体）
        function playPlanetFormation(planet) {
            const origDuration = planet.style.animationDuration;
            const origDirection = planet.style.animationDirection;
            planet.style.animation = 'none';
            const formAnim = planet.animate([
                { opacity: 0, transform: 'scale(0.2)', filter: 'blur(8px)' },
                { opacity: 0.7, transform: 'scale(0.8)', filter: 'blur(2px)', offset: 0.6 },
                { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }
            ], { duration: 1000, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' });
            formAnim.onfinish = () => {
                formAnim.cancel();
                planet.style.animation = '';
                planet.style.animationDuration = origDuration;
                planet.style.animationDirection = origDirection;
            };
        }

        // 增强流星动画（金色粒子拖尾 + 爆发）
        function playMeteorAnimation(callback) {
            const scene = document.getElementById('wishGalaxyScene');
            const rect = scene.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            // 目标：新行星轨道边缘
            const galaxy = getWishGalaxy(currentGalaxyName);
            const newIndex = galaxy.wishes.length;
            const orbitSizePct = 28 + newIndex * 13;
            const radius = rect.width * orbitSizePct / 100 / 2;
            const targetX = cx + radius;
            const targetY = cy;

            // 创建增强流星
            const meteor = document.createElement('div');
            meteor.className = 'wish-meteor-v2';
            meteor.style.left = cx + 'px';
            meteor.style.top = cy + 'px';
            document.body.appendChild(meteor);

            const flightDuration = 850;
            meteor.animate([
                { left: cx + 'px', top: cy + 'px', opacity: 1 },
                { left: targetX + 'px', top: targetY + 'px', opacity: 1 }
            ], {
                duration: flightDuration,
                easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
                fill: 'forwards'
            });

            // 沿途洒落金色粒子
            const particleTimer = registerTimer(setInterval(() => {
                const r = meteor.getBoundingClientRect();
                if (r.width === 0) return;
                const p = document.createElement('div');
                p.className = 'wish-meteor-particle';
                p.style.left = (r.left + r.width / 2) + 'px';
                p.style.top = (r.top + r.height / 2) + 'px';
                document.body.appendChild(p);
                p.animate([
                    { opacity: 1, transform: 'scale(1) translate(0,0)' },
                    { opacity: 0, transform: 'scale(0.2) translate(' + (Math.random() - 0.5) * 28 + 'px,' + (Math.random() - 0.5) * 28 + 'px)' }
                ], { duration: 800, easing: 'ease-out', fill: 'forwards' });
                setTimeout(() => p.remove(), 800);
            }, 45));

            // 流星到达后：爆发涟漪 + 金色粒子四散
            setTimeout(() => {
                clearInterval(particleTimer);
                meteor.style.transition = 'opacity 0.3s ease';
                meteor.style.opacity = '0';

                // 涟漪
                const ripple = document.createElement('div');
                ripple.className = 'wish-meteor-ripple';
                ripple.style.left = (targetX - 100) + 'px';
                ripple.style.top = (targetY - 100) + 'px';
                document.body.appendChild(ripple);

                // 爆发金色粒子
                for (let i = 0; i < 14; i++) {
                    const p = document.createElement('div');
                    p.className = 'wish-meteor-particle';
                    p.style.left = targetX + 'px';
                    p.style.top = targetY + 'px';
                    document.body.appendChild(p);
                    const a = (Math.PI * 2 * i) / 14;
                    const dist = 40 + Math.random() * 35;
                    p.animate([
                        { opacity: 1, transform: 'translate(0,0) scale(1)' },
                        { opacity: 0, transform: 'translate(' + Math.cos(a) * dist + 'px,' + Math.sin(a) * dist + 'px) scale(0.2)' }
                    ], { duration: 750, easing: 'ease-out', fill: 'forwards' });
                    setTimeout(() => p.remove(), 750);
                }

                setTimeout(() => {
                    meteor.remove();
                    ripple.remove();
                    if (callback) callback();
                }, 600);
            }, flightDuration);
        }

        // 昵称设置
        function showNickNameForm() {
            document.getElementById('nickNameInput').value = globalNickName;
            ModalManager.open('nickNameOverlay');
        }

        function closeNickNameForm(event) {
            if (event && event.target !== event.currentTarget) return;
            ModalManager.close('nickNameOverlay');
        }

        function saveNickNameFromForm() {
            const name = document.getElementById('nickNameInput').value.trim();
            if (!name) {
                showCustomAlert('请输入昵称', '提示', '✍️');
                return;
            }
            saveNickName(name);
            closeNickNameForm();
        }

        // 渲染心愿视图（根据当前模式）
        function renderWishView() {
            const mainView = document.getElementById('wishMainView');
            const galaxyView = document.getElementById('wishGalaxyView');
            if (wishViewMode === 'galaxy' && currentGalaxyName) {
                mainView.style.display = 'none';
                galaxyView.style.display = 'flex';
                renderWishGalaxy(currentGalaxyName);
            } else {
                mainView.style.display = 'block';
                galaxyView.style.display = 'none';
                renderWishMainPage();
            }
        }

        // ===== 家族共享 =====