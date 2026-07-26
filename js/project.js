// =====================================
// PROJECT.JS
// Quản lý Dự án bằng Back4App
// Bản sửa hoàn chỉnh
// =====================================

const PROJECT_CLASS_NAME =
    "Project";

const PROJECT_DOSSIER_CLASS_NAME =
    "Dossier";

const PROJECT_STORAGE_KEY =
    "projects";

const PROJECT_MIGRATION_KEY =
    "projectBack4AppMigrationV1";


let projects =
    getProjectStorageArray(
        PROJECT_STORAGE_KEY
    );

let editingProjectId =
    null;

let projectDataLoaded =
    false;

let projectLoadingPromise =
    null;

let projectMigrationPromise =
    null;

let projectDeleteConfirmResolver =
    null;

    // =====================================================
// PROJECT MODAL PORTAL
// Đưa popup ra body để không bị giới hạn bởi SPA
// =====================================================

const projectOverlayMountStates =
    new Map();


function mountProjectOverlayToBody(
    overlayId
){

    const overlay =
        getProjectElement(
            overlayId
        );


    if(!overlay){

        console.error(
            `Không tìm thấy #${overlayId}.`
        );

        return null;

    }


    if(
        !projectOverlayMountStates.has(
            overlayId
        )

        &&

        overlay.parentNode
    ){

        projectOverlayMountStates.set(

            overlayId,

            {
                parent:
                    overlay.parentNode,

                nextSibling:
                    overlay.nextSibling
            }

        );

    }


    if(
        overlay.parentNode !==
        document.body
    ){

        document.body.appendChild(
            overlay
        );

    }


    return overlay;

}


function restoreProjectOverlayPosition(
    overlayId
){

    const overlay =
        getProjectElement(
            overlayId
        );


    const mountState =
        projectOverlayMountStates.get(
            overlayId
        );


    projectOverlayMountStates.delete(
        overlayId
    );


    if(
        !overlay

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

            overlay,

            validNextSibling

        );


        return;

    }


    /*
    Trang SPA đã bị thay đổi trong lúc popup mở.
    Loại bỏ popup cũ khỏi body.
    */

    overlay.remove();

}
// =====================================================
// HIỂN THỊ / ẨN FORM DỰ ÁN
// =====================================================

function setProjectFormVisible(
    isVisible
){

    const form =

        isVisible

            ? mountProjectOverlayToBody(
                "projectForm"
            )

            : getProjectElement(
                "projectForm"
            );


    if(!form){

        return false;

    }


    form.classList.toggle(
        "is-open",
        isVisible
    );


    form.setAttribute(

        "aria-hidden",

        isVisible

            ? "false"

            : "true"

    );


    form.style.setProperty(

        "display",

        isVisible

            ? "flex"

            : "none",

        "important"

    );


    document.documentElement
        .classList
        .toggle(
            "project-modal-open",
            isVisible
        );


    document.body
        .classList
        .toggle(
            "project-modal-open",
            isVisible
        );


    if(isVisible){

        const formBody =
            form.querySelector(
                ".project-form-body"
            );


        if(formBody){

            formBody.scrollTop =
                0;

        }


        window.requestAnimationFrame(
            function(){

                getProjectElement(
                    "projectName"
                )?.focus();

            }
        );

    }else{

        restoreProjectOverlayPosition(
            "projectForm"
        );

    }


    return true;

}
let projectDeleteInProgress =
    false;

// =====================================
// HÀM HỖ TRỢ
// =====================================

function getProjectElement(id){

    return document.getElementById(id);

}


function getProjectInputValue(id){

    const element =
        getProjectElement(id);


    return element

        ? String(
            element.value || ""
        ).trim()

        : "";

}


function setProjectInputValue(
    id,
    value
){

    const element =
        getProjectElement(id);


    if(element){

        element.value =
            value ?? "";

    }

}


