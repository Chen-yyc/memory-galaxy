// scroll-narrative.js - 滚动叙事与入场动画编排

        let _narrativeInitialized = false;

        function initScrollNarrative() {
            if (_narrativeInitialized) return;
            _narrativeInitialized = true;

            _setupEntranceSequence();
            _setupParallaxScroll();
        }

        // 入场动画编排：首页元素按序列依次出现
        function _setupEntranceSequence() {
            const homePage = document.getElementById('page-home');
            if (!homePage) return;

            // 定义入场序列（选择器, 延迟ms）
            const sequence = [
                { sel: '.galaxy-intro .badge', delay: 200 },
                { sel: '.galaxy-intro h1', delay: 500 },
                { sel: '.galaxy-intro p', delay: 900 },
                { sel: '.galaxy-core', delay: 1200 },
                { sel: '.orbit-1', delay: 1600 },
                { sel: '.orbit-2', delay: 1900 },
                { sel: '.orbit-3', delay: 2200 },
                { sel: '.galaxy-deco-left', delay: 2500 },
                { sel: '.galaxy-deco-right', delay: 2600 },
                { sel: '.galaxy-hint', delay: 3000 },
                { sel: '.galaxy-actions', delay: 3200 },
                { sel: '.daily-quote-section', delay: 3500 },
                { sel: '.star-calendar', delay: 2800 },
            ];

            // 初始状态：所有元素隐藏
            sequence.forEach(item => {
                const el = document.querySelector(item.sel);
                if (el) {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                    el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                }
            });

            // 检测是否有序言（首次访问），有序言时延迟启动入场
            let startDelay = 500;
            try {
                if (!localStorage.getItem('memoryGalaxy_prologue_v1')) {
                    startDelay = 16000; // 序言大约 15 秒
                }
            } catch(e) {}

            // 减弱动画偏好下快速入场
            const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduced) startDelay = 200;

            setTimeout(() => {
                sequence.forEach(item => {
                    setTimeout(() => {
                        const el = document.querySelector(item.sel);
                        if (el) {
                            el.style.opacity = '';
                            el.style.transform = '';
                        }
                    }, reduced ? 50 : item.delay);
                });
            }, startDelay);
        }

        // 视差滚动：首页滚动时星空背景缓慢移动
        function _setupParallaxScroll() {
            const starfield = document.getElementById('starfield');
            const homePage = document.getElementById('page-home');
            if (!starfield || !homePage) return;

            let ticking = false;

            function updateParallax() {
                const scrollY = window.scrollY;
                const isHome = homePage.classList.contains('active');

                if (isHome && scrollY > 0 && scrollY < 800) {
                    // 星空背景缓慢上移（视差效果）—— 通过统一视差管理器，避免与鼠标视差互相覆盖
                    if (window._starfieldParallax) {
                        window._starfieldParallax.scrollX = 0;
                        window._starfieldParallax.scrollY = scrollY * 0.3;
                        // 触发合并应用
                        const p = window._starfieldParallax;
                        starfield.style.transform = `translate3d(${p.mouseX + p.scrollX}px, ${p.mouseY + p.scrollY}px, 0)`;
                    } else {
                        starfield.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;
                    }
                    // 星系内容也微微视差
                    const stage = document.getElementById('galaxyStage');
                    if (stage && !stage.classList.contains('zooming')) {
                        const intro = document.querySelector('.galaxy-intro');
                        if (intro) {
                            intro.style.transform = `translateY(${scrollY * 0.15}px)`;
                            intro.style.opacity = String(Math.max(0, 1 - scrollY / 400));
                        }
                    }
                } else if (isHome && scrollY === 0) {
                    // 回到顶部时清除滚动视差偏移
                    if (window._starfieldParallax) {
                        window._starfieldParallax.scrollX = 0;
                        window._starfieldParallax.scrollY = 0;
                    }
                }

                ticking = false;
            }

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            }, { passive: true });
        }
