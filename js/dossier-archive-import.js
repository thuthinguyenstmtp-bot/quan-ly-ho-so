;(() => {

    "use strict";


    // =====================================================
    // DOSSIER-ARCHIVE-IMPORT.JS
    // Import CSV + tải file mẫu cho Trang Lưu hồ sơ
    // =====================================================

    const ARCHIVE_CLASS_NAME =
        "ArchiveDossier";


    let archiveImportRunning =
        false;


    // =====================================================
    // THÔNG BÁO
    // =====================================================

    function showArchiveImportNotice(
        message,
        type = "info"
    ) {

        if (
            typeof window.showArchiveNotice ===
            "function"
        ) {

            window.showArchiveNotice(
                message,
                type
            );


            return;

        }


        window.alert(
            message
        );

    }


    // =====================================================
    // CHUẨN HÓA TEXT
    // =====================================================

    function normalizeArchiveImportText(
        value
    ) {

        return String(
            value ?? ""
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


    /*
    Chuẩn hóa mã.

    Ví dụ:

    LUU-HD-001
    luu-hd-001

    được coi là giống nhau.
    */

    function normalizeArchiveImportCode(
        value
    ) {

        return normalizeArchiveImportText(
            value
        );

    }


    // =====================================================
    // CHUẨN HÓA TÊN CÔNG TY
    // =====================================================

    function normalizeArchiveCompanyName(
        value
    ) {

        let text =
            normalizeArchiveImportText(
                value
            );


        const companyWords = [

            "cong ty trach nhiem huu han mot thanh vien",

            "cong ty trach nhiem huu han",

            "cong ty co phan",

            "trach nhiem huu han mot thanh vien",

            "trach nhiem huu han",

            "doanh nghiep tu nhan",

            "cong ty",

            "cty",

            "tnhh",

            "co phan",

            "cp",

            "mot thanh vien",

            "mtv",

            "dntn",

            "jsc",

            "ltd"

        ];


        companyWords
            .sort(
                (a, b) =>
                    b.length - a.length
            )
            .forEach(
                word => {

                    const escapedWord =
                        word.replace(

                            /[.*+?^${}()|[\]\\]/g,

                            "\\$&"

                        );


                    text =
                        text.replace(

                            new RegExp(
                                `\\b${escapedWord}\\b`,
                                "g"
                            ),

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
    // LẤY ID ENTITY
    // =====================================================

    function getArchiveImportEntityId(
        item
    ) {

        if (!item) {

            return "";

        }


        return String(

            item.id

            ||

            item.back4appId

            ||

            item.objectId

            ||

            item.legacyId

            ||

            ""

        ).trim();

    }


    // =====================================================
    // LẤY DANH SÁCH DỰ ÁN
    // =====================================================

    function getArchiveImportProjects() {

        if (
            typeof window.getProjectsData ===
            "function"
        ) {

            const data =
                window.getProjectsData();


            return Array.isArray(data)

                ? data

                : [];

        }


        return [];

    }


    // =====================================================
    // LẤY DANH SÁCH NCC
    // =====================================================

    function getArchiveImportSuppliers() {

        if (
            typeof window.getSuppliersData ===
            "function"
        ) {

            const data =
                window.getSuppliersData();


            return Array.isArray(data)

                ? data

                : [];

        }


        return [];

    }


    // =====================================================
    // LẤY DANH SÁCH HỒ SƠ
    // =====================================================

    function getArchiveImportDossiers() {

        if (
            typeof window.getDossiersData ===
            "function"
        ) {

            const data =
                window.getDossiersData();


            return Array.isArray(data)

                ? data

                : [];

        }


        return [];

    }


    // =====================================================
    // LẤY DANH SÁCH HỒ SƠ LƯU
    // =====================================================

    function getArchiveImportExistingArchives() {

        if (
            typeof window.getArchiveDossiersData ===
            "function"
        ) {

            const data =
                window.getArchiveDossiersData();


            return Array.isArray(data)

                ? data

                : [];

        }


        return [];

    }


    // =====================================================
    // TÊN DỰ ÁN
    // =====================================================

    function getArchiveImportProjectName(
        project
    ) {

        if (!project) {

            return "";

        }


        return String(

            project.ten

            ||

            project.name

            ||

            project.projectName

            ||

            ""

        ).trim();

    }


    // =====================================================
    // TÊN NCC
    // =====================================================

    function getArchiveImportSupplierName(
        supplier
    ) {

        if (!supplier) {

            return "";

        }


        return String(

            supplier.ten

            ||

            supplier.name

            ||

            supplier.supplierName

            ||

            ""

        ).trim();

    }


    // =====================================================
    // TÌM HỒ SƠ LIÊN KẾT THEO MÃ HS
    // =====================================================

    function findArchiveImportDossier(
        dossierCode
    ) {

        const targetCode =
            normalizeArchiveImportCode(
                dossierCode
            );


        if (!targetCode) {

            return {

                item:
                    null,

                error:
                    ""

            };

        }


        const matches =
            getArchiveImportDossiers()
                .filter(
                    dossier =>

                        normalizeArchiveImportCode(
                            dossier.code
                        )

                        ===

                        targetCode
                );


        if (
            matches.length ===
            0
        ) {

            return {

                item:
                    null,

                error:
                    `Không tìm thấy mã HS "${dossierCode}"`

            };

        }


        if (
            matches.length >
            1
        ) {

            return {

                item:
                    null,

                error:
                    `Có nhiều hồ sơ cùng mã "${dossierCode}"`

            };

        }


        return {

            item:
                matches[0],

            error:
                ""

        };

    }


    // =====================================================
    // TÌM DỰ ÁN THEO TÊN
    // =====================================================

    function findArchiveImportProject(
        projectName
    ) {

        const targetName =
            normalizeArchiveImportText(
                projectName
            );


        if (!targetName) {

            return {

                item:
                    null,

                error:
                    ""

            };

        }


        const projects =
            getArchiveImportProjects();


        /*
        BƯỚC 1:
        Tìm chính xác.
        */

        const exactMatches =
            projects.filter(
                project =>

                    normalizeArchiveImportText(

                        getArchiveImportProjectName(
                            project
                        )

                    )

                    ===

                    targetName
            );


        if (
            exactMatches.length ===
            1
        ) {

            return {

                item:
                    exactMatches[0],

                error:
                    ""

            };

        }


        if (
            exactMatches.length >
            1
        ) {

            return {

                item:
                    null,

                error:
                    `Có nhiều dự án trùng tên "${projectName}"`

            };

        }


        /*
        BƯỚC 2:
        Tìm theo một phần tên.

        Chỉ dùng khi chuỗi đủ dài,
        tránh match quá rộng.
        */

        if (
            targetName.length <
            5
        ) {

            return {

                item:
                    null,

                error:
                    `Không tìm thấy dự án "${projectName}"`

            };

        }


        const partialMatches =
            projects.filter(
                project => {

                    const currentName =
                        normalizeArchiveImportText(

                            getArchiveImportProjectName(
                                project
                            )

                        );


                    return (

                        currentName.includes(
                            targetName
                        )

                        ||

                        targetName.includes(
                            currentName
                        )

                    );

                }
            );


        if (
            partialMatches.length ===
            1
        ) {

            return {

                item:
                    partialMatches[0],

                error:
                    ""

            };

        }


        if (
            partialMatches.length >
            1
        ) {

            return {

                item:
                    null,

                error:
                    `Tên dự án "${projectName}" khớp nhiều kết quả`

            };

        }


        return {

            item:
                null,

            error:
                `Không tìm thấy dự án "${projectName}"`

        };

    }


    // =====================================================
    // TÌM NCC THEO TÊN
    // =====================================================

    function findArchiveImportSupplier(
        supplierName
    ) {

        const fullTarget =
            normalizeArchiveImportText(
                supplierName
            );


        const coreTarget =
            normalizeArchiveCompanyName(
                supplierName
            );


        if (!fullTarget) {

            return {

                item:
                    null,

                error:
                    ""

            };

        }


        const suppliers =
            getArchiveImportSuppliers();


        // =================================================
        // 1. TÊN CHÍNH XÁC
        // =================================================

        const exactFull =
            suppliers.filter(
                supplier =>

                    normalizeArchiveImportText(

                        getArchiveImportSupplierName(
                            supplier
                        )

                    )

                    ===

                    fullTarget
            );


        if (
            exactFull.length ===
            1
        ) {

            return {

                item:
                    exactFull[0],

                error:
                    ""

            };

        }


        if (
            exactFull.length >
            1
        ) {

            return {

                item:
                    null,

                error:
                    `Có nhiều NCC trùng tên "${supplierName}"`

            };

        }


        // =================================================
        // 2. BỎ CÔNG TY / TNHH / CP...
        // =================================================

        const exactCore =
            suppliers.filter(
                supplier =>

                    normalizeArchiveCompanyName(

                        getArchiveImportSupplierName(
                            supplier
                        )

                    )

                    ===

                    coreTarget
            );


        if (
            exactCore.length ===
            1
        ) {

            return {

                item:
                    exactCore[0],

                error:
                    ""

            };

        }


        if (
            exactCore.length >
            1
        ) {

            return {

                item:
                    null,

                error:
                    `Tên NCC "${supplierName}" khớp nhiều nhà cung cấp`

            };

        }


        // =================================================
        // 3. TÌM MỘT PHẦN
        // =================================================

        if (
            !coreTarget

            ||

            coreTarget.length <
            6
        ) {

            return {

                item:
                    null,

                error:
                    `Không tìm thấy NCC "${supplierName}"`

            };

        }


        const partialMatches =
            suppliers.filter(
                supplier => {

                    const currentCore =
                        normalizeArchiveCompanyName(

                            getArchiveImportSupplierName(
                                supplier
                            )

                        );


                    return (

                        currentCore.includes(
                            coreTarget
                        )

                        ||

                        coreTarget.includes(
                            currentCore
                        )

                    );

                }
            );


        if (
            partialMatches.length ===
            1
        ) {

            return {

                item:
                    partialMatches[0],

                error:
                    ""

            };

        }


        if (
            partialMatches.length >
            1
        ) {

            const names =
                partialMatches
                    .slice(
                        0,
                        4
                    )
                    .map(
                        supplier =>

                            getArchiveImportSupplierName(
                                supplier
                            )
                    )
                    .join(
                        " | "
                    );


            return {

                item:
                    null,

                error:
                    `NCC "${supplierName}" khớp nhiều kết quả: ${names}`

            };

        }


        return {

            item:
                null,

            error:
                `Không tìm thấy NCC "${supplierName}"`

        };

    }


    // =====================================================
    // CHUẨN HÓA LOẠI HỒ SƠ
    // =====================================================

    function normalizeArchiveImportType(
        value
    ) {

        const target =
            normalizeArchiveImportText(
                value
            );


        const types = {

            "hop dong":
                "Hợp đồng",

            "phu luc hop dong":
                "Phụ lục hợp đồng",

            "bien ban":
                "Biên bản",

            "hoa don":
                "Hóa đơn",

            "ho so phap ly":
                "Hồ sơ pháp lý",

            "khac":
                "Khác"

        };


        return types[target]

            ||

            "";

    }


    // =====================================================
    // CHUẨN HÓA NGÀY
    // =====================================================

    function normalizeArchiveImportDate(
        value
    ) {

        const rawValue =
            String(
                value ?? ""
            ).trim();


        if (!rawValue) {

            return "";

        }


        /*
        yyyy-mm-dd
        */

        let match =
            rawValue.match(

                /^(\d{4})-(\d{1,2})-(\d{1,2})$/

            );


        if (match) {

            const year =
                Number(
                    match[1]
                );


            const month =
                Number(
                    match[2]
                );


            const day =
                Number(
                    match[3]
                );


            if (
                isValidArchiveImportDate(
                    year,
                    month,
                    day
                )
            ) {

                return [

                    String(year)
                        .padStart(
                            4,
                            "0"
                        ),

                    String(month)
                        .padStart(
                            2,
                            "0"
                        ),

                    String(day)
                        .padStart(
                            2,
                            "0"
                        )

                ].join("-");

            }

        }


        /*
        dd/mm/yyyy
        */

        match =
            rawValue.match(

                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

            );


        if (match) {

            const day =
                Number(
                    match[1]
                );


            const month =
                Number(
                    match[2]
                );


            const year =
                Number(
                    match[3]
                );


            if (
                isValidArchiveImportDate(
                    year,
                    month,
                    day
                )
            ) {

                return [

                    String(year)
                        .padStart(
                            4,
                            "0"
                        ),

                    String(month)
                        .padStart(
                            2,
                            "0"
                        ),

                    String(day)
                        .padStart(
                            2,
                            "0"
                        )

                ].join("-");

            }

        }


        return "";

    }


    function isValidArchiveImportDate(
        year,
        month,
        day
    ) {

        const date =
            new Date(

                year,

                month - 1,

                day

            );


        return (

            date.getFullYear() ===
            year

            &&

            date.getMonth() ===
            month - 1

            &&

            date.getDate() ===
            day

        );

    }


    // =====================================================
    // CSV - PHÁT HIỆN DẤU PHÂN CÁCH
    // =====================================================

    function detectArchiveCsvDelimiter(
        text
    ) {

        const firstLine =
            String(text)
                .split(
                    /\r?\n/
                )
                .find(
                    line =>
                        line.trim()
                )

            ||

            "";


        const delimiters = [

            ";",

            ",",

            "\t"

        ];


        let bestDelimiter =
            ";";


        let bestCount =
            -1;


        delimiters.forEach(
            delimiter => {

                let count =
                    0;


                let insideQuotes =
                    false;


                for (
                    let index = 0;

                    index <
                    firstLine.length;

                    index += 1
                ) {

                    const character =
                        firstLine[index];


                    if (
                        character ===
                        '"'
                    ) {

                        if (
                            insideQuotes

                            &&

                            firstLine[
                                index + 1
                            ] ===
                            '"'
                        ) {

                            index +=
                                1;

                        } else {

                            insideQuotes =
                                !insideQuotes;

                        }


                        continue;

                    }


                    if (
                        !insideQuotes

                        &&

                        character ===
                        delimiter
                    ) {

                        count +=
                            1;

                    }

                }


                if (
                    count >
                    bestCount
                ) {

                    bestCount =
                        count;


                    bestDelimiter =
                        delimiter;

                }

            }
        );


        return bestDelimiter;

    }


    // =====================================================
    // PARSE CSV
    // =====================================================

    function parseArchiveCsv(
        text
    ) {

        const source =
            String(
                text || ""
            )
                .replace(
                    /^\uFEFF/,
                    ""
                );


        const delimiter =
            detectArchiveCsvDelimiter(
                source
            );


        const rows =
            [];


        let row =
            [];


        let cell =
            "";


        let insideQuotes =
            false;


        for (
            let index = 0;

            index <
            source.length;

            index += 1
        ) {

            const character =
                source[index];


            // =============================================
            // NGOẶC KÉP
            // =============================================

            if (
                character ===
                '"'
            ) {

                if (
                    insideQuotes

                    &&

                    source[
                        index + 1
                    ] ===
                    '"'
                ) {

                    cell +=
                        '"';


                    index +=
                        1;

                } else {

                    insideQuotes =
                        !insideQuotes;

                }


                continue;

            }


            // =============================================
            // DẤU PHÂN CÁCH
            // =============================================

            if (
                !insideQuotes

                &&

                character ===
                delimiter
            ) {

                row.push(
                    cell
                );


                cell =
                    "";


                continue;

            }


            // =============================================
            // XUỐNG DÒNG
            // =============================================

            if (
                !insideQuotes

                &&

                (
                    character ===
                    "\n"

                    ||

                    character ===
                    "\r"
                )
            ) {

                if (
                    character ===
                    "\r"

                    &&

                    source[
                        index + 1
                    ] ===
                    "\n"
                ) {

                    index +=
                        1;

                }


                row.push(
                    cell
                );


                if (
                    row.some(
                        value =>
                            String(value)
                                .trim()
                    )
                ) {

                    rows.push(
                        row
                    );

                }


                row =
                    [];


                cell =
                    "";


                continue;

            }


            cell +=
                character;

        }


        if (insideQuotes) {

            throw new Error(
                "File CSV có dấu ngoặc kép chưa được đóng."
            );

        }


        row.push(
            cell
        );


        if (
            row.some(
                value =>
                    String(value)
                        .trim()
            )
        ) {

            rows.push(
                row
            );

        }


        return rows;

    }


    // =====================================================
    // TÌM INDEX CỘT
    // =====================================================

    function buildArchiveImportHeaderMap(
        headerRow
    ) {

        const normalizedHeaders =
            headerRow.map(
                normalizeArchiveImportText
            );


        function findHeader(
            aliases
        ) {

            return normalizedHeaders
                .findIndex(
                    header =>

                        aliases.includes(
                            header
                        )
                );

        }


        return {

            type:
                findHeader([

                    "loai ho so",

                    "loai hs",

                    "type"

                ]),


            code:
                findHeader([

                    "so ma luu",

                    "so / ma luu",

                    "ma luu",

                    "so ma ho so",

                    "code"

                ]),


            linkedCode:
                findHeader([

                    "ma hs lien ket",

                    "ma ho so lien ket",

                    "ma hs"

                ]),


            name:
                findHeader([

                    "ten tai lieu",

                    "ten tai lieu noi dung",

                    "noi dung",

                    "name"

                ]),


            project:
                findHeader([

                    "ten du an",

                    "du an",

                    "project"

                ]),


            supplier:
                findHeader([

                    "ten nha cung cap",

                    "nha cung cap",

                    "ten ncc",

                    "ncc",

                    "supplier"

                ]),


            date:
                findHeader([

                    "ngay luu",

                    "archive date"

                ]),


            location:
                findHeader([

                    "vi tri luu",

                    "vi tri",

                    "location"

                ]),


            quantity:
                findHeader([

                    "so luong",

                    "sl",

                    "quantity"

                ]),


            note:
                findHeader([

                    "ghi chu",

                    "note"

                ])

        };

    }


    // =====================================================
    // ĐỌC CELL
    // =====================================================

    function getArchiveImportCell(
        row,
        columnIndex
    ) {

        if (
            columnIndex ===
            undefined

            ||

            columnIndex <
            0
        ) {

            return "";

        }


        return String(

            row[
                columnIndex
            ]

            ??

            ""

        ).trim();

    }


    // =====================================================
    // KIỂM TRA FILE IMPORT
    // =====================================================

    function validateArchiveImportRows(
        rows
    ) {

        if (
            !Array.isArray(rows)

            ||

            rows.length <
            2
        ) {

            throw new Error(
                "File CSV không có dữ liệu để nhập."
            );

        }


        const headerMap =
            buildArchiveImportHeaderMap(
                rows[0]
            );


        // =============================================
        // 4 CỘT BẮT BUỘC
        // =============================================

        if (
            headerMap.type <
            0

            ||

            headerMap.code <
            0

            ||

            headerMap.name <
            0

            ||

            headerMap.date <
            0
        ) {

            throw new Error(

                "File mẫu phải có tối thiểu các cột: "

                +

                "Loại hồ sơ, Số / Mã lưu, "

                +

                "Tên tài liệu và Ngày lưu."

            );

        }


        // =============================================
        // MÃ ĐÃ CÓ TRÊN HỆ THỐNG
        // =============================================

        const existingCodes =
            new Set(

                getArchiveImportExistingArchives()
                    .map(
                        item =>

                            normalizeArchiveImportCode(
                                item.code
                            )
                    )
                    .filter(Boolean)

            );


        const codesInsideFile =
            new Set();


        const validRows =
            [];


        const duplicateRows =
            [];


        const invalidRows =
            [];


        rows
            .slice(1)
            .forEach(
                (
                    row,
                    index
                ) => {

                    const rowNumber =
                        index + 2;


                    const rawType =
                        getArchiveImportCell(
                            row,
                            headerMap.type
                        );


                    const code =
                        getArchiveImportCell(
                            row,
                            headerMap.code
                        );


                    const linkedCode =
                        getArchiveImportCell(
                            row,
                            headerMap.linkedCode
                        );


                    const name =
                        getArchiveImportCell(
                            row,
                            headerMap.name
                        );


                    const projectName =
                        getArchiveImportCell(
                            row,
                            headerMap.project
                        );


                    const supplierName =
                        getArchiveImportCell(
                            row,
                            headerMap.supplier
                        );


                    const rawDate =
                        getArchiveImportCell(
                            row,
                            headerMap.date
                        );


                    const location =
                        getArchiveImportCell(
                            row,
                            headerMap.location
                        );


                    const rawQuantity =
                        getArchiveImportCell(
                            row,
                            headerMap.quantity
                        );


                    const note =
                        getArchiveImportCell(
                            row,
                            headerMap.note
                        );


                    const errors =
                        [];


                    // =====================================
                    // LOẠI HS
                    // =====================================

                    const type =
                        normalizeArchiveImportType(
                            rawType
                        );


                    if (!rawType) {

                        errors.push(
                            "Thiếu Loại hồ sơ"
                        );

                    } else if (!type) {

                        errors.push(
                            `Loại hồ sơ "${rawType}" không hợp lệ`
                        );

                    }


                    // =====================================
                    // MÃ
                    // =====================================

                    if (!code) {

                        errors.push(
                            "Thiếu Số / Mã lưu"
                        );

                    }


                    // =====================================
                    // TÊN
                    // =====================================

                    if (!name) {

                        errors.push(
                            "Thiếu Tên tài liệu"
                        );

                    }


                    // =====================================
                    // NGÀY
                    // =====================================

                    const archiveDate =
                        normalizeArchiveImportDate(
                            rawDate
                        );


                    if (!rawDate) {

                        errors.push(
                            "Thiếu Ngày lưu"
                        );

                    } else if (
                        !archiveDate
                    ) {

                        errors.push(
                            `Ngày lưu "${rawDate}" không hợp lệ`
                        );

                    }


                    // =====================================
                    // SỐ LƯỢNG
                    // =====================================

                    const quantity =
                        rawQuantity

                            ? Number(
                                rawQuantity
                            )

                            : 1;


                    if (
                        !Number.isFinite(
                            quantity
                        )

                        ||

                        quantity <
                        1
                    ) {

                        errors.push(
                            "Số lượng phải lớn hơn 0"
                        );

                    }


                    // =====================================
                    // TRÙNG TRONG FILE
                    // =====================================

                    const normalizedCode =
                        normalizeArchiveImportCode(
                            code
                        );


                    if (
                        normalizedCode

                        &&

                        codesInsideFile.has(
                            normalizedCode
                        )
                    ) {

                        errors.push(
                            "Mã lưu bị trùng trong file"
                        );

                    }


                    if (
                        normalizedCode
                    ) {

                        codesInsideFile.add(
                            normalizedCode
                        );

                    }


                    // =====================================
                    // TRÙNG DỮ LIỆU CŨ
                    // =====================================

                    if (
                        normalizedCode

                        &&

                        existingCodes.has(
                            normalizedCode
                        )
                    ) {

                        duplicateRows.push({

                            rowNumber,

                            code

                        });


                        return;

                    }


                    // =====================================
                    // LIÊN KẾT
                    // =====================================

                    let linkedDossierId =
                        "";


                    let projectId =
                        "";


                    let supplierId =
                        "";


                    // =====================================
                    // ƯU TIÊN MÃ HS LIÊN KẾT
                    // =====================================

                    if (linkedCode) {

                        const dossierResult =
                            findArchiveImportDossier(
                                linkedCode
                            );


                        if (
                            dossierResult.error
                        ) {

                            errors.push(
                                dossierResult.error
                            );

                        } else if (
                            dossierResult.item
                        ) {

                            const dossier =
                                dossierResult.item;


                            linkedDossierId =
                                getArchiveImportEntityId(
                                    dossier
                                );


                            projectId =
                                String(

                                    dossier.projectId

                                    ||

                                    ""

                                );


                            supplierId =
                                String(

                                    dossier.supplierId

                                    ||

                                    ""

                                );

                        }

                    }


                    // =====================================
                    // KHÔNG CÓ HS → TÌM PROJECT/NCC
                    // =====================================

                    if (
                        !linkedDossierId
                    ) {

                        if (
                            projectName
                        ) {

                            const projectResult =
                                findArchiveImportProject(
                                    projectName
                                );


                            if (
                                projectResult.error
                            ) {

                                errors.push(
                                    projectResult.error
                                );

                            } else if (
                                projectResult.item
                            ) {

                                projectId =
                                    getArchiveImportEntityId(

                                        projectResult.item

                                    );

                            }

                        }


                        if (
                            supplierName
                        ) {

                            const supplierResult =
                                findArchiveImportSupplier(
                                    supplierName
                                );


                            if (
                                supplierResult.error
                            ) {

                                errors.push(
                                    supplierResult.error
                                );

                            } else if (
                                supplierResult.item
                            ) {

                                supplierId =
                                    getArchiveImportEntityId(

                                        supplierResult.item

                                    );

                            }

                        }

                    }


                    // =====================================
                    // DÒNG LỖI
                    // =====================================

                    if (
                        errors.length >
                        0
                    ) {

                        invalidRows.push({

                            rowNumber,

                            code,

                            errors

                        });


                        return;

                    }


                    // =====================================
                    // DÒNG HỢP LỆ
                    // =====================================

                    validRows.push({

                        rowNumber,

                        type,

                        code,

                        linkedDossierId,

                        name,

                        projectId,

                        supplierId,

                        archiveDate,

                        location,

                        quantity:
                            Math.max(
                                1,
                                Math.round(
                                    quantity
                                )
                            ),

                        note

                    });

                }
            );


        return {

            validRows,

            duplicateRows,

            invalidRows

        };

    }


    // =====================================================
    // TẠO ARCHIVEDOSSIER
    // =====================================================

    function createArchiveImportObject(
        data
    ) {

        const archiveObject =
            new Parse.Object(
                ARCHIVE_CLASS_NAME
            );


        archiveObject.set(
            "type",
            data.type
        );


        archiveObject.set(
            "code",
            data.code
        );


        archiveObject.set(

            "codeNormalized",

            normalizeArchiveImportText(
                data.code
            )

        );


        archiveObject.set(
            "name",
            data.name
        );


        archiveObject.set(

            "linkedDossierId",

            data.linkedDossierId

            ||

            ""

        );


        archiveObject.set(

            "projectId",

            data.projectId

            ||

            ""

        );


        archiveObject.set(

            "supplierId",

            data.supplierId

            ||

            ""

        );


        archiveObject.set(
            "archiveDate",
            data.archiveDate
        );


        archiveObject.set(

            "location",

            data.location

            ||

            ""

        );


        archiveObject.set(

            "quantity",

            Number(
                data.quantity || 1
            )

        );


        archiveObject.set(

            "note",

            data.note

            ||

            ""

        );


        const currentUser =
            Parse.User.current();


        if (currentUser) {

            archiveObject.set(
                "createdBy",
                currentUser
            );


            archiveObject.set(
                "updatedBy",
                currentUser
            );

        }


        return archiveObject;

    }


    // =====================================================
    // LƯU CÁC DÒNG
    // =====================================================

    async function saveArchiveImportRows(
        validRows
    ) {

        let success =
            0;


        const failed =
            [];


        /*
        Lưu từng dòng để khi một dòng lỗi
        không làm cả file thất bại.
        */

        for (
            const data
            of validRows
        ) {

            try {

                const archiveObject =
                    createArchiveImportObject(
                        data
                    );


                await archiveObject.save();


                success +=
                    1;

            } catch (error) {

                console.error(

                    "Không import được dòng:",

                    data,

                    error

                );


                failed.push({

                    rowNumber:
                        data.rowNumber,

                    code:
                        data.code,

                    error:
                        error?.message

                        ||

                        "Không rõ lỗi"

                });

            }

        }


        return {

            success,

            failed

        };

    }


    // =====================================================
    // IMPORT FILE CSV
    // =====================================================

    async function importArchiveCsvFile(
        file
    ) {

        if (!file) {

            return;

        }


        if (
            archiveImportRunning
        ) {

            showArchiveImportNotice(

                "Một file khác đang được nhập.",

                "warning"

            );


            return;

        }


        // =================================================
        // KIỂM TRA EXTENSION
        // =================================================

        if (
            !String(
                file.name || ""
            )
                .toLowerCase()
                .endsWith(
                    ".csv"
                )
        ) {

            showArchiveImportNotice(

                "Vui lòng chọn file CSV.",

                "warning"

            );


            return;

        }


        // =================================================
        // KIỂM TRA PARSE
        // =================================================

        if (
            typeof Parse ===
            "undefined"
        ) {

            showArchiveImportNotice(

                "Parse SDK chưa được tải.",

                "error"

            );


            return;

        }


        if (
            window.BACK4APP_CONFIG_READY !==
            true
        ) {

            showArchiveImportNotice(

                "Back4App chưa được khởi tạo.",

                "error"

            );


            return;

        }


        if (
            !Parse.User.current()
        ) {

            showArchiveImportNotice(

                "Phiên đăng nhập không còn hiệu lực.",

                "error"

            );


            return;

        }


        archiveImportRunning =
            true;


        try {

            // =================================================
            // ĐẢM BẢO DỮ LIỆU MỚI
            // =================================================

            if (
                typeof window.fetchArchiveDossiersFromBack4App ===
                "function"
            ) {

                try {

                    await window
                        .fetchArchiveDossiersFromBack4App(
                            true
                        );

                } catch (error) {

                    console.warn(
                        "Không refresh được dữ liệu Archive trước import:",
                        error
                    );

                }

            }


            // =================================================
            // ĐỌC FILE
            // =================================================

            const text =
                await file.text();


            const rows =
                parseArchiveCsv(
                    text
                );


            const report =
                validateArchiveImportRows(
                    rows
                );


            // =================================================
            // KHÔNG CÓ DÒNG HỢP LỆ
            // =================================================

            if (
                report.validRows.length ===
                0
            ) {

                let message =

                    "Không có dòng hợp lệ để nhập.";


                if (
                    report.duplicateRows.length >
                    0
                ) {

                    message +=

                        `\n${report.duplicateRows.length} dòng có mã đã tồn tại.`;

                }


                if (
                    report.invalidRows.length >
                    0
                ) {

                    message +=

                        `\n${report.invalidRows.length} dòng có lỗi.`;

                }


                console.table(
                    report.invalidRows
                );


                showArchiveImportNotice(

                    message,

                    "warning"

                );


                return;

            }


            // =================================================
            // HIỂN THỊ TỔNG QUAN
            // =================================================

            let confirmationMessage =

                `File có ${report.validRows.length} dòng hợp lệ.`;


            if (
                report.duplicateRows.length >
                0
            ) {

                confirmationMessage +=

                    `\n${report.duplicateRows.length} dòng đã tồn tại và sẽ bỏ qua.`;

            }


            if (
                report.invalidRows.length >
                0
            ) {

                confirmationMessage +=

                    `\n${report.invalidRows.length} dòng lỗi và sẽ bỏ qua.`;

            }


            confirmationMessage +=

                "\n\nBạn có muốn tiếp tục nhập dữ liệu?";


            const confirmed =
                window.confirm(
                    confirmationMessage
                );


            if (!confirmed) {

                return;

            }


            showArchiveImportNotice(

                `Đang nhập ${report.validRows.length} hồ sơ lưu...`,

                "info"

            );


            // =================================================
            // LƯU BACK4APP
            // =================================================

            const saveResult =
                await saveArchiveImportRows(

                    report.validRows

                );


            // =================================================
            // REFRESH
            // =================================================

            if (
                typeof window.fetchArchiveDossiersFromBack4App ===
                "function"
            ) {

                await window
                    .fetchArchiveDossiersFromBack4App(
                        true
                    );

            }


            if (
                typeof window.loadArchiveOptions ===
                "function"
            ) {

                window.loadArchiveOptions();

            }


            if (
                typeof window.filterArchiveDossiers ===
                "function"
            ) {

                window.filterArchiveDossiers();

            }


            // =================================================
            // CONSOLE CHI TIẾT
            // =================================================

            if (
                report.invalidRows.length >
                0
            ) {

                console.group(
                    "Các dòng CSV không hợp lệ"
                );


                report.invalidRows
                    .forEach(
                        item => {

                            console.warn(

                                `Dòng ${item.rowNumber}: ${item.code || "(không mã)"}`,

                                item.errors

                            );

                        }
                    );


                console.groupEnd();

            }


            if (
                saveResult.failed.length >
                0
            ) {

                console.table(
                    saveResult.failed
                );

            }


            // =================================================
            // THÔNG BÁO KẾT QUẢ
            // =================================================

            let resultMessage =

                `Đã nhập thành công ${saveResult.success} hồ sơ lưu.`;


            if (
                report.duplicateRows.length >
                0
            ) {

                resultMessage +=

                    ` Bỏ qua ${report.duplicateRows.length} mã đã tồn tại.`;

            }


            if (
                report.invalidRows.length >
                0
            ) {

                resultMessage +=

                    ` Có ${report.invalidRows.length} dòng không hợp lệ.`;

            }


            if (
                saveResult.failed.length >
                0
            ) {

                resultMessage +=

                    ` ${saveResult.failed.length} dòng không lưu được lên Back4App.`;

            }


            showArchiveImportNotice(

                resultMessage,

                saveResult.success > 0

                    ? "success"

                    : "warning"

            );

        } catch (error) {

            console.error(

                "Import Hồ sơ lưu thất bại:",

                error

            );


            showArchiveImportNotice(

                error?.message

                ||

                "Không thể nhập file CSV.",

                "error"

            );

        } finally {

            archiveImportRunning =
                false;

        }

    }


    // =====================================================
    // FILE MẪU
    // =====================================================

    function escapeArchiveTemplateCsvCell(
        value
    ) {

        const text =
            String(
                value ?? ""
            );


        if (
            /[";\r\n]/.test(
                text
            )
        ) {

            return (

                '"'

                +

                text.replaceAll(
                    '"',
                    '""'
                )

                +

                '"'

            );

        }


        return text;

    }


    // =====================================================
    // TẢI FILE MẪU
    // =====================================================

    function downloadArchiveCsvTemplate() {

        try {

            const headers = [

                "Loại hồ sơ",

                "Số / Mã lưu",

                "Mã HS liên kết",

                "Tên tài liệu",

                "Tên dự án",

                "Tên nhà cung cấp",

                "Ngày lưu",

                "Vị trí lưu",

                "Số lượng",

                "Ghi chú"

            ];


            /*
            Dòng ví dụ 1:
            Có mã HS liên kết.

            Khi import thật, mã HS này phải
            tồn tại trong Danh sách hồ sơ.
            */

            const exampleRow1 = [

                "Hợp đồng",

                "LUU-HD-001",

                "HS001",

                "Hợp đồng cung cấp thiết bị",

                "",

                "",

                "2026-08-08",

                "Tủ A - Kệ 2 - Hộp 03",

                "1",

                "Bản gốc"

            ];


            /*
            Dòng ví dụ 2:
            Không có mã HS liên kết.
            Có thể nhập Dự án + NCC bằng tên.
            */

            const exampleRow2 = [

                "Biên bản",

                "LUU-BB-002",

                "",

                "Biên bản nghiệm thu",

                "TÊN DỰ ÁN MẪU",

                "CÔNG TY TNHH NHÀ CUNG CẤP MẪU",

                "08/08/2026",

                "Tủ B - Kệ 1",

                "1",

                "Ví dụ nhập theo tên Dự án và NCC"

            ];


            const delimiter =
                ";";


            const rows = [

                headers,

                exampleRow1,

                exampleRow2

            ];


            const csvContent =

                "\uFEFF"

                +

                rows
                    .map(
                        row =>

                            row
                                .map(
                                    escapeArchiveTemplateCsvCell
                                )
                                .join(
                                    delimiter
                                )
                    )
                    .join(
                        "\r\n"
                    );


            // =================================================
            // TẠO BLOB
            // =================================================

            const blob =
                new Blob(

                    [
                        csvContent
                    ],

                    {
                        type:
                            "text/csv;charset=utf-8;"
                    }

                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "mau-import-ho-so-luu.csv";


            link.style.display =
                "none";


            document.body.appendChild(
                link
            );


            link.click();


            // =================================================
            // DỌN URL SAU KHI DOWNLOAD
            // =================================================

            window.setTimeout(
                function () {

                    link.remove();


                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );


            showArchiveImportNotice(

                "Đã tải file mẫu Hồ sơ lưu.",

                "success"

            );

        } catch (error) {

            console.error(

                "Không tạo được file mẫu:",

                error

            );


            showArchiveImportNotice(

                error?.message

                ||

                "Không thể tạo file mẫu.",

                "error"

            );

        }

    }


    // =====================================================
    // EXPORT FUNCTIONS
    // =====================================================

    window.importArchiveCsvFile =
        importArchiveCsvFile;


    window.downloadArchiveCsvTemplate =
        downloadArchiveCsvTemplate;


})();
