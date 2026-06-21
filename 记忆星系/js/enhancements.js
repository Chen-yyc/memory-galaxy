// enhancements.js - 记忆星系

        (function() {
            'use strict';

            /* ========== 1. AOS 滚动动画初始化 ========== */
            function initAOS() {
                if (typeof AOS === 'undefined') return;
                AOS.init({
                    duration: 800,
                    easing: 'galaxy-ease',
                    once: true,
                    offset: 60,
                    delay: 0,
                    disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                });
                // 页面切换后刷新AOS
                document.addEventListener('pageChanged', function() {
                    setTimeout(function() { AOS.refresh(); }, 100);
                });
            }

            /* ========== 2. 为元素自动添加AOS动画属性 ========== */
            function addAOSAttributes() {
                // 区块标题 - 淡入下移
                document.querySelectorAll('.section-header').forEach(function(el, i) {
                    if (!el.hasAttribute('data-aos')) {
                        el.setAttribute('data-aos', 'fade-down');
                        el.setAttribute('data-aos-delay', String(i * 50));
                    }
                });

                // 卡片 - 放大淡入
                document.querySelectorAll(
                    '.memorial-detail-card, .quick-action-card, .galaxy-thumb-card, ' +
                    '.wish-card, .memorial-list-card, .glass-card-enhanced'
                ).forEach(function(el, i) {
                    if (!el.hasAttribute('data-aos')) {
                        el.setAttribute('data-aos', 'zoom-in');
                        el.setAttribute('data-aos-delay', String((i % 4) * 80));
                    }
                });

                // 时间线项 - 左侧淡入
                document.querySelectorAll('.timeline-item, .memory-timeline-item').forEach(function(el, i) {
                    if (!el.hasAttribute('data-aos')) {
                        el.setAttribute('data-aos', 'fade-right');
                        el.setAttribute('data-aos-delay', String(i * 100));
                    }
                });

                // 按钮组 - 上浮淡入（跳过空状态按钮和弹窗内按钮，避免动态生成后 opacity 卡在 0）
                document.querySelectorAll('.btn-primary, .btn-secondary').forEach(function(el, i) {
                    if (el.closest('.empty-state, .custom-modal, .overlay, .wish-modal')) return;
                    if (!el.hasAttribute('data-aos')) {
                        el.setAttribute('data-aos', 'fade-up');
                        el.setAttribute('data-aos-delay', String((i % 3) * 60));
                    }
                });
            }

            /* ========== 3. Tilt.js 3D倾斜效果初始化 ========== */
            function initTilt() {
                if (typeof VanillaTilt === 'undefined') return;
                var tiltElements = document.querySelectorAll(
                    '.memorial-detail-card, .galaxy-thumb-card, .quick-action-card, .gradient-border-card'
                );
                tiltElements.forEach(function(el) {
                    if (el._tiltInitialized) return;
                    el._tiltInitialized = true;
                    VanillaTilt.init(el, {
                        max: 8,
                        speed: 400,
                        glare: true,
                        'max-glare': 0.15,
                        scale: 1.03,
                        perspective: 1000,
                        transition: true
                    });
                });
            }

            /* ========== 4. 按钮涟漪效果 ========== */
            function initRippleEffect() {
                var buttons = document.querySelectorAll('.btn, .quick-action-btn, .nav-item');
                buttons.forEach(function(btn) {
                    if (btn._rippleInit) return;
                    btn._rippleInit = true;
                    btn.classList.add('ripple-btn');

                    btn.addEventListener('click', function(e) {
                        var rect = btn.getBoundingClientRect();
                        var size = Math.max(rect.width, rect.height);
                        var x = e.clientX - rect.left - size / 2;
                        var y = e.clientY - rect.top - size / 2;

                        var ripple = document.createElement('span');
                        ripple.className = 'ripple-effect';
                        ripple.style.width = ripple.style.height = size + 'px';
                        ripple.style.left = x + 'px';
                        ripple.style.top = y + 'px';
                        btn.appendChild(ripple);

                        setTimeout(function() {
                            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                        }, 650);
                    });
                });
            }

            /* ========== 6. 文字微光效果应用到标题 ========== */
            function initTextShimmer() {
                var titles = document.querySelectorAll('.galaxy-hero-title, .section-header h2');
                titles.forEach(function(title) {
                    // 仅在悬停时添加微光，避免持续动画干扰
                    title.addEventListener('mouseenter', function() {
                        title.classList.add('text-shimmer');
                    });
                    title.addEventListener('mouseleave', function() {
                        title.classList.remove('text-shimmer');
                    });
                });
            }

            /* ========== 7. 行星悬停时光芒射线效果 ========== */
            function initPlanetRays() {
                var planets = document.querySelectorAll('.planet');
                planets.forEach(function(planet) {
                    if (planet._raysInit) return;
                    planet._raysInit = true;

                    planet.addEventListener('mouseenter', function() {
                        var body = planet.querySelector('.planet-body');
                        if (!body || body.querySelector('.planet-rays')) return;

                        var rays = document.createElement('div');
                        rays.className = 'planet-rays';
                        rays.style.cssText =
                            'position:absolute;inset:-20%;pointer-events:none;' +
                            'background:conic-gradient(from 0deg,' +
                            'transparent 0deg, rgba(232,197,160,0.15) 5deg, transparent 10deg,' +
                            'transparent 80deg, rgba(232,197,160,0.12) 85deg, transparent 90deg,' +
                            'transparent 170deg, rgba(232,197,160,0.15) 175deg, transparent 180deg,' +
                            'transparent 260deg, rgba(232,197,160,0.12) 265deg, transparent 270deg);' +
                            'border-radius:50%;animation:planetRaysSpin 3s linear infinite;' +
                            'opacity:0;transition:opacity 0.4s ease;';
                        body.appendChild(rays);
                        requestAnimationFrame(function() { rays.style.opacity = '1'; });
                    });

                    planet.addEventListener('mouseleave', function() {
                        var rays = planet.querySelector('.planet-rays');
                        if (rays) {
                            rays.style.opacity = '0';
                            setTimeout(function() {
                                if (rays.parentNode) rays.parentNode.removeChild(rays);
                            }, 400);
                        }
                    });
                });

                // 注入光线旋转动画
                if (!document.getElementById('planet-rays-style')) {
                    var style = document.createElement('style');
                    style.id = 'planet-rays-style';
                    style.textContent = '@keyframes planetRaysSpin { to { transform: rotate(360deg); } }';
                    document.head.appendChild(style);
                }
            }

            /* ========== 8. 渐变边框卡片类自动添加 ========== */
            function addGradientBorderClass() {
                document.querySelectorAll('.memorial-detail-card, .galaxy-thumb-card').forEach(function(el) {
                    el.classList.add('gradient-border-card');
                });
            }

            /* ========== 9. 页面切换后重新初始化动态元素 ========== */
            var _pageSwitchObserver = null;
            function setupPageChangeRefresh() {
                if (_pageSwitchObserver) _pageSwitchObserver.disconnect();
                // 仅观察页面容器的 class 变化（页面切换时触发），避免全树监听导致性能问题
                var pages = document.querySelectorAll('.page');
                _pageSwitchObserver = new MutationObserver(function(mutations) {
                    var shouldRefresh = false;
                    mutations.forEach(function(m) {
                        if (m.attributeName === 'class' &&
                            (m.target.classList.contains('active') || m.target.classList.contains('show'))) {
                            shouldRefresh = true;
                        }
                    });
                    if (shouldRefresh) {
                        clearTimeout(window._enhanceRefreshTimer);
                        window._enhanceRefreshTimer = setTimeout(function() {
                            addAOSAttributes();
                            initTilt();
                            initRippleEffect();
                            initTextShimmer();
                            initPlanetRays();
                            addGradientBorderClass();
                            if (typeof AOS !== 'undefined') AOS.refresh();
                        }, 300);
                    }
                });
                pages.forEach(function(page) {
                    _pageSwitchObserver.observe(page, { attributes: true, attributeFilter: ['class'] });
                });
            }

            /* ========== 初始化入口 ========== */
            function initAll() {
                addAOSAttributes();
                addGradientBorderClass();
                initAOS();
                initTilt();
                initRippleEffect();
                initTextShimmer();
                initPlanetRays();
                setupPageChangeRefresh();
            }

            // DOMContentLoaded 或已加载后执行
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initAll);
            } else {
                initAll();
            }

            // 窗口加载完成后再次刷新
            window.addEventListener('load', function() {
                if (typeof AOS !== 'undefined') AOS.refresh();
            });
        })();