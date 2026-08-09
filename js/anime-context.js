;(() => {

    "use strict";


    // =====================================================
    // ANIME CONTEXT REACTION SYSTEM V1
    //
    // Nhận diện trang hiện tại của SPA
    // và cho Anime Cut-in phản ứng theo ngữ cảnh.
    //
    // Visual only.
    // Không can thiệp Back4App / dữ liệu.
    // =====================================================


    const CONFIG = {

        enabled: true,


        // Sau khi #content thay đổi,
        // chờ một chút để trang render xong.

        detectDelay:
            450,


        // Không cho context reaction
        // xuất hiện quá liên tục.

        minimumGap:
            8500,


        // Khi lần đầu mở web,
        // thêm lời chào theo thời gian.

        greetingOnFirstPage:
            true

    };


    // =====================================================
    // PAGE RULES
    //
    // QUAN TRỌNG:
    // Trang cụ thể phải đặt TRƯỚC trang chung.
    //
    // Ví dụ:
    // "Hồ sơ cần bổ sung"
    // phải đứng trước
    // "Hồ sơ".
    // =====================================================


    const PAGE_RULES = [

        // =================================================
        // HỒ SƠ CẦN BỔ SUNG
        // =================================================

        {

            key:
                "missing-dossier",

            heading:
                "CẦN BỔ SUNG",

            reaction:
                "default",

            keywords: [

                "hồ sơ cần bổ sung",

                "cần bổ sung hồ sơ",

                "danh sách hồ sơ cần bổ sung"

            ],

            messages: [

                "Có vài bộ hồ sơ đang chờ hoàn thiện đó.",

                "Khu này cần mình để ý kỹ một chút.",

                "Mình kiểm tra những hồ sơ còn thiếu nha.",

                "Xử lý từng bộ một là ổn thôi."

            ]

        },


        // =================================================
        // ĐÃ THANH TOÁN
        // =================================================

        {

            key:
                "paid",

            heading:
                "ĐÃ THANH TOÁN",

            reaction:
                "success",

            keywords: [

                "đã thanh toán",

                "hồ sơ đã thanh toán",

                "danh sách đã thanh toán"

            ],

            messages: [

                "Khu này nhìn yên tâm ghê.",

                "Các hồ sơ đã thanh toán nằm ở đây nha.",

                "Hoàn tất được thêm một chặng rồi.",

                "Danh sách này trông gọn gàng đó."

            ]

        },


        // =================================================
        // ĐÃ BÀN GIAO
        // =================================================

        {

            key:
                "handover",

            heading:
                "ĐÃ BÀN GIAO",

            reaction:
                "success",

            keywords: [

                "đã bàn giao",

                "hồ sơ đã bàn giao",

                "danh sách bàn giao"

            ],

            messages: [

                "Những hồ sơ đã bàn giao nằm ở đây.",

                "Bàn giao gọn gàng rồi nha.",

                "Mình canh danh sách này giúp bạn.",

                "Một khu vực khá yên tâm đó."

            ]

        },


        // =================================================
        // LƯU HỒ SƠ / ARCHIVE
        // =================================================

        {

            key:
                "archive",

            heading:
                "LƯU HỒ SƠ",

            reaction:
                "default",

            keywords: [

                "lưu hồ sơ",

                "danh sách lưu hồ sơ",

                "hồ sơ lưu",

                "kho lưu hồ sơ"

            ],

            messages: [

                "Để mình canh kho hồ sơ cho.",

                "Hồ sơ lưu trữ nên sắp thật gọn nha.",

                "Khu này giống tủ tài liệu của mình vậy.",

                "Mình đang trông kho hồ sơ đây."

            ]

        },


        // =================================================
        // SAO LƯU
        // =================================================

        {

            key:
                "backup",

            heading:
                "SAO LƯU",

            reaction:
                "backup",

            keywords: [

                "sao lưu dữ liệu",

                "sao lưu",

                "backup dữ liệu",

                "backup"

            ],

            messages: [

                "Backup trước khi nghỉ nha.",

                "Có bản sao lưu thì mình yên tâm hơn.",

                "Dữ liệu quan trọng thì nhớ giữ một bản dự phòng.",

                "Mình trông dữ liệu, bạn nhớ backup nha."

            ]

        },


        // =================================================
        // THƯ GỬI
        // =================================================

        {

            key:
                "letter",

            heading:
                "THƯ GỬI",

            reaction:
                "default",

            keywords: [

                "thư gửi",

                "quản lý thư gửi",

                "danh sách thư gửi"

            ],

            messages: [

                "Có thư nào cần kiểm tra không ta?",

                "Mình đang trông danh sách thư gửi.",

                "Kiểm tra thông tin trước khi gửi nha.",

                "Thư từ cũng phải sắp thật gọn."

            ]

        },


        // =================================================
        // NHÀ CUNG CẤP
        // =================================================

        {

            key:
                "supplier",

            heading:
                "NHÀ CUNG CẤP",

            reaction:
                "default",

            keywords: [

                "quản lý nhà cung cấp",

                "danh sách nhà cung cấp",

                "nhà cung cấp"

            ],

            messages: [

                "Mình đang kiểm tra danh bạ nè.",

                "Thông tin nhà cung cấp nên cập nhật đầy đủ nha.",

                "Có nhà cung cấp nào mới không ta?",

                "Địa chỉ và người nhận thư nhớ kiểm tra kỹ nhé."

            ]

        },


        // =================================================
        // DỰ ÁN
        // =================================================

        {

            key:
                "project",

            heading:
                "DỰ ÁN",

            reaction:
                "default",

            keywords: [

                "quản lý dự án",

                "danh sách dự án",

                "dự án"

            ],

            messages: [

                "Hôm nay mình kiểm tra dự án nào trước?",

                "Có dự án mới không ta?",

                "Mình đang trông danh sách dự án.",

                "Dự án gọn thì hồ sơ cũng dễ quản lý hơn."

            ]

        },


        // =================================================
        // HỒ SƠ
        //
        // ĐẶT CUỐI vì đây là keyword rất chung.
        // =================================================

        {

            key:
                "dossier",

            heading:
                "HỒ SƠ",

            reaction:
                "default",

            keywords: [

                "quản lý hồ sơ",

                "danh sách hồ sơ"

            ],

            messages: [

                "Hôm nay xử lý hồ sơ nào trước?",

                "Mình đang trông danh sách hồ sơ đây.",

                "Hồ sơ gọn là lòng mình yên.",

                "Có vẻ hôm nay sẽ xử lý khá nhiều hồ sơ đó."

            ]

        }

    ];


    // =====================================================
    // STATE
    // =====================================================

    let contentElement =
        null;


    let contentObserver =
        null;


    let detectionTimer =
        null;


    let lastPageKey =
        null;


    let lastShownAt =
        0;


    let firstDetectedPage =
        true;


    // =====================================================
    // RANDOM ITEM
    // =====================================================

    function randomItem(
        items
    ) {

        if (
            !Array.isArray(items)
            ||
            items.length === 0
        ) {

            return "";

        }


        return items[
            Math.floor(
                Math.random()
                * items.length
            )
        ];

    }


    // =====================================================
    // NORMALIZE TEXT
    //
    // "Nhà cung cấp"
    // ↓
    // "nha cung cap"
    //
    // Giúp nhận diện kể cả dấu tiếng Việt.
    // =====================================================

    function normalizeText(
        value
    ) {

        return String(
            value || ""
        )

            .normalize(
                "NFD"
            )

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .replace(
                /đ/g,
                "d"
            )

            .replace(
                /Đ/g,
                "D"
            )

            .toLowerCase()

            .replace(
                /\s+/g,
                " "
            )

            .trim();

    }


    // =====================================================
    // TIME GREETING
    // =====================================================

    function getTimeGreeting() {

        const hour =
            new Date()
                .getHours();


        if (
            hour >= 5
            &&
            hour < 11
        ) {

            return "Chào buổi sáng!";

        }


        if (
            hour >= 11
            &&
            hour < 14
        ) {

            return "Buổi trưa rồi đó.";

        }


        if (
            hour >= 14
            &&
            hour < 18
        ) {

            return "Chào buổi chiều!";

        }


        if (
            hour >= 18
            &&
            hour < 23
        ) {

            return "Chào buổi tối!";

        }


        return "Khuya rồi đó...";

    }


    // =====================================================
    // LẤY TEXT CỦA HEADING
    //
    // Ưu tiên heading thay vì quét toàn bộ bảng,
    // tránh nhầm trang.
    // =====================================================

    function getHeadingText() {

        if (!contentElement) {

            return "";

        }


        const selectors = [

            "h1",

            ".page-title",

            ".page-heading",

            ".archive-page-heading",

            ".section-title"

        ];


        const elements =
            contentElement
                .querySelectorAll(
                    selectors.join(",")
                );


        const text =
            Array
                .from(elements)

                .map(
                    element =>
                        element.textContent
                )

                .filter(
                    Boolean
                )

                .join(
                    " | "
                );


        return normalizeText(
            text
        );

    }


    // =====================================================
    // FALLBACK TEXT
    //
    // Chỉ dùng nếu heading không đủ thông tin.
    // =====================================================

    function getFallbackText() {

        if (!contentElement) {

            return "";

        }


        const contentText =
            String(
                contentElement.innerText
                || ""
            )
                .slice(
                    0,
                    2500
                );


        return normalizeText(

            `${document.title} ${contentText}`

        );

    }


    // =====================================================
    // CHECK RULE
    // =====================================================

    function matchesRule(
        text,
        rule
    ) {

        return rule.keywords
            .some(
                keyword => {

                    return text.includes(
                        normalizeText(
                            keyword
                        )
                    );

                }
            );

    }


    // =====================================================
    // DETECT CURRENT PAGE
    // =====================================================

    function detectCurrentPage() {

        const headingText =
            getHeadingText();


        // =============================================
        // Ưu tiên heading
        // =============================================

        for (
            const rule
            of PAGE_RULES
        ) {

            if (
                matchesRule(
                    headingText,
                    rule
                )
            ) {

                return rule;

            }

        }


        // =============================================
        // Nếu heading không đủ,
        // mới kiểm tra text trang.
        // =============================================

        const fallbackText =
            getFallbackText();


        for (
            const rule
            of PAGE_RULES
        ) {

            if (
                matchesRule(
                    fallbackText,
                    rule
                )
            ) {

                return rule;

            }

        }


        return null;

    }


    // =====================================================
    // SHOW CONTEXT REACTION
    // =====================================================

    function showContextReaction(
        rule,
        options = {}
    ) {

        if (
            !CONFIG.enabled
            ||
            !rule
        ) {

            return;

        }


        if (
            !window.animeCutin
            ||
            typeof window.animeCutin.show
                !== "function"
        ) {

            console.warn(
                "Anime Context: animeCutin chưa sẵn sàng."
            );


            return;

        }


        const force =
            Boolean(
                options.force
            );


        const now =
            Date.now();


        // =============================================
        // Chống spam
        // =============================================

        if (
            !force
            &&
            now - lastShownAt
                < CONFIG.minimumGap
        ) {

            return;

        }


        let text =
            randomItem(
                rule.messages
            );


        // =============================================
        // Lần đầu mở web:
        // thêm lời chào theo giờ.
        // =============================================

        if (
            firstDetectedPage
            &&
            CONFIG.greetingOnFirstPage
        ) {

            text =
                `${getTimeGreeting()} ${text}`;

        }


        window.animeCutin.show({

            type:
                "info",

            reaction:
                rule.reaction
                || "default",

            heading:
                rule.heading,

            text,

            force

        });


        lastShownAt =
            now;

    }


    // =====================================================
    // DETECT + REACT
    // =====================================================

    function detectAndReact(
        force = false
    ) {

        if (
            !CONFIG.enabled
        ) {

            return;

        }


        const rule =
            detectCurrentPage();


        if (!rule) {

            return;

        }


        // =============================================
        // Nếu vẫn cùng trang,
        // không hiện lại khi table/filter render.
        // =============================================

        if (
            !force
            &&
            rule.key === lastPageKey
        ) {

            return;

        }


        lastPageKey =
            rule.key;


        showContextReaction(
            rule,
            {
                force
            }
        );


        firstDetectedPage =
            false;


        console.log(
            `🎭 Context page: ${rule.key}`
        );

    }


    // =====================================================
    // DEBOUNCE DETECTION
    // =====================================================

    function scheduleDetection() {

        window.clearTimeout(
            detectionTimer
        );


        detectionTimer =
            window.setTimeout(
                () => {

                    detectAndReact();

                },
                CONFIG.detectDelay
            );

    }


    // =====================================================
    // OBSERVE #content
    // =====================================================

    function observeContent() {

        contentElement =
            document.getElementById(
                "content"
            );


        if (!contentElement) {

            console.warn(
                "Anime Context: không tìm thấy #content."
            );


            return;

        }


        contentObserver =
            new MutationObserver(
                mutations => {

                    const hasChange =
                        mutations.some(
                            mutation => {

                                return (
                                    mutation.type
                                        === "childList"

                                    &&

                                    (
                                        mutation.addedNodes
                                            .length > 0

                                        ||

                                        mutation.removedNodes
                                            .length > 0
                                    )
                                );

                            }
                        );


                    if (
                        hasChange
                    ) {

                        scheduleDetection();

                    }

                }
            );


        contentObserver.observe(
            contentElement,
            {

                childList:
                    true,

                subtree:
                    true

            }
        );

    }


    // =====================================================
    // NAVIGATION EVENTS
    //
    // Hỗ trợ nếu app dùng hash / browser history.
    // =====================================================

    function observeNavigation() {

        window.addEventListener(
            "hashchange",
            scheduleDetection
        );


        window.addEventListener(
            "popstate",
            scheduleDetection
        );


        document.addEventListener(
            "click",
            event => {

                const navigation =
                    event.target
                        ?.closest(`
                            .nav-link,
                            .sidebar-link,
                            .sidebar-modern-link,
                            .sidebar-modern-sublink,
                            [data-page],
                            [data-route]
                        `);


                if (!navigation) {

                    return;

                }


                window.setTimeout(
                    scheduleDetection,
                    250
                );

            },
            true
        );

    }


    // =====================================================
    // INITIALIZE
    // =====================================================

    function initialize() {

        observeContent();


        observeNavigation();


        // Trang đầu tiên

        window.setTimeout(
            () => {

                detectAndReact();

            },
            900
        );


        console.log(
            "🧠 Anime Context Reaction System đã sẵn sàng."
        );

    }


    // =====================================================
    // START
    // =====================================================

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

    window.animeContext = {


        // =============================================
        // Nhận diện trang hiện tại và test ngay.
        // =============================================

        detectNow() {

            detectAndReact(
                true
            );

        },


        // =============================================
        // Test một page rule cụ thể.
        // =============================================

        test(
            key
        ) {

            const rule =
                PAGE_RULES.find(
                    item =>
                        item.key === key
                );


            if (!rule) {

                console.warn(
                    `Không tìm thấy context: ${key}`
                );


                return;

            }


            showContextReaction(
                rule,
                {
                    force:
                        true
                }
            );

        },


        // =============================================
        // Nói một câu tùy ý.
        // =============================================

        say(
            heading,
            text,
            reaction = "default"
        ) {

            if (
                !window.animeCutin
            ) {

                return;

            }


            window.animeCutin.show({

                type:
                    "info",

                reaction,

                heading,

                text,

                force:
                    true

            });

        },


        // =============================================
        // Bật
        // =============================================

        enable() {

            CONFIG.enabled =
                true;


            scheduleDetection();

        },


        // =============================================
        // Tắt
        // =============================================

        disable() {

            CONFIG.enabled =
                false;

        },


        // =============================================
        // Cho phép trang hiện tại
        // phản ứng lại lần nữa.
        // =============================================

        reset() {

            lastPageKey =
                null;


            lastShownAt =
                0;

        }

    };


})();
