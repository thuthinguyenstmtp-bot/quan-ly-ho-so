;(() => {

    "use strict";


    // =====================================================
    // SMART SUPPLIER MATCH V1
    //
    // Ví dụ:
    //
    // CTY TNHH NÂNG HẠ HUY HÙNG
    //
    // người dùng chỉ cần nhập:
    //
    // HUY HÙNG
    // huy hung
    // Huy Hùng
    // NÂNG HẠ HUY HÙNG
    //
    // Nếu chỉ có 1 NCC phù hợp:
    // → tự chọn NCC chuẩn.
    //
    // File này KHÔNG sửa dossier.js.
    // =====================================================


    const CONFIG = {

        enabled: true,

        minimumLength: 3

    };


    // =====================================================
    // LẤY DANH SÁCH SUPPLIER
    // =====================================================

    function getSuppliers() {

        if (
            typeof window.getSuppliersData ===
            "function"
        ) {

            const data =
                window.getSuppliersData();


            if (Array.isArray(data)) {

                return data;

            }

        }


        if (
            Array.isArray(
                window.suppliers
            )
        ) {

            return window.suppliers;

        }


        return [];

    }


    // =====================================================
    // THÔNG TIN NCC
    // =====================================================

    function getSupplierName(
        supplier
    ) {

        return String(

            supplier?.ten

            ||

            supplier?.name

            ||

            ""

        ).trim();

    }


    function getSupplierCode(
        supplier
    ) {

        return String(

            supplier?.code

            ||

            supplier?.ma

            ||

            supplier?.maNCC

            ||

            supplier?.supplierCode

            ||

            ""

        ).trim();

    }


    function getSupplierPhone(
        supplier
    ) {

        return String(

            supplier?.sdt

            ||

            supplier?.phone

            ||

            supplier?.phoneNumber

            ||

            ""

        ).trim();

    }


    function getSupplierId(
        supplier
    ) {

        return String(

            supplier?.back4appId

            ||

            supplier?.objectId

            ||

            supplier?.id

            ||

            supplier?.legacyId

            ||

            ""

        ).trim();

    }


    // =====================================================
    // NORMALIZE CƠ BẢN
    //
    // HUY HÙNG
    // →
    // huy hung
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
                /[^a-z0-9\s]/g,
                " "
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim();

    }


    // =====================================================
    // BỎ TIỀN TỐ PHÁP LÝ
    //
    // CTY TNHH NÂNG HẠ HUY HÙNG
    // →
    // nang ha huy hung
    // =====================================================

    function normalizeSupplierName(
        value
    ) {

        let text =
            normalizeText(
                value
            );


        if (!text) {

            return "";

        }


        const patterns = [

            /\bcong ty trach nhiem huu han mot thanh vien\b/g,

            /\bcong ty tnhh mot thanh vien\b/g,

            /\bcong ty tnhh mtv\b/g,

            /\bcong ty co phan\b/g,

            /\bdoanh nghiep tu nhan\b/g,

            /\btrach nhiem huu han\b/g,

            /\bmot thanh vien\b/g,

            /\blimited liability company\b/g,

            /\bjoint stock company\b/g,

            /\bcong ty\b/g,

            /\bcty\b/g,

            /\btnhh\b/g,

            /\bmtv\b/g,

            /\bco phan\b/g,

            /\bdntn\b/g,

            /\bjsc\b/g,

            /\blimited\b/g,

            /\bltd\b/g

        ];


        patterns.forEach(
            pattern => {

                text =
                    text.replace(
                        pattern,
                        " "
                    );

            }
        );


        return text

            .replace(
                /\s+/g,
                " "
            )

            .trim();

    }


    // =====================================================
    // TÍNH ĐIỂM
    // =====================================================

    function calculateMatchScore(
        supplier,
        inputValue
    ) {

        const rawInput =
            normalizeText(
                inputValue
            );


        const input =
            normalizeSupplierName(
                inputValue
            );


        if (
            !input

            ||

            input.length <
            CONFIG.minimumLength
        ) {

            return 0;

        }


        const supplierName =
            getSupplierName(
                supplier
            );


        const rawName =
            normalizeText(
                supplierName
            );


        const name =
            normalizeSupplierName(
                supplierName
            );


        const code =
            normalizeText(
                getSupplierCode(
                    supplier
                )
            );


        const phone =
            normalizeText(
                getSupplierPhone(
                    supplier
                )
            );


        // =================================================
        // CODE / PHONE EXACT
        // =================================================

        if (
            rawInput

            &&

            (
                rawInput === code

                ||

                rawInput === phone
            )
        ) {

            return 1000;

        }


        // =================================================
        // TÊN PHÁP LÝ EXACT
        // =================================================

        if (
            rawInput ===
            rawName
        ) {

            return 950;

        }


        // =================================================
        // SAU KHI BỎ CTY / TNHH EXACT
        // =================================================

        if (
            input ===
            name
        ) {

            return 900;

        }


        // =================================================
        // Ví dụ:
        //
        // name:
        // nang ha huy hung
        //
        // input:
        // huy hung
        // =================================================

        if (
            name.endsWith(
                input
            )
        ) {

            return 750;

        }


        // =================================================
        // Tên có chứa input
        // =================================================

        if (
            name.includes(
                input
            )
        ) {

            return 700;

        }


        // =================================================
        // Input dài hơn tên DB
        // =================================================

        if (
            input.includes(
                name
            )

            &&

            name.length >= 3
        ) {

            return 650;

        }


        // =================================================
        // So token
        //
        // "huy hung"
        // phải tồn tại trong
        // "nang ha huy hung"
        // =================================================

        const inputTokens =
            input
                .split(" ")
                .filter(
                    token =>
                        token.length >= 2
                );


        const nameTokens =
            new Set(

                name
                    .split(" ")
                    .filter(Boolean)

            );


        if (
            inputTokens.length >= 2

            &&

            inputTokens.every(
                token =>
                    nameTokens.has(
                        token
                    )
            )
        ) {

            return 600;

        }


        return 0;

    }


    // =====================================================
    // TÌM MATCH
    // =====================================================

    function findSupplierMatches(
        inputValue
    ) {

        return getSuppliers()

            .map(
                supplier => ({

                    supplier,

                    score:
                        calculateMatchScore(

                            supplier,

                            inputValue

                        )

                })
            )

            .filter(
                item =>
                    item.score > 0
            )

            .sort(
                (a, b) => {

                    if (
                        b.score !==
                        a.score
                    ) {

                        return (
                            b.score
                            -
                            a.score
                        );

                    }


                    return getSupplierName(
                        a.supplier
                    )
                        .localeCompare(

                            getSupplierName(
                                b.supplier
                            ),

                            "vi",

                            {
                                sensitivity:
                                    "base"
                            }

                        );

                }
            );

    }


    // =====================================================
    // RESOLVE
    // =====================================================

    function resolveSupplier(
        inputValue
    ) {

        const value =
            String(
                inputValue || ""
            ).trim();


        if (!value) {

            return {

                status:
                    "empty",

                supplier:
                    null,

                matches:
                    []

            };

        }


        const matches =
            findSupplierMatches(
                value
            );


        if (
            matches.length === 0
        ) {

            return {

                status:
                    "not-found",

                supplier:
                    null,

                matches:
                    []

            };

        }


        // =================================================
        // Chỉ có 1 NCC phù hợp
        // =================================================

        if (
            matches.length === 1
        ) {

            return {

                status:
                    "matched",

                supplier:
                    matches[0]
                        .supplier,

                score:
                    matches[0]
                        .score,

                matches

            };

        }


        const first =
            matches[0];


        const second =
            matches[1];


        // =================================================
        // Exact rất mạnh:
        // có thể tự chọn nếu vượt kết quả thứ 2.
        // =================================================

        if (
            first.score >= 900

            &&

            first.score >
            second.score
        ) {

            return {

                status:
                    "matched",

                supplier:
                    first.supplier,

                score:
                    first.score,

                matches

            };

        }


        // =================================================
        // Nhiều partial match:
        // không đoán.
        // =================================================

        return {

            status:
                "ambiguous",

            supplier:
                null,

            matches

        };

    }


    // =====================================================
    // UPDATE HINT
    // =====================================================

    function updateHint(
        message,
        type = ""
    ) {

        const hint =
            document.getElementById(
                "dossierSupplierSearchHint"
            );


        if (!hint) {

            return;

        }


        hint.textContent =
            message;


        hint.classList.remove(
            "is-valid",
            "is-invalid"
        );


        if (
            type === "valid"
        ) {

            hint.classList.add(
                "is-valid"
            );

        }


        if (
            type === "invalid"
        ) {

            hint.classList.add(
                "is-invalid"
            );

        }

    }


    // =====================================================
    // ÁP DỤNG MATCH
    // =====================================================

    function applySmartSupplierMatch(
        options = {}
    ) {

        if (!CONFIG.enabled) {

            return {

                status:
                    "disabled"
            };

        }


        const input =
            document.getElementById(
                "dossierSupplierSearch"
            );


        if (!input) {

            return {

                status:
                    "no-input"
            };

        }


        const inputValue =
            String(
                input.value || ""
            ).trim();


        if (!inputValue) {

            return {

                status:
                    "empty"
            };

        }


        const result =
            resolveSupplier(
                inputValue
            );


        // =================================================
        // MATCH THÀNH CÔNG
        // =================================================

        if (
            result.status ===
            "matched"

            &&

            result.supplier
        ) {

            const supplierId =
                getSupplierId(
                    result.supplier
                );


            if (
                !supplierId
            ) {

                return {

                    status:
                        "invalid-id"
                };

            }


            if (
                typeof window
                    .selectDossierSupplier ===
                "function"
            ) {

                window.selectDossierSupplier(
                    supplierId
                );


                updateHint(

                    `Đã tự nhận diện: ${getSupplierName(
                        result.supplier
                    )}`,

                    "valid"

                );


                input.setAttribute(
                    "aria-invalid",
                    "false"
                );


                return {

                    ...result,

                    supplierId

                };

            }


            console.warn(
                "Smart Supplier: không tìm thấy window.selectDossierSupplier()."
            );


            return {

                status:
                    "selector-unavailable"
            };

        }


        // =================================================
        // NHIỀU KẾT QUẢ
        // =================================================

        if (
            result.status ===
            "ambiguous"
        ) {

            updateHint(

                `Có ${result.matches.length} nhà cung cấp phù hợp. Hãy chọn đúng NCC trong danh sách.`,

                "invalid"

            );


            if (
                options.openDropdown

                &&

                typeof window
                    .searchDossierSuppliers ===
                "function"
            ) {

                window.searchDossierSuppliers(
                    inputValue
                );

            }


            return result;

        }


        // =================================================
        // KHÔNG TÌM THẤY
        // =================================================

        if (
            result.status ===
            "not-found"

            &&

            options.showNotFound
        ) {

            updateHint(
                "Không tìm thấy nhà cung cấp phù hợp.",
                "invalid"
            );

        }


        return result;

    }


    // =====================================================
    // BLUR
    //
    // Gõ HUY HÙNG rồi chuyển sang trường khác
    // => tự nhận diện.
    // =====================================================

    document.addEventListener(

        "focusout",

        function (
            event
        ) {

            if (
                event.target?.id !==
                "dossierSupplierSearch"
            ) {

                return;

            }


            window.setTimeout(
                () => {

                    applySmartSupplierMatch({

                        openDropdown:
                            false,

                        showNotFound:
                            false

                    });

                },
                80
            );

        }

    );


    // =====================================================
    // ENTER
    // =====================================================

    document.addEventListener(

        "keydown",

        function (
            event
        ) {

            if (
                event.target?.id !==
                "dossierSupplierSearch"

                ||

                event.key !==
                "Enter"
            ) {

                return;

            }


            const result =
                applySmartSupplierMatch({

                    openDropdown:
                        true,

                    showNotFound:
                        true

                });


            if (
                result.status ===
                "matched"
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();

            }

        },
        true
    );


    // =====================================================
    // QUAN TRỌNG NHẤT:
    // BẮT CLICK NÚT LƯU TRƯỚC saveDossier()
    //
    // Event capture chạy trước onclick của button.
    //
    // Nếu user đang gõ:
    //
    // HUY HÙNG
    //
    // thì trước khi saveDossier() chạy:
    //
    // HUY HÙNG
    // →
    // CTY TNHH NÂNG HẠ HUY HÙNG
    // →
    // supplierId được chọn.
    // =====================================================

    document.addEventListener(

        "click",

        function (
            event
        ) {

            const button =
                event.target
                    ?.closest?.(
                        "#dossierSaveButton"
                    );


            if (!button) {

                return;

            }


            applySmartSupplierMatch({

                openDropdown:
                    true,

                showNotFound:
                    true

            });

        },
        true
    );


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.supplierSmartMatch = {

        normalize:
            normalizeSupplierName,

        find:
            findSupplierMatches,

        resolve:
            resolveSupplier,

        apply:
            applySmartSupplierMatch,

        enable() {

            CONFIG.enabled =
                true;

        },

        disable() {

            CONFIG.enabled =
                false;

        }

    };


    console.log(
        "🧩 Supplier Smart Match V1 đã sẵn sàng."
    );


})();
