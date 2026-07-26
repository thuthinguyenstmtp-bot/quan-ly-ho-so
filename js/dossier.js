;(() => {

    "use strict";


    // =====================================================
    // CẤU HÌNH
    // =====================================================

    const DOSSIER_PAGE_CLASS_NAME =
        "Dossier";


    const DOSSIER_STORAGE_KEY =
        "dossiers";


    const DOSSIER_MIGRATION_KEY =
        "dossierBack4AppMigrationV2";


    // =====================================================
    // TRẠNG THÁI
    // =====================================================

    let dossiers =
        getDossierStorageArray(
            DOSSIER_STORAGE_KEY
        );


    let editingDossierId =
        null;


    let dossierDataLoaded =
        false;


    let dossierLoadingPromise =
        null;


    let dossierMigrationPromise =
        null;


    let dossierModalMountState =
        null;


    const selectedDossierIds =
        new Set();


    let currentRenderedDossiers =
        [];


    let dossierFilteredData =
        [];


    let dossierCurrentPage =
        1;


    let dossierPageSize =
        20;


    // =====================================================
    // DOM
    // =====================================================

    function getDossierElement(id) {

        return document.getElementById(id);

    }


    function getDossierInputValue(id) {

        const element =
            getDossierElement(id);


        return element

            ? String(
                element.value ?? ""
            ).trim()

            : "";

    }


    function setDossierInputValue(
        id,
        value
    ) {

        const element =
            getDossierElement(id);


        if (element) {

            element.value =
                value ?? "";

        }

    }


    function setDossierChecked(
        id,
        checked
    ) {

        const element =
            getDossierElement(id);


        if (element) {

            element.checked =
                Boolean(checked);

        }

    }


    // =====================================================
    // THÔNG BÁO
    // =====================================================

    function showDossierNotice(
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


        if (type === "error") {

            console.error(message);

        } else {

            console.log(message);

        }


        window.alert(message);

    }


    // =====================================================
    // CHUẨN HÓA
    // =====================================================

    function normalizeDossierText(value) {

        return String(value ?? "")

            .normalize("NFD")

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


    function escapeDossierHtml(value) {

        return String(value ?? "")

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    function parseDossierBoolean(value) {

        return (
            value === true

            ||

            value === 1

            ||

            String(value).toLowerCase() ===
            "true"
        );

    }


    function parseDossierValue(value) {

        const cleanedValue =
            String(value ?? "")

                .replace(
                    /[^\d-]/g,
                    ""
                );


        const numberValue =
            Number(cleanedValue);


        return Number.isFinite(numberValue)

            ? numberValue

            : 0;

    }


    function formatDossierDate(date) {

        if (!date) {

            return "";

        }


        const parts =
            String(date).split("-");


        if (parts.length !== 3) {

            return String(date);

        }


        return `${parts[2]}/${parts[1]}/${parts[0]}`;

    }


    function getDossierCreatedTime(item) {

        const createdAtTime =
            Date.parse(
                item?.createdAt || ""
            );


        if (!Number.isNaN(createdAtTime)) {

            return createdAtTime;

        }


        const updatedAtTime =
            Date.parse(
                item?.updatedAt || ""
            );


        if (!Number.isNaN(updatedAtTime)) {

            return updatedAtTime;

        }


        const legacyTime =
            Number(
                item?.legacyId

                ||

                item?.id

                ||

                0
            );


        return Number.isFinite(legacyTime)

            ? legacyTime

            : 0;

    }


    // =====================================================
    // STORAGE
    // =====================================================

    function getDossierStorageArray(key) {

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
                `Không đọc được ${key}:`,
                error
            );


            return [];

        }

    }


    function saveDossiersToStorage() {

        try {

            localStorage.setItem(

                DOSSIER_STORAGE_KEY,

                JSON.stringify(dossiers)

            );

        } catch (error) {

            console.error(
                "Không lưu được cache Hồ sơ:",
                error
            );

        }

    }


    // =====================================================
    // ID CỦA OBJECT
    // =====================================================

    function getEntityIdentifiers(item) {

        if (!item) {

            return [];

        }


        return [

            item.id,

            item.back4appId,

            item.objectId,

            item.legacyId

        ]
            .filter(Boolean)

            .map(value =>
                String(value)
            );

    }


    function getEntityStableId(item) {

        if (!item) {

            return "";

        }


        return String(

            item.back4appId

            ||

            item.objectId

            ||

            item.id

            ||

            item.legacyId

            ||

            ""

        ).trim();

    }


    function entityMatchesId(
        item,
        id
    ) {

        const targetId =
            String(id ?? "");


        if (!targetId) {

            return false;

        }


        return getEntityIdentifiers(item)
            .includes(targetId);

    }


    function getDossierIdentifiers(item) {

        return getEntityIdentifiers(item);

    }


    function findLocalDossierByAnyId(id) {

        return dossiers.find(item =>

            entityMatchesId(
                item,
                id
            )

        ) || null;

    }


    function sameDossierIdentity(
        firstItem,
        secondItem
    ) {

        if (
            !firstItem

            ||

            !secondItem
        ) {

            return false;

        }


        const secondIds =
            new Set(
                getDossierIdentifiers(
                    secondItem
                )
            );


        return getDossierIdentifiers(
            firstItem
        )
            .some(id =>
                secondIds.has(id)
            );

    }


    // =====================================================
    // DỰ ÁN
    // =====================================================

    function getDossierProjects() {

        if (
            typeof window.getProjectsData ===
            "function"
        ) {

            const projectData =
                window.getProjectsData();


            if (Array.isArray(projectData)) {

                return projectData;

            }

        }


        if (Array.isArray(window.projects)) {

            return window.projects;

        }


        try {

            if (
                typeof projects !==
                "undefined"

                &&

                Array.isArray(projects)
            ) {

                return projects;

            }

        } catch (error) {

            console.debug(
                "Không đọc được biến projects:",
                error
            );

        }


        return [];

    }


    function getDossierProjectById(id) {

        return getDossierProjects()
            .find(project =>

                entityMatchesId(
                    project,
                    id
                )

            ) || null;

    }


    function getDossierProjectName(item) {

        const project =
            getDossierProjectById(
                item?.projectId
            );


        return String(

            project?.ten

            ||

            project?.name

            ||

            "Dự án đã xóa"

        ).trim();

    }


    function setDossierProjectById(projectId) {

        const select =
            getDossierElement(
                "dossierProject"
            );


        if (!select) {

            return;

        }


        const project =
            getDossierProjectById(
                projectId
            );


        if (!project) {

            select.value =
                projectId || "";


            return;

        }


        const validIds =
            getEntityIdentifiers(project);


        const matchingOption =
            Array.from(select.options)
                .find(option =>

                    validIds.includes(
                        String(option.value)
                    )

                );


        if (matchingOption) {

            select.value =
                matchingOption.value;


            return;

        }


        const stableId =
            getEntityStableId(project);


        if (stableId) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                stableId;


            option.textContent =
                project.ten

                ||

                project.name

                ||

                "Không có tên";


            select.appendChild(option);


            select.value =
                stableId;

        }

    }


    // =====================================================
    // NHÀ CUNG CẤP
    // =====================================================

    function getDossierSuppliers() {

        if (
            typeof window.getSuppliersData ===
            "function"
        ) {

            const supplierData =
                window.getSuppliersData();


            if (Array.isArray(supplierData)) {

                return supplierData;

            }

        }


        if (Array.isArray(window.suppliers)) {

            return window.suppliers;

        }


        try {

            if (
                typeof suppliers !==
                "undefined"

                &&

                Array.isArray(suppliers)
            ) {

                return suppliers;

            }

        } catch (error) {

            console.debug(
                "Không đọc được biến suppliers:",
                error
            );

        }


        return [];

    }

// =====================================================
// DROPDOWN TÌM NHÀ CUNG CẤP
// =====================================================

let dossierSupplierSearchResults =
    [];


let dossierSupplierActiveIndex =
    -1;


function hideDossierSupplierDropdown(){

    const dropdown =
        getDossierElement(
            "dossierSupplierDropdown"
        );


    if(!dropdown){

        return;

    }

    getDossierElement(
    "dossierSupplierSearch"
)?.setAttribute(
    "aria-expanded",
    "false"
);


    dropdown.hidden =
        true;


    dropdown.innerHTML =
        "";


    dossierSupplierSearchResults =
        [];


    dossierSupplierActiveIndex =
        -1;

}


function updateDossierSupplierDropdownActive(){

    const dropdown =
        getDossierElement(
            "dossierSupplierDropdown"
        );


    if(!dropdown){

        return;

    }


    const buttons =
        dropdown.querySelectorAll(
            ".dossier-supplier-option"
        );


    buttons.forEach(
        function(button, index){

            const active =
                index ===
                dossierSupplierActiveIndex;


            button.classList.toggle(
                "is-active",
                active
            );


            if(active){

                button.scrollIntoView({

                    block:
                        "nearest",

                    behavior:
                        "auto"

                });

            }

        }
    );

}


function setDossierSupplierSearchMessage(
    message,
    type = ""
){

    const hint =
        getDossierElement(
            "dossierSupplierSearchHint"
        );


    if(!hint){

        return;

    }


    hint.textContent =
        message;


    hint.classList.remove(
        "is-valid",
        "is-invalid"
    );


    if(type === "valid"){

        hint.classList.add(
            "is-valid"
        );

    }


    if(type === "invalid"){

        hint.classList.add(
            "is-invalid"
        );

    }

}


function selectDossierSupplier(
    supplierId
){

    const supplier =
        getDossierSupplierById(
            supplierId
        );


    const hiddenSelect =
        getDossierElement(
            "dossierSupplier"
        );


    const searchInput =
        getDossierElement(
            "dossierSupplierSearch"
        );


    if(
        !supplier

        ||

        !hiddenSelect

        ||

        !searchInput
    ){

        return;

    }


    const stableId =
        getDossierSupplierStableId(
            supplier
        );


    /*
    Bảo đảm select ẩn có option tương ứng.
    */

    let matchingOption =
        Array.from(
            hiddenSelect.options
        )
        .find(option =>

            String(option.value)

            ===

            String(stableId)

        );


    if(!matchingOption){

        matchingOption =
            document.createElement(
                "option"
            );


        matchingOption.value =
            stableId;


        matchingOption.textContent =
            getDossierSupplierLabel(
                supplier
            );


        hiddenSelect.appendChild(
            matchingOption
        );

    }


    hiddenSelect.value =
        stableId;


    searchInput.value =
        getDossierSupplierLabel(
            supplier
        );


    setDossierSupplierSearchMessage(

        `Đã chọn: ${getDossierSupplierName(
            supplier
        )}`,

        "valid"

    );


    searchInput.setAttribute(
        "aria-invalid",
        "false"
    );


    hideDossierSupplierDropdown();

}


function renderDossierSupplierDropdown(
    keyword = ""
){

    const dropdown =
        getDossierElement(
            "dossierSupplierDropdown"
        );


    if(!dropdown){

        return;

    }


    const normalizedKeyword =
        normalizeDossierText(
            keyword
        );


    const supplierList =
        [...getDossierSuppliers()];


    let matchedSuppliers;


    if(!normalizedKeyword){

        /*
        Khi chưa gõ, chỉ hiển thị 10 NCC đầu tiên.
        */

        matchedSuppliers =
            supplierList.slice(
                0,
                10
            );

    }else{

        matchedSuppliers =
            supplierList.filter(
                supplier =>

                    getDossierSupplierSearchText(
                        supplier
                    )
                    .includes(
                        normalizedKeyword
                    )

            );

    }


    matchedSuppliers.sort(
        function(a, b){

            return getDossierSupplierLabel(a)
                .localeCompare(

                    getDossierSupplierLabel(b),

                    "vi",

                    {
                        sensitivity:
                            "base",

                        numeric:
                            true
                    }

                );

        }
    );


    /*
    Chỉ hiển thị tối đa 12 kết quả,
    tránh danh sách quá dài.
    */

    dossierSupplierSearchResults =
        matchedSuppliers.slice(
            0,
            12
        );


    dossierSupplierActiveIndex =
        -1;


    dropdown.innerHTML =
        "";


    if(
        dossierSupplierSearchResults
            .length === 0
    ){

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.className =
            "dossier-supplier-empty";


        emptyMessage.textContent =
            "Không tìm thấy nhà cung cấp phù hợp.";


        dropdown.appendChild(
            emptyMessage
        );


        dropdown.hidden =
            false;

        getDossierElement(
    "dossierSupplierSearch"
)?.setAttribute(
    "aria-expanded",
    "true"
);


        setDossierSupplierSearchMessage(
            "Không tìm thấy nhà cung cấp phù hợp.",
            "invalid"
        );


        return;

    }


    dossierSupplierSearchResults.forEach(
        function(supplier){

            const supplierId =
                getDossierSupplierStableId(
                    supplier
                );


            const optionButton =
                document.createElement(
                    "button"
                );


            optionButton.type =
                "button";


            optionButton.className =
                "dossier-supplier-option";


            optionButton.dataset.id =
                supplierId;


            const nameElement =
                document.createElement(
                    "strong"
                );


            nameElement.textContent =
                getDossierSupplierName(
                    supplier
                );


            const detailElement =
                document.createElement(
                    "span"
                );


            const code =
                getDossierSupplierCode(
                    supplier
                );


            const phone =
                getDossierSupplierPhone(
                    supplier
                );


            detailElement.textContent =
                [

                    code,

                    phone

                ]
                .filter(Boolean)
                .join(" • ");


            optionButton.appendChild(
                nameElement
            );


            if(detailElement.textContent){

                optionButton.appendChild(
                    detailElement
                );

            }


            /*
            Dùng mousedown để chọn trước khi
            input bị mất focus.
            */

            optionButton.addEventListener(
                "mousedown",
                function(event){

                    event.preventDefault();


                    selectDossierSupplier(
                        supplierId
                    );

                }
            );


            dropdown.appendChild(
                optionButton
            );

        }
    );


    dropdown.hidden =
        false;


    if(normalizedKeyword){

        const totalMatches =
            matchedSuppliers.length;


        setDossierSupplierSearchMessage(

            totalMatches > 12

                ? `Có ${totalMatches} kết quả. Đang hiển thị 12 kết quả đầu tiên.`

                : `Có ${totalMatches} nhà cung cấp phù hợp.`

        );

    }else{

        setDossierSupplierSearchMessage(
            "Nhập tên hoặc mã để thu hẹp kết quả."
        );

    }

}


function searchDossierSuppliers(
    keyword
){

    const hiddenSelect =
        getDossierElement(
            "dossierSupplier"
        );


    const searchInput =
        getDossierElement(
            "dossierSupplierSearch"
        );


    if(
        !hiddenSelect

        ||

        !searchInput
    ){

        return;

    }


    /*
    Khi người dùng sửa nội dung đã chọn,
    xóa ID cũ để tránh lưu nhầm NCC.
    */

    const selectedSupplier =
        getDossierSupplierById(
            hiddenSelect.value
        );


    if(selectedSupplier){

        const selectedLabel =
            getDossierSupplierLabel(
                selectedSupplier
            );


        if(
            normalizeDossierText(
                searchInput.value
            )

            !==

            normalizeDossierText(
                selectedLabel
            )
        ){

            hiddenSelect.value =
                "";


            searchInput.removeAttribute(
                "aria-invalid"
            );

        }

    }


    renderDossierSupplierDropdown(
        keyword
    );

}

document.addEventListener(

    "mousedown",

    function(event) {

        const picker =
            event.target?.closest?.(
                ".dossier-supplier-picker"
            );


        if (!picker) {

            hideDossierSupplierDropdown();

        }

    }

);

function handleDossierSupplierKeydown(
    event
){

    const dropdown =
        getDossierElement(
            "dossierSupplierDropdown"
        );


    if(
        !dropdown

        ||

        dropdown.hidden
    ){

        if(event.key === "ArrowDown"){

            searchDossierSuppliers(
                event.currentTarget.value
            );

        }


        return;

    }


    if(event.key === "ArrowDown"){

        event.preventDefault();


        dossierSupplierActiveIndex =
            Math.min(

                dossierSupplierActiveIndex + 1,

                dossierSupplierSearchResults
                    .length - 1

            );


        updateDossierSupplierDropdownActive();


        return;

    }


    if(event.key === "ArrowUp"){

        event.preventDefault();


        dossierSupplierActiveIndex =
            Math.max(

                dossierSupplierActiveIndex - 1,

                0

            );


        updateDossierSupplierDropdownActive();


        return;

    }


    if(event.key === "Enter"){

        event.preventDefault();


        if(
            dossierSupplierActiveIndex >= 0

            &&

            dossierSupplierSearchResults[
                dossierSupplierActiveIndex
            ]
        ){

            const supplier =
                dossierSupplierSearchResults[
                    dossierSupplierActiveIndex
                ];


            selectDossierSupplier(

                getDossierSupplierStableId(
                    supplier
                )

            );


            return;

        }


        /*
        Không dùng phím Enter để submit form
        khi người dùng chưa chọn NCC.
        */

        handleDossierSupplierSearchChange(
            true
        );


        return;

    }


    if(event.key === "Escape"){

        event.preventDefault();


        hideDossierSupplierDropdown();

    }

}
    function getDossierSupplierStableId(
        supplier
    ) {

        return getEntityStableId(
            supplier
        );

    }


    function getDossierSupplierIdentifiers(
        supplier
    ) {

        return getEntityIdentifiers(
            supplier
        );

    }


    function getDossierSupplierById(id) {

        return getDossierSuppliers()
            .find(supplier =>

                entityMatchesId(
                    supplier,
                    id
                )

            ) || null;

    }


    function getDossierSupplierCode(
        supplier
    ) {

        if (!supplier) {

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


    function getDossierSupplierName(
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

            "Không có tên"

        ).trim();

    }


    function getDossierSupplierPhone(
        supplier
    ) {

        if (!supplier) {

            return "";

        }


        return String(

            supplier.sdt

            ||

            supplier.phone

            ||

            supplier.phoneNumber

            ||

            ""

        ).trim();

    }


    function getDossierSupplierReceiver(
        supplier
    ) {

        if (!supplier) {

            return "";

        }


        return String(

            supplier.nguoinhan

            ||

            supplier.receiver

            ||

            supplier.contact

            ||

            ""

        ).trim();

    }


    function getDossierSupplierAddress(
        supplier
    ) {

        if (!supplier) {

            return "";

        }


        return String(

            supplier.diachi

            ||

            supplier.address

            ||

            ""

        ).trim();

    }


    function getDossierSupplierLabel(
        supplier
    ) {

        if (!supplier) {

            return "";

        }


        const code =
            getDossierSupplierCode(
                supplier
            );


        const name =
            getDossierSupplierName(
                supplier
            );


        const phone =
            getDossierSupplierPhone(
                supplier
            );


        let label =
            code

                ? `${code} - ${name}`

                : name;


        if (phone) {

            label +=
                ` | ${phone}`;

        }


        return label;

    }


    function getDossierSupplierSearchText(
        supplier
    ) {

        return normalizeDossierText(`

            ${getDossierSupplierCode(
                supplier
            )}

            ${getDossierSupplierName(
                supplier
            )}

            ${getDossierSupplierPhone(
                supplier
            )}

            ${getDossierSupplierReceiver(
                supplier
            )}

            ${getDossierSupplierAddress(
                supplier
            )}

            ${getDossierSupplierLabel(
                supplier
            )}

        `);

    }

    // =====================================================
// ĐỒNG BỘ NHÀ CUNG CẤP CHO CUSTOM DROPDOWN
// =====================================================

function updateDossierSupplierHint(
    state,
    supplier = null
) {

    if (state === "empty") {

        setDossierSupplierSearchMessage(
            "Nhập tên, mã hoặc số điện thoại để tìm nhà cung cấp."
        );

        return;

    }


    if (state === "valid") {

        setDossierSupplierSearchMessage(

            supplier

                ? `Đã chọn: ${getDossierSupplierName(supplier)}`

                : "Đã chọn đúng nhà cung cấp.",

            "valid"

        );

        return;

    }


    if (state === "ambiguous") {

        setDossierSupplierSearchMessage(
            "Có nhiều nhà cung cấp phù hợp. Hãy nhập thêm ký tự hoặc chọn một kết quả.",
            "invalid"
        );

        return;

    }


    setDossierSupplierSearchMessage(
        "Không tìm thấy nhà cung cấp phù hợp.",
        "invalid"
    );

}


function getDossierSupplierMatches(
    inputValue
) {

    const normalizedInput =
        normalizeDossierText(
            inputValue
        );


    if (!normalizedInput) {

        return [];

    }


    const supplierList =
        getDossierSuppliers();


    const exactMatches =
        supplierList.filter(
            supplier => {

                const exactValues = [

                    getDossierSupplierLabel(
                        supplier
                    ),

                    getDossierSupplierName(
                        supplier
                    ),

                    getDossierSupplierCode(
                        supplier
                    ),

                    getDossierSupplierPhone(
                        supplier
                    )

                ];


                return exactValues.some(
                    value =>

                        value

                        &&

                        normalizeDossierText(
                            value
                        )

                        ===

                        normalizedInput

                );

            }
        );


    if (exactMatches.length > 0) {

        return exactMatches;

    }


    return supplierList.filter(
        supplier =>

            getDossierSupplierSearchText(
                supplier
            )
                .includes(
                    normalizedInput
                )

    );

}


function handleDossierSupplierSearchChange(
    commitSelection = false
) {

    const searchInput =
        getDossierElement(
            "dossierSupplierSearch"
        );


    const supplierSelect =
        getDossierElement(
            "dossierSupplier"
        );


    if (!supplierSelect) {

        console.error(
            "Không tìm thấy #dossierSupplier."
        );

        return "";

    }


    if (!searchInput) {

        return String(
            supplierSelect.value || ""
        );

    }


    const inputValue =
        String(
            searchInput.value || ""
        ).trim();


    if (!inputValue) {

        supplierSelect.value =
            "";

        updateDossierSupplierHint(
            "empty"
        );

        return "";

    }


    const currentlySelectedSupplier =
        getDossierSupplierById(
            supplierSelect.value
        );


    if (
        currentlySelectedSupplier

        &&

        normalizeDossierText(
            inputValue
        )

        ===

        normalizeDossierText(

            getDossierSupplierLabel(
                currentlySelectedSupplier
            )

        )
    ) {

        updateDossierSupplierHint(
            "valid",
            currentlySelectedSupplier
        );


        return getDossierSupplierStableId(
            currentlySelectedSupplier
        );

    }


    const matches =
        getDossierSupplierMatches(
            inputValue
        );


    if (matches.length === 1) {

        const supplier =
            matches[0];


        const supplierId =
            getDossierSupplierStableId(
                supplier
            );


        selectDossierSupplier(
            supplierId
        );


        return supplierId;

    }


    supplierSelect.value =
        "";


    updateDossierSupplierHint(

        matches.length > 1

            ? "ambiguous"

            : "invalid"

    );


    return "";

}


function setDossierSupplierById(
    supplierId
) {

    const supplier =
        getDossierSupplierById(
            supplierId
        );


    if (!supplier) {

        setDossierInputValue(
            "dossierSupplier",
            ""
        );


        setDossierInputValue(
            "dossierSupplierSearch",
            ""
        );


        updateDossierSupplierHint(
            "empty"
        );


        hideDossierSupplierDropdown();


        return;

    }


    selectDossierSupplier(

        getDossierSupplierStableId(
            supplier
        )

    );

}


/*
Hàm này không còn tạo datalist.

Nó chỉ tạo option cho select ẩn để lưu
đúng supplierId.
*/

function loadDossierSupplierSearchOptions() {

    const supplierSelect =
        getDossierElement(
            "dossierSupplier"
        );


    const supplierList =
        [...getDossierSuppliers()]

            .filter(supplier =>

                Boolean(

                    getDossierSupplierStableId(
                        supplier
                    )

                )

            )

            .sort((a, b) =>

                getDossierSupplierLabel(a)
                    .localeCompare(

                        getDossierSupplierLabel(b),

                        "vi",

                        {
                            sensitivity:
                                "base",

                            numeric:
                                true
                        }

                    )

            );


    if (!supplierSelect) {

        /*
        Trường hợp đang ở trang thanh toán,
        chưa mở form hồ sơ.
        */

        return supplierList.length;

    }


    const currentSupplierId =
        String(
            supplierSelect.value || ""
        );


    supplierSelect.innerHTML = `

        <option value="">
            -- Chọn nhà cung cấp --
        </option>

    `;


    supplierList.forEach(
        supplier => {

            const supplierId =
                getDossierSupplierStableId(
                    supplier
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                supplierId;


            option.textContent =
                getDossierSupplierLabel(
                    supplier
                );


            supplierSelect.appendChild(
                option
            );

        }
    );


    const selectedSupplier =
        getDossierSupplierById(
            currentSupplierId
        );


    if (selectedSupplier) {

        supplierSelect.value =
            getDossierSupplierStableId(
                selectedSupplier
            );

    }


    return supplierList.length;

}

// =====================================================
// TẠO DANH SÁCH GỢI Ý NHÀ CUNG CẤP
// =====================================================

function loadDossierSupplierSearchOptions() {

    const supplierSelect =
        getDossierElement(
            "dossierSupplier"
        );


    const searchInput =
        getDossierElement(
            "dossierSupplierSearch"
        );


    const datalist =
        getDossierElement(
            "dossierSupplierList"
        );


    if (!supplierSelect) {

        console.warn(
            "Không tìm thấy #dossierSupplier."
        );


        return 0;

    }


    if (!searchInput) {

        console.warn(
            "Không tìm thấy #dossierSupplierSearch."
        );


        return 0;

    }


    if (!datalist) {

        console.warn(
            "Không tìm thấy #dossierSupplierList."
        );


        return 0;

    }


    const currentSupplierId =
        String(
            supplierSelect.value || ""
        );


    const currentSearchText =
        String(
            searchInput.value || ""
        );


    const supplierList =
        [...getDossierSuppliers()]

            .filter(supplier => {

                return Boolean(

                    getDossierSupplierStableId(
                        supplier
                    )

                );

            })

            .sort((a, b) => {

                return getDossierSupplierLabel(a)
                    .localeCompare(

                        getDossierSupplierLabel(b),

                        "vi",

                        {
                            sensitivity:
                                "base",

                            numeric:
                                true
                        }

                    );

            });


    /*
    Xóa dữ liệu cũ.
    */

    supplierSelect.innerHTML =
        "";


    datalist.innerHTML =
        "";


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value =
        "";


    defaultOption.textContent =
        "-- Chọn nhà cung cấp --";


    supplierSelect.appendChild(
        defaultOption
    );


    /*
    Tạo option cho select ẩn
    và datalist hiển thị.
    */

    supplierList.forEach(supplier => {

        const supplierId =
            getDossierSupplierStableId(
                supplier
            );


        const supplierLabel =
            getDossierSupplierLabel(
                supplier
            );


        if (
            !supplierId

            ||

            !supplierLabel
        ) {

            return;

        }


        const hiddenOption =
            document.createElement(
                "option"
            );


        hiddenOption.value =
            supplierId;


        hiddenOption.textContent =
            supplierLabel;


        supplierSelect.appendChild(
            hiddenOption
        );


        const suggestionOption =
            document.createElement(
                "option"
            );


        suggestionOption.value =
            supplierLabel;


        suggestionOption.dataset.id =
            supplierId;


        /*
        Một số trình duyệt hiển thị label
        rõ hơn khi có textContent.
        */

        suggestionOption.textContent =
            supplierLabel;


        datalist.appendChild(
            suggestionOption
        );

    });


    /*
    Khôi phục NCC khi sửa hồ sơ.
    */

    const selectedSupplier =
        getDossierSupplierById(
            currentSupplierId
        );


    if (selectedSupplier) {

        setDossierSupplierById(
            currentSupplierId
        );

    } else {

        supplierSelect.value =
            "";


        searchInput.value =
            currentSearchText;


        if (currentSearchText) {

            handleDossierSupplierSearchChange(
                false
            );

        } else {

            updateDossierSupplierHint(
                "empty"
            );

        }

    }


    console.log(
        `Đã tạo ${datalist.options.length} gợi ý Nhà cung cấp.`
    );


    return datalist.options.length;

}

// =====================================================
// CHỜ SUPPLIER.JS TẢI XONG DỮ LIỆU
// =====================================================

async function waitForDossierSuppliers(
    maximumAttempts = 30,
    delayMilliseconds = 100
) {

    for (
        let attempt = 0;

        attempt < maximumAttempts;

        attempt += 1
    ) {

        const supplierList =
            getDossierSuppliers();


        if (
            Array.isArray(supplierList)

            &&

            supplierList.length > 0
        ) {

            return supplierList;

        }


        await new Promise(resolve => {

            window.setTimeout(
                resolve,
                delayMilliseconds
            );

        });

    }


    return [];

}
// =====================================================
// TẢI DỰ ÁN VÀ NHÀ CUNG CẤP CHO FORM
// =====================================================
async function loadDossierReferenceData() {

    const loadingTasks =
        [];


    if (
        typeof window.loadProjectSelect ===
        "function"
    ) {

        loadingTasks.push(

            Promise.resolve(
                window.loadProjectSelect()
            )

        );

    }


    if (
        typeof window.loadSupplierSelect ===
        "function"
    ) {

        loadingTasks.push(

            Promise.resolve(
                window.loadSupplierSelect()
            )

        );

    }


    if (loadingTasks.length > 0) {

        const results =
            await Promise.allSettled(
                loadingTasks
            );


        results.forEach(result => {

            if (
                result.status ===
                "rejected"
            ) {

                console.error(
                    "Không tải được dữ liệu tham chiếu:",
                    result.reason
                );

            }

        });

    }


    const supplierList =
        await waitForDossierSuppliers();


    const optionCount =
        loadDossierSupplierSearchOptions();


    return {

        suppliers:
            supplierList,

        optionCount

    };

}

    // =====================================================
    // BACK4APP
    // =====================================================

    function ensureDossierBack4AppReady() {

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


    function dossierParseObjectToPlain(
        parseObject,
        fallbackDossier = null
    ) {

        const fallbackLegacyId =
            fallbackDossier?.id

            &&

            String(fallbackDossier.id)

            !==

            String(
                fallbackDossier.back4appId || ""
            )

                ? String(
                    fallbackDossier.id
                )

                : "";


        const legacyId =
            String(

                parseObject.get(
                    "legacyId"
                )

                ||

                fallbackDossier?.legacyId

                ||

                fallbackLegacyId

                ||

                ""

            ).trim();


        const back4appId =
            String(

                parseObject.id

                ||

                fallbackDossier?.back4appId

                ||

                ""

            );


        return {

            id:
                back4appId

                ||

                legacyId

                ||

                fallbackDossier?.id

                ||

                "",


            legacyId,


            back4appId,


            code:
                String(

                    parseObject.get(
                        "code"
                    )

                    ??

                    fallbackDossier?.code

                    ??

                    ""

                ),


            projectId:
                String(

                    parseObject.get(
                        "projectId"
                    )

                    ??

                    fallbackDossier?.projectId

                    ??

                    ""

                ),


            content:
                String(

                    parseObject.get(
                        "content"
                    )

                    ??

                    fallbackDossier?.content

                    ??

                    ""

                ),


            supplierId:
                String(

                    parseObject.get(
                        "supplierId"
                    )

                    ??

                    fallbackDossier?.supplierId

                    ??

                    ""

                ),


            value:
                parseDossierValue(

                    parseObject.get(
                        "value"
                    )

                    ??

                    fallbackDossier?.value

                    ??

                    0

                ),


            documents:
                String(

                    parseObject.get(
                        "documents"
                    )

                    ??

                    fallbackDossier?.documents

                    ??

                    fallbackDossier?.additionalDocuments

                    ??

                    ""

                ),


            fileStatus:
                String(

                    parseObject.get(
                        "fileStatus"
                    )

                    ??

                    fallbackDossier?.fileStatus

                    ??

                    "Chưa up"

                ),


            paymentRequest:
                parseDossierBoolean(

                    parseObject.get(
                        "paymentRequest"
                    )

                    ??

                    fallbackDossier?.paymentRequest

                    ??

                    false

                ),


            receiveDate:
                String(

                    parseObject.get(
                        "receiveDate"
                    )

                    ??

                    fallbackDossier?.receiveDate

                    ??

                    ""

                ),


            deliveryDate:
                String(

                    parseObject.get(
                        "deliveryDate"
                    )

                    ??

                    fallbackDossier?.deliveryDate

                    ??

                    ""

                ),


            paymentStatus:
                String(

                    parseObject.get(
                        "paymentStatus"
                    )

                    ??

                    fallbackDossier?.paymentStatus

                    ??

                    "Chưa thanh toán"

                ),


            status:
                String(

                    parseObject.get(
                        "status"
                    )

                    ??

                    parseObject.get(
                        "dossierStatus"
                    )

                    ??

                    fallbackDossier?.status

                    ??

                    fallbackDossier?.dossierStatus

                    ??

                    "Chưa duyệt"

                ),


            note:
                String(

                    parseObject.get(
                        "note"
                    )

                    ??

                    fallbackDossier?.note

                    ??

                    ""

                ),


            createdAt:
                parseObject.createdAt

                    ? parseObject.createdAt
                        .toISOString()

                    : fallbackDossier?.createdAt
                        || "",


            updatedAt:
                parseObject.updatedAt

                    ? parseObject.updatedAt
                        .toISOString()

                    : fallbackDossier?.updatedAt
                        || ""

        };

    }


    function setDossierParseFields(
        dossierObject,
        data
    ) {

        dossierObject.set(
            "code",
            String(data.code || "").trim()
        );


        dossierObject.set(
            "codeNormalized",
            normalizeDossierText(
                data.code
            )
        );


        dossierObject.set(
            "projectId",
            String(
                data.projectId || ""
            )
        );


        dossierObject.set(
            "content",
            String(
                data.content || ""
            )
        );


        dossierObject.set(
            "supplierId",
            String(
                data.supplierId || ""
            )
        );


        dossierObject.set(
            "value",
            parseDossierValue(
                data.value
            )
        );


        dossierObject.set(
            "documents",
            String(

                data.documents

                ||

                data.additionalDocuments

                ||

                ""

            )
        );


        dossierObject.set(
            "fileStatus",
            String(
                data.fileStatus

                ||

                "Chưa up"
            )
        );


        dossierObject.set(
            "paymentRequest",
            Boolean(
                data.paymentRequest
            )
        );


        dossierObject.set(
            "receiveDate",
            String(
                data.receiveDate || ""
            )
        );


        dossierObject.set(
            "deliveryDate",
            String(
                data.deliveryDate || ""
            )
        );


        dossierObject.set(
            "paymentStatus",
            String(
                data.paymentStatus

                ||

                "Chưa thanh toán"
            )
        );


        dossierObject.set(
            "status",
            String(

                data.status

                ||

                data.dossierStatus

                ||

                "Chưa duyệt"

            )
        );


        dossierObject.set(
            "note",
            String(
                data.note || ""
            )
        );

    }


    async function findDossierObjectOnBack4App(
        dossier
    ) {

        const possibleObjectIds =
            [

                dossier?.back4appId,

                dossier?.objectId,

                dossier?.id

            ]
                .map(value =>
                    String(value || "").trim()
                )

                .filter(Boolean);


        const legacyId =
            String(

                dossier?.legacyId

                ||

                ""

            ).trim();


        const uniqueObjectIds =
            [...new Set(possibleObjectIds)];


        for (const objectId of uniqueObjectIds) {

            if (
                legacyId

                &&

                objectId === legacyId
            ) {

                continue;

            }


            try {

                const query =
                    new Parse.Query(
                        DOSSIER_PAGE_CLASS_NAME
                    );


                return await query.get(
                    objectId
                );

            } catch (error) {

                if (Number(error?.code) !== 101) {

                    throw error;

                }

            }

        }


        if (legacyId) {

            const legacyQuery =
                new Parse.Query(
                    DOSSIER_PAGE_CLASS_NAME
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
            normalizeDossierText(
                dossier?.code
            );


        if (normalizedCode) {

            const normalizedCodeQuery =
                new Parse.Query(
                    DOSSIER_PAGE_CLASS_NAME
                );


            normalizedCodeQuery.equalTo(
                "codeNormalized",
                normalizedCode
            );


            const foundByNormalizedCode =
                await normalizedCodeQuery.first();


            if (foundByNormalizedCode) {

                return foundByNormalizedCode;

            }

        }


        const rawCode =
            String(
                dossier?.code || ""
            ).trim();


        if (rawCode) {

            const rawCodeQuery =
                new Parse.Query(
                    DOSSIER_PAGE_CLASS_NAME
                );


            rawCodeQuery.equalTo(
                "code",
                rawCode
            );


            const foundByRawCode =
                await rawCodeQuery.first();


            if (foundByRawCode) {

                return foundByRawCode;

            }

        }


        return null;

    }


    async function migrateDossiersToBack4App(
        force = false
    ) {

        if (dossierMigrationPromise) {

            return dossierMigrationPromise;

        }


        dossierMigrationPromise =
            (async function () {

                ensureDossierBack4AppReady();


                if (
                    !force

                    &&

                    localStorage.getItem(
                        DOSSIER_MIGRATION_KEY
                    )
                ) {

                    return {

                        migrated:
                            0,

                        skipped:
                            0,

                        failed:
                            0,

                        alreadyCompleted:
                            true

                    };

                }


                const oldDossiers =
                    getDossierStorageArray(
                        DOSSIER_STORAGE_KEY
                    );


                const currentUser =
                    Parse.User.current();


                let migrated =
                    0;


                let skipped =
                    0;


                let failed =
                    0;


                for (const item of oldDossiers) {

                    try {

                        const code =
                            String(
                                item.code || ""
                            ).trim();


                        if (!code) {

                            failed += 1;


                            continue;

                        }


                        const existingDossier =
                            await findDossierObjectOnBack4App(
                                item
                            );


                        if (existingDossier) {

                            skipped += 1;


                            continue;

                        }


                        const dossierObject =
                            new Parse.Object(
                                DOSSIER_PAGE_CLASS_NAME
                            );


                        setDossierParseFields(
                            dossierObject,
                            item
                        );


                        const legacyId =
                            String(

                                item.legacyId

                                ||

                                item.id

                                ||

                                ""

                            ).trim();


                        if (legacyId) {

                            dossierObject.set(
                                "legacyId",
                                legacyId
                            );

                        }


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


                        await dossierObject.save();


                        migrated += 1;

                    } catch (error) {

                        failed += 1;


                        console.error(
                            "Không migrate được hồ sơ:",
                            item,
                            error
                        );

                    }

                }


                if (failed === 0) {

                    localStorage.setItem(

                        DOSSIER_MIGRATION_KEY,

                        JSON.stringify({

                            completedAt:
                                new Date()
                                    .toISOString(),

                            migrated,

                            skipped,

                            failed

                        })

                    );

                }


                return {

                    migrated,

                    skipped,

                    failed,

                    alreadyCompleted:
                        false

                };

            })();


        try {

            return await dossierMigrationPromise;

        } finally {

            dossierMigrationPromise =
                null;

        }

    }


    function sortDossiersNewestFirst() {

        dossiers.sort(

            (a, b) =>

                getDossierCreatedTime(b)

                -

                getDossierCreatedTime(a)

        );

    }


    async function fetchDossiersFromBack4App(
        forceReload = false
    ) {

        ensureDossierBack4AppReady();


        if (
            dossierDataLoaded

            &&

            !forceReload
        ) {

            return dossiers;

        }


        if (dossierLoadingPromise) {

            return dossierLoadingPromise;

        }


        dossierLoadingPromise =
            (async function () {

                const allResults =
                    [];


                const batchSize =
                    1000;


                let skip =
                    0;


                while (true) {

                    const query =
                        new Parse.Query(
                            DOSSIER_PAGE_CLASS_NAME
                        );


                    query.descending(
                        "createdAt"
                    );


                    query.limit(
                        batchSize
                    );


                    query.skip(
                        skip
                    );


                    const batch =
                        await query.find();


                    allResults.push(
                        ...batch
                    );


                    if (batch.length < batchSize) {

                        break;

                    }


                    skip +=
                        batchSize;

                }


                dossiers =
                    allResults.map(
                        item =>

                            dossierParseObjectToPlain(
                                item
                            )
                    );


                sortDossiersNewestFirst();


                dossierDataLoaded =
                    true;


                saveDossiersToStorage();


                return dossiers;

            })();


        try {

            return await dossierLoadingPromise;

        } finally {

            dossierLoadingPromise =
                null;

        }

    }


    // =====================================================
    // BADGE
    // =====================================================

    function renderDossierBadge(
        type,
        value
    ) {

        const text =
            String(value || "").trim();


        let className =
            "";


        if (type === "status") {

            className =
                text === "Đã duyệt"

                    ? "dossier-badge-approved"

                    : "dossier-badge-pending";

        }


        if (type === "file") {

            className =
                text === "Đã up"

                    ? "dossier-badge-file-uploaded"

                    : "dossier-badge-file-missing";

        }


        if (type === "payment") {

            if (text === "Đã thanh toán") {

                className =
                    "dossier-badge-paid";

            } else if (text === "Đang xử lý") {

                className =
                    "dossier-badge-processing";

            } else if (text === "Đã xuất ĐNTT") {

                className =
                    "dossier-badge-requested";

            } else {

                className =
                    "dossier-badge-unpaid";

            }

        }


        if (type === "delivery") {

            className =
                text === "Chưa bàn giao"

                    ? "dossier-badge-not-delivered"

                    : "dossier-badge-delivered";

        }


        return `

            <span
                class="dossier-badge ${className}"
            >
                ${escapeDossierHtml(text)}
            </span>

        `;

    }


    // =====================================================
    // THỐNG KÊ
    // =====================================================

    function setDossierSummaryNumber(
        elementId,
        value
    ) {

        const element =
            getDossierElement(
                elementId
            );


        if (!element) {

            return;

        }


        const newValue =
            String(value);


        if (
            element.textContent.trim()

            !==

            newValue
        ) {

            element.textContent =
                newValue;


            element.classList.remove(
                "is-updated"
            );


            void element.offsetWidth;


            element.classList.add(
                "is-updated"
            );

        } else {

            element.textContent =
                newValue;

        }

    }


    function updateDossierSummary() {

        const dossierList =
            Array.isArray(dossiers)

                ? dossiers

                : [];


        const totalCount =
            dossierList.length;


        const pendingCount =
            dossierList.filter(item =>

                String(

                    item.status

                    ||

                    item.dossierStatus

                    ||

                    "Chưa duyệt"

                ).trim()

                ===

                "Chưa duyệt"

            ).length;


        const deliveredCount =
            dossierList.filter(item =>

                Boolean(

                    String(
                        item.deliveryDate || ""
                    ).trim()

                )

            ).length;


        const paidCount =
            dossierList.filter(item =>

                String(
                    item.paymentStatus || ""
                ).trim()

                ===

                "Đã thanh toán"

            ).length;


        setDossierSummaryNumber(

            "totalDossierCount",

            totalCount

        );


        setDossierSummaryNumber(

            "pendingDossierCount",

            pendingCount

        );


        setDossierSummaryNumber(

            "deliveredDossierCount",

            deliveredCount

        );


        setDossierSummaryNumber(

            "paidDossierCount",

            paidCount

        );

    }


    // =====================================================
    // PHÂN TRANG
    // =====================================================

    function getDossierTotalPages() {

        return Math.max(

            1,

            Math.ceil(

                dossierFilteredData.length

                /

                dossierPageSize

            )

        );

    }


    function renderCurrentDossierPage() {

        const totalItems =
            dossierFilteredData.length;


        const totalPages =
            getDossierTotalPages();


        dossierCurrentPage =
            Math.min(

                Math.max(
                    dossierCurrentPage,
                    1
                ),

                totalPages

            );


        const startIndex =
            (
                dossierCurrentPage - 1
            )

            *

            dossierPageSize;


        const endIndex =
            Math.min(

                startIndex

                +

                dossierPageSize,

                totalItems

            );


        const pageItems =
            dossierFilteredData.slice(

                startIndex,

                endIndex

            );


        renderDossier(
            pageItems
        );


        renderDossierPagination(

            totalItems,

            totalPages,

            startIndex,

            endIndex

        );

    }


    function renderDossierPagination(
        totalItems,
        totalPages,
        startIndex,
        endIndex
    ) {

        const infoElement =
            getDossierElement(
                "dossierPaginationInfo"
            );


        const totalPagesElement =
            getDossierElement(
                "dossierTotalPages"
            );


        const pageSelect =
            getDossierElement(
                "dossierPageSelect"
            );


        const firstButton =
            getDossierElement(
                "dossierFirstPageButton"
            );


        const previousButton =
            getDossierElement(
                "dossierPreviousPageButton"
            );


        const nextButton =
            getDossierElement(
                "dossierNextPageButton"
            );


        const lastButton =
            getDossierElement(
                "dossierLastPageButton"
            );


        if (infoElement) {

            infoElement.textContent =
                totalItems === 0

                    ? "Không có hồ sơ phù hợp"

                    : `Hiển thị ${startIndex + 1}–${endIndex} trên ${totalItems} hồ sơ`;

        }


        if (totalPagesElement) {

            totalPagesElement.textContent =
                `/ ${totalPages}`;

        }


        if (pageSelect) {

            let pageOptions =
                "";


            for (
                let page = 1;

                page <= totalPages;

                page += 1
            ) {

                pageOptions += `

                    <option
                        value="${page}"
                        ${
                            page === dossierCurrentPage

                                ? "selected"

                                : ""
                        }
                    >
                        ${page}
                    </option>

                `;

            }


            pageSelect.innerHTML =
                pageOptions;

        }


        const isFirstPage =
            dossierCurrentPage <= 1;


        const isLastPage =
            dossierCurrentPage >= totalPages;


        if (firstButton) {

            firstButton.disabled =
                isFirstPage;

        }


        if (previousButton) {

            previousButton.disabled =
                isFirstPage;

        }


        if (nextButton) {

            nextButton.disabled =
                isLastPage;

        }


        if (lastButton) {

            lastButton.disabled =
                isLastPage;

        }

    }


    function goToDossierPage(targetPage) {

        const totalPages =
            getDossierTotalPages();


        if (targetPage === "first") {

            dossierCurrentPage =
                1;

        } else if (targetPage === "previous") {

            dossierCurrentPage -=
                1;

        } else if (targetPage === "next") {

            dossierCurrentPage +=
                1;

        } else if (targetPage === "last") {

            dossierCurrentPage =
                totalPages;

        } else {

            const pageNumber =
                Number(targetPage);


            if (
                Number.isFinite(pageNumber)

                &&

                pageNumber >= 1
            ) {

                dossierCurrentPage =
                    pageNumber;

            }

        }


        dossierCurrentPage =
            Math.min(

                Math.max(
                    dossierCurrentPage,
                    1
                ),

                totalPages

            );


        renderCurrentDossierPage();


        const tableScroll =
            document.querySelector(
                ".dossier-table-scroll"
            );


        if (tableScroll) {

            tableScroll.scrollTop =
                0;

        }

    }


    function changeDossierPageSize(value) {

        const newPageSize =
            Number(value);


        if (
            !Number.isFinite(newPageSize)

            ||

            newPageSize <= 0
        ) {

            return;

        }


        dossierPageSize =
            newPageSize;


        dossierCurrentPage =
            1;


        renderCurrentDossierPage();

    }


    // =====================================================
    // BẢNG HỒ SƠ
    // =====================================================

    function setDossierTableMessage(
        message,
        isError = false
    ) {

        const table =
            getDossierElement(
                "dossierTable"
            );


        if (!table) {

            return;

        }


        currentRenderedDossiers =
            [];


        table.innerHTML = `

            <tr>

                <td
                    colspan="14"
                    style="
                        text-align:center;
                        padding:25px;
                        color:${
                            isError
                                ? "#dc2626"
                                : "#6b7280"
                        };
                    "
                >
                    ${escapeDossierHtml(message)}
                </td>

            </tr>

        `;


        updateDossierSelectionUI();

    }


    function buildEntityMap(items) {

        const map =
            new Map();


        items.forEach(item => {

            getEntityIdentifiers(item)
                .forEach(id => {

                    map.set(
                        String(id),
                        item
                    );

                });

        });


        return map;

    }


    function renderDossier(
        data = dossiers
    ) {

        const table =
            getDossierElement(
                "dossierTable"
            );


        if (!table) {

            return;

        }


        currentRenderedDossiers =
            Array.isArray(data)

                ? data

                : [];


        if (
            currentRenderedDossiers.length ===
            0
        ) {

            setDossierTableMessage(
                "Chưa có hồ sơ phù hợp"
            );


            return;

        }


        const projectMap =
            buildEntityMap(
                getDossierProjects()
            );


        const supplierMap =
            buildEntityMap(
                getDossierSuppliers()
            );


        let rowsHtml =
            "";


        currentRenderedDossiers.forEach(
            item => {

                const project =
                    projectMap.get(
                        String(item.projectId)
                    );


                const supplier =
                    supplierMap.get(
                        String(item.supplierId)
                    );


                const itemId =
                    escapeDossierHtml(
                        String(item.id)
                    );


                const itemCode =
                    escapeDossierHtml(
                        item.code || "—"
                    );


                const projectName =
                    project?.ten

                    ||

                    project?.name

                    ||

                    "Dự án đã xóa";


                const supplierName =
                    supplier?.ten

                    ||

                    supplier?.name

                    ||

                    "Nhà cung cấp đã xóa";


                rowsHtml += `

                    <tr>

                        <td class="dossier-select-cell">

                            <input
                                type="checkbox"
                                class="dossier-row-checkbox"
                                value="${itemId}"
                                ${
                                    selectedDossierIds.has(
                                        String(item.id)
                                    )

                                        ? "checked"

                                        : ""
                                }
                                onchange="
                                    window.toggleDossierSelection(
                                        this.value,
                                        this.checked
                                    )
                                "
                                aria-label="Chọn hồ sơ ${itemCode}"
                            >

                        </td>


                        <td>
                            ${itemCode}
                        </td>


                        <td>
                            ${escapeDossierHtml(
                                projectName
                            )}
                        </td>


                        <td
                            class="dossier-content-cell"
                            title="${escapeDossierHtml(
                                item.content || ""
                            )}"
                        >
                            ${escapeDossierHtml(
                                item.content || "—"
                            )}
                        </td>


                        <td>
                            ${escapeDossierHtml(
                                supplierName
                            )}
                        </td>


                        <td
                            class="dossier-value-cell"
                            title="${Number(
                                item.value || 0
                            ).toLocaleString(
                                "vi-VN"
                            )}"
                        >
                            ${Number(
                                item.value || 0
                            ).toLocaleString(
                                "vi-VN"
                            )}
                        </td>


                        <td
                            class="dossier-additional-cell"
                            title="${escapeDossierHtml(
                                item.documents || ""
                            )}"
                        >
                            ${escapeDossierHtml(
                                item.documents || "—"
                            )}
                        </td>


                        <td>

                            ${renderDossierBadge(

                                "file",

                                item.fileStatus

                                ||

                                "Chưa up"

                            )}

                        </td>


                        <td>

                            ${renderDossierBadge(

                                "status",

                                item.status

                                ||

                                "Chưa duyệt"

                            )}

                        </td>


                        <td>
                            ${
                                item.paymentRequest
                                    ? "✓"
                                    : "—"
                            }
                        </td>


                        <td>

                            ${renderDossierBadge(

                                "delivery",

                                item.deliveryDate

                                    ? formatDossierDate(
                                        item.deliveryDate
                                    )

                                    : "Chưa bàn giao"

                            )}

                        </td>


                        <td>

                            ${renderDossierBadge(

                                "payment",

                                item.paymentStatus

                                ||

                                "Chưa thanh toán"

                            )}

                        </td>


                        <td
                            class="dossier-note-cell"
                            title="${escapeDossierHtml(
                                item.note || ""
                            )}"
                        >
                            ${escapeDossierHtml(
                                item.note || "—"
                            )}
                        </td>


                        <td class="dossier-action-cell">

                            <button
                                type="button"
                                onclick="
                                    window.editDossier(
                                        '${itemId}'
                                    )
                                "
                                aria-label="Sửa hồ sơ"
                                title="Sửa hồ sơ"
                            >
                                ✏️
                            </button>


                            <button
                                type="button"
                                class="dossier-delete-button"
                                onclick="
                                    window.deleteDossier(
                                        '${itemId}',
                                        this
                                    )
                                "
                                aria-label="Xóa hồ sơ"
                                title="Xóa hồ sơ"
                            >
                                🗑
                            </button>

                        </td>

                    </tr>

                `;

            }
        );


        table.innerHTML =
            rowsHtml;


        updateDossierSelectionUI();

    }


    // =====================================================
    // LỌC DANH SÁCH CHÍNH
    // =====================================================

    function filterDossier() {

        const keyword =
            normalizeDossierText(

                getDossierInputValue(
                    "searchDossier"
                )

            );


        const statusFilter =
            getDossierInputValue(
                "filterStatus"
            );


        const paymentFilter =
            getDossierInputValue(
                "filterPayment"
            );


        const deliveryFilter =
            getDossierInputValue(
                "filterDelivery"
            );


        const fileFilter =
            getDossierInputValue(
                "filterFile"
            );


        const projectSort =
            getDossierInputValue(
                "filterProjectSort"
            );


        const filtered =
            dossiers.filter(item => {

                const project =
                    getDossierProjectById(
                        item.projectId
                    );


                const supplier =
                    getDossierSupplierById(
                        item.supplierId
                    );


                const searchText =
                    normalizeDossierText(`

                        ${item.code || ""}

                        ${item.content || ""}

                        ${item.documents || ""}

                        ${project?.ten || project?.name || ""}

                        ${getDossierSupplierName(supplier)}

                        ${item.note || ""}

                    `);


                const matchKeyword =
                    searchText.includes(
                        keyword
                    );


                const matchStatus =
                    !statusFilter

                    ||

                    String(
                        item.status || "Chưa duyệt"
                    )

                    ===

                    statusFilter;


                const matchPayment =
                    !paymentFilter

                    ||

                    String(
                        item.paymentStatus

                        ||

                        "Chưa thanh toán"
                    )

                    ===

                    paymentFilter;


                const hasDeliveryDate =
                    Boolean(

                        String(
                            item.deliveryDate || ""
                        ).trim()

                    );


                const matchDelivery =
                    !deliveryFilter

                    ||

                    (
                        deliveryFilter === "done"

                        &&

                        hasDeliveryDate
                    )

                    ||

                    (
                        deliveryFilter === "not"

                        &&

                        !hasDeliveryDate
                    );


                const matchFile =
                    !fileFilter

                    ||

                    String(
                        item.fileStatus || "Chưa up"
                    )

                    ===

                    fileFilter;


                return (

                    matchKeyword

                    &&

                    matchStatus

                    &&

                    matchPayment

                    &&

                    matchDelivery

                    &&

                    matchFile

                );

            });


        if (
            projectSort === "project-az"

            ||

            projectSort === "project-za"
        ) {

            filtered.sort((a, b) => {

                const nameA =
                    getDossierProjectName(a);


                const nameB =
                    getDossierProjectName(b);


                const compared =
                    nameA.localeCompare(

                        nameB,

                        "vi",

                        {
                            sensitivity:
                                "base",

                            numeric:
                                true
                        }

                    );


                if (compared !== 0) {

                    return projectSort ===
                        "project-za"

                        ? -compared

                        : compared;

                }


                return (

                    getDossierCreatedTime(b)

                    -

                    getDossierCreatedTime(a)

                );

            });

        } else {

            filtered.sort(

                (a, b) =>

                    getDossierCreatedTime(b)

                    -

                    getDossierCreatedTime(a)

            );

        }


        dossierFilteredData =
            filtered;


        dossierCurrentPage =
            1;


        renderCurrentDossierPage();

    }


    // =====================================================
    // CHỌN NHIỀU HỒ SƠ
    // =====================================================

    function updateDossierSelectionUI() {

        const selectedCount =
            selectedDossierIds.size;


        const bulkBar =
            getDossierElement(
                "dossierBulkBar"
            );


        const countElement =
            getDossierElement(
                "selectedDossierCount"
            );


        if (bulkBar) {

            bulkBar.hidden =
                selectedCount === 0;

        }


        if (countElement) {

            countElement.textContent =
                String(selectedCount);

        }


        document
            .querySelectorAll(
                ".dossier-row-checkbox"
            )
            .forEach(checkbox => {

                checkbox.checked =
                    selectedDossierIds.has(

                        String(
                            checkbox.value
                        )

                    );

            });


        const selectAll =
            getDossierElement(
                "selectAllDossiers"
            );


        if (!selectAll) {

            return;

        }


        const visibleIds =
            currentRenderedDossiers.map(
                item =>
                    String(item.id)
            );


        const selectedVisibleCount =
            visibleIds.filter(id =>

                selectedDossierIds.has(id)

            ).length;


        selectAll.checked =
            visibleIds.length > 0

            &&

            selectedVisibleCount ===
            visibleIds.length;


        selectAll.indeterminate =
            selectedVisibleCount > 0

            &&

            selectedVisibleCount <
            visibleIds.length;

    }


    function toggleDossierSelection(
        id,
        checked
    ) {

        const dossierId =
            String(id);


        if (checked) {

            selectedDossierIds.add(
                dossierId
            );

        } else {

            selectedDossierIds.delete(
                dossierId
            );

        }


        updateDossierSelectionUI();

    }


    function toggleSelectAllDossiers(
        checked
    ) {

        currentRenderedDossiers.forEach(
            item => {

                const id =
                    String(item.id);


                if (checked) {

                    selectedDossierIds.add(id);

                } else {

                    selectedDossierIds.delete(id);

                }

            }
        );


        updateDossierSelectionUI();

    }


    function clearDossierSelection() {

        selectedDossierIds.clear();


        const selectAll =
            getDossierElement(
                "selectAllDossiers"
            );


        if (selectAll) {

            selectAll.checked =
                false;


            selectAll.indeterminate =
                false;

        }


        updateDossierSelectionUI();

    }


    // =====================================================
    // CẬP NHẬT HÀNG LOẠT
    // =====================================================

    function getBulkDossierChanges() {

        const changes =
            {};


        const fileStatus =
            getDossierInputValue(
                "bulkFileStatus"
            );


        const dossierStatus =
            getDossierInputValue(
                "bulkDossierStatus"
            );


        const paymentRequest =
            getDossierInputValue(
                "bulkPaymentRequest"
            );


        const paymentStatus =
            getDossierInputValue(
                "bulkPaymentStatus"
            );


        const deliveryDate =
            getDossierInputValue(
                "bulkDeliveryDate"
            );


        const clearDeliveryDate =
            Boolean(

                getDossierElement(
                    "bulkClearDeliveryDate"
                )?.checked

            );


        if (fileStatus !== "") {

            changes.fileStatus =
                fileStatus;

        }


        if (dossierStatus !== "") {

            changes.status =
                dossierStatus;

        }


        if (paymentRequest !== "") {

            changes.paymentRequest =
                paymentRequest === "true";

        }


        if (paymentStatus !== "") {

            changes.paymentStatus =
                paymentStatus;

        }


        if (clearDeliveryDate) {

            changes.deliveryDate =
                "";

        } else if (deliveryDate !== "") {

            changes.deliveryDate =
                deliveryDate;

        }


        return changes;

    }


    function resetBulkDossierControls() {

        setDossierInputValue(
            "bulkFileStatus",
            ""
        );


        setDossierInputValue(
            "bulkDossierStatus",
            ""
        );


        setDossierInputValue(
            "bulkPaymentRequest",
            ""
        );


        setDossierInputValue(
            "bulkPaymentStatus",
            ""
        );


        setDossierInputValue(
            "bulkDeliveryDate",
            ""
        );


        setDossierChecked(
            "bulkClearDeliveryDate",
            false
        );

    }


    function applyBulkChangesToLocalItem(
        item,
        changes,
        updatedAt
    ) {

        Object.entries(changes)
            .forEach(([field, value]) => {

                item[field] =
                    value;


                if (field === "status") {

                    item.dossierStatus =
                        value;

                }

            });


        item.updatedAt =
            updatedAt;

    }


    async function applyBulkDossierUpdate() {

        const selectedItems =
            dossiers.filter(item =>

                selectedDossierIds.has(
                    String(item.id)
                )

            );


        if (selectedItems.length === 0) {

            showDossierNotice(
                "Vui lòng chọn ít nhất một hồ sơ.",
                "warning"
            );


            return;

        }


        const changes =
            getBulkDossierChanges();


        if (
            Object.keys(changes).length === 0
        ) {

            showDossierNotice(
                "Vui lòng chọn nội dung cần cập nhật.",
                "warning"
            );


            return;

        }


        const itemWithoutObjectId =
            selectedItems.find(item =>

                !String(
                    item.back4appId || ""
                ).trim()

            );


        if (itemWithoutObjectId) {

            showDossierNotice(

                `Hồ sơ "${itemWithoutObjectId.code}" chưa có objectId trên Back4App.`,

                "error"

            );


            return;

        }


        const confirmed =
            window.confirm(

                `Cập nhật ${selectedItems.length} hồ sơ đã chọn?`

            );


        if (!confirmed) {

            return;

        }


        const button =
            getDossierElement(
                "applyBulkDossierButton"
            );


        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Đang cập nhật...";

        }


        try {

            ensureDossierBack4AppReady();


            const currentUser =
                Parse.User.current();


            const parseObjects =
                selectedItems.map(item => {

                    const dossierObject =
                        Parse.Object.createWithoutData(

                            DOSSIER_PAGE_CLASS_NAME,

                            String(
                                item.back4appId
                            )

                        );


                    Object.entries(changes)
                        .forEach(
                            ([field, value]) => {

                                dossierObject.set(
                                    field,
                                    value
                                );

                            }
                        );


                    if (currentUser) {

                        dossierObject.set(
                            "updatedBy",
                            currentUser
                        );

                    }


                    return dossierObject;

                });


            const batchSize =
                20;


            let completedCount =
                0;


            for (
                let index = 0;

                index < parseObjects.length;

                index += batchSize
            ) {

                const batch =
                    parseObjects.slice(

                        index,

                        index + batchSize

                    );


                await Parse.Object.saveAll(
                    batch
                );


                completedCount +=
                    batch.length;


                if (button) {

                    button.textContent =
                        `Đang cập nhật ${completedCount}/${parseObjects.length}...`;

                }

            }


            const updatedAt =
                new Date()
                    .toISOString();


            selectedItems.forEach(item => {

                applyBulkChangesToLocalItem(

                    item,

                    changes,

                    updatedAt

                );

            });


            saveDossiersToStorage();


            clearDossierSelection();


            resetBulkDossierControls();


            refreshAllDossierViews();


            showDossierNotice(

                `Đã cập nhật ${selectedItems.length} hồ sơ.`,

                "success"

            );

        } catch (error) {

            console.error(
                "Không cập nhật được hồ sơ hàng loạt:",
                error
            );


            showDossierNotice(

                error?.message

                ||

                "Không cập nhật được hồ sơ.",

                "error"

            );

        } finally {

            if (button) {

                button.disabled =
                    false;


                button.textContent =
                    "Cập nhật hàng loạt";

            }

        }

    }


    // =====================================================
    // MODAL PORTAL
    // =====================================================

    function mountDossierModalToBody() {

        const modal =
            getDossierElement(
                "dossierModal"
            );


        if (!modal) {

            return null;

        }


        if (
            !dossierModalMountState

            &&

            modal.parentNode

            &&

            modal.parentNode !==
            document.body
        ) {

            dossierModalMountState = {

                parent:
                    modal.parentNode,

                nextSibling:
                    modal.nextSibling

            };

        }


        if (
            modal.parentNode !==
            document.body
        ) {

            document.body.appendChild(
                modal
            );

        }


        return modal;

    }


    function restoreDossierModalPosition(
        modal
    ) {

        const mountState =
            dossierModalMountState;


        dossierModalMountState =
            null;


        if (
            !modal

            ||

            !mountState
        ) {

            return;

        }


        if (
            mountState.parent

            &&

            mountState.parent.isConnected
        ) {

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


    function showDossierModal() {

        const modal =
            mountDossierModalToBody();


        if (!modal) {

            showDossierNotice(
                "Không tìm thấy popup Hồ sơ.",
                "error"
            );


            return false;

        }


        modal.classList.add(
            "is-open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        modal.style.setProperty(
            "display",
            "flex",
            "important"
        );


        document.documentElement
            .classList
            .add(
                "dossier-modal-open"
            );


        document.body
            .classList
            .add(
                "dossier-modal-open"
            );


        const form =
            getDossierElement(
                "dossierForm"
            );


        if (form) {

            form.scrollTop =
                0;

        }


        window.setTimeout(() => {

            const codeInput =
                getDossierElement(
                    "dossierCode"
                );


            try {

                codeInput?.focus({
                    preventScroll:
                        true
                });

            } catch (error) {

                codeInput?.focus();

            }

        }, 80);


        return true;

    }


    function hideDossierModal() {

        const modal =
            getDossierElement(
                "dossierModal"
            );


        if (modal) {

            modal.classList.remove(
                "is-open"
            );


            modal.setAttribute(
                "aria-hidden",
                "true"
            );


            modal.style.setProperty(
                "display",
                "none",
                "important"
            );

        }


        document.documentElement
            .classList
            .remove(
                "dossier-modal-open"
            );


        document.body
            .classList
            .remove(
                "dossier-modal-open"
            );


        restoreDossierModalPosition(
            modal
        );

    }


    // =====================================================
    // FORM
    // =====================================================

    function setDossierSaveBusy(
        isBusy,
        isEditing
    ) {

        const button =
            getDossierElement(
                "dossierSaveButton"
            );


        if (!button) {

            return;

        }


        button.disabled =
            isBusy;


        button.textContent =
            isBusy

                ? "Đang lưu..."

                : isEditing
                    ? "Cập nhật hồ sơ"
                    : "Lưu hồ sơ";

    }


    function resetDossierForm() {

        setDossierInputValue(
            "dossierCode",
            ""
        );


        setDossierInputValue(
            "dossierProject",
            ""
        );


        setDossierInputValue(
            "dossierSupplier",
            ""
        );


        setDossierInputValue(
            "dossierSupplierSearch",
            ""
        );


        updateDossierSupplierHint(
            "empty"
        );


        setDossierInputValue(
            "dossierContent",
            ""
        );


        setDossierInputValue(
            "dossierValue",
            ""
        );


        setDossierInputValue(
            "additionalDocuments",
            ""
        );


        setDossierInputValue(
            "fileStatus",
            "Chưa up"
        );


        setDossierChecked(
            "paymentRequest",
            false
        );


        setDossierInputValue(
            "receiveDate",
            ""
        );


        setDossierInputValue(
            "deliveryDate",
            ""
        );


        setDossierInputValue(
            "dossierStatus",
            "Chưa duyệt"
        );


        setDossierInputValue(
            "paymentStatus",
            "Chưa thanh toán"
        );


        setDossierInputValue(
            "note",
            ""
        );

    }


    async function openDossierForm() {

        editingDossierId =
            null;


        resetDossierForm();


        const formTitle =
            getDossierElement(
                "dossierFormTitle"
            );


        if (formTitle) {

            formTitle.textContent =
                "Thêm Hồ sơ";

        }


        setDossierSaveBusy(
            false,
            false
        );


        showDossierModal();


        try {

    const referenceResult =
        await loadDossierReferenceData();


    if (
        referenceResult.optionCount === 0
    ) {

        showDossierNotice(

            "Chưa tải được danh sách Nhà cung cấp. Hãy kiểm tra supplier.js hoặc dữ liệu Back4App.",

            "warning"

        );

    }


    if (editingDossierId === null) {

        setDossierInputValue(
            "dossierProject",
            ""
        );


        setDossierSupplierById(
            ""
        );

    }

} catch (error) {

    console.error(
        "Không tải được Dự án hoặc Nhà cung cấp:",
        error
    );


    showDossierNotice(

        "Form đã mở nhưng chưa tải được danh sách Nhà cung cấp.",

        "warning"

    );

}

    }


    function closeDossierForm() {

        hideDossierModal();


        editingDossierId =
            null;


        resetDossierForm();

    }


    // =====================================================
    // LƯU HỒ SƠ
    // =====================================================

    async function saveDossier() {

        const code =
            getDossierInputValue(
                "dossierCode"
            );


        const projectId =
            getDossierInputValue(
                "dossierProject"
            );


        const supplierId =
            handleDossierSupplierSearchChange(
                true
            );


        const content =
            getDossierInputValue(
                "dossierContent"
            );


        if (!code) {

            showDossierNotice(
                "Vui lòng nhập mã hồ sơ.",
                "warning"
            );


            getDossierElement(
                "dossierCode"
            )?.focus();


            return;

        }


        if (!projectId) {

            showDossierNotice(
                "Vui lòng chọn Dự án.",
                "warning"
            );


            getDossierElement(
                "dossierProject"
            )?.focus();


            return;

        }


        if (!supplierId) {

            showDossierNotice(

                "Vui lòng nhập chính xác hơn hoặc chọn Nhà cung cấp trong danh sách gợi ý.",

                "warning"

            );


            getDossierElement(
                "dossierSupplierSearch"
            )?.focus();


            return;

        }


        if (!content) {

            showDossierNotice(
                "Vui lòng nhập nội dung hồ sơ.",
                "warning"
            );


            getDossierElement(
                "dossierContent"
            )?.focus();


            return;

        }


        const isEditing =
            editingDossierId !== null;


        const data = {

            code,

            projectId,

            supplierId,

            content,


            value:
                getDossierInputValue(
                    "dossierValue"
                ),


            documents:
                getDossierInputValue(
                    "additionalDocuments"
                ),


            fileStatus:
                getDossierInputValue(
                    "fileStatus"
                )

                ||

                "Chưa up",


            paymentRequest:
                Boolean(

                    getDossierElement(
                        "paymentRequest"
                    )?.checked

                ),


            receiveDate:
                getDossierInputValue(
                    "receiveDate"
                ),


            deliveryDate:
                getDossierInputValue(
                    "deliveryDate"
                ),


            status:
                getDossierInputValue(
                    "dossierStatus"
                )

                ||

                "Chưa duyệt",


            paymentStatus:
                getDossierInputValue(
                    "paymentStatus"
                )

                ||

                "Chưa thanh toán",


            note:
                getDossierInputValue(
                    "note"
                )

        };


        setDossierSaveBusy(
            true,
            isEditing
        );


        try {

            ensureDossierBack4AppReady();


            if (!dossierDataLoaded) {

                await fetchDossiersFromBack4App(
                    true
                );

            }


            const editingDossier =
                isEditing

                    ? findLocalDossierByAnyId(
                        editingDossierId
                    )

                    : null;


            if (
                isEditing

                &&

                !editingDossier
            ) {

                throw new Error(
                    "Không tìm thấy hồ sơ cần chỉnh sửa."
                );

            }


            const normalizedCode =
                normalizeDossierText(
                    code
                );


            const duplicatedLocally =
                dossiers.some(item => {

                    const sameCode =
                        normalizeDossierText(
                            item.code
                        )

                        ===

                        normalizedCode;


                    const sameCurrentDossier =
                        isEditing

                        &&

                        sameDossierIdentity(
                            item,
                            editingDossier
                        );


                    return (
                        sameCode

                        &&

                        !sameCurrentDossier
                    );

                });


            if (duplicatedLocally) {

                showDossierNotice(
                    "Mã hồ sơ này đã tồn tại.",
                    "warning"
                );


                return;

            }


            let dossierObject;


            if (isEditing) {

                dossierObject =
                    await findDossierObjectOnBack4App(
                        editingDossier
                    );


                if (!dossierObject) {

                    throw new Error(
                        "Không tìm thấy hồ sơ này trên Back4App."
                    );

                }


                const legacyId =
                    String(

                        editingDossier.legacyId

                        ||

                        (
                            String(
                                editingDossier.id
                            )

                            !==

                            String(
                                dossierObject.id
                            )

                                ? editingDossier.id

                                : ""
                        )

                        ||

                        ""

                    ).trim();


                if (legacyId) {

                    dossierObject.set(
                        "legacyId",
                        legacyId
                    );

                }

            } else {

                dossierObject =
                    new Parse.Object(
                        DOSSIER_PAGE_CLASS_NAME
                    );

            }


            setDossierParseFields(
                dossierObject,
                data
            );


            const currentUser =
                Parse.User.current();


            if (
                !isEditing

                &&

                currentUser
            ) {

                dossierObject.set(
                    "createdBy",
                    currentUser
                );

            }


            if (currentUser) {

                dossierObject.set(
                    "updatedBy",
                    currentUser
                );

            }


            const savedObject =
                await dossierObject.save();


            const savedDossier =
                dossierParseObjectToPlain(

                    savedObject,

                    editingDossier

                );


            if (isEditing) {

                const index =
                    dossiers.findIndex(item =>

                        sameDossierIdentity(
                            item,
                            editingDossier
                        )

                    );


                if (index !== -1) {

                    dossiers[index] =
                        savedDossier;

                } else {

                    dossiers.push(
                        savedDossier
                    );

                }

            } else {

                dossiers.push(
                    savedDossier
                );

            }


            sortDossiersNewestFirst();


            saveDossiersToStorage();


            refreshAllDossierViews();


            closeDossierForm();


            showDossierNotice(

                isEditing

                    ? "Đã cập nhật hồ sơ."

                    : "Đã thêm hồ sơ.",

                "success"

            );

        } catch (error) {

            console.error(
                "Không lưu được Hồ sơ:",
                {
                    code:
                        error?.code,

                    message:
                        error?.message,

                    error
                }
            );


            let message =
                error?.message

                ||

                "Không thể lưu Hồ sơ.";


            if (Number(error?.code) === 119) {

                message =
                    "Tài khoản hiện tại chưa có quyền tạo hoặc cập nhật class Dossier.";

            }


            if (Number(error?.code) === 209) {

                message =
                    "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";

            }


            if (Number(error?.code) === 101) {

                message =
                    "Không tìm thấy hồ sơ cần cập nhật trên Back4App.";

            }


            showDossierNotice(
                message,
                "error"
            );

        } finally {

            setDossierSaveBusy(
                false,
                isEditing
            );

        }

    }


    // =====================================================
    // SỬA HỒ SƠ
    // =====================================================

    async function editDossier(id) {

        const item =
            findLocalDossierByAnyId(id);


        if (!item) {

            showDossierNotice(
                "Không tìm thấy hồ sơ.",
                "error"
            );


            return;

        }


        editingDossierId =
            item.back4appId

            ||

            item.id

            ||

            item.legacyId;


        const formTitle =
            getDossierElement(
                "dossierFormTitle"
            );


        if (formTitle) {

            formTitle.textContent =
                "Chỉnh sửa Hồ sơ";

        }


        showDossierModal();


        try {

            await loadDossierReferenceData();

        } catch (error) {

            console.error(
                "Không tải được dropdown:",
                error
            );

        }


        setDossierInputValue(
            "dossierCode",
            item.code
        );


        setDossierProjectById(
            item.projectId
        );


        setDossierSupplierById(
            item.supplierId
        );


        setDossierInputValue(
            "dossierContent",
            item.content
        );


        setDossierInputValue(
            "dossierValue",
            item.value
        );


        setDossierInputValue(
            "additionalDocuments",
            item.documents
        );


        setDossierInputValue(
            "fileStatus",
            item.fileStatus

            ||

            "Chưa up"
        );


        setDossierChecked(
            "paymentRequest",
            item.paymentRequest
        );


        setDossierInputValue(
            "receiveDate",
            item.receiveDate || ""
        );


        setDossierInputValue(
            "deliveryDate",
            item.deliveryDate || ""
        );


        setDossierInputValue(
            "dossierStatus",
            item.status

            ||

            "Chưa duyệt"
        );


        setDossierInputValue(
            "paymentStatus",
            item.paymentStatus

            ||

            "Chưa thanh toán"
        );


        setDossierInputValue(
            "note",
            item.note || ""
        );


        setDossierSaveBusy(
            false,
            true
        );

    }


    // =====================================================
    // XÓA HỒ SƠ
    // =====================================================

    async function deleteDossier(
        id,
        deleteButton = null
    ) {

        const dossier =
            findLocalDossierByAnyId(id);


        if (!dossier) {

            showDossierNotice(
                "Không tìm thấy hồ sơ.",
                "error"
            );


            return;

        }


        const confirmed =
            window.confirm(

                `Bạn có chắc chắn muốn xóa hồ sơ "${dossier.code}"?\n\n`

                +

                "Thao tác này không thể hoàn tác."

            );


        if (!confirmed) {

            return;

        }


        const oldButtonHtml =
            deleteButton?.innerHTML || "🗑";


        if (deleteButton) {

            deleteButton.disabled =
                true;


            deleteButton.innerHTML =
                "…";

        }


        try {

            ensureDossierBack4AppReady();


            const dossierObject =
                await findDossierObjectOnBack4App(
                    dossier
                );


            if (!dossierObject) {

                const removeStaleRow =
                    window.confirm(

                        `Không tìm thấy hồ sơ "${dossier.code}" trên Back4App.\n\n`

                        +

                        "Xóa dòng dữ liệu cũ khỏi giao diện?"

                    );


                if (!removeStaleRow) {

                    return;

                }


                dossiers =
                    dossiers.filter(item =>

                        !sameDossierIdentity(
                            item,
                            dossier
                        )

                    );


                saveDossiersToStorage();


                refreshAllDossierViews();


                showDossierNotice(
                    "Đã loại dữ liệu cũ khỏi danh sách.",
                    "info"
                );


                return;

            }


            await dossierObject.destroy();


            dossiers =
                dossiers.filter(item =>

                    !sameDossierIdentity(
                        item,
                        dossier
                    )

                );


            getDossierIdentifiers(dossier)
                .forEach(dossierId => {

                    selectedDossierIds.delete(
                        dossierId
                    );

                });


            selectedDossierIds.delete(
                String(
                    dossierObject.id
                )
            );


            saveDossiersToStorage();


            if (
                editingDossierId !== null

                &&

                entityMatchesId(
                    dossier,
                    editingDossierId
                )
            ) {

                closeDossierForm();

            }


            refreshAllDossierViews();


            showDossierNotice(

                `Đã xóa hồ sơ "${dossier.code}".`,

                "success"

            );

        } catch (error) {

            console.error(
                "Không xóa được Hồ sơ:",
                {
                    code:
                        error?.code,

                    message:
                        error?.message,

                    error
                }
            );


            let message =
                error?.message

                ||

                "Không thể xóa Hồ sơ.";


            if (Number(error?.code) === 119) {

                message =
                    "Tài khoản hiện tại chưa có quyền Delete đối với class Dossier.";

            }


            if (Number(error?.code) === 101) {

                message =
                    "Back4App không tìm thấy hồ sơ hoặc ACL đang chặn quyền truy cập.";

            }


            if (Number(error?.code) === 209) {

                message =
                    "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";

            }


            showDossierNotice(
                message,
                "error"
            );

        } finally {

            if (deleteButton) {

                deleteButton.disabled =
                    false;


                deleteButton.innerHTML =
                    oldButtonHtml;

            }

        }

    }


    // =====================================================
    // FILTER OPTION CHO CÁC TRANG CON
    // =====================================================

    function loadDossierFilterOptions(
        selectId,
        items,
        placeholder
    ) {

        const select =
            getDossierElement(
                selectId
            );


        if (!select) {

            return;

        }


        const currentValue =
            String(
                select.value || ""
            );


        select.innerHTML =
            "";


        const defaultOption =
            document.createElement(
                "option"
            );


        defaultOption.value =
            "";


        defaultOption.textContent =
            placeholder;


        select.appendChild(
            defaultOption
        );


        [...items]
            .sort((a, b) =>

                String(
                    a.ten

                    ||

                    a.name

                    ||

                    ""
                ).localeCompare(

                    String(
                        b.ten

                        ||

                        b.name

                        ||

                        ""
                    ),

                    "vi",

                    {
                        sensitivity:
                            "base",

                        numeric:
                            true
                    }

                )

            )
            .forEach(item => {

                const stableId =
                    getEntityStableId(
                        item
                    );


                if (!stableId) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    stableId;


                option.textContent =
                    item.ten

                    ||

                    item.name

                    ||

                    "Không có tên";


                select.appendChild(
                    option
                );

            });


        const currentEntity =
            items.find(item =>

                entityMatchesId(
                    item,
                    currentValue
                )

            );


        select.value =
            currentEntity

                ? getEntityStableId(
                    currentEntity
                )

                : "";

    }


    function compareDossierVietnameseText(
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


    // =====================================================
    // HỒ SƠ ĐÃ BÀN GIAO
    // =====================================================

    function loadDeliveryDossierFilters() {

        loadDossierFilterOptions(

            "deliveryProjectFilter",

            getDossierProjects(),

            "Tất cả dự án"

        );


        loadDossierFilterOptions(

            "deliverySupplierFilter",

            getDossierSuppliers(),

            "Tất cả nhà cung cấp"

        );

    }


    function sortDeliveryDossierData(
        data,
        sortMode
    ) {

        const sortedData =
            [...data];


        sortedData.sort((a, b) => {

            const projectNameA =
                getDossierProjectName(a);


            const projectNameB =
                getDossierProjectName(b);


            const codeComparison =
                compareDossierVietnameseText(
                    a.code,
                    b.code
                );


            if (sortMode === "project-az") {

                return (

                    compareDossierVietnameseText(

                        projectNameA,

                        projectNameB

                    )

                    ||

                    codeComparison

                );

            }


            if (sortMode === "project-za") {

                return (

                    compareDossierVietnameseText(

                        projectNameB,

                        projectNameA

                    )

                    ||

                    codeComparison

                );

            }


            if (sortMode === "delivery-oldest") {

                return (

                    String(
                        a.deliveryDate || ""
                    ).localeCompare(

                        String(
                            b.deliveryDate || ""
                        )

                    )

                    ||

                    codeComparison

                );

            }


            return (

                String(
                    b.deliveryDate || ""
                ).localeCompare(

                    String(
                        a.deliveryDate || ""
                    )

                )

                ||

                codeComparison

            );

        });


        return sortedData;

    }


    function filterDeliveryDossier() {

        const keyword =
            normalizeDossierText(

                getDossierInputValue(
                    "deliverySearch"
                )

            );


        const projectId =
            getDossierInputValue(
                "deliveryProjectFilter"
            );


        const supplierId =
            getDossierInputValue(
                "deliverySupplierFilter"
            );


        const paymentFilter =
            getDossierInputValue(
                "deliveryPaymentFilter"
            );


        const dateFrom =
            getDossierInputValue(
                "deliveryDateFrom"
            );


        const dateTo =
            getDossierInputValue(
                "deliveryDateTo"
            );


        const sortMode =
            getDossierInputValue(
                "deliverySort"
            )

            ||

            "delivery-newest";


        if (
            dateFrom

            &&

            dateTo

            &&

            dateFrom > dateTo
        ) {

            renderDeliveryDossier(
                []
            );


            showDossierNotice(
                "Từ ngày không được lớn hơn Đến ngày.",
                "warning"
            );


            return;

        }


        const filtered =
            dossiers.filter(item => {

                const deliveryDate =
                    String(
                        item.deliveryDate || ""
                    ).trim();


                if (!deliveryDate) {

                    return false;

                }


                const project =
                    getDossierProjectById(
                        item.projectId
                    );


                const supplier =
                    getDossierSupplierById(
                        item.supplierId
                    );


                const searchText =
                    normalizeDossierText(`

                        ${item.code || ""}

                        ${item.content || ""}

                        ${item.documents || ""}

                        ${project?.ten || project?.name || ""}

                        ${getDossierSupplierName(supplier)}

                        ${item.note || ""}

                    `);


                const matchProject =
                    !projectId

                    ||

                    (
                        project

                        &&

                        entityMatchesId(
                            project,
                            projectId
                        )
                    );


                const matchSupplier =
                    !supplierId

                    ||

                    (
                        supplier

                        &&

                        entityMatchesId(
                            supplier,
                            supplierId
                        )
                    );


                return (

                    searchText.includes(
                        keyword
                    )

                    &&

                    matchProject

                    &&

                    matchSupplier

                    &&

                    (
                        !paymentFilter

                        ||

                        String(
                            item.paymentStatus

                            ||

                            "Chưa thanh toán"
                        )

                        ===

                        paymentFilter
                    )

                    &&

                    (
                        !dateFrom

                        ||

                        deliveryDate >= dateFrom
                    )

                    &&

                    (
                        !dateTo

                        ||

                        deliveryDate <= dateTo
                    )

                );

            });


        renderDeliveryDossier(

            sortDeliveryDossierData(
                filtered,
                sortMode
            )

        );

    }


    function renderDeliveryDossier(data) {

        renderSimpleDossierTable({

            tableId:
                "deliveryTable",

            countId:
                "deliveryResultCount",

            data,

            emptyMessage:
                "Chưa có hồ sơ đã bàn giao phù hợp",

            deliveryMode:
                true

        });

    }


    function resetDeliveryDossierFilters() {

        const values = {

            deliverySearch:
                "",

            deliveryProjectFilter:
                "",

            deliverySupplierFilter:
                "",

            deliveryPaymentFilter:
                "",

            deliveryDateFrom:
                "",

            deliveryDateTo:
                "",

            deliverySort:
                "delivery-newest"

        };


        Object.entries(values)
            .forEach(([id, value]) => {

                setDossierInputValue(
                    id,
                    value
                );

            });


        filterDeliveryDossier();

    }

// =====================================================
// TRANG HỒ SƠ ĐÃ THANH TOÁN
// =====================================================

function getPaidEntityIdentifiers(
    item
){

    if(!item){

        return [];

    }


    return [

        item.id,

        item.back4appId,

        item.objectId,

        item.legacyId

    ]
    .filter(Boolean)
    .map(value =>
        String(value)
    );

}


function getPaidEntityStableId(
    item
){

    if(!item){

        return "";

    }


    return String(

        item.back4appId

        ||

        item.objectId

        ||

        item.id

        ||

        item.legacyId

        ||

        ""

    ).trim();

}


function paidEntityMatchesId(
    item,
    id
){

    const targetId =
        String(id || "");


    if(!targetId){

        return false;

    }


    return getPaidEntityIdentifiers(
        item
    )
    .includes(
        targetId
    );

}


// =====================================================
// KIỂM TRA HỒ SƠ ĐÃ THANH TOÁN
// =====================================================

function isPaidDossier(
    item
){

    if(!item){

        return false;

    }


    /*
    Hỗ trợ dữ liệu mới và một số tên field cũ.
    */

    const paymentStatus =
        String(

            item.paymentStatus

            ||

            item.thanhtoan

            ||

            item.payment_status

            ||

            item.payment

            ||

            ""

        ).trim();


    const normalizedPaymentStatus =
        normalizeDossierText(
            paymentStatus
        );


    return (

        normalizedPaymentStatus

        ===

        normalizeDossierText(
            "Đã thanh toán"
        )

        ||

        item.paid === true

    );

}


// =====================================================
// HIỂN THỊ TRẠNG THÁI ĐANG TẢI
// =====================================================

function setPaidDossierLoading(
    message = "Đang tải hồ sơ đã thanh toán..."
){

    const table =
        getDossierElement(
            "paidTable"
        );


    const countElement =
        getDossierElement(
            "paidResultCount"
        );


    if(countElement){

        countElement.textContent =
            "0 hồ sơ";

    }


    if(!table){

        return;

    }


    table.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="paid-loading-row"
            >

                <div class="paid-loading-state">

                    <span class="paid-loading-icon">
                        🌿
                    </span>

                    <span>
                        ${escapeDossierHtml(message)}
                    </span>

                </div>

            </td>

        </tr>

    `;

}


// =====================================================
// TẠO OPTION BỘ LỌC
// =====================================================

function populatePaidFilter(
    selectId,
    items,
    placeholder
){

    const select =
        getDossierElement(
            selectId
        );


    if(!select){

        return;

    }


    const currentValue =
        String(
            select.value || ""
        );


    select.innerHTML =
        "";


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value =
        "";


    defaultOption.textContent =
        placeholder;


    select.appendChild(
        defaultOption
    );


    [...items]
    .sort((a, b) => {

        const nameA =
            String(

                a.ten

                ||

                a.name

                ||

                ""

            );


        const nameB =
            String(

                b.ten

                ||

                b.name

                ||

                ""

            );


        return nameA.localeCompare(

            nameB,

            "vi",

            {
                sensitivity:
                    "base",

                numeric:
                    true
            }

        );

    })
    .forEach(item => {

        const stableId =
            getPaidEntityStableId(
                item
            );


        if(!stableId){

            return;

        }


        const option =
            document.createElement(
                "option"
            );


        option.value =
            stableId;


        option.textContent =

            item.ten

            ||

            item.name

            ||

            "Không có tên";


        select.appendChild(
            option
        );

    });


    const selectedEntity =
        items.find(item =>

            paidEntityMatchesId(
                item,
                currentValue
            )

        );


    select.value =
        selectedEntity

            ? getPaidEntityStableId(
                selectedEntity
            )

            : "";

}


// =====================================================
// TẢI DỰ ÁN VÀ NCC CHO BỘ LỌC
// =====================================================

function loadPaidDossierFilters(){

    populatePaidFilter(

        "paidProjectFilter",

        getDossierProjects(),

        "Tất cả dự án"

    );


    populatePaidFilter(

        "paidSupplierFilter",

        getDossierSuppliers(),

        "Tất cả nhà cung cấp"

    );

}


// =====================================================
// LỌC HỒ SƠ ĐÃ THANH TOÁN
// =====================================================

function filterPaidDossier(){

    const keyword =
        normalizeDossierText(

            getDossierInputValue(
                "paidSearch"
            )

        );


    const selectedProjectId =
        getDossierInputValue(
            "paidProjectFilter"
        );


    const selectedSupplierId =
        getDossierInputValue(
            "paidSupplierFilter"
        );


    const deliveryFilter =
        getDossierInputValue(
            "paidDeliveryFilter"
        );


    const fileFilter =
        getDossierInputValue(
            "paidFileFilter"
        );


    const sortMode =
        getDossierInputValue(
            "paidSort"
        );


    const filteredData =
        dossiers.filter(item => {

            if(!isPaidDossier(item)){

                return false;

            }


            const itemProjectId =
                String(

                    item.projectId

                    ||

                    item.project

                    ||

                    ""

                );


            const itemSupplierId =
                String(

                    item.supplierId

                    ||

                    item.supplier

                    ||

                    ""

                );


            const project =
                getDossierProjectById(
                    itemProjectId
                );


            const supplier =
                getDossierSupplierById(
                    itemSupplierId
                );


            const projectName =
                String(

                    project?.ten

                    ||

                    project?.name

                    ||

                    ""

                );


            const supplierName =
                String(

                    supplier?.ten

                    ||

                    supplier?.name

                    ||

                    ""

                );


            const searchText =
                normalizeDossierText(`

                    ${item.code || ""}

                    ${item.content || ""}

                    ${item.documents || ""}

                    ${item.additionalDocuments || ""}

                    ${projectName}

                    ${supplierName}

                    ${item.note || ""}

                `);


            const matchKeyword =
                !keyword

                ||

                searchText.includes(
                    keyword
                );


            const matchProject =
                !selectedProjectId

                ||

                (
                    project

                    &&

                    paidEntityMatchesId(

                        project,

                        selectedProjectId

                    )
                )

                ||

                itemProjectId ===
                selectedProjectId;


            const matchSupplier =
                !selectedSupplierId

                ||

                (
                    supplier

                    &&

                    paidEntityMatchesId(

                        supplier,

                        selectedSupplierId

                    )
                )

                ||

                itemSupplierId ===
                selectedSupplierId;


            const hasDeliveryDate =
                Boolean(

                    String(
                        item.deliveryDate || ""
                    ).trim()

                );


            const matchDelivery =
                !deliveryFilter

                ||

                (
                    deliveryFilter === "done"

                    &&

                    hasDeliveryDate
                )

                ||

                (
                    deliveryFilter === "not"

                    &&

                    !hasDeliveryDate
                );


            const itemFileStatus =
                String(

                    item.fileStatus

                    ||

                    "Chưa up"

                ).trim();


            const matchFile =
                !fileFilter

                ||

                itemFileStatus ===
                fileFilter;


            return (

                matchKeyword

                &&

                matchProject

                &&

                matchSupplier

                &&

                matchDelivery

                &&

                matchFile

            );

        });


    /*
    Nếu HTML có thêm paidSort thì hỗ trợ sắp xếp.
    Không có paidSort vẫn chạy bình thường.
    */

    if(
        sortMode === "project-az"

        ||

        sortMode === "project-za"
    ){

        filteredData.sort((a, b) => {

            const projectNameA =
                String(

                    getDossierProjectById(
                        a.projectId
                    )?.ten

                    ||

                    ""

                );


            const projectNameB =
                String(

                    getDossierProjectById(
                        b.projectId
                    )?.ten

                    ||

                    ""

                );


            const compared =
                projectNameA.localeCompare(

                    projectNameB,

                    "vi",

                    {
                        sensitivity:
                            "base",

                        numeric:
                            true
                    }

                );


            return sortMode ===
                "project-za"

                ? -compared

                : compared;

        });

    }else{

        filteredData.sort((a, b) => {

            return (

                getDossierCreatedTime(b)

                -

                getDossierCreatedTime(a)

            );

        });

    }


    renderPaidDossier(
        filteredData
    );

}


// =====================================================
// HIỂN THỊ HỒ SƠ ĐÃ THANH TOÁN
// =====================================================

function renderPaidDossier(
    data
){

    const table =
        getDossierElement(
            "paidTable"
        );


    const countElement =
        getDossierElement(
            "paidResultCount"
        );


    if(!table){

        console.error(
            "Không tìm thấy #paidTable trong trang Hồ sơ đã thanh toán."
        );


        return;

    }


    const resultData =
        Array.isArray(data)

            ? data

            : [];


    if(countElement){

        countElement.textContent =
            `${resultData.length} hồ sơ`;

    }


    if(resultData.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="paid-empty-row"
                >

                    <div class="paid-empty-state">

                        <span>
                            🌿
                        </span>

                        <strong>
                            Chưa có hồ sơ đã thanh toán phù hợp
                        </strong>

                    </div>

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        resultData.map(item => {

            const project =
                getDossierProjectById(

                    item.projectId

                    ||

                    item.project

                );


            const supplier =
                getDossierSupplierById(

                    item.supplierId

                    ||

                    item.supplier

                );


            const projectName =

                project?.ten

                ||

                project?.name

                ||

                "Dự án đã xóa";


            const supplierName =

                supplier?.ten

                ||

                supplier?.name

                ||

                "Nhà cung cấp đã xóa";


            const documents =

                item.documents

                ||

                item.additionalDocuments

                ||

                "—";


            const deliveryDate =
                item.deliveryDate

                    ? formatDossierDate(
                        item.deliveryDate
                    )

                    : "Chưa bàn giao";


            return `

                <tr>

                    <td>
                        ${escapeDossierHtml(
                            item.code || "—"
                        )}
                    </td>


                    <td>
                        ${escapeDossierHtml(
                            projectName
                        )}
                    </td>


                    <td>
                        ${escapeDossierHtml(
                            item.content || "—"
                        )}
                    </td>


                    <td>
                        ${escapeDossierHtml(
                            supplierName
                        )}
                    </td>


                    <td class="paid-value-cell">

                        ${Number(
                            item.value || 0
                        ).toLocaleString(
                            "vi-VN"
                        )} đ

                    </td>


                    <td>
                        ${escapeDossierHtml(
                            documents
                        )}
                    </td>


                    <td>
                        ${escapeDossierHtml(
                            deliveryDate
                        )}
                    </td>


                    <td>

                        <span class="dossier-badge dossier-badge-paid">
                            Đã thanh toán
                        </span>

                    </td>

                </tr>

            `;

        }).join("");

}


// =====================================================
// KHỞI TẠO TRANG HỒ SƠ ĐÃ THANH TOÁN
// =====================================================

async function loadPaidDossier(){

    setPaidDossierLoading();


    try{

        ensureDossierBack4AppReady();


        /*
        Tải Dự án và Nhà cung cấp trước.
        Một nguồn lỗi không làm dừng toàn trang.
        */

        const referenceTasks =
            [];


        if(
            typeof window.loadProjectSelect ===
            "function"
        ){

            referenceTasks.push(

                Promise.resolve(
                    window.loadProjectSelect()
                )

            );

        }


        if(
            typeof window.loadSupplierSelect ===
            "function"
        ){

            referenceTasks.push(

                Promise.resolve(
                    window.loadSupplierSelect()
                )

            );

        }


        if(referenceTasks.length > 0){

            const referenceResults =
                await Promise.allSettled(
                    referenceTasks
                );


            referenceResults.forEach(result => {

                if(
                    result.status ===
                    "rejected"
                ){

                    console.warn(
                        "Không tải được dữ liệu tham chiếu:",
                        result.reason
                    );

                }

            });

        }


        /*
        Luôn lấy dữ liệu mới nhất từ Back4App.
        */

        await fetchDossiersFromBack4App(
            true
        );


        loadPaidDossierFilters();


        filterPaidDossier();


        return dossiers.filter(
            isPaidDossier
        );

    }catch(error){

        console.error(
            "Không tải được hồ sơ đã thanh toán:",
            {
                code:
                    error?.code,

                message:
                    error?.message,

                error
            }
        );


        const table =
            getDossierElement(
                "paidTable"
            );


        if(table){

            table.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="paid-error-row"
                    >

                        Không tải được dữ liệu:
                        ${escapeDossierHtml(
                            error?.message

                            ||

                            "Lỗi không xác định"
                        )}

                    </td>

                </tr>

            `;

        }


        return [];

    }

}


// =====================================================
// ĐẶT LẠI BỘ LỌC
// =====================================================

function resetPaidDossierFilters(){

    [

        "paidSearch",

        "paidProjectFilter",

        "paidSupplierFilter",

        "paidDeliveryFilter",

        "paidFileFilter",

        "paidSort"

    ].forEach(id => {

        setDossierInputValue(
            id,
            ""
        );

    });


    filterPaidDossier();

}
    // =====================================================
    // HỒ SƠ CẦN BỔ SUNG
    // =====================================================

    function loadMissingDossierFilters() {

        loadDossierFilterOptions(

            "missingProjectFilter",

            getDossierProjects(),

            "Tất cả dự án"

        );


        loadDossierFilterOptions(

            "missingSupplierFilter",

            getDossierSuppliers(),

            "Tất cả nhà cung cấp"

        );

    }


    function filterMissingDossier() {

        const keyword =
            normalizeDossierText(

                getDossierInputValue(
                    "missingSearch"
                )

            );


        const projectId =
            getDossierInputValue(
                "missingProjectFilter"
            );


        const supplierId =
            getDossierInputValue(
                "missingSupplierFilter"
            );


        const deliveryFilter =
            getDossierInputValue(
                "missingDeliveryFilter"
            );


        const paymentFilter =
            getDossierInputValue(
                "missingPaymentFilter"
            );


        const sortMode =
            getDossierInputValue(
                "missingSort"
            )

            ||

            "project-az";


        const filtered =
            dossiers.filter(item => {

                const missingDocuments =
                    String(
                        item.documents || ""
                    ).trim();


                if (!missingDocuments) {

                    return false;

                }


                const project =
                    getDossierProjectById(
                        item.projectId
                    );


                const supplier =
                    getDossierSupplierById(
                        item.supplierId
                    );


                const searchText =
                    normalizeDossierText(`

                        ${item.code || ""}

                        ${item.content || ""}

                        ${missingDocuments}

                        ${project?.ten || project?.name || ""}

                        ${getDossierSupplierName(supplier)}

                    `);


                const hasDelivery =
                    Boolean(

                        String(
                            item.deliveryDate || ""
                        ).trim()

                    );


                return (

                    searchText.includes(
                        keyword
                    )

                    &&

                    (
                        !projectId

                        ||

                        (
                            project

                            &&

                            entityMatchesId(
                                project,
                                projectId
                            )
                        )
                    )

                    &&

                    (
                        !supplierId

                        ||

                        (
                            supplier

                            &&

                            entityMatchesId(
                                supplier,
                                supplierId
                            )
                        )
                    )

                    &&

                    (
                        !deliveryFilter

                        ||

                        (
                            deliveryFilter === "done"

                            &&

                            hasDelivery
                        )

                        ||

                        (
                            deliveryFilter === "not"

                            &&

                            !hasDelivery
                        )
                    )

                    &&

                    (
                        !paymentFilter

                        ||

                        String(
                            item.paymentStatus

                            ||

                            "Chưa thanh toán"
                        )

                        ===

                        paymentFilter
                    )

                );

            });


        filtered.sort((a, b) => {

            if (sortMode === "project-za") {

                return compareDossierVietnameseText(

                    getDossierProjectName(b),

                    getDossierProjectName(a)

                );

            }


            if (sortMode === "newest") {

                return (

                    getDossierCreatedTime(b)

                    -

                    getDossierCreatedTime(a)

                );

            }


            if (sortMode === "oldest") {

                return (

                    getDossierCreatedTime(a)

                    -

                    getDossierCreatedTime(b)

                );

            }


            return compareDossierVietnameseText(

                getDossierProjectName(a),

                getDossierProjectName(b)

            );

        });


        renderMissingDossier(
            filtered
        );

    }


    function renderMissingDossier(data) {

        renderSimpleDossierTable({

            tableId:
                "missingTable",

            countId:
                "missingResultCount",

            data,

            emptyMessage:
                "Không có hồ sơ cần bổ sung phù hợp"

        });

    }


    function resetMissingDossierFilters() {

        [

            "missingSearch",

            "missingProjectFilter",

            "missingSupplierFilter",

            "missingDeliveryFilter",

            "missingPaymentFilter"

        ].forEach(id =>

            setDossierInputValue(
                id,
                ""
            )
        );


        setDossierInputValue(
            "missingSort",
            "project-az"
        );


        filterMissingDossier();

    }


    // =====================================================
    // BẢNG DÙNG CHUNG CHO TRANG CON
    // =====================================================

    function renderSimpleDossierTable({
        tableId,
        countId,
        data,
        emptyMessage,
        deliveryMode = false,
        paidMode = false
    }) {

        const table =
            getDossierElement(
                tableId
            );


        if (!table) {

            return;

        }


        const resultData =
            Array.isArray(data)

                ? data

                : [];


        const countElement =
            getDossierElement(
                countId
            );


        if (countElement) {

            countElement.textContent =
                `${resultData.length} hồ sơ`;

        }


        if (resultData.length === 0) {

            table.innerHTML = `

                <tr>

                    <td colspan="8">
                        ${escapeDossierHtml(
                            emptyMessage
                        )}
                    </td>

                </tr>

            `;


            return;

        }


        table.innerHTML =
            resultData.map(item => {

                const project =
                    getDossierProjectById(
                        item.projectId
                    );


                const supplier =
                    getDossierSupplierById(
                        item.supplierId
                    );


                let lastColumn =
                    item.paymentStatus

                    ||

                    "Chưa thanh toán";


                if (deliveryMode) {

                    lastColumn =
                        item.paymentStatus

                        ||

                        "Chưa thanh toán";

                }


                if (paidMode) {

                    lastColumn =
                        "Đã thanh toán";

                }


                return `

                    <tr>

                        <td>
                            ${escapeDossierHtml(
                                item.code || "—"
                            )}
                        </td>

                        <td>
                            ${escapeDossierHtml(

                                project?.ten

                                ||

                                project?.name

                                ||

                                "Dự án đã xóa"

                            )}
                        </td>

                        <td>
                            ${escapeDossierHtml(
                                item.content || "—"
                            )}
                        </td>

                        <td>
                            ${escapeDossierHtml(

                                getDossierSupplierName(
                                    supplier
                                )

                                ||

                                "Nhà cung cấp đã xóa"

                            )}
                        </td>

                        <td>
                            ${Number(
                                item.value || 0
                            ).toLocaleString(
                                "vi-VN"
                            )} đ
                        </td>

                        <td>
                            ${escapeDossierHtml(
                                item.documents || "—"
                            )}
                        </td>

                        <td>
                            ${escapeDossierHtml(

                                item.deliveryDate

                                    ? formatDossierDate(
                                        item.deliveryDate
                                    )

                                    : "Chưa bàn giao"

                            )}
                        </td>

                        <td>
                            ${escapeDossierHtml(
                                lastColumn
                            )}
                        </td>

                    </tr>

                `;

            }).join("");

    }


    // =====================================================
    // LÀM MỚI CÁC VIEW
    // =====================================================

    function refreshAllDossierViews() {

        updateDossierSummary();


        if (
            getDossierElement(
                "dossierTable"
            )
        ) {

            filterDossier();

        }


        if (
            getDossierElement(
                "deliveryTable"
            )
        ) {

            loadDeliveryDossierFilters();


            filterDeliveryDossier();

        }


        if (
            getDossierElement(
                "paidTable"
            )
        ) {

            loadPaidDossierFilters();


            filterPaidDossier();

        }


        if (
            getDossierElement(
                "missingTable"
            )
        ) {

            loadMissingDossierFilters();


            filterMissingDossier();

        }

    }

// =====================================================
// TẢI DỮ LIỆU HỒ SƠ TỪ BACK4APP
// =====================================================

async function loadDossier(){

    const mainTable =
        getDossierElement(
            "dossierTable"
        );


    const paidTable =
        getDossierElement(
            "paidTable"
        );


    const deliveryTable =
        getDossierElement(
            "deliveryTable"
        );


    const missingTable =
        getDossierElement(
            "missingTable"
        );


    /*
    Chỉ hiện trạng thái tải cho bảng
    đang tồn tại trên trang hiện tại.
    */

    if(mainTable){

        setDossierTableMessage(
            "Đang tải hồ sơ..."
        );

    }


    try{

        ensureDossierBack4AppReady();


        /*
        Tải Dự án và Nhà cung cấp.
        Một module lỗi không làm dừng toàn bộ trang.
        */

        const referenceTasks =
            [];


        if(
            typeof window.loadProjectSelect ===
            "function"
        ){

            referenceTasks.push(

                Promise.resolve(
                    window.loadProjectSelect()
                )

            );

        }


        if(
            typeof window.loadSupplierSelect ===
            "function"
        ){

            referenceTasks.push(

                Promise.resolve(
                    window.loadSupplierSelect()
                )

            );

        }


        if(referenceTasks.length > 0){

            const referenceResults =
                await Promise.allSettled(
                    referenceTasks
                );


            referenceResults.forEach(result => {

                if(
                    result.status ===
                    "rejected"
                ){

                    console.warn(
                        "Không tải được dữ liệu tham chiếu:",
                        result.reason
                    );

                }

            });

        }


        /*
        Chỉ migrate dữ liệu local cũ.
        */

        await migrateDossiersToBack4App();


        /*
        BẮT BUỘC:
        tải dữ liệu mới nhất từ class Dossier.
        */

        await fetchDossiersFromBack4App(
            true
        );


        console.log(
            "✅ Đã tải hồ sơ từ Back4App:",
            dossiers.length
        );


        /*
        Cập nhật đúng trang hiện tại.
        */

        if(mainTable){

            updateDossierSummary();

            filterDossier();

        }


        if(paidTable){

            loadPaidDossierFilters();

            filterPaidDossier();

        }


        if(deliveryTable){

            loadDeliveryDossierFilters();

            filterDeliveryDossier();

        }


        if(missingTable){

            loadMissingDossierFilters();

            filterMissingDossier();

        }


        return dossiers;

    }catch(error){

        console.error(
            "❌ Không tải được Hồ sơ:",
            {
                code:
                    error?.code,

                message:
                    error?.message,

                error
            }
        );


        const errorMessage =

            error?.message

            ||

            "Không tải được dữ liệu hồ sơ.";


        if(mainTable){

            setDossierTableMessage(
                errorMessage,
                true
            );

        }


        if(paidTable){

            paidTable.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="
                            padding:28px;
                            text-align:center;
                            color:#b44f53;
                        "
                    >
                        Không tải được dữ liệu:
                        ${escapeDossierHtml(
                            errorMessage
                        )}
                    </td>

                </tr>

            `;

        }


        if(deliveryTable){

            deliveryTable.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="
                            padding:28px;
                            text-align:center;
                            color:#b44f53;
                        "
                    >
                        Không tải được dữ liệu:
                        ${escapeDossierHtml(
                            errorMessage
                        )}
                    </td>

                </tr>

            `;

        }


        if(missingTable){

            missingTable.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="
                            padding:28px;
                            text-align:center;
                            color:#b44f53;
                        "
                    >
                        Không tải được dữ liệu:
                        ${escapeDossierHtml(
                            errorMessage
                        )}
                    </td>

                </tr>

            `;

        }


        const paidResultCount =
            getDossierElement(
                "paidResultCount"
            );


        if(paidResultCount){

            paidResultCount.textContent =
                "0 hồ sơ";

        }


        return [];

    }

}

    // =====================================================
    // SỰ KIỆN
    // =====================================================

    document.addEventListener(

        "input",

        function (event) {

            const id =
                event.target?.id;


            if (id === "searchDossier") {

                filterDossier();

            }


            if (id === "deliverySearch") {

                filterDeliveryDossier();

            }


            if (id === "paidSearch") {

                filterPaidDossier();

            }


            if (id === "missingSearch") {

                filterMissingDossier();

            }

        }

    );


    document.addEventListener(

        "change",

        function (event) {

            const id =
                event.target?.id;


            if (
                [

                    "filterStatus",

                    "filterPayment",

                    "filterDelivery",

                    "filterFile",

                    "filterProjectSort"

                ].includes(id)
            ) {

                filterDossier();

            }


            if (
                [

                    "deliveryProjectFilter",

                    "deliverySupplierFilter",

                    "deliveryPaymentFilter",

                    "deliveryDateFrom",

                    "deliveryDateTo",

                    "deliverySort"

                ].includes(id)
            ) {

                filterDeliveryDossier();

            }


            if (
                [

                    "paidProjectFilter",

                    "paidSupplierFilter",

                    "paidDeliveryFilter",

                    "paidFileFilter",

                    "paidSort"

                ].includes(id)
            ) {

                filterPaidDossier();

            }


            if (
                [

                    "missingProjectFilter",

                    "missingSupplierFilter",

                    "missingDeliveryFilter",

                    "missingPaymentFilter",

                    "missingSort"

                ].includes(id)
            ) {

                filterMissingDossier();

            }

        }

    );


    document.addEventListener(

        "keydown",

        function (event) {

            if (event.key !== "Escape") {

                return;

            }


            const modal =
                getDossierElement(
                    "dossierModal"
                );


            if (
                modal

                &&

                modal.classList.contains(
                    "is-open"
                )
            ) {

                closeDossierForm();

            }

        }

    );


    // =====================================================
    // TẢI NỀN
    // =====================================================

    async function bootstrapDossier() {

        try {

            if (
                typeof Parse ===
                "undefined"

                ||

                !Parse.User.current()
            ) {

                return;

            }


            await loadDossierReferenceData();


            await migrateDossiersToBack4App();


            await fetchDossiersFromBack4App(
                true
            );


            refreshAllDossierViews();

        } catch (error) {

            console.error(
                "Không thể đồng bộ Hồ sơ khi khởi động:",
                error
            );

        }

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(

            "DOMContentLoaded",

            bootstrapDossier,

            {
                once:
                    true
            }

        );

    } else {

        window.setTimeout(
            bootstrapDossier,
            0
        );

    }


    // =====================================================
    // ĐƯA HÀM RA WINDOW
    // =====================================================

    window.openDossierForm =
        openDossierForm;


    window.closeDossierForm =
        closeDossierForm;


    window.saveDossier =
        saveDossier;


    window.loadDossier =
        loadDossier;


    window.renderDossier =
        renderDossier;


    window.editDossier =
        editDossier;


    window.deleteDossier =
        deleteDossier;


    window.filterDossier =
        filterDossier;


    window.goToDossierPage =
        goToDossierPage;


    window.changeDossierPageSize =
        changeDossierPageSize;


    window.toggleDossierSelection =
        toggleDossierSelection;


    window.toggleSelectAllDossiers =
        toggleSelectAllDossiers;


    window.clearDossierSelection =
        clearDossierSelection;


    window.applyBulkDossierUpdate =
        applyBulkDossierUpdate;


    window.updateDossierSummary =
        updateDossierSummary;


    window.handleDossierSupplierSearchChange =
        handleDossierSupplierSearchChange;

    window.searchDossierSuppliers =
    searchDossierSuppliers;


window.selectDossierSupplier =
    selectDossierSupplier;


window.handleDossierSupplierKeydown =
    handleDossierSupplierKeydown;


    window.loadDossierSupplierSearchOptions =
        loadDossierSupplierSearchOptions;


    window.migrateDossiersToBack4App =
        migrateDossiersToBack4App;


    window.fetchDossiersFromBack4App =
        fetchDossiersFromBack4App;


    window.loadDeliveryDossierFilters =
        loadDeliveryDossierFilters;


    window.filterDeliveryDossier =
        filterDeliveryDossier;


    window.renderDeliveryDossier =
        renderDeliveryDossier;


    window.resetDeliveryDossierFilters =
        resetDeliveryDossierFilters;

    window.loadPaidDossier =
    loadPaidDossier;


    window.loadPaidDossierFilters =
        loadPaidDossierFilters;

    window.filterPaidDossier =
        filterPaidDossier;


    window.renderPaidDossier =
        renderPaidDossier;


    window.resetPaidDossierFilters =
        resetPaidDossierFilters;


    window.loadMissingDossierFilters =
        loadMissingDossierFilters;


    window.filterMissingDossier =
        filterMissingDossier;


    window.renderMissingDossier =
        renderMissingDossier;


    window.resetMissingDossierFilters =
        resetMissingDossierFilters;


    window.getDossiersData =
function(){

    return Array.isArray(dossiers)

        ? dossiers.map(item => ({
            ...item
        }))

        : [];

};

})();
