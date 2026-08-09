;(() => {

    "use strict";


    // =====================================================
    // CẤU HÌNH
    // =====================================================

    const DOSSIER_IMPORT_CLASS_NAME =
        "Dossier";


    const DOSSIER_IMPORT_BATCH_SIZE =
        20;


    const DOSSIER_IMPORT_HEADERS = [

        "Mã hồ sơ",

        "Tên dự án",

        "Tên nhà cung cấp",

        "Nội dung",

        "Giá trị",

        "Hồ sơ cần bổ sung",

        "Tình trạng file",

        "Đã lập ĐNTT",

        "Ngày nhận",

        "Ngày bàn giao",

        "Trạng thái hồ sơ",

        "Trạng thái thanh toán",

        "Ghi chú"

    ];


    const DOSSIER_IMPORT_HEADER_ALIASES = {

        code: [

            "ma ho so",

            "ma hs",

            "code"

        ],


        projectName: [

            "ten du an",

            "du an",

            "project",

            "project name"

        ],


        supplierName: [

            "ten nha cung cap",

            "nha cung cap",

            "ten ncc",

            "ncc",

            "supplier",

            "supplier name"

        ],


        content: [

            "noi dung",

            "noi dung ho so",

            "content"

        ],


        value: [

            "gia tri",

            "gia tri hop dong",

            "value"

        ],


        documents: [

            "ho so can bo sung",

            "bo sung ho so",

            "bo sung hs",

            "documents"

        ],


        fileStatus: [

            "tinh trang file",

            "tinh trang file ho so",

            "file hs",

            "file status"

        ],


        paymentRequest: [

            "da lap dntt",

            "dntt",

            "de nghi thanh toan",

            "payment request"

        ],


        receiveDate: [

            "ngay nhan",

            "ngay nhan ho so",

            "receive date"

        ],


        deliveryDate: [

            "ngay ban giao",

            "delivery date"

        ],


        status: [

            "trang thai ho so",

            "trang thai hs",

            "status"

        ],


        paymentStatus: [

            "trang thai thanh toan",

            "thanh toan",

            "payment status"

        ],


        note: [

            "ghi chu",

            "note"

        ]

    };


    let dossierImportRunning =
        false;


    // =====================================================
    // THÔNG BÁO
    // =====================================================

    function showDossierImportNotice(
        message,
        type = "info"
    ) {

        if (
            typeof window.showAppToast ===
            "function"
        ) {

            window.showAppToast(
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
    // CHUẨN HÓA
    // =====================================================

    function normalizeImportText(
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


    function normalizeImportCode(
        value
    ) {

        return normalizeImportText(
            value
        )
            .replace(
                /\s+/g,
                ""
            );

    }


    function parseImportNumber(
        value
    ) {

        const rawValue =
            String(
                value ?? ""
            ).trim();


        if (!rawValue) {

            return {

                value:
                    0,

                valid:
                    true

            };

        }


        const cleanedValue =
            rawValue.replace(
                /[^\d-]/g,
                ""
            );


        const numberValue =
            Number(
                cleanedValue
            );


        const valid =
            Number.isFinite(
                numberValue
            )

            &&

            numberValue >= 0;


        return {

            value:
                valid
                    ? numberValue
                    : 0,

            valid

        };

    }


    function parseImportBoolean(
        value
    ) {

        const normalizedValue =
            normalizeImportText(
                value
            );


        return [

            "co",

            "true",

            "1",

            "yes",

            "x",

            "da lap"

        ].includes(
            normalizedValue
        );

    }


    function isValidImportDateParts(
        year,
        month,
        day
    ) {

        const date =
            new Date(

                Number(year),

                Number(month) - 1,

                Number(day)

            );


        return (

            date.getFullYear() ===
            Number(year)

            &&

            date.getMonth() ===
            Number(month) - 1

            &&

            date.getDate() ===
            Number(day)

        );

    }


    function normalizeImportDate(
        value
    ) {

        const rawValue =
            String(
                value ?? ""
            ).trim();


        if (!rawValue) {

            return {

                value:
                    "",

                valid:
                    true

            };

        }


        /*
        yyyy-mm-dd
        */

        const isoMatch =
            rawValue.match(

                /^(\d{4})-(\d{1,2})-(\d{1,2})$/

            );


        if (isoMatch) {

            const year =
                isoMatch[1];


            const month =
                isoMatch[2];


            const day =
                isoMatch[3];


            if (
                !isValidImportDateParts(
                    year,
                    month,
                    day
                )
            ) {

                return {

                    value:
                        "",

                    valid:
                        false

                };

            }


            return {

                value:
                    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,

                valid:
                    true

            };

        }


        /*
        dd/mm/yyyy
        */

        const vietnameseMatch =
            rawValue.match(

                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

            );


        if (vietnameseMatch) {

            const day =
                vietnameseMatch[1];


            const month =
                vietnameseMatch[2];


            const year =
                vietnameseMatch[3];


            if (
                !isValidImportDateParts(
                    year,
                    month,
                    day
                )
            ) {

                return {

                    value:
                        "",

                    valid:
                        false

                };

            }


            return {

                value:
                    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,

                valid:
                    true

            };

        }


        return {

            value:
                "",

            valid:
                false

        };

    }


    function normalizeFileStatus(
        value
    ) {

        const normalizedValue =
            normalizeImportText(
                value
            );


        if (!normalizedValue) {

            return {

                value:
                    "Chưa up",

                valid:
                    true

            };

        }


        const statusMap =
            new Map([

                [
                    "da up",
                    "Đã up"
                ],

                [
                    "da co file hs",
                    "Đã up"
                ],

                [
                    "chua up",
                    "Chưa up"
                ],

                [
                    "chua co file hs",
                    "Chưa up"
                ]

            ]);


        return {

            value:
                statusMap.get(
                    normalizedValue
                )
                ||
                "",

            valid:
                statusMap.has(
                    normalizedValue
                )

        };

    }


    function normalizeDossierStatus(
        value
    ) {

        const normalizedValue =
            normalizeImportText(
                value
            );


        if (!normalizedValue) {

            return {

                value:
                    "Chưa duyệt",

                valid:
                    true

            };

        }


        const statusMap =
            new Map([

                [
                    "chua duyet",
                    "Chưa duyệt"
                ],

                [
                    "da duyet",
                    "Đã duyệt"
                ]

            ]);


        return {

            value:
                statusMap.get(
                    normalizedValue
                )
                ||
                "",

            valid:
                statusMap.has(
                    normalizedValue
                )

        };

    }


    function normalizePaymentStatus(
        value
    ) {

        const normalizedValue =
            normalizeImportText(
                value
            );


        if (!normalizedValue) {

            return {

                value:
                    "Chưa thanh toán",

                valid:
                    true

            };

        }


        const statusMap =
            new Map([

                [
                    "chua thanh toan",
                    "Chưa thanh toán"
                ],

                [
                    "da xuat dntt",
                    "Đã xuất ĐNTT"
                ],

                [
                    "dang xu ly",
                    "Đang xử lý"
                ],

                [
                    "da thanh toan",
                    "Đã thanh toán"
                ]

            ]);


        return {

            value:
                statusMap.get(
                    normalizedValue
                )
                ||
                "",

            valid:
                statusMap.has(
                    normalizedValue
                )

        };

    }


    // =====================================================
    // DỮ LIỆU DỰ ÁN, NCC, HỒ SƠ
    // =====================================================

    function getImportProjects() {

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


        if (
            Array.isArray(
                window.projects
            )
        ) {

            return window.projects;

        }


        return [];

    }


    function getImportSuppliers() {

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


        if (
            Array.isArray(
                window.suppliers
            )
        ) {

            return window.suppliers;

        }


        return [];

    }


    function getImportDossiers() {

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


    function getImportEntityStableId(
        item
    ) {

        return String(

            item?.back4appId

            ||

            item?.objectId

            ||

            item?.id

            ||

            item?.legacyId

            ||

            ""

        ).trim();

    }


    function getImportProjectName(
        project
    ) {

        return String(

            project?.ten

            ||

            project?.name

            ||

            project?.projectName

            ||

            ""

        ).trim();

    }


    function getImportSupplierName(
        supplier
    ) {

        return String(

            supplier?.ten

            ||

            supplier?.name

            ||

            supplier?.supplierName

            ||

            ""

        ).trim();

    }


    function buildImportNameMap(
        items,
        getNameFunction
    ) {

        const map =
            new Map();


        items.forEach(item => {

            const stableId =
                getImportEntityStableId(
                    item
                );


            const normalizedName =
                normalizeImportText(

                    getNameFunction(
                        item
                    )

                );


            if (
                !stableId

                ||

                !normalizedName
            ) {

                return;

            }


            if (
                !map.has(
                    normalizedName
                )
            ) {

                map.set(
                    normalizedName,
                    []
                );

            }


            map.get(
                normalizedName
            ).push(
                item
            );

        });


        return map;

    }


    async function loadDossierImportReferenceData() {

        const tasks =
            [];


        if (
            typeof window.loadProjectSelect ===
            "function"
        ) {

            tasks.push(

                Promise.resolve(
                    window.loadProjectSelect()
                )

            );

        }


        if (
            typeof window.loadSupplierSelect ===
            "function"
        ) {

            tasks.push(

                Promise.resolve(
                    window.loadSupplierSelect()
                )

            );

        }


        if (
            typeof window.fetchDossiersFromBack4App ===
            "function"
        ) {

            tasks.push(

                Promise.resolve(

                    window.fetchDossiersFromBack4App(
                        true
                    )

                )

            );

        }


        if (tasks.length === 0) {

            return;

        }


        const results =
            await Promise.allSettled(
                tasks
            );


        results.forEach(result => {

            if (
                result.status ===
                "rejected"
            ) {

                console.warn(
                    "Không tải được một nguồn dữ liệu import:",
                    result.reason
                );

            }

        });

    }


    // =====================================================
    // ĐỌC FILE CSV
    // =====================================================

    function countDelimiterOutsideQuotes(
        line,
        delimiter
    ) {

        let count =
            0;


        let insideQuotes =
            false;


        for (
            let index = 0;

            index < line.length;

            index += 1
        ) {

            const character =
                line[index];


            if (
                character ===
                '"'
            ) {

                if (
                    insideQuotes

                    &&

                    line[index + 1] ===
                    '"'
                ) {

                    index +=
                        1;


                    continue;

                }


                insideQuotes =
                    !insideQuotes;


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


        return count;

    }


    function detectImportDelimiter(
        text
    ) {

        const firstLine =
            String(text)
                .split(
                    /\r?\n/
                )
                .find(line =>
                    line.trim()
                )

            ||

            "";


        const delimiters = [

            ",",

            ";",

            "\t"

        ];


        const bestResult =
            delimiters
                .map(delimiter => ({

                    delimiter,

                    count:
                        countDelimiterOutsideQuotes(
                            firstLine,
                            delimiter
                        )

                }))
                .sort(
                    (a, b) =>
                        b.count - a.count
                )[0];


        return bestResult?.delimiter
            ||
            ",";

    }


    function parseImportCsv(
        text
    ) {

        const sourceText =
            String(text)
                .replace(
                    /^\uFEFF/,
                    ""
                );


        const delimiter =
            detectImportDelimiter(
                sourceText
            );


        const rows =
            [];


        let currentRow =
            [];


        let currentCell =
            "";


        let insideQuotes =
            false;


        for (
            let index = 0;

            index < sourceText.length;

            index += 1
        ) {

            const character =
                sourceText[index];


            if (
                character ===
                '"'
            ) {

                if (
                    insideQuotes

                    &&

                    sourceText[index + 1] ===
                    '"'
                ) {

                    currentCell +=
                        '"';


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

                currentRow.push(
                    currentCell
                );


                currentCell =
                    "";


                continue;

            }


            if (
                !insideQuotes

                &&

                (
                    character === "\n"

                    ||

                    character === "\r"
                )
            ) {

                if (
                    character === "\r"

                    &&

                    sourceText[index + 1] ===
                    "\n"
                ) {

                    index +=
                        1;

                }


                currentRow.push(
                    currentCell
                );


                const hasData =
                    currentRow.some(cell =>
                        String(cell).trim()
                    );


                if (hasData) {

                    rows.push(
                        currentRow
                    );

                }


                currentRow =
                    [];


                currentCell =
                    "";


                continue;

            }


            currentCell +=
                character;

        }


        if (insideQuotes) {

            throw new Error(
                "File CSV có dấu ngoặc kép chưa được đóng đúng."
            );

        }


        currentRow.push(
            currentCell
        );


        if (
            currentRow.some(cell =>
                String(cell).trim()
            )
        ) {

            rows.push(
                currentRow
            );

        }


        return rows;

    }


    // =====================================================
    // NHẬN DIỆN CỘT
    // =====================================================

    function buildImportHeaderMap(
        headerRow
    ) {

        const normalizedHeaders =
            headerRow.map(
                normalizeImportText
            );


        const headerMap =
            {};


        Object.entries(
            DOSSIER_IMPORT_HEADER_ALIASES
        )
            .forEach(([
                fieldName,
                aliases
            ]) => {

                headerMap[fieldName] =
                    normalizedHeaders
                        .findIndex(header =>

                            aliases.includes(
                                header
                            )

                        );

            });


        return headerMap;

    }


    function getImportCell(
        row,
        index
    ) {

        if (
            index === undefined

            ||

            index === null

            ||

            index < 0
        ) {

            return "";

        }


        return String(
            row[index] ?? ""
        ).trim();

    }


    // =====================================================
    // KIỂM TRA DỮ LIỆU
    // =====================================================

    function validateDossierImportRows(
        rows
    ) {

        if (
            !Array.isArray(rows)

            ||

            rows.length < 2
        ) {

            throw new Error(
                "File không có dữ liệu để nhập."
            );

        }


        const headerMap =
            buildImportHeaderMap(
                rows[0]
            );


        const requiredHeaderFields = [

            "code",

            "projectName",

            "supplierName",

            "content"

        ];


        const missingHeaders =
            requiredHeaderFields.filter(
                field =>
                    headerMap[field] < 0
            );


        if (
            missingHeaders.length > 0
        ) {

            throw new Error(
                "File thiếu cột bắt buộc: Mã hồ sơ, Tên dự án, Tên nhà cung cấp hoặc Nội dung."
            );

        }


        const projects =
            getImportProjects();


        const suppliers =
            getImportSuppliers();


        const projectNameMap =
            buildImportNameMap(

                projects,

                getImportProjectName

            );


        const supplierNameMap =
            buildImportNameMap(

                suppliers,

                getImportSupplierName

            );


        const existingDossierCodes =
            new Set(

                getImportDossiers()
                    .map(dossier =>

                        normalizeImportCode(
                            dossier.code
                        )

                    )
                    .filter(Boolean)

            );


        const fileDossierCodes =
            new Set();


        const validRows =
            [];


        const duplicateRows =
            [];


        const invalidRows =
            [];


        rows.slice(1)
            .forEach((
                row,
                rowIndex
            ) => {

                const rowNumber =
                    rowIndex + 2;


                const code =
                    getImportCell(
                        row,
                        headerMap.code
                    );


                const projectName =
                    getImportCell(
                        row,
                        headerMap.projectName
                    );


                const supplierName =
                    getImportCell(
                        row,
                        headerMap.supplierName
                    );


                const content =
                    getImportCell(
                        row,
                        headerMap.content
                    );


                const normalizedCode =
                    normalizeImportCode(
                        code
                    );


                const normalizedProjectName =
                    normalizeImportText(
                        projectName
                    );


                const normalizedSupplierName =
                    normalizeImportText(
                        supplierName
                    );


                const errors =
                    [];


                if (!code) {

                    errors.push(
                        "Thiếu mã hồ sơ"
                    );

                }


                if (!projectName) {

                    errors.push(
                        "Thiếu tên dự án"
                    );

                }


                if (!supplierName) {

                    errors.push(
                        "Thiếu tên nhà cung cấp"
                    );

                }


                if (!content) {

                    errors.push(
                        "Thiếu nội dung"
                    );

                }


                if (
                    normalizedCode

                    &&

                    fileDossierCodes.has(
                        normalizedCode
                    )
                ) {

                    errors.push(
                        "Mã hồ sơ bị trùng trong file"
                    );

                }


                if (normalizedCode) {

                    fileDossierCodes.add(
                        normalizedCode
                    );

                }


                /*
                TÌM DỰ ÁN THEO TÊN
                */

                const matchedProjects =
                    projectNameMap.get(
                        normalizedProjectName
                    )

                    ||

                    [];


                let project =
                    null;


                if (
                    projectName

                    &&

                    matchedProjects.length === 0
                ) {

                    errors.push(

                        `Không tìm thấy dự án "${projectName}"`

                    );

                } else if (
                    matchedProjects.length > 1
                ) {

                    errors.push(

                        `Có nhiều dự án trùng tên "${projectName}"`

                    );

                } else if (
                    matchedProjects.length === 1
                ) {

                    project =
                        matchedProjects[0];

                }


                /*
                TÌM NCC THEO TÊN
                */

                const matchedSuppliers =
                    supplierNameMap.get(
                        normalizedSupplierName
                    )

                    ||

                    [];


                let supplier =
                    null;


                if (
                    supplierName

                    &&

                    matchedSuppliers.length === 0
                ) {

                    errors.push(

                        `Không tìm thấy nhà cung cấp "${supplierName}"`

                    );

                } else if (
                    matchedSuppliers.length > 1
                ) {

                    errors.push(

                        `Có nhiều nhà cung cấp trùng tên "${supplierName}"`

                    );

                } else if (
                    matchedSuppliers.length === 1
                ) {

                    supplier =
                        matchedSuppliers[0];

                }


                const valueResult =
                    parseImportNumber(

                        getImportCell(
                            row,
                            headerMap.value
                        )

                    );


                if (!valueResult.valid) {

                    errors.push(
                        "Giá trị hợp đồng không hợp lệ"
                    );

                }


                const receiveDateResult =
                    normalizeImportDate(

                        getImportCell(
                            row,
                            headerMap.receiveDate
                        )

                    );


                if (!receiveDateResult.valid) {

                    errors.push(
                        "Ngày nhận không hợp lệ"
                    );

                }


                const deliveryDateResult =
                    normalizeImportDate(

                        getImportCell(
                            row,
                            headerMap.deliveryDate
                        )

                    );


                if (!deliveryDateResult.valid) {

                    errors.push(
                        "Ngày bàn giao không hợp lệ"
                    );

                }


                const fileStatusResult =
                    normalizeFileStatus(

                        getImportCell(
                            row,
                            headerMap.fileStatus
                        )

                    );


                if (!fileStatusResult.valid) {

                    errors.push(
                        "Tình trạng file không hợp lệ"
                    );

                }


                const dossierStatusResult =
                    normalizeDossierStatus(

                        getImportCell(
                            row,
                            headerMap.status
                        )

                    );


                if (!dossierStatusResult.valid) {

                    errors.push(
                        "Trạng thái hồ sơ không hợp lệ"
                    );

                }


                const paymentStatusResult =
                    normalizePaymentStatus(

                        getImportCell(
                            row,
                            headerMap.paymentStatus
                        )

                    );


                if (!paymentStatusResult.valid) {

                    errors.push(
                        "Trạng thái thanh toán không hợp lệ"
                    );

                }


                if (
                    errors.length > 0
                ) {

                    invalidRows.push({

                        rowNumber,

                        code,

                        errors

                    });


                    return;

                }


                /*
                Hồ sơ đã tồn tại thì bỏ qua.
                */

                if (
                    normalizedCode

                    &&

                    existingDossierCodes.has(
                        normalizedCode
                    )
                ) {

                    duplicateRows.push({

                        rowNumber,

                        code,

                        reason:
                            "Mã hồ sơ đã tồn tại"

                    });


                    return;

                }


                validRows.push({

                    rowNumber,

                    code,

                    projectId:
                        getImportEntityStableId(
                            project
                        ),

                    supplierId:
                        getImportEntityStableId(
                            supplier
                        ),

                    content,

                    value:
                        valueResult.value,

                    documents:
                        getImportCell(
                            row,
                            headerMap.documents
                        ),

                    fileStatus:
                        fileStatusResult.value,

                    paymentRequest:
                        parseImportBoolean(

                            getImportCell(
                                row,
                                headerMap.paymentRequest
                            )

                        ),

                    receiveDate:
                        receiveDateResult.value,

                    deliveryDate:
                        deliveryDateResult.value,

                    status:
                        dossierStatusResult.value,

                    paymentStatus:
                        paymentStatusResult.value,

                    note:
                        getImportCell(
                            row,
                            headerMap.note
                        )

                });

            });


        return {

            validRows,

            duplicateRows,

            invalidRows

        };

    }


    // =====================================================
    // TẠO OBJECT BACK4APP
    // =====================================================

    function createDossierImportObject(
        data
    ) {

        const dossierObject =
            new Parse.Object(
                DOSSIER_IMPORT_CLASS_NAME
            );


        dossierObject.set(
            "code",
            data.code
        );


        dossierObject.set(
            "codeNormalized",
            normalizeImportText(
                data.code
            )
        );


        dossierObject.set(
            "projectId",
            data.projectId
        );


        dossierObject.set(
            "supplierId",
            data.supplierId
        );


        dossierObject.set(
            "content",
            data.content
        );


        dossierObject.set(
            "value",
            data.value
        );


        dossierObject.set(
            "documents",
            data.documents
        );


        dossierObject.set(
            "fileStatus",
            data.fileStatus
        );


        dossierObject.set(
            "paymentRequest",
            data.paymentRequest
        );


        dossierObject.set(
            "receiveDate",
            data.receiveDate
        );


        dossierObject.set(
            "deliveryDate",
            data.deliveryDate
        );


        dossierObject.set(
            "status",
            data.status
        );


        dossierObject.set(
            "paymentStatus",
            data.paymentStatus
        );


        dossierObject.set(
            "note",
            data.note
        );


        const currentUser =
            Parse.User.current();


        if (currentUser) {

            dossierObject.set(
                "createdBy",
                currentUser
            );


            dossierObject.set(
                "updatedBy",
                currentUser
            );

        }


        return dossierObject;

    }


    // =====================================================
    // TẠO THÔNG BÁO KIỂM TRA
    // =====================================================

    function buildImportSummaryMessage(
        result
    ) {

        let message =

            `Kết quả kiểm tra file:\n\n`

            +

            `Dòng hợp lệ: ${result.validRows.length}\n`

            +

            `Mã hồ sơ đã tồn tại: ${result.duplicateRows.length}\n`

            +

            `Dòng bị lỗi: ${result.invalidRows.length}`;


        if (
            result.invalidRows.length > 0
        ) {

            const firstErrors =
                result.invalidRows
                    .slice(
                        0,
                        10
                    )
                    .map(item =>

                        `Dòng ${item.rowNumber}: ${item.errors.join(", ")}`

                    )
                    .join(
                        "\n"
                    );


            message +=
                `\n\nMột số lỗi:\n${firstErrors}`;


            if (
                result.invalidRows.length >
                10
            ) {

                message +=

                    `\n... và ${result.invalidRows.length - 10} dòng lỗi khác.`;

            }

        }


        if (
            result.duplicateRows.length > 0
        ) {

            const duplicateCodes =
                result.duplicateRows
                    .slice(
                        0,
                        10
                    )
                    .map(item =>

                        item.code

                        ||

                        `Dòng ${item.rowNumber}`

                    )
                    .join(
                        ", "
                    );


            message +=

                `\n\nMã đã tồn tại sẽ được bỏ qua: ${duplicateCodes}`;

        }


        return message;

    }


    // =====================================================
    // IMPORT FILE CSV
    // =====================================================

    async function importDossierCsvFile(
        file
    ) {

        if (!file) {

            return;

        }


        if (dossierImportRunning) {

            showDossierImportNotice(
                "Đang có một tiến trình nhập dữ liệu khác.",
                "warning"
            );


            return;

        }


        if (
            typeof Parse ===
            "undefined"
        ) {

            showDossierImportNotice(
                "Parse SDK chưa được tải.",
                "error"
            );


            return;

        }


        if (
            window.BACK4APP_CONFIG_READY !==
            true
        ) {

            showDossierImportNotice(
                "Back4App chưa được khởi tạo.",
                "error"
            );


            return;

        }


        if (
            !Parse.User.current()
        ) {

            showDossierImportNotice(
                "Phiên đăng nhập không còn hiệu lực.",
                "error"
            );


            return;

        }


        if (
            !String(file.name)
                .toLowerCase()
                .endsWith(
                    ".csv"
                )
        ) {

            showDossierImportNotice(
                "Vui lòng chọn đúng file CSV.",
                "warning"
            );


            return;

        }


        dossierImportRunning =
            true;


        try {

            showDossierImportNotice(
                "Đang tải dữ liệu Dự án, Nhà cung cấp và Hồ sơ...",
                "info"
            );


            await loadDossierImportReferenceData();


            const text =
                await file.text();


            const rows =
                parseImportCsv(
                    text
                );


            const result =
                validateDossierImportRows(
                    rows
                );


            const summaryMessage =
                buildImportSummaryMessage(
                    result
                );


            if (
                result.validRows.length ===
                0
            ) {

                window.alert(
                    summaryMessage
                );


                return;

            }


            const confirmed =
                window.confirm(

                    summaryMessage

                    +

                    `\n\nBạn có muốn nhập ${result.validRows.length} hồ sơ hợp lệ vào Back4App không?`

                );


            if (!confirmed) {

                return;

            }


            const parseObjects =
                result.validRows.map(
                    createDossierImportObject
                );


            let savedCount =
                0;


            for (
                let index = 0;

                index < parseObjects.length;

                index +=
                    DOSSIER_IMPORT_BATCH_SIZE
            ) {

                const batch =
                    parseObjects.slice(

                        index,

                        index
                        +
                        DOSSIER_IMPORT_BATCH_SIZE

                    );


                await Parse.Object.saveAll(
                    batch
                );


                savedCount +=
                    batch.length;


                showDossierImportNotice(

                    `Đã nhập ${savedCount}/${parseObjects.length} hồ sơ...`,

                    "info"

                );

            }


            /*
            Tải dữ liệu mới nhất lên giao diện.
            */

            if (
                typeof window.fetchDossiersFromBack4App ===
                "function"
            ) {

                await window.fetchDossiersFromBack4App(
                    true
                );

            }


            if (
                typeof window.updateDossierSummary ===
                "function"
            ) {

                window.updateDossierSummary();

            }


            if (
                typeof window.filterDossier ===
                "function"
            ) {

                window.filterDossier();

            }


            showDossierImportNotice(

                `Đã nhập thành công ${savedCount} hồ sơ.`,

                "success"

            );

        } catch (error) {

            console.error(
                "Không import được file Hồ sơ:",
                error
            );


            showDossierImportNotice(

                error?.message

                ||

                "Không thể nhập dữ liệu từ file CSV.",

                "error"

            );

        } finally {

            dossierImportRunning =
                false;

        }

    }


    // =====================================================
    // TẢI FILE CSV MẪU
    // =====================================================

    function escapeCsvCell(
        value
    ) {

        const text =
            String(
                value ?? ""
            );


        if (
            text.includes(",")

            ||

            text.includes('"')

            ||

            text.includes("\n")

            ||

            text.includes("\r")
        ) {

            return `"${text.replaceAll(
                '"',
                '""'
            )}"`;

        }


        return text;

    }


    function downloadDossierCsvTemplate() {

        const exampleRow = [

            "HS001",

            "DA AEON THANH HOÁ",

            "CTY TNHH NGỌC HÂN PHÚC",

            "Hợp đồng thi công",

            "125000000",

            "Hóa đơn",

            "Đã up",

            "Có",

            "2026-07-20",

            "2026-07-25",

            "Đã duyệt",

            "Đã thanh toán",

            "Đã hoàn tất"

        ];


        const csvContent =

            "\uFEFF"

            +

            DOSSIER_IMPORT_HEADERS
                .map(
                    escapeCsvCell
                )
                .join(
                    ","
                )

            +

            "\r\n"

            +

            exampleRow
                .map(
                    escapeCsvCell
                )
                .join(
                    ","
                );


        const blob =
            new Blob(

                [
                    csvContent
                ],

                {
                    type:
                        "text/csv;charset=utf-8"
                }

            );


        const downloadUrl =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            downloadUrl;


        link.download =
            "mau-import-ho-so.csv";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            downloadUrl
        );

    }


    // =====================================================
    // ĐƯA HÀM RA WINDOW
    // =====================================================

    window.importDossierCsvFile =
        importDossierCsvFile;


    window.downloadDossierCsvTemplate =
        downloadDossierCsvTemplate;

})();
