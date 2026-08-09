;(() => {

    "use strict";


    // =====================================================
    // AMBIENT EFFECT PACK - LEVEL 3
    // Lá + đom đóm + bụi sáng
    // Visual only
    // =====================================================


    const CONFIG = {

        enabled: true,

        // Lá xuất hiện mỗi 5 - 9 giây
        leafMinDelay: 2500,
        leafMaxDelay: 5000,

        // Đom đóm tối đa cùng lúc
        maxFireflies: 12,

        // Bụi sáng tối đa
        maxDust: 10,

        enableLeaves: true,
        enableFireflies: true,
        enableDust: true

    };


    let layer =
        null;


    let leafTimer =
        null;


    let running =
        false;


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


    // =====================================================
    // REDUCED MOTION
    // =====================================================

    function reducedMotion() {

        return window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    }


    // =====================================================
    // TẠO EFFECT LAYER
    // =====================================================

    function createLayer() {

        if (layer) {

            return layer;

        }


        layer =
            document.createElement(
                "div"
            );


        layer.className =
            "ambient-ui-layer";


        layer.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.appendChild(
            layer
        );


        return layer;

    }


    // =====================================================
    // LEAF
    // =====================================================

    function createLeaf() {

        if (
            !running
            ||
            !CONFIG.enabled
            ||
            !CONFIG.enableLeaves
            ||
            reducedMotion()
        ) {

            return;

        }


        const leaf =
            document.createElement(
                "span"
            );


        leaf.className =
            "ambient-leaf";


        // =============================================
        // Random loại lá
        // =============================================

        const variant =
            Math.floor(
                randomBetween(
                    1,
                    4
                )
            );


        leaf.classList.add(
            `ambient-leaf-${variant}`
        );


        // =============================================
        // Random vị trí
        // =============================================

        const startX =
            randomBetween(
                18,
                96
            );


        leaf.style.left =
            `${startX}vw`;


        leaf.style.top =
            `${randomBetween(
                -8,
                -2
            )}vh`;


        // =============================================
        // Random kích thước
        // =============================================

        const size =
            randomBetween(
                8,
                15
            );


        leaf.style.width =
            `${size}px`;


        leaf.style.height =
            `${size * 0.62}px`;


        // =============================================
        // Hướng trôi
        // =============================================

        const drift =
            randomBetween(
                -90,
                90
            );


        leaf.style.setProperty(
            "--leaf-drift",
            `${drift}px`
        );


        leaf.style.setProperty(
            "--leaf-rotate",
            `${randomBetween(
                180,
                520
            )}deg`
        );


        // =============================================
        // Thời gian rơi
        // =============================================

        const duration =
            randomBetween(
                8,
                14
            );


        leaf.style.animationDuration =
            `${duration}s`;


        createLayer()
            .appendChild(
                leaf
            );


        window.setTimeout(
            () => {

                leaf.remove();

            },
            (
                duration
                * 1000
            )
            + 500
        );

    }


    // =====================================================
    // LỊCH TẠO LÁ
    // =====================================================

    function scheduleLeaf() {

        window.clearTimeout(
            leafTimer
        );


        if (
            !running
            ||
            !CONFIG.enabled
        ) {

            return;

        }


        const delay =
            randomBetween(

                CONFIG.leafMinDelay,

                CONFIG.leafMaxDelay

            );


        leafTimer =
            window.setTimeout(
                () => {

                    createLeaf();

                    scheduleLeaf();

                },
                delay
            );

    }


    // =====================================================
    // FIREFLY
    // =====================================================

    function createFirefly() {

        if (
            !CONFIG.enabled
            ||
            !CONFIG.enableFireflies
            ||
            reducedMotion()
        ) {

            return;

        }


        const firefly =
            document.createElement(
                "span"
            );


        firefly.className =
            "ambient-firefly";


        firefly.style.left =
            `${randomBetween(
                18,
                97
            )}vw`;


        firefly.style.top =
            `${randomBetween(
                8,
                92
            )}vh`;


        firefly.style.setProperty(

            "--firefly-x",

            `${randomBetween(
                -45,
                45
            )}px`

        );


        firefly.style.setProperty(

            "--firefly-y",

            `${randomBetween(
                -40,
                40
            )}px`

        );


        const duration =
            randomBetween(
                6,
                11
            );


        firefly.style.animationDuration =
            `${duration}s`;


        firefly.style.animationDelay =
            `${randomBetween(
                -5,
                0
            )}s`;


        createLayer()
            .appendChild(
                firefly
            );

    }


    // =====================================================
    // DUST
    // =====================================================

    function createDust() {

        if (
            !CONFIG.enabled
            ||
            !CONFIG.enableDust
            ||
            reducedMotion()
        ) {

            return;

        }


        const dust =
            document.createElement(
                "span"
            );


        dust.className =
            "ambient-dust";


        dust.style.left =
            `${randomBetween(
                16,
                98
            )}vw`;


        dust.style.top =
            `${randomBetween(
                5,
                95
            )}vh`;


        const size =
            randomBetween(
                2,
                4
            );


        dust.style.width =
            `${size}px`;


        dust.style.height =
            `${size}px`;


        dust.style.setProperty(

            "--dust-x",

            `${randomBetween(
                -25,
                25
            )}px`

        );


        dust.style.setProperty(

            "--dust-y",

            `${randomBetween(
                -35,
                -12
            )}px`

        );


        dust.style.animationDuration =
            `${randomBetween(
                8,
                15
            )}s`;


        createLayer()
            .appendChild(
                dust
            );

    }


    // =====================================================
    // INITIAL PARTICLES
    // =====================================================

    function createAmbientParticles() {

        const currentLayer =
            createLayer();


        currentLayer
            .querySelectorAll(
                ".ambient-firefly, .ambient-dust"
            )
            .forEach(
                item => item.remove()
            );


        if (
            CONFIG.enableFireflies
        ) {

            for (
                let index = 0;

                index <
                CONFIG.maxFireflies;

                index += 1
            ) {

                createFirefly();

            }

        }


        if (
            CONFIG.enableDust
        ) {

            for (
                let index = 0;

                index <
                CONFIG.maxDust;

                index += 1
            ) {

                createDust();

            }

        }

    }


    // =====================================================
    // START
    // =====================================================

    function start() {

        if (
            running
            ||
            !CONFIG.enabled
            ||
            reducedMotion()
        ) {

            return;

        }


        running =
            true;


        createLayer();


        layer.classList.remove(
            "ambient-effects-paused"
        );


        createAmbientParticles();


        scheduleLeaf();


        console.log(
            "🌿 Ambient Effects Level 3 đang chạy."
        );

    }


    // =====================================================
    // PAUSE
    // =====================================================

    function pause() {

        running =
            false;


        window.clearTimeout(
            leafTimer
        );


        if (layer) {

            layer.classList.add(
                "ambient-effects-paused"
            );

        }

    }


    // =====================================================
    // STOP
    // =====================================================

    function stop() {

        pause();


        if (layer) {

            layer.remove();

            layer =
                null;

        }


        console.log(
            "Ambient Effects đã tắt."
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

                pause();

            } else if (
                CONFIG.enabled
            ) {

                start();

            }

        }
    );


    // =====================================================
    // INITIALIZE
    // =====================================================

    function initialize() {

        if (
            !CONFIG.enabled
        ) {

            return;

        }


        start();

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

    window.ambientEffects = {

        start,

        pause,

        stop,


        leaf() {

            createLeaf();

        },


        setEnabled(
            enabled
        ) {

            CONFIG.enabled =
                Boolean(
                    enabled
                );


            if (
                CONFIG.enabled
            ) {

                start();

            } else {

                stop();

            }

        },


        setLeaves(
            enabled
        ) {

            CONFIG.enableLeaves =
                Boolean(
                    enabled
                );


            if (
                CONFIG.enableLeaves
            ) {

                scheduleLeaf();

            } else {

                window.clearTimeout(
                    leafTimer
                );

            }

        },


        setFireflies(
            enabled
        ) {

            CONFIG.enableFireflies =
                Boolean(
                    enabled
                );


            createAmbientParticles();

        },


        setDust(
            enabled
        ) {

            CONFIG.enableDust =
                Boolean(
                    enabled
                );


            createAmbientParticles();

        }

    };


})();
