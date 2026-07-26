// =====================================
// LETTER.JS
// Quản lý Thư bằng Back4App
// =====================================

const LETTER_CLASS_NAME =
    "Letter";

const LETTER_MIGRATION_KEY =
    "letterBack4AppMigrationV1";


let letters =
    getLetterStorageArray(
        "letters"
    );

let editLetterId =
    null;

let letterDataLoaded =
    false;

let letterLoadingPromise =
    null;

let letterMigrationPromise =
    null;
// =====================================================
// LETTER MODAL PORTAL
// Đưa popup ra body để không bị giới hạn bởi SPA
// =====================================================

let letterModalMountState =
    null;


function mountLetterModalToBody(){

    const modal =
        getLetterElement(
            "letterModal"
        );


    if(!modal){

        console.error(
            "Không tìm thấy #letterModal."
        );

        return null;

    }


    /*
    Ghi lại vị trí cũ để khi đóng
    có thể đưa modal trở về đúng chỗ.
    */

    if(
        !letterModalMountState

        &&

        modal.parentNode
    ){

        letterModalMountState = {

            parent:
                modal.parentNode,

            nextSibling:
                modal.nextSibling

        };

    }


    if(
        modal.parentNode !==
        document.body
    ){

        document.body.appendChild(
            modal
        );

    }


    return modal;

}


function restoreLetterModalPosition(
    modal
){

    const mountState =
        letterModalMountState;


    letterModalMountState =
        null;


    if(
        !modal

        ||

        !mountState
    ){

        return;

    }


    /*
    Trang Quản lý thư vẫn còn trong DOM.
    Đưa modal về vị trí ban đầu.
    */

    if(
        mountState.parent

        &&

        mountState.parent.isConnected
    ){

        const validNextSibling =

            mountState.nextSibling

            &&

            mountState.nextSibling.parentNode
            ===
            mountState.parent

                ? mountState.nextSibling

                : null;


        mountState.parent.insertBefore(

            modal,

            validNextSibling

        );


        return;

    }


    /*
    Người dùng đã chuyển sang trang khác
    trong lúc modal đang mở.
    */

    modal.remove();

}


// =====================================================
// HIỂN THỊ / ẨN MODAL THƯ
// =====================================================

function setLetterModalVisible(
    isVisible
){

    const modal =

        isVisible

            ? mountLetterModalToBody()

            : getLetterElement(
                "letterModal"
            );


    if(!modal){

        return false;

    }


    modal.classList.toggle(
        "show",
        isVisible
    );


    modal.setAttribute(

        "aria-hidden",

        isVisible

            ? "false"

            : "true"

    );


    modal.style.setProperty(

        "display",

        isVisible

            ? "flex"

            : "none",

        "important"

    );


    document.documentElement
        .classList
        .toggle(
            "letter-modal-open",
            isVisible
        );


    document.body
        .classList
        .toggle(
            "letter-modal-open",
            isVisible
        );


    if(isVisible){

        const modalBody =
            modal.querySelector(
                ".letter-modal-body"
            );


        if(modalBody){

            modalBody.scrollTop =
                0;

        }


        window.requestAnimationFrame(
            function(){

                modalBody?.scrollTo({

                    top:
                        0,

                    behavior:
                        "auto"

                });

            }
        );

    }else{

        restoreLetterModalPosition(
            modal
        );

    }


    return true;

}

// =====================================
// HÀM HỖ TRỢ
// =====================================

function getLetterElement(id){

    return document.getElementById(id);

}


function getLetterValue(
    id,
    defaultValue = ""
){

    const element =
        getLetterElement(id);


    return element

        ? String(
            element.value ??
            defaultValue
        )

        : defaultValue;

}


function setLetterValue(
    id,
    value
){

    const element =
        getLetterElement(id);


    if(element){

        element.value =
            value ?? "";

    }

}
// =====================================
// THỐNG KÊ TRANG THƯ
// =====================================

function setLetterTextContent(
    id,
    value
){

    const element =
        getLetterElement(id);


    if(element){

        element.textContent =
            String(value);

    }

}


function updateLetterDashboard(
    visibleLetters = letters
){

    const safeLetters =
        Array.isArray(letters)
            ? letters
            : [];


    const safeVisibleLetters =
        Array.isArray(visibleLetters)
            ? visibleLetters
            : [];


    const receivedCount =
        safeLetters.filter(

            item =>
                item.type === "Nhận"

        ).length;


    const sentCount =
        safeLetters.filter(

            item =>
                item.type === "Gửi"

        ).length;


    const missingContactCount =
        safeLetters.filter(

            item =>

                !String(
                    item.contact || ""
                ).trim()

        ).length;


    setLetterTextContent(
        "letterTotalCount",
        safeLetters.length
    );


    setLetterTextContent(
        "letterReceivedCount",
        receivedCount
    );


    setLetterTextContent(
        "letterSentCount",
        sentCount
    );


    setLetterTextContent(
        "letterMissingContactCount",
        missingContactCount
    );


    setLetterTextContent(

        "letterResultCount",

        `${safeVisibleLetters.length} kết quả`

    );

}


// =====================================
// THÔNG BÁO GÓC PHẢI
// =====================================

function getLetterToastTitle(type){

    switch(type){

        case "success":
            return "Thành công";

        case "warning":
            return "Cần kiểm tra";

        case "error":
            return "Có lỗi xảy ra";

        default:
            return "Thông báo";

    }

}


window.showLetterToast =
function(
    message,
    type = "info",
    duration = 3200
){

    let region =
        getLetterElement(
            "letterToastRegion"
        );


    if(!region){

        region =
            document.createElement(
                "div"
            );


        region.id =
            "letterToastRegion";


        region.className =
            "letter-toast-region";


        region.setAttribute(
            "aria-live",
            "polite"
        );


        document.body.appendChild(
            region
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `letter-toast is-${type}`;


    toast.style.setProperty(

        "--toast-duration",

        `${duration}ms`

    );


    toast.innerHTML = `

        <span
            class="letter-toast-dot"
            aria-hidden="true"
        ></span>

        <div class="letter-toast-content">

            <strong>
                ${escapeLetterHtml(
                    getLetterToastTitle(type)
                )}
            </strong>

            <p>
                ${escapeLetterHtml(message)}
            </p>

        </div>

        <button
            type="button"
            class="letter-toast-close"
            aria-label="Đóng thông báo"
        >
            ×
        </button>

        <span
            class="letter-toast-progress"
            aria-hidden="true"
        ></span>

    `;


    function removeToast(){

        if(
            toast.classList.contains(
                "is-leaving"
            )
        ){

            return;

        }


        toast.classList.add(
            "is-leaving"
        );


        window.setTimeout(

            () => toast.remove(),

            210

        );

    }


    toast
    .querySelector(
        ".letter-toast-close"
    )
    ?.addEventListener(
        "click",
        removeToast
    );


    region.appendChild(
        toast
    );


    window.setTimeout(
        removeToast,
        duration
    );

};


// =====================================
// ĐẶT LẠI BỘ LỌC
// =====================================

window.resetLetterFilters =
function(){

    setLetterValue(
        "letterSearch",
        ""
    );


    setLetterValue(
        "letterTypeFilter",
        ""
    );


    setLetterValue(
        "letterSupplierFilter",
        ""
    );


    setLetterValue(
        "letterSort",
        "newest"
    );


    setLetterValue(
        "letterDateFrom",
        ""
    );


    setLetterValue(
        "letterDateTo",
        ""
    );


    filterLetters();


    showLetterToast(

        "Đã đưa bộ lọc về trạng thái mặc định.",

        "info"

    );

};

function normalizeLetterText(value){

    return String(value || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


function escapeLetterHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


function getLetterStorageArray(key){

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


function saveLettersToStorage(){

    try{

        localStorage.setItem(

            "letters",

            JSON.stringify(letters)

        );

    }catch(error){

        console.error(
            "Không cập nhật được cache Thư:",
            error
        );

    }

}


function ensureLetterBack4AppReady(){

    if(typeof Parse === "undefined"){

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


    if(!Parse.User.current()){

        throw new Error(
            "Phiên đăng nhập không còn hiệu lực."
        );

    }

}


function getSupplierList(){

    if(
        typeof window.getSuppliersData ===
        "function"
    ){

        const data =
            window.getSuppliersData();


        return Array.isArray(data)
            ? data
            : [];

    }


    if(
        typeof suppliers !== "undefined"
        &&
        Array.isArray(suppliers)
    ){

        return suppliers;

    }


    return [];

}

// =====================================================
// NHẬN DIỆN NHÀ CUNG CẤP
// =====================================================

function getLetterSupplierStableId(
    supplier
){

    if(!supplier){

        return "";

    }


    return String(

        supplier.id

        ||

        supplier.back4appId

        ||

        supplier.objectId

        ||

        supplier.legacyId

        ||

        ""

    ).trim();

}


function getLetterSupplierIdentifiers(
    supplier
){

    if(!supplier){

        return [];

    }


    return [

        supplier.id,

        supplier.back4appId,

        supplier.objectId,

        supplier.legacyId

    ]
    .filter(Boolean)
    .map(value =>
        String(value)
    );

}


function getLetterSupplierCode(
    supplier
){

    if(!supplier){

        return "";

    }


    return String(

        supplier.code

        ||

        supplier.ma

        ||

        supplier.maNCC

        ||

        supplier.supplierCode

        ||

        ""

    ).trim();

}


function getLetterSupplierDisplayName(
    supplier
){

    if(!supplier){

        return "";

    }


    return String(

        supplier.ten

        ||

        supplier.name

        ||

        "Không có tên"

    ).trim();

}


function getLetterSupplierLabel(
    supplier
){

    if(!supplier){

        return "";

    }


    const code =
        getLetterSupplierCode(
            supplier
        );


    const name =
        getLetterSupplierDisplayName(
            supplier
        );


    return code

        ? `${code} - ${name}`

        : name;

}


// =====================================================
// TÌM NHÀ CUNG CẤP THEO ID
// =====================================================

function getLetterSupplierById(
    supplierId
){

    const targetId =
        String(
            supplierId || ""
        );


    return getSupplierList()
        .find(supplier =>

            getLetterSupplierIdentifiers(
                supplier
            )
            .includes(
                targetId
            )

        );

}


function getSupplierName(
    supplierId
){

    const supplier =
        getLetterSupplierById(
            supplierId
        );


    if(!supplier){

        return "Nhà cung cấp đã xóa";

    }


    return getLetterSupplierDisplayName(
        supplier
    );

}


// =====================================================
// TÌM NHÀ CUNG CẤP TỪ NỘI DUNG ĐANG NHẬP
// =====================================================

function resolveLetterSupplierFromSearch(){

    const searchInput =
        getLetterElement(
            "letterSupplierSearch"
        );


    const supplierField =
        getLetterElement(
            "letterSupplier"
        );


    /*
    Tương thích HTML cũ dùng select.
    */

    if(
        supplierField

        &&

        supplierField.tagName ===
        "SELECT"
    ){

        const supplier =
            getLetterSupplierById(
                supplierField.value
            );


        return {

            supplier,

            ambiguous:
                false

        };

    }


    if(!searchInput){

        const supplier =
            getLetterSupplierById(
                supplierField?.value
            );


        return {

            supplier,

            ambiguous:
                false

        };

    }


    const rawInput =
        String(
            searchInput.value || ""
        ).trim();


    const normalizedInput =
        normalizeLetterText(
            rawInput
        );


    if(!normalizedInput){

        return {

            supplier:
                null,

            ambiguous:
                false

        };

    }


    const supplierList =
        getSupplierList();


    /*
    Ưu tiên khớp chính xác:
    - Nhãn đầy đủ
    - Tên
    - Mã nhà cung cấp
    */

    const exactSupplier =
        supplierList.find(supplier => {

            const values = [

                getLetterSupplierLabel(
                    supplier
                ),

                getLetterSupplierDisplayName(
                    supplier
                ),

                getLetterSupplierCode(
                    supplier
                )

            ];


            return values.some(value =>

                normalizeLetterText(value)

                ===

                normalizedInput

            );

        });


    if(exactSupplier){

        return {

            supplier:
                exactSupplier,

            ambiguous:
                false

        };

    }


    /*
    Cho phép nhập một phần tên/mã,
    nhưng chỉ tự chọn khi có đúng một kết quả.
    */

    const partialMatches =
        supplierList.filter(supplier => {

            const searchText =
                normalizeLetterText(`

                    ${getLetterSupplierCode(
                        supplier
                    )}

                    ${getLetterSupplierDisplayName(
                        supplier
                    )}

                    ${getLetterSupplierLabel(
                        supplier
                    )}

                `);


            return searchText.includes(
                normalizedInput
            );

        });


    if(partialMatches.length === 1){

        return {

            supplier:
                partialMatches[0],

            ambiguous:
                false

        };

    }


    return {

        supplier:
            null,

        ambiguous:
            partialMatches.length > 1

    };

}


// =====================================================
// XỬ LÝ Ô TÌM NHÀ CUNG CẤP
// =====================================================

window.handleLetterSupplierSearchChange =
function(
    commitSelection = false
){

    const searchInput =
        getLetterElement(
            "letterSupplierSearch"
        );


    const supplierField =
        getLetterElement(
            "letterSupplier"
        );


    const hint =
        getLetterElement(
            "letterSupplierSearchHint"
        );


    if(!supplierField){

        console.error(
            "Không tìm thấy #letterSupplier."
        );


        return "";

    }


    /*
    HTML cũ dùng select.
    */

    if(
        supplierField.tagName ===
        "SELECT"
    ){

        return String(
            supplierField.value || ""
        );

    }


    const result =
        resolveLetterSupplierFromSearch();


    const supplier =
        result.supplier;


    const supplierId =
        supplier

            ? getLetterSupplierStableId(
                supplier
            )

            : "";


    supplierField.value =
        supplierId;


    const hasText =
        Boolean(

            String(
                searchInput?.value || ""
            ).trim()

        );


    if(supplier && commitSelection){

        searchInput.value =
            getLetterSupplierLabel(
                supplier
            );

    }


    if(hint){

        hint.classList.remove(
            "is-valid",
            "is-invalid"
        );


        if(!hasText){

            hint.textContent =
                "Nhập tên hoặc mã, sau đó chọn một nhà cung cấp trong danh sách.";

        }else if(supplierId){

            hint.textContent =
                "Đã chọn đúng nhà cung cấp.";


            hint.classList.add(
                "is-valid"
            );

        }else if(result.ambiguous){

            hint.textContent =
                "Có nhiều nhà cung cấp phù hợp. Hãy nhập thêm ký tự hoặc chọn trong danh sách.";


            hint.classList.add(
                "is-invalid"
            );

        }else{

            hint.textContent =
                "Không tìm thấy nhà cung cấp phù hợp.";


            hint.classList.add(
                "is-invalid"
            );

        }

    }


    return supplierId;

};


// =====================================================
// GÁN NHÀ CUNG CẤP KHI SỬA THƯ
// =====================================================

function setLetterSupplierById(
    supplierId
){

    const supplier =
        getLetterSupplierById(
            supplierId
        );


    const stableId =
        supplier

            ? getLetterSupplierStableId(
                supplier
            )

            : String(
                supplierId || ""
            );


    setLetterValue(
        "letterSupplier",
        stableId
    );


    setLetterValue(

        "letterSupplierSearch",

        supplier

            ? getLetterSupplierLabel(
                supplier
            )

            : ""

    );


    const hint =
        getLetterElement(
            "letterSupplierSearchHint"
        );


    if(hint){

        hint.classList.remove(
            "is-valid",
            "is-invalid"
        );


        if(supplier){

            hint.textContent =
                "Đã chọn đúng nhà cung cấp.";


            hint.classList.add(
                "is-valid"
            );

        }else{

            hint.textContent =
                "Nhập tên hoặc mã, sau đó chọn một nhà cung cấp trong danh sách.";

        }

    }

}

function setLetterSaveBusy(
    isBusy,
    isEditing
){

    const button =

        getLetterElement(
            "letterSaveButton"
        )

        ||

        document.querySelector(
            ".letter-save-button"
        );


    if(!button){

        return;

    }


    button.disabled =
        Boolean(isBusy);


    button.textContent =

        isBusy

        ? "Đang lưu..."

        : (
            isEditing

            ? "Cập nhật thư"

            : "Lưu thông tin"
        );

}
function setLetterTableMessage(
    message,
    isError = false
){

    const table =
        getLetterElement(
            "letterTable"
        );


    if(!table){

        return;

    }


    setLetterTextContent(
        "letterResultCount",
        "0 kết quả"
    );


    table.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="letter-empty-row"
                style="
                    color:${
                        isError
                        ? "#b64f54"
                        : "#778078"
                    };
                    padding:34px 20px;
                    text-align:center;
                "
            >
                ${escapeLetterHtml(message)}
            </td>

        </tr>

    `;

}
// =====================================
// THỜI GIAN TẠO THƯ
// =====================================

function getLetterCreatedTime(item){

    const createdTime =
        Date.parse(
            item?.createdAt || ""
        );


    if(Number.isFinite(createdTime)){

        return createdTime;

    }


    const updatedTime =
        Date.parse(
            item?.updatedAt || ""
        );


    if(Number.isFinite(updatedTime)){

        return updatedTime;

    }


    const legacyIdTime =
        Number(item?.legacyId);


    if(
        Number.isFinite(legacyIdTime)

        &&

        legacyIdTime > 0
    ){

        return legacyIdTime;

    }


    const idTime =
        Number(item?.id);


    if(
        Number.isFinite(idTime)

        &&

        idTime > 0
    ){

        return idTime;

    }


    const letterDateTime =
        Date.parse(
            item?.date || ""
        );


    return Number.isFinite(letterDateTime)

        ? letterDateTime

        : 0;

}


// =====================================
// SẮP XẾP DANH SÁCH THƯ
// =====================================

function sortLetterData(
    data,
    sortMode = "newest"
){

    const sortedData =
        Array.isArray(data)

        ? [...data]

        : [];


    sortedData.sort((a, b) => {

        const aContact =
            String(
                a?.contact || ""
            ).trim();


        const bContact =
            String(
                b?.contact || ""
            ).trim();


        switch(sortMode){

            /*
            Thư tạo cũ nằm trên.
            */

            case "oldest":

                return (

                    getLetterCreatedTime(a)

                    -

                    getLetterCreatedTime(b)

                );


            /*
            Người gửi/nhận A → Z.
            Những thư không có người liên hệ
            được đẩy xuống cuối.
            */

            case "az":

                if(
                    !aContact

                    &&

                    bContact
                ){

                    return 1;

                }


                if(
                    aContact

                    &&

                    !bContact
                ){

                    return -1;

                }


                return (

                    aContact.localeCompare(

                        bContact,

                        "vi",

                        {
                            sensitivity:
                                "base",

                            numeric:
                                true
                        }

                    )

                    ||

                    (
                        getLetterCreatedTime(b)

                        -

                        getLetterCreatedTime(a)
                    )

                );


            /*
            Người gửi/nhận Z → A.
            Những thư không có người liên hệ
            vẫn nằm cuối.
            */

            case "za":

                if(
                    !aContact

                    &&

                    bContact
                ){

                    return 1;

                }


                if(
                    aContact

                    &&

                    !bContact
                ){

                    return -1;

                }


                return (

                    bContact.localeCompare(

                        aContact,

                        "vi",

                        {
                            sensitivity:
                                "base",

                            numeric:
                                true
                        }

                    )

                    ||

                    (
                        getLetterCreatedTime(b)

                        -

                        getLetterCreatedTime(a)
                    )

                );


            /*
            Mặc định:
            thư vừa tạo nằm trên.
            */

            case "newest":

            default:

                return (

                    getLetterCreatedTime(b)

                    -

                    getLetterCreatedTime(a)

                );

        }

    });


    return sortedData;

}


// =====================================
// SẮP XẾP MẢNG THƯ CHÍNH
// =====================================

function sortLetters(
    sortMode = "newest"
){

    letters =
        sortLetterData(
            letters,
            sortMode
        );


    return letters;

}

// =====================================
// PARSE OBJECT → OBJECT THƯỜNG
// =====================================

function letterParseObjectToPlain(
    parseObject,
    fallbackLetter = null
){

    const fallbackLegacyId =

        fallbackLetter

        &&

        fallbackLetter.id

        &&

        String(fallbackLetter.id)

        !==

        String(
            fallbackLetter.back4appId ||
            ""
        )

        ? String(fallbackLetter.id)

        : "";


    const legacyId =
        String(

            parseObject.get(
                "legacyId"
            )

            ||

            fallbackLetter?.legacyId

            ||

            fallbackLegacyId

            ||

            ""

        ).trim();


    const back4appId =
        String(

            parseObject.id

            ||

            fallbackLetter?.back4appId

            ||

            ""

        );


    return {

        id:
            legacyId

            ||

            back4appId

            ||

            fallbackLetter?.id

            ||

            "",


        legacyId:
            legacyId,


        back4appId:
            back4appId,


        type:
            String(

                parseObject.get("type")

                ??

                fallbackLetter?.type

                ??

                "Nhận"

            ),


        date:
            String(

                parseObject.get("date")

                ??

                fallbackLetter?.date

                ??

                ""

            ),


        number:
            String(

                parseObject.get("number")

                ??

                fallbackLetter?.number

                ??

                ""

            ),


        supplierId:
            String(

                parseObject.get(
                    "supplierId"
                )

                ??

                fallbackLetter?.supplierId

                ??

                ""

            ),


        channel:
            String(

                parseObject.get(
                    "channel"
                )

                ??

                fallbackLetter?.channel

                ??

                "Bưu điện"

            ),


        contact:
            String(

                parseObject.get(
                    "contact"
                )

                ??

                fallbackLetter?.contact

                ??

                ""

            ),


        subject:
            String(

                parseObject.get(
                    "subject"
                )

                ??

                fallbackLetter?.subject

                ??

                ""

            ),


        note:
            String(

                parseObject.get("note")

                ??

                fallbackLetter?.note

                ??

                ""

            ),


        createdAt:

            parseObject.createdAt

            ? parseObject.createdAt
                .toISOString()

            : (
                fallbackLetter?.createdAt
                ||
                ""
            ),


        updatedAt:

            parseObject.updatedAt

            ? parseObject.updatedAt
                .toISOString()

            : (
                fallbackLetter?.updatedAt
                ||
                ""
            )

    };

}


// =====================================
// GÁN DỮ LIỆU CHO PARSE OBJECT
// =====================================

function setLetterParseFields(
    letterObject,
    data
){

    letterObject.set(
        "type",
        String(
            data.type || "Nhận"
        )
    );


    letterObject.set(
        "date",
        String(
            data.date || ""
        )
    );


    letterObject.set(
        "number",
        String(
            data.number || ""
        ).trim()
    );


    letterObject.set(
        "numberNormalized",
        normalizeLetterText(
            data.number
        )
    );


    letterObject.set(
        "supplierId",
        String(
            data.supplierId || ""
        )
    );


    letterObject.set(
        "channel",
        String(
            data.channel ||
            "Bưu điện"
        )
    );


    letterObject.set(
        "contact",
        String(
            data.contact || ""
        )
    );


    letterObject.set(
        "subject",
        String(
            data.subject || ""
        )
    );


    letterObject.set(
        "note",
        String(
            data.note || ""
        )
    );

}


// =====================================
// TÌM THƯ ĐÃ MIGRATE
// =====================================

async function findExistingLetterForMigration(
    item
){

    const back4appId =
        String(
            item.back4appId || ""
        ).trim();


    if(back4appId){

        try{

            const query =
                new Parse.Query(
                    LETTER_CLASS_NAME
                );


            return await query.get(
                back4appId
            );

        }catch(error){

            // Kiểm tra tiếp bằng ID cũ.

        }

    }


    const legacyId =
        String(
            item.id || ""
        ).trim();


    if(!legacyId){

        return null;

    }


    const query =
        new Parse.Query(
            LETTER_CLASS_NAME
        );


    query.equalTo(
        "legacyId",
        legacyId
    );


    return await query.first();

}


// =====================================
// MIGRATE THƯ CŨ
// =====================================

async function migrateLettersToBack4App(
    force = false
){

    if(letterMigrationPromise){

        return letterMigrationPromise;

    }


    letterMigrationPromise =
        (async function(){

            ensureLetterBack4AppReady();


            if(
                !force

                &&

                localStorage.getItem(
                    LETTER_MIGRATION_KEY
                )
            ){

                return {

                    migrated: 0,

                    skipped: 0,

                    failed: 0,

                    alreadyCompleted: true

                };

            }


            const oldLetters =
                getLetterStorageArray(
                    "letters"
                );


            const currentUser =
                Parse.User.current();


            let migrated = 0;

            let skipped = 0;

            let failed = 0;


            for(
                const item
                of oldLetters
            ){

                try{

                    const number =
                        String(
                            item.number || ""
                        ).trim();


                    const date =
                        String(
                            item.date || ""
                        ).trim();


                    const supplierId =
                        String(
                            item.supplierId || ""
                        ).trim();


                    const subject =
                        String(
                            item.subject || ""
                        ).trim();


                    if(
                        !number

                        ||

                        !date

                        ||

                        !supplierId

                        ||

                        !subject
                    ){

                        failed += 1;


                        console.warn(
                            "Bỏ qua thư thiếu dữ liệu:",
                            item
                        );


                        continue;

                    }


                    const existingLetter =
                        await findExistingLetterForMigration(
                            item
                        );


                    const legacyId =
                        String(
                            item.id || ""
                        ).trim();


                    if(existingLetter){

                        if(
                            legacyId

                            &&

                            !existingLetter.get(
                                "legacyId"
                            )
                        ){

                            existingLetter.set(
                                "legacyId",
                                legacyId
                            );


                            await existingLetter.save();

                        }


                        skipped += 1;

                        continue;

                    }


                    const letterObject =
                        new Parse.Object(
                            LETTER_CLASS_NAME
                        );


                    setLetterParseFields(
                        letterObject,
                        item
                    );


                    if(legacyId){

                        letterObject.set(
                            "legacyId",
                            legacyId
                        );

                    }


                    if(currentUser){

                        letterObject.set(
                            "createdBy",
                            currentUser
                        );


                        letterObject.set(
                            "updatedBy",
                            currentUser
                        );

                    }


                    await letterObject.save();


                    migrated += 1;

                }catch(error){

                    failed += 1;


                    console.error(
                        "Không migrate được một thư:",
                        item,
                        error
                    );

                }

            }


            const report = {

                completedAt:
                    new Date()
                    .toISOString(),

                migrated:
                    migrated,

                skipped:
                    skipped,

                failed:
                    failed

            };


            if(failed === 0){

                localStorage.setItem(

                    LETTER_MIGRATION_KEY,

                    JSON.stringify(report)

                );

            }


            console.log(
                "✅ Migrate Thư hoàn tất:",
                report
            );


            return {

                migrated,
                skipped,
                failed,
                alreadyCompleted: false

            };

        })();


    try{

        return await letterMigrationPromise;

    }finally{

        letterMigrationPromise =
            null;

    }

}


// =====================================
// TẢI THƯ TỪ BACK4APP
// =====================================

async function fetchLettersFromBack4App(
    forceReload = false
){

    ensureLetterBack4AppReady();


    if(
        letterDataLoaded

        &&

        !forceReload
    ){

        return letters;

    }


    if(letterLoadingPromise){

        return letterLoadingPromise;

    }


    letterLoadingPromise =
        (async function(){

            const query =
                new Parse.Query(
                    LETTER_CLASS_NAME
                );


            query.descending("createdAt");


            query.limit(1000);


            const results =
                await query.find();


            letters =
                results.map(

                    item =>

                        letterParseObjectToPlain(
                            item
                        )

                );


            sortLetters();


            letterDataLoaded =
                true;


            saveLettersToStorage();


            return letters;

        })();


    try{

        return await letterLoadingPromise;

    }finally{

        letterLoadingPromise =
            null;

    }

}


// =====================================
// DROPDOWN NHÀ CUNG CẤP
// =====================================

async function ensureLetterSuppliersLoaded(){

    if(
        typeof window.loadSupplierSelect ===
        "function"
    ){

        await window.loadSupplierSelect();

    }


    loadLetterSupplierOptions();

}

// =====================================================
// TẢI DANH SÁCH NHÀ CUNG CẤP
// =====================================================

function loadLetterSupplierOptions(){

    const supplierSearch =
        getLetterElement(
            "letterSupplierSearch"
        );


    const supplierField =
        getLetterElement(
            "letterSupplier"
        );


    const supplierDatalist =
        getLetterElement(
            "letterSupplierList"
        );


    const supplierFilter =
        getLetterElement(
            "letterSupplierFilter"
        );


    const supplierList =
        [...getSupplierList()]
        .filter(supplier =>

            getLetterSupplierStableId(
                supplier
            ) !== ""

        )
        .sort((a, b) =>

            getLetterSupplierLabel(a)
                .localeCompare(

                    getLetterSupplierLabel(b),

                    "vi",

                    {
                        sensitivity:
                            "base",

                        numeric:
                            true
                    }

                )

        );


    const currentSupplierId =
        String(
            supplierField?.value || ""
        );


    const currentSupplierSearch =
        String(
            supplierSearch?.value || ""
        );


    const currentFilterValue =
        String(
            supplierFilter?.value || ""
        );


    // =====================================================
    // FORM MỚI DÙNG INPUT + DATALIST
    // =====================================================

    if(supplierDatalist){

        supplierDatalist.innerHTML =
            "";


        supplierList.forEach(
            supplier => {

                const supplierId =
                    getLetterSupplierStableId(
                        supplier
                    );


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    getLetterSupplierLabel(
                        supplier
                    );


                option.dataset.id =
                    supplierId;


                supplierDatalist.appendChild(
                    option
                );

            }
        );

    }


    // =====================================================
    // TƯƠNG THÍCH FORM CŨ DÙNG SELECT
    // =====================================================

    if(
        supplierField

        &&

        supplierField.tagName ===
        "SELECT"
    ){

        supplierField.innerHTML =
            "";


        const defaultOption =
            document.createElement(
                "option"
            );


        defaultOption.value =
            "";


        defaultOption.textContent =
            "-- Chọn nhà cung cấp --";


        supplierField.appendChild(
            defaultOption
        );


        supplierList.forEach(
            supplier => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    getLetterSupplierStableId(
                        supplier
                    );


                option.textContent =
                    getLetterSupplierLabel(
                        supplier
                    );


                supplierField.appendChild(
                    option
                );

            }
        );

    }


    // =====================================================
    // SELECT LỌC NGOÀI BẢNG
    // =====================================================

    if(supplierFilter){

        supplierFilter.innerHTML =
            "";


        const defaultOption =
            document.createElement(
                "option"
            );


        defaultOption.value =
            "";


        defaultOption.textContent =
            "Tất cả nhà cung cấp";


        supplierFilter.appendChild(
            defaultOption
        );


        supplierList.forEach(
            supplier => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    getLetterSupplierStableId(
                        supplier
                    );


                option.textContent =
                    getLetterSupplierLabel(
                        supplier
                    );


                supplierFilter.appendChild(
                    option
                );

            }
        );


        const filterStillExists =
            supplierList.some(
                supplier =>

                    getLetterSupplierIdentifiers(
                        supplier
                    )
                    .includes(
                        currentFilterValue
                    )

            );


        supplierFilter.value =

            filterStillExists

                ? currentFilterValue

                : "";

    }


    // =====================================================
    // KHÔI PHỤC NHÀ CUNG CẤP TRONG FORM
    // =====================================================

    if(currentSupplierId){

        const selectedSupplier =
            getLetterSupplierById(
                currentSupplierId
            );


        if(selectedSupplier){

            const stableId =
                getLetterSupplierStableId(
                    selectedSupplier
                );


            setLetterValue(
                "letterSupplier",
                stableId
            );


            setLetterValue(

                "letterSupplierSearch",

                getLetterSupplierLabel(
                    selectedSupplier
                )

            );

        }else{

            setLetterValue(
                "letterSupplier",
                ""
            );

        }

    }else if(supplierSearch){

        supplierSearch.value =
            currentSupplierSearch;

    }

}

async function initializeLetterPage(){

    setLetterTableMessage(
        "Đang tải dữ liệu thư..."
    );


    try{

        await ensureLetterSuppliersLoaded();

        await migrateLettersToBack4App();

        await fetchLettersFromBack4App(
            true
        );

        resetLetterForm();

        setLetterValue(
    "letterSort",
    "newest"
);


setLetterValue(
    "letterDateFrom",
    ""
);


setLetterValue(
    "letterDateTo",
    ""
);

        loadLetterSupplierOptions();

        filterLetters();

    }catch(error){

        console.error(
            "Không khởi tạo được trang Thư:",
            error
        );


        setLetterTableMessage(

            error.message

            ||

            "Không tải được dữ liệu thư.",

            true

        );

        setLetterValue(
    "letterDateFrom",
    ""
);

setLetterValue(
    "letterDateTo",
    ""
);

    }

}

async function loadLetters(){

    await migrateLettersToBack4App();


    await fetchLettersFromBack4App(
        true
    );


    filterLetters();


    return letters;

}

// =====================================================
// ĐẶT LẠI FORM THƯ
// =====================================================

function resetLetterForm(){

    editLetterId =
        null;


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    setLetterValue(
        "letterType",
        "Nhận"
    );


    setLetterValue(

        "letterDate",

        `${year}-${month}-${day}`

    );


    setLetterValue(
        "letterNumber",
        ""
    );


    setLetterValue(
        "letterSupplier",
        ""
    );

    setLetterValue(
    "letterSupplierSearch",
    ""
);


const supplierHint =
    getLetterElement(
        "letterSupplierSearchHint"
    );


if(supplierHint){

    supplierHint.textContent =
        "Nhập tên hoặc mã, sau đó chọn một nhà cung cấp trong danh sách.";


    supplierHint.classList.remove(
        "is-valid",
        "is-invalid"
    );

}


    setLetterValue(
        "letterContact",
        ""
    );


    setLetterValue(
        "letterSubject",
        ""
    );


    setLetterValue(
        "letterNote",
        ""
    );

}
window.openLetterModal =
async function(){

    /*
    Luôn đưa form về trạng thái tạo mới.
    */

    resetLetterForm();


    const modal =
        getLetterElement(
            "letterModal"
        );


    if(!modal){

        console.error(
            "Không tìm thấy #letterModal."
        );


        window.showLetterToast(

            "Không tìm thấy popup tạo thư.",

            "error"

        );


        return;

    }


    const title =
        getLetterElement(
            "letterModalTitle"
        );


    if(title){

        title.textContent =
            "Tạo thư mới";

    }


    setLetterSaveBusy(
        false,
        false
    );


    /*
    Mở popup ngay, không chờ Back4App
    hoặc danh sách Nhà cung cấp.
    */

    const opened =
        setLetterModalVisible(
            true
        );


    if(!opened){

        window.showLetterToast(

            "Không thể mở popup tạo thư.",

            "error"

        );


        return;

    }


    /*
    Đặt ngày hiện tại theo giờ địa phương,
    tránh lệch ngày do toISOString().
    */

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    setLetterValue(

        "letterDate",

        `${year}-${month}-${day}`

    );


    window.setTimeout(
        function(){

            getLetterElement(
                "letterType"
            )?.focus();

        },
        60
    );


    /*
    Tải Nhà cung cấp sau khi form đã mở.
    Lỗi tải Nhà cung cấp không được làm
    popup tự đóng hoặc biến mất.
    */

    try{

        await ensureLetterSuppliersLoaded();


        /*
        Bảo đảm form vẫn đang ở chế độ tạo mới.
        */

        if(editLetterId === null){

            setLetterValue(
                "letterSupplier",
                ""
            );

        }

    }catch(error){

        console.error(
            "Không tải được Nhà cung cấp:",
            error
        );


        window.showLetterToast(

            "Popup đã mở nhưng chưa tải được danh sách Nhà cung cấp.",

            "warning",

            4500

        );

    }

};
// =====================================================
// ĐÓNG FORM THƯ
// =====================================================

window.closeLetterModal =
function(){

    const closed =
        setLetterModalVisible(
            false
        );


    if(!closed){

        return;

    }


    editLetterId =
        null;


    setLetterSaveBusy(
        false,
        false
    );

};
// =====================================
// LƯU / CẬP NHẬT THƯ
// =====================================

window.saveLetter =
async function(){

    const type =
        getLetterValue(
            "letterType",
            "Nhận"
        ).trim()

        ||

        "Nhận";


    const date =
        getLetterValue(
            "letterDate"
        ).trim();


    const number =
        getLetterValue(
            "letterNumber"
        ).trim();

    /*
/*
Khi bấm Lưu, hệ thống tự xác nhận lại
Nhà cung cấp từ mã hoặc tên đã nhập.
*/

const supplierId =
    window.handleLetterSupplierSearchChange(
        true
    );


    const contact =
        getLetterValue(
            "letterContact"
        ).trim();


    const subject =
        getLetterValue(
            "letterSubject"
        ).trim();


    const note =
        getLetterValue(
            "letterNote"
        ).trim();


    if(!date){

        showLetterToast(

    "Vui lòng chọn ngày nhận hoặc gửi thư.",

    "warning"

);


        return;

    }


    if(!number){

        showLetterToast(
    "Vui lòng nhập số thư.",
    "warning"
);

        return;

    }

if(!supplierId){

    showLetterToast(

        "Vui lòng nhập và chọn đúng Nhà cung cấp trong danh sách gợi ý.",

        "warning"

    );


    getLetterElement(
        "letterSupplierSearch"
    )?.focus();


    return;

}


    if(!subject){

        showLetterToast(
    "Vui lòng nhập nội dung thư.",
    "warning"
);


        return;

    }


    const isEditing =
        editLetterId !== null;


    const data = {

        type:
            type,

        date:
            date,

        number:
            number,

        supplierId:
            supplierId,

        channel:
            "Bưu điện",

        contact:
            contact,

        subject:
            subject,

        note:
            note

    };


    setLetterSaveBusy(
        true,
        isEditing
    );


    console.time(
        "Thời gian lưu Thư"
    );


    try{

        ensureLetterBack4AppReady();


        if(!letterDataLoaded){

            await fetchLettersFromBack4App(
                true
            );

        }


        const editingLetter =

    isEditing

    ? letters.find(item => {

        const identifiers = [

            item.id,

            item.legacyId,

            item.back4appId

        ]
        .filter(Boolean)
        .map(value =>
            String(value)
        );


        return identifiers.includes(
            String(editLetterId)
        );

    })

    : null;


        if(
            isEditing

            &&

            !editingLetter
        ){

            throw new Error(
                "Không tìm thấy thư cần chỉnh sửa."
            );

        }


        let letterObject;


        if(isEditing){

            const back4appId =
                String(

                    editingLetter.back4appId

                    ||

                    ""

                );


            if(!back4appId){

                throw new Error(
                    "Thư chưa có objectId trên Back4App."
                );

            }


            letterObject =
                Parse.Object.createWithoutData(

                    LETTER_CLASS_NAME,

                    back4appId

                );


            const legacyId =
                String(

                    editingLetter.legacyId

                    ||

                    (
                        String(
                            editingLetter.id
                        )

                        !==

                        back4appId

                        ? editingLetter.id

                        : ""
                    )

                ).trim();


            if(legacyId){

                letterObject.set(
                    "legacyId",
                    legacyId
                );

            }

        }else{

            letterObject =
                new Parse.Object(
                    LETTER_CLASS_NAME
                );

        }


        setLetterParseFields(
            letterObject,
            data
        );


        const currentUser =
            Parse.User.current();


        if(
            !isEditing

            &&

            currentUser
        ){

            letterObject.set(
                "createdBy",
                currentUser
            );

        }


        if(currentUser){

            letterObject.set(
                "updatedBy",
                currentUser
            );

        }


        const savedObject =
            await letterObject.save();


        const savedLetter =
            letterParseObjectToPlain(

                savedObject,

                editingLetter

            );


        if(isEditing){

            const index =
    letters.findIndex(item => {

        const identifiers = [

            item.id,

            item.legacyId,

            item.back4appId

        ]
        .filter(Boolean)
        .map(value =>
            String(value)
        );


        return identifiers.includes(
            String(editLetterId)
        );

    });


            if(index !== -1){

                letters[index] =
                    savedLetter;

            }

        }else{

    /*
    Thư mới được đưa vào đầu mảng ngay.
    filterLetters() vẫn tiếp tục sắp xếp
    theo lựa chọn hiện tại.
    */

    letters.unshift(
        savedLetter
    );

}


        sortLetters();


        saveLettersToStorage();


        closeLetterModal();


        resetLetterForm();


        filterLetters();


        showLetterToast(

    isEditing

    ? "Đã cập nhật thông tin thư."

    : "Đã tạo thư mới thành công.",

    "success"

);

    }catch(error){

        console.error(
            "Không lưu được Thư:",
            error
        );


        showLetterToast(

    "Không lưu được Thư. "

    +

    (
        error.message
        ||
        error
    ),

    "error",

    5000

);

    }finally{

        console.timeEnd(
            "Thời gian lưu Thư"
        );


        setLetterSaveBusy(
            false,
            isEditing
        );

    }

};
// =====================================
// HIỂN THỊ DANH SÁCH THƯ
// =====================================
function renderLetters(
    data = letters
){

    const table =
        getLetterElement(
            "letterTable"
        );


    if(!table){

        return;

    }


    const safeData =
        Array.isArray(data)
            ? data
            : [];


    updateLetterDashboard(
        safeData
    );


    table.innerHTML =
        "";


    if(safeData.length === 0){

        setLetterTableMessage(
            "Chưa có dữ liệu thư phù hợp"
        );


        return;

    }


    safeData.forEach(item => {

        const supplierName =
            getSupplierName(
                item.supplierId
            );


        const contactName =

            String(
                item.contact || ""
            ).trim()

            ||

            "—";


        const subject =

            String(
                item.subject || ""
            ).trim()

            ||

            "—";


        const typeClass =

            item.type === "Gửi"

            ? "is-sent"

            : "is-received";


        const contactClass =

            contactName === "—"

            ? "is-empty"

            : "";


        table.innerHTML += `

            <tr>

                <td>

                    <span
                        class="
                            letter-type-badge
                            ${typeClass}
                        "
                    >
                        ${escapeLetterHtml(
                            item.type || "Nhận"
                        )}
                    </span>

                </td>


                <td>

                    ${formatLetterDate(
                        item.date
                    )}

                </td>


                <td>

                    ${escapeLetterHtml(
                        item.number || ""
                    )}

                </td>


                <td>

                    ${escapeLetterHtml(
                        supplierName
                    )}

                </td>


                <td
                    class="
                        letter-contact-cell
                        ${contactClass}
                    "
                    title="${escapeLetterHtml(
                        contactName
                    )}"
                >

                    ${escapeLetterHtml(
                        contactName
                    )}

                </td>


                <td
                    class="letter-content-cell"
                    title="${escapeLetterHtml(
                        subject
                    )}"
                >

                    ${escapeLetterHtml(
                        subject
                    )}

                </td>


                <td>

                    <div class="letter-table-actions">

                        <button
                            type="button"
                            class="
                                letter-action-button
                                is-edit
                            "
                            onclick="window.editLetter('${item.id}')"
                        >
                            Sửa
                        </button>


                        <button
                            type="button"
                            class="
                                letter-action-button
                                is-delete
                            "
                            onclick="window.deleteLetter('${item.id}')"
                        >
                            Xóa
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}

// =====================================================
// CHỈNH SỬA THƯ
// =====================================================

window.editLetter =
async function(id){

    /*
    Hỗ trợ cả:
    - id local cũ
    - legacyId
    - objectId Back4App
    */

    const item =
        letters.find(letterItem => {

            const identifiers = [

                letterItem.id,

                letterItem.legacyId,

                letterItem.back4appId

            ]
            .filter(Boolean)
            .map(value =>
                String(value)
            );


            return identifiers.includes(
                String(id)
            );

        });


    if(!item){

        window.showLetterToast(

            "Không tìm thấy thông tin thư cần chỉnh sửa.",

            "error"

        );


        return;

    }


    const modal =
        getLetterElement(
            "letterModal"
        );


    if(!modal){

        window.showLetterToast(

            "Không tìm thấy popup chỉnh sửa thư.",

            "error"

        );


        return;

    }


    /*
    Lưu ID nhận diện hiện tại.
    */

    editLetterId =

        item.id

        ||

        item.legacyId

        ||

        item.back4appId;


    /*
    Điền các trường không phụ thuộc dropdown.
    */

    setLetterValue(
        "letterType",
        item.type || "Nhận"
    );


    setLetterValue(
        "letterDate",
        item.date || ""
    );


    setLetterValue(
        "letterNumber",
        item.number || ""
    );


    setLetterValue(
        "letterContact",
        item.contact || ""
    );


    setLetterValue(
        "letterSubject",
        item.subject || ""
    );


    setLetterValue(
        "letterNote",
        item.note || ""
    );


    const title =
        getLetterElement(
            "letterModalTitle"
        );


    if(title){

        title.textContent =
            "Chỉnh sửa thư";

    }


    setLetterSaveBusy(
        false,
        true
    );


    /*
    Mở popup trước để không bị việc tải
    Nhà cung cấp làm chặn giao diện.
    */

    const opened =
        setLetterModalVisible(
            true
        );


    if(!opened){

        window.showLetterToast(

            "Không thể mở popup chỉnh sửa thư.",

            "error"

        );


        return;

    }


    /*
    Tải dropdown rồi gán Nhà cung cấp.
    */

    try{

        await ensureLetterSuppliersLoaded();


        setLetterSupplierById(
    item.supplierId || ""
);

    }catch(error){

        console.error(
            "Không tải được Nhà cung cấp:",
            error
        );


        /*
        Vẫn thử gán lại giá trị nếu option
        đã có sẵn trong HTML.
        */

        setLetterValue(

            "letterSupplier",

            item.supplierId || ""

        );


        window.showLetterToast(

            "Đã mở thư nhưng chưa tải lại được danh sách Nhà cung cấp.",

            "warning",

            4500

        );

    }


    window.setTimeout(
        function(){

            getLetterElement(
                "letterType"
            )?.focus();

        },
        60
    );

};
// =====================================
// XÓA THƯ — BẢN ỔN ĐỊNH
// =====================================

window.deleteLetter =
async function(id){

    const item =
        letters.find(

            letterItem =>

                String(letterItem.id)

                ===

                String(id)

        );


    if(!item){

        showLetterToast(

            "Không tìm thấy thông tin thư cần xóa.",

            "error"

        );


        return;

    }


    const confirmed =
        window.confirm(

            `Bạn có chắc chắn muốn xóa thư số "${item.number || "Không có số thư"}"?\n\n`

            +

            "Thao tác này không thể hoàn tác."

        );


    if(!confirmed){

        return;

    }


    try{

        ensureLetterBack4AppReady();


        let letterObject =
            null;


        const possibleObjectIds =
            [

                item.back4appId,

                item.id

            ]

            .filter(Boolean)

            .map(value =>
                String(value).trim()
            )

            .filter(value =>
                value !== ""
            )

            /*
            Loại ID local dạng timestamp.
            */

            .filter(value =>
                !/^\d{10,}$/.test(value)
            );


        /*
        Ưu tiên tìm bằng objectId.
        */

        for(
            const objectId
            of possibleObjectIds
        ){

            try{

                const query =
                    new Parse.Query(
                        LETTER_CLASS_NAME
                    );


                letterObject =
                    await query.get(
                        objectId
                    );


                if(letterObject){

                    break;

                }

            }catch(error){

                /*
                Không tìm thấy bằng ID này,
                tiếp tục phương pháp khác.
                */

            }

        }


        /*
        Tìm bằng legacyId.
        */

        if(!letterObject){

            const legacyId =
                String(

                    item.legacyId

                    ||

                    item.id

                    ||

                    ""

                ).trim();


            if(legacyId){

                const legacyQuery =
                    new Parse.Query(
                        LETTER_CLASS_NAME
                    );


                legacyQuery.equalTo(
                    "legacyId",
                    legacyId
                );


                letterObject =
                    await legacyQuery.first();

            }

        }


        /*
        Dự phòng bằng dữ liệu nghiệp vụ.
        */

        if(!letterObject){

            const fallbackQuery =
                new Parse.Query(
                    LETTER_CLASS_NAME
                );


            fallbackQuery.equalTo(

                "number",

                String(
                    item.number || ""
                ).trim()

            );


            fallbackQuery.equalTo(

                "date",

                String(
                    item.date || ""
                ).trim()

            );


            fallbackQuery.equalTo(

                "supplierId",

                String(
                    item.supplierId || ""
                ).trim()

            );


            letterObject =
                await fallbackQuery.first();

        }


        if(!letterObject){

            /*
            Server không còn object,
            xóa cache local để đồng bộ giao diện.
            */

            letters =
                letters.filter(

                    letterItem =>

                        String(letterItem.id)

                        !==

                        String(id)

                );


            saveLettersToStorage();


            filterLetters();


            showLetterToast(

                "Thư không còn trên Back4App. Danh sách đã được đồng bộ lại.",

                "warning",

                4500

            );


            return;

        }


        const deletedObjectId =
            String(
                letterObject.id
            );


        await letterObject.destroy();


        letters =
            letters.filter(letterItem => {

                const identifiers =
                    [

                        letterItem.id,

                        letterItem.legacyId,

                        letterItem.back4appId

                    ]

                    .filter(Boolean)

                    .map(value =>
                        String(value)
                    );


                return !(
                    identifiers.includes(
                        String(id)
                    )

                    ||

                    identifiers.includes(
                        deletedObjectId
                    )
                );

            });


        saveLettersToStorage();


        filterLetters();


        showLetterToast(

            `Đã xóa thư "${item.number || ""}".`,

            "success"

        );

    }catch(error){

        console.error(
            "Không xóa được Thư:",
            error
        );


        let errorMessage =
            error.message

            ||

            String(error);


        if(Number(error?.code) === 119){

            errorMessage =
                "Tài khoản chưa được cấp quyền xóa class Letter.";

        }


        showLetterToast(

            `Không xóa được thư. ${errorMessage}`,

            "error",

            5500

        );

    }

};
// =====================================
// LỌC VÀ SẮP XẾP THƯ
// =====================================

window.filterLetters =
function(){

    const keyword =
        normalizeLetterText(

            getLetterValue(
                "letterSearch"
            )

        );


    const type =
        getLetterValue(
            "letterTypeFilter"
        );


    const supplierId =
        getLetterValue(
            "letterSupplierFilter"
        );


    const dateFrom =
        getLetterValue(
            "letterDateFrom"
        );


    const dateTo =
        getLetterValue(
            "letterDateTo"
        );


    const sortMode =
        getLetterValue(
            "letterSort",
            "newest"
        );


    if(
        dateFrom !== ""

        &&

        dateTo !== ""

        &&

        dateFrom > dateTo
    ){

        showLetterToast(

    "Từ ngày không được lớn hơn Đến ngày.",

    "warning"

);


        return;

    }


    const filteredData =
        letters.filter(item => {

            const supplierName =
                getSupplierName(
                    item.supplierId
                );


            const searchText =
                normalizeLetterText(`

                    ${item.number || ""}

                    ${item.subject || ""}

                    ${item.contact || ""}

                    ${item.note || ""}

                    ${item.type || ""}

                    ${supplierName}

                `);


            const matchKeyword =
                searchText.includes(
                    keyword
                );


            const matchType =

                type === ""

                ||

                item.type === type;


            const matchSupplier =

                supplierId === ""

                ||

                String(
                    item.supplierId
                )

                ===

                String(
                    supplierId
                );


            const itemDate =
                String(
                    item.date || ""
                );


            const matchDateFrom =

                dateFrom === ""

                ||

                itemDate >= dateFrom;


            const matchDateTo =

                dateTo === ""

                ||

                itemDate <= dateTo;


            return (

                matchKeyword

                &&

                matchType

                &&

                matchSupplier

                &&

                matchDateFrom

                &&

                matchDateTo

            );

        });


    const sortedData =
        sortLetterData(

            filteredData,

            sortMode

        );


    renderLetters(
        sortedData
    );

};

// =====================================
// ĐỊNH DẠNG NGÀY
// =====================================

function formatLetterDate(date){

    if(!date){

        return "";

    }


    const parts =
        String(date)
        .split("-");


    if(parts.length !== 3){

        return escapeLetterHtml(date);

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// =====================================
// ĐƯA HÀM RA WINDOW
// =====================================

window.initializeLetterPage =
    initializeLetterPage;

window.loadLetters =
    loadLetters;

window.loadLetterSupplierOptions =
    loadLetterSupplierOptions;

window.renderLetters =
    renderLetters;

window.migrateLettersToBack4App =
    migrateLettersToBack4App;

window.fetchLettersFromBack4App =
    fetchLettersFromBack4App;

window.getLettersData =
function(){

    return [...letters];

};
