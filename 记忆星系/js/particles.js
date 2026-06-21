// particles.js - 记忆星系

        // 保存上次的窗口尺寸，用于 resize 时按比例换算星星位置（而非随机重分配）
        let _prevWinW = window.innerWidth;
        let _prevWinH = window.innerHeight;
        const _handleResize = debounce(function() {
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            const oldW = _prevWinW;
            const oldH = _prevWinH;
            if (oldW > 0 && oldH > 0) {
                // 按比例换算永久星位置，避免 resize 后星星位置突变
                memorialStars.forEach(star => {
                    star.x = star.x / oldW * newW;
                    star.y = star.y / oldH * newH;
                });
            }
            _prevWinW = newW;
            _prevWinH = newH;
            saveMemorialStars();
            renderMemorialStars();
        }, 300);
        window.addEventListener('resize', _handleResize);

        // ===== 生命星轨：主题池 =====

        function initParticles() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const layers = [
                { id: 'starLayer1', count: 90, minSize: 1, maxSize: 2, twinkle: 'twinkle-1' },
                { id: 'starLayer2', count: 55, minSize: 0.5, maxSize: 1.5, twinkle: 'twinkle-2' },
                { id: 'starLayer3', count: 32, minSize: 2, maxSize: 3.5, twinkle: 'twinkle-3' }
            ];
            layers.forEach(layer => {
                const el = document.getElementById(layer.id);
                const fragment = document.createDocumentFragment();
                for (let i = 0; i < layer.count; i++) {
                    const star = document.createElement('div');
                    star.className = 'star ' + layer.twinkle;
                    const size = layer.minSize + Math.random() * (layer.maxSize - layer.minSize);
                    star.style.cssText =
                        'left:' + (Math.random() * w) + 'px;' +
                        'top:' + (Math.random() * (h + 1200)) + 'px;' +
                        'width:' + size + 'px;' +
                        'height:' + size + 'px;' +
                        'opacity:' + (0.3 + Math.random() * 0.7).toFixed(2) + ';' +
                        'animation-delay:' + (Math.random() * 8).toFixed(1) + 's;';
                    fragment.appendChild(star);
                }
                el.appendChild(fragment);
            });
        }

        // ===== 鼠标交互统一处理（合并视差/星尘/按钮光效，减少mousemove监听数） =====
        function initMouseInteraction() {
            const starfield = document.getElementById('starfield');
            const isTouch = window.matchMedia('(hover: none)').matches;
            let raf = null;
            // 星尘对象池复用
            const sparkPool = [];
            let sparkIdx = 0;
            let sparkLast = 0;
            const sparkInterval = 80;
            const poolSize = CONFIG.SPARK_POOL_SIZE;
            if (!isTouch) {
                for (let i = 0; i < poolSize; i++) {
                    const el = document.createElement('div');
                    el.className = 'cursor-spark';
                    el.style.display = 'none';
                    document.body.appendChild(el);
                    sparkPool.push(el);
                }
            }

            // 统一视差管理：合并鼠标视差和滚动视差，避免互相覆盖
            window._starfieldParallax = { mouseX: 0, mouseY: 0, scrollX: 0, scrollY: 0 };
            function _applyStarfieldParallax() {
                const p = window._starfieldParallax;
                starfield.style.transform = `translate3d(${p.mouseX + p.scrollX}px, ${p.mouseY + p.scrollY}px, 0)`;
            }

            document.addEventListener('mousemove', (e) => {
                // 1. 星空视差（RAF节流）
                if (!raf) {
                    raf = requestAnimationFrame(() => {
                        const x = (e.clientX / window.innerWidth - 0.5);
                        const y = (e.clientY / window.innerHeight - 0.5);
                        window._starfieldParallax.mouseX = x * -18;
                        window._starfieldParallax.mouseY = y * -18;
                        _applyStarfieldParallax();
                        raf = null;
                    });
                }
                // 2. 按钮径向光效
                const btn = e.target.closest('.btn');
                if (btn) {
                    const rect = btn.getBoundingClientRect();
                    btn.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
                    btn.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
                }
                // 3. 鼠标星尘（时间节流，触屏不启用）
                if (!isTouch) {
                    const now = Date.now();
                    if (now - sparkLast >= sparkInterval) {
                        sparkLast = now;
                        const spark = sparkPool[sparkIdx];
                        sparkIdx = (sparkIdx + 1) % poolSize;
                        spark.style.left = (e.clientX - 3.5) + 'px';
                        spark.style.top = (e.clientY - 3.5) + 'px';
                        spark.style.display = '';
                        spark.style.animation = 'none';
                        void spark.offsetWidth; // 触发重排以重启动画
                        spark.style.animation = '';
                        clearTimeout(spark._timer);
                        spark._timer = setTimeout(() => { spark.style.display = 'none'; }, 900);
                    }
                }
            }, { passive: true });
        }

        // ===== 创建/编辑纪念空间 =====

        function burstStardust(x, y, planetEl) {
            const glow = getComputedStyle(planetEl).getPropertyValue('--planet-glow').trim() || 'rgba(232,197,160,0.8)';
            const count = 14;
            for (let i = 0; i < count; i++) {
                const dust = document.createElement('div');
                dust.className = 'stardust';
                dust.style.left = x + 'px';
                dust.style.top = y + 'px';
                dust.style.background = glow;
                dust.style.boxShadow = `0 0 8px ${glow}`;
                document.body.appendChild(dust);
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
                const dist = 50 + Math.random() * 70;
                const dx = Math.cos(angle) * dist;
                const dy = Math.sin(angle) * dist;
                const dur = 700 + Math.random() * 500;
                dust.animate([
                    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
                ], { duration: dur, easing: 'cubic-bezier(0.2,0.6,0.3,1)', fill: 'forwards' });
                setTimeout(() => dust.remove(), dur + 50);
            }
        }

        // 鼠标星尘逻辑已合并至 initMouseInteraction

        // ===== 行星交互绑定 =====