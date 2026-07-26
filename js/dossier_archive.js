;(() => {

    "use strict";


    // =====================================================
    // DOSSIER_ARCHIVE.JS
    // Quản lý Hồ sơ lưu bằng Back4App
    // =====================================================

    const ARCHIVE_DOSSIER_CLASS_NAME =
        "ArchiveDossier";


    const ARCHIVE_MIGRATION_KEY =
        "archiveDossierBack4AppMigrationV1";

    /*
Modal được đưa ra body khi mở để không bị giới hạn
bởi transform/overflow của vùng nội dung SPA.
*/

let archiveModalMountState = null;


function mountArchiveModalToBody(){

    const modal =
        getArchiveElement(
            "archiveModal"
        );


    if(!modal){

        return null;

    }


    if(
        !archiveModalMountState

        &&

        modal.parentNode
    ){

        archiveModalMountState = {

            parent:
                modal.parentNode,

            nextSibling:
                modal.nextSibling

        };

    }


    if(modal.parentNode !== document.body){

        document.body.appendChild(
            modal
        );

    }


    return modal;

}


function restoreArchiveModalPosition(
    modal
){

    const mountState =
        archiveModalMountState;


    archiveModalMountState =
        null;


    if(
        !modal

        ||

        !mountState
    ){

        return;

    }


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


    modal.remove();

}
    let archiveDossiers =
        readArchiveStorageArray(
            "archiveDossiers"
        );


    let editingArchiveId =
        null;


    let archiveDataLoaded =
        false;


    let archiveLoadingPromise =
        null;


    let archiveMigrationPromise =
        null;


    // =====================================================
    // HÀM DOM CƠ BẢN
    // =====================================================

    function getArchiveElement(id) {

        return document.getElementById(id);

    }


    function getArchiveValue(id) {

        const element =
            getArchiveElement(id);


        return element

            ? String(
                element.value || ""
            ).trim()

            : "";

    }


    function setArchiveValue(
        id,
        value
    ) {

        const element =
            getArchiveElement(id);


        if (element) {

            element.value =
                value ?? "";

        }

    }


    function getArchiveSaveButton() {

        return (

            getArchiveElement(
                "archiveSaveButton"
            )

            ||

            document.querySelector(
                ".archive-save-button"
            )

        );

    }


    // =====================================================
    // CHUẨN HÓA VÀ HIỂN THỊ
    // =====================================================

    function normalizeArchiveText(value) {

        return String(value || "")

            .normalize("NFD")

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .toLowerCase()

            .trim();

    }


    function escapeArchiveHtml(value) {

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


    function formatArchiveDate(dateValue) {

        if (!dateValue) {

            return "—";

        }


        const parts =
            String(dateValue)
                .split("-");


        if (parts.length !== 3) {

            return String(dateValue);

        }


        return `${parts[2]}/${parts[1]}/${parts[0]}`;

    }


    function getArchiveTodayValue() {

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


        return `${year}-${month}-${day}`;

    }

// =====================================================
// TOAST THÔNG BÁO CỦA TRANG LƯU HỒ SƠ
// =====================================================

function getArchiveToastStack(){

    let stack =
        document.getElementById(
            "archiveToastStack"
        );


    if(stack){

        return stack;

    }


    stack =
        document.createElement(
            "div"
        );


    stack.id =
        "archiveToastStack";


    stack.className =
        "archive-toast-stack";


    stack.setAttribute(
        "aria-live",
        "polite"
    );


    stack.setAttribute(
        "aria-atomic",
        "false"
    );


    document.body.appendChild(
        stack
    );


    return stack;

}


function removeArchiveToast(toast){

    if(!toast){

        return;

    }


    toast.classList.remove(
        "is-visible"
    );


    toast.classList.add(
        "is-leaving"
    );


    window.setTimeout(
        function(){

            toast.remove();

        },
        260
    );

}


function showArchiveNotice(
    message,
    type = "success"
){

    const supportedTypes = [
        "success",
        "error",
        "warning",
        "info"
    ];


    const safeType =
        supportedTypes.includes(type)

            ? type

            : "info";


    const stack =
        getArchiveToastStack();


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `archive-toast is-${safeType}`;


    toast.setAttribute(

        "role",

        safeType === "error"

            ? "alert"

            : "status"

    );


    const icon =
        document.createElement(
            "span"
        );


    icon.className =
        "archive-toast-icon";


    icon.setAttribute(
        "aria-hidden",
        "true"
    );


    const icons = {

        success:
            "✓",

        error:
            "!",

        warning:
            "!",

        info:
            "i"

    };


    icon.textContent =
        icons[safeType];


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "archive-toast-content";


    const title =
        document.createElement(
            "strong"
        );


    const titles = {

        success:
            "Thành công",

        error:
            "Không thể thực hiện",

        warning:
            "Cần kiểm tra",

        info:
            "Thông báo"

    };


    title.textContent =
        titles[safeType];


    const text =
        document.createElement(
            "p"
        );


    text.textContent =
        String(
            message || ""
        );


    content.append(
        title,
        text
    );


    const closeButton =
        document.createElement(
            "button"
        );


    closeButton.type =
        "button";


    closeButton.className =
        "archive-toast-close";


    closeButton.textContent =
        "×";


    closeButton.setAttribute(
        "aria-label",
        "Đóng thông báo"
    );


    closeButton.addEventListener(
        "click",
        function(){

            removeArchiveToast(
                toast
            );

        }
    );


    const progress =
        document.createElement(
            "span"
        );


    progress.className =
        "archive-toast-progress";


    toast.append(
        icon,
        content,
        closeButton,
        progress
    );


    stack.appendChild(
        toast
    );


    window.requestAnimationFrame(
        function(){

            toast.classList.add(
                "is-visible"
            );

        }
    );


    const timeoutId =
        window.setTimeout(
            function(){

                removeArchiveToast(
                    toast
                );

            },
            safeType === "error"

                ? 6000

                : 4200
        );


    toast.addEventListener(
        "mouseenter",
        function(){

            window.clearTimeout(
                timeoutId
            );


            progress.style.animationPlayState =
                "paused";

        },
        {
            once: true
        }
    );

}

    // =====================================================
    // LOCAL STORAGE CACHE
    // =====================================================

    function readArchiveStorageArray(key) {

        try {

            const rawData =
                localStorage.getItem(key);


            if (!rawData) {

                return [];

            }


            const parsedData =
                JSON.parse(rawData);


            return Array.isArray(parsedData)

                ? parsedData

                : [];

        } catch (error) {

            console.error(
                `Không đọc được dữ liệu ${key}:`,
                error
            );


            return [];

        }

    }


    function saveArchiveToStorage() {

        try {

            localStorage.setItem(

                "archiveDossiers",

                JSON.stringify(
                    archiveDossiers
                )

            );

        } catch (error) {

            console.error(
                "Không cập nhật được cache Hồ sơ lưu:",
                error
            );

        }

    }


    // =====================================================
    // KIỂM TRA BACK4APP
    // =====================================================

    function ensureArchiveBack4AppReady() {

        if (typeof Parse === "undefined") {

            throw new Error(
                "Parse SDK chưa được tải."
            );

        }


        if (
            window.BACK4APP_CONFIG_READY !==
            true
        ) {

            throw new Error(
                "Back4App chưa được khởi tạo."
            );

        }


        if (!Parse.User.current()) {

            throw new Error(
                "Phiên đăng nhập không còn hiệu lực."
            );

        }

    }


    // =====================================================
    // TRẠNG THÁI NÚT LƯU
    // =====================================================

    function setArchiveSaveBusy(
        isBusy,
        isEditing
    ) {

        const button =
            getArchiveSaveButton();


        if (!button) {

            return;

        }


        button.disabled =
            isBusy;


        button.textContent =

            isBusy

                ? "Đang lưu..."

                : (
                    isEditing

                        ? "Cập nhật hồ sơ"

                        : "Lưu hồ sơ"
                );

    }


    // =====================================================
    // THÔNG BÁO TRONG BẢNG
    // =====================================================

    function setArchiveTableMessage(
        message,
        isError = false
    ) {

        const table =
            getArchiveElement(
                "archiveTable"
            );


        if (!table) {

            return;

        }


        table.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="archive-empty-row"
                    style="
                        color:
                        ${
                            isError

                                ? "#c64f52"

                                : "#748078"
                        };
                    "
                >
                    ${escapeArchiveHtml(message)}
                </td>

            </tr>

        `;


        const resultCount =
            getArchiveElement(
                "archiveResultCount"
            );


        if (resultCount) {

            resultCount.textContent =
                "0 hồ sơ";

        }

    }


    // =====================================================
    // DỮ LIỆU TỪ CÁC MODULE KHÁC
    // =====================================================

    function getArchiveProjectList() {

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
            typeof projects !== "undefined"

            &&

            Array.isArray(projects)
        ) {

            return projects;

        }


        return [];

    }


    function getArchiveSupplierList() {

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
            typeof suppliers !== "undefined"

            &&

            Array.isArray(suppliers)
        ) {

            return suppliers;

        }


        return [];

    }


    function getArchiveDossierList() {

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


        if (
            typeof dossiers !== "undefined"

            &&

            Array.isArray(dossiers)
        ) {

            return dossiers;

        }


        return [];

    }


    // =====================================================
    // TẢI DỮ LIỆU PHỤ THUỘC
    // Một module lỗi không làm sập Trang Lưu hồ sơ
    // =====================================================

    async function ensureArchiveDependenciesLoaded() {

        const tasks = [];


        function addArchiveTask(callback) {

            if (
                typeof callback !==
                "function"
            ) {

                return;

            }


            try {

                tasks.push(

                    Promise.resolve(
                        callback()
                    )

                );

            } catch (error) {

                tasks.push(
                    Promise.reject(error)
                );

            }

        }


        if (
            getArchiveProjectList()
                .length === 0
        ) {

            addArchiveTask(
                window.loadProjectSelect
            );

        }


        if (
            getArchiveSupplierList()
                .length === 0
        ) {

            addArchiveTask(
                window.loadSupplierSelect
            );

        }


        if (
            getArchiveDossierList()
                .length === 0
        ) {

            addArchiveTask(
                window.migrateDossiersToBack4App
            );


            addArchiveTask(
                window.fetchDossiersFromBack4App
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
                    "Một nguồn dữ liệu liên kết chưa tải được:",
                    result.reason
                );

            }

        });

    }


    // =====================================================
    // SẮP XẾP HỒ SƠ MỚI TẠO TRƯỚC
    // =====================================================

    function getArchiveCreatedTime(item) {

        const createdAt =
            Date.parse(
                item?.createdAt || ""
            );


        if (!Number.isNaN(createdAt)) {

            return createdAt;

        }


        const numericLegacyId =
            Number(
                item?.legacyId ||
                item?.id ||
                0
            );


        if (
            Number.isFinite(
                numericLegacyId
            )

            &&

            numericLegacyId > 0
        ) {

            return numericLegacyId;

        }


        const archiveDate =
            Date.parse(

                item?.archiveDate

                    ? `${item.archiveDate}T00:00:00`

                    : ""

            );


        return Number.isNaN(archiveDate)

            ? 0

            : archiveDate;

    }


    function compareArchiveVietnamese(
        valueA,
        valueB
    ) {

        return String(valueA || "")
            .localeCompare(

                String(valueB || ""),

                "vi",

                {
                    sensitivity:
                        "base",

                    numeric:
                        true
                }

            );

    }


    function sortArchiveDossiersNewestFirst(
        data
    ) {

        return [...data]
            .sort((a, b) => {

                const timeComparison =

                    getArchiveCreatedTime(b)

                    -

                    getArchiveCreatedTime(a);


                if (timeComparison !== 0) {

                    return timeComparison;

                }


                return compareArchiveVietnamese(
                    a.code,
                    b.code
                );

            });

    }


    function sortArchiveDossiersInPlace() {

        archiveDossiers =
            sortArchiveDossiersNewestFirst(
                archiveDossiers
            );

    }


    // =====================================================
    // PARSE OBJECT → OBJECT THƯỜNG
    // =====================================================

    function archiveParseObjectToPlain(
        parseObject,
        fallbackArchive = null
    ) {

        const fallbackLegacyId =

            fallbackArchive

            &&

            fallbackArchive.id

            &&

            String(
                fallbackArchive.id
            )

            !==

            String(
                fallbackArchive.back4appId ||
                ""
            )

                ? String(
                    fallbackArchive.id
                )

                : "";


        const legacyId =
            String(

                parseObject.get(
                    "legacyId"
                )

                ||

                fallbackArchive?.legacyId

                ||

                fallbackLegacyId

                ||

                ""

            ).trim();


        const back4appId =
            String(

                parseObject.id

                ||

                fallbackArchive?.back4appId

                ||

                ""

            );


        return {

            id:

                legacyId

                ||

                back4appId

                ||

                fallbackArchive?.id

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

                    fallbackArchive?.type

                    ??

                    ""

                ),


            code:
                String(

                    parseObject.get("code")

                    ??

                    fallbackArchive?.code

                    ??

                    ""

                ),


            name:
                String(

                    parseObject.get("name")

                    ??

                    fallbackArchive?.name

                    ??

                    ""

                ),


            linkedDossierId:
                String(

                    parseObject.get(
                        "linkedDossierId"
                    )

                    ??

                    fallbackArchive
                        ?.linkedDossierId

                    ??

                    ""

                ),


            projectId:
                String(

                    parseObject.get(
                        "projectId"
                    )

                    ??

                    fallbackArchive?.projectId

                    ??

                    ""

                ),


            supplierId:
                String(

                    parseObject.get(
                        "supplierId"
                    )

                    ??

                    fallbackArchive?.supplierId

                    ??

                    ""

                ),


            archiveDate:
                String(

                    parseObject.get(
                        "archiveDate"
                    )

                    ??

                    fallbackArchive?.archiveDate

                    ??

                    ""

                ),


            location:
                String(

                    parseObject.get(
                        "location"
                    )

                    ??

                    fallbackArchive?.location

                    ??

                    ""

                ),


            quantity:
                Math.max(

                    1,

                    Number(

                        parseObject.get(
                            "quantity"
                        )

                        ??

                        fallbackArchive?.quantity

                        ??

                        1

                    )

                ),


            note:
                String(

                    parseObject.get("note")

                    ??

                    fallbackArchive?.note

                    ??

                    ""

                ),


            createdAt:

                parseObject.createdAt

                    ? parseObject.createdAt
                        .toISOString()

                    : (
                        fallbackArchive
                            ?.createdAt

                        ||

                        ""
                    ),


            updatedAt:

                parseObject.updatedAt

                    ? parseObject.updatedAt
                        .toISOString()

                    : (
                        fallbackArchive
                            ?.updatedAt

                        ||

                        ""
                    )

        };

    }


    // =====================================================
    // GÁN DỮ LIỆU CHO PARSE OBJECT
    // =====================================================

    function setArchiveParseFields(
        archiveObject,
        data
    ) {

        archiveObject.set(
            "type",
            String(data.type || "")
        );


        archiveObject.set(
            "code",
            String(data.code || "")
                .trim()
        );


        archiveObject.set(
            "codeNormalized",
            normalizeArchiveText(
                data.code
            )
        );


        archiveObject.set(
            "name",
            String(data.name || "")
        );


        archiveObject.set(
            "linkedDossierId",
            String(
                data.linkedDossierId || ""
            )
        );


        archiveObject.set(
            "projectId",
            String(data.projectId || "")
        );


        archiveObject.set(
            "supplierId",
            String(data.supplierId || "")
        );


        archiveObject.set(
            "archiveDate",
            String(data.archiveDate || "")
        );


        archiveObject.set(
            "location",
            String(data.location || "")
        );


        archiveObject.set(
            "quantity",
            Math.max(
                1,
                Number(data.quantity || 1)
            )
        );


        archiveObject.set(
            "note",
            String(data.note || "")
        );

    }


    // =====================================================
    // TÌM HỒ SƠ TRONG BỘ NHỚ
    // =====================================================

    function findArchiveInMemory(id) {

        return archiveDossiers.find(item => {

            return (

                String(item.id || "")

                ===

                String(id || "")

                ||

                String(
                    item.back4appId || ""
                )

                ===

                String(id || "")

                ||

                String(
                    item.legacyId || ""
                )

                ===

                String(id || "")

            );

        });

    }


    function sameArchiveIdentity(
        itemA,
        itemB
    ) {

        if (!itemA || !itemB) {

            return false;

        }


        const idsA = [

            itemA.id,

            itemA.back4appId,

            itemA.legacyId

        ]
        .filter(Boolean)
        .map(String);


        const idsB = [

            itemB.id,

            itemB.back4appId,

            itemB.legacyId

        ]
        .filter(Boolean)
        .map(String);


        return idsA.some(
            id => idsB.includes(id)
        );

    }


    // =====================================================
    // TÌM OBJECT BACK4APP CỦA HỒ SƠ
    // =====================================================

    async function resolveArchiveParseObject(
        item
    ) {

        const back4appId =
            String(
                item?.back4appId || ""
            ).trim();


        if (back4appId) {

            return Parse.Object
                .createWithoutData(

                    ARCHIVE_DOSSIER_CLASS_NAME,

                    back4appId

                );

        }


        const legacyId =
            String(

                item?.legacyId

                ||

                item?.id

                ||

                ""

            ).trim();


        if (legacyId) {

            const legacyQuery =
                new Parse.Query(
                    ARCHIVE_DOSSIER_CLASS_NAME
                );


            legacyQuery.equalTo(
                "legacyId",
                legacyId
            );


            const foundByLegacyId =
                await legacyQuery.first();


            if (foundByLegacyId) {

                return foundByLegacyId;

            }

        }


        const normalizedCode =
            normalizeArchiveText(
                item?.code
            );


        if (normalizedCode) {

            const codeQuery =
                new Parse.Query(
                    ARCHIVE_DOSSIER_CLASS_NAME
                );


            codeQuery.equalTo(
                "codeNormalized",
                normalizedCode
            );


            const foundByCode =
                await codeQuery.first();


            if (foundByCode) {

                return foundByCode;

            }

        }


        throw new Error(
            "Không tìm thấy hồ sơ lưu trên Back4App."
        );

    }


    // =====================================================
    // KIỂM TRA MÃ TRÙNG TRÊN BACK4APP
    // =====================================================

    async function ensureArchiveCodeUnique(
        code,
        excludedBack4AppId = ""
    ) {

        const normalizedCode =
            normalizeArchiveText(code);


        if (!normalizedCode) {

            return;

        }


        const query =
            new Parse.Query(
                ARCHIVE_DOSSIER_CLASS_NAME
            );


        query.equalTo(
            "codeNormalized",
            normalizedCode
        );


        const existing =
            await query.first();


        if (
            existing

            &&

            String(existing.id)

            !==

            String(
                excludedBack4AppId || ""
            )
        ) {

            throw new Error(
                "Số hoặc mã hồ sơ này đã tồn tại."
            );

        }

    }


    // =====================================================
    // TÌM HỒ SƠ ĐÃ MIGRATE
    // =====================================================

    async function findExistingArchiveForMigration(
        item
    ) {

        const back4appId =
            String(
                item.back4appId || ""
            ).trim();


        if (back4appId) {

            try {

                const queryByObjectId =
                    new Parse.Query(
                        ARCHIVE_DOSSIER_CLASS_NAME
                    );


                return await queryByObjectId.get(
                    back4appId
                );

            } catch (error) {

                console.warn(
                    "Không tìm thấy objectId cũ, tiếp tục kiểm tra legacyId."
                );

            }

        }


        const legacyId =
            String(
                item.id || ""
            ).trim();


        if (legacyId) {

            const queryByLegacyId =
                new Parse.Query(
                    ARCHIVE_DOSSIER_CLASS_NAME
                );


            queryByLegacyId.equalTo(
                "legacyId",
                legacyId
            );


            const foundByLegacyId =
                await queryByLegacyId.first();


            if (foundByLegacyId) {

                return foundByLegacyId;

            }

        }


        const normalizedCode =
            normalizeArchiveText(
                item.code
            );


        if (normalizedCode) {

            const queryByCode =
                new Parse.Query(
                    ARCHIVE_DOSSIER_CLASS_NAME
                );


            queryByCode.equalTo(
                "codeNormalized",
                normalizedCode
            );


            return await queryByCode.first();

        }


        return null;

    }


    // =====================================================
    // MIGRATE DỮ LIỆU LOCAL CŨ
    // =====================================================

    async function migrateArchiveDossiersToBack4App(
        force = false
    ) {

        if (archiveMigrationPromise) {

            return archiveMigrationPromise;

        }


        archiveMigrationPromise =
            (async function () {

                ensureArchiveBack4AppReady();


                if (
                    !force

                    &&

                    localStorage.getItem(
                        ARCHIVE_MIGRATION_KEY
                    )
                ) {

                    return {

                        migrated: 0,

                        skipped: 0,

                        failed: 0,

                        alreadyCompleted: true

                    };

                }


                const oldArchives =
                    readArchiveStorageArray(
                        "archiveDossiers"
                    );


                const currentUser =
                    Parse.User.current();


                let migrated = 0;

                let skipped = 0;

                let failed = 0;


                for (
                    const item
                    of oldArchives
                ) {

                    try {

                        const code =
                            String(
                                item.code || ""
                            ).trim();


                        const name =
                            String(
                                item.name || ""
                            ).trim();


                        if (!code || !name) {

                            failed += 1;

                            continue;

                        }


                        const existingArchive =
                            await findExistingArchiveForMigration(
                                item
                            );


                        const legacyId =
                            String(
                                item.id || ""
                            ).trim();


                        if (existingArchive) {

                            if (
                                legacyId

                                &&

                                !existingArchive.get(
                                    "legacyId"
                                )
                            ) {

                                existingArchive.set(
                                    "legacyId",
                                    legacyId
                                );


                                if (currentUser) {

                                    existingArchive.set(
                                        "updatedBy",
                                        currentUser
                                    );

                                }


                                await existingArchive.save();

                            }


                            skipped += 1;

                            continue;

                        }


                        const archiveObject =
                            new Parse.Object(
                                ARCHIVE_DOSSIER_CLASS_NAME
                            );


                        setArchiveParseFields(
                            archiveObject,
                            item
                        );


                        if (legacyId) {

                            archiveObject.set(
                                "legacyId",
                                legacyId
                            );

                        }


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


                        await archiveObject.save();


                        migrated += 1;

                    } catch (error) {

                        failed += 1;


                        console.error(
                            "Không migrate được một hồ sơ lưu:",
                            item,
                            error
                        );

                    }

                }


                const report = {

                    completedAt:
                        new Date()
                            .toISOString(),

                    migrated,

                    skipped,

                    failed

                };


                if (failed === 0) {

                    localStorage.setItem(

                        ARCHIVE_MIGRATION_KEY,

                        JSON.stringify(report)

                    );

                }


                console.log(
                    "✅ Migrate Hồ sơ lưu hoàn tất:",
                    report
                );


                return {

                    migrated,

                    skipped,

                    failed,

                    alreadyCompleted: false

                };

            })();


        try {

            return await archiveMigrationPromise;

        } finally {

            archiveMigrationPromise =
                null;

        }

    }


    // =====================================================
    // TẢI HỒ SƠ LƯU TỪ BACK4APP
    // =====================================================

    async function fetchArchiveDossiersFromBack4App(
        forceReload = false
    ) {

        ensureArchiveBack4AppReady();


        if (
            archiveDataLoaded

            &&

            !forceReload
        ) {

            return archiveDossiers;

        }


        if (archiveLoadingPromise) {

            return archiveLoadingPromise;

        }


        archiveLoadingPromise =
            (async function () {

                const query =
                    new Parse.Query(
                        ARCHIVE_DOSSIER_CLASS_NAME
                    );


                /*
                Hồ sơ tạo mới hiện trên trước.
                */

                query.descending(
                    "createdAt"
                );


                query.limit(1000);


                const results =
                    await query.find();


                archiveDossiers =
                    results.map(item =>

                        archiveParseObjectToPlain(
                            item
                        )

                    );


                sortArchiveDossiersInPlace();


                archiveDataLoaded =
                    true;


                saveArchiveToStorage();


                return archiveDossiers;

            })();


        try {

            return await archiveLoadingPromise;

        } finally {

            archiveLoadingPromise =
                null;

        }

    }


    // =====================================================
    // KHỞI TẠO TRANG
    // =====================================================

    async function initializeArchivePage() {

        setArchiveTableMessage(
            "Đang tải hồ sơ lưu..."
        );


        await ensureArchiveDependenciesLoaded();


        let remoteError =
            null;


        try {

            ensureArchiveBack4AppReady();


            try {

                await migrateArchiveDossiersToBack4App();

            } catch (migrationError) {

                console.warn(
                    "Không migrate được dữ liệu Hồ sơ lưu:",
                    migrationError
                );

            }


            await fetchArchiveDossiersFromBack4App(
                true
            );

        } catch (error) {

            remoteError =
                error;


            console.error(
                "Không tải được Hồ sơ lưu từ Back4App:",
                error
            );


            /*
            Dùng cache localStorage khi Back4App lỗi.
            */

            archiveDossiers =
                readArchiveStorageArray(
                    "archiveDossiers"
                );


            sortArchiveDossiersInPlace();

        }


        try {

            loadArchiveOptions();

        } catch (optionError) {

            console.error(
                "Không tải được lựa chọn liên kết:",
                optionError
            );

        }


        if (
            remoteError

            &&

            archiveDossiers.length === 0
        ) {

            setArchiveTableMessage(

                remoteError.message

                ||

                "Không tải được Hồ sơ lưu.",

                true

            );


            return;

        }


        filterArchiveDossiers();

    }


    async function loadArchiveDossiers() {

        await initializeArchivePage();


        return [...archiveDossiers];

    }


    // =====================================================
    // HÀM HỖ TRỢ LIÊN KẾT
    // =====================================================

    function getArchiveProjectName(
        projectId
    ) {

        const project =
            getArchiveProjectList()
                .find(item =>

                    String(item.id)

                    ===

                    String(projectId)

                );


        return project

            ? (
                project.ten

                ||

                project.name

                ||

                ""
            )

            : "";

    }


    function getArchiveSupplierLabel(
        supplier
    ) {

        if (!supplier) {

            return "";

        }


        const supplierCode =

            supplier.code

            ||

            supplier.ma

            ||

            supplier.maNCC

            ||

            "";


        const supplierName =

            supplier.ten

            ||

            supplier.name

            ||

            "Nhà cung cấp không có tên";


        return supplierCode

            ? `${supplierCode} - ${supplierName}`

            : supplierName;

    }


    function getArchiveSupplierById(
        supplierId
    ) {

        return getArchiveSupplierList()
            .find(item =>

                String(item.id)

                ===

                String(supplierId)

            );

    }


    function getArchiveDossierLabel(
        dossier
    ) {

        if (!dossier) {

            return "";

        }


        const supplier =
            getArchiveSupplierById(
                dossier.supplierId
            );


        const supplierName =

            supplier

                ? (
                    supplier.ten

                    ||

                    supplier.name

                    ||

                    ""
                )

                : "";


        return [

            dossier.code ||
            "Không có mã",

            dossier.content || "",

            supplierName

        ]
        .filter(Boolean)
        .join(" | ");

    }


    function getArchiveDatalistId(
        inputId,
        datalistId
    ) {

        const input =
            getArchiveElement(inputId);


        const datalist =
            getArchiveElement(datalistId);


        if (!input || !datalist) {

            return "";

        }


        const selectedOption =
            Array.from(
                datalist.options
            )
            .find(option =>

                option.value ===
                input.value

            );


        return selectedOption

            ? String(
                selectedOption.dataset.id ||
                ""
            )

            : "";

    }


    function getArchiveCodeGroup(code) {

        const normalizedCode =
            String(code || "")

                .trim()

                .toUpperCase();


        if (!normalizedCode) {

            return "";

        }


        return normalizedCode

            .split(/[-/._\s]+/)

            .filter(Boolean)[0]

            ||

            "";

    }


    // =====================================================
    // LOAD DỰ ÁN, NHÀ CUNG CẤP, HỒ SƠ
    // =====================================================

    function loadArchiveOptions() {

        const projectList =
            getArchiveProjectList();


        const supplierList =
            getArchiveSupplierList();


        const dossierList =
            getArchiveDossierList();


        const projectSelect =
            getArchiveElement(
                "archiveProject"
            );


        const projectFilter =
            getArchiveElement(
                "archiveProjectFilter"
            );


        const currentProjectValue =
            projectSelect?.value || "";


        const currentProjectFilter =
            projectFilter?.value || "";


        if (projectSelect) {

            projectSelect.innerHTML = `

                <option value="">
                    -- Không liên kết dự án --
                </option>

            `;

        }


        if (projectFilter) {

            projectFilter.innerHTML = `

                <option value="">
                    Tất cả dự án
                </option>

            `;

        }


        [...projectList]

        .sort((a, b) =>

            compareArchiveVietnamese(

                a.ten || a.name,

                b.ten || b.name

            )

        )

        .forEach(project => {

            const projectName =

                project.ten

                ||

                project.name

                ||

                "Dự án không có tên";


            if (projectSelect) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(project.id);


                option.textContent =
                    projectName;


                projectSelect.appendChild(
                    option
                );

            }


            if (projectFilter) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(project.id);


                option.textContent =
                    projectName;


                projectFilter.appendChild(
                    option
                );

            }

        });


        if (projectSelect) {

            const stillExists =
                projectList.some(item =>

                    String(item.id)

                    ===

                    String(
                        currentProjectValue
                    )

                );


            projectSelect.value =

                stillExists

                    ? currentProjectValue

                    : "";

        }


        if (projectFilter) {

            const stillExists =
                projectList.some(item =>

                    String(item.id)

                    ===

                    String(
                        currentProjectFilter
                    )

                );


            projectFilter.value =

                stillExists

                    ? currentProjectFilter

                    : "";

        }


        const supplierLists = [

            getArchiveElement(
                "archiveSupplierList"
            ),

            getArchiveElement(
                "archiveSupplierFilterList"
            )

        ];


        supplierLists.forEach(list => {

            if (!list) {

                return;

            }


            list.innerHTML =
                "";


            [...supplierList]

            .sort((a, b) =>

                compareArchiveVietnamese(

                    getArchiveSupplierLabel(a),

                    getArchiveSupplierLabel(b)

                )

            )

            .forEach(supplier => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    getArchiveSupplierLabel(
                        supplier
                    );


                option.dataset.id =
                    String(supplier.id);


                list.appendChild(option);

            });

        });


        const dossierLists = [

            getArchiveElement(
                "archiveDossierList"
            ),

            getArchiveElement(
                "archiveDossierFilterList"
            )

        ];


        dossierLists.forEach(list => {

            if (!list) {

                return;

            }


            list.innerHTML =
                "";


            [...dossierList]

            .sort((a, b) =>

                compareArchiveVietnamese(
                    a.code,
                    b.code
                )

            )

            .forEach(dossier => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    getArchiveDossierLabel(
                        dossier
                    );


                option.dataset.id =
                    String(dossier.id);


                list.appendChild(option);

            });

        });


        const codeGroupFilter =
            getArchiveElement(
                "archiveCodeGroupFilter"
            );


        if (codeGroupFilter) {

            const currentValue =
                codeGroupFilter.value;


            codeGroupFilter.innerHTML = `

                <option value="">
                    Tất cả bộ mã hồ sơ
                </option>

            `;


            const codeGroups = [

                ...new Set(

                    dossierList

                    .map(item =>

                        getArchiveCodeGroup(
                            item.code
                        )

                    )

                    .filter(Boolean)

                )

            ]
            .sort(compareArchiveVietnamese);


            codeGroups.forEach(group => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    group;


                option.textContent =
                    `Bộ mã ${group}`;


                codeGroupFilter.appendChild(
                    option
                );

            });


            codeGroupFilter.value =

                codeGroups.includes(
                    currentValue
                )

                    ? currentValue

                    : "";

        }

    }


    // =====================================================
    // CHỌN HỒ SƠ LIÊN KẾT
    // =====================================================

    window.handleArchiveDossierLinkChange =
    function () {

        const linkedDossierId =
            getArchiveDatalistId(

                "archiveLinkedDossierSearch",

                "archiveDossierList"

            );


        setArchiveValue(

            "archiveLinkedDossierId",

            linkedDossierId

        );


        const projectSelect =
            getArchiveElement(
                "archiveProject"
            );


        const supplierSearch =
            getArchiveElement(
                "archiveSupplierSearch"
            );


        if (!linkedDossierId) {

            if (projectSelect) {

                projectSelect.disabled =
                    false;

            }


            if (supplierSearch) {

                supplierSearch.disabled =
                    false;

            }


            setArchiveValue(
                "archiveSupplierId",
                ""
            );


            return;

        }


        const dossier =
            getArchiveDossierList()
                .find(item =>

                    String(item.id)

                    ===

                    String(
                        linkedDossierId
                    )

                );


        if (!dossier) {

            return;

        }


        setArchiveValue(

            "archiveProject",

            dossier.projectId || ""

        );


        const supplier =
            getArchiveSupplierById(
                dossier.supplierId
            );


        setArchiveValue(

            "archiveSupplierId",

            dossier.supplierId || ""

        );


        setArchiveValue(

            "archiveSupplierSearch",

            getArchiveSupplierLabel(
                supplier
            )

        );


        if (projectSelect) {

            projectSelect.disabled =
                true;

        }


        if (supplierSearch) {

            supplierSearch.disabled =
                true;

        }

    };


    window.handleArchiveSupplierSearchChange =
    function () {

        const supplierId =
            getArchiveDatalistId(

                "archiveSupplierSearch",

                "archiveSupplierList"

            );


        setArchiveValue(
            "archiveSupplierId",
            supplierId
        );

    };


    // =====================================================
    // RESET FORM
    // =====================================================

    function resetArchiveForm() {

        setArchiveValue(
            "archiveType",
            ""
        );


        setArchiveValue(
            "archiveCode",
            ""
        );


        setArchiveValue(
            "archiveName",
            ""
        );


        setArchiveValue(
            "archiveProject",
            ""
        );


        setArchiveValue(
            "archiveLinkedDossierSearch",
            ""
        );


        setArchiveValue(
            "archiveLinkedDossierId",
            ""
        );


        setArchiveValue(
            "archiveSupplierSearch",
            ""
        );


        setArchiveValue(
            "archiveSupplierId",
            ""
        );


        setArchiveValue(

            "archiveDate",

            getArchiveTodayValue()

        );


        setArchiveValue(
            "archiveLocation",
            ""
        );


        setArchiveValue(
            "archiveQuantity",
            "1"
        );


        setArchiveValue(
            "archiveNote",
            ""
        );


        const projectSelect =
            getArchiveElement(
                "archiveProject"
            );


        const supplierSearch =
            getArchiveElement(
                "archiveSupplierSearch"
            );


        if (projectSelect) {

            projectSelect.disabled =
                false;

        }


        if (supplierSearch) {

            supplierSearch.disabled =
                false;

        }

    }

function setArchiveModalVisible(
    isVisible
){

    const modal =

        isVisible

            ? mountArchiveModalToBody()

            : getArchiveElement(
                "archiveModal"
            );


    if(!modal){

        console.error(
            "Không tìm thấy #archiveModal."
        );


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
            "archive-modal-open",
            isVisible
        );


    document.body
        .classList
        .toggle(
            "archive-modal-open",
            isVisible
        );


    if(isVisible){

        /*
        Luôn mở form từ vị trí đầu.
        Tránh lần mở sau vẫn giữ vị trí cuộn cũ.
        */

        const modalBody =
            modal.querySelector(
                ".archive-modal-body"
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

        /*
        Sau khi đóng, đưa modal về vị trí cũ
        trong dossier_archive.html.
        */

        restoreArchiveModalPosition(
            modal
        );

    }


    return true;

}


    window.openArchiveForm =
    async function () {

        editingArchiveId =
            null;


        resetArchiveForm();


        const title =
            getArchiveElement(
                "archiveFormTitle"
            );


        if (title) {

            title.textContent =
                "Thêm hồ sơ lưu";

        }


        setArchiveSaveBusy(
            false,
            false
        );


        /*
        Mở form ngay lập tức,
        không chờ dữ liệu liên kết.
        */

        const opened =
            setArchiveModalVisible(
                true
            );


        if (!opened) {

            return;

        }


        window.setTimeout(() => {

            getArchiveElement(
                "archiveType"
            )?.focus();

        }, 50);


        await ensureArchiveDependenciesLoaded();


        try {

            loadArchiveOptions();

        } catch (error) {

            console.error(
                "Không tải được dữ liệu liên kết:",
                error
            );

        }

    };


    window.closeArchiveForm =
    function () {

        setArchiveModalVisible(
            false
        );


        editingArchiveId =
            null;


        resetArchiveForm();

    };


    // =====================================================
    // LƯU / CẬP NHẬT
    // =====================================================

    window.saveArchiveDossier =
    async function () {

        const type =
            getArchiveValue(
                "archiveType"
            );


        const code =
            getArchiveValue(
                "archiveCode"
            );


        const name =
            getArchiveValue(
                "archiveName"
            );


        let linkedDossierId =
            getArchiveValue(
                "archiveLinkedDossierId"
            );


        if (!linkedDossierId) {

            linkedDossierId =
                getArchiveDatalistId(

                    "archiveLinkedDossierSearch",

                    "archiveDossierList"

                );

        }


        let projectId =
            getArchiveValue(
                "archiveProject"
            );


        let supplierId =
            getArchiveValue(
                "archiveSupplierId"
            );


        if (!supplierId) {

            supplierId =
                getArchiveDatalistId(

                    "archiveSupplierSearch",

                    "archiveSupplierList"

                );

        }


        const linkedDossier =
            getArchiveDossierList()
                .find(item =>

                    String(item.id)

                    ===

                    String(
                        linkedDossierId
                    )

                );


        if (linkedDossier) {

            projectId =
                String(
                    linkedDossier.projectId ||
                    ""
                );


            supplierId =
                String(
                    linkedDossier.supplierId ||
                    ""
                );

        }


        const archiveDate =
            getArchiveValue(
                "archiveDate"
            );


        const location =
            getArchiveValue(
                "archiveLocation"
            );


        const quantity =
            Number(

                getArchiveValue(
                    "archiveQuantity"
                )

                ||

                1

            );


        const note =
            getArchiveValue(
                "archiveNote"
            );


        if (!type) {

            showArchiveNotice(
                "Vui lòng chọn loại hồ sơ.",
                "error"
            );


            return;

        }


        if (!code) {

            showArchiveNotice(
                "Vui lòng nhập số hoặc mã hồ sơ.",
                "error"
            );


            return;

        }


        if (!name) {

            showArchiveNotice(
                "Vui lòng nhập tên tài liệu.",
                "error"
            );


            return;

        }


        if (!archiveDate) {

            showArchiveNotice(
                "Vui lòng chọn ngày lưu.",
                "error"
            );


            return;

        }


        if (
            !Number.isFinite(quantity)

            ||

            quantity < 1
        ) {

            showArchiveNotice(
                "Số lượng phải lớn hơn 0.",
                "error"
            );


            return;

        }


        const isEditing =
            editingArchiveId !== null;


        setArchiveSaveBusy(
            true,
            isEditing
        );


        try {

            ensureArchiveBack4AppReady();


            if (!archiveDataLoaded) {

                await fetchArchiveDossiersFromBack4App(
                    true
                );

            }


            const editingArchive =

                isEditing

                    ? findArchiveInMemory(
                        editingArchiveId
                    )

                    : null;


            if (
                isEditing

                &&

                !editingArchive
            ) {

                throw new Error(
                    "Không tìm thấy hồ sơ lưu cần chỉnh sửa."
                );

            }


            const duplicateLocal =
                archiveDossiers.some(item => {

                    const sameCode =

                        normalizeArchiveText(
                            item.code
                        )

                        ===

                        normalizeArchiveText(
                            code
                        );


                    const sameCurrentItem =

                        isEditing

                        &&

                        sameArchiveIdentity(
                            item,
                            editingArchive
                        );


                    return (

                        sameCode

                        &&

                        !sameCurrentItem

                    );

                });


            if (duplicateLocal) {

                throw new Error(
                    "Số hoặc mã hồ sơ này đã tồn tại."
                );

            }


            await ensureArchiveCodeUnique(

                code,

                editingArchive?.back4appId ||
                ""

            );


            const data = {

                type,

                code,

                name,

                linkedDossierId,

                projectId,

                supplierId,

                archiveDate,

                location,

                quantity,

                note

            };


            let archiveObject;


            if (isEditing) {

                archiveObject =
                    await resolveArchiveParseObject(
                        editingArchive
                    );

            } else {

                archiveObject =
                    new Parse.Object(
                        ARCHIVE_DOSSIER_CLASS_NAME
                    );

            }


            setArchiveParseFields(
                archiveObject,
                data
            );


            const currentUser =
                Parse.User.current();


            if (
                !isEditing

                &&

                currentUser
            ) {

                archiveObject.set(
                    "createdBy",
                    currentUser
                );

            }


            if (currentUser) {

                archiveObject.set(
                    "updatedBy",
                    currentUser
                );

            }


            const savedObject =
                await archiveObject.save();


            const savedArchive =
                archiveParseObjectToPlain(

                    savedObject,

                    editingArchive

                );


            if (isEditing) {

                const index =
                    archiveDossiers.findIndex(
                        item =>

                            sameArchiveIdentity(
                                item,
                                editingArchive
                            )

                    );


                if (index !== -1) {

                    archiveDossiers[index] =
                        savedArchive;

                }

            } else {

                archiveDossiers.unshift(
                    savedArchive
                );

            }


            sortArchiveDossiersInPlace();


            saveArchiveToStorage();


            /*
Kết thúc trạng thái loading trước
khi đóng popup và hiển thị toast.
*/

setArchiveSaveBusy(
    false,
    isEditing
);


window.closeArchiveForm();


window.filterArchiveDossiers();


showArchiveNotice(

    isEditing

        ? "Thông tin hồ sơ lưu đã được cập nhật."

        : "Hồ sơ mới đã được lưu thành công.",

    "success"

);

        } catch (error) {

            console.error(
                "Không lưu được Hồ sơ lưu:",
                error
            );


            showArchiveNotice(

                error.message

                ||

                "Không thể lưu Hồ sơ lưu.",

                "error"

            );

        } finally {

            setArchiveSaveBusy(
                false,
                isEditing
            );

        }

    };


    // =====================================================
    // HIỂN THỊ BẢNG
    // =====================================================

    function createArchiveTableCell(
        value,
        title = ""
    ) {

        const cell =
            document.createElement(
                "td"
            );


        cell.textContent =
            value ?? "—";


        if (title) {

            cell.title =
                title;

        }


        return cell;

    }


    function renderArchiveDossiers(
        data = archiveDossiers
    ) {

        const table =
            getArchiveElement(
                "archiveTable"
            );


        if (!table) {

            return;

        }


        const resultCount =
            getArchiveElement(
                "archiveResultCount"
            );


        if (resultCount) {

            resultCount.textContent =
                `${data.length} hồ sơ`;

        }


        table.innerHTML =
            "";


        if (data.length === 0) {

            setArchiveTableMessage(
                "Chưa có hồ sơ lưu phù hợp"
            );


            return;

        }


        const projectList =
            getArchiveProjectList();


        const supplierList =
            getArchiveSupplierList();


        const dossierList =
            getArchiveDossierList();


        data.forEach(item => {

            const linkedDossier =
                dossierList.find(dossier =>

                    String(dossier.id)

                    ===

                    String(
                        item.linkedDossierId
                    )

                );


            const linkedDossierCode =

                linkedDossier?.code

                ||

                "—";


            const project =
                projectList.find(projectItem =>

                    String(projectItem.id)

                    ===

                    String(item.projectId)

                );


            const supplier =
                supplierList.find(
                    supplierItem =>

                        String(
                            supplierItem.id
                        )

                        ===

                        String(
                            item.supplierId
                        )

                );


            const projectName =

                project?.ten

                ||

                project?.name

                ||

                "—";


            const supplierName =

                supplier?.ten

                ||

                supplier?.name

                ||

                "—";


            const row =
                document.createElement(
                    "tr"
                );


            row.appendChild(

                createArchiveTableCell(
                    item.type || "—",
                    item.type || ""
                )

            );


            row.appendChild(

                createArchiveTableCell(
                    item.code || "—",
                    item.code || ""
                )

            );


            row.appendChild(

                createArchiveTableCell(
                    linkedDossierCode,
                    linkedDossierCode
                )

            );


            row.appendChild(

                createArchiveTableCell(
                    item.name || "—",
                    item.name || ""
                )

            );


            row.appendChild(

                createArchiveTableCell(
                    projectName,
                    projectName
                )

            );


            row.appendChild(

                createArchiveTableCell(
                    supplierName,
                    supplierName
                )

            );


            row.appendChild(

                createArchiveTableCell(

                    formatArchiveDate(
                        item.archiveDate
                    )

                )

            );


            row.appendChild(

                createArchiveTableCell(
                    item.location || "—",
                    item.location || ""
                )

            );


            row.appendChild(

                createArchiveTableCell(

                    String(
                        Number(
                            item.quantity || 1
                        )
                    )

                )

            );


            const actionCell =
                document.createElement(
                    "td"
                );


            const editButton =
                document.createElement(
                    "button"
                );


            editButton.type =
                "button";


            editButton.textContent =
                "Sửa";


            editButton.title =
                "Chỉnh sửa hồ sơ lưu";


            editButton.addEventListener(
                "click",
                () => {

                    window.editArchiveDossier(
                        item.id
                    );

                }
            );

            const deleteButton =
    document.createElement(
        "button"
    );


deleteButton.type =
    "button";


deleteButton.textContent =
    "Xóa";


deleteButton.title =
    "Xóa hồ sơ lưu";


deleteButton.addEventListener(
    "click",
    function () {

        window.deleteArchiveDossier(
            item.id
        );

    }
);


            actionCell.append(
                editButton,
                deleteButton
            );


            row.appendChild(
                actionCell
            );


            table.appendChild(row);

        });

    }


    // =====================================================
    // LỌC
    // =====================================================

    window.filterArchiveDossiers =
    function () {

        const dossierList =
            getArchiveDossierList();


        const keyword =
            normalizeArchiveText(

                getArchiveValue(
                    "archiveSearch"
                )

            );


        const type =
            getArchiveValue(
                "archiveTypeFilter"
            );


        const linkedDossierKeyword =
            normalizeArchiveText(

                getArchiveValue(
                    "archiveLinkedDossierFilter"
                )

            );


        const codeGroup =
            getArchiveValue(
                "archiveCodeGroupFilter"
            );


        const projectId =
            getArchiveValue(
                "archiveProjectFilter"
            );


        const supplierKeyword =
            normalizeArchiveText(

                getArchiveValue(
                    "archiveSupplierSearchFilter"
                )

            );


        const filteredData =
            archiveDossiers.filter(item => {

                const linkedDossier =
                    dossierList.find(dossier =>

                        String(dossier.id)

                        ===

                        String(
                            item.linkedDossierId
                        )

                    );


                const effectiveProjectId =

                    item.projectId

                    ||

                    linkedDossier?.projectId

                    ||

                    "";


                const effectiveSupplierId =

                    item.supplierId

                    ||

                    linkedDossier?.supplierId

                    ||

                    "";


                const supplier =
                    getArchiveSupplierById(
                        effectiveSupplierId
                    );


                const supplierLabel =
                    getArchiveSupplierLabel(
                        supplier
                    );


                const projectName =
                    getArchiveProjectName(
                        effectiveProjectId
                    );


                const linkedDossierLabel =
                    getArchiveDossierLabel(
                        linkedDossier
                    );


                const linkedDossierCode =

                    linkedDossier?.code

                    ||

                    "";


                const currentCodeGroup =
                    getArchiveCodeGroup(

                        linkedDossierCode

                        ||

                        item.code

                    );


                const searchText =
                    normalizeArchiveText(`

                        ${item.code || ""}

                        ${item.name || ""}

                        ${item.location || ""}

                        ${item.note || ""}

                        ${projectName}

                        ${linkedDossierLabel}

                        ${supplierLabel}

                    `);


                const matchKeyword =
                    searchText.includes(
                        keyword
                    );


                const matchType =

                    type === ""

                    ||

                    item.type === type;


                const matchLinkedDossier =

                    linkedDossierKeyword === ""

                    ||

                    normalizeArchiveText(
                        linkedDossierLabel
                    )
                    .includes(
                        linkedDossierKeyword
                    );


                const matchCodeGroup =

                    codeGroup === ""

                    ||

                    currentCodeGroup ===
                    codeGroup;


                const matchProject =

                    projectId === ""

                    ||

                    String(
                        effectiveProjectId
                    )

                    ===

                    String(projectId);


                const matchSupplier =

                    supplierKeyword === ""

                    ||

                    normalizeArchiveText(
                        supplierLabel
                    )
                    .includes(
                        supplierKeyword
                    );


                return (

                    matchKeyword

                    &&

                    matchType

                    &&

                    matchLinkedDossier

                    &&

                    matchCodeGroup

                    &&

                    matchProject

                    &&

                    matchSupplier

                );

            });


        const sortedData =
            sortArchiveDossiersNewestFirst(
                filteredData
            );


        renderArchiveDossiers(
            sortedData
        );

    };


    // =====================================================
    // CHỈNH SỬA
    // =====================================================

    window.editArchiveDossier =
    async function (id) {

        const item =
            findArchiveInMemory(id);


        if (!item) {

            showArchiveNotice(
                "Không tìm thấy hồ sơ lưu.",
                "error"
            );


            return;

        }


        await ensureArchiveDependenciesLoaded();


        try {

            loadArchiveOptions();

        } catch (error) {

            console.error(
                "Không tải được dữ liệu liên kết:",
                error
            );

        }


        editingArchiveId =
            item.id;


        const linkedDossier =
            getArchiveDossierList()
                .find(dossier =>

                    String(dossier.id)

                    ===

                    String(
                        item.linkedDossierId
                    )

                );


        const effectiveProjectId =

            item.projectId

            ||

            linkedDossier?.projectId

            ||

            "";


        const effectiveSupplierId =

            item.supplierId

            ||

            linkedDossier?.supplierId

            ||

            "";


        const supplier =
            getArchiveSupplierById(
                effectiveSupplierId
            );


        setArchiveValue(
            "archiveType",
            item.type
        );


        setArchiveValue(
            "archiveCode",
            item.code
        );


        setArchiveValue(
            "archiveName",
            item.name
        );


        setArchiveValue(

            "archiveLinkedDossierId",

            item.linkedDossierId || ""

        );


        setArchiveValue(

            "archiveLinkedDossierSearch",

            getArchiveDossierLabel(
                linkedDossier
            )

        );


        setArchiveValue(

            "archiveProject",

            effectiveProjectId

        );


        setArchiveValue(

            "archiveSupplierId",

            effectiveSupplierId

        );


        setArchiveValue(

            "archiveSupplierSearch",

            getArchiveSupplierLabel(
                supplier
            )

        );


        setArchiveValue(
            "archiveDate",
            item.archiveDate
        );


        setArchiveValue(
            "archiveLocation",
            item.location
        );


        setArchiveValue(
            "archiveQuantity",
            item.quantity
        );


        setArchiveValue(
            "archiveNote",
            item.note
        );


        const projectSelect =
            getArchiveElement(
                "archiveProject"
            );


        const supplierSearch =
            getArchiveElement(
                "archiveSupplierSearch"
            );


        const hasValidLinkedDossier =
            Boolean(linkedDossier);


        if (projectSelect) {

            projectSelect.disabled =
                hasValidLinkedDossier;

        }


        if (supplierSearch) {

            supplierSearch.disabled =
                hasValidLinkedDossier;

        }


        const title =
            getArchiveElement(
                "archiveFormTitle"
            );


        if (title) {

            title.textContent =
                "Chỉnh sửa hồ sơ lưu";

        }


        setArchiveSaveBusy(
            false,
            true
        );


        setArchiveModalVisible(
            true
        );

    };

// =====================================================
// XÓA HỒ SƠ LƯU
// =====================================================

window.deleteArchiveDossier =
async function (id) {

    const item =
        findArchiveInMemory(id);


    if (!item) {

        showArchiveNotice(
            "Không tìm thấy hồ sơ lưu cần xóa.",
            "error"
        );

        return;

    }


    const displayName =

        item.name

        ||

        item.code

        ||

        "hồ sơ này";


    const confirmed =
        window.confirm(

            `Bạn có chắc chắn muốn xóa "${displayName}"?\n\n`

            +

            "Thao tác này không thể hoàn tác."

        );


    if (!confirmed) {

        return;

    }


    try {

        ensureArchiveBack4AppReady();


        let archiveObject;


        const back4appId =
            String(
                item.back4appId || ""
            ).trim();


        /*
        Hồ sơ mới tải từ Back4App:
        xóa trực tiếp bằng objectId.
        */

        if (back4appId) {

            const ArchiveClass =
                Parse.Object.extend(
                    ARCHIVE_DOSSIER_CLASS_NAME
                );


            archiveObject =
                new ArchiveClass();


            archiveObject.id =
                back4appId;

        } else {

            /*
            Hồ sơ cache cũ:
            tìm trên Back4App bằng legacyId
            hoặc codeNormalized.
            */

            archiveObject =
                await resolveArchiveParseObject(
                    item
                );

        }


        await archiveObject.destroy();


        /*
        Chỉ loại khỏi bộ nhớ sau khi Back4App
        xác nhận xóa thành công.
        */

        archiveDossiers =
            archiveDossiers.filter(
                archiveItem =>

                    !sameArchiveIdentity(
                        archiveItem,
                        item
                    )

            );


        saveArchiveToStorage();


        /*
        Tải lại từ Back4App để chắc chắn
        giao diện đồng bộ với database.
        */

        try {

            await fetchArchiveDossiersFromBack4App(
                true
            );

        } catch (reloadError) {

            console.warn(
                "Đã xóa nhưng chưa tải lại được danh sách:",
                reloadError
            );

        }


        window.filterArchiveDossiers();


        showArchiveNotice(
            "Hồ sơ lưu đã được xóa thành công.",
            "success"
        );

    } catch (error) {

        console.error(
            "❌ Không xóa được ArchiveDossier:",
            {
                selectedId: id,
                item,
                back4appId:
                    item.back4appId,
                errorCode:
                    error?.code,
                errorMessage:
                    error?.message,
                error
            }
        );


        const errorCode =
            Number(error?.code);


        const rawMessage =
            String(
                error?.message || ""
            );


        /*
        Object not found:
        dữ liệu local cache cũ nhưng object
        trên Back4App đã không còn.
        */

        if (errorCode === 101) {

            archiveDossiers =
                archiveDossiers.filter(
                    archiveItem =>

                        !sameArchiveIdentity(
                            archiveItem,
                            item
                        )

                );


            saveArchiveToStorage();


            window.filterArchiveDossiers();


            showArchiveNotice(
                "Hồ sơ không còn trên Back4App nên đã được loại khỏi danh sách.",
                "warning"
            );

            return;

        }


        /*
        Không có quyền Delete.
        */

        if (
            errorCode === 119

            ||

            /permission|forbidden|authorized|not allowed/i
                .test(rawMessage)
        ) {

            showArchiveNotice(
                "Tài khoản hiện tại chưa có quyền xóa ArchiveDossier. Hãy bật quyền Delete cho người dùng đã đăng nhập trên Back4App.",
                "error"
            );

            return;

        }


        /*
        Phiên đăng nhập hết hạn.
        */

        if (
            errorCode === 209

            ||

            /invalid session|session token/i
                .test(rawMessage)
        ) {

            showArchiveNotice(
                "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi thực hiện xóa.",
                "error"
            );

            return;

        }


        showArchiveNotice(

            rawMessage

            ||

            "Không thể xóa hồ sơ lưu.",

            "error"

        );

    }

};

    // =====================================================
    // ĐẶT LẠI BỘ LỌC
    // =====================================================

    window.resetArchiveFilters =
    function () {

        setArchiveValue(
            "archiveSearch",
            ""
        );


        setArchiveValue(
            "archiveTypeFilter",
            ""
        );


        setArchiveValue(
            "archiveLinkedDossierFilter",
            ""
        );


        setArchiveValue(
            "archiveCodeGroupFilter",
            ""
        );


        setArchiveValue(
            "archiveProjectFilter",
            ""
        );


        setArchiveValue(
            "archiveSupplierSearchFilter",
            ""
        );


        window.filterArchiveDossiers();

    };


    // =====================================================
    // PHÍM ESC ĐÓNG MODAL
    // =====================================================

    if (
        window.archiveKeyboardEventReady !==
        true
    ) {

        window.archiveKeyboardEventReady =
            true;


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key !== "Escape") {

                    return;

                }


                const modal =
                    getArchiveElement(
                        "archiveModal"
                    );


                if (
                    modal

                    &&

                    modal.classList.contains(
                        "show"
                    )
                ) {

                    window.closeArchiveForm();

                }

            }
        );

    }


    // =====================================================
    // ĐƯA HÀM RA WINDOW
    // =====================================================

    window.initializeArchivePage =
        initializeArchivePage;


    window.loadArchiveDossiers =
        loadArchiveDossiers;


    window.loadArchiveOptions =
        loadArchiveOptions;


    window.renderArchiveDossiers =
        renderArchiveDossiers;


    window.migrateArchiveDossiersToBack4App =
        migrateArchiveDossiersToBack4App;


    window.fetchArchiveDossiersFromBack4App =
        fetchArchiveDossiersFromBack4App;


    window.getArchiveDossiersData =
    function () {

        return [...archiveDossiers];

    };


})();
