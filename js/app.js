;(() => {
    "use strict";

    // =====================================================
    // CẤU HÌNH CHUNG
    // =====================================================

    const DEFAULT_PAGE = "dossier";

    const APP_PAGE_NAMES = new Set([
        "project",
        "supplier",
        "letter",
        "dossier",
        "dossier_missing",
        "dossier_delivery",
        "dossier_paid",
        "dossier_archive",
        "backup"
    ]);

    const DOSSIER_SIDEBAR_PAGES = new Set([
        "dossier",
        "dossier_missing",
        "dossier_delivery",
        "dossier_paid",
        "dossier_archive"
    ]);

    const APP_THEME_STORAGE_KEY = "selectedAppTheme";
    const LEGACY_THEME_STORAGE_KEY = "systemTheme";

    const APP_THEME_NAMES = new Set([
        "royal",
        "sage",
        "ocean",
        "emerald",
        "violet",
        "dark"
    ]);

    const APP_THEME_CLASSES = Array.from(
        APP_THEME_NAMES,
        theme => `theme-${theme}`
    );

    let currentPageRequestId = 0;
    let currentAppPage = null;
    let applicationInitialized = false;


    // =====================================================
    // CHUẨN HÓA TÊN TRANG
    // =====================================================

    function normalizeAppPageName(page) {
        const normalizedPage = String(page || "")
            .trim()
            .replace(/^#/, "")
            .replace(/^pages\//, "")
            .replace(/\.html$/i, "");

        return APP_PAGE_NAMES.has(normalizedPage)
            ? normalizedPage
            : DEFAULT_PAGE;
    }


    // =====================================================
    // CHUẨN HÓA TÊN THEME
    // =====================================================

    function normalizeThemeName(themeName) {
        const normalizedTheme = String(themeName || "")
            .trim()
            .replace(/^theme-/, "");

        return APP_THEME_NAMES.has(normalizedTheme)
            ? normalizedTheme
            : "royal";
    }


    // =====================================================
    // CHỐNG CHÈN HTML TRONG THÔNG BÁO
    // =====================================================

    function escapeAppHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    // =====================================================
    // GỌI HÀM CỦA TRANG CON
    // =====================================================

    async function callPageFunction(
        functionName,
        ...args
    ) {
        const pageFunction = window[functionName];

        if (typeof pageFunction !== "function") {
            const message =
                `Không tìm thấy window.${functionName}().`;

            console.error(message);

            throw new Error(message);
        }

        return await pageFunction(...args);
    }


    async function callOptionalPageFunction(
        functionName,
        ...args
    ) {
        const pageFunction = window[functionName];

        if (typeof pageFunction !== "function") {
            console.warn(
                `Bỏ qua ${functionName}() vì hàm chưa tồn tại.`
            );

            return null;
        }

        return await pageFunction(...args);
    }


    // =====================================================
    // GHI NHỚ TRANG ĐANG MỞ
    // =====================================================

    function rememberCurrentAppPage(page) {
        const normalizedPage =
            normalizeAppPageName(page);

        const expectedHash =
            `#${normalizedPage}`;

        if (window.location.hash === expectedHash) {
            return;
        }

        window.history.replaceState(
            {
                page: normalizedPage
            },
            "",
            `${window.location.pathname}${window.location.search}${expectedHash}`
        );
    }


    function getSidebarCurrentPage() {
        return normalizeAppPageName(
            window.location.hash ||
            DEFAULT_PAGE
        );
    }


    // =====================================================
    // MỞ / ĐÓNG NHÓM HỒ SƠ TRÊN SIDEBAR
    // =====================================================

    function setSidebarDossierOpen(isOpen) {
        const group =
            document.getElementById(
                "dossierSidebarGroup"
            );

        const toggle =
            document.getElementById(
                "dossierSidebarToggle"
            );

        const submenu =
            document.getElementById(
                "hosoMenu"
            );

        if (!submenu) {
            return;
        }

        const openState =
            Boolean(isOpen);

        /*
        Xóa style inline có thể còn lại
        từ phiên bản sidebar cũ.
        */

        submenu.style.removeProperty("display");
        submenu.style.removeProperty("height");
        submenu.style.removeProperty("max-height");

        if (group) {
            group.classList.toggle(
                "is-open",
                openState
            );
        }

        submenu.classList.toggle(
            "is-open",
            openState
        );

        submenu.setAttribute(
            "aria-hidden",
            openState
                ? "false"
                : "true"
        );

        if (toggle) {
            toggle.setAttribute(
                "aria-expanded",
                openState
                    ? "true"
                    : "false"
            );
        }

        const arrow =
            toggle?.querySelector(".arrow") ||
            submenu.previousElementSibling
                ?.querySelector(".arrow");

        if (arrow) {
            arrow.textContent =
                openState
                    ? "⌄"
                    : "›";
        }
    }


    // =====================================================
    // ĐỒNG BỘ MENU ACTIVE
    // =====================================================

    function syncAppMenuWithPage(page) {
        const normalizedPage =
            normalizeAppPageName(page);

        /*
        Xóa active của menu cũ.
        */

        document
            .querySelectorAll(".menu li")
            .forEach(item => {
                item.classList.remove("active");
            });

        /*
        Xóa active của sidebar mới.
        */

        document
            .querySelectorAll(
                "#appSidebar [data-page]"
            )
            .forEach(item => {
                item.classList.remove(
                    "active",
                    "is-active"
                );

                item.removeAttribute(
                    "aria-current"
                );
            });

        /*
        Active mục đang mở.
        */

        const modernActiveItem =
            document.querySelector(
                `#appSidebar [data-page="${normalizedPage}"]`
            );

        if (modernActiveItem) {
            modernActiveItem.classList.add(
                "is-active"
            );

            modernActiveItem.setAttribute(
                "aria-current",
                "page"
            );
        }

        /*
        Hỗ trợ menu cũ dùng:
        onclick="loadPage('project')"
        */

        const escapedPage =
            normalizedPage.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        const pagePattern =
            new RegExp(
                `loadPage\\s*\\(\\s*['"]${escapedPage}['"]\\s*\\)`
            );

        document
            .querySelectorAll(".menu li")
            .forEach(item => {
                const onclickContent =
                    item.getAttribute("onclick") ||
                    "";

                if (
                    pagePattern.test(
                        onclickContent
                    )
                ) {
                    item.classList.add(
                        "active"
                    );
                }
            });

        setSidebarDossierOpen(
            DOSSIER_SIDEBAR_PAGES.has(
                normalizedPage
            )
        );
    }


    // =====================================================
    // KHỞI TẠO DỮ LIỆU TỪNG TRANG
    // =====================================================

    async function initializePage(page) {
        switch (page) {
            // ---------------------------------------------
            // DỰ ÁN
            // ---------------------------------------------

            case "project":
                await callPageFunction(
                    "loadProject"
                );

                await callOptionalPageFunction(
                    "renderProject"
                );

                break;


            // ---------------------------------------------
            // NHÀ CUNG CẤP
            // ---------------------------------------------

            case "supplier":
                await callPageFunction(
                    "loadSupplier"
                );

                await callOptionalPageFunction(
                    "renderSupplier"
                );

                break;


            // ---------------------------------------------
            // QUẢN LÝ THƯ
            // ---------------------------------------------

            case "letter":
                await callPageFunction(
                    "initializeLetterPage"
                );

                break;


            // ---------------------------------------------
            // DANH SÁCH HỒ SƠ
            // ---------------------------------------------

            case "dossier":
                await callPageFunction(
                    "loadDossier"
                );

                await callOptionalPageFunction(
                    "filterDossier"
                );

                break;


            // ---------------------------------------------
            // HỒ SƠ CẦN BỔ SUNG
            // ---------------------------------------------

            case "dossier_missing":
                await callPageFunction(
                    "loadDossier"
                );

                await callOptionalPageFunction(
                    "loadMissingDossierFilters"
                );

                await callOptionalPageFunction(
                    "filterMissingDossier"
                );

                break;


            // ---------------------------------------------
            // HỒ SƠ ĐÃ BÀN GIAO
            // ---------------------------------------------

            case "dossier_delivery":
                await callPageFunction(
                    "loadDossier"
                );

                await callOptionalPageFunction(
                    "loadDeliveryDossierFilters"
                );

                await callOptionalPageFunction(
                    "filterDeliveryDossier"
                );

                break;


            // ---------------------------------------------
            // HỒ SƠ ĐÃ THANH TOÁN
            // ---------------------------------------------

            case "dossier_paid":
                if (
                    typeof window.loadPaidDossier ===
                    "function"
                ) {
                    await window.loadPaidDossier();
                } else {
                    await callPageFunction(
                        "loadDossier"
                    );

                    await callOptionalPageFunction(
                        "loadPaidDossierFilters"
                    );

                    await callOptionalPageFunction(
                        "filterPaidDossier"
                    );
                }

                break;


            // ---------------------------------------------
            // LƯU HỒ SƠ
            // ---------------------------------------------

            case "dossier_archive":
                await callPageFunction(
                    "initializeArchivePage"
                );

                break;


            // ---------------------------------------------
            // SAO LƯU
            // ---------------------------------------------

            case "backup":
                await callPageFunction(
                    "initializeBackupPage"
                );

                break;


            default:
                console.warn(
                    `Trang "${page}" chưa có hàm khởi tạo riêng.`
                );

                break;
        }
    }


    // =====================================================
    // LOAD TRANG SPA
    // =====================================================

    async function loadPage(
        page = DEFAULT_PAGE
    ) {
        const normalizedPage =
            normalizeAppPageName(page);

        rememberCurrentAppPage(
            normalizedPage
        );

        const content =
            document.getElementById(
                "content"
            );

        if (!content) {
            console.error(
                "Không tìm thấy #content."
            );

            return;
        }

        const requestId =
            ++currentPageRequestId;

        content.innerHTML = `
            <div
                class="app-page-loading"
                style="
                    padding: 40px;
                    text-align: center;
                    color: #6b7280;
                "
            >
                🌿 Đang tải trang...
            </div>
        `;

        try {
            const response =
                await fetch(
                    `./pages/${normalizedPage}.html`,
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    `Không tìm thấy trang ${normalizedPage}.html (HTTP ${response.status}).`
                );
            }

            const html =
                await response.text();

            /*
            Nếu người dùng đã chuyển sang trang khác
            trong lúc fetch đang chạy thì bỏ kết quả cũ.
            */

            if (
                requestId !==
                currentPageRequestId
            ) {
                return;
            }

            content.innerHTML =
                html;

            /*
            Khởi tạo dữ liệu của trang vừa tải.
            */

            await initializePage(
                normalizedPage
            );

            /*
            Kiểm tra lại vì quá trình tải dữ liệu
            có thể mất thời gian.
            */

            if (
                requestId !==
                currentPageRequestId
            ) {
                return;
            }

            currentAppPage =
                normalizedPage;

            syncAppMenuWithPage(
                normalizedPage
            );

            console.log(
                `✅ Đã tải trang: ${normalizedPage}`
            );
        } catch (error) {
            if (
                requestId !==
                currentPageRequestId
            ) {
                return;
            }

            console.error(
                `Không tải được trang ${normalizedPage}:`,
                error
            );

            content.innerHTML = `
                <div
                    class="app-page-error"
                    style="
                        margin: 24px;
                        padding: 28px;
                        border: 1px solid rgba(190, 84, 89, 0.22);
                        border-radius: 14px;
                        color: #a83f45;
                        background: #fff7f7;
                    "
                >
                    <h2>
                        Không tải được trang
                    </h2>

                    <p>
                        ${escapeAppHtml(
                            error?.message ||
                            "Đã xảy ra lỗi."
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="
                            window.loadPage(
                                '${escapeAppHtml(normalizedPage)}'
                            )
                        "
                    >
                        Thử tải lại
                    </button>
                </div>
            `;

            showAppToast(
                error?.message ||
                "Không tải được trang.",
                "error"
            );
        }
    }


    // =====================================================
    // MENU CŨ
    // =====================================================

    function toggleMenu(
        menuId,
        element
    ) {
        const menu =
            document.getElementById(
                menuId
            );

        if (!menu) {
            return;
        }

        if (menuId === "hosoMenu") {
            const group =
                document.getElementById(
                    "dossierSidebarGroup"
                );

            const isOpen =
                group
                    ? group.classList.contains(
                        "is-open"
                    )
                    : menu.classList.contains(
                        "is-open"
                    );

            setSidebarDossierOpen(
                !isOpen
            );

            return;
        }

        const arrow =
            element?.querySelector(
                ".arrow"
            );

        const isOpen =
            window
                .getComputedStyle(menu)
                .display !==
            "none";

        menu.style.display =
            isOpen
                ? "none"
                : "block";

        if (arrow) {
            arrow.textContent =
                isOpen
                    ? "›"
                    : "⌄";
        }
    }


    function openDefaultDossierMenu() {
        setSidebarDossierOpen(true);

        const firstDossierMenuItem =
            document.querySelector(
                "#hosoMenu [data-page], #hosoMenu li"
            );

        if (firstDossierMenuItem) {
            firstDossierMenuItem.classList.add(
                "active"
            );
        }
    }


    function selectMenu(element) {
        document
            .querySelectorAll(".menu li")
            .forEach(item => {
                item.classList.remove(
                    "active"
                );
            });

        if (element) {
            element.classList.add(
                "active"
            );
        }
    }


    // =====================================================
    // TOAST THÔNG BÁO
    // =====================================================

    function showAppToast(
        message,
        type = "success"
    ) {
        let container =
            document.querySelector(
                ".app-toast-container"
            );

        if (!container) {
            container =
                document.createElement(
                    "div"
                );

            container.className =
                "app-toast-container";

            document.body.appendChild(
                container
            );
        }

        const allowedTypes =
            new Set([
                "success",
                "error",
                "info",
                "warning"
            ]);

        const safeType =
            allowedTypes.has(type)
                ? type
                : "info";

        const iconMap = {
            success: "✓",
            error: "⚠",
            warning: "!",
            info: "🌿"
        };

        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            `app-toast app-toast-${safeType}`;

        const iconElement =
            document.createElement(
                "span"
            );

        iconElement.className =
            "app-toast-icon";

        iconElement.textContent =
            iconMap[safeType];

        const messageElement =
            document.createElement(
                "span"
            );

        messageElement.className =
            "app-toast-message";

        messageElement.textContent =
            String(message ?? "");

        toast.append(
            iconElement,
            messageElement
        );

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add(
                "is-leaving"
            );

            window.setTimeout(() => {
                toast.remove();

                if (
                    container.childElementCount ===
                    0
                ) {
                    container.remove();
                }
            }, 230);
        }, 2800);
    }


    // =====================================================
    // CHỦ ĐỀ GIAO DIỆN
    // =====================================================

    function getThemeSelector() {
        return (
            document.getElementById(
                "appThemeSelect"
            ) ||
            document.getElementById(
                "themeSelector"
            ) ||
            document.querySelector(
                "[data-sidebar-theme]"
            )
        );
    }


    function syncThemeSelector(themeName) {
        const selector =
            getThemeSelector();

        if (!selector) {
            return;
        }

        const bareTheme =
            normalizeThemeName(
                themeName
            );

        const fullTheme =
            `theme-${bareTheme}`;

        const optionValues =
            Array.from(
                selector.options || []
            ).map(option => option.value);

        /*
        Hỗ trợ cả hai dạng option:

        value="royal"
        value="theme-royal"
        */

        if (
            optionValues.includes(
                bareTheme
            )
        ) {
            selector.value =
                bareTheme;
        } else if (
            optionValues.includes(
                fullTheme
            )
        ) {
            selector.value =
                fullTheme;
        }
    }


    function changeAppTheme(themeName) {
        const selectedTheme =
            normalizeThemeName(
                themeName
            );

        const selectedThemeClass =
            `theme-${selectedTheme}`;

        document.body.classList.remove(
            ...APP_THEME_CLASSES
        );

        document.body.classList.add(
            selectedThemeClass
        );

        /*
        Lưu cả key mới và key cũ để tương thích
        với code theme trước đây.
        */

        localStorage.setItem(
            APP_THEME_STORAGE_KEY,
            selectedThemeClass
        );

        localStorage.setItem(
            LEGACY_THEME_STORAGE_KEY,
            selectedTheme
        );

        syncThemeSelector(
            selectedTheme
        );
    }


    function loadSavedAppTheme() {
        const savedTheme =
            localStorage.getItem(
                APP_THEME_STORAGE_KEY
            ) ||
            localStorage.getItem(
                LEGACY_THEME_STORAGE_KEY
            ) ||
            "royal";

        changeAppTheme(
            savedTheme
        );
    }


    function getThemeFromBody() {
        for (
            const themeClass
            of APP_THEME_CLASSES
        ) {
            if (
                document.body.classList.contains(
                    themeClass
                )
            ) {
                return themeClass;
            }
        }

        return "theme-royal";
    }


    function initializeAppThemeSelector() {
        const selector =
            getThemeSelector();

        if (!selector) {
            return;
        }

        /*
        Không gắn nhiều listener nếu hàm
        được gọi lại.
        */

        if (
            selector.dataset.themeListenerReady ===
            "true"
        ) {
            syncThemeSelector(
                getThemeFromBody()
            );

            return;
        }

        selector.dataset.themeListenerReady =
            "true";

        selector.addEventListener(
            "change",
            function(event) {
                changeAppTheme(
                    event.target.value
                );
            }
        );

        syncThemeSelector(
            getThemeFromBody()
        );
    }


    // =====================================================
    // SIDEBAR HIỆN ĐẠI
    // =====================================================

    async function navigateFromModernSidebar(page) {
        const normalizedPage =
            normalizeAppPageName(page);

        syncAppMenuWithPage(
            normalizedPage
        );

        await loadPage(
            normalizedPage
        );
    }


    async function handleModernSidebarLogout() {
        const logoutButton =
            document.getElementById(
                "sidebarLogoutButton"
            );

        if (logoutButton) {
            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Đang đăng xuất...";
        }

        try {
            if (
                typeof window.logoutSystem ===
                "function"
            ) {
                await window.logoutSystem();

                return;
            }

            if (
                typeof window.logout ===
                "function"
            ) {
                await window.logout();

                return;
            }

            if (
                typeof Parse !== "undefined" &&
                Parse.User.current()
            ) {
                await Parse.User.logOut();
            }

            window.location.href =
                "./login.html";
        } catch (error) {
            console.error(
                "Không thể đăng xuất:",
                error
            );

            showAppToast(
                "Không thể đăng xuất. Vui lòng thử lại.",
                "error"
            );
        } finally {
            if (
                logoutButton &&
                document.body.contains(
                    logoutButton
                )
            ) {
                logoutButton.disabled =
                    false;

                logoutButton.textContent =
                    "Đăng xuất";
            }
        }
    }


    function updateModernSidebarUsername() {
        const usernameElement =
            document.getElementById(
                "currentSystemUsername"
            );

        if (
            !usernameElement ||
            typeof Parse === "undefined"
        ) {
            return;
        }

        const currentUser =
            Parse.User.current();

        if (!currentUser) {
            return;
        }

        const username =
            currentUser.getUsername?.() ||
            currentUser.get?.(
                "username"
            ) ||
            currentUser.get?.(
                "name"
            ) ||
            "Người dùng";

        usernameElement.textContent =
            String(username);
    }


    function initializeModernSidebar() {
        const sidebar =
            document.getElementById(
                "appSidebar"
            );

        if (!sidebar) {
            initializeAppThemeSelector();

            return;
        }

        /*
        Nếu sidebar đã được khởi tạo thì
        chỉ đồng bộ lại trạng thái.
        */

        if (
            sidebar.dataset.modernSidebarReady ===
            "true"
        ) {
            syncAppMenuWithPage(
                getSidebarCurrentPage()
            );

            updateModernSidebarUsername();

            initializeAppThemeSelector();

            return;
        }

        sidebar.dataset.modernSidebarReady =
            "true";


        // ---------------------------------------------
        // ĐIỀU HƯỚNG TRANG
        // ---------------------------------------------

        sidebar.addEventListener(
            "click",
            function(event) {
                const pageButton =
                    event.target.closest(
                        "[data-page]"
                    );

                if (
                    !pageButton ||
                    !sidebar.contains(
                        pageButton
                    )
                ) {
                    return;
                }

                event.preventDefault();

                navigateFromModernSidebar(
                    pageButton.dataset.page
                ).catch(error => {
                    console.error(
                        "Lỗi điều hướng sidebar:",
                        error
                    );

                    showAppToast(
                        error?.message ||
                        "Không thể chuyển trang.",
                        "error"
                    );
                });
            }
        );


        // ---------------------------------------------
        // MỞ / ĐÓNG NHÓM HỒ SƠ
        // ---------------------------------------------

        const dossierToggle =
            document.getElementById(
                "dossierSidebarToggle"
            );

        if (dossierToggle) {
            dossierToggle.addEventListener(
                "click",
                function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    const group =
                        document.getElementById(
                            "dossierSidebarGroup"
                        );

                    const submenu =
                        document.getElementById(
                            "hosoMenu"
                        );

                    const isOpen =
                        group
                            ? group.classList.contains(
                                "is-open"
                            )
                            : submenu
                                ?.classList.contains(
                                    "is-open"
                                );

                    setSidebarDossierOpen(
                        !isOpen
                    );
                }
            );
        }


        // ---------------------------------------------
        // ĐỔI THEME
        // ---------------------------------------------

        initializeAppThemeSelector();


        // ---------------------------------------------
        // ĐĂNG XUẤT
        // ---------------------------------------------

        const logoutButton =
            document.getElementById(
                "sidebarLogoutButton"
            );

        if (logoutButton) {
            logoutButton.addEventListener(
                "click",
                handleModernSidebarLogout
            );
        }


        updateModernSidebarUsername();

        syncAppMenuWithPage(
            getSidebarCurrentPage()
        );
    }


    // =====================================================
    // KHỞI ĐỘNG HỆ THỐNG
    // =====================================================

    async function initializeApplication() {
        if (applicationInitialized) {
            return;
        }

        applicationInitialized =
            true;

        /*
        Theme phải được tải trước để tránh
        giao diện nháy sang theme cũ.
        */

        loadSavedAppTheme();

        /*
        Khởi tạo sự kiện sidebar, menu,
        theme và đăng xuất.
        */

        initializeModernSidebar();

        /*
        auth.js sẽ chuyển sang login.html
        nếu người dùng chưa đăng nhập.
        */

        if (
            typeof Parse !== "undefined" &&
            !Parse.User.current()
        ) {
            return;
        }

        const pageFromUrl =
            normalizeAppPageName(
                window.location.hash ||
                DEFAULT_PAGE
            );

        rememberCurrentAppPage(
            pageFromUrl
        );

        await loadPage(
            pageFromUrl
        );
    }


    function startApplication() {
        initializeApplication()
            .catch(error => {
                applicationInitialized =
                    false;

                console.error(
                    "Không thể khởi động ứng dụng:",
                    error
                );

                showAppToast(
                    error?.message ||
                    "Không thể khởi động ứng dụng.",
                    "error"
                );
            });
    }


    /*
    LỖI CŨ NẰM Ở ĐÂY:

    Trước đó DOMContentLoaded chỉ gọi
    initializeSystemTheme() mà không gọi
    initializeApplication().

    Bản này gọi startApplication(), vì vậy
    sidebar và các trang sẽ hoạt động lại.
    */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            startApplication,
            {
                once: true
            }
        );
    } else {
        startApplication();
    }


    // =====================================================
    // XỬ LÝ NÚT BACK / FORWARD
    // =====================================================

    window.addEventListener(
        "popstate",
        async function() {
            const pageFromUrl =
                normalizeAppPageName(
                    window.location.hash ||
                    DEFAULT_PAGE
                );

            if (
                pageFromUrl ===
                currentAppPage
            ) {
                syncAppMenuWithPage(
                    pageFromUrl
                );

                return;
            }

            await loadPage(
                pageFromUrl
            );
        }
    );


    // =====================================================
    // XỬ LÝ KHI HASH URL THAY ĐỔI
    // =====================================================

    window.addEventListener(
        "hashchange",
        function() {
            const pageFromUrl =
                getSidebarCurrentPage();

            syncAppMenuWithPage(
                pageFromUrl
            );

            if (
                applicationInitialized &&
                pageFromUrl !==
                currentAppPage
            ) {
                loadPage(
                    pageFromUrl
                ).catch(error => {
                    console.error(
                        "Không thể tải trang từ URL hash:",
                        error
                    );
                });
            }
        }
    );


    // =====================================================
    // ĐƯA HÀM RA WINDOW
    // =====================================================

    window.loadPage =
        loadPage;

    window.initializePage =
        initializePage;

    window.toggleMenu =
        toggleMenu;

    window.selectMenu =
        selectMenu;

    window.openDefaultDossierMenu =
        openDefaultDossierMenu;

    window.syncAppMenuWithPage =
        syncAppMenuWithPage;

    window.syncModernSidebar =
        syncAppMenuWithPage;

    window.initializeModernSidebar =
        initializeModernSidebar;

    window.setSidebarDossierOpen =
        setSidebarDossierOpen;

    window.changeAppTheme =
        changeAppTheme;

    window.loadSavedAppTheme =
        loadSavedAppTheme;

    window.initializeAppThemeSelector =
        initializeAppThemeSelector;

    window.showAppToast =
        showAppToast;
})();
