// festival.js - 记忆星系

        const ANNIV_CHECK_KEY = 'galaxy_anniv_checked_date';
        function checkAnniversaryReminders() {
            // 每天只提醒一次
            const today = new Date().toDateString();
            const lastChecked = localStorage.getItem(ANNIV_CHECK_KEY);
            if (lastChecked === today) return;
            localStorage.setItem(ANNIV_CHECK_KEY, today);

            const reminders = [];
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            memorials.forEach(m => {
                // 检查生日（memBirthday: 月日格式如 "03-15"）
                if (m.memBirthday) {
                    const anniv = checkDateProximity(m.memBirthday, todayDate);
                    if (anniv !== null) {
                        reminders.push({
                            name: m.name,
                            type: '生日',
                            days: anniv,
                            memorialId: m.id
                        });
                    }
                }
                // 检查忌日（memDeathDay: 月日格式）
                if (m.memDeathDay) {
                    const anniv = checkDateProximity(m.memDeathDay, todayDate);
                    if (anniv !== null) {
                        reminders.push({
                            name: m.name,
                            type: '忌日',
                            days: anniv,
                            memorialId: m.id
                        });
                    }
                }
            });

            if (reminders.length > 0) {
                showAnniversaryReminder(reminders);
            }
        }
        function checkDateProximity(monthDay, todayDate) {
            // monthDay 格式 "MM-DD"
            const parts = monthDay.split('-');
            if (parts.length !== 2) return null;
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            if (isNaN(month) || isNaN(day)) return null;

            const thisYear = todayDate.getFullYear();
            let target = new Date(thisYear, month - 1, day);
            target.setHours(0, 0, 0, 0);

            // 如果已过，看明年的
            if (target < todayDate) {
                target = new Date(thisYear + 1, month - 1, day);
                target.setHours(0, 0, 0, 0);
            }

            const diffDays = Math.round((target - todayDate) / 86400000);
            // 7天内提醒
            if (diffDays <= CONFIG.ANNIVERSARY_REMINDER_DAYS) {
                return diffDays;
            }
            return null;
        }
        function showAnniversaryReminder(reminders) {
            const overlay = document.getElementById('anniversaryReminderOverlay');
            const iconEl = document.getElementById('annivIcon');
            const titleEl = document.getElementById('annivTitle');
            const bodyEl = document.getElementById('annivBody');

            const first = reminders[0];
            iconEl.innerHTML = first.type === '生日'
                ? '<svg class="svg-icon" viewBox="0 0 24 24" style="width:40px;height:40px;color:#fff;"><path d="M20 21v-8H4v8M4 16s2-2 4-2 4 2 4 2 4-2 4-2M2 13h20M12 6a2 2 0 1 0 0-.01M12 2v4"/></svg>'
                : '<svg class="svg-icon" viewBox="0 0 24 24" style="width:40px;height:40px;color:#fff;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';

            if (reminders.length === 1) {
                titleEl.textContent = first.type === '生日' ? '生日纪念日将至' : '忌日纪念日将至';
                const dayText = first.days === 0 ? '今天' : first.days === 1 ? '明天' : `${first.days}天后`;
                bodyEl.innerHTML = `<span class="name">${escapeHtml(first.name)}</span>的${first.type}纪念日<span class="anniversary-reminder-days">${dayText}</span>就到了。<br>在这个特殊的日子里，不妨点一盏烛光，说几句心里话。`;
            } else {
                titleEl.textContent = '多个纪念日将至';
                const lines = reminders.map(r => {
                    const dayText = r.days === 0 ? '今天' : r.days === 1 ? '明天' : `${r.days}天后`;
                    return `<span class="name">${escapeHtml(r.name)}</span>的${r.type}（${dayText}）`;
                }).join('<br>');
                bodyEl.innerHTML = `近期有多个纪念日：<br>${lines}<br><br>在这些特殊的日子里，不妨点一盏烛光，说几句心里话。`;
            }

            ModalManager.open('anniversaryReminderOverlay');
        }
        function closeAnniversaryReminder() {
            ModalManager.close('anniversaryReminderOverlay');
        }

        // ===== 节日特别模式 =====
        // 传统节日数据（公历近似日期，清明和冬至为节气，春节和中元用硬编码近10年日期）
        const festivalData = {
            qingming: {
                name: '清明节',
                icon: '🌧️',
                desc: '清明时节，细雨纷纷。在这个缅怀先人的日子里，让我们点亮一盏心灯，寄托哀思。',
                rituals: [
                    { id: 'candle', icon: '🕯️', label: '点烛' },
                    { id: 'flower', icon: '🌸', label: '献花' },
                    { id: 'bow', icon: '🙇', label: '行礼' }
                ],
                rainEffect: true
            },
            zhongyuan: {
                name: '中元节',
                icon: '🏮',
                desc: '中元之夜，河灯漂流。在这个思念亲人的夜晚，让我们在心中放一盏河灯，照亮TA回家的路。',
                rituals: [
                    { id: 'candle', icon: '🕯️', label: '点烛' },
                    { id: 'lantern', icon: '🏮', label: '放河灯' },
                    { id: 'incense', icon: '🪔', label: '上香' }
                ],
                rainEffect: false
            },
            dongzhi: {
                name: '冬至',
                icon: '❄️',
                desc: '冬至阳生，万物待春。在这个最长的夜晚，让我们围炉忆旧，温暖彼此的心。',
                rituals: [
                    { id: 'candle', icon: '🕯️', label: '点烛' },
                    { id: 'dumpling', icon: '🥟', label: '忆饺子' },
                    { id: 'toast', icon: '🍵', label: '敬茶' }
                ],
                rainEffect: false
            },
            springFestival: {
                name: '春节',
                icon: '🧧',
                desc: '新春佳节，万家团圆。在这个喜庆的日子里，让我们在心中为TA留一个位置，共度佳节。',
                rituals: [
                    { id: 'candle', icon: '🕯️', label: '点烛' },
                    { id: 'firework', icon: '🎆', label: '放烟花' },
                    { id: 'toast', icon: '🥂', label: '敬酒' }
                ],
                rainEffect: false
            }
        };

        // TODO: 农历节日日期目前硬编码只到2033年，后续维护者应使用农历计算库（如 lunar-javascript）替代
        const lunarFestivalDates = {
            springFestival: ['2024-02-10','2025-01-29','2026-02-17','2027-02-06','2028-01-26','2029-02-13','2030-02-03','2031-01-23','2032-02-11','2033-01-31'],
            zhongyuan: ['2024-08-18','2025-08-07','2026-08-27','2027-08-16','2028-08-05','2029-08-24','2030-08-13','2031-08-03','2032-08-21','2033-08-09']
        };

        function getCurrentFestival() {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            const todayMonthDay = `${today.getMonth()+1}-${today.getDate()}`;

            // 清明：4月4-5日
            if (todayMonthDay === '4-4' || todayMonthDay === '4-5') {
                return 'qingming';
            }
            // 冬至：12月21-22日
            if (todayMonthDay === '12-21' || todayMonthDay === '12-22') {
                return 'dongzhi';
            }
            // 春节和中元：查表
            if (lunarFestivalDates.springFestival.includes(todayStr)) return 'springFestival';
            if (lunarFestivalDates.zhongyuan.includes(todayStr)) return 'zhongyuan';

            return null;
        }

        function initFestivalMode() {
            const festivalKey = getCurrentFestival();
            if (!festivalKey) return;

            const fest = festivalData[festivalKey];
            const banner = document.getElementById('festivalBanner');
            const bannerIcon = document.getElementById('festivalIcon');
            const bannerText = document.getElementById('festivalText');

            bannerIcon.innerHTML = renderRitualIcon(fest.icon, 22);
            bannerText.textContent = `今日是${fest.name}，点击参与纪念仪式`;
            banner.style.cursor = 'pointer';
            banner.onclick = function() { showFestivalRitual(festivalKey); };

            setTimeout(() => banner.classList.add('show'), 1000);

            // 清明雨滴效果
            if (fest.rainEffect) {
                const rainContainer = document.getElementById('festivalRain');
                rainContainer.classList.add('active');
                for (let i = 0; i < 60; i++) {
                    const drop = document.createElement('div');
                    drop.className = 'raindrop';
                    drop.style.left = Math.random() * 100 + '%';
                    drop.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
                    drop.style.animationDelay = Math.random() * 3 + 's';
                    drop.style.height = (20 + Math.random() * 30) + 'px';
                    rainContainer.appendChild(drop);
                }
            }
        }

        function showFestivalRitual(festivalKey) {
            const fest = festivalData[festivalKey];
            const overlay = document.getElementById('festivalRitualOverlay');
            document.getElementById('ritualIcon').innerHTML = renderRitualIcon(fest.icon, 48);
            document.getElementById('ritualTitle').textContent = `${fest.name} · 纪念仪式`;
            document.getElementById('ritualDesc').textContent = fest.desc;

            const actionsEl = document.getElementById('ritualActions');
            const ritualStateKey = `galaxy_ritual_${festivalKey}_${new Date().toDateString()}`;
            const doneRituals = JSON.parse(localStorage.getItem(ritualStateKey) || '[]');

            actionsEl.innerHTML = fest.rituals.map(r => {
                const done = doneRituals.includes(r.id);
                return `<button class="ritual-action-btn ${done ? 'done' : ''}" onclick="performRitual('${festivalKey}','${r.id}','${r.icon}','${r.label}')">${renderRitualIcon(r.icon, 20)} ${done ? '✓ ' : ''}${r.label}</button>`;
            }).join('');

            ModalManager.open('festivalRitualOverlay');
        }

        function performRitual(festivalKey, ritualId, icon, label) {
            // 播放动画
            const animate = document.getElementById('ritualAnimate');
            animate.innerHTML = renderRitualIcon(icon, 56);
            animate.classList.remove('lit');
            void animate.offsetWidth;
            animate.classList.add('lit');

            // 记录完成状态
            const ritualStateKey = `galaxy_ritual_${festivalKey}_${new Date().toDateString()}`;
            const doneRituals = JSON.parse(localStorage.getItem(ritualStateKey) || '[]');
            if (!doneRituals.includes(ritualId)) {
                doneRituals.push(ritualId);
                localStorage.setItem(ritualStateKey, JSON.stringify(doneRituals));
            }

            // 更新按钮状态
            setTimeout(() => {
                showFestivalRitual(festivalKey);
            }, 800);
        }

        function closeFestivalRitual() {
            ModalManager.close('festivalRitualOverlay');
        }

        // ===== 家族共享 Tab 切换 =====