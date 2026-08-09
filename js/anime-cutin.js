;(() => {

    "use strict";


    // =====================================================
    // ANIME REACTION SYSTEM V2
    // Anime Cut-in + nhiều biểu cảm
    // Visual only
    // Không can thiệp Back4App / dữ liệu
    // =====================================================


    const CONFIG = {

        enabled: true,


        // =================================================
        // DANH SÁCH ẢNH
        // =================================================

        images: {

            default:
                "./assets/characters/anime-happy.png",

            success:
                "./assets/characters/anime-happy.png",

            error:
                "./assets/characters/anime-worried.png",

            import:
                "./assets/characters/anime-import.png",

            export:
                "./assets/characters/anime-export.png",

            backup:
                "./assets/characters/anime-backup.png",

            special:
                "./assets/characters/anime-special.png"

        },


        // Thời gian cut-in xuất hiện

        showDuration:
            3200,


        // Không cho spam cut-in liên tục

        cooldown:
            5200,


        // Nhớ action gần nhất bao lâu

        actionMemory:
            20000

    };


    // =====================================================
    // VARIABLES
    // =====================================================

    let root = null;

    let image = null;

    let title = null;

    let message = null;


    let hideTimer = null;

    let cooldownUntil = 0;


    let lastAction = null;

    let lastActionTime = 0;


    // =====================================================
    // PRELOAD IMAGES
    // Giúp chuyển biểu cảm không bị nháy
    // =====================================================

    function preloadImages() {

        Object
            .values(
                CONFIG.images
            )
            .forEach(
                path => {

                    const preload =
                        new Image();


                    preload.src =
                        path;

                }
            );

    }


    // =====================================================
    // CREATE CUT-IN DOM
    // =====================================================

    function createCutin() {

        if (root) {

            return;

        }


        root =
            document.createElement(
                "div"
            );


        root.id =
            "animeCutin";


        root.className =
            "anime-cutin";


        root.setAttribute(
            "aria-hidden",
            "true"
        );


        root.innerHTML = `

            <div
                class="anime-cutin-backdrop"
                aria-hidden="true"
            ></div>


            <div
                class="anime-cutin-streaks"
                aria-hidden="true"
            ></div>


            <div
                class="anime-cutin-content"
            >

                <div
                    class="anime-cutin-text"
                >

                    <div
                        class="anime-cutin-title"
                        id="animeCutinTitle"
                    ></div>


                    <div
                        class="anime-cutin-message"
                        id="animeCutinMessage"
                    ></div>

                </div>


                <div
                    class="anime-cutin-character-wrap"
                >

                    <div
                        class="anime-cutin-glow"
                        aria-hidden="true"
                    ></div>


                    <img
                        id="animeCutinImage"
                        class="anime-cutin-character"
                        alt=""
                        draggable="false"
                    >

                </div>

            </div>

        `;


        document.body.appendChild(
            root
        );


        image =
            document.getElementById(
                "animeCutinImage"
            );


        title =
            document.getElementById(
                "animeCutinTitle"
            );


        message =
            document.getElementById(
                "animeCutinMessage"
            );


        setReactionImage(
            "default"
        );

    }


    // =====================================================
    // IMAGE HANDLER
    // =====================================================

    function getImagePath(
        reaction
    ) {

        return (
            CONFIG.images[
                reaction
            ]
            ||
            CONFIG.images.default
        );

    }


    function setReactionImage(
        reaction
    ) {

        if (!image) {

            return;

        }


        const requestedPath =
            getImagePath(
                reaction
            );


        image.style.display =
            "";


        image.src =
            requestedPath;


        // =============================================
        // Nếu ảnh reaction bị lỗi
        // → tự quay về ảnh default
        // =============================================

        image.onerror =
            () => {

                console.warn(
                    `⚠ Không tải được ảnh reaction "${reaction}":`,
                    requestedPath
                );


                if (
                    image.src.endsWith(
                        CONFIG.images.default
                            .replace(
                                "./",
                                ""
                            )
                    )
                ) {

                    image.style.display =
                        "none";


                    return;

                }


                image.onerror =
                    null;


                image.src =
                    CONFIG.images.default;

            };

    }


    // =====================================================
    // TYPE CLASS
    // =====================================================

    function resetTypeClasses() {

        if (!root) {

            return;

        }


        root.classList.remove(

            "anime-cutin-success",

            "anime-cutin-error",

            "anime-cutin-info",

            "anime-cutin-special",

            "anime-cutin-import",

            "anime-cutin-export",

            "anime-cutin-backup"

        );

    }


    // =====================================================
    // MAIN SHOW FUNCTION
    // =====================================================

    function show({

        type = "success",

        reaction = "success",

        heading = "HOÀN TẤT!",

        text = "Xử lý xong rồi.",

        force = false

    } = {}) {


        if (
            !CONFIG.enabled
        ) {

            return;

        }


        createCutin();


        const now =
            Date.now();


        // =============================================
        // COOLDOWN
        // =============================================

        if (
            !force
            &&
            now <
            cooldownUntil
        ) {

            return;

        }


        cooldownUntil =
            now
            +
            CONFIG.cooldown;


        window.clearTimeout(
            hideTimer
        );


        resetTypeClasses();


        root.classList.add(
            `anime-cutin-${type}`
        );


        // =============================================
        // ĐỔI ẢNH THEO REACTION
        // =============================================

        setReactionImage(
            reaction
        );


        // =============================================
        // TEXT
        // =============================================

        title.textContent =
            heading;


        message.textContent =
            text;


        // =============================================
        // RESTART ANIMATION
        // =============================================

        root.classList.remove(
            "is-active"
        );


        void root.offsetWidth;


        root.classList.add(
            "is-active"
        );


        hideTimer =
            window.setTimeout(
                hide,
                CONFIG.showDuration
            );

    }


    // =====================================================
    // HIDE
    // =====================================================

    function hide() {

        if (!root) {

            return;

        }


        root.classList.remove(
            "is-active"
        );

    }


    // =====================================================
    // ACTION MEMORY
    // =====================================================

    function rememberAction(
        action
    ) {

        lastAction =
            action;


        lastActionTime =
            Date.now();

    }


    function getRecentAction() {

        if (!lastAction) {

            return null;

        }


        if (
            Date.now()
            -
            lastActionTime
            >
            CONFIG.actionMemory
        ) {

            lastAction =
                null;


            return null;

        }


        return lastAction;

    }


    function clearAction() {

        lastAction =
            null;


        lastActionTime =
            0;

    }


    // =====================================================
    // SUCCESS
    // =====================================================

    function success(
        text = "Xử lý thành công!",
        reaction = "success"
    ) {

        show({

            type:
                "success",

            reaction,

            heading:
                "HOÀN TẤT!",

            text

        });

    }


    // =====================================================
    // ERROR
    // =====================================================

    function error(
        text = "Có lỗi xảy ra."
    ) {

        show({

            type:
                "error",

            reaction:
                "error",

            heading:
                "ỐI!",

            text,

            force:
                true

        });

    }


    // =====================================================
    // IMPORT
    // =====================================================

    function importReaction(
        text =
            "Đang chuẩn bị nhập dữ liệu..."
    ) {

        show({

            type:
                "import",

            reaction:
                "import",

            heading:
                "NHẬP DỮ LIỆU",

            text

        });

    }


    // =====================================================
    // EXPORT
    // =====================================================

    function exportReaction(
        text =
            "Đang chuẩn bị file..."
    ) {

        show({

            type:
                "export",

            reaction:
                "export",

            heading:
                "XUẤT DỮ LIỆU",

            text

        });

    }


    // =====================================================
    // BACKUP
    // =====================================================

    function backupReaction(
        text =
            "Đang chuẩn bị sao lưu..."
    ) {

        show({

            type:
                "backup",

            reaction:
                "backup",

            heading:
                "SAO LƯU",

            text

        });

    }


    // =====================================================
    // SPECIAL
    // =====================================================
function special(
    text = "Nice!"
) {

    show({

        type:
            "special",

        reaction:
            "special",

        heading:
            "NICE!",

        text,

        force:
            true

    });

}


    // =====================================================
    // INFO
    // =====================================================

    function info(
        text =
            "Đang xử lý..."
    ) {

        show({

            type:
                "info",

            reaction:
                "default",

            heading:
                "CHỜ MỘT CHÚT!",

            text

        });

    }


    // =====================================================
    // TOAST SELECTOR
    // =====================================================

    const TOAST_SELECTOR = `

        .toast,
        .notification,
        .notice,
        .archive-toast,
        .archive-notice,
        .alert-toast,
        [role="alert"]

    `;


    // =====================================================
    // ANALYZE TOAST
    // =====================================================

    function analyzeToast(
        element
    ) {

        if (
            !(element instanceof Element)
        ) {

            return;

        }


        if (
            element.dataset
                .animeReactionChecked ===
            "true"
        ) {

            return;

        }


        element.dataset
            .animeReactionChecked =
            "true";


        const originalText =
            String(
                element.textContent || ""
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        if (!originalText) {

            return;

        }


        const text =
            originalText
                .toLowerCase();


        const className =
            String(
                element.className || ""
            )
                .toLowerCase();


        // =================================================
        // ERROR
        // =================================================

        const isError =

            className.includes(
                "error"
            )

            ||

            className.includes(
                "danger"
            )

            ||

            text.includes(
                "lỗi"
            )

            ||

            text.includes(
                "thất bại"
            )

            ||

            text.includes(
                "không thể"
            )

            ||

            text.includes(
                "không thành công"
            );


        if (isError) {

            error(
                originalText
            );


            clearAction();


            return;

        }


        // =================================================
        // SUCCESS
        // =================================================

        const isSuccess =

            className.includes(
                "success"
            )

            ||

            text.includes(
                "thành công"
            )

            ||

            text.includes(
                "đã lưu"
            )

            ||

            text.includes(
                "đã nhập"
            )

            ||

            text.includes(
                "đã xuất"
            )

            ||

            text.includes(
                "hoàn tất"
            )

            ||

            text.includes(
                "đã sao lưu"
            );


        if (!isSuccess) {

            return;

        }


        const recentAction =
            getRecentAction();


        // =================================================
        // IMPORT SUCCESS
        // =================================================

        if (
            recentAction ===
                "import"

            ||

            text.includes(
                "đã nhập"
            )

            ||

            text.includes(
                "nhập thành công"
            )
        ) {

            success(
                originalText,
                "import"
            );


            clearAction();


            return;

        }


        // =================================================
        // EXPORT SUCCESS
        // =================================================

        if (
            recentAction ===
                "export"

            ||

            text.includes(
                "đã xuất"
            )

            ||

            text.includes(
                "xuất thành công"
            )
        ) {

            success(
                originalText,
                "export"
            );


            clearAction();


            return;

        }


        // =================================================
        // BACKUP SUCCESS
        // =================================================

        if (
            recentAction ===
                "backup"

            ||

            text.includes(
                "sao lưu"
            )
        ) {

            success(
                originalText,
                "backup"
            );


            clearAction();


            return;

        }


        // =================================================
        // SAVE / NORMAL SUCCESS
        // =================================================

        success(
            originalText,
            "success"
        );


        clearAction();

    }


    // =====================================================
    // OBSERVE TOASTS
    // =====================================================

    function observeNotifications() {

        const observer =
            new MutationObserver(
                mutations => {

                    mutations.forEach(
                        mutation => {

                            mutation
                                .addedNodes
                                .forEach(
                                    node => {

                                        if (
                                            !(
                                                node
                                                instanceof Element
                                            )
                                        ) {

                                            return;

                                        }


                                        if (
                                            node.matches(
                                                TOAST_SELECTOR
                                            )
                                        ) {

                                            analyzeToast(
                                                node
                                            );

                                        }


                                        node
                                            .querySelectorAll(
                                                TOAST_SELECTOR
                                            )
                                            .forEach(
                                                analyzeToast
                                            );

                                    }
                                );

                        }
                    );

                }
            );


        observer.observe(
            document.body,
            {

                childList:
                    true,

                subtree:
                    true

            }
        );

    }


    // =====================================================
    // BUTTON ACTION DETECTION
    // =====================================================

    function observeActions() {

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target
                        ?.closest(
                            "button, a"
                        );


                if (!button) {

                    return;

                }


                // Không xử lý mascot

                if (
                    button.classList.contains(
                        "ui-mascot-character"
                    )
                ) {

                    return;

                }


                const text =
                    String(
                        button.textContent || ""
                    )
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim()
                        .toLowerCase();


                // =================================================
                // IMPORT
                // =================================================

                if (
                    text.includes(
                        "nhập file"
                    )

                    ||

                    text.includes(
                        "import"
                    )

                    ||

                    text.includes(
                        "nhập csv"
                    )

                    ||

                    text.includes(
                        "nhập excel"
                    )
                ) {

                    rememberAction(
                        "import"
                    );


                    importReaction(
                        "Chọn file cần nhập nha."
                    );


                    return;

                }


                // =================================================
                // EXPORT
                // =================================================

                if (
                    text.includes(
                        "xuất excel"
                    )

                    ||

                    text.includes(
                        "xuất csv"
                    )

                    ||

                    text.includes(
                        "export"
                    )
                ) {

                    rememberAction(
                        "export"
                    );


                    exportReaction(
                        "Đang chuẩn bị file cho bạn..."
                    );


                    return;

                }


                // =================================================
                // BACKUP
                // =================================================

                if (
                    text.includes(
                        "sao lưu"
                    )

                    ||

                    text.includes(
                        "backup"
                    )
                ) {

                    rememberAction(
                        "backup"
                    );


                    backupReaction(
                        "Đang chuẩn bị sao lưu dữ liệu..."
                    );


                    return;

                }


                // =================================================
                // SAVE
                // Chỉ nhớ action.
                // Không hiện Cut-in trước khi thực sự save thành công.
                // =================================================

                if (
                    text ===
                        "lưu"

                    ||

                    text.includes(
                        "lưu hồ sơ"
                    )

                    ||

                    text.includes(
                        "lưu thay đổi"
                    )

                    ||

                    text.includes(
                        "cập nhật"
                    )
                ) {

                    rememberAction(
                        "save"
                    );

                }

            },
            true
        );

    }


    // =====================================================
    // INITIALIZE
    // =====================================================

    function initialize() {

        preloadImages();


        createCutin();


        observeNotifications();


        observeActions();


        console.log(
            "🎭 Anime Reaction System V2 đã sẵn sàng."
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once:
                    true
            }
        );

    } else {

        initialize();

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.animeCutin = {

        show,

        hide,

        success,

        error,

        info,

        special,


        import:
            importReaction,

        export:
            exportReaction,

        backup:
            backupReaction,


        setImage(
            reaction,
            path
        ) {

            if (!path) {

                return;

            }


            CONFIG.images[
                reaction
            ] =
                path;


            console.log(
                `Ảnh "${reaction}" đã đổi thành:`,
                path
            );

        },


        testReaction(
            reaction
        ) {

            switch (
                reaction
            ) {

                case "error":

                    error(
                        "OMG! Có lỗi xảy ra rồi!"
                    );

                    break;


                case "import":

                    show({

                        type:
                            "import",

                        reaction:
                            "import",

                        heading:
                            "NHẬP DỮ LIỆU",

                        text:
                            "Nhập dữ liệu thành công",

                        force:
                            true

                    });

                    break;


                case "export":

                    show({

                        type:
                            "export",

                        reaction:
                            "export",

                        heading:
                            "XUẤT DỮ LIỆU",

                        text:
                            "Xuất dữ liệu thành công",

                        force:
                            true

                    });

                    break;


                case "backup":

                    show({

                        type:
                            "backup",

                        reaction:
                            "backup",

                        heading:
                            "SAO LƯU",

                        text:
                            "Đang sao lưu dữ liệu...",

                        force:
                            true

                    });

                    break;


                case "special":

                    special(
                        "wow! Đây là điều đặc biệt!"
                    );

                    break;


                default:

                    show({

                        type:
                            "success",

                        reaction:
                            "success",

                        heading:
                            "HOÀN TẤT!",

                        text:
                            "Đã lưu hồ sơ thành công!",

                        force:
                            true

                    });

            }

        },


        enable() {

            CONFIG.enabled =
                true;

        },


        disable() {

            CONFIG.enabled =
                false;


            hide();

        }

    };


})();
