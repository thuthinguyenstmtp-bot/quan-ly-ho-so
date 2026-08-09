;(() => {

    "use strict";


    // =====================================================
    // CẤU HÌNH CHUNG
    // =====================================================

    const DEFAULT_PAGE =
        "dossier";


    const APP_PAGE_NAMES =
        new Set([

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


    const DOSSIER_SIDEBAR_PAGES =
        new Set([

            "dossier",

            "dossier_missing",

            "dossier_delivery",

            "dossier_paid",

            "dossier_archive"

        ]);


    let currentPageRequestId =
        0;


    let currentAppPage =
        null;


    // =====================================================
    // CHUẨN HÓA TÊN TRANG
    // =====================================================

    function normalizeAppPageName(
        page
    ) {

        const normalizedPage =
            String(
                page || ""
            )
                .trim()

                .replace(
                    /^#/,
                    ""
                )

                .replace(
                    /^pages\//,
                    ""
                )

                .replace(
                    /\.html$/i,
                    ""
                );


        return APP_PAGE_NAMES.has(
            normalizedPage
        )

            ? normalizedPage

            : DEFAULT_PAGE;

    }


    // =====================================================
    // CHỐNG CHÈN HTML TRONG THÔNG BÁO
    // =====================================================

    function escapeAppHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    // =====================================================
    // GỌI HÀM CỦA TRANG CON
    // =====================================================

    async function callPageFunction(
        functionName,
        ...args
    ) {

        const pageFunction =
            window[functionName];


        if (
            typeof pageFunction !==
            "function"
        ) {

            const message =
                `Không tìm thấy window.${functionName}().`;


            console.error(
                message
            );


            throw new Error(
                message
            );

        }


        return await pageFunction(
            ...args
        );

    }


    async function callOptionalPageFunction(
        functionName,
        ...args
    ) {

        const pageFunction =
            window[functionName];


        if (
            typeof pageFunction !==
            "function"
        ) {

            console.warn(
                `Bỏ qua ${functionName}() vì hàm chưa tồn tại.`
            );


            return null;

        }


        return await pageFunction(
            ...args
        );

    }


    // =====================================================
    // GHI NHỚ TRANG ĐANG MỞ
    // =====================================================

    function rememberCurrentAppPage(
        page
    ) {

        const normalizedPage =
            normalizeAppPageName(
                page
            );


        const expectedHash =
            `#${normalizedPage}`;


        if (
            window.location.hash ===
            expectedHash
        ) {

            return;

        }


        window.history.replaceState(

            {
                page:
                    normalizedPage
            },

            "",

            `${window.location.pathname}${window.location.search}${expectedHash}`

        );

    }


    // =====================================================
    // MỞ / ĐÓNG NHÓM HỒ SƠ TRÊN SIDEBAR
    // =====================================================

    function setSidebarDossierOpen(
        isOpen
    ) {

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
        Xóa style inline do sidebar cũ để lại.
        */

        submenu.style.removeProperty(
            "display"
        );


        submenu.style.removeProperty(
            "height"
        );


        submenu.style.removeProperty(
            "max-height"
        );


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
            toggle?.querySelector(
                ".arrow"
            )
            ||
            submenu.previousElementSibling
                ?.querySelector(
                    ".arrow"
                );


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

    function syncAppMenuWithPage(
        page
    ) {

        const normalizedPage =
            normalizeAppPageName(
                page
            );


        /*
        Xóa active của menu cũ.
        */

        document
            .querySelectorAll(
                ".menu li"
            )
            .forEach(item => {

                item.classList.remove(
                    "active"
                );

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
                    "is-active"
                );


                item.removeAttribute(
                    "aria-current"
                );

            });


        /*
        Active menu sidebar mới.
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
        Hỗ trợ menu cũ dùng onclick.
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
            .querySelectorAll(
                ".menu li"
            )
            .forEach(item => {

                const onclickContent =
                    item.getAttribute(
                        "onclick"
                    )
                    ||
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

    async function initializePage(
        page
    ) {

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

                /*
                Chỉ gọi đúng một lần.

                Không gọi loadPaidDossier() trong loadPage()
                rồi gọi lại ở đây.
                */

                if (
                    typeof window.loadPaidDossier ===
                    "function"
                ) {

                    await window.loadPaidDossier();

                } else {

                    /*
                    Dự phòng cho dossier.js phiên bản cũ.
                    */

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

        page =
            normalizeAppPageName(
                page
            );


        rememberCurrentAppPage(
            page
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
                    padding:40px;
                    text-align:center;
                    color:#6b7280;
                "
            >
                🌿 Đang tải trang...
            </div>

        `;


        try {

            const response =
                await fetch(

                    `./pages/${page}.html`,

                    {
                        cache:
                            "no-store"
                    }

                );


            if (!response.ok) {

                throw new Error(

                    `Không tìm thấy trang ${page}.html.`

                );

            }


            const html =
                await response.text();


            if (
                requestId !==
                currentPageRequestId
            ) {

                return;

            }


            content.innerHTML =
                html;


            /*
            Không gọi riêng loadPaidDossier() tại đây.

            Mọi trang chỉ được khởi tạo
            thông qua initializePage().
            */

            await initializePage(
                page
            );


            /*
            Người dùng có thể chuyển trang trong lúc
            dữ liệu đang tải.
            */

            if (
                requestId !==
                currentPageRequestId
            ) {

                return;

            }


            currentAppPage =
                page;


            syncAppMenuWithPage(
                page
            );


            console.log(
                `✅ Đã tải trang: ${page}`
            );

        } catch (error) {

            if (
                requestId !==
                currentPageRequestId
            ) {

                return;

            }


            console.error(
                `Không tải được trang ${page}:`,
                error
            );


            content.innerHTML = `

                <div
                    class="app-page-error"
                    style="
                        margin:24px;
                        padding:28px;
                        border:1px solid rgba(190,84,89,.22);
                        border-radius:14px;
                        color:#a83f45;
                        background:#fff7f7;
                    "
                >

                    <h2>
                        Không tải được trang
                    </h2>

                    <p>
                        ${escapeAppHtml(
                            error?.message
                            ||
                            "Đã xảy ra lỗi."
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="
                            window.loadPage(
                                '${escapeAppHtml(page)}'
                            )
                        "
                    >
                        Thử tải lại
                    </button>

                </div>

            `;


            showAppToast(

                error?.message
                ||
                "Không tải được trang.",

                "error"

            );

        }

    }


    // =====================================================
    // MENU HỒ SƠ CŨ
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


        if (
            menuId === "hosoMenu"
        ) {

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

        setSidebarDossierOpen(
            true
        );


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


    // =====================================================
    // MENU ACTIVE CŨ
    // =====================================================

    function selectMenu(
        element
    ) {

        document
            .querySelectorAll(
                ".menu li"
            )
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

            success:
                "✓",

            error:
                "⚠",

            warning:
                "!",

            info:
                "🌿"

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
            String(
                message ?? ""
            );


        toast.append(

            iconElement,

            messageElement

        );


        container.appendChild(
            toast
        );


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

    const APP_THEME_STORAGE_KEY =
        "selectedAppTheme";


    const APP_THEME_CLASSES =
        [

            "theme-ocean",

            "theme-sage",

            "theme-emerald",

            "theme-violet",

            "theme-dark"

        ];


    function changeAppTheme(
        themeName
    ) {

        const validTheme =
            APP_THEME_CLASSES.includes(
                themeName
            )

                ? themeName

                : "theme-sage";


        APP_THEME_CLASSES.forEach(theme => {

            document.body.classList.remove(
                theme
            );

        });


        document.body.classList.add(
            validTheme
        );


        localStorage.setItem(

            APP_THEME_STORAGE_KEY,

            validTheme

        );


        const themeSelect =
            document.getElementById(
                "appThemeSelect"
            )
            ||
            document.querySelector(
                "[data-sidebar-theme]"
            );


        if (themeSelect) {

            themeSelect.value =
                validTheme;

        }

    }


    function loadSavedAppTheme() {

        const savedTheme =
            localStorage.getItem(
                APP_THEME_STORAGE_KEY
            )
            ||
            "theme-sage";


        changeAppTheme(
            savedTheme
        );

    }


    // =====================================================
    // SIDEBAR HIỆN ĐẠI
    // =====================================================

    function getSidebarCurrentPage() {

        return normalizeAppPageName(

            window.location.hash

            ||

            DEFAULT_PAGE

        );

    }


    async function navigateFromModernSidebar(
        page
    ) {

        const normalizedPage =
            normalizeAppPageName(
                page
            );


        syncAppMenuWithPage(
            normalizedPage
        );


        await loadPage(
            normalizedPage
        );

    }


    function handleSidebarThemeChange(
        value
    ) {

        const selectedTheme =
            String(
                value || ""
            ).trim();


        if (!selectedTheme) {

            return;

        }


        /*
        Hàm theme đúng của hệ thống là
        changeAppTheme().
        */

        changeAppTheme(
            selectedTheme
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
                typeof Parse !==
                "undefined"

                &&

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
                logoutButton

                &&

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
            !usernameElement

            ||

            typeof Parse ===
            "undefined"
        ) {

            return;

        }


        const currentUser =
            Parse.User.current();


        if (!currentUser) {

            return;

        }


        const username =
            currentUser.getUsername?.()

            ||

            currentUser.get?.(
                "username"
            )

            ||

            currentUser.get?.(
                "name"
            )

            ||

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

            return;

        }


        if (
            sidebar.dataset.modernSidebarReady ===
            "true"
        ) {

            syncAppMenuWithPage(
                getSidebarCurrentPage()
            );


            updateModernSidebarUsername();


            return;

        }


        sidebar.dataset.modernSidebarReady =
            "true";


        /*
        Điều hướng trang.
        */

        sidebar.addEventListener(

            "click",

            function(event) {

                const pageButton =
                    event.target.closest(
                        "[data-page]"
                    );


                if (
                    !pageButton

                    ||

                    !sidebar.contains(
                        pageButton
                    )
                ) {

                    return;

                }


                event.preventDefault();


                navigateFromModernSidebar(
                    pageButton.dataset.page
                );

            }

        );


        /*
        Mở / đóng nhóm Hồ sơ.
        */

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


                    const isOpen =
                        group

                            ? group.classList.contains(
                                "is-open"
                            )

                            : document
                                .getElementById(
                                    "hosoMenu"
                                )
                                ?.classList.contains(
                                    "is-open"
                                );


                    setSidebarDossierOpen(
                        !isOpen
                    );

                }

            );

        }

/* =====================================================
   QUẢN LÝ CHỦ ĐỀ GIAO DIỆN
   ===================================================== */

function applySystemTheme(themeName) {
    const supportedThemes = [
        "royal",
        "sage",
        "ocean"
    ];

    const selectedTheme = supportedThemes.includes(themeName)
        ? themeName
        : "royal";

    document.body.classList.remove(
        "theme-royal",
        "theme-sage",
        "theme-ocean"
    );

    document.body.classList.add(
        `theme-${selectedTheme}`
    );

    localStorage.setItem(
        "systemTheme",
        selectedTheme
    );

    const selector = document.querySelector(
        "[data-sidebar-theme]"
    );

    if (selector) {
        selector.value = selectedTheme;
    }
}


function initializeSystemTheme() {
    const selector = document.querySelector(
        "[data-sidebar-theme]"
    );

    const savedTheme =
        localStorage.getItem("systemTheme") ||
        "royal";

    applySystemTheme(savedTheme);

    if (!selector) {
        return;
    }

    selector.addEventListener(
        "change",
        function () {
            applySystemTheme(this.value);
        }
    );
}


        /*
        Đăng xuất.
        */

        const logoutButton =
            document.getElementById(
                "sidebarLogoutButton"
            );


        logoutButton?.addEventListener(

            "click",

            handleModernSidebarLogout

        );


        updateModernSidebarUsername();


        syncAppMenuWithPage(
            getSidebarCurrentPage()
        );

    }


    // =====================================================
    // KHỞI ĐỘNG HỆ THỐNG
    // =====================================================

    async function initializeApplication() {

        loadSavedAppTheme();


        initializeModernSidebar();


        /*
        auth.js sẽ chuyển sang login.html
        khi người dùng chưa đăng nhập.
        */

        if (
            typeof Parse !==
            "undefined"

            &&

            !Parse.User.current()
        ) {

            return;

        }


        const pageFromUrl =
            normalizeAppPageName(

                window.location.hash

                ||

                DEFAULT_PAGE

            );


        rememberCurrentAppPage(
            pageFromUrl
        );


        await loadPage(
            pageFromUrl
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeSystemTheme();

        // Các hàm khởi tạo khác của ứng dụng
    }
);

    } else {

        initializeApplication();

    }


    // =====================================================
    // XỬ LÝ NÚT BACK / FORWARD
    // =====================================================

    window.addEventListener(

        "popstate",

        async function() {

            const pageFromUrl =
                normalizeAppPageName(

                    window.location.hash

                    ||

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


    window.addEventListener(

        "hashchange",

        function() {

            syncAppMenuWithPage(
                getSidebarCurrentPage()
            );

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


    window.showAppToast =
        showAppToast;

})();
