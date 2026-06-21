// loader.js - 宇宙诞生加载动画

let _loaderTimers = [];

function _prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function _clearLoaderTimers() {
    _loaderTimers.forEach(t => clearTimeout(t));
    _loaderTimers = [];
}

function _removeLoader(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    _clearLoaderTimers();
}

/**
 * 宇宙诞生加载动画
 * 在 DOMContentLoaded 回调最开始调用，覆盖一切内容。
 * 动画序列总时长约 3 秒：
 *   0  -0.5s ：中心白色光点出现并放大
 *   0.5-1.2s：光点爆发，30-50 个粒子向四周扩散
 *   1.2-2.0s：粒子汇聚，形成旋转圆环（星系轮廓）
 *   2.0-2.8s：圆环展开并淡出
 *   2.8-3.0s：遮罩完全消失
 */
function initLoader() {
    // 防止重复创建
    if (document.getElementById('loaderOverlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'loader-overlay';
    overlay.id = 'loaderOverlay';
    overlay.setAttribute('aria-hidden', 'true');

    // 中心光点
    const core = document.createElement('div');
    core.className = 'loader-core';
    overlay.appendChild(core);

    document.body.appendChild(overlay);

    // 尊重 prefers-reduced-motion：直接快速淡出（0.5 秒）
    if (_prefersReducedMotion()) {
        const t1 = setTimeout(() => {
            overlay.classList.add('fade-out');
        }, 100);
        const t2 = setTimeout(() => {
            _removeLoader(overlay);
        }, 600);
        _loaderTimers.push(t1, t2);
        return;
    }

    // ===== 阶段1（0-0.5s）：中心光点出现并放大 =====
    // CSS animation: loaderCoreExpand 0.5s forwards 已在 .loader-core 上设置

    // ===== 阶段2（0.5-1.2s）：光点爆发，粒子向四周扩散 =====
    const burstTimer = setTimeout(() => {
        // 光点爆发：放大并淡出
        core.style.animation = 'none';
        core.style.opacity = '1';
        core.style.transform = 'scale(2)';
        // 强制重排，确保过渡起点生效
        void core.offsetHeight;
        core.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        core.style.transform = 'scale(4)';
        core.style.opacity = '0';

        // 创建 30-50 个粒子，随机角度和距离飞出
        const particleCount = 30 + Math.floor(Math.random() * 21); // 30-50
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'loader-particle';

            // 随机角度（均匀分布 + 随机扰动）
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6;
            // 随机距离
            const distance = 80 + Math.random() * 140;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            // 随机大小
            const size = 2 + Math.random() * 3;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            particle.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease';
            particle.style.opacity = '1';
            overlay.appendChild(particle);
            particles.push({ el: particle, dx, dy });

            // 触发飞出动画
            requestAnimationFrame(() => {
                particle.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
            });
        }

        // ===== 阶段3（1.2-2.0s）：粒子汇聚，形成星系圆环 =====
        const convergeTimer = setTimeout(() => {
            const ringRadius = 90;
            particles.forEach((p, i) => {
                const angle = (Math.PI * 2 * i) / particles.length;
                const tx = Math.cos(angle) * ringRadius;
                const ty = Math.sin(angle) * ringRadius;
                p.el.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease';
                p.el.style.transform = 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px))';
                p.el.style.opacity = '0.9';
            });

            // 创建旋转圆环
            const ring = document.createElement('div');
            ring.className = 'loader-ring';
            overlay.appendChild(ring);
            // 触发圆环展开旋转动画
            requestAnimationFrame(() => {
                ring.classList.add('visible');
            });
        }, 700); // 0.5s + 0.7s = 1.2s
        _loaderTimers.push(convergeTimer);

        // ===== 阶段4（2.0-2.8s）：圆环展开，淡出 =====
        const expandTimer = setTimeout(() => {
            const ring = overlay.querySelector('.loader-ring');
            if (ring) {
                // 移除动画，改用过渡
                ring.classList.remove('visible');
                ring.style.animation = 'none';
                ring.style.opacity = '1';
                ring.style.transform = 'translate(-50%, -50%) scale(1) rotate(180deg)';
                void ring.offsetHeight; // 强制重排
                ring.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
                ring.style.transform = 'translate(-50%, -50%) scale(2.5) rotate(360deg)';
                ring.style.opacity = '0';
            }
            // 粒子淡出
            overlay.querySelectorAll('.loader-particle').forEach(p => {
                p.style.transition = 'opacity 0.8s ease';
                p.style.opacity = '0';
            });
        }, 1500); // 0.5s + 1.5s = 2.0s
        _loaderTimers.push(expandTimer);
    }, 500);
    _loaderTimers.push(burstTimer);

    // ===== 阶段5（2.8-3.0s）：遮罩完全消失 =====
    const fadeTimer = setTimeout(() => {
        overlay.classList.add('fade-out');
        const removeTimer = setTimeout(() => {
            _removeLoader(overlay);
        }, 800); // 等待 fade-out 过渡完成
        _loaderTimers.push(removeTimer);
    }, 2800);
    _loaderTimers.push(fadeTimer);
}
