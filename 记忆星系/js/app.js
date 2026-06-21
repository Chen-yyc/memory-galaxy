// app.js - 记忆星系

        document.addEventListener('DOMContentLoaded', function() {
            // 宇宙诞生加载动画（最先执行，覆盖一切）
            initLoader();

            // 星空序言（首次访问时显示，需最先执行）
            initPrologue();

            loadMemorials();
            loadWishGalaxies();
            loadNickName();
            loadMemorialStars();
            loadFamilyMessages();
            loadFamilyMembersData();
            migrateOldStoryData();
            loadAISettings(); // async：内部解密完成后会自动调用 updateAIModeBadge
            loadFavoriteQuotes();
            loadMemoryWall();
            loadHeritageTree();
            initParticles();
            initMouseInteraction();
            initFamilyMembers();
            initPlanetInteractions();
            initWishAddButton();
            renderFamilyMessages();
            renderMemorialList();
            renderWishMainPage();
            renderMemorialStars();
            showHomeDailyQuote();
            initFestivalMode();
            updateStorageUsageDisplay();
            initEasterEggs();
            initStarCalendar();
            initCustomCursor();
            initScrollNarrative();
            setTimeout(checkAnniversaryReminders, 2000);

            // 导航点击
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    const page = this.dataset.page;
                    if (page === 'home') {
                        returnToGalaxy();
                    } else {
                        if (page === 'memorial') {
                            memorialViewMode = 'list';
                        }
                        if (page === 'wish') {
                            wishViewMode = 'main';
                            currentGalaxyName = null;
                        }
                        showPage(page);
                    }
                });
            });

            // 移动端菜单
            const navToggle = document.getElementById('navToggle');
            navToggle.addEventListener('click', () => {
                const menu = document.getElementById('navMenu');
                const isOpen = menu.classList.toggle('open');
                navToggle.setAttribute('aria-expanded', isOpen);
            });

            // 导航品牌键盘支持
            const navBrand = document.querySelector('.nav-brand');
            if (navBrand) {
                navBrand.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        returnToGalaxy();
                    }
                });
            }

            // ESC键关闭弹窗（只关闭最顶层弹窗并阻止冒泡）
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (ModalManager.closeTop()) {
                        e.stopPropagation();
                    }
                }
            });

            // 页面关闭前刷新防抖的保存，防止数据丢失
            window.addEventListener('beforeunload', () => {
                saveMemorialsNow();
            });
        });

        // 按钮径向光效逻辑已合并至 initMouseInteraction