// calendar.js - 星空日历模块

        let _calCurrentDate = new Date();
        let _calToday = new Date();
        let _calInitialized = false;

        // 简易农历提示（基于节气的诗意化提示，非精确农历）
        const _seasonalTips = [
            '小寒 · 旧岁近暮', '大寒 · 岁末严寒', '立春 · 万象更新', '雨水 · 春风化雨',
            '惊蛰 · 春雷乍响', '春分 · 昼夜均分', '清明 · 慎终追远', '谷雨 · 雨生百谷',
            '立夏 · 夏始之节', '小满 · 物致小满', '芒种 · 仲夏始至', '夏至 · 日长之至',
            '小暑 · 盛夏将至', '大暑 · 酷热鼎沸', '立秋 · 凉风至', '处暑 · 暑气止',
            '白露 · 露凝而白', '秋分 · 昼夜均分', '寒露 · 露气寒冷', '霜降 · 霜染秋叶',
            '立冬 · 冬之始也', '小雪 · 雪初降', '大雪 · 雪盛至此', '冬至 · 日短之至'
        ];

        function _getSeasonalTip(date) {
            const month = date.getMonth();
            const day = date.getDate();
            const idx = month * 2 + (day >= 15 ? 1 : 0);
            return _seasonalTips[idx] || '';
        }

        function _getWeekdayText(date) {
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return weekdays[date.getDay()];
        }

        function renderCalendar() {
            const year = _calCurrentDate.getFullYear();
            const month = _calCurrentDate.getMonth();
            const titleEl = document.getElementById('calTitle');
            const daysEl = document.getElementById('calDays');
            const lunarEl = document.getElementById('calLunar');
            if (!titleEl || !daysEl) return;

            titleEl.textContent = `${year}年${month + 1}月`;

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const firstDayWeek = firstDay.getDay();
            const daysInMonth = lastDay.getDate();
            const prevMonthLastDay = new Date(year, month, 0).getDate();

            const todayYear = _calToday.getFullYear();
            const todayMonth = _calToday.getMonth();
            const todayDate = _calToday.getDate();

            // 获取有纪念日的日期及详细信息
            const memoryDates = _getMemoryDates(year, month);

            let html = '';

            // 上月填充
            for (let i = firstDayWeek - 1; i >= 0; i--) {
                const day = prevMonthLastDay - i;
                html += `<div class="cal-day other-month">${day}</div>`;
            }

            // 本月日期
            for (let day = 1; day <= daysInMonth; day++) {
                const classes = ['cal-day'];
                const weekday = new Date(year, month, day).getDay();
                if (weekday === 0 || weekday === 6) classes.push('weekend');
                if (year === todayYear && month === todayMonth && day === todayDate) classes.push('today');
                if (memoryDates.has(day)) classes.push('has-memory');
                html += `<div class="${classes.join(' ')}" data-day="${day}">${day}</div>`;
            }

            // 下月填充
            const totalCells = firstDayWeek + daysInMonth;
            const remaining = (7 - (totalCells % 7)) % 7;
            for (let day = 1; day <= remaining; day++) {
                html += `<div class="cal-day other-month">${day}</div>`;
            }

            daysEl.innerHTML = html;

            // 绑定点击事件（有纪念日的日期）
            daysEl.querySelectorAll('.cal-day.has-memory').forEach(el => {
                el.style.cursor = 'pointer';
                el.addEventListener('click', () => {
                    const day = parseInt(el.dataset.day);
                    const infos = memoryDates.get(day);
                    if (infos) _showMemoryPopup(el, day, infos);
                });
            });

            // 底部农历/节气提示
            if (lunarEl) {
                const tip = _getSeasonalTip(_calCurrentDate);
                const weekdayText = _getWeekdayText(_calToday);
                lunarEl.textContent = `${weekdayText} · ${tip}`;
            }
        }

        // 从纪念数据中提取当前月份的生日和忌日，返回 Map<day, Array<{name, type, date}>>
        function _getMemoryDates(year, month) {
            const dates = new Map();
            if (typeof memorials === 'undefined' || !memorials) return dates;
            memorials.forEach(m => {
                if (m.birthDate) {
                    const d = new Date(m.birthDate);
                    if (d.getMonth() === month) {
                        if (!dates.has(d.getDate())) dates.set(d.getDate(), []);
                        dates.get(d.getDate()).push({ name: m.name, type: '生日', date: m.birthDate });
                    }
                }
                if (m.deathDate) {
                    const d = new Date(m.deathDate);
                    if (d.getMonth() === month) {
                        if (!dates.has(d.getDate())) dates.set(d.getDate(), []);
                        dates.get(d.getDate()).push({ name: m.name, type: '忌日', date: m.deathDate });
                    }
                }
            });
            return dates;
        }

        // 显示纪念日信息浮层
        function _showMemoryPopup(anchorEl, day, infos) {
            // 移除已有浮层
            const existing = document.getElementById('calMemoryPopup');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.id = 'calMemoryPopup';
            popup.className = 'cal-memory-popup';

            const dateStr = `${_calCurrentDate.getFullYear()}年${_calCurrentDate.getMonth() + 1}月${day}日`;
            let html = `<div class="cal-popup-date">${dateStr}</div>`;
            infos.forEach(info => {
                const icon = info.type === '生日' ? '🎂' : '🕯️';
                html += `<div class="cal-popup-item"><span class="cal-popup-icon">${icon}</span><span class="cal-popup-name">${escapeHtml(info.name)}</span><span class="cal-popup-type">${info.type}</span></div>`;
            });
            popup.innerHTML = html;

            // 定位到点击的日期附近
            const rect = anchorEl.getBoundingClientRect();
            popup.style.position = 'fixed';
            popup.style.left = rect.left + 'px';
            popup.style.top = (rect.bottom + 8) + 'px';

            document.body.appendChild(popup);

            // 触发动画
            requestAnimationFrame(() => popup.classList.add('show'));

            // 点击其他区域关闭
            const closeHandler = (e) => {
                if (!popup.contains(e.target) && e.target !== anchorEl) {
                    popup.classList.remove('show');
                    setTimeout(() => popup.remove(), 300);
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closeHandler);
            }, 100);
        }

        function initStarCalendar() {
            if (_calInitialized) return;
            _calInitialized = true;

            const cal = document.getElementById('starCalendar');
            const prevBtn = document.getElementById('calPrev');
            const nextBtn = document.getElementById('calNext');
            const todayBtn = document.getElementById('calToday');
            if (!cal) return;

            renderCalendar();

            prevBtn.addEventListener('click', () => {
                _calCurrentDate.setMonth(_calCurrentDate.getMonth() - 1);
                renderCalendar();
            });
            nextBtn.addEventListener('click', () => {
                _calCurrentDate.setMonth(_calCurrentDate.getMonth() + 1);
                renderCalendar();
            });

            todayBtn.addEventListener('click', () => {
                _calCurrentDate = new Date();
                renderCalendar();
            });

            _syncCalendarVisibility();
        }

        function _syncCalendarVisibility() {
            const cal = document.getElementById('starCalendar');
            if (!cal) return;
            const homePage = document.getElementById('page-home');
            const isHome = homePage && homePage.classList.contains('active');
            if (isHome) {
                cal.classList.add('visible');
            } else {
                cal.classList.remove('visible');
            }
        }

        // 页面切换时同步日历可见性（hook 到 showPage）
        const _originalShowPage = typeof showPage === 'function' ? showPage : null;
        if (_originalShowPage) {
            showPage = function(pageName) {
                _originalShowPage(pageName);
                // 用 requestAnimationFrame 替代 setTimeout，避免被 clearAllTimers 清理
                requestAnimationFrame(() => {
                    requestAnimationFrame(_syncCalendarVisibility);
                });
            };
        }
