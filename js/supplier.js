// =====================================
// SUPPLIER.JS
// Quản lý Nhà cung cấp bằng Back4App
// Đồng bộ với giao diện Trang Dự án
// =====================================

const SUPPLIER_CLASS_NAME =
    "Supplier";

const SUPPLIER_DOSSIER_CLASS_NAME =
    "Dossier";

const SUPPLIER_LETTER_CLASS_NAME =
    "Letter";

const SUPPLIER_ARCHIVE_CLASS_NAME =
    "ArchiveDossier";

const SUPPLIER_STORAGE_KEY =
    "suppliers";


let suppliers =
    getSupplierStorageArray(
        SUPPLIER_STORAGE_KEY
    );

let editingSupplierId =
    null;

let supplierDataLoaded =
    false;

let supplierLoadingPromise =
    null;

let supplierDeleteConfirmResolver =
    null;

let supplierDeleteInProgress =
    false;

    // =====================================
// TRẠNG THÁI TÌM KIẾM / PHÂN TRANG
// =====================================

let supplierCurrentPage =
    1;


let supplierPageSize =
    20;


let supplierStatusFilter =
    "all";


let supplierSortField =
    "ten";


let supplierSortDirection =
    "asc";

// =====================================
// HÀM HỖ TRỢ
// =====================================

function getSupplierElement(id){

    return document.getElementById(id);

}


function getSupplierInputValue(id){

    const element =
        getSupplierElement(id);


    return element

        ? String(
            element.value || ""
        ).trim()

        : "";

}


function setSupplierInputValue(
    id,
    value
){

    const element =
        getSupplierElement(id);


    if(element){

        element.value =
            value ?? "";

    }

}


