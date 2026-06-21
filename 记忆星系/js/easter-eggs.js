// easter-eggs.js - 星空彩蛋模块

        // ===== 彩蛋1：点击星空涟漪 =====
        // 在首页空白区域点击时，从点击位置扩散金色光涟漪

        let _rippleInitialized = false;
        function initStarfieldRipple() {
            if (_rippleInitialized) return;
            _rippleInitialized = true;

            document.addEventListener('click', function(e) {
                // 仅在首页（星系页面）触发
                const homePage = document.getElementById('page-home');
                if (!homePage || !homePage.classList.contains('active')) return;

                // 排除点击在按钮、链接、输入框、弹窗等交互元素上
                const target = e.target;
                if (target.closest('button, a, input, textarea, select, .nav-item, .planet, .galaxy-core, .modal, .overlay, .footer, .navbar, .prologue-overlay, .onboarding-bubble, [role="dialog"]')) return;

                createRipple(e.clientX, e.clientY);
            }, { passive: true });
        }

        function createRipple(x, y) {
            // 涟漪
            const ripple = document.createElement('div');
            ripple.className = 'starfield-ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            document.body.appendChild(ripple);

            // 中心小星点
            const spark = document.createElement('div');
            spark.className = 'ripple-spark';
            spark.style.left = x + 'px';
            spark.style.top = y + 'px';
            document.body.appendChild(spark);

            // 清理
            setTimeout(() => { ripple.remove(); spark.remove(); }, 2000);
        }

        // ===== 彩蛋2：流星许愿 =====
        // 点击流星时，流星化为光粒散开，浮现一句温暖寄语

        let _meteorWishInitialized = false;
        function initMeteorWish() {
            if (_meteorWishInitialized) return;
            _meteorWishInitialized = true;

            // 流星可见时添加高亮提示类，引导用户点击
            _startMeteorHighlight();

            // 流星是 pointer-events: none 的，需要通过 document click 检测点击位置是否在流星附近
            document.addEventListener('click', function(e) {
                // 仅在首页触发
                const homePage = document.getElementById('page-home');
                if (!homePage || !homePage.classList.contains('active')) return;

                // 排除交互元素
                const target = e.target;
                if (target.closest('button, a, input, textarea, select, .nav-item, .planet, .galaxy-core, .modal, .overlay, .footer, .navbar, .prologue-overlay, .onboarding-bubble, [role="dialog"]')) return;

                // 检测点击位置附近是否有可见的流星
                const meteors = document.querySelectorAll('.shooting-star');
                const clickX = e.clientX;
                const clickY = e.clientY;
                const hitRadius = 100; // 命中半径（增大，提升命中率）

                for (const meteor of meteors) {
                    const rect = meteor.getBoundingClientRect();
                    // 流星动画中 opacity 为 0 时不触发
                    const opacity = parseFloat(getComputedStyle(meteor).opacity);
                    if (opacity < 0.3) continue;

                    // 使用流星轨迹的多个采样点检测命中（流星是横向移动的线，不只是中心点）
                    const meteorX = rect.left + rect.width / 2;
                    const meteorY = rect.top + rect.height / 2;
                    const dist = Math.hypot(clickX - meteorX, clickY - meteorY);

                    if (dist < hitRadius) {
                        triggerMeteorWish(meteorX, meteorY, meteor);
                        break;
                    }
                }
            }, { passive: true });
        }

        function triggerMeteorWish(x, y, meteorEl) {
            // 流星化为光粒散开
            const particleCount = 10;
            for (let i = 0; i < particleCount; i++) {
                const p = document.createElement('div');
                p.className = 'meteor-wish-particle';
                p.style.left = x + 'px';
                p.style.top = y + 'px';
                document.body.appendChild(p);

                const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
                const dist = 30 + Math.random() * 50;
                const dx = Math.cos(angle) * dist;
                const dy = Math.sin(angle) * dist;
                const dur = 800 + Math.random() * 400;

                p.animate([
                    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
                ], { duration: dur, easing: 'cubic-bezier(0.2,0.6,0.3,1)', fill: 'forwards' });
                setTimeout(() => p.remove(), dur + 50);
            }

            // 浮现寄语
            const wishes = [
                '此刻，有一颗星正在想你',
                '你的愿望，星光已收到',
                '许下的愿，终会抵达',
                '在星空下许愿，TA一定能听到',
                '流星划过，带走了思念，留下了祝福',
                '每一颗流星，都是一次温柔的回应',
            ];
            const wish = wishes[Math.floor(Math.random() * wishes.length)];

            const wishEl = document.createElement('div');
            wishEl.className = 'meteor-wish-text';
            wishEl.textContent = wish;
            wishEl.style.left = x + 'px';
            wishEl.style.top = (y - 30) + 'px';
            document.body.appendChild(wishEl);

            // 触发动画
            requestAnimationFrame(() => {
                wishEl.classList.add('show');
            });

            // 淡出移除
            setTimeout(() => {
                wishEl.classList.add('fade');
            }, 2500);
            setTimeout(() => {
                wishEl.remove();
            }, 4000);
        }

        // ===== 彩蛋3：长按空白处浮现寄语 =====
        // 在星空空白处长按 1.5 秒，浮现一句随机思念短句

        let _holdQuoteInitialized = false;
        let _holdTimer = null;
        let _holdQuoteEl = null;

        function initHoldForQuote() {
            if (_holdQuoteInitialized) return;
            _holdQuoteInitialized = true;

            const HOLD_DURATION = 1500;

            // 触屏和鼠标统一处理
            document.addEventListener('pointerdown', function(e) {
                // 仅在首页触发
                const homePage = document.getElementById('page-home');
                if (!homePage || !homePage.classList.contains('active')) return;

                // 排除交互元素
                const target = e.target;
                if (target.closest('button, a, input, textarea, select, .nav-item, .planet, .galaxy-core, .modal, .overlay, .footer, .navbar, .prologue-overlay, .onboarding-bubble, [role="dialog"]')) return;

                const x = e.clientX;
                const y = e.clientY;

                _holdTimer = setTimeout(() => {
                    showHoldQuote(x, y);
                }, HOLD_DURATION);
            }, { passive: true });

            // 释放或移动时取消
            function cancelHold() {
                if (_holdTimer) {
                    clearTimeout(_holdTimer);
                    _holdTimer = null;
                }
            }

            document.addEventListener('pointerup', cancelHold, { passive: true });
            document.addEventListener('pointermove', function(e) {
                // 移动超过 10px 取消长按
                if (_holdTimer && e.buttons > 0) {
                    // pointerdown 的位置无法直接获取，用粗略判断
                    cancelHold();
                }
            }, { passive: true });
            document.addEventListener('pointercancel', cancelHold, { passive: true });
        }

        function showHoldQuote(x, y) {
            _holdTimer = null;

            // 如果已有寄语在显示，不重复
            if (_holdQuoteEl && _holdQuoteEl.parentNode) return;

            // 复用 dailyQuotes
            const quotes = (typeof dailyQuotes !== 'undefined') ? dailyQuotes : ['思念如星光，穿越时空，永不熄灭。'];
            const quote = quotes[Math.floor(Math.random() * quotes.length)];

            _holdQuoteEl = document.createElement('div');
            _holdQuoteEl.className = 'hold-quote-text';
            _holdQuoteEl.textContent = quote;
            _holdQuoteEl.style.left = x + 'px';
            _holdQuoteEl.style.top = y + 'px';
            document.body.appendChild(_holdQuoteEl);

            requestAnimationFrame(() => {
                _holdQuoteEl.classList.add('show');
            });

            // 4 秒后淡出
            setTimeout(() => {
                if (_holdQuoteEl) {
                    _holdQuoteEl.classList.add('fade');
                    setTimeout(() => {
                        if (_holdQuoteEl) {
                            _holdQuoteEl.remove();
                            _holdQuoteEl = null;
                        }
                    }, 1500);
                }
            }, 4000);
        }

        // ===== 流星高亮提示 =====
        // 定期检测流星可见性，可见时添加高亮类引导用户点击
        let _meteorHighlightTimer = null;
        function _startMeteorHighlight() {
            if (_meteorHighlightTimer) return;
            _meteorHighlightTimer = setInterval(() => {
                const homePage = document.getElementById('page-home');
                if (!homePage || !homePage.classList.contains('active')) {
                    // 不在首页时清除所有流星高亮
                    document.querySelectorAll('.shooting-star.meteor-glow').forEach(m => m.classList.remove('meteor-glow'));
                    return;
                }

                document.querySelectorAll('.shooting-star').forEach(meteor => {
                    const opacity = parseFloat(getComputedStyle(meteor).opacity);
                    if (opacity > 0.3) {
                        meteor.classList.add('meteor-glow');
                    } else {
                        meteor.classList.remove('meteor-glow');
                    }
                });
            }, 200);
        }

        // ===== 初始化所有彩蛋 =====
        function initEasterEggs() {
            initStarfieldRipple();
            initMeteorWish();
            initHoldForQuote();
        }
