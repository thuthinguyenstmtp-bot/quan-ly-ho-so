;(() => {

    "use strict";


    // =====================================================
    // MASCOT MOVEMENT - LEVEL 5
    // Chỉ bổ sung chuyển động cho mascot hiện tại
    // =====================================================


    const CONFIG = {

        enabled: true,

        // Random hành động sau 45 - 85 giây
        randomMinDelay: 45000,
        randomMaxDelay: 85000,

        // Chỉ khoảng 45% lần timer chạy
        // mascot thực sự làm gì đó
        randomActionChance: 0.45,

        // Click 5 lần liên tiếp => Easter Egg
        easterEggClicks: 5,

        clickResetTime: 3500

    };


    let wrapper = null;
    let character = null;

    let randomTimer = null;
    let clickResetTimer = null;

    let clickCount = 0;

    let currentAnimation = null;

    let busy = false;


    // =====================================================
    // UTILITIES
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


    function reducedMotion() {

        return window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    }


    // =====================================================
    // GET MASCOT
    // =====================================================

    function findMascot() {

        wrapper =
            document.getElementById(
                "uiMascot"
            );


        character =
            document.getElementById(
                "uiMascotCharacter"
            );


        return Boolean(
            wrapper
            &&
            character
        );

    }


    // =====================================================
    // TALK HELPER
    // =====================================================

    function say(
        message,
        duration
    ) {

        if (
            window.mascot
            &&
            typeof window.mascot.say ===
                "function"
        ) {

            window.mascot.say(
                message,
                duration
            );

        }

    }


    function wake() {

        if (
            window.mascot
            &&
            typeof window.mascot.wake ===
                "function"
        ) {

            window.mascot.wake();

        }

    }


    // =====================================================
    // STOP CURRENT MOVEMENT
    // =====================================================

    function stopCurrentMovement() {

        if (
            currentAnimation
        ) {

            try {

                currentAnimation.cancel();

            } catch (error) {

                console.warn(
                    "Không cancel được mascot animation:",
                    error
                );

            }


            currentAnimation =
                null;

        }


        if (wrapper) {

            wrapper.style.transform =
                "";

        }


        busy =
            false;

    }


    // =====================================================
    // RUN ACROSS SCREEN
    // =====================================================

    function runAcross() {

        if (
            !CONFIG.enabled
            ||
            busy
            ||
            reducedMotion()
            ||
            !findMascot()
        ) {

            return;

        }


        wake();


        busy =
            true;


        const distance =
            Math.max(
                260,
                window.innerWidth - 145
            );


        wrapper.classList.add(
            "mascot-is-running"
        );


        say(
            randomItem([
                "Mình đi tuần một vòng nha!",
                "Để mình kiểm tra phía bên kia.",
                "Đi dạo chút xíu thôi.",
                "Chạy một vòng nào!"
            ]),
            2500
        );


        currentAnimation =
            wrapper.animate(
                [

                    {
                        transform:
                            "translate3d(0, 0, 0)"
                    },

                    {
                        transform:
                            `translate3d(-${distance * 0.48}px, -3px, 0)`
                    },

                    {
                        transform:
                            `translate3d(-${distance}px, 0, 0)`
                    }

                ],
                {

                    duration:
                        Math.min(
                            5200,
                            Math.max(
                                3000,
                                distance * 4.1
                            )
                        ),

                    easing:
                        "linear",

                    fill:
                        "forwards"

                }
            );


        currentAnimation.onfinish =
            () => {

                wrapper.classList.remove(
                    "mascot-is-running"
                );


                // Đứng bên trái khoảng 700ms

                window.setTimeout(
                    () => {

                        returnHome();

                    },
                    700
                );

            };


        currentAnimation.oncancel =
            () => {

                wrapper.classList.remove(
                    "mascot-is-running"
                );


                busy =
                    false;

            };

    }


    // =====================================================
    // RETURN HOME
    // =====================================================

    function returnHome() {

        if (
            !wrapper
            ||
            reducedMotion()
        ) {

            stopCurrentMovement();

            return;

        }


        const distance =
            Math.max(
                260,
                window.innerWidth - 145
            );


        wrapper.classList.add(
            "mascot-is-running",
            "mascot-running-home"
        );


        currentAnimation =
            wrapper.animate(
                [

                    {
                        transform:
                            `translate3d(-${distance}px, 0, 0)`
                    },

                    {
                        transform:
                            `translate3d(-${distance * 0.50}px, -2px, 0)`
                    },

                    {
                        transform:
                            "translate3d(0, 0, 0)"
                    }

                ],
                {

                    duration:
                        Math.min(
                            4700,
                            Math.max(
                                2800,
                                distance * 3.7
                            )
                        ),

                    easing:
                        "linear",

                    fill:
                        "forwards"

                }
            );


        currentAnimation.onfinish =
            () => {

                wrapper.classList.remove(
                    "mascot-is-running",
                    "mascot-running-home"
                );


                if (
                    currentAnimation
                ) {

                    currentAnimation.cancel();

                }


                currentAnimation =
                    null;


                wrapper.style.transform =
                    "";


                busy =
                    false;


                say(
                    "Mình về chỗ rồi.",
                    2200
                );

            };

    }


    // =====================================================
    // PEEK
    // =====================================================

    function peek() {

        if (
            !CONFIG.enabled
            ||
            busy
            ||
            reducedMotion()
            ||
            !findMascot()
        ) {

            return;

        }


        busy =
            true;


        wake();


        wrapper.classList.add(
            "mascot-is-peeking"
        );


        say(
            randomItem([
                "Có ai gọi mình không?",
                "Mình ló ra xem chút thôi.",
                "Hmm...",
                "Vẫn đang làm việc hả?"
            ]),
            2600
        );


        currentAnimation =
            wrapper.animate(
                [

                    {
                        transform:
                            "translate3d(0, 0, 0)"
                    },

                    {
                        transform:
                            "translate3d(57px, 5px, 0)"
                    },

                    {
                        transform:
                            "translate3d(39px, 1px, 0)"
                    },

                    {
                        transform:
                            "translate3d(39px, 1px, 0)"
                    },

                    {
                        transform:
                            "translate3d(0, 0, 0)"
                    }

                ],
                {

                    duration:
                        3900,

                    easing:
                        "ease-in-out"

                }
            );


        currentAnimation.onfinish =
            () => {

                wrapper.classList.remove(
                    "mascot-is-peeking"
                );


                currentAnimation =
                    null;


                busy =
                    false;

            };

    }


    // =====================================================
    // DANCE
    // =====================================================

    function dance(
        message = "Hehe ✨"
    ) {

        if (
            !CONFIG.enabled
            ||
            busy
            ||
            reducedMotion()
            ||
            !findMascot()
        ) {

            return;

        }


        busy =
            true;


        wake();


        wrapper.classList.add(
            "mascot-is-dancing"
        );


        say(
            message,
            3000
        );


        currentAnimation =
            character.animate(
                [

                    {
                        transform:
                            "translateY(0) rotate(0deg)"
                    },

                    {
                        transform:
                            "translateY(-8px) rotate(-10deg)"
                    },

                    {
                        transform:
                            "translateY(0) rotate(8deg)"
                    },

                    {
                        transform:
                            "translateY(-9px) rotate(-8deg)"
                    },

                    {
                        transform:
                            "translateY(0) rotate(7deg)"
                    },

                    {
                        transform:
                            "translateY(-5px) rotate(-4deg)"
                    },

                    {
                        transform:
                            "translateY(0) rotate(0deg)"
                    }

                ],
                {

                    duration:
                        1500,

                    easing:
                        "ease-in-out"

                }
            );


        currentAnimation.onfinish =
            () => {

                wrapper.classList.remove(
                    "mascot-is-dancing"
                );


                currentAnimation =
                    null;


                busy =
                    false;

            };

    }


    // =====================================================
    // SMALL HOP
    // =====================================================

    function hop() {

        if (
            busy
            ||
            reducedMotion()
            ||
            !findMascot()
        ) {

            return;

        }


        busy =
            true;


        wake();


        currentAnimation =
            character.animate(
                [

                    {
                        transform:
                            "translateY(0)"
                    },

                    {
                        transform:
                            "translateY(-13px)"
                    },

                    {
                        transform:
                            "translateY(0)"
                    },

                    {
                        transform:
                            "translateY(-5px)"
                    },

                    {
                        transform:
                            "translateY(0)"
                    }

                ],
                {

                    duration:
                        700,

                    easing:
                        "ease-out"

                }
            );


        currentAnimation.onfinish =
            () => {

                currentAnimation =
                    null;


                busy =
                    false;

            };

    }


    // =====================================================
    // EASTER EGG
    // =====================================================

    function triggerEasterEgg() {

        clickCount =
            0;


        window.clearTimeout(
            clickResetTimer
        );


        if (
            busy
        ) {

            return;

        }


        if (
            window.uiEffects
            &&
            typeof window.uiEffects.sparkle ===
                "function"
        ) {

            const rect =
                character.getBoundingClientRect();


            window.uiEffects.sparkle(

                rect.left
                + rect.width / 2,

                rect.top
                + rect.height / 2,

                16

            );

        }


        dance(
            randomItem([
                "Bắt được Easter Egg rồi! ✨",
                "Chọc hoài luôn đó nha!",
                "Okay okay, mình nhảy cho xem!",
                "Bạn thắng rồi đó 😂"
            ])
        );

    }


    function handleMascotClick() {

        clickCount +=
            1;


        window.clearTimeout(
            clickResetTimer
        );


        clickResetTimer =
            window.setTimeout(
                () => {

                    clickCount =
                        0;

                },
                CONFIG.clickResetTime
            );


        if (
            clickCount >=
            CONFIG.easterEggClicks
        ) {

            triggerEasterEgg();

        }

    }


    // =====================================================
    // RANDOM ACTION
    // =====================================================

    function performRandomAction() {

        if (
            document.hidden
            ||
            busy
            ||
            !CONFIG.enabled
        ) {

            return;

        }


        if (
            Math.random() >
            CONFIG.randomActionChance
        ) {

            return;

        }


        const action =
            randomItem([
                "peek",
                "hop",
                "peek",
                "hop",
                "run"
            ]);


        switch (
            action
        ) {

            case "run":

                runAcross();

                break;


            case "hop":

                hop();

                break;


            default:

                peek();

        }

    }


    // =====================================================
    // RANDOM TIMER
    // =====================================================

    function scheduleRandomAction() {

        window.clearTimeout(
            randomTimer
        );


        if (
            !CONFIG.enabled
        ) {

            return;

        }


        randomTimer =
            window.setTimeout(
                () => {

                    performRandomAction();


                    scheduleRandomAction();

                },

                randomBetween(
                    CONFIG.randomMinDelay,
                    CONFIG.randomMaxDelay
                )

            );

    }


    // =====================================================
    // TAB VISIBILITY
    // =====================================================

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                stopCurrentMovement();

            } else {

                scheduleRandomAction();

            }

        }
    );


    // =====================================================
    // START
    // =====================================================

    function initialize() {

        /*
        mascot.js chạy trước.
        Nhưng vẫn retry nếu DOM mascot
        chưa xuất hiện ngay.
        */

        let attempts =
            0;


        const waitForMascot =
            window.setInterval(
                () => {

                    attempts +=
                        1;


                    if (
                        findMascot()
                    ) {

                        window.clearInterval(
                            waitForMascot
                        );


                        character.addEventListener(
                            "click",
                            handleMascotClick
                        );


                        scheduleRandomAction();


                        console.log(
                            "🐇 Mascot Movement Level 5 đã sẵn sàng."
                        );

                    }


                    if (
                        attempts >= 30
                    ) {

                        window.clearInterval(
                            waitForMascot
                        );

                    }

                },
                200
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
                once: true
            }
        );

    } else {

        initialize();

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.mascotMoves = {

        run:
            runAcross,

        runAcross,

        peek,

        dance,

        hop,


        stop() {

            CONFIG.enabled =
                false;


            window.clearTimeout(
                randomTimer
            );


            stopCurrentMovement();

        },


        start() {

            CONFIG.enabled =
                true;


            scheduleRandomAction();

        }

    };


})();
