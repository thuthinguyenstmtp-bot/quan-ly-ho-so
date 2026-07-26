// =====================================
// BACKUP.JS
// Sao lưu và khôi phục dữ liệu Back4App
// =====================================

const BACKUP_APP_NAME =
    "QuanLyHoSo";

const BACKUP_VERSION =
    2;


const BACKUP_CLASSES = {

    suppliers:
        "Supplier",

    projects:
        "Project",

    dossiers:
        "Dossier",

    letters:
        "Letter",

    archiveDossiers:
        "ArchiveDossier"

};


const BACKUP_KEYS =
    Object.keys(
        BACKUP_CLASSES
    );


const BACKUP_MIGRATION_KEYS = [

    "supplierBack4AppMigrationV1",

    "projectBack4AppMigrationV1",

    "dossierBack4AppMigrationV1",

    "letterBack4AppMigrationV1",

    "archiveDossierBack4AppMigrationV1"

];


let pendingBackupData =
    null;


// =====================================
// HÀM HỖ TRỢ
// =====================================

function getBackupElement(id){

    return document.getElementById(id);

}


function setBackupText(
    elementId,
    value
){

    const element =
        getBackupElement(elementId);


    if(element){

        element.textContent =
            String(value);

    }

}


function escapeBackupHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


function normalizeBackupText(value){

    return String(value || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


function ensureBackupBack4AppReady(){

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


function setBackupPreview(html){

    const preview =
        getBackupElement(
            "backupPreview"
        );


    if(preview){

        preview.innerHTML =
            html;

    }

}


function setBackupProgress(message){

    setBackupPreview(`

        <div class="backup-preview-success">

            <h3>
                Đang xử lý
            </h3>

            <p>
                ${escapeBackupHtml(message)}
            </p>

        </div>

    `);

}


function setBackupBusy(
    isBusy,
    action = ""
){

    const restoreButton =
        getBackupElement(
            "restoreBackupButton"
        );


    const exportButton =

        getBackupElement(
            "exportBackupButton"
        )

        ||

        document.querySelector(
            'button[onclick*="exportAppBackup"]'
        );


    if(restoreButton){

        restoreButton.disabled =

            isBusy

            ||

            !pendingBackupData;


        restoreButton.textContent =

            isBusy

            &&

            action === "restore"

            ? "Đang khôi phục..."

            : "Khôi phục dữ liệu";

    }


    if(exportButton){

        exportButton.disabled =
            isBusy;

    }

}


function formatBackupDateTime(value){

    if(!value){

        return "Không xác định";

    }


    const date =
        new Date(value);


    if(
        Number.isNaN(
            date.getTime()
        )
    ){

        return String(value);

    }


    return date.toLocaleString(
        "vi-VN"
    );

}


function createBackupFileName(
    prefix =
        "QUAN_LY_HO_SO_BACKUP"
){

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const hour =
        String(
            now.getHours()
        ).padStart(2, "0");


    const minute =
        String(
            now.getMinutes()
        ).padStart(2, "0");


    return `${prefix}_${year}-${month}-${day}_${hour}-${minute}.json`;

}


function downloadBackupObject(
    backupObject,
    fileName
){

    const jsonContent =
        JSON.stringify(
            backupObject,
            null,
            2
        );


    const blob =
        new Blob(

            [jsonContent],

            {
                type:
                    "application/json;charset=utf-8"
            }

        );


    const downloadUrl =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href =
        downloadUrl;


    link.download =
        fileName;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        downloadUrl
    );

}


// =====================================
// ĐỌC TOÀN BỘ OBJECT CỦA MỘT CLASS
// =====================================

async function fetchAllBackupObjects(
    className
){

    const pageSize =
        1000;


    let skip =
        0;


    const allObjects =
        [];


    while(true){

        const query =
            new Parse.Query(
                className
            );


        query.ascending(
            "objectId"
        );


        query.limit(
            pageSize
        );


        query.skip(
            skip
        );


        const results =
            await query.find();


        allObjects.push(
            ...results
        );


        if(
            results.length <
            pageSize
        ){

            break;

        }


        skip +=
            results.length;

    }


    return allObjects;

}


// =====================================
// ID DÙNG ĐỂ GIỮ LIÊN KẾT
// =====================================

function getBackupLogicalId(item){

    return String(

        item?.id

        ||

        item?.legacyId

        ||

        item?.back4appId

        ||

        item?.objectId

        ||

        ""

    ).trim();

}


// =====================================
// PARSE OBJECT → OBJECT SAO LƯU
// =====================================

function createBackupBaseItem(
    parseObject
){

    const legacyId =
        String(

            parseObject.get(
                "legacyId"
            )

            ||

            ""

        ).trim();


    return {

        id:
            legacyId

            ||

            parseObject.id,


        legacyId:
            legacyId,


        back4appId:
            parseObject.id,


        createdAt:

            parseObject.createdAt

            ? parseObject.createdAt
                .toISOString()

            : "",


        updatedAt:

            parseObject.updatedAt

            ? parseObject.updatedAt
                .toISOString()

            : ""

    };

}


function parseObjectToBackupItem(
    key,
    parseObject
){

    const base =
        createBackupBaseItem(
            parseObject
        );


    switch(key){

        case "suppliers":

            return {

                ...base,

                ten:
                    String(
                        parseObject.get(
                            "ten"
                        ) || ""
                    ),

                diachi:
                    String(
                        parseObject.get(
                            "diachi"
                        ) || ""
                    ),

                nguoinhan:
                    String(
                        parseObject.get(
                            "nguoinhan"
                        ) || ""
                    ),

                sdt:
                    String(
                        parseObject.get(
                            "sdt"
                        ) || ""
                    )

            };


        case "projects":

            return {

                ...base,

                ten:
                    String(
                        parseObject.get(
                            "ten"
                        ) || ""
                    ),

                diachi:
                    String(
                        parseObject.get(
                            "diachi"
                        ) || ""
                    )

            };


        case "dossiers":

            return {

                ...base,

                code:
                    String(
                        parseObject.get(
                            "code"
                        ) || ""
                    ),

                projectId:
                    String(
                        parseObject.get(
                            "projectId"
                        ) || ""
                    ),

                content:
                    String(
                        parseObject.get(
                            "content"
                        ) || ""
                    ),

                supplierId:
                    String(
                        parseObject.get(
                            "supplierId"
                        ) || ""
                    ),

                value:
                    Number(
                        parseObject.get(
                            "value"
                        ) || 0
                    ),

                documents:
                    String(
                        parseObject.get(
                            "documents"
                        ) || ""
                    ),

                fileStatus:
                    String(
                        parseObject.get(
                            "fileStatus"
                        ) || "Chưa up"
                    ),

                paymentRequest:
                    Boolean(
                        parseObject.get(
                            "paymentRequest"
                        )
                    ),

                deliveryDate:
                    String(
                        parseObject.get(
                            "deliveryDate"
                        ) || ""
                    ),

                paymentStatus:
                    String(
                        parseObject.get(
                            "paymentStatus"
                        ) || "Chưa thanh toán"
                    ),

                status:
                    String(
                        parseObject.get(
                            "status"
                        ) || "Chưa duyệt"
                    )

            };


        case "letters":

            return {

                ...base,

                type:
                    String(
                        parseObject.get(
                            "type"
                        ) || "Nhận"
                    ),

                date:
                    String(
                        parseObject.get(
                            "date"
                        ) || ""
                    ),

                number:
                    String(
                        parseObject.get(
                            "number"
                        ) || ""
                    ),

                supplierId:
                    String(
                        parseObject.get(
                            "supplierId"
                        ) || ""
                    ),

                channel:
                    String(
                        parseObject.get(
                            "channel"
                        ) || "Bưu điện"
                    ),

                contact:
                    String(
                        parseObject.get(
                            "contact"
                        ) || ""
                    ),

                subject:
                    String(
                        parseObject.get(
                            "subject"
                        ) || ""
                    ),

                note:
                    String(
                        parseObject.get(
                            "note"
                        ) || ""
                    )

            };


        case "archiveDossiers":

            return {

                ...base,

                type:
                    String(
                        parseObject.get(
                            "type"
                        ) || ""
                    ),

                code:
                    String(
                        parseObject.get(
                            "code"
                        ) || ""
                    ),

                name:
                    String(
                        parseObject.get(
                            "name"
                        ) || ""
                    ),

                linkedDossierId:
                    String(
                        parseObject.get(
                            "linkedDossierId"
                        ) || ""
                    ),

                projectId:
                    String(
                        parseObject.get(
                            "projectId"
                        ) || ""
                    ),

                supplierId:
                    String(
                        parseObject.get(
                            "supplierId"
                        ) || ""
                    ),

                archiveDate:
                    String(
                        parseObject.get(
                            "archiveDate"
                        ) || ""
                    ),

                location:
                    String(
                        parseObject.get(
                            "location"
                        ) || ""
                    ),

                quantity:
                    Number(
                        parseObject.get(
                            "quantity"
                        ) || 1
                    ),

                note:
                    String(
                        parseObject.get(
                            "note"
                        ) || ""
                    )

            };


        default:

            return base;

    }

}


// =====================================
// TẠO BẢN SAO LƯU BACK4APP
// =====================================

async function createBackupObject(){

    ensureBackupBack4AppReady();


    const entries =
        await Promise.all(

            Object.entries(
                BACKUP_CLASSES
            )

            .map(

                async (
                    [
                        key,
                        className
                    ]
                ) => {

                    const objects =
                        await fetchAllBackupObjects(
                            className
                        );


                    return [

                        key,

                        objects.map(

                            object =>

                                parseObjectToBackupItem(
                                    key,
                                    object
                                )

                        )

                    ];

                }

            )

        );


    return {

        appName:
            BACKUP_APP_NAME,

        backupVersion:
            BACKUP_VERSION,

        source:
            "Back4App",

        exportedAt:
            new Date()
            .toISOString(),

        data:
            Object.fromEntries(
                entries
            )

    };

}


// =====================================
// XUẤT FILE
// =====================================

async function exportAppBackup(){

    setBackupBusy(
        true,
        "export"
    );


    try{

        setBackupProgress(
            "Đang tải dữ liệu mới nhất từ Back4App..."
        );


        const backupObject =
            await createBackupObject();


        const fileName =
            createBackupFileName();


        downloadBackupObject(
            backupObject,
            fileName
        );


        setBackupPreview(`

            <div class="backup-preview-success">

                <h3>
                    Đã xuất file sao lưu
                </h3>

                <p>
                    ${escapeBackupHtml(
                        fileName
                    )}
                </p>

            </div>

        `);


        await updateBackupSummary();

    }catch(error){

        console.error(
            "Không xuất được file sao lưu:",
            error
        );


        setBackupPreview(`

            <div class="backup-preview-error">

                <strong>
                    Không thể xuất file sao lưu
                </strong>

                <p>
                    ${escapeBackupHtml(
                        error.message ||
                        error
                    )}
                </p>

            </div>

        `);


        alert(

            "Không thể xuất file sao lưu.\n\n"

            +

            (
                error.message ||
                error
            )

        );

    }finally{

        setBackupBusy(false);

    }

}


// =====================================
// THỐNG KÊ DỮ LIỆU BACK4APP
// =====================================

async function updateBackupSummary(){

    ensureBackupBack4AppReady();


    const counts =
        await Promise.all(

            Object.values(
                BACKUP_CLASSES
            )

            .map(

                className =>

                    new Parse.Query(
                        className
                    ).count()

            )

        );


    setBackupText(
        "backupSupplierCount",
        counts[0]
    );


    setBackupText(
        "backupProjectCount",
        counts[1]
    );


    setBackupText(
        "backupDossierCount",
        counts[2]
    );


    setBackupText(
        "backupLetterCount",
        counts[3]
    );


    setBackupText(
        "backupArchiveCount",
        counts[4]
    );

}


// =====================================
// KHỞI TẠO TRANG
// =====================================

async function initializeBackupPage(){

    clearBackupSelection();


    setBackupText(
        "backupSupplierCount",
        "..."
    );


    setBackupText(
        "backupProjectCount",
        "..."
    );


    setBackupText(
        "backupDossierCount",
        "..."
    );


    setBackupText(
        "backupLetterCount",
        "..."
    );


    setBackupText(
        "backupArchiveCount",
        "..."
    );


    try{

        await updateBackupSummary();

    }catch(error){

        console.error(
            "Không tải được số lượng dữ liệu:",
            error
        );


        setBackupPreview(`

            <div class="backup-preview-error">

                <strong>
                    Không tải được dữ liệu Back4App
                </strong>

                <p>
                    ${escapeBackupHtml(
                        error.message ||
                        error
                    )}
                </p>

            </div>

        `);

    }

}


// =====================================
// KIỂM TRA FILE
// =====================================

function findDuplicateBackupValue(
    items,
    fieldName
){

    const values =
        new Set();


    for(const item of items){

        const value =
            normalizeBackupText(
                item?.[fieldName]
            );


        if(!value){

            continue;

        }


        if(values.has(value)){

            return item[fieldName];

        }


        values.add(value);

    }


    return "";

}


function validateBackupObject(
    backupObject
){

    if(
        !backupObject

        ||

        typeof backupObject !==
        "object"
    ){

        return {

            valid: false,

            message:
                "Nội dung file không hợp lệ."

        };

    }


    if(
        backupObject.appName !==
        BACKUP_APP_NAME
    ){

        return {

            valid: false,

            message:
                "File này không phải file sao lưu của phần mềm Quản lý Hồ sơ."

        };

    }


    if(
        !backupObject.data

        ||

        typeof backupObject.data !==
        "object"
    ){

        return {

            valid: false,

            message:
                "File không có phần dữ liệu cần khôi phục."

        };

    }


    for(const key of BACKUP_KEYS){

        const value =
            backupObject.data[key];


        if(
            value !== undefined

            &&

            !Array.isArray(value)
        ){

            return {

                valid: false,

                message:
                    `Dữ liệu "${key}" không đúng định dạng.`

            };

        }

    }


    const duplicateRules = [

        [
            "suppliers",
            "ten",
            "Tên Nhà cung cấp"
        ],

        [
            "projects",
            "ten",
            "Tên Dự án"
        ],

        [
            "dossiers",
            "code",
            "Mã Hồ sơ"
        ],

        [
            "archiveDossiers",
            "code",
            "Mã Hồ sơ lưu"
        ]

    ];


    for(
        const [
            key,
            field,
            label
        ]
        of duplicateRules
    ){

        const duplicatedValue =
            findDuplicateBackupValue(

                backupObject.data[key]
                || [],

                field

            );


        if(duplicatedValue){

            return {

                valid: false,

                message:
                    `${label} bị trùng trong file: "${duplicatedValue}".`

            };

        }

    }


    return {

        valid: true,

        message:
            "File sao lưu hợp lệ."

    };

}


// =====================================
// XEM TRƯỚC FILE
// =====================================

function previewBackupFile(event){

    const file =
        event.target.files?.[0];


    const restoreButton =
        getBackupElement(
            "restoreBackupButton"
        );


    pendingBackupData =
        null;


    if(restoreButton){

        restoreButton.disabled =
            true;

    }


    if(!file){

        clearBackupSelection();

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
    function(loadEvent){

        try{

            const backupObject =
                JSON.parse(
                    loadEvent.target.result
                );


            const validation =
                validateBackupObject(
                    backupObject
                );


            if(!validation.valid){

                throw new Error(
                    validation.message
                );

            }


            pendingBackupData =
                backupObject;


            const data =
                backupObject.data;


            setBackupPreview(`

                <div class="backup-preview-success">

                    <h3>
                        File sao lưu hợp lệ
                    </h3>

                    <p>

                        <strong>
                            Tên file:
                        </strong>

                        ${escapeBackupHtml(
                            file.name
                        )}

                    </p>

                    <p>

                        <strong>
                            Nguồn:
                        </strong>

                        ${escapeBackupHtml(
                            backupObject.source ||
                            "Bản sao lưu cũ"
                        )}

                    </p>

                    <p>

                        <strong>
                            Ngày xuất:
                        </strong>

                        ${escapeBackupHtml(

                            formatBackupDateTime(
                                backupObject.exportedAt
                            )

                        )}

                    </p>

                    <div class="backup-preview-grid">

                        <span>
                            Nhà cung cấp:
                            <strong>
                                ${data.suppliers?.length || 0}
                            </strong>
                        </span>

                        <span>
                            Dự án:
                            <strong>
                                ${data.projects?.length || 0}
                            </strong>
                        </span>

                        <span>
                            Hồ sơ:
                            <strong>
                                ${data.dossiers?.length || 0}
                            </strong>
                        </span>

                        <span>
                            Thư:
                            <strong>
                                ${data.letters?.length || 0}
                            </strong>
                        </span>

                        <span>
                            Hồ sơ lưu:
                            <strong>
                                ${data.archiveDossiers?.length || 0}
                            </strong>
                        </span>

                    </div>

                </div>

            `);


            if(restoreButton){

                restoreButton.disabled =
                    false;

            }

        }catch(error){

            console.error(
                "Không đọc được file sao lưu:",
                error
            );


            pendingBackupData =
                null;


            setBackupPreview(`

                <div class="backup-preview-error">

                    <strong>
                        File không hợp lệ
                    </strong>

                    <p>
                        ${escapeBackupHtml(
                            error.message ||
                            error
                        )}
                    </p>

                </div>

            `);


            if(restoreButton){

                restoreButton.disabled =
                    true;

            }

        }

    };


    reader.onerror =
    function(){

        pendingBackupData =
            null;


        setBackupPreview(`

            <div class="backup-preview-error">

                Không thể đọc file đã chọn.

            </div>

        `);

    };


    reader.readAsText(
        file
    );

}


// =====================================
// XÓA DỮ LIỆU MỘT CLASS
// =====================================

async function deleteBackupClassData(
    className
){

    const objects =
        await fetchAllBackupObjects(
            className
        );


    const batchSize =
        20;


    for(
        let index = 0;
        index < objects.length;
        index += batchSize
    ){

        const batch =
            objects.slice(
                index,
                index + batchSize
            );


        await Parse.Object.destroyAll(
            batch
        );

    }

}


// =====================================
// TẠO OBJECT KHÔI PHỤC
// =====================================

function createRestoreObject(
    key,
    item
){

    const className =
        BACKUP_CLASSES[key];


    const object =
        new Parse.Object(
            className
        );


    const logicalId =
        getBackupLogicalId(
            item
        );


    if(logicalId){

        object.set(
            "legacyId",
            logicalId
        );

    }


    switch(key){

        case "suppliers":

            object.set(
                "ten",
                String(
                    item.ten || ""
                ).trim()
            );

            object.set(
                "tenNormalized",
                normalizeBackupText(
                    item.ten
                )
            );

            object.set(
                "diachi",
                String(
                    item.diachi || ""
                )
            );

            object.set(
                "nguoinhan",
                String(
                    item.nguoinhan || ""
                )
            );

            object.set(
                "sdt",
                String(
                    item.sdt || ""
                )
            );

            break;


        case "projects":

            object.set(
                "ten",
                String(
                    item.ten || ""
                ).trim()
            );

            object.set(
                "tenNormalized",
                normalizeBackupText(
                    item.ten
                )
            );

            object.set(
                "diachi",
                String(
                    item.diachi || ""
                )
            );

            break;


        case "dossiers":

            object.set(
                "code",
                String(
                    item.code || ""
                ).trim()
            );

            object.set(
                "codeNormalized",
                normalizeBackupText(
                    item.code
                )
            );

            object.set(
                "projectId",
                String(
                    item.projectId || ""
                )
            );

            object.set(
                "content",
                String(
                    item.content || ""
                )
            );

            object.set(
                "supplierId",
                String(
                    item.supplierId || ""
                )
            );

            object.set(
                "value",
                Number(
                    item.value || 0
                )
            );

            object.set(
                "documents",
                String(

                    item.documents

                    ||

                    item.additionalDocuments

                    ||

                    ""

                )
            );

            object.set(
                "fileStatus",
                String(
                    item.fileStatus ||
                    "Chưa up"
                )
            );

            object.set(
                "paymentRequest",
                Boolean(
                    item.paymentRequest
                )
            );

            object.set(
                "deliveryDate",
                String(
                    item.deliveryDate || ""
                )
            );

            object.set(
                "paymentStatus",
                String(
                    item.paymentStatus ||
                    "Chưa thanh toán"
                )
            );

            object.set(
                "status",
                String(

                    item.status

                    ||

                    item.dossierStatus

                    ||

                    "Chưa duyệt"

                )
            );

            break;


        case "letters":

            object.set(
                "type",
                String(
                    item.type || "Nhận"
                )
            );

            object.set(
                "date",
                String(
                    item.date || ""
                )
            );

            object.set(
                "number",
                String(
                    item.number || ""
                ).trim()
            );

            object.set(
                "numberNormalized",
                normalizeBackupText(
                    item.number
                )
            );

            object.set(
                "supplierId",
                String(
                    item.supplierId || ""
                )
            );

            object.set(
                "channel",
                String(
                    item.channel ||
                    "Bưu điện"
                )
            );

            object.set(
                "contact",
                String(
                    item.contact || ""
                )
            );

            object.set(
                "subject",
                String(
                    item.subject || ""
                )
            );

            object.set(
                "note",
                String(
                    item.note || ""
                )
            );

            break;


        case "archiveDossiers":

            object.set(
                "type",
                String(
                    item.type || ""
                )
            );

            object.set(
                "code",
                String(
                    item.code || ""
                ).trim()
            );

            object.set(
                "codeNormalized",
                normalizeBackupText(
                    item.code
                )
            );

            object.set(
                "name",
                String(
                    item.name || ""
                )
            );

            object.set(
                "linkedDossierId",
                String(
                    item.linkedDossierId || ""
                )
            );

            object.set(
                "projectId",
                String(
                    item.projectId || ""
                )
            );

            object.set(
                "supplierId",
                String(
                    item.supplierId || ""
                )
            );

            object.set(
                "archiveDate",
                String(
                    item.archiveDate || ""
                )
            );

            object.set(
                "location",
                String(
                    item.location || ""
                )
            );

            object.set(
                "quantity",
                Math.max(
                    1,
                    Number(
                        item.quantity || 1
                    )
                )
            );

            object.set(
                "note",
                String(
                    item.note || ""
                )
            );

            break;

    }


    const currentUser =
        Parse.User.current();


    if(currentUser){

        object.set(
            "createdBy",
            currentUser
        );


        object.set(
            "updatedBy",
            currentUser
        );

    }


    return object;

}


// =====================================
// KHÔI PHỤC MỘT NHÓM
// =====================================

async function restoreBackupGroup(
    key,
    items
){

    const batchSize =
        20;


    for(
        let index = 0;
        index < items.length;
        index += batchSize
    ){

        const batchItems =
            items.slice(
                index,
                index + batchSize
            );


        const objects =
            batchItems.map(

                item =>

                    createRestoreObject(
                        key,
                        item
                    )

            );


        await Parse.Object.saveAll(
            objects
        );

    }

}


// =====================================
// CẬP NHẬT CACHE SAU KHÔI PHỤC
// =====================================

function updateBackupLocalCache(data){

    BACKUP_KEYS.forEach(key => {

        const items =
            Array.isArray(
                data[key]
            )

            ? data[key]

            : [];


        const normalizedItems =
            items.map(item => ({

                ...item,

                id:
                    getBackupLogicalId(
                        item
                    )

            }));


        localStorage.setItem(

            key,

            JSON.stringify(
                normalizedItems
            )

        );

    });


    const migrationReport =
        JSON.stringify({

            completedAt:
                new Date()
                .toISOString(),

            restoredFromBackup:
                true

        });


    BACKUP_MIGRATION_KEYS
    .forEach(key => {

        localStorage.setItem(
            key,
            migrationReport
        );

    });

}


// =====================================
// KHÔI PHỤC BACK4APP
// =====================================

async function restoreAppBackup(){

    if(!pendingBackupData){

        alert(
            "Vui lòng chọn một file sao lưu hợp lệ."
        );

        return;

    }


    const validation =
        validateBackupObject(
            pendingBackupData
        );


    if(!validation.valid){

        alert(
            validation.message
        );

        return;

    }


    const confirmed =
        confirm(

            "Toàn bộ dữ liệu hiện tại trên Back4App sẽ được thay bằng dữ liệu trong file.\n\n"

            +

            "Hệ thống sẽ tự tải một bản sao lưu hiện tại trước khi thực hiện.\n\n"

            +

            "Bạn có chắc chắn muốn tiếp tục?"

        );


    if(!confirmed){

        return;

    }


    const confirmationText =
        prompt(

            'Nhập chính xác "KHOI PHUC" để xác nhận:'

        );


    if(
        confirmationText !==
        "KHOI PHUC"
    ){

        alert(
            "Đã hủy khôi phục dữ liệu."
        );

        return;

    }


    setBackupBusy(
        true,
        "restore"
    );


    try{

        ensureBackupBack4AppReady();


        setBackupProgress(
            "Đang tạo bản sao lưu an toàn trước khi khôi phục..."
        );


        const currentBackup =
            await createBackupObject();


        downloadBackupObject(

            currentBackup,

            createBackupFileName(
                "TRUOC_KHI_KHOI_PHUC"
            )

        );


        const deleteOrder = [

            "ArchiveDossier",

            "Letter",

            "Dossier",

            "Project",

            "Supplier"

        ];


        for(
            const className
            of deleteOrder
        ){

            setBackupProgress(
                `Đang xóa dữ liệu cũ: ${className}...`
            );


            await deleteBackupClassData(
                className
            );

        }


        const restoreOrder = [

            "suppliers",

            "projects",

            "dossiers",

            "letters",

            "archiveDossiers"

        ];


        for(
            const key
            of restoreOrder
        ){

            const items =
                Array.isArray(
                    pendingBackupData
                    .data[key]
                )

                ? pendingBackupData
                    .data[key]

                : [];


            setBackupProgress(

                `Đang khôi phục ${key}: ${items.length} dòng...`

            );


            await restoreBackupGroup(
                key,
                items
            );

        }


        updateBackupLocalCache(
            pendingBackupData.data
        );


        setBackupPreview(`

            <div class="backup-preview-success">

                <h3>
                    Khôi phục thành công
                </h3>

                <p>
                    Trang sẽ được tải lại.
                </p>

            </div>

        `);


        alert(

            "Khôi phục dữ liệu thành công. Trang sẽ được tải lại."

        );


        window.location.reload();

    }catch(error){

        console.error(
            "Khôi phục dữ liệu thất bại:",
            error
        );


        setBackupPreview(`

            <div class="backup-preview-error">

                <strong>
                    Khôi phục chưa hoàn tất
                </strong>

                <p>
                    ${escapeBackupHtml(
                        error.message ||
                        error
                    )}
                </p>

                <p>
                    Hãy giữ file TRUOC_KHI_KHOI_PHUC vừa được tải xuống.
                </p>

            </div>

        `);


        alert(

            "Khôi phục dữ liệu thất bại.\n\n"

            +

            "Hãy giữ file TRUOC_KHI_KHOI_PHUC vừa được tải xuống.\n\n"

            +

            (
                error.message ||
                error
            )

        );

    }finally{

        setBackupBusy(false);

    }

}


// =====================================
// BỎ FILE ĐÃ CHỌN
// =====================================

function clearBackupSelection(){

    pendingBackupData =
        null;


    const fileInput =
        getBackupElement(
            "backupFileInput"
        );


    const restoreButton =
        getBackupElement(
            "restoreBackupButton"
        );


    if(fileInput){

        fileInput.value =
            "";

    }


    setBackupPreview(`

        <p class="backup-preview-empty">

            Chưa chọn file sao lưu.

        </p>

    `);


    if(restoreButton){

        restoreButton.disabled =
            true;

    }

}


// =====================================
// ĐƯA HÀM RA WINDOW
// =====================================

window.exportAppBackup =
    exportAppBackup;

window.initializeBackupPage =
    initializeBackupPage;

window.previewBackupFile =
    previewBackupFile;

window.restoreAppBackup =
    restoreAppBackup;

window.clearBackupSelection =
    clearBackupSelection;

window.createBackupObject =
    createBackupObject;

window.updateBackupSummary =
    updateBackupSummary;