function normalizeProjectText(value){

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


function escapeProjectHtml(value){

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


function getProjectStorageArray(key){

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


function saveProjectsToStorage(){

    try{

        localStorage.setItem(

            PROJECT_STORAGE_KEY,

            JSON.stringify(
                projects
            )

        );

    }catch(error){

        console.error(
            "Không cập nhật được cache Dự án:",
            error
        );

    }

}


function getCurrentProjectKeyword(){

    const searchInput =
        getProjectElement(
            "searchProject"
        );


    return searchInput

        ? searchInput.value

        : "";

}


function ensureProjectBack4AppReady(){

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

// =====================================
// THÔNG BÁO GÓC PHẢI
// =====================================

function showProjectMessage(
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


    let container =
        document.getElementById(
            "projectToastContainer"
        );


    if(!container){

        container =
            document.createElement(
                "div"
            );


        container.id =
            "projectToastContainer";


        container.className =
            "project-toast-container";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    const validType =

        [
            "success",
            "error",
            "info",
            "warning"
        ].includes(type)

        ? type

        : "info";


    toast.className =
        `project-toast project-toast-${validType}`;


    const titles = {

        success:
            "Thành công",

        error:
            "Không thể thực hiện",

        info:
            "Thông báo",

        warning:
            "Cần kiểm tra"

    };


    const symbols = {

        success:
            "✓",

        error:
            "!",

        info:
            "i",

        warning:
            "!"

    };


    toast.innerHTML = `

        <div class="project-toast-symbol">
            ${symbols[validType]}
        </div>

        <div class="project-toast-content">

            <strong>
                ${titles[validType]}
            </strong>

            <p></p>

        </div>

        <button
            type="button"
            class="project-toast-close"
            aria-label="Đóng thông báo"
        >
            ×
        </button>

    `;


    toast.querySelector("p")
        .textContent =
            String(message || "");


    const closeToast =
        function(){

            toast.classList.add(
                "is-leaving"
            );


            window.setTimeout(
                function(){

                    toast.remove();

                },
                220
            );

        };


    toast
        .querySelector(
            ".project-toast-close"
        )
        .addEventListener(
            "click",
            closeToast
        );


    container.appendChild(
        toast
    );


    window.requestAnimationFrame(
        function(){

            toast.classList.add(
                "is-visible"
            );

        }
    );


    window.setTimeout(

        closeToast,

        validType === "error"

            ? 6000

            : 4000

    );


    if(validType === "error"){

        console.error(message);

    }

}

function setProjectTableMessage(
    message,
    isError = false
){

    const table =
        getProjectElement(
            "projectTable"
        );


    if(!table){

        return;

    }


    table.innerHTML = `

        <tr>

            <td
                colspan="3"
                class="project-loading-cell"
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
                ${escapeProjectHtml(
                    message
                )}
            </td>

        </tr>

    `;

}


function setProjectSaveBusy(
    isBusy,
    isEditing
){

    const button =
        getProjectElement(
            "projectSaveButton"
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

            ? "Cập nhật dự án"

            : "Lưu dự án"
        );

}


function getProjectValidIds(
    project
){

    return [

        project?.id,

        project?.legacyId,

        project?.back4appId

    ]

    .filter(Boolean)

    .map(value =>
        String(value)
    );

}


function findLocalProjectByAnyId(id){

    const targetId =
        String(id || "");


    return projects.find(project =>

        getProjectValidIds(
            project
        )

        .includes(
            targetId
        )

    ) || null;

}
function openProjectDeleteConfirm(
    projectName
){

    return new Promise(resolve => {

        const overlay =
            mountProjectOverlayToBody(
                "projectDeleteConfirm"
            );


        const message =
            getProjectElement(
                "projectDeleteConfirmMessage"
            );


        const confirmButton =
            getProjectElement(
                "projectDeleteConfirmButton"
            );


        if(!overlay){

            resolve(
                false
            );

            return;

        }


        if(
            typeof projectDeleteConfirmResolver
            ===
            "function"
        ){

            projectDeleteConfirmResolver(
                false
            );

        }


        projectDeleteConfirmResolver =
            resolve;


        if(message){

            message.textContent =

                `Bạn có chắc chắn muốn xóa dự án "${projectName}"?`;

        }


        if(confirmButton){

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Xóa dự án";

        }


        overlay.classList.add(
            "is-open"
        );


        overlay.setAttribute(
            "aria-hidden",
            "false"
        );


        overlay.style.setProperty(
            "display",
            "flex",
            "important"
        );


        document.documentElement
            .classList
            .add(
                "project-confirm-open"
            );


        document.body
            .classList
            .add(
                "project-confirm-open"
            );


        window.requestAnimationFrame(
            function(){

                confirmButton?.focus();

            }
        );

    });

}

function closeProjectDeleteConfirm(
    confirmed = false
){

    const overlay =
        getProjectElement(
            "projectDeleteConfirm"
        );


    if(overlay){

        overlay.classList.remove(
            "is-open"
        );


        overlay.setAttribute(
            "aria-hidden",
            "true"
        );


        overlay.style.setProperty(
            "display",
            "none",
            "important"
        );

    }


    document.documentElement
        .classList
        .remove(
            "project-confirm-open"
        );


    document.body
        .classList
        .remove(
            "project-confirm-open"
        );


    restoreProjectOverlayPosition(
        "projectDeleteConfirm"
    );


    const resolver =
        projectDeleteConfirmResolver;


    projectDeleteConfirmResolver =
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
// CHUYỂN PARSE OBJECT THÀNH OBJECT THƯỜNG
// =====================================

function projectParseObjectToPlain(
    parseObject,
    fallbackProject = null
){

    const back4appId =
        String(

            parseObject?.id

            ||

            fallbackProject?.back4appId

            ||

            ""

        ).trim();


    const fallbackLegacyId =

        fallbackProject?.id

        &&

        String(
            fallbackProject.id
        )

        !==

        back4appId

        ? String(
            fallbackProject.id
        )

        : "";


    const legacyId =
        String(

            parseObject?.get(
                "legacyId"
            )

            ||

            fallbackProject?.legacyId

            ||

            fallbackLegacyId

            ||

            ""

        ).trim();


    return {

        /*
        Dữ liệu cũ có thể liên kết Hồ sơ bằng legacyId.

        Dự án mới:
        id = objectId Back4App.
        */

        id:

            legacyId

            ||

            back4appId

            ||

            fallbackProject?.id

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

                fallbackProject?.ten

                ??

                ""

            ),


        diachi:
            String(

                parseObject?.get(
                    "diachi"
                )

                ??

                fallbackProject?.diachi

                ??

                ""

            ),


        createdAt:

            parseObject?.createdAt

            ? parseObject.createdAt
                .toISOString()

            : (
                fallbackProject?.createdAt

                ||

                ""
            ),


        updatedAt:

            parseObject?.updatedAt

            ? parseObject.updatedAt
                .toISOString()

            : (
                fallbackProject?.updatedAt

                ||

                ""
            )

    };

}


// =====================================
// TÌM OBJECT DỰ ÁN THẬT TRÊN BACK4APP
// =====================================

async function findProjectObjectOnBack4App(
    project
){

    ensureProjectBack4AppReady();


    if(!project){

        return null;

    }


    /*
    1. Tìm bằng objectId Back4App.
    */

    const back4appId =
        String(
            project.back4appId || ""
        ).trim();


    if(back4appId){

        try{

            const queryByObjectId =
                new Parse.Query(
                    PROJECT_CLASS_NAME
                );


            return await queryByObjectId.get(
                back4appId
            );

        }catch(error){

            /*
            Code 101 có thể là object mất
            hoặc ACL không cho nhìn thấy.
            */

            if(error?.code !== 101){

                throw error;

            }


            console.warn(

                "Không tìm thấy Project bằng back4appId:",

                back4appId

            );

        }

    }


    /*
    2. Tìm bằng legacyId.
    */

    const legacyId =
        String(

            project.legacyId

            ||

            (
                project.id

                &&

                String(project.id)
                !==
                back4appId

                ? project.id

                : ""
            )

            ||

            ""

        ).trim();


    if(legacyId){

        const queryByLegacyId =
            new Parse.Query(
                PROJECT_CLASS_NAME
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
        normalizeProjectText(
            project.ten || ""
        );


    if(normalizedName){

        const queryByNormalizedName =
            new Parse.Query(
                PROJECT_CLASS_NAME
            );


        queryByNormalizedName.equalTo(
            "tenNormalized",
            normalizedName
        );


        const foundByNormalizedName =
            await queryByNormalizedName.first();


        if(foundByNormalizedName){

            return foundByNormalizedName;

        }

    }


    /*
    4. Dữ liệu cũ có thể chưa có tenNormalized.
    */

    const rawName =
        String(
            project.ten || ""
        ).trim();


    if(rawName){

        const queryByRawName =
            new Parse.Query(
                PROJECT_CLASS_NAME
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
// MIGRATE DỮ LIỆU CŨ
// Chỉ chạy khi gọi thủ công
// =====================================

async function migrateProjectsToBack4App(
    force = false
){

    if(projectMigrationPromise){

        return projectMigrationPromise;

    }


    projectMigrationPromise =
        (async function(){

            ensureProjectBack4AppReady();


            if(
                !force

                &&

                localStorage.getItem(
                    PROJECT_MIGRATION_KEY
                )
            ){

                return {

                    migrated: 0,

                    skipped: 0,

                    alreadyCompleted: true

                };

            }


            const oldProjects =
                getProjectStorageArray(
                    PROJECT_STORAGE_KEY
                );


            const currentUser =
                Parse.User.current();


            let migrated = 0;

            let skipped = 0;


            for(
                const item
                of oldProjects
            ){

                const name =
                    String(

                        item?.ten

                        ||

                        item?.name

                        ||

                        ""

                    ).trim();


                if(!name){

                    skipped += 1;

                    continue;

                }


                const existing =
                    await findProjectObjectOnBack4App(
                        item
                    );


                if(existing){

                    skipped += 1;

                    continue;

                }


                const projectObject =
                    new Parse.Object(
                        PROJECT_CLASS_NAME
                    );


                projectObject.set(
                    "ten",
                    name
                );


                projectObject.set(
                    "tenNormalized",
                    normalizeProjectText(
                        name
                    )
                );


                projectObject.set(

                    "diachi",

                    String(

                        item?.diachi

                        ||

                        item?.address

                        ||

                        ""

                    )

                );


                const legacyId =
                    String(

                        item?.legacyId

                        ||

                        item?.id

                        ||

                        ""

                    ).trim();


                if(legacyId){

                    projectObject.set(
                        "legacyId",
                        legacyId
                    );

                }


                if(currentUser){

                    projectObject.set(
                        "createdBy",
                        currentUser
                    );


                    projectObject.set(
                        "updatedBy",
                        currentUser
                    );

                }


                await projectObject.save();


                migrated += 1;

            }


            localStorage.setItem(

                PROJECT_MIGRATION_KEY,

                JSON.stringify({

                    completedAt:
                        new Date()
                        .toISOString(),

                    migrated:
                        migrated,

                    skipped:
                        skipped

                })

            );


            return {

                migrated,

                skipped,

                alreadyCompleted: false

            };

        })();


    try{

        return await projectMigrationPromise;

    }finally{

        projectMigrationPromise =
            null;

    }

}


// =====================================
// ĐỌC DỰ ÁN TỪ BACK4APP
// =====================================

async function fetchProjectsFromBack4App(
    forceReload = false
){

    ensureProjectBack4AppReady();


    if(
        projectDataLoaded

        &&

        !forceReload
    ){

        return projects;

    }


    if(projectLoadingPromise){

        return projectLoadingPromise;

    }


    projectLoadingPromise =
        (async function(){

            const query =
                new Parse.Query(
                    PROJECT_CLASS_NAME
                );


            query.ascending(
                "ten"
            );


            query.limit(
                1000
            );


            const results =
                await query.find();


            projects =
                results.map(item =>

                    projectParseObjectToPlain(
                        item
                    )

                );


            projectDataLoaded =
                true;


            saveProjectsToStorage();


            return projects;

        })();


    try{

        return await projectLoadingPromise;

    }finally{

        projectLoadingPromise =
            null;

    }

}


// =====================================
// LOAD DỰ ÁN
// =====================================

async function loadProject(){

    setProjectTableMessage(
        "Đang tải dự án..."
    );


    try{

        /*
        Không tự migrate ở đây để tránh
        dữ liệu cache cũ bị đưa lại lên server.
        */

        await fetchProjectsFromBack4App(
            true
        );


        renderProject(
            getCurrentProjectKeyword()
        );


        renderProjectSelectOptions();


        return [
            ...projects
        ];

    }catch(error){

        console.error(
            "Không tải được Dự án:",
            error
        );


        setProjectTableMessage(

            error?.message

            ||

            "Không tải được Dự án.",

            true

        );


        return [];

    }

}

// =====================================================
// MỞ FORM THÊM DỰ ÁN
// =====================================================

function openProjectForm(){

    editingProjectId =
        null;


    resetProjectForm();


    const title =
        getProjectElement(
            "projectFormTitle"
        );


    const saveButton =
        getProjectElement(
            "projectSaveButton"
        );


    if(title){

        title.textContent =
            "Thêm dự án";

    }


    if(saveButton){

        saveButton.disabled =
            false;

        saveButton.textContent =
            "Lưu dự án";

    }


    setProjectFormVisible(
        true
    );

}
// =====================================================
// ĐÓNG FORM DỰ ÁN
// =====================================================

function closeProjectForm(){

    setProjectFormVisible(
        false
    );


    editingProjectId =
        null;


    resetProjectForm();

}

function resetProjectForm(){

    setProjectInputValue(
        "projectName",
        ""
    );


    setProjectInputValue(
        "projectAddress",
        ""
    );

}


// =====================================
// KIỂM TRA TRÙNG TÊN
// =====================================

async function findDuplicatedProjectByName(
    normalizedName,
    ignoredObjectId = ""
){

    const query =
        new Parse.Query(
            PROJECT_CLASS_NAME
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
// LƯU / CẬP NHẬT DỰ ÁN
// =====================================

async function saveProject(){

    const projectName =
        getProjectInputValue(
            "projectName"
        );


    const projectAddress =
        getProjectInputValue(
            "projectAddress"
        );


    if(!projectName){

        showProjectMessage(
            "Vui lòng nhập tên dự án.",
            "error"
        );


        getProjectElement(
            "projectName"
        )?.focus();


        return;

    }


    const isEditing =
        editingProjectId !== null;


    setProjectSaveBusy(
        true,
        isEditing
    );


    try{

        ensureProjectBack4AppReady();


        if(!projectDataLoaded){

            await fetchProjectsFromBack4App(
                true
            );

        }


        const editingProject =

            isEditing

            ? findLocalProjectByAnyId(
                editingProjectId
            )

            : null;


        if(
            isEditing

            &&

            !editingProject
        ){

            throw new Error(
                "Không tìm thấy dự án cần chỉnh sửa."
            );

        }


        const normalizedName =
            normalizeProjectText(
                projectName
            );


        let projectObject;


        if(isEditing){

            /*
            Không bắt buộc dự án phải có back4appId.

            Hàm này sẽ lần lượt tìm theo:
            - back4appId
            - legacyId
            - tên chuẩn hóa
            - tên gốc
            */

            projectObject =
                await findProjectObjectOnBack4App(
                    editingProject
                );


            if(!projectObject){

                throw new Error(
                    "Không tìm thấy dự án này trên Back4App."
                );

            }

        }else{

            projectObject =
                new Parse.Object(
                    PROJECT_CLASS_NAME
                );

        }


        /*
        Kiểm tra trùng tên, nhưng bỏ qua
        chính dự án đang sửa.
        */

        const duplicatedProject =
            await findDuplicatedProjectByName(

                normalizedName,

                projectObject.id || ""

            );


        if(duplicatedProject){

            showProjectMessage(
                "Tên dự án này đã tồn tại.",
                "error"
            );


            getProjectElement(
                "projectName"
            )?.focus();


            return;

        }


        projectObject.set(
            "ten",
            projectName
        );


        projectObject.set(
            "tenNormalized",
            normalizedName
        );


        projectObject.set(
            "diachi",
            projectAddress
        );


        /*
        Giữ legacyId của dữ liệu cũ.
        */

        if(isEditing){

            const legacyId =
                String(

                    editingProject.legacyId

                    ||

                    (
                        editingProject.id

                        &&

                        String(
                            editingProject.id
                        )

                        !==

                        String(
                            projectObject.id
                        )

                        ? editingProject.id

                        : ""
                    )

                    ||

                    ""

                ).trim();


            if(legacyId){

                projectObject.set(
                    "legacyId",
                    legacyId
                );

            }

        }


        const currentUser =
            Parse.User.current();


        if(
            !isEditing

            &&

            currentUser
        ){

            projectObject.set(
                "createdBy",
                currentUser
            );

        }


        if(currentUser){

            projectObject.set(
                "updatedBy",
                currentUser
            );

        }


        await projectObject.save();


        /*
        Tải lại dữ liệu thật từ Back4App.
        */

        await fetchProjectsFromBack4App(
            true
        );


        renderProject(
            getCurrentProjectKeyword()
        );


        renderProjectSelectOptions();


        closeProjectForm();


        showProjectMessage(

            isEditing

            ? `Đã cập nhật dự án "${projectName}".`

            : `Đã thêm dự án "${projectName}".`,

            "success"

        );

    }catch(error){

        console.error(
            "Không lưu được Dự án:",
            {
                code:
                    error?.code,

                message:
                    error?.message,

                error
            }
        );


        if(Number(error?.code) === 119){

            showProjectMessage(
                "Tài khoản hiện tại chưa có quyền tạo hoặc cập nhật Project trên Back4App.",
                "error"
            );

        }else if(
            Number(error?.code) === 101
        ){

            showProjectMessage(
                "Dự án không còn tồn tại hoặc tài khoản không có quyền đọc dự án này.",
                "error"
            );

        }else if(
            Number(error?.code) === 209
        ){

            showProjectMessage(
                "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
                "error"
            );

        }else{

            showProjectMessage(

                error?.message

                ||

                "Không thể lưu thông tin dự án.",

                "error"

            );

        }

    }finally{

        setProjectSaveBusy(
            false,
            isEditing
        );

    }

}

// =====================================
// THỐNG KÊ
// =====================================

function setProjectSummaryValue(
    elementId,
    value
){

    const element =
        getProjectElement(
            elementId
        );


    if(element){

        element.textContent =
            String(value);

    }

}


function updateProjectSummary(
    visibleCount = projects.length
){

    const projectList =

        Array.isArray(projects)

        ? projects

        : [];


    const totalCount =
        projectList.length;


    const withAddressCount =
        projectList.filter(item =>

            Boolean(

                String(
                    item.diachi || ""
                ).trim()

            )

        ).length;


    const withoutAddressCount =

        totalCount

        -

        withAddressCount;


    setProjectSummaryValue(
        "totalProjectCount",
        totalCount
    );


    setProjectSummaryValue(
        "projectWithAddressCount",
        withAddressCount
    );


    setProjectSummaryValue(
        "projectWithoutAddressCount",
        withoutAddressCount
    );


    setProjectSummaryValue(
        "visibleProjectCount",
        visibleCount
    );

}


// =====================================
// HIỂN THỊ BẢNG
// =====================================

function renderProject(
    keyword = ""
){

    const table =
        getProjectElement(
            "projectTable"
        );


    if(!table){

        return;

    }


    const normalizedKeyword =
        normalizeProjectText(
            keyword
        );


    const filteredProjects =
        projects.filter(item => {

            const searchText = `

                ${item.ten || ""}

                ${item.diachi || ""}

            `;


            return normalizeProjectText(
                searchText
            )

            .includes(
                normalizedKeyword
            );

        });


    updateProjectSummary(
        filteredProjects.length
    );


    if(
        filteredProjects.length ===
        0
    ){

        table.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="project-loading-cell"
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
                        Chưa có dự án phù hợp
                    </strong>

                    <div
                        style="
                            margin-top:4px;
                            font-size:11px;
                        "
                    >
                        Thử thay đổi từ khóa tìm kiếm hoặc thêm một dự án mới.
                    </div>

                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        filteredProjects

        .map(item => {

            const projectId =
                escapeProjectHtml(
                    String(item.id)
                );


            const projectName =
                escapeProjectHtml(
                    item.ten || "—"
                );


            const hasAddress =
                Boolean(

                    String(
                        item.diachi || ""
                    ).trim()

                );


            const projectAddress =
                escapeProjectHtml(

                    String(
                        item.diachi || ""
                    ).trim()

                );


            return `

                <tr>

                    <td
                        class="project-name-cell"
                        title="${projectName}"
                    >
                        ${projectName}
                    </td>


                    <td class="project-address-cell">

                        ${
                            hasAddress

                            ? `

                                <span
                                    class="project-address-text"
                                    title="${projectAddress}"
                                >
                                    📍 ${projectAddress}
                                </span>

                            `

                            : `

                                <span
                                    class="project-address-missing"
                                >
                                    Chưa cập nhật
                                </span>

                            `
                        }

                    </td>


                    <td class="project-action-cell">

                        <button
                            type="button"
                            class="project-edit-button"
                            onclick="
    window.editProject(
        '${projectId}'
    )
"
                            title="Sửa dự án"
                        >
                            ✏️
                        </button>


                        <button
                            type="button"
                            class="project-delete-button"
                            onclick="
    window.deleteProject(
        '${projectId}'
    )
"
                            title="Xóa dự án"
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
// CHỈNH SỬA DỰ ÁN
// =====================================

function editProject(id){

    const project =
        findLocalProjectByAnyId(
            id
        );


    if(!project){

        showProjectMessage(
            "Không tìm thấy dự án cần chỉnh sửa.",
            "error"
        );

        return;

    }


    /*
    Giữ ID nhận diện hiện tại.
    findLocalProjectByAnyId() sẽ hỗ trợ
    id, legacyId và back4appId.
    */

    editingProjectId =

        project.back4appId

        ||

        project.id

        ||

        project.legacyId;


    setProjectInputValue(
        "projectName",
        project.ten || ""
    );


    setProjectInputValue(
        "projectAddress",
        project.diachi || ""
    );


    const title =
        getProjectElement(
            "projectFormTitle"
        );


    const saveButton =
        getProjectElement(
            "projectSaveButton"
        );


    if(title){

        title.textContent =
            "Chỉnh sửa dự án";

    }


    if(saveButton){

        saveButton.disabled =
            false;

        saveButton.textContent =
            "Cập nhật dự án";

    }


    const opened =
        setProjectFormVisible(
            true
        );


    if(!opened){

        showProjectMessage(
            "Không tìm thấy popup chỉnh sửa dự án.",
            "error"
        );

    }

}
// =====================================
// KIỂM TRA NHANH DỰ ÁN CÓ HỒ SƠ LIÊN KẾT
// =====================================

async function projectHasLinkedDossier(
    project
){

    ensureProjectBack4AppReady();


    const validProjectIds =
        getProjectValidIds(
            project
        );


    if(
        validProjectIds.length ===
        0
    ){

        return false;

    }


    const query =
        new Parse.Query(
            PROJECT_DOSSIER_CLASS_NAME
        );


    query.containedIn(

        "projectId",

        validProjectIds

    );


    /*
    Chỉ cần tìm 1 hồ sơ.

    first() nhanh hơn count()
    vì không cần đếm toàn bộ dữ liệu.
    */

    const linkedDossier =
        await query.first();


    return Boolean(
        linkedDossier
    );

}

// =====================================
// XÓA OBJECT DỰ ÁN NHANH
// =====================================

async function destroyProjectObjectFast(
    project
){

    ensureProjectBack4AppReady();


    const cachedObjectId =
        String(

            project?.back4appId

            ||

            ""

        ).trim();


    /*
    Trường hợp bình thường:

    Dữ liệu vừa được tải từ Back4App,
    nên back4appId đang đúng.

    Xóa trực tiếp, không cần query lại object.
    */

    if(cachedObjectId){

        const projectPointer =
            Parse.Object.createWithoutData(

                PROJECT_CLASS_NAME,

                cachedObjectId

            );


        try{

            await projectPointer.destroy();


            return cachedObjectId;

        }catch(error){

            /*
            Nếu ID cache cũ thì mới chạy
            phương án tìm dự phòng.
            */

            if(error?.code !== 101){

                throw error;

            }


            console.warn(

                "ObjectId cache không xóa được, đang tìm object thật:",

                cachedObjectId

            );

        }

    }


    /*
    Chỉ chạy khi back4appId bị thiếu
    hoặc Back4App báo Object not found.
    */

    const actualObject =
        await findProjectObjectOnBack4App(
            project
        );


    if(!actualObject){

        throw new Error(

            "Không tìm thấy dự án trên Back4App."

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
// XÓA DỰ ÁN
// =====================================

async function deleteProject(id){

    if(projectDeleteInProgress){

        return;

    }


    /*
    Không dùng projects.find(item.id)
    vì dữ liệu cũ có thể dùng legacyId.
    */

    const project =
        findLocalProjectByAnyId(
            id
        );


    if(!project){

        showProjectMessage(
            "Không tìm thấy dự án cần xóa.",
            "error"
        );

        return;

    }


    try{

        ensureProjectBack4AppReady();


        /*
        Kiểm tra nhanh dự án có Hồ sơ liên kết.
        Dùng đúng hàm đã có trong file.
        */

        const hasLinkedDossier =
            await projectHasLinkedDossier(
                project
            );


        if(hasLinkedDossier){

            showProjectMessage(

                `Không thể xóa "${project.ten}". `

                +

                "Dự án đang được sử dụng trong ít nhất một hồ sơ. "

                +

                "Hãy chuyển hồ sơ sang dự án khác trước.",

                "error"

            );


            return;

        }


        const confirmed =
            await openProjectDeleteConfirm(
                project.ten || "Dự án"
            );


        if(!confirmed){

            return;

        }


        projectDeleteInProgress =
            true;


        const confirmButton =
            getProjectElement(
                "projectDeleteConfirmButton"
            );


        if(confirmButton){

            confirmButton.disabled =
                true;

            confirmButton.textContent =
                "Đang xóa...";

        }


        /*
        Dùng hàm xóa đã có sẵn trong file.
        Hàm hỗ trợ:
        - back4appId
        - legacyId
        - tên chuẩn hóa
        */

        const deletedObjectId =
            await destroyProjectObjectFast(
                project
            );


        const deletedIds =
            new Set(

                [

                    id,

                    deletedObjectId,

                    project.id,

                    project.legacyId,

                    project.back4appId

                ]

                .filter(Boolean)

                .map(value =>
                    String(value)
                )

            );


        projects =
            projects.filter(item => {

                const itemIds =
                    getProjectValidIds(
                        item
                    );


                return !itemIds.some(
                    itemId =>

                        deletedIds.has(
                            String(itemId)
                        )

                );

            });


        saveProjectsToStorage();


        /*
        Đóng xác nhận trước khi render lại.
        */

        closeProjectDeleteConfirm(
            false
        );


        if(
            editingProjectId !== null

            &&

            getProjectValidIds(project)
                .includes(
                    String(editingProjectId)
                )
        ){

            closeProjectForm();

        }


        renderProject(
            getCurrentProjectKeyword()
        );


        renderProjectSelectOptions();


        showProjectMessage(

            `Đã xóa dự án "${project.ten}".`,

            "success"

        );


        /*
        Đồng bộ lại từ server sau khi giao diện
        đã cập nhật, tránh người dùng phải chờ lâu.
        */

        try{

            await fetchProjectsFromBack4App(
                true
            );


            renderProject(
                getCurrentProjectKeyword()
            );


            renderProjectSelectOptions();

        }catch(reloadError){

            console.warn(
                "Dự án đã xóa nhưng chưa tải lại được danh sách:",
                reloadError
            );

        }

    }catch(error){

        console.error(
            "Không xóa được Dự án:",
            {
                selectedId:
                    id,

                project,

                code:
                    error?.code,

                message:
                    error?.message,

                error
            }
        );


        closeProjectDeleteConfirm(
            false
        );


        const errorCode =
            Number(error?.code);


        const errorMessage =
            String(
                error?.message || ""
            );


        if(
            errorCode === 119

            ||

            /permission|forbidden|not allowed|authorized/i
                .test(errorMessage)
        ){

            showProjectMessage(
                "Tài khoản hiện tại chưa có quyền xóa dữ liệu trong class Project trên Back4App.",
                "error"
            );

        }else if(errorCode === 101){

            /*
            Object đã không còn trên server.
            Làm mới danh sách để loại dữ liệu cache cũ.
            */

            try{

                await fetchProjectsFromBack4App(
                    true
                );


                renderProject(
                    getCurrentProjectKeyword()
                );


                renderProjectSelectOptions();

            }catch(reloadError){

                console.error(
                    "Không làm mới được danh sách:",
                    reloadError
                );

            }


            showProjectMessage(
                "Dự án không còn tồn tại trên Back4App. Danh sách đã được làm mới.",
                "info"
            );

        }else if(errorCode === 209){

            showProjectMessage(
                "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
                "error"
            );

        }else{

            showProjectMessage(

                errorMessage

                ||

                "Không thể xóa dự án.",

                "error"

            );

        }

    }finally{

        projectDeleteInProgress =
            false;


        const confirmButton =
            getProjectElement(
                "projectDeleteConfirmButton"
            );


        if(confirmButton){

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Xóa dự án";

        }

    }

}
// =====================================
// DROPDOWN DỰ ÁN TRONG HỒ SƠ
// =====================================

function renderProjectSelectOptions(){

    const select =
        getProjectElement(
            "dossierProject"
        );


    if(!select){

        return;

    }


    const currentValue =
        select.value;


    select.innerHTML = `

        <option value="">
            -- Chọn Dự án --
        </option>

    `;


    const sortedProjects =
        [...projects].sort(

            (a, b) =>

                String(a.ten || "")

                .localeCompare(

                    String(
                        b.ten || ""
                    ),

                    "vi"

                )

        );


    sortedProjects.forEach(item => {

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
        projects.some(item =>

            String(item.id)

            ===

            String(currentValue)

        );


    select.value =

        valueStillExists

        ? currentValue

        : "";

}


async function loadProjectSelect(){

    try{

        await fetchProjectsFromBack4App(
            true
        );


        renderProjectSelectOptions();


        return [
            ...projects
        ];

    }catch(error){

        console.error(
            "Không tải được dropdown Dự án:",
            error
        );


        return [];

    }

}


// =====================================
// LÀM MỚI
// =====================================

async function refreshProjectData(){

    try{

        await fetchProjectsFromBack4App(
            true
        );


        if(
            getProjectElement(
                "projectTable"
            )
        ){

            renderProject(
                getCurrentProjectKeyword()
            );

        }


        renderProjectSelectOptions();


        showProjectMessage(

            `Đã đồng bộ ${projects.length} dự án từ Back4App.`,

            "info"

        );


        return [
            ...projects
        ];

    }catch(error){

        console.error(
            "Không thể làm mới dữ liệu Dự án:",
            error
        );


        setProjectTableMessage(

            error?.message

            ||

            "Không thể tải dữ liệu Dự án.",

            true

        );


        return [];

    }

}


// =====================================
// TÌM KIẾM
// =====================================

document.addEventListener(

    "input",

    function(event){

        if(
            event.target

            &&

            event.target.id ===
            "searchProject"
        ){

            renderProject(
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
            getProjectElement(
                "projectDeleteConfirm"
            );


        if(
            deleteConfirm

            &&

            deleteConfirm.classList.contains(
                "is-open"
            )
        ){

            closeProjectDeleteConfirm(
                false
            );


            return;

        }


        const form =
            getProjectElement(
                "projectForm"
            );


        if(
            form

            &&

            form.classList.contains(
                "is-open"
            )
        ){

            closeProjectForm();

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
            !getProjectElement(
                "projectTable"
            )
        ){

            return;

        }


        try{

            await fetchProjectsFromBack4App(
                true
            );


            renderProject(
                getCurrentProjectKeyword()
            );


            renderProjectSelectOptions();

        }catch(error){

            console.error(

                "Không thể đồng bộ Dự án khi quay lại tab:",

                error

            );

        }

    }

);


// =====================================
// ĐƯA HÀM RA WINDOW
// =====================================

window.openProjectDeleteConfirm =
    openProjectDeleteConfirm;


window.closeProjectDeleteConfirm =
    closeProjectDeleteConfirm;


window.openProjectForm =
    openProjectForm;


window.closeProjectForm =
    closeProjectForm;


window.saveProject =
    saveProject;


window.editProject =
    editProject;


window.deleteProject =
    deleteProject;


window.loadProject =
    loadProject;


window.refreshProjectData =
    refreshProjectData;


window.loadProjectSelect =
    loadProjectSelect;


window.renderProject =
    renderProject;


window.migrateProjectsToBack4App =
    migrateProjectsToBack4App;


window.findProjectObjectOnBack4App =
    findProjectObjectOnBack4App;


window.getProjectsData =
    function(){

        return [
            ...projects
        ];

    };
