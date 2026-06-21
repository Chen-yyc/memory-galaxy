// prologue.js - 星空序言模块

        const PROLOGUE_KEY = 'memoryGalaxy_prologue_v1';
        let _prologueTimers = [];

        // 序言文案配置（文案 + 延迟毫秒，最后一行自动高亮）
        const PROLOGUE_LINES = [
            { text: '每一颗星', delay: 500 },
            { text: '都是一段不愿遗忘的记忆', delay: 2800 },
            { text: '在浩瀚星河中', delay: 5500 },
            { text: '我们为逝去的亲人点亮一颗星', delay: 7800 },
            { text: '让思念有处安放', delay: 10500 },
            { text: '让爱，以温柔的方式延续', delay: 12800, final: true },
        ];

        // 动态生成序言文案 DOM
        function _buildPrologueLines() {
            const container = document.getElementById('prologueContent');
            if (!container) return;
            container.innerHTML = '';
            PROLOGUE_LINES.forEach(line => {
                const p = document.createElement('p');
                p.className = line.final ? 'prologue-line prologue-line-final' : 'prologue-line';
                p.dataset.delay = line.delay;
                p.textContent = line.text;
                container.appendChild(p);
            });
        }

        // 检测是否开启了减弱动画偏好
        function _prefersReducedMotion() {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        // 检查是否首次访问，显示星空序言
        function initPrologue() {
            _buildPrologueLines(); // 动态生成文案

            let isFirstVisit = false;
            try {
                if (!localStorage.getItem(PROLOGUE_KEY)) {
                    isFirstVisit = true;
                }
            } catch(e) {
                // localStorage 不可用时也显示序言
                isFirstVisit = true;
            }

            if (!isFirstVisit) return;

            const overlay = document.getElementById('prologueOverlay');
            if (!overlay) return;

            // 减弱动画偏好下，缩短所有延迟
            const speedFactor = _prefersReducedMotion() ? 0.2 : 1;

            // 显示遮罩层
            requestAnimationFrame(() => {
                overlay.classList.add('active');
                overlay.setAttribute('aria-hidden', 'false');
            });

            // 绑定跳过按钮
            const skipBtn = document.getElementById('prologueSkip');
            if (skipBtn) {
                skipBtn.addEventListener('click', endPrologue, { once: true });
            }

            // 逐行显示文字
            const lines = overlay.querySelectorAll('.prologue-line');
            lines.forEach(line => {
                const delay = Math.round((parseInt(line.dataset.delay) || 0) * speedFactor);
                const timer = setTimeout(() => {
                    line.classList.add('visible');
                }, delay);
                _prologueTimers.push(timer);
            });

            // 最后一行显示后，停留一段时间再整体消散
            const lastLine = lines[lines.length - 1];
            const lastDelay = Math.round((parseInt(lastLine.dataset.delay) || 12000) * speedFactor);
            const holdTime = _prefersReducedMotion() ? 800 : 3500;
            const fadeStartDelay = lastDelay + holdTime;
            const endTimer = setTimeout(endPrologue, fadeStartDelay);
            _prologueTimers.push(endTimer);
        }

        // 结束序言，文字消散后移除遮罩
        function endPrologue() {
            const overlay = document.getElementById('prologueOverlay');
            if (!overlay || overlay.classList.contains('fading')) return;

            // 清理未触发的定时器
            _prologueTimers.forEach(t => clearTimeout(t));
            _prologueTimers = [];

            const reduced = _prefersReducedMotion();
            const lineStagger = reduced ? 50 : 200;
            const overlayFadeDelay = reduced ? 200 : 600;
            const overlayFadeDuration = reduced ? 400 : 1500;

            // 文字逐行消散
            const lines = overlay.querySelectorAll('.prologue-line.visible');
            lines.forEach((line, i) => {
                setTimeout(() => {
                    line.classList.remove('visible');
                    line.classList.add('fading');
                }, i * lineStagger);
            });

            // 遮罩层淡出
            const fadeTimer = setTimeout(() => {
                overlay.classList.add('fading');
                overlay.setAttribute('aria-hidden', 'true');

                // 完全移除
                const removeTimer = setTimeout(() => {
                    overlay.classList.remove('active', 'fading');
                    overlay.style.display = 'none';
                }, overlayFadeDuration);
                _prologueTimers.push(removeTimer);
            }, lines.length * lineStagger + overlayFadeDelay);
            _prologueTimers.push(fadeTimer);

            // 标记已观看
            try {
                localStorage.setItem(PROLOGUE_KEY, '1');
            } catch(e) {}

            // 序言结束后不直接触发新手引导
            // checkOnboarding 已在进入心愿星系时自然触发（wish.js enterWishGalaxy）
            // 避免序言刚结束就弹出引导气泡，让用户先欣赏主界面
        }

        // 重温序言（手动触发，不检查 localStorage）
        function replayPrologue() {
            const overlay = document.getElementById('prologueOverlay');
            if (!overlay) return;

            _buildPrologueLines(); // 重新生成文案

            // 重置状态
            overlay.style.display = '';
            overlay.classList.remove('active', 'fading');
            overlay.setAttribute('aria-hidden', 'false');

            // 清理所有文字状态
            overlay.querySelectorAll('.prologue-line').forEach(line => {
                line.classList.remove('visible', 'fading');
            });

            // 清理旧定时器
            _prologueTimers.forEach(t => clearTimeout(t));
            _prologueTimers = [];

            // 重新显示
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });

            // 绑定跳过按钮（重新绑定，因为 once: true 已消耗）
            const skipBtn = document.getElementById('prologueSkip');
            if (skipBtn) {
                skipBtn.removeEventListener('click', endPrologue);
                skipBtn.addEventListener('click', endPrologue, { once: true });
            }

            // 逐行显示文字
            const speedFactor = _prefersReducedMotion() ? 0.2 : 1;
            const lines = overlay.querySelectorAll('.prologue-line');
            lines.forEach(line => {
                const delay = Math.round((parseInt(line.dataset.delay) || 0) * speedFactor);
                const timer = setTimeout(() => {
                    line.classList.add('visible');
                }, delay);
                _prologueTimers.push(timer);
            });

            // 自动结束
            const lastLine = lines[lines.length - 1];
            const lastDelay = Math.round((parseInt(lastLine.dataset.delay) || 12000) * speedFactor);
            const holdTime = _prefersReducedMotion() ? 800 : 3500;
            const endTimer = setTimeout(endPrologue, lastDelay + holdTime);
            _prologueTimers.push(endTimer);
        }
