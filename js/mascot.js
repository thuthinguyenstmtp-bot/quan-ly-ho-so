;(() => {

    "use strict";


    // =====================================================
    // MASCOT EFFECT - LEVEL 4
    // Visual only
    // Không can thiệp Back4App / dữ liệu
    // =====================================================

    const CONFIG = {

        enabled: true,

        sleepAfter:
            45000,

        bubbleDuration:
            4200,

        randomTalkMin:
            60000,

        randomTalkMax:
            110000

    };


    let wrapper = null;

    let character = null;

    let bubble = null;

    let sleepTimer = null;

    let talkTimer = null;

    let bubbleTimer = null;

    let isSleeping = false;


    // =====================================================
    // RANDOM
    // =====================================================

    function randomBetween(
        min,
        max
    ) {

        return (
            Math.random()
            * (max - min)
        ) + min;

    }


    function randomItem(
        items
    ) {

        return items[
            Math.floor(
                Math.random()
                * items.length
            )
        ];

    }


    // =====================================================
    // CREATE MASCOT
    // =====================================================

    function createMascot() {

        if (wrapper) {

            return;

        }


        wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "uiMascot";


        wrapper.className =
            "ui-mascot";


        wrapper.innerHTML = `

            <div
                class="ui-mascot-bubble"
                id="uiMascotBubble"
                aria-live="polite"
            ></div>


            <button
                type="button"
                class="ui-mascot-character"
                id="uiMascotCharacter"
                aria-label="Linh vật trợ giúp"
            >

                <span
                    class="ui-mascot-shadow"
                    aria-hidden="true"
                ></span>


                <span
                    class="ui-mascot-creature"
                    aria-hidden="true"
                >

                    <span
                        class="
                            ui-mascot-ear
                            ui-mascot-ear-left
                        "
                    ></span>

                    <span
                        class="
                            ui-mascot-ear
                            ui-mascot-ear-right
                        "
                    ></span>


                    <span
                        class="ui-mascot-head"
                    >

                        <span
                            class="
                                ui-mascot-eye
                                ui-mascot-eye-left
                            "
                        ></span>

                        <span
                            class="
                                ui-mascot-eye
                                ui-mascot-eye-right
                            "
                        ></span>

                        <span
                            class="ui-mascot-nose"
                        ></span>

                        <span
                            class="ui-mascot-mouth"
                        ></span>

                        <span
                            class="
                                ui-mascot-cheek
                                ui-mascot-cheek-left
                            "
                        ></span>

                        <span
                            class="
                                ui-mascot-cheek
                                ui-mascot-cheek-right
                            "
                        ></span>

                    </span>


                    <span
                        class="ui-mascot-body"
                    ></span>


                    <span
                        class="
                            ui-mascot-foot
                            ui-mascot-foot-left
                        "
                    ></span>

                    <span
                        class="
                            ui-mascot-foot
                            ui-mascot-foot-right
                        "
                    ></span>

                </span>


                <span
                    class="ui-mascot-sleep-symbol"
                    aria-hidden="true"
                >
                    z
                </span>

            </button>

        `;


        document.body.appendChild(
            wrapper
        );


        character =
            document.getElementById(
                "uiMascotCharacter"
            );


        bubble =
            document.getElementById(
                "uiMascotBubble"
            );


        character.addEventListener(
            "click",
            handleMascotClick
        );


        requestAnimationFrame(
            () => {

                wrapper.classList.add(
                    "is-visible"
                );

            }
        );

    }


    // =====================================================
    // BUBBLE
    // =====================================================

    function say(
        message,
        duration = CONFIG.bubbleDuration
    ) {

        if (
            !CONFIG.enabled
            ||
            !bubble
        ) {

            return;

        }


        wake();


        window.clearTimeout(
            bubbleTimer
        );


        bubble.textContent =
            message;


        wrapper.classList.add(
            "is-talking"
        );


        bubbleTimer =
            window.setTimeout(
                () => {

                    wrapper.classList.remove(
                        "is-talking"
                    );

                },
                duration
            );

    }


    // =====================================================
    // STATE RESET
    // =====================================================

    function clearActionStates() {

        if (!wrapper) {

            return;

        }


        wrapper.classList.remove(

            "is-happy",

            "is-jumping",

            "is-worried",

            "is-surprised"

        );

    }


    // =====================================================
    // HAPPY
    // =====================================================

    function happy(
        message =
            "Xong rồi nè!"
    ) {

        if (!wrapper) {

            return;

        }


        wake();

        clearActionStates();


        wrapper.classList.add(
            "is-happy",
            "is-jumping"
        );


        say(
            message
        );


        window.setTimeout(
            () => {

                wrapper?.classList.remove(
                    "is-jumping"
                );

            },
            900
        );


        window.setTimeout(
            () => {

                wrapper?.classList.remove(
                    "is-happy"
                );

            },
            2200
        );

    }


    // =====================================================
    // WORRIED
    // =====================================================

    function worried(
        message =
            "Hình như có gì đó chưa đúng..."
    ) {

        if (!wrapper) {

            return;

        }


        wake();

        clearActionStates();


        wrapper.classList.add(
            "is-worried"
        );


        say(
            message,
            5000
        );


        window.setTimeout(
            () => {

                wrapper?.classList.remove(
                    "is-worried"
                );

            },
            2600
        );

    }


    // =====================================================
    // SURPRISED
    // =====================================================

    function surprised(
        message
    ) {

        wake();

        clearActionStates();


        wrapper.classList.add(
            "is-surprised"
        );


        say(
            message
        );


        window.setTimeout(
            () => {

                wrapper?.classList.remove(
                    "is-surprised"
                );

            },
            1600
        );

    }


    // =====================================================
    // SLEEP
    // =====================================================

    function sleep() {

        if (
            !wrapper
            ||
            isSleeping
        ) {

            return;

        }


        isSleeping =
            true;


        clearActionStates();


        wrapper.classList.add(
            "is-sleeping"
        );


        wrapper.classList.remove(
            "is-talking"
        );

    }


    // =====================================================
    // WAKE
    // =====================================================

    function wake() {

        if (!wrapper) {

            return;

        }


        if (isSleeping) {

            isSleeping =
                false;


            wrapper.classList.remove(
                "is-sleeping"
            );

        }


        resetSleepTimer();

    }


    // =====================================================
    // SLEEP TIMER
    // =====================================================

    function resetSleepTimer() {

        window.clearTimeout(
            sleepTimer
        );


        sleepTimer =
            window.setTimeout(
                sleep,
                CONFIG.sleepAfter
            );

    }


    // =====================================================
    // CLICK MASCOT
    // =====================================================

    function handleMascotClick() {

        const messages = [

            "Mình vẫn đang ở đây.",

            "Hồ sơ hôm nay ổn chứ?",

            "Làm từ từ thôi, mình canh ở đây.",

            "Bạn vừa chọc mình đó.",

            "Đang làm việc rất chăm chỉ nha.",

            "Đừng quên sao lưu dữ liệu nhé."

        ];


        surprised(
            randomItem(
                messages
            )
        );

    }


    // =====================================================
    // RANDOM TALK
    // =====================================================

    function scheduleRandomTalk() {

        window.clearTimeout(
            talkTimer
        );


        if (
            !CONFIG.enabled
        ) {

            return;

        }


        const delay =
            randomBetween(
                CONFIG.randomTalkMin,
                CONFIG.randomTalkMax
            );


        talkTimer =
            window.setTimeout(
                () => {

                    if (
                        !document.hidden
                        &&
                        !isSleeping
                    ) {

                        /*
                        Chỉ khoảng 55% lần
                        thực sự nói.
                        */

                        if (
                            Math.random()
                            < 0.55
                        ) {

                            const messages = [

                                "Mình đang trông hồ sơ giúp bạn.",

                                "Không có gì bất thường ở đây.",

                                "Một ngày quản lý hồ sơ rất bình yên.",

                                "Nhớ kiểm tra hồ sơ cần bổ sung nha.",

                                "Có vẻ mọi thứ đang chạy ổn."

                            ];


                            say(
                                randomItem(
                                    messages
                                ),
                                3500
                            );

                        }

                    }


                    scheduleRandomTalk();

                },
                delay
            );

    }


    // =====================================================
    // SUCCESS / ERROR TOAST DETECTION
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


    function analyzeMessageElement(
        element
    ) {

        if (
            !(element instanceof Element)
        ) {

            return;

        }


        const text =
            String(
                element.textContent || ""
            )
                .trim()
                .toLowerCase();


        const className =
            String(
                element.className || ""
            )
                .toLowerCase();


        if (!text) {

            return;

        }


        // =============================================
        // ERROR
        // =============================================

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
                "không thể"
            )

            ||

            text.includes(
                "thất bại"
            );


        if (isError) {

            worried(
                "Có lỗi rồi, kiểm tra lại nha."
            );


            return;

        }


        // =============================================
        // SUCCESS
        // =============================================

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
            );


        if (isSuccess) {

            happy(
                "Xử lý xong rồi!"
            );

        }

    }


    // =====================================================
    // OBSERVE NOTIFICATIONS
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

                                            analyzeMessageElement(
                                                node
                                            );

                                        }


                                        node
                                            .querySelectorAll(
                                                TOAST_SELECTOR
                                            )
                                            .forEach(
                                                analyzeMessageElement
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
                childList: true,
                subtree: true
            }
        );

    }


    // =====================================================
    // PHẢN ỨNG THEO BUTTON
    // =====================================================

    function observeButtonActions() {

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


                wake();


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


                // =========================================
                // EXPORT
                // =========================================

                if (
                    text.includes(
                        "xuất excel"
                    )
                ) {

                    say(
                        "Đang chuẩn bị file Excel..."
                    );


                    return;

                }


                // =========================================
                // IMPORT
                // =========================================

                if (
                    text.includes(
                        "nhập file"
                    )
                ) {

                    say(
                        "Chọn file cần nhập nha."
                    );


                    return;

                }


                // =========================================
                // TEMPLATE
                // =========================================

                if (
                    text.includes(
                        "tải file mẫu"
                    )
                ) {

                    say(
                        "Mình lấy file mẫu cho bạn."
                    );


                    return;

                }


                // =========================================
                // ADD
                // =========================================

                if (
                    text.includes(
                        "thêm hồ sơ"
                    )
                ) {

                    say(
                        "Mở hồ sơ mới thôi."
                    );

                }

            },
            true
        );

    }


    // =====================================================
    // USER ACTIVITY
    // =====================================================

    function observeUserActivity() {

        [
            "pointerdown",
            "keydown",
            "wheel"
        ]
        .forEach(
            eventName => {

                document.addEventListener(
                    eventName,
                    wake,
                    {
                        passive: true
                    }
                );

            }
        );

    }


    // =====================================================
    // VISIBILITY
    // =====================================================

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                return;

            }


            wake();

        }
    );


    // =====================================================
    // SHOW / HIDE
    // =====================================================

    function show() {

        if (!wrapper) {

            createMascot();

        }


        CONFIG.enabled =
            true;


        wrapper.classList.add(
            "is-visible"
        );


        wake();

    }


    function hide() {

        if (!wrapper) {

            return;

        }


        wrapper.classList.remove(
            "is-visible"
        );

    }


    // =====================================================
    // INITIALIZE
    // =====================================================

    function initializeMascot() {

        if (
            !CONFIG.enabled
        ) {

            return;

        }


        createMascot();

        observeNotifications();

        observeButtonActions();

        observeUserActivity();

        resetSleepTimer();

        scheduleRandomTalk();


        window.setTimeout(
            () => {

                say(
                    "Mình ở đây rồi."
                );

            },
            900
        );


        console.log(
            "🐇 Mascot Level 4 đã sẵn sàng."
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMascot,
            {
                once: true
            }
        );

    } else {

        initializeMascot();

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.mascot = {

        say,

        happy,

        success:
            happy,

        worried,

        error:
            worried,

        surprised,

        sleep,

        wake,

        show,

        hide

    };


})();
