// router.js - 记忆星系

        // ===== 定时器注册与清理机制（页面切换时清理活跃定时器，防止内存泄漏） =====
        const _activeTimers = new Set();
        function registerTimer(timer) {
            _activeTimers.add(timer);
            return timer;
        }
        function clearAllTimers() {
            _activeTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
            _activeTimers.clear();
        }

        function showPage(pageName) {
            // 切换页面前清理当前页面的所有活跃定时器
            clearAllTimers();

            // AI对话需要先选择一个纪念空间
            if (pageName === 'chat' && !currentMemorialId) {
                pageName = 'memorial';
                memorialViewMode = 'list';
            }

            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active', 'show');
            });
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            const targetPage = document.getElementById(`page-${pageName}`);
            if (targetPage) {
                targetPage.classList.add('active');
                setTimeout(() => targetPage.classList.add('show'), 50);
            }

            const navItem = document.querySelector(`[data-page="${pageName}"]`);
            if (navItem) navItem.classList.add('active');

            // 子页面状态
            document.body.classList.toggle('on-subpage', pageName !== 'home');

            // 极光帷幕色调随子页面行星色系变化
            const auroraColors = {
                home: '232,197,160',
                memorial: '232,184,109',
                create: '197,204,224',
                chat: '123,167,217',
                story: '181,154,217',
                wish: '125,211,192',
                family: '224,165,181'
            };
            const aurora = document.getElementById('auroraVeil');
            if (aurora) aurora.style.setProperty('--aurora-color', auroraColors[pageName] || auroraColors.home);

            // 关闭移动端菜单
            document.getElementById('navMenu').classList.remove('open');

            // 返回星系时重置星系缩放
            if (pageName === 'home') {
                const stage = document.getElementById('galaxyStage');
                if (stage && (stage.classList.contains('zooming') || stage.style.transform)) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            stage.style.transform = '';
                            stage.classList.remove('zooming');
                            stage.querySelectorAll('.planet.entering').forEach(p => p.classList.remove('entering'));
                            // 修复：清除所有轨道和行星的暂停状态，避免返回后行星不动
                            stage.querySelectorAll('.orbit').forEach(orbit => {
                                orbit.style.animationPlayState = '';
                                delete orbit.dataset.pausedCount;
                                orbit.querySelectorAll('.planet').forEach(p => {
                                    p.style.animationPlayState = '';
                                });
                            });
                        });
                    });
                }
            }

            // 纪念空间页面：按当前模式渲染列表或详情
            if (pageName === 'memorial') {
                renderMemorialView();
            }

            // 心愿传承页面：按当前模式渲染
            if (pageName === 'wish') {
                renderWishView();
            }

            // AI对话页面：加载当前纪念空间的对话记录
            if (pageName === 'chat') {
                loadChatMessages();
            }

            // 生命星轨页面：渲染星轨
            if (pageName === 'story') {
                renderOrbit();
            }

            window.scrollTo(0, 0);
        }

        // ===== 行星进入转场 =====
        function enterPageByPlanet(pageName, planetEl) {
            if (isTransitioning) return;
            // 纪念空间：进入列表视图
            if (pageName === 'memorial') {
                memorialViewMode = 'list';
            }
            // 心愿传承：进入主页视图
            if (pageName === 'wish') {
                wishViewMode = 'main';
                currentGalaxyName = null;
            }
            // AI对话需要先选择一个纪念空间
            if (pageName === 'chat' && !currentMemorialId) {
                pageName = 'memorial';
                memorialViewMode = 'list';
                planetEl = document.querySelector('.planet-memorial');
            }

            const stage = document.getElementById('galaxyStage');
            planetEl = planetEl || document.querySelector(`.planet[data-page="${pageName}"]`);

            if (!planetEl || !stage) {
                showPage(pageName);
                return;
            }

            isTransitioning = true;
            const scale = 2.8;

            // 计算行星相对舞台中心的偏移
            const stageRect = stage.getBoundingClientRect();
            const planetRect = planetEl.getBoundingClientRect();
            const stageCenterX = stageRect.left + stageRect.width / 2;
            const stageCenterY = stageRect.top + stageRect.height / 2;
            const planetCenterX = planetRect.left + planetRect.width / 2;
            const planetCenterY = planetRect.top + planetRect.height / 2;
            const px = planetCenterX - stageCenterX;
            const py = planetCenterY - stageCenterY;

            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            const dx = viewportCenterX - stageCenterX - scale * px;
            const dy = viewportCenterY - stageCenterY - scale * py;

            planetEl.classList.add('entering');
            stage.classList.add('zooming');
            // 星尘爆发：从行星位置迸发细小粒子
            burstStardust(planetCenterX, planetCenterY, planetEl);
            // 强制重排后应用变换，确保过渡生效
            void stage.offsetWidth;
            stage.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

            // 星空轻微视差移动
            const starfield = document.getElementById('starfield');
            starfield.style.transform = `translate3d(${-px * 0.04}px, ${-py * 0.04}px, 0)`;

            setTimeout(() => {
                showPage(pageName);
                isTransitioning = false;
            }, 950);
        }

        // ===== 返回星系 =====
        function returnToGalaxy() {
            if (isTransitioning) return;
            const currentPage = document.querySelector('.page.active');
            if (currentPage && currentPage.id !== 'page-home') {
                currentPage.classList.remove('show');
                setTimeout(() => {
                    showPage('home');
                    // 还原星空视差
                    document.getElementById('starfield').style.transform = '';
                }, 380);
            } else {
                showPage('home');
                document.getElementById('starfield').style.transform = '';
            }
        }

        // ===== 返回纪念空间（从子页面） =====
        function goToMemorial() {
            memorialViewMode = currentMemorialId ? 'detail' : 'list';
            showPage('memorial');
        }

        // ===== 取消创建/编辑 =====
        function cancelCreate() {
            isEditMode = false;
            editingMemorialId = null;
            memorialViewMode = currentMemorialId ? 'detail' : 'list';
            showPage('memorial');
        }

        // ===== 星空生成（使用DocumentFragment优化性能） =====

        function initPlanetInteractions() {
            document.querySelectorAll('.planet').forEach(planet => {
                const pageName = planet.dataset.page;

                // 悬停时暂停所属轨道及该轨道上所有行星，避免未悬停行星因轨道停转而持续旋转
                // 使用计数器替代布尔值，防止多个行星交替悬停时过早恢复动画
                planet.addEventListener('mouseenter', () => {
                    const orbit = planet.closest('.orbit');
                    if (orbit) {
                        const currentCount = parseInt(orbit.dataset.pausedCount || '0');
                        orbit.dataset.pausedCount = currentCount + 1;
                        orbit.style.animationPlayState = 'paused';
                        orbit.querySelectorAll('.planet').forEach(p => p.style.animationPlayState = 'paused');
                    }
                });
                planet.addEventListener('mouseleave', () => {
                    const stage = document.getElementById('galaxyStage');
                    if (!stage.classList.contains('zooming')) {
                        const orbit = planet.closest('.orbit');
                        if (orbit) {
                            // 恢复时递减计数器，仅当所有悬停都结束时才恢复动画
                            const currentCount = parseInt(orbit.dataset.pausedCount || '0');
                            if (currentCount > 0) {
                                orbit.dataset.pausedCount = currentCount - 1;
                            }
                            if (parseInt(orbit.dataset.pausedCount || '0') === 0) {
                                orbit.style.animationPlayState = '';
                                orbit.querySelectorAll('.planet').forEach(p => p.style.animationPlayState = '');
                            }
                        }
                    }
                });

                // 点击进入
                planet.addEventListener('click', () => {
                    enterPageByPlanet(pageName, planet);
                });

                // 键盘可访问性：Enter/Space 触发进入
                planet.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        enterPageByPlanet(pageName, planet);
                    }
                });
            });
        }

        // ===== 每日寄语 =====