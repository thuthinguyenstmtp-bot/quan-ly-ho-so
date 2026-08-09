;(() => {

    "use strict";


    // =====================================================
    // CẤU HÌNH
    // =====================================================

    const EXPORT_BUTTON_ID =
        "dossierExportSelectedButton";


    const EXPORT_COUNT_ID =
        "dossierExportSelectedCount";


    // =====================================================
    // CHUẨN HÓA
    // =====================================================

    function normalizeExportText(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }


    function normalizeExportSearchText(
        value
    ) {

        return normalizeExportText(
            value
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
            .toLowerCase();

    }


    // =====================================================
    // THÔNG BÁO
    // =====================================================

    function showDossierExportNotice(
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
    // TÌM ĐÚNG BẢNG HỒ SƠ
    // =====================================================

    function findDossierTable() {

        /*
        Ưu tiên một số selector thường dùng.
        */

        const directTable =
            document.querySelector(

                "#dossierTable, " +

                "#dossier-table, " +

                "table.dossier-table, " +

                ".dossier-table-wrapper table, " +

                ".dossier-table-container table"

            );


        if (directTable) {

            return directTable;

        }


        /*
        Nếu không có ID/class đúng,
        tự tìm bảng có các tiêu đề của trang Hồ sơ.
        */

        const allTables =
            Array.from(
                document.querySelectorAll(
                    "table"
                )
            );


        return allTables.find(
            table => {

                const headerText =
                    normalizeExportSearchText(

                        table.querySelector(
                            "thead"
                        )?.textContent

                        ||

                        ""

                    );


                return (

                    headerText.includes(
                        "ma hs"
                    )

                    &&

                    headerText.includes(
                        "du an"
                    )

                    &&

                    headerText.includes(
                        "nha cung cap"
                    )

                );

            }
        )

        ||

        null;

    }


    // =====================================================
    // LẤY CÁC DÒNG ĐƯỢC TICK
    // =====================================================

    function getSelectedDossierRows() {

        const table =
            findDossierTable();


        if (!table) {

            return [];

        }


        const checkedCheckboxes =
            Array.from(

                table.querySelectorAll(

                    "tbody input[type='checkbox']:checked"

                )

            );


        const selectedRows =
            [];


        checkedCheckboxes.forEach(
            checkbox => {

                const row =
                    checkbox.closest(
                        "tr"
                    );


                if (
                    row

                    &&

                    !selectedRows.includes(
                        row
                    )
                ) {

                    selectedRows.push(
                        row
                    );

                }

            }
        );


        return selectedRows;

    }


    // =====================================================
    // XÁC ĐỊNH CỘT XUẤT EXCEL
    // =====================================================

    function getHeaderCells(
        table
    ) {

        const headerRow =
            table.querySelector(
                "thead tr"
            );


        if (!headerRow) {

            return [];

        }


        return Array.from(
            headerRow.cells
        );

    }


    function getExportColumns(
        table
    ) {

        const headerCells =
            getHeaderCells(
                table
            );


        return headerCells
            .map(
                (
                    headerCell,
                    columnIndex
                ) => {

                    const headerText =
                        normalizeExportText(

                            headerCell.textContent

                        );


                    const normalizedHeader =
                        normalizeExportSearchText(

                            headerText

                        );


                    const hasCheckbox =
                        Boolean(

                            headerCell.querySelector(
                                "input[type='checkbox']"
                            )

                        );


                    const isCheckboxColumn =

                        columnIndex === 0

                        ||

                        hasCheckbox;


                    const isActionColumn =

                        normalizedHeader ===
                        "thao tac"

                        ||

                        normalizedHeader.includes(
                            "thao tac"
                        );


                    if (
                        isCheckboxColumn

                        ||

                        isActionColumn
                    ) {

                        return null;

                    }


                    return {

                        columnIndex,

                        header:
                            headerText

                    };

                }
            )
            .filter(Boolean);

    }


    // =====================================================
    // ĐỌC GIÁ TRỊ TRONG Ô
    // =====================================================

    function getCellDisplayValue(
        cell
    ) {

        if (!cell) {

            return "";

        }


        /*
        Trường hợp trong ô là input.
        */

        const input =
            cell.querySelector(

                "input:not([type='checkbox'])"

            );


        if (input) {

            return normalizeExportText(
                input.value
            );

        }


        /*
        Trường hợp trong ô là select.
        */

        const select =
            cell.querySelector(
                "select"
            );


        if (select) {

            return normalizeExportText(

                select.options[
                    select.selectedIndex
                ]?.text

                ||

                select.value

            );

        }


        return normalizeExportText(

            cell.innerText

            ||

            cell.textContent

            ||

            ""

        );

    }


    function convertExportValue(
        header,
        rawValue
    ) {

        const normalizedHeader =
            normalizeExportSearchText(
                header
            );


        const textValue =
            normalizeExportText(
                rawValue
            );


        if (
            textValue === "—"

            ||

            textValue === "-"
        ) {

            return "";

        }


        /*
        Xuất Giá trị thành kiểu Number trong Excel.
        Ví dụ:
        427.789.478 → 427789478
        */

        if (
            normalizedHeader ===
            "gia tri"
        ) {

            const numericText =
                textValue.replace(
                    /[^\d-]/g,
                    ""
                );


            if (
                numericText

                &&

                /^-?\d+$/.test(
                    numericText
                )
            ) {

                const numericValue =
                    Number(
                        numericText
                    );


                if (
                    Number.isFinite(
                        numericValue
                    )
                ) {

                    return numericValue;

                }

            }

        }


        return textValue;

    }


    function getExportRowData(
        row,
        exportColumns
    ) {

        const cells =
            Array.from(
                row.cells
            );


        return exportColumns.map(
            column => {

                const cell =
                    cells[
                        column.columnIndex
                    ];


                const rawValue =
                    getCellDisplayValue(
                        cell
                    );


                return convertExportValue(

                    column.header,

                    rawValue

                );

            }
        );

    }


    // =====================================================
    // ĐỊNH DẠNG EXCEL
    // =====================================================

    function setWorksheetColumnWidths(
        worksheet,
        headers
    ) {

        const widthMap = {

            "ma hs":
                15,

            "du an":
                28,

            "noi dung":
                35,

            "nha cung cap":
                34,

            "gia tri":
                18,

            "bo sung hs":
                28,

            "file hs":
                14,

            "trang thai hs":
                18,

            "dntt":
                12,

            "ban giao":
                16,

            "thanh toan":
                20

        };


        worksheet["!cols"] =
            headers.map(
                header => {

                    const normalizedHeader =
                        normalizeExportSearchText(
                            header
                        );


                    return {

                        wch:
                            widthMap[
                                normalizedHeader
                            ]

                            ||

                            20

                    };

                }
            );

    }


    function formatValueColumn(
        worksheet,
        headers,
        dataRowCount
    ) {

        const valueColumnIndex =
            headers.findIndex(
                header =>

                    normalizeExportSearchText(
                        header
                    ) ===
                    "gia tri"

            );


        if (
            valueColumnIndex < 0
        ) {

            return;

        }


        /*
        Dòng 0 là tiêu đề.
        Dữ liệu bắt đầu từ dòng 1.
        */

        for (
            let rowIndex = 1;

            rowIndex <= dataRowCount;

            rowIndex += 1
        ) {

            const cellAddress =
                XLSX.utils.encode_cell({

                    r:
                        rowIndex,

                    c:
                        valueColumnIndex

                });


            const cell =
                worksheet[
                    cellAddress
                ];


            if (
                cell

                &&

                typeof cell.v ===
                "number"
            ) {

                cell.z =
                    "#,##0";

            }

        }

    }


    // =====================================================
    // TÊN FILE
    // =====================================================

    function createDossierExportFileName() {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        const hour =
            String(
                now.getHours()
            ).padStart(
                2,
                "0"
            );


        const minute =
            String(
                now.getMinutes()
            ).padStart(
                2,
                "0"
            );


        return (

            `ho-so-da-chon_`

            +

            `${year}-${month}-${day}_`

            +

            `${hour}-${minute}.xlsx`

        );

    }


    // =====================================================
    // XUẤT EXCEL
    // =====================================================

    function exportSelectedDossiersToExcel() {

        if (
            typeof window.XLSX ===
            "undefined"
        ) {

            showDossierExportNotice(

                "Thư viện Excel chưa được tải. Hãy kiểm tra dòng xlsx.full.min.js trong index.html.",

                "error"

            );


            return;

        }


        const table =
            findDossierTable();


        if (!table) {

            showDossierExportNotice(

                "Không tìm thấy bảng Quản lý hồ sơ.",

                "error"

            );


            return;

        }


        const selectedRows =
            getSelectedDossierRows();


        if (
            selectedRows.length === 0
        ) {

            showDossierExportNotice(

                "Hệ thống chưa nhận được hồ sơ đã tick.",

                "warning"

            );


            updateSelectedDossierExportCount();


            return;

        }


        const exportColumns =
            getExportColumns(
                table
            );


        if (
            exportColumns.length === 0
        ) {

            showDossierExportNotice(

                "Không xác định được các cột cần xuất.",

                "error"

            );


            return;

        }


        const headers =
            exportColumns.map(
                column =>
                    column.header
            );


        const exportRows =
            selectedRows.map(
                row =>

                    getExportRowData(

                        row,

                        exportColumns

                    )

            );


        const worksheetData = [

            headers,

            ...exportRows

        ];


        const worksheet =
            XLSX.utils.aoa_to_sheet(
                worksheetData
            );


        if (
            worksheet["!ref"]
        ) {

            worksheet["!autofilter"] = {

                ref:
                    worksheet["!ref"]

            };

        }


        setWorksheetColumnWidths(

            worksheet,

            headers

        );


        formatValueColumn(

            worksheet,

            headers,

            exportRows.length

        );


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            "Hồ sơ đã chọn"

        );


        workbook.Props = {

            Title:
                "Hồ sơ đã chọn",

            Subject:
                "Danh sách hồ sơ xuất từ website",

            Author:
                "Hệ thống Quản lý Hồ sơ",

            CreatedDate:
                new Date()

        };


        const fileName =
            createDossierExportFileName();


        XLSX.writeFile(

            workbook,

            fileName,

            {
                compression:
                    true
            }

        );


        showDossierExportNotice(

            `Đã tải ${selectedRows.length} hồ sơ xuống Excel.`,

            "success"

        );

    }


    // =====================================================
    // CẬP NHẬT SỐ LƯỢNG ĐÃ CHỌN
    // =====================================================

    function updateSelectedDossierExportCount() {

        const selectedCount =
            getSelectedDossierRows()
                .length;


        const countElement =
            document.getElementById(
                EXPORT_COUNT_ID
            );


        if (countElement) {

            countElement.textContent =
                `(${selectedCount})`;

        }


        const exportButton =
            document.getElementById(
                EXPORT_BUTTON_ID
            );


        if (exportButton) {

    const hasSelectedDossiers =
        selectedCount > 0;


    exportButton.disabled =
        !hasSelectedDossiers;


    exportButton.classList.toggle(

        "is-ready",

        hasSelectedDossiers

    );


    exportButton.title =

        hasSelectedDossiers

            ? `Xuất ${selectedCount} hồ sơ đã chọn`

            : "Hãy tick chọn hồ sơ cần xuất";

}

    }


    // =====================================================
    // THEO DÕI CHECKBOX
    // =====================================================

    document.addEventListener(

        "change",

        event => {

            const target =
                event.target;


            if (
                !target?.matches?.(
                    "input[type='checkbox']"
                )
            ) {

                return;

            }


            const table =
                target.closest(
                    "table"
                );


            if (!table) {

                return;

            }


            /*
            Chờ dossier.js xử lý checkbox chọn tất cả.
            */

            window.setTimeout(

                updateSelectedDossierExportCount,

                0

            );


            window.setTimeout(

                updateSelectedDossierExportCount,

                100

            );

        }

    );


    /*
    Khi bảng được render lại do lọc, phân trang hoặc tải dữ liệu,
    cập nhật lại số lượng đã chọn.
    */

    const contentRoot =
        document.getElementById(
            "content"
        )

        ||

        document.body;


    const observer =
        new MutationObserver(() => {

            window.clearTimeout(
                window.__dossierExportUpdateTimer
            );


            window.__dossierExportUpdateTimer =
                window.setTimeout(

                    updateSelectedDossierExportCount,

                    100

                );

        });


    observer.observe(

        contentRoot,

        {
            childList:
                true,

            subtree:
                true
        }

    );


    // =====================================================
    // ĐƯA HÀM RA WINDOW
    // =====================================================

    window.exportSelectedDossiersToExcel =
        exportSelectedDossiersToExcel;


    window.updateSelectedDossierExportCount =
        updateSelectedDossierExportCount;


    window.getSelectedDossierRows =
        getSelectedDossierRows;


    window.findDossierTable =
        findDossierTable;

})();