function normalizeSupplierText(value){

    return String(value || "")

        .replace(
            /[đĐ]/g,
            "d"
        )

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


function escapeSupplierHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function getSupplierStorageArray(key){

    try{

        const rawData =
            localStorage.getItem(key);


        if(!rawData){

            return [];

        }


        const parsedData =
            JSON.parse(rawData);


        return Array.isArray(
            parsedData
        )

            ? parsedData

            : [];

    }catch(error){

        console.error(
            `Không đọc được dữ liệu ${key}:`,
            error
        );


        return [];

    }

}


function saveSuppliersToStorage(){

    try{

        localStorage.setItem(

            SUPPLIER_STORAGE_KEY,

            JSON.stringify(
                suppliers
            )

        );

    }catch(error){

        console.error(

            "Không cập nhật được cache Nhà cung cấp:",

            error

        );

    }

}


function getCurrentSupplierKeyword(){

    const searchInput =
        getSupplierElement(
            "searchSupplier"
        );


    return searchInput

        ? searchInput.value

        : "";

}


function ensureSupplierBack4AppReady(){

    if(
        typeof Parse ===
        "undefined"
    ){

        throw new Error(
            "Parse SDK chưa được tải."
        );

    }


    if(
        window.BACK4APP_CONFIG_READY !==
        true
    ){

        throw new Error(
            "Back4App chưa được khởi tạo."
        );

    }


    if(
        !Parse.User.current()
    ){

        throw new Error(
            "Phiên đăng nhập không còn hiệu lực."
        );

    }

}


function showSupplierMessage(
    message,
    type = "success"
){

    if(
        typeof window.showAppToast ===
        "function"
    ){

        window.showAppToast(
            message,
            type
        );


        return;

    }


    if(type === "error"){

        console.error(
            message
        );

    }else if(type === "info"){

        console.info(
            message
        );

    }else{

        console.log(
            message
        );

    }

}


function setSupplierTableMessage(
    message,
    isError = false
){

    const table =
        getSupplierElement(
            "supplierTable"
        );


    if(!table){

        return;

    }


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="supplier-loading-cell"
                style="
                    text-align:center;
                    padding:28px;
                    color:${
                        isError
                            ? "#dc2626"
                            : "#6b7280"
                    };
                "
            >
                ${escapeSupplierHtml(
                    message
                )}
            </td>

        </tr>

    `;

}


function setSupplierSaveBusy(
    isBusy,
    isEditing
){

    const button =
        getSupplierElement(
            "supplierSaveButton"
        );


    if(!button){

        return;

    }


    button.disabled =
        isBusy;


    button.textContent =

        isBusy

        ? "Đang lưu..."

        : (
            isEditing

            ? "Cập nhật nhà cung cấp"

            : "Lưu nhà cung cấp"
        );

}


function getSupplierValidIds(
    supplier
){

    return [

        supplier?.id,

        supplier?.legacyId,

        supplier?.back4appId

    ]

    .filter(Boolean)

    .map(value =>
        String(value)
    );

}


function findLocalSupplierByAnyId(id){

    const targetId =
        String(id || "");


    return suppliers.find(supplier =>

        getSupplierValidIds(
            supplier
        )

        .includes(
            targetId
        )

    ) || null;

}

// =====================================
// KIỂM TRA DỮ LIỆU NHÀ CUNG CẤP
// =====================================

function hasSupplierValue(value){

    return Boolean(

        String(
            value || ""
        ).trim()

    );

}


function isSupplierComplete(
    supplier
){

    return (

        hasSupplierValue(
            supplier?.ten
        )

        &&

        hasSupplierValue(
            supplier?.diachi
        )

        &&

        hasSupplierValue(
            supplier?.nguoinhan
        )

        &&

        hasSupplierValue(
            supplier?.sdt
        )

    );

}


function supplierMatchesStatus(
    supplier,
    status
){

    switch(status){

        case "complete":

            return isSupplierComplete(
                supplier
            );


        case "incomplete":

            return !isSupplierComplete(
                supplier
            );


        case "missing-name":

            return !hasSupplierValue(
                supplier?.ten
            );


        case "missing-address":

            return !hasSupplierValue(
                supplier?.diachi
            );


        case "missing-receiver":

            return !hasSupplierValue(
                supplier?.nguoinhan
            );


        case "missing-phone":

            return !hasSupplierValue(
                supplier?.sdt
            );


        case "all":

        default:

            return true;

    }

}

// =====================================
// ĐỊNH DẠNG SỐ ĐIỆN THOẠI
// =====================================

function getSupplierPhoneDigits(value){

    return String(value || "")

        .replace(
            /\D/g,
            ""
        );

}


function formatSupplierPhone(value){

    let digits =
        getSupplierPhoneDigits(
            value
        );


    /*
    Một số dữ liệu cũ bị thiếu số 0 đầu.
    Chỉ bổ sung khi có đúng 9 chữ số.
    */

    if(
        digits.length ===
        9
    ){

        digits =
            `0${digits}`;

    }


    if(
        digits.length ===
        10
    ){

        return `

            ${digits.slice(0, 4)}

            ${digits.slice(4, 7)}

            ${digits.slice(7, 10)}

        `

        .replace(
            /\s+/g,
            " "
        )

        .trim();

    }


    return String(
        value || ""
    ).trim();

}
// =====================================
// LỌC VÀ SẮP XẾP DANH SÁCH
// =====================================

function getFilteredSortedSuppliers(
    keyword = ""
){

    const normalizedKeyword =
        normalizeSupplierText(
            keyword
        );


    const filteredSuppliers =
        suppliers.filter(item => {

            const searchText = `

                ${item.ten || ""}

                ${item.diachi || ""}

                ${item.nguoinhan || ""}

                ${item.sdt || ""}

            `;


            const matchesKeyword =
                normalizeSupplierText(
                    searchText
                )

                .includes(
                    normalizedKeyword
                );


            const matchesStatus =
                supplierMatchesStatus(

                    item,

                    supplierStatusFilter

                );


            return (

                matchesKeyword

                &&

                matchesStatus

            );

        });


    const sortedSuppliers =
        [...filteredSuppliers];


    sortedSuppliers.sort(
        function(a, b){

            const valueA =
                String(

                    a?.[
                        supplierSortField
                    ]

                    ||

                    ""

                );


            const valueB =
                String(

                    b?.[
                        supplierSortField
                    ]

                    ||

                    ""

                );


            const comparison =
                valueA.localeCompare(

                    valueB,

                    "vi",

                    {

                        sensitivity:
                            "base",

                        numeric:
                            true

                    }

                );


            return (

                supplierSortDirection ===
                "asc"

                ? comparison

                : -comparison

            );

        }
    );


    return sortedSuppliers;

}
// =====================================
// ICON SẮP XẾP
// =====================================

function updateSupplierSortIcons(){

    const iconMap = {

        ten:
            "supplierSortTen",

        diachi:
            "supplierSortAddress",

        nguoinhan:
            "supplierSortReceiver",

        sdt:
            "supplierSortPhone"

    };


    Object.values(
        iconMap
    )

    .forEach(elementId => {

        const icon =
            getSupplierElement(
                elementId
            );


        if(icon){

            icon.textContent =
                "↕";

        }

    });


    const activeIcon =
        getSupplierElement(

            iconMap[
                supplierSortField
            ]

        );


    if(activeIcon){

        activeIcon.textContent =

            supplierSortDirection ===
            "asc"

            ? "↑"

            : "↓";

    }

}


function sortSuppliersBy(field){

    const allowedFields =
        new Set([

            "ten",

            "diachi",

            "nguoinhan",

            "sdt"

        ]);


    if(
        !allowedFields.has(
            field
        )
    ){

        return;

    }


    if(
        supplierSortField ===
        field
    ){

        supplierSortDirection =

            supplierSortDirection ===
            "asc"

            ? "desc"

            : "asc";

    }else{

        supplierSortField =
            field;


        supplierSortDirection =
            "asc";

    }


    supplierCurrentPage =
        1;


    renderSupplier(
        getCurrentSupplierKeyword()
    );

}
// =====================================
// PHÂN TRANG
// =====================================

function getSupplierTotalPages(
    totalItems
){

    return Math.max(

        1,

        Math.ceil(

            totalItems

            /

            supplierPageSize

        )

    );

}


function goToSupplierPage(page){

    const filteredSuppliers =
        getFilteredSortedSuppliers(
            getCurrentSupplierKeyword()
        );


    const totalPages =
        getSupplierTotalPages(
            filteredSuppliers.length
        );


    const normalizedPage =
        Math.min(

            Math.max(
                1,
                Number(page) || 1
            ),

            totalPages

        );


    supplierCurrentPage =
        normalizedPage;


    renderSupplier(
        getCurrentSupplierKeyword()
    );

}


function changeSupplierPage(
    difference
){

    goToSupplierPage(

        supplierCurrentPage

        +

        Number(difference || 0)

    );

}


function changeSupplierPageSize(value){

    const parsedValue =
        Number(value);


    const allowedSizes =
        new Set([

            10,

            20,

            50,

            100

        ]);


    supplierPageSize =

        allowedSizes.has(
            parsedValue
        )

        ? parsedValue

        : 20;


    supplierCurrentPage =
        1;


    renderSupplier(
        getCurrentSupplierKeyword()
    );

}


function changeSupplierStatusFilter(
    value
){

    const allowedFilters =
        new Set([

            "all",

            "complete",

            "incomplete",

            "missing-name",

            "missing-address",

            "missing-receiver",

            "missing-phone"

        ]);


    supplierStatusFilter =

        allowedFilters.has(
            value
        )

        ? value

        : "all";


    supplierCurrentPage =
        1;


    renderSupplier(
        getCurrentSupplierKeyword()
    );

}
function getSupplierPageButtonList(
    totalPages,
    currentPage
){

    if(totalPages <= 7){

        return Array.from(

            {
                length:
                    totalPages
            },

            (
                value,
                index
            ) =>

                index + 1

        );

    }


    const pages =
        [1];


    const startPage =
        Math.max(
            2,
            currentPage - 1
        );


    const endPage =
        Math.min(

            totalPages - 1,

            currentPage + 1

        );


    if(startPage > 2){

        pages.push(
            "..."
        );

    }


    for(
        let page = startPage;
        page <= endPage;
        page += 1
    ){

        pages.push(
            page
        );

    }


    if(
        endPage <
        totalPages - 1
    ){

        pages.push(
            "..."
        );

    }


    pages.push(
        totalPages
    );


    return pages;

}


function renderSupplierPagination(
    totalItems
){

    const info =
        getSupplierElement(
            "supplierPaginationInfo"
        );


    const prevButton =
        getSupplierElement(
            "supplierPrevPage"
        );


    const nextButton =
        getSupplierElement(
            "supplierNextPage"
        );


    const pageNumbers =
        getSupplierElement(
            "supplierPageNumbers"
        );


    const pageSizeSelect =
        getSupplierElement(
            "supplierPageSize"
        );


    const totalPages =
        getSupplierTotalPages(
            totalItems
        );


    supplierCurrentPage =
        Math.min(

            Math.max(
                1,
                supplierCurrentPage
            ),

            totalPages

        );


    const startItem =

        totalItems === 0

        ? 0

        : (
            (
                supplierCurrentPage - 1
            )

            *

            supplierPageSize

            +

            1
        );


    const endItem =
        Math.min(

            supplierCurrentPage

            *

            supplierPageSize,

            totalItems

        );


    if(info){

        info.textContent =

            `Hiển thị ${startItem}–${endItem} trên ${totalItems} Nhà cung cấp`;

    }


    if(prevButton){

        prevButton.disabled =

            supplierCurrentPage <=
            1;

    }


    if(nextButton){

        nextButton.disabled =

            supplierCurrentPage >=
            totalPages;

    }


    if(pageSizeSelect){

        pageSizeSelect.value =
            String(
                supplierPageSize
            );

    }


    if(!pageNumbers){

        return;

    }


    const pageList =
        getSupplierPageButtonList(

            totalPages,

            supplierCurrentPage

        );


    pageNumbers.innerHTML =
        pageList

        .map(page => {

            if(page === "..."){

                return `

                    <span
                        class="
                            supplier-page-ellipsis
                        "
                    >
                        …
                    </span>

                `;

            }


            const isActive =

                Number(page)

                ===

                supplierCurrentPage;


            return `

                <button
                    type="button"
                    class="
                        supplier-page-number

                        ${
                            isActive

                            ? "is-active"

                            : ""
                        }
                    "
                    onclick="
                        goToSupplierPage(
                            ${Number(page)}
                        )
                    "
                >
                    ${Number(page)}
                </button>

            `;

        })

        .join("");

}
// =====================================
// POPUP XÁC NHẬN XÓA
// =====================================

function openSupplierDeleteConfirm(
    supplierName
){

    return new Promise(resolve => {

        const overlay =
            getSupplierElement(
                "supplierDeleteConfirm"
            );


        const message =
            getSupplierElement(
                "supplierDeleteConfirmMessage"
            );


        const confirmButton =
            getSupplierElement(
                "supplierDeleteConfirmButton"
            );


        /*
        Dự phòng nếu chưa có popup mới.
        */

        if(!overlay){

            const confirmed =
                window.confirm(

                    `Bạn có chắc chắn muốn xóa Nhà cung cấp "${supplierName}"?`

                    +

                    "\n\nThao tác này không thể hoàn tác."

                );


            resolve(
                confirmed
            );


            return;

        }


        if(
            typeof supplierDeleteConfirmResolver ===
            "function"
        ){

            supplierDeleteConfirmResolver(
                false
            );

        }


        supplierDeleteConfirmResolver =
            resolve;


        if(message){

            message.textContent =

                `Bạn có chắc chắn muốn xóa Nhà cung cấp "${supplierName}"?`;

        }


        if(confirmButton){

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Xóa nhà cung cấp";

        }


        overlay.classList.add(
            "is-open"
        );


        overlay.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "supplier-confirm-open"
        );


        requestAnimationFrame(() => {

            confirmButton?.focus();

        });

    });

}


function closeSupplierDeleteConfirm(
    confirmed = false
){

    const overlay =
        getSupplierElement(
            "supplierDeleteConfirm"
        );


    if(overlay){

        overlay.classList.remove(
            "is-open"
        );


        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "supplier-confirm-open"
    );


    const resolver =
        supplierDeleteConfirmResolver;


    supplierDeleteConfirmResolver =
        null;


    if(
        typeof resolver ===
        "function"
    ){

        resolver(
            Boolean(
                confirmed
            )
        );

    }

}


// =====================================
// PARSE OBJECT → OBJECT THƯỜNG
// =====================================

function supplierParseObjectToPlain(
    parseObject,
    fallbackSupplier = null
){
    const supplierName =
    [

        parseObject?.get(
            "ten"
        ),

        parseObject?.get(
            "name"
        ),

        parseObject?.get(
            "supplierName"
        ),

        parseObject?.get(
            "tenNCC"
        ),

        parseObject?.get(
            "tennhacungcap"
        ),

        fallbackSupplier?.ten

    ]

    .find(value =>

        String(
            value ?? ""
        ).trim()

    )

    ||

    "";
    
    const back4appId =
        String(

            parseObject?.id

            ||

            fallbackSupplier?.back4appId

            ||

            ""

        ).trim();


    const fallbackLegacyId =

        fallbackSupplier?.id

        &&

        String(
            fallbackSupplier.id
        )

        !==

        back4appId

        ? String(
            fallbackSupplier.id
        )

        : "";


    const legacyId =
        String(

            parseObject?.get(
                "legacyId"
            )

            ||

            fallbackSupplier?.legacyId

            ||

            fallbackLegacyId

            ||

            ""

        ).trim();


    return {

        id:

            legacyId

            ||

            back4appId

            ||

            fallbackSupplier?.id

            ||

            "",


        legacyId:
            legacyId,


        back4appId:
            back4appId,


        ten:
            String(

                parseObject?.get(
                    "ten"
                )

                ??

                fallbackSupplier?.ten

                ??

                ""

            ),


        diachi:
            String(

                parseObject?.get(
                    "diachi"
                )

                ??

                fallbackSupplier?.diachi

                ??

                ""

            ),


        nguoinhan:
            String(

                parseObject?.get(
                    "nguoinhan"
                )

                ??

                fallbackSupplier?.nguoinhan

                ??

                ""

            ),


        sdt:
            String(

                parseObject?.get(
                    "sdt"
                )

                ??

                fallbackSupplier?.sdt

                ??

                ""

            ),


        createdAt:

            parseObject?.createdAt

            ? parseObject.createdAt
                .toISOString()

            : (
                fallbackSupplier?.createdAt

                ||

                ""
            ),


        updatedAt:

            parseObject?.updatedAt

            ? parseObject.updatedAt
                .toISOString()

            : (
                fallbackSupplier?.updatedAt

                ||

                ""
            )

    };

}


// =====================================
// TÌM OBJECT NCC THẬT TRÊN BACK4APP
// =====================================

async function findSupplierObjectOnBack4App(
    supplier
){

    ensureSupplierBack4AppReady();


    if(!supplier){

        return null;

    }


    /*
    1. Tìm bằng objectId.
    */

    const back4appId =
        String(
            supplier.back4appId || ""
        ).trim();


    if(back4appId){

        try{

            const queryByObjectId =
                new Parse.Query(
                    SUPPLIER_CLASS_NAME
                );


            return await queryByObjectId.get(
                back4appId
            );

        }catch(error){

            if(error?.code !== 101){

                throw error;

            }


            console.warn(

                "Không tìm thấy Supplier bằng back4appId:",

                back4appId

            );

        }

    }


    /*
    2. Tìm bằng legacyId.
    */

    const legacyId =
        String(

            supplier.legacyId

            ||

            (
                supplier.id

                &&

                String(
                    supplier.id
                )

                !==

                back4appId

                ? supplier.id

                : ""
            )

            ||

            ""

        ).trim();


    if(legacyId){

        const queryByLegacyId =
            new Parse.Query(
                SUPPLIER_CLASS_NAME
            );


        queryByLegacyId.equalTo(
            "legacyId",
            legacyId
        );


        const foundByLegacyId =
            await queryByLegacyId.first();


        if(foundByLegacyId){

            return foundByLegacyId;

        }

    }


    /*
    3. Tìm bằng tên chuẩn hóa.
    */

    const normalizedName =
        normalizeSupplierText(
            supplier.ten || ""
        );


    if(normalizedName){

        const queryByName =
            new Parse.Query(
                SUPPLIER_CLASS_NAME
            );


        queryByName.equalTo(
            "tenNormalized",
            normalizedName
        );


        const foundByName =
            await queryByName.first();


        if(foundByName){

            return foundByName;

        }

    }


    /*
    4. Dữ liệu cũ chưa có tenNormalized.
    */

    const rawName =
        String(
            supplier.ten || ""
        ).trim();


    if(rawName){

        const queryByRawName =
            new Parse.Query(
                SUPPLIER_CLASS_NAME
            );


        queryByRawName.equalTo(
            "ten",
            rawName
        );


        const foundByRawName =
            await queryByRawName.first();


        if(foundByRawName){

            return foundByRawName;

        }

    }


    return null;

}


// =====================================
// MIGRATION
// =====================================

async function migrateSuppliersToBack4App(){

    /*
    Dữ liệu đã migrate hoàn tất.

    Không tự chạy migration lại để tránh
    Nhà cung cấp đã xóa bị tạo lại từ cache cũ.
    */

    return {

        migrated: 0,

        skipped: suppliers.length,

        alreadyCompleted: true

    };

}


// =====================================
// ĐỌC NCC TỪ BACK4APP
// =====================================

async function fetchSuppliersFromBack4App(
    forceReload = false
){

    ensureSupplierBack4AppReady();


    if(
        supplierDataLoaded

        &&

        !forceReload
    ){

        return suppliers;

    }


    if(supplierLoadingPromise){

        return supplierLoadingPromise;

    }


    supplierLoadingPromise =
        (async function(){

            const query =
                new Parse.Query(
                    SUPPLIER_CLASS_NAME
                );


            query.ascending(
                "ten"
            );


            query.limit(
                1000
            );


            const results =
                await query.find();


            suppliers =
                results.map(item =>

                    supplierParseObjectToPlain(
                        item
                    )

                );


            supplierDataLoaded =
                true;


            saveSuppliersToStorage();


            return suppliers;

        })();


    try{

        return await supplierLoadingPromise;

    }finally{

        supplierLoadingPromise =
            null;

    }

}


// =====================================
// LOAD NHÀ CUNG CẤP
// =====================================

async function loadSupplier(){

    setSupplierTableMessage(
        "Đang tải Nhà cung cấp..."
    );


    try{

        await fetchSuppliersFromBack4App(
            true
        );


        renderSupplier(
            getCurrentSupplierKeyword()
        );


        renderSupplierSelectOptions();


        return [
            ...suppliers
        ];

    }catch(error){

        console.error(
            "Không tải được Nhà cung cấp:",
            error
        );


        setSupplierTableMessage(

            error?.message

            ||

            "Không tải được Nhà cung cấp.",

            true

        );


        return [];

    }

}


// =====================================
// MỞ / ĐÓNG FORM
// =====================================

function openSupplierForm(){

    editingSupplierId =
        null;


    resetSupplierForm();


    const form =
        getSupplierElement(
            "supplierForm"
        );


    if(!form){

        console.error(
            "Không tìm thấy id supplierForm"
        );

        return;

    }


    const title =
        getSupplierElement(
            "supplierFormTitle"
        );


    const button =
        getSupplierElement(
            "supplierSaveButton"
        );


    if(title){

        title.textContent =
            "Thêm nhà cung cấp";

    }


    if(button){

        button.disabled =
            false;

        button.textContent =
            "Lưu nhà cung cấp";

    }


    form.style.removeProperty(
        "display"
    );


    form.classList.add(
        "is-open"
    );


    form.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "supplier-modal-open"
    );


    requestAnimationFrame(() => {

        getSupplierElement(
            "supplierName"
        )?.focus();

    });

}


function closeSupplierForm(){

    const form =
        getSupplierElement(
            "supplierForm"
        );


    if(form){

        form.classList.remove(
            "is-open"
        );


        form.style.removeProperty(
            "display"
        );


        form.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "supplier-modal-open"
    );


    editingSupplierId =
        null;


    resetSupplierForm();

}


function resetSupplierForm(){

    setSupplierInputValue(
        "supplierName",
        ""
    );


    setSupplierInputValue(
        "supplierAddress",
        ""
    );


    setSupplierInputValue(
        "supplierReceiver",
        ""
    );


    setSupplierInputValue(
        "supplierPhone",
        ""
    );

}


// =====================================
// KIỂM TRA TRÙNG TÊN TRÊN SERVER
// =====================================

async function findDuplicatedSupplierByName(
    normalizedName,
    ignoredObjectId = ""
){

    const query =
        new Parse.Query(
            SUPPLIER_CLASS_NAME
        );


    query.equalTo(
        "tenNormalized",
        normalizedName
    );


    query.limit(
        20
    );


    const results =
        await query.find();


    return results.find(item =>

        String(item.id)

        !==

        String(
            ignoredObjectId || ""
        )

    ) || null;

}


// =====================================
// LƯU / CẬP NHẬT NCC
// =====================================

async function saveSupplier(){

    const name =
        getSupplierInputValue(
            "supplierName"
        );


    const address =
        getSupplierInputValue(
            "supplierAddress"
        );


    const receiver =
        getSupplierInputValue(
            "supplierReceiver"
        );


    const phone =
        getSupplierInputValue(
            "supplierPhone"
        );


    if(!name){

        showSupplierMessage(
            "Vui lòng nhập tên Nhà cung cấp.",
            "error"
        );


        getSupplierElement(
            "supplierName"
        )?.focus();


        return;

    }


    const isEditing =
        editingSupplierId !== null;


    setSupplierSaveBusy(
        true,
        isEditing
    );


    try{

        ensureSupplierBack4AppReady();


        if(!supplierDataLoaded){

            await fetchSuppliersFromBack4App(
                true
            );

        }


        const editingSupplier =

            isEditing

            ? findLocalSupplierByAnyId(
                editingSupplierId
            )

            : null;


        if(
            isEditing

            &&

            !editingSupplier
        ){

            throw new Error(

                "Không tìm thấy Nhà cung cấp cần chỉnh sửa."

            );

        }


        const normalizedName =
            normalizeSupplierText(
                name
            );


        let supplierObject;


        if(isEditing){

            supplierObject =
                await findSupplierObjectOnBack4App(
                    editingSupplier
                );


            if(!supplierObject){

                await fetchSuppliersFromBack4App(
                    true
                );


                renderSupplier(
                    getCurrentSupplierKeyword()
                );


                throw new Error(

                    "Nhà cung cấp không còn tồn tại trên Back4App hoặc tài khoản không có quyền cập nhật."

                );

            }

        }else{

            supplierObject =
                new Parse.Object(
                    SUPPLIER_CLASS_NAME
                );

        }


        const duplicatedSupplier =
            await findDuplicatedSupplierByName(

                normalizedName,

                supplierObject?.id || ""

            );


        if(duplicatedSupplier){

            showSupplierMessage(

                "Tên Nhà cung cấp này đã tồn tại.",

                "error"

            );


            return;

        }


        supplierObject.set(
            "ten",
            name
        );


        supplierObject.set(
            "tenNormalized",
            normalizedName
        );


        supplierObject.set(
            "diachi",
            address
        );


        supplierObject.set(
            "nguoinhan",
            receiver
        );


        supplierObject.set(
            "sdt",
            phone
        );


        if(
            isEditing

            &&

            editingSupplier?.legacyId
        ){

            supplierObject.set(
                "legacyId",
                editingSupplier.legacyId
            );

        }


        const currentUser =
            Parse.User.current();


        if(
            !isEditing

            &&

            currentUser
        ){

            supplierObject.set(
                "createdBy",
                currentUser
            );

        }


        if(currentUser){

            supplierObject.set(
                "updatedBy",
                currentUser
            );

        }


        const savedObject =
            await supplierObject.save();


        const savedSupplier =
            supplierParseObjectToPlain(

                savedObject,

                editingSupplier

            );


        if(isEditing){

            const supplierIndex =
                suppliers.findIndex(item =>

                    getSupplierValidIds(
                        item
                    )

                    .includes(
                        String(
                            editingSupplierId
                        )
                    )

                );


            if(supplierIndex !== -1){

                suppliers[supplierIndex] =
                    savedSupplier;

            }

        }else{

            suppliers.push(
                savedSupplier
            );

        }


        suppliers.sort(

            (a, b) =>

                String(a.ten || "")

                .localeCompare(

                    String(
                        b.ten || ""
                    ),

                    "vi"

                )

        );


        saveSuppliersToStorage();


        renderSupplier(
            getCurrentSupplierKeyword()
        );


        renderSupplierSelectOptions();


        closeSupplierForm();


        showSupplierMessage(

            isEditing

            ? "Đã cập nhật Nhà cung cấp."

            : "Đã thêm Nhà cung cấp.",

            "success"

        );

    }catch(error){

        console.error(

            "Không lưu được Nhà cung cấp:",

            {

                code:
                    error?.code,

                message:
                    error?.message,

                error:
                    error

            }

        );


        if(error?.code === 119){

            showSupplierMessage(

                "Back4App chưa cấp quyền Create hoặc Update cho người dùng đã đăng nhập.",

                "error"

            );

        }else{

            showSupplierMessage(

                `Không lưu được Nhà cung cấp: ${
                    error?.message || error
                }`,

                "error"

            );

        }

    }finally{

        setSupplierSaveBusy(
            false,
            isEditing
        );

    }

}


// =====================================
// THỐNG KÊ
// =====================================

function setSupplierSummaryValue(
    elementId,
    value
){

    const element =
        getSupplierElement(
            elementId
        );


    if(element){

        element.textContent =
            String(value);

    }

}

function updateSupplierSummary(){

    const supplierList =

        Array.isArray(suppliers)

        ? suppliers

        : [];


    const totalCount =
        supplierList.length;


    const withAddressCount =
        supplierList.filter(item =>

            hasSupplierValue(
                item.diachi
            )

        ).length;


    const withPhoneCount =
        supplierList.filter(item =>

            hasSupplierValue(
                item.sdt
            )

        ).length;


    const incompleteCount =
        supplierList.filter(item =>

            !isSupplierComplete(
                item
            )

        ).length;


    setSupplierSummaryValue(
        "totalSupplierCount",
        totalCount
    );


    setSupplierSummaryValue(
        "supplierWithAddressCount",
        withAddressCount
    );


    setSupplierSummaryValue(
        "supplierWithPhoneCount",
        withPhoneCount
    );


    setSupplierSummaryValue(
        "supplierIncompleteCount",
        incompleteCount
    );

}
// =====================================
// HIỂN THỊ + TÌM KIẾM + PHÂN TRANG
// =====================================

function renderSupplier(
    keyword = ""
){

    const table =
        getSupplierElement(
            "supplierTable"
        );


    if(!table){

        return;

    }


    updateSupplierSummary();


    const filteredSuppliers =
        getFilteredSortedSuppliers(
            keyword
        );


    const totalItems =
        filteredSuppliers.length;


    const totalPages =
        getSupplierTotalPages(
            totalItems
        );


    supplierCurrentPage =
        Math.min(

            Math.max(
                1,
                supplierCurrentPage
            ),

            totalPages

        );


    const startIndex =

        (
            supplierCurrentPage - 1
        )

        *

        supplierPageSize;


    const visibleSuppliers =
        filteredSuppliers.slice(

            startIndex,

            startIndex

            +

            supplierPageSize

        );


    updateSupplierSortIcons();


    renderSupplierPagination(
        totalItems
    );


    if(
        visibleSuppliers.length ===
        0
    ){

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="supplier-loading-cell"
                >

                    <div
                        style="
                            font-size:22px;
                            margin-bottom:6px;
                        "
                    >
                        🌿
                    </div>

                    <strong>
                        Chưa có Nhà cung cấp phù hợp
                    </strong>

                    <div
                        style="
                            margin-top:4px;
                            font-size:12px;
                        "
                    >
                        Thử thay đổi từ khóa hoặc bộ lọc dữ liệu.
                    </div>

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        visibleSuppliers

        .map(item => {

            const supplierId =
                escapeSupplierHtml(
                    String(item.id)
                );


            const rawSupplierName =
                String(
                    item.ten || ""
                ).trim();


            const supplierNameHtml =

                rawSupplierName

                ? escapeSupplierHtml(
                    rawSupplierName
                )

                : `

                    <span
                        class="
                            supplier-name-missing
                        "
                    >
                        Chưa có tên
                    </span>

                `;


            const address =
                String(
                    item.diachi || ""
                ).trim();


            const receiver =
                String(
                    item.nguoinhan || ""
                ).trim();


            const phone =
                String(
                    item.sdt || ""
                ).trim();


            const escapedAddress =
                escapeSupplierHtml(
                    address
                );


            const escapedReceiver =
                escapeSupplierHtml(
                    receiver
                );


            const phoneDigits =
                getSupplierPhoneDigits(
                    phone
                );


            const formattedPhone =
                escapeSupplierHtml(

                    formatSupplierPhone(
                        phone
                    )

                );


            return `

                <tr>

                    <td
                        class="supplier-name-cell"
                        title="${
                            escapeSupplierHtml(
                                rawSupplierName
                            )
                        }"
                    >
                        ${supplierNameHtml}
                    </td>


                    <td class="supplier-address-cell">

                        ${
                            address

                            ? `

                                <span
                                    class="
                                        supplier-address-text
                                    "
                                    title="${escapedAddress}"
                                >
                                    📍 ${escapedAddress}
                                </span>

                            `

                            : `

                                <span
                                    class="
                                        supplier-data-missing
                                    "
                                >
                                    Chưa cập nhật
                                </span>

                            `
                        }

                    </td>


                    <td class="supplier-receiver-cell">

                        ${
                            receiver

                            ? escapedReceiver

                            : `

                                <span
                                    class="
                                        supplier-data-missing
                                    "
                                >
                                    Chưa cập nhật
                                </span>

                            `
                        }

                    </td>


                    <td class="supplier-phone-cell">

                        ${
                            phone

                            ? `

                                <a
                                    class="
                                        supplier-phone-link
                                    "
                                    href="tel:${
                                        escapeSupplierHtml(
                                            phoneDigits
                                        )
                                    }"
                                    title="Gọi ${formattedPhone}"
                                >
                                    ☎ ${formattedPhone}
                                </a>

                            `

                            : `

                                <span
                                    class="
                                        supplier-data-missing
                                    "
                                >
                                    Chưa cập nhật
                                </span>

                            `
                        }

                    </td>


                    <td class="supplier-action-cell">

                        <button
                            type="button"
                            class="supplier-edit-button"
                            onclick="
                                editSupplier(
                                    '${supplierId}'
                                )
                            "
                            aria-label="Sửa Nhà cung cấp"
                            title="Sửa Nhà cung cấp"
                        >
                            ✏️
                        </button>


                        <button
                            type="button"
                            class="supplier-delete-button"
                            onclick="
                                deleteSupplier(
                                    '${supplierId}'
                                )
                            "
                            aria-label="Xóa Nhà cung cấp"
                            title="Xóa Nhà cung cấp"
                        >
                            🗑
                        </button>

                    </td>

                </tr>

            `;

        })

        .join("");

}

// =====================================
// CHỈNH SỬA NCC
// =====================================

function editSupplier(id){

    const supplier =
        findLocalSupplierByAnyId(
            id
        );


    if(!supplier){

        showSupplierMessage(

            "Không tìm thấy Nhà cung cấp.",

            "error"

        );


        return;

    }


    editingSupplierId =
        supplier.id;


    setSupplierInputValue(
        "supplierName",
        supplier.ten
    );


    setSupplierInputValue(
        "supplierAddress",
        supplier.diachi
    );


    setSupplierInputValue(
        "supplierReceiver",
        supplier.nguoinhan
    );


    setSupplierInputValue(
        "supplierPhone",
        supplier.sdt
    );


    const form =
        getSupplierElement(
            "supplierForm"
        );


    if(!form){

        console.error(
            "Không tìm thấy id supplierForm"
        );

        return;

    }


    const title =
        getSupplierElement(
            "supplierFormTitle"
        );


    const button =
        getSupplierElement(
            "supplierSaveButton"
        );


    if(title){

        title.textContent =
            "Chỉnh sửa Nhà cung cấp";

    }


    if(button){

        button.disabled =
            false;

        button.textContent =
            "Cập nhật nhà cung cấp";

    }


    form.style.removeProperty(
        "display"
    );


    form.classList.add(
        "is-open"
    );


    form.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "supplier-modal-open"
    );


    requestAnimationFrame(() => {

        getSupplierElement(
            "supplierName"
        )?.focus();

    });

}


// =====================================
// KIỂM TRA LIÊN KẾT TRÊN BACK4APP
// =====================================

async function getSupplierRelationsFromBack4App(
    supplier
){

    ensureSupplierBack4AppReady();


    const validSupplierIds =
        getSupplierValidIds(
            supplier
        );


    if(
        validSupplierIds.length ===
        0
    ){

        return {

            dossierCount: 0,

            letterCount: 0,

            archiveCount: 0,

            totalCount: 0

        };

    }


    function createRelationQuery(
        className
    ){

        const query =
            new Parse.Query(
                className
            );


        query.containedIn(

            "supplierId",

            validSupplierIds

        );


        query.limit(
            1
        );


        return query;

    }


    /*
    Chạy song song để nhanh hơn.
    Chỉ cần biết có ít nhất một liên kết.
    */

    const [

        dossierObject,

        letterObject,

        archiveObject

    ] = await Promise.all([

        createRelationQuery(
            SUPPLIER_DOSSIER_CLASS_NAME
        ).first(),


        createRelationQuery(
            SUPPLIER_LETTER_CLASS_NAME
        ).first(),


        createRelationQuery(
            SUPPLIER_ARCHIVE_CLASS_NAME
        ).first()

    ]);


    const dossierCount =
        dossierObject ? 1 : 0;


    const letterCount =
        letterObject ? 1 : 0;


    const archiveCount =
        archiveObject ? 1 : 0;


    return {

        dossierCount,

        letterCount,

        archiveCount,


        totalCount:

            dossierCount

            +

            letterCount

            +

            archiveCount

    };

}


// =====================================
// XÓA OBJECT NHANH
// =====================================

async function destroySupplierObjectFast(
    supplier
){

    ensureSupplierBack4AppReady();


    const cachedObjectId =
        String(

            supplier?.back4appId

            ||

            ""

        ).trim();


    /*
    Luồng bình thường:
    xóa trực tiếp bằng objectId đã tải từ server.
    */

    if(cachedObjectId){

        const supplierPointer =
            Parse.Object.createWithoutData(

                SUPPLIER_CLASS_NAME,

                cachedObjectId

            );


        try{

            await supplierPointer.destroy();


            return cachedObjectId;

        }catch(error){

            if(error?.code !== 101){

                throw error;

            }


            console.warn(

                "ObjectId cache không xóa được, đang tìm Supplier thật:",

                cachedObjectId

            );

        }

    }


    /*
    Chỉ chạy khi ID cache bị lỗi.
    */

    const actualObject =
        await findSupplierObjectOnBack4App(
            supplier
        );


    if(!actualObject){

        throw new Error(

            "Không tìm thấy Nhà cung cấp trên Back4App."

        );

    }


    const actualObjectId =
        String(
            actualObject.id
        );


    await actualObject.destroy();


    return actualObjectId;

}


// =====================================
// XÓA NCC
// =====================================

async function deleteSupplier(id){

    if(supplierDeleteInProgress){

        showSupplierMessage(

            "Một Nhà cung cấp đang được xử lý.",

            "info"

        );


        return;

    }


    const supplier =
        findLocalSupplierByAnyId(
            id
        );


    if(!supplier){

        showSupplierMessage(

            "Không tìm thấy Nhà cung cấp.",

            "error"

        );


        return;

    }


    /*
    Xác nhận trước để khi bấm Hủy
    không gửi request lên Back4App.
    */

    const confirmed =
        await openSupplierDeleteConfirm(
            supplier.ten
        );


    if(!confirmed){

        return;

    }


    supplierDeleteInProgress =
        true;


    console.time(
        "Thời gian xóa Nhà cung cấp"
    );


    try{

        ensureSupplierBack4AppReady();


        const relations =
            await getSupplierRelationsFromBack4App(
                supplier
            );


        if(relations.totalCount > 0){

            const relationNames =
                [];


            if(relations.dossierCount){

                relationNames.push(
                    "hồ sơ chính"
                );

            }


            if(relations.letterCount){

                relationNames.push(
                    "thư"
                );

            }


            if(relations.archiveCount){

                relationNames.push(
                    "hồ sơ lưu"
                );

            }


            showSupplierMessage(

                `Không thể xóa "${supplier.ten}" vì Nhà cung cấp đang được sử dụng trong ${relationNames.join(", ")}.`,

                "error"

            );


            return;

        }


        const deletedObjectId =
            await destroySupplierObjectFast(
                supplier
            );


        const deletedIds =
            new Set(

                [

                    ...getSupplierValidIds(
                        supplier
                    ),

                    deletedObjectId

                ]

                .filter(Boolean)

                .map(value =>
                    String(value)
                )

            );


        /*
        Xóa ngay khỏi mảng local,
        không tải lại toàn bộ class Supplier.
        */

        suppliers =
            suppliers.filter(item => {

                const itemIds =
                    getSupplierValidIds(
                        item
                    );


                const isDeletedSupplier =
                    itemIds.some(itemId =>

                        deletedIds.has(
                            String(itemId)
                        )

                    );


                return !isDeletedSupplier;

            });


        saveSuppliersToStorage();


        renderSupplier(
            getCurrentSupplierKeyword()
        );


        renderSupplierSelectOptions();


        if(
            editingSupplierId !== null

            &&

            deletedIds.has(
                String(
                    editingSupplierId
                )
            )
        ){

            closeSupplierForm();

        }


        showSupplierMessage(

            `Đã xóa Nhà cung cấp "${supplier.ten}".`,

            "success"

        );

    }catch(error){

        console.error(

            "Không xóa được Nhà cung cấp:",

            {

                code:
                    error?.code,

                message:
                    error?.message,

                error:
                    error

            }

        );


        if(error?.code === 101){

            showSupplierMessage(

                `Không xóa được "${supplier.ten}". Object không tồn tại hoặc ACL không cấp quyền xóa cho tài khoản hiện tại.`,

                "error"

            );

        }else if(error?.code === 119){

            showSupplierMessage(

                `Không xóa được "${supplier.ten}". Back4App chưa bật quyền Delete cho Authenticated.`,

                "error"

            );

        }else{

            showSupplierMessage(

                `Không xóa được Nhà cung cấp: ${
                    error?.message || error
                }`,

                "error"

            );

        }

    }finally{

        supplierDeleteInProgress =
            false;


        console.timeEnd(
            "Thời gian xóa Nhà cung cấp"
        );

    }

}


// =====================================
// DROPDOWN NCC TRONG HỒ SƠ
// =====================================

function renderSupplierSelectOptions(){

    const select =
        getSupplierElement(
            "dossierSupplier"
        );


    if(!select){

        return;

    }


    const currentValue =
        select.value;


    select.innerHTML = `

        <option value="">
            -- Chọn Nhà cung cấp --
        </option>

    `;


    const sortedSuppliers =
        [...suppliers].sort(

            (a, b) =>

                String(a.ten || "")

                .localeCompare(

                    String(
                        b.ten || ""
                    ),

                    "vi"

                )

        );


    sortedSuppliers.forEach(item => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            item.id;


        option.textContent =

            item.ten

            ||

            "Không có tên";


        select.appendChild(
            option
        );

    });


    const valueStillExists =
        suppliers.some(item =>

            String(item.id)

            ===

            String(currentValue)

        );


    select.value =

        valueStillExists

        ? currentValue

        : "";

}


async function loadSupplierSelect(){

    try{

        await fetchSuppliersFromBack4App(
            true
        );


        renderSupplierSelectOptions();


        return [
            ...suppliers
        ];

    }catch(error){

        console.error(

            "Không tải được dropdown Nhà cung cấp:",

            error

        );


        return [];

    }

}


// =====================================
// LÀM MỚI DỮ LIỆU
// =====================================

async function refreshSupplierData(){

    try{

        await fetchSuppliersFromBack4App(
            true
        );


        if(
            getSupplierElement(
                "supplierTable"
            )
        ){

            renderSupplier(
                getCurrentSupplierKeyword()
            );

        }


        renderSupplierSelectOptions();


        showSupplierMessage(

            `Đã đồng bộ ${suppliers.length} Nhà cung cấp từ Back4App.`,

            "info"

        );


        return [
            ...suppliers
        ];

    }catch(error){

        console.error(

            "Không thể làm mới dữ liệu Nhà cung cấp:",

            error

        );


        if(
            getSupplierElement(
                "supplierTable"
            )
        ){

            setSupplierTableMessage(

                error?.message

                ||

                "Không thể tải dữ liệu Nhà cung cấp.",

                true

            );

        }


        return [];

    }

}

document.addEventListener(

    "input",

    function(event){

        if(
            event.target

            &&

            event.target.id ===
            "searchSupplier"
        ){

            supplierCurrentPage =
                1;


            renderSupplier(
                event.target.value
            );

        }

    }

);


document.addEventListener(

    "change",

    function(event){

        if(!event.target){

            return;

        }


        if(
            event.target.id ===
            "supplierStatusFilter"
        ){

            changeSupplierStatusFilter(
                event.target.value
            );


            return;

        }


        if(
            event.target.id ===
            "supplierPageSize"
        ){

            changeSupplierPageSize(
                event.target.value
            );

        }

    }

);

// =====================================
// PHÍM ESCAPE
// =====================================

document.addEventListener(

    "keydown",

    function(event){

        if(
            event.key !==
            "Escape"
        ){

            return;

        }


        const deleteConfirm =
            getSupplierElement(
                "supplierDeleteConfirm"
            );


        if(
            deleteConfirm

            &&

            deleteConfirm.classList.contains(
                "is-open"
            )
        ){

            closeSupplierDeleteConfirm(
                false
            );


            return;

        }


        const form =
            getSupplierElement(
                "supplierForm"
            );


        if(
            form

            &&

            form.classList.contains(
                "is-open"
            )
        ){

            closeSupplierForm();

        }

    }

);


// =====================================
// ĐỒNG BỘ KHI QUAY LẠI TAB
// =====================================

window.addEventListener(

    "focus",

    async function(){

        if(
            !getSupplierElement(
                "supplierTable"
            )
        ){

            return;

        }


        try{

            await fetchSuppliersFromBack4App(
                true
            );


            renderSupplier(
                getCurrentSupplierKeyword()
            );


            renderSupplierSelectOptions();

        }catch(error){

            console.error(

                "Không thể đồng bộ Nhà cung cấp khi quay lại tab:",

                error

            );

        }

    }

);


// =====================================
// ĐƯA HÀM RA WINDOW
// =====================================
window.sortSuppliersBy =
    sortSuppliersBy;


window.goToSupplierPage =
    goToSupplierPage;


window.changeSupplierPage =
    changeSupplierPage;


window.changeSupplierPageSize =
    changeSupplierPageSize;


window.changeSupplierStatusFilter =
    changeSupplierStatusFilter;

window.openSupplierDeleteConfirm =
    openSupplierDeleteConfirm;


window.closeSupplierDeleteConfirm =
    closeSupplierDeleteConfirm;


window.openSupplierForm =
    openSupplierForm;


window.closeSupplierForm =
    closeSupplierForm;


window.saveSupplier =
    saveSupplier;


window.editSupplier =
    editSupplier;


window.deleteSupplier =
    deleteSupplier;


window.loadSupplier =
    loadSupplier;


window.refreshSupplierData =
    refreshSupplierData;


window.loadSupplierSelect =
    loadSupplierSelect;


window.renderSupplier =
    renderSupplier;


window.migrateSuppliersToBack4App =
    migrateSuppliersToBack4App;


window.findSupplierObjectOnBack4App =
    findSupplierObjectOnBack4App;


window.getSuppliersData =
function () {

    return Array.isArray(suppliers)

        ? suppliers.map(item => ({
            ...item
        }))

        : [];

};
