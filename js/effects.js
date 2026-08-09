;(() => {

    "use strict";


    // =====================================================
    // UI EFFECT PACK - LEVEL 2
    // Chỉ xử lý hiệu ứng hình ảnh.
    // Không can thiệp dữ liệu / Back4App.
    // =====================================================


    const EFFECT_CONFIG = {

        sparkleCount: 7,

        sparkleLifetime: 720,

        enableSparkles: true,

        enableClickRing: true,

        enableButtonPress: true,

        enablePageTransition: true,

        enableModalAnimation: true,

        enableToastAnimation: true,

        enableSuccessCelebration: true

    };


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


    function isReducedMotion() {

        return window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    }


    // =====================================================
    // SPARKLE
    // =====================================================

    function createSparkle(
        x,
        y,
        index,
        total = EFFECT_CONFIG.sparkleCount
    ) {

        if (
            !EFFECT_CONFIG.enableSparkles
            ||
            isReducedMotion()
        ) {

            return;

        }


        const sparkle =
            document.createElement(
                "span"
            );


        sparkle.className =
            "ui-click-sparkle";


        const symbols = [
            "✦",
            "✧",
            "·",
            "✦",
            "✧"
        ];


        sparkle.textContent =
            symbols[
                Math.floor(
                    Math.random()
                    * symbols.length
                )
            ];


        sparkle.style.left =
            `${x}px`;


        sparkle.style.top =
            `${y}px`;


        const angle =
            (
                Math.PI * 2
            )
            *
            (
                index / total
            )
            +
            randomBetween(
                -0.34,
                0.34
            );


        const distance =
            randomBetween(
                25,
                55
            );


        const moveX =
            Math.cos(angle)
            * distance;


        const moveY =
            Math.sin(angle)
            * distance;


        sparkle.style.setProperty(
            "--spark-x",
            `${moveX}px`
        );


        sparkle.style.setProperty(
            "--spark-y",
            `${moveY}px`
        );


        sparkle.style.setProperty(
            "--spark-rotate",
            `${randomBetween(
                -100,
                100
            )}deg`
        );


        sparkle.style.setProperty(
            "--spark-scale",
            randomBetween(
                0.7,
                1.3
            )
        );


        sparkle.style.animationDelay =
            `${randomBetween(
                0,
                45
            )}ms`;


        document.body.appendChild(
            sparkle
        );


        window.setTimeout(
            () => {

                sparkle.remove();

            },

            EFFECT_CONFIG.sparkleLifetime
            + 150
        );

    }


    function createSparkleBurst(
        x,
        y,
        amount = EFFECT_CONFIG.sparkleCount
    ) {

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {

            createSparkle(
                x,
                y,
                index,
                amount
            );

        }

    }


    // =====================================================
    // CLICK MAGIC RING
    // =====================================================

    function createClickRing(
        x,
        y
    ) {

        if (
            !EFFECT_CONFIG.enableClickRing
            ||
            isReducedMotion()
        ) {

            return;

        }


        const ring =
            document.createElement(
                "span"
            );


        ring.className =
            "ui-click-ring";


        ring.style.left =
            `${x}px`;


        ring.style.top =
            `${y}px`;


        document.body.appendChild(
            ring
        );


        window.setTimeout(
            () => {

                ring.remove();

            },
            700
        );

    }


    // =====================================================
    // BUTTON PRESS
    // =====================================================

    function animatePressedElement(
        element
    ) {

        if (
            !EFFECT_CONFIG.enableButtonPress
            ||
            !element
            ||
            isReducedMotion()
        ) {

            return;

        }


        element.classList.remove(
            "ui-effect-pressed"
        );


        void element.offsetWidth;


        element.classList.add(
            "ui-effect-pressed"
        );


        window.setTimeout(
            () => {

                element.classList.remove(
                    "ui-effect-pressed"
                );

            },
            240
        );

    }


    // =====================================================
    // INTERACTIVE ELEMENT
    // =====================================================

    function findInteractiveElement(
        target
    ) {

        if (
            !(target instanceof Element)
        ) {

            return null;

        }


        const element =
    target.closest(`
        button,
        a,
        [role="button"],
        .nav-link,
        .sidebar-link,
        .sidebar-modern-link,
        .sidebar-modern-sublink
    `);


if (
    element
    &&
    element.classList.contains(
        "ui-mascot-character"
    )
) {

    return null;

}


return element;

    }


    // =====================================================
    // CLICK EFFECT
    // =====================================================

    document.addEventListener(
        "pointerdown",
        event => {

            if (
                event.pointerType === "mouse"
                &&
                event.button !== 0
            ) {

                return;

            }


            const element =
                findInteractiveElement(
                    event.target
                );


            if (!element) {

                return;

            }


            if (
                element.matches(
                    ":disabled"
                )
            ) {

                return;

            }


            createClickRing(
                event.clientX,
                event.clientY
            );


            createSparkleBurst(
                event.clientX,
                event.clientY
            );


            animatePressedElement(
                element
            );

        },
        {
            passive: true
        }
    );


    // =====================================================
    // PAGE TRANSITION
    // =====================================================

    let pageAnimationTimer =
        null;


    function animateContentPage() {

        if (
            !EFFECT_CONFIG.enablePageTransition
            ||
            isReducedMotion()
        ) {

            return;

        }


        const content =
            document.getElementById(
                "content"
            );


        if (!content) {

            return;

        }


        content.classList.remove(
            "ui-content-enter"
        );


        void content.offsetWidth;


        content.classList.add(
            "ui-content-enter"
        );


        window.clearTimeout(
            pageAnimationTimer
        );


        pageAnimationTimer =
            window.setTimeout(
                () => {

                    content.classList.remove(
                        "ui-content-enter"
                    );

                },
                430
            );

    }


    function observeContentChanges() {

        const content =
            document.getElementById(
                "content"
            );


        if (!content) {

            return;

        }


        let scheduled =
            false;


        const observer =
            new MutationObserver(
                mutations => {

                    const changed =
                        mutations.some(
                            mutation =>

                                mutation.type ===
                                "childList"

                                &&

                                (
                                    mutation.addedNodes.length
                                    ||
                                    mutation.removedNodes.length
                                )
                        );


                    if (
                        !changed
                        ||
                        scheduled
                    ) {

                        return;

                    }


                    scheduled =
                        true;


                    window.requestAnimationFrame(
                        () => {

                            scheduled =
                                false;


                            animateContentPage();


                            decorateInteractiveElements();

                        }
                    );

                }
            );


        observer.observe(
            content,
            {
                childList: true,
                subtree: false
            }
        );

    }


    // =====================================================
    // LIGHT SWEEP
    // =====================================================

    function decorateInteractiveElements(
        root = document
    ) {

        if (
            !root
            ||
            typeof root.querySelectorAll !==
                "function"
        ) {

            return;

        }


        root
            .querySelectorAll(`
                button:not(:disabled):not(.ui-mascot-character),
                .btn-primary,
                .primary-button,
                .archive-primary-button,
                .archive-add-button,
                .dossier-add-button
            `)
            .forEach(
                element => {

                    element.classList.add(
                        "ui-light-sweep"
                    );

                }
            );

    }


    // =====================================================
    // MODAL EFFECT
    // =====================================================

    function animateVisibleModal(
        modal
    ) {

        if (
            !EFFECT_CONFIG.enableModalAnimation
            ||
            !(modal instanceof Element)
            ||
            isReducedMotion()
        ) {

            return;

        }


        const dialog =

            modal.querySelector(`
                .modal-content,
                .modal-dialog,
                .archive-modal-dialog
            `)

            ||

            modal;


        dialog.classList.remove(
            "ui-modal-enter"
        );


        void dialog.offsetWidth;


        dialog.classList.add(
            "ui-modal-enter"
        );


        window.setTimeout(
            () => {

                dialog.classList.remove(
                    "ui-modal-enter"
                );

            },
            360
        );

    }


    // =====================================================
    // TOAST
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


    function isSuccessToast(
        element
    ) {

        if (!element) {

            return false;

        }


        const className =
            String(
                element.className || ""
            )
                .toLowerCase();


        const text =
            String(
                element.textContent || ""
            )
                .toLowerCase();


        if (
            className.includes(
                "success"
            )
        ) {

            return true;

        }


        return (
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
                "success"
            )
        );

    }


    function animateToast(
        toast
    ) {

        if (
            !EFFECT_CONFIG.enableToastAnimation
            ||
            !(toast instanceof Element)
        ) {

            return;

        }


        if (
            toast.dataset.uiEffectAnimated ===
            "true"
        ) {

            return;

        }


        toast.dataset.uiEffectAnimated =
            "true";


        toast.classList.add(
            "ui-toast-enter"
        );


        window.setTimeout(
            () => {

                toast.classList.remove(
                    "ui-toast-enter"
                );

            },
            500
        );


        // =============================================
        // SUCCESS CELEBRATION
        // =============================================

        if (
            EFFECT_CONFIG.enableSuccessCelebration
            &&
            isSuccessToast(
                toast
            )
        ) {

            window.setTimeout(
                () => {

                    const rect =
                        toast.getBoundingClientRect();


                    const x =
                        Math.min(
                            window.innerWidth - 30,
                            rect.left
                            + rect.width
                            - 20
                        );


                    const y =
                        rect.top
                        + Math.min(
                            rect.height / 2,
                            35
                        );


                    createSparkleBurst(
                        x,
                        y,
                        11
                    );

                },
                120
            );

        }

    }


    // =====================================================
    // GLOBAL DOM OBSERVER
    // =====================================================

    function observeGlobalUi() {

        const observer =
            new MutationObserver(
                mutations => {

                    mutations.forEach(
                        mutation => {

                            // =================================
                            // NODES ĐƯỢC THÊM
                            // =================================

                            mutation.addedNodes
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


                                        decorateInteractiveElements(
                                            node
                                        );


                                        if (
                                            node.matches(
                                                TOAST_SELECTOR
                                            )
                                        ) {

                                            animateToast(
                                                node
                                            );

                                        }


                                        node
                                            .querySelectorAll(
                                                TOAST_SELECTOR
                                            )
                                            .forEach(
                                                animateToast
                                            );

                                    }
                                );


                            // =================================
                            // MODAL SHOW/HIDE
                            // =================================

                            if (
                                mutation.type ===
                                "attributes"
                            ) {

                                const element =
                                    mutation.target;


                                if (
                                    !(
                                        element
                                        instanceof Element
                                    )
                                ) {

                                    return;

                                }


                                if (
                                    element.matches(`
                                        .modal,
                                        .modal-overlay,
                                        .archive-modal,
                                        .archive-modal-overlay
                                    `)
                                ) {

                                    const style =
                                        window
                                            .getComputedStyle(
                                                element
                                            );


                                    if (
                                        style.display !==
                                            "none"

                                        &&

                                        style.visibility !==
                                            "hidden"

                                        &&

                                        Number(
                                            style.opacity || 1
                                        ) !== 0
                                    ) {

                                        animateVisibleModal(
                                            element
                                        );

                                    }

                                }

                            }

                        }
                    );

                }
            );


        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    "class",
                    "style"
                ]
            }
        );

    }


    // =====================================================
    // MANUAL SUCCESS CELEBRATION
    // =====================================================

    function celebrateElement(
        element,
        amount = 13
    ) {

        if (
            !(element instanceof Element)
        ) {

            return;

        }


        const rect =
            element.getBoundingClientRect();


        createSparkleBurst(

            rect.left
            + rect.width / 2,

            rect.top
            + rect.height / 2,

            amount

        );


        createClickRing(

            rect.left
            + rect.width / 2,

            rect.top
            + rect.height / 2

        );

    }


    // =====================================================
    // START
    // =====================================================

    function initializeUiEffects() {

        decorateInteractiveElements();

        observeContentChanges();

        observeGlobalUi();


        document.documentElement
            .classList
            .add(
                "ui-effects-ready"
            );


        console.log(
            "✨ UI Effects Level 2 đã sẵn sàng."
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeUiEffects,
            {
                once: true
            }
        );

    } else {

        initializeUiEffects();

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.uiEffects = {

        sparkle(
            x,
            y,
            amount = 7
        ) {

            createSparkleBurst(
                x,
                y,
                amount
            );

        },


        ring(
            x,
            y
        ) {

            createClickRing(
                x,
                y
            );

        },


        celebrate(
            element
        ) {

            celebrateElement(
                element
            );

        },


        page() {

            animateContentPage();

        }

    };


})();
