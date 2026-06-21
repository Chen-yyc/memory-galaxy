// cursor.js - 自定义鼠标光标特效

        let _cursorInitialized = false;
        let _cursorEl = null;
        let _cursorX = 0;
        let _cursorY = 0;
        let _cursorMoved = false;
        let _cursorOverInput = false;
        let _trailFrameCount = 0;
        let _reducedMotion = false;

        // 悬停可交互元素的选择器
        const _cursorHoverSelectors = '.planet, .galaxy-core, button, a, .nav-item';

        // 元素主题色映射（对应 variables.css 中的行星色与金色）
        const _cursorThemeColors = [
            { selector: '.planet-memorial', color: '#E8B86D' },
            { selector: '.planet-create',   color: '#C5CCE0' },
            { selector: '.planet-chat',     color: '#7BA7D9' },
            { selector: '.planet-story',    color: '#B59AD9' },
            { selector: '.planet-wish',     color: '#7DD3C0' },
            { selector: '.planet-family',   color: '#E0A5B5' },
            { selector: '.galaxy-core',     color: '#FFD89B' }
        ];

        const _cursorDefaultColor = 'rgba(255,216,155,0.6)';
        const _cursorHoverColor = '#FFD89B';

        function initCustomCursor() {
            if (_cursorInitialized) return;
            _cursorInitialized = true;

            // 触屏设备不启用自定义光标
            if ('ontouchstart' in window) return;

            // 检测减弱动画偏好
            _reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // 创建光标元素
            _cursorEl = document.createElement('div');
            _cursorEl.className = 'custom-cursor';
            document.body.appendChild(_cursorEl);

            // 隐藏默认光标
            document.body.style.cursor = 'none';

            // 鼠标移动：更新位置、悬停状态并标记已移动
            document.addEventListener('mousemove', _onCursorMove, { passive: true });

            // 点击：产生涟漪（复用已有 .starfield-ripple 效果）
            document.addEventListener('click', _onCursorClick, { passive: true });

            // 鼠标离开窗口时隐藏自定义光标
            document.addEventListener('mouseout', _onCursorMouseOut, { passive: true });
            document.addEventListener('mouseover', _onCursorMouseOver, { passive: true });

            // 启动拖尾粒子循环（每帧检测是否需要产生粒子）
            requestAnimationFrame(_cursorTrailLoop);

            // 页面不可见时暂停拖尾
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    _cursorMoved = false;
                }
            });
        }

        function _onCursorMove(e) {
            _cursorX = e.clientX;
            _cursorY = e.clientY;

            // 更新光标位置
            _cursorEl.style.left = _cursorX + 'px';
            _cursorEl.style.top = _cursorY + 'px';

            // 标记已移动（供拖尾粒子循环使用）
            _cursorMoved = true;

            // 更新悬停状态
            _updateCursorHoverState(e.target);
        }

        function _updateCursorHoverState(target) {
            // 在 input/textarea 中：隐藏自定义光标，恢复默认光标
            const overInput = !!(target && target.closest('input, textarea'));
            if (overInput !== _cursorOverInput) {
                _cursorOverInput = overInput;
                if (overInput) {
                    _cursorEl.style.opacity = '0';
                    document.body.style.cursor = 'auto';
                } else {
                    _cursorEl.style.opacity = '';
                    document.body.style.cursor = 'none';
                }
            }

            if (overInput) return;

            // 检测是否悬停在可交互元素上
            const interactive = target ? target.closest(_cursorHoverSelectors) : null;
            if (interactive) {
                _cursorEl.classList.add('hover');
                _cursorEl.style.background = _getCursorHoverColor(interactive);
            } else {
                _cursorEl.classList.remove('hover');
                _cursorEl.style.background = _cursorDefaultColor;
            }
        }

        function _getCursorHoverColor(el) {
            for (let i = 0; i < _cursorThemeColors.length; i++) {
                if (el.matches(_cursorThemeColors[i].selector)) {
                    return _cursorThemeColors[i].color;
                }
            }
            return _cursorHoverColor;
        }

        function _cursorTrailLoop() {
            if (_cursorMoved && !_cursorOverInput) {
                _cursorMoved = false;
                _trailFrameCount++;

                // 减弱动画时减少拖尾粒子数量（每4帧产生一个）
                const skipFrames = _reducedMotion ? 4 : 1;
                if (_trailFrameCount % skipFrames === 0) {
                    _createCursorTrail(_cursorX, _cursorY);
                }
            }
            requestAnimationFrame(_cursorTrailLoop);
        }

        function _createCursorTrail(x, y) {
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.left = x + 'px';
            trail.style.top = y + 'px';
            document.body.appendChild(trail);
            // 0.5秒淡出后清理
            setTimeout(function() { trail.remove(); }, 500);
        }

        function _onCursorClick(e) {
            // 复用已有的 starfield-ripple 效果（createRipple 定义于 easter-eggs.js）
            // 避免与 easter-eggs.js 的星空涟漪彩蛋重复：
            //   该彩蛋仅在首页空白区域点击时触发（排除交互元素）
            //   此处在「非首页」或「首页交互元素」点击时补充涟漪，确保每次点击都有涟漪
            const homePage = document.getElementById('page-home');
            const isHomePage = !!(homePage && homePage.classList.contains('active'));
            const target = e.target;
            const isInteractive = !!(target && target.closest(
                'button, a, input, textarea, select, .nav-item, .planet, .galaxy-core, ' +
                '.modal, .overlay, .footer, .navbar, .prologue-overlay, .onboarding-bubble, [role="dialog"]'
            ));

            // 首页空白区域由 easter-eggs.js 处理，此处不重复创建
            if (isHomePage && !isInteractive) return;

            if (typeof createRipple === 'function') {
                createRipple(e.clientX, e.clientY);
            }
        }

        function _onCursorMouseOut(e) {
            // 鼠标离开窗口时隐藏自定义光标
            if (!e.relatedTarget) {
                _cursorEl.style.opacity = '0';
            }
        }

        function _onCursorMouseOver(e) {
            // 鼠标回到窗口时恢复显示（输入框中除外）
            if (!_cursorOverInput) {
                _cursorEl.style.opacity = '';
            }
        }
