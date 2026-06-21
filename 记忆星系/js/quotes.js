// quotes.js - 记忆星系

        const dailyQuotes = [
            '愿星光温柔，照亮你前行的路。',
            '逝去的人并没有离开，他们只是换了一种方式陪伴你。',
            '每一次想起，都是一次温柔的相遇。',
            '记忆是时间留给我们的礼物，好好珍藏。',
            '在宇宙的某个角落，TA正微笑着看着你。',
            '思念如星光，穿越时空，永不熄灭。',
            '你记得的每一个细节，都是爱的证明。',
            '生命会结束，但爱不会。',
            '那些被深深爱过的人，永远不会真正消失。',
            '把思念化作力量，带着TA的期许好好生活。',
            '星光不问赶路人，时光不负有心人。',
            '每一颗星星都是一个故事，每一段记忆都是一颗星。',
            'TA教会你的，将伴随你一生。',
            '回忆是心灵的港湾，在疲惫时给你温暖。',
            '爱过的人，会变成我们生命中的星光。',
            '不是所有的离别都是结束，有些是另一种开始。',
            '你心中那个温暖的角落，永远有TA的位置。',
            '带着爱前行，是对逝者最好的纪念。',
            '记忆的温度，足以温暖漫长的岁月。',
            '在思念中成长，在回忆中前行。',
            'TA的微笑，是你心中最美的风景。',
            '每一个被记住的瞬间，都是永恒。',
            '生命的意义不在于长短，而在于爱的深度。',
            '那些来不及说的话，星光会替你传递。',
            '珍惜当下，是对逝者最好的告慰。',
            '爱是穿越生死的力量，是永恒的星光。',
            '你的幸福，是TA最大的心愿。',
            '记忆中的温暖，足以抵御世间的寒冷。',
            'TA从未远去，只是住进了你的心里。',
            '带着TA的爱，勇敢地走向明天。',
            '每一个日出，都是TA给你的新希望。',
            '思念是一种温柔的痛，证明你曾经深爱过。',
            '在星空下许愿，TA一定能听到。',
            '回忆是座桥，连接着过去与未来。',
            'TA的生命在你身上延续，好好活出精彩。',
            '那些共同走过的路，是生命中最美的风景。',
            '爱不会因距离而消减，不会因时间而褪色。',
            '你笑的时候，TA也在笑；你哭的时候，TA在心疼。',
            '把每一天都活成对TA最好的纪念。',
            '星光下的思念，是最温柔的告白。'
        ];
        const FAVORITE_QUOTES_KEY = 'galaxy_favorite_quotes';
        let currentHomeQuote = '';
        let favoriteQuotes = [];

        function loadFavoriteQuotes() {
            try {
                const data = localStorage.getItem(FAVORITE_QUOTES_KEY);
                favoriteQuotes = data ? JSON.parse(data) : [];
            } catch(e) { favoriteQuotes = []; }
        }
        function saveFavoriteQuotes() {
            try { localStorage.setItem(FAVORITE_QUOTES_KEY, JSON.stringify(favoriteQuotes)); } catch(e) {}
        }
        function getDailyQuoteIndex() {
            const now = new Date();
            const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
            return dayOfYear % dailyQuotes.length;
        }
        function showHomeDailyQuote() {
            const idx = getDailyQuoteIndex();
            currentHomeQuote = dailyQuotes[idx];
            const el = document.getElementById('homeDailyQuote');
            if (el) {
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = currentHomeQuote;
                    el.style.opacity = '1';
                }, 200);
            }
            updateFavQuoteBtn();
        }
        function refreshHomeQuote() {
            let idx;
            do {
                idx = Math.floor(Math.random() * dailyQuotes.length);
            } while (dailyQuotes[idx] === currentHomeQuote && dailyQuotes.length > 1);
            currentHomeQuote = dailyQuotes[idx];
            const el = document.getElementById('homeDailyQuote');
            if (el) {
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = currentHomeQuote;
                    el.style.opacity = '1';
                }, 200);
            }
            updateFavQuoteBtn();
        }
        function updateFavQuoteBtn() {
            const btn = document.getElementById('favQuoteBtn');
            if (!btn) return;
            if (favoriteQuotes.includes(currentHomeQuote)) {
                btn.textContent = '♥ 已收藏';
                btn.classList.add('favorited');
            } else {
                btn.textContent = '♡ 收藏';
                btn.classList.remove('favorited');
            }
        }
        function toggleFavoriteQuote() {
            const idx = favoriteQuotes.indexOf(currentHomeQuote);
            if (idx > -1) {
                favoriteQuotes.splice(idx, 1);
            } else {
                favoriteQuotes.push(currentHomeQuote);
            }
            saveFavoriteQuotes();
            updateFavQuoteBtn();
        }
        function showFavoriteQuotes() {
            const list = document.getElementById('favoriteQuotesList');
            if (favoriteQuotes.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:40px 0;">还没有收藏的寄语，去收藏一些喜欢的句子吧 ✦</p>';
            } else {
                list.innerHTML = favoriteQuotes.map((q, i) => `
                    <div class="favorite-quote-item">
                        <button class="remove-favorite" onclick="removeFavoriteQuote(${i})">✕</button>
                        ${escapeHtml(q)}
                    </div>
                `).join('');
            }
            ModalManager.open('favoriteQuotesOverlay');
        }
        function removeFavoriteQuote(index) {
            favoriteQuotes.splice(index, 1);
            saveFavoriteQuotes();
            showFavoriteQuotes();
            updateFavQuoteBtn();
        }

        // ===== 纪念日提醒 =====