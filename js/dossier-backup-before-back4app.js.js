let dossiers = [];

let editDossierIndex = null;
// =========================
// Mở form
// =========================
function openDossierForm(){

    loadProject();

    loadSupplier();

    loadProjectSelect();

    loadSupplierSelect();

    document.getElementById("dossierForm").style.display = "block";

}

// =========================
// Đóng form
// =========================
function closeDossierForm() {

    document.getElementById("dossierForm").style.display = "none";

}

// =========================
// Lưu hồ sơ
// =========================
function saveDossier(){


console.log("BẮT ĐẦU LƯU");

const documents =
document.getElementById("additionalDocuments").value;

const dossier={

id:Date.now(),

code:
document.getElementById("dossierCode").value,

projectId:
Number(
document.getElementById("dossierProject").value
),

content:
document.getElementById("dossierContent").value,

supplierId:
Number(
document.getElementById("dossierSupplier").value
),

value:
document.getElementById("dossierValue").value,

documents:
documents,

fileStatus:
document.getElementById("fileStatus").value,

paymentRequest:
document.getElementById("paymentRequest").checked,

deliveryDate:
document.getElementById("deliveryDate").value,

paymentStatus:
document.getElementById("paymentStatus").value,

status:
document.getElementById("dossierStatus").value || "Chưa duyệt",

};

console.log("DỮ LIỆU LƯU:", dossier);

if(editDossierIndex !== null){

    dossiers[editDossierIndex] = dossier;

    editDossierIndex = null;

}
else{

    dossiers.push(dossier);

}

localStorage.setItem(

"dossiers",

JSON.stringify(dossiers)

);



console.log(
"LOCAL:",
localStorage.getItem("dossiers")
);



renderDossier();


closeDossierForm();


}

function loadDossier(){

    const data = localStorage.getItem("dossiers");

    if(data){

        dossiers = JSON.parse(data);

    }

}
function renderDossier(data = dossiers){


    const table =
    document.getElementById("dossierTable");


    if(!table) return;


    table.innerHTML="";


   data.forEach((item,index)=>{


        const project =
        projects.find(
            p=>p.id == item.projectId
        );


        const supplier =
        suppliers.find(
            s=>s.id == item.supplierId
        );

table.innerHTML += `

<tr>

<td>
${item.code || ""}
</td>


<td>
${project ? project.ten : ""}
</td>


<td>
${item.content || ""}
</td>


<td>
${supplier ? supplier.ten : ""}
</td>


<td>
${Number(item.value || 0).toLocaleString("vi-VN")} đ
</td>


<td>
${item.documents || ""}
</td>


<td>
${item.fileStatus || "Chưa up"}
</td>


<td>
${item.status || "Chưa duyệt"}
</td>


<td>
${item.paymentRequest ? "✓" : ""}
</td>


<td>
${
item.deliveryDate
?
item.deliveryDate
:
"Chưa bàn giao"
}
</td>


<td>
${item.paymentStatus || "Chưa thanh toán"}
</td>


<td>

<button onclick="editDossier(${index})">
✏️
</button>


<button onclick="deleteDossier(${index})">
🗑
</button>

</td>


</tr>

`;

    });

}
function deleteDossier(index){

    dossiers.splice(index,1);

    localStorage.setItem(
        "dossiers",
        JSON.stringify(dossiers)
    );

    renderDossier();

}

function editDossier(index){


    const item = dossiers[index];


    editDossierIndex = index;



    document.getElementById("dossierCode").value =
    item.code || "";



    document.getElementById("dossierProject").value =
    item.projectId || "";



    document.getElementById("dossierContent").value =
    item.content || "";



    document.getElementById("dossierSupplier").value =
    item.supplierId || "";



    document.getElementById("dossierValue").value =
    item.value || "";



    // Bổ sung hồ sơ nhập tay

    document.getElementById("additionalDocuments").value =
    item.documents || "";



    // File hồ sơ

    document.getElementById("fileStatus").value =
    item.fileStatus || "Chưa up";



    // Xuất ĐNTT

    document.getElementById("paymentRequest").checked =
    item.paymentRequest || false;



    // Ngày bàn giao

    document.getElementById("deliveryDate").value =
    item.deliveryDate || "";

// Trạng thái hồ sơ

document.getElementById("dossierStatus").value =
item.status || "Chưa duyệt";


    // Trạng thái thanh toán
    document.getElementById("paymentStatus").value =
    item.paymentStatus || "Chưa thanh toán";



    document.getElementById("dossierForm")
    .style.display="block";


}

function filterDossier(){

    const keyword =
        document.getElementById("searchDossier")
        ?.value
        .trim()
        .toLowerCase() || "";


    const statusFilter =
        document.getElementById("filterStatus")
        ?.value || "";


    const paymentFilter =
        document.getElementById("filterPayment")
        ?.value || "";


    const deliveryFilter =
        document.getElementById("filterDelivery")
        ?.value || "";


    const fileFilter =
        document.getElementById("filterFile")
        ?.value || "";


    const filtered = dossiers.filter(item => {

        const project =
            projects.find(

                projectItem =>

                    String(projectItem.id) ===
                    String(item.projectId)

            );


        const supplier =
            suppliers.find(

                supplierItem =>

                    String(supplierItem.id) ===
                    String(item.supplierId)

            );


        const projectName =
            project
            ? project.ten || ""
            : "";


        const supplierName =
            supplier
            ? supplier.ten || ""
            : "";


        const searchText = `

            ${item.code || ""}

            ${item.content || ""}

            ${projectName}

            ${supplierName}

        `.toLowerCase();


        const matchKeyword =
            searchText.includes(keyword);


        const itemStatus =
            item.status ||
            item.dossierStatus ||
            "Chưa duyệt";


        const matchStatus =

            statusFilter === ""

            ||

            itemStatus === statusFilter;


        const itemPayment =
            item.paymentStatus ||
            "Chưa thanh toán";


        const matchPayment =

            paymentFilter === ""

            ||

            itemPayment === paymentFilter;


        const hasDeliveryDate =

            String(
                item.deliveryDate || ""
            ).trim() !== "";


        let matchDelivery = true;


        if(deliveryFilter === "done"){

            matchDelivery =
                hasDeliveryDate;

        }


        if(deliveryFilter === "not"){

            matchDelivery =
                !hasDeliveryDate;

        }


        const itemFileStatus =
            item.fileStatus || "Chưa up";


        const matchFile =

            fileFilter === ""

            ||

            itemFileStatus === fileFilter;


        return (

            matchKeyword

            && matchStatus

            && matchPayment

            && matchDelivery

            && matchFile

        );

    });


    renderDossier(filtered);

}
document.addEventListener(
"input",
function(e){


    if(e.target.id=="searchDossier"){

        filterDossier();

    }


});
document.addEventListener(
    "change",
    function(event){

        if(
            event.target.id === "filterStatus"

            ||

            event.target.id === "filterPayment"

            ||

            event.target.id === "filterDelivery"

            ||

            event.target.id === "filterFile"
        ){

            filterDossier();

        }

    }
);
// =========================
// HỒ SƠ CẦN BỔ SUNG
// =========================

// =====================================
// CHUẨN HÓA CHỮ TÌM KIẾM
// =====================================

function normalizeMissingText(value){

    return String(value || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


// =====================================
// CHỐNG KÝ TỰ HTML
// =====================================

function escapeMissingHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// =====================================
// ĐỊNH DẠNG NGÀY
// =====================================

function formatMissingDate(date){

    if(!date){

        return "Chưa bàn giao";

    }


    const parts =
        String(date).split("-");


    if(parts.length !== 3){

        return date;

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}

// =====================================
// HỖ TRỢ TRANG HỒ SƠ ĐÃ BÀN GIAO
// =====================================

function normalizeDeliveryText(value){

    return String(value || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


// =====================================
// CHỐNG KÝ TỰ HTML
// =====================================

function escapeDeliveryHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// =====================================
// LẤY NỘI DUNG BỔ SUNG HỒ SƠ
// Hỗ trợ cả dữ liệu cũ và dữ liệu mới
// =====================================

function getDeliveryDocumentText(item){

    return String(

        item.documents

        ||

        item.additionalDocuments

        ||

        ""

    ).trim();

}


// =====================================
// ĐỊNH DẠNG NGÀY
// =====================================

function formatDeliveryDate(date){

    if(!date){

        return "";

    }


    const parts =
        String(date).split("-");


    if(parts.length !== 3){

        return String(date);

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// =====================================
// LOAD DỰ ÁN VÀ NCC VÀO BỘ LỌC
// =====================================

function loadDeliveryDossierFilters(){

    const projectFilter =
        document.getElementById(
            "deliveryProjectFilter"
        );

    const supplierFilter =
        document.getElementById(
            "deliverySupplierFilter"
        );


    // LOAD DỰ ÁN
    if(projectFilter){

        const currentProjectValue =
            projectFilter.value;


        projectFilter.innerHTML = `

            <option value="">
                Tất cả dự án
            </option>

        `;


        [...projects]

        .sort((a, b) =>

            String(a.ten || "")
            .localeCompare(
                String(b.ten || ""),
                "vi"
            )

        )

        .forEach(project => {

            projectFilter.innerHTML += `

                <option value="${project.id}">

                    ${escapeDeliveryHtml(
                        project.ten || ""
                    )}

                </option>

            `;

        });


        projectFilter.value =
            currentProjectValue;

    }


    // LOAD NHÀ CUNG CẤP
    if(supplierFilter){

        const currentSupplierValue =
            supplierFilter.value;


        supplierFilter.innerHTML = `

            <option value="">
                Tất cả nhà cung cấp
            </option>

        `;


        [...suppliers]

        .sort((a, b) =>

            String(a.ten || "")
            .localeCompare(
                String(b.ten || ""),
                "vi"
            )

        )

        .forEach(supplier => {

            supplierFilter.innerHTML += `

                <option value="${supplier.id}">

                    ${escapeDeliveryHtml(
                        supplier.ten || ""
                    )}

                </option>

            `;

        });


        supplierFilter.value =
            currentSupplierValue;

    }

}


// =====================================
// LỌC HỒ SƠ ĐÃ BÀN GIAO
// =====================================

function filterDeliveryDossier(){

    const keyword =
        normalizeDeliveryText(

            document.getElementById(
                "deliverySearch"
            )?.value || ""

        );


    const projectId =
        document.getElementById(
            "deliveryProjectFilter"
        )?.value || "";


    const supplierId =
        document.getElementById(
            "deliverySupplierFilter"
        )?.value || "";


    const paymentFilter =
        document.getElementById(
            "deliveryPaymentFilter"
        )?.value || "";


    const dateFrom =
        document.getElementById(
            "deliveryDateFrom"
        )?.value || "";


    const dateTo =
        document.getElementById(
            "deliveryDateTo"
        )?.value || "";


    // KIỂM TRA NGÀY
    if(
        dateFrom !== ""
        &&
        dateTo !== ""
        &&
        dateFrom > dateTo
    ){

        const table =
            document.getElementById(
                "deliveryTable"
            );


        if(table){

            table.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="delivery-empty-row"
                    >
                        Từ ngày không được lớn hơn Đến ngày
                    </td>

                </tr>

            `;

        }


        const resultCount =
            document.getElementById(
                "deliveryResultCount"
            );


        if(resultCount){

            resultCount.textContent =
                "0 hồ sơ";

        }


        return;

    }


    const filteredData =
        dossiers.filter(item => {


            // CHỈ LẤY HỒ SƠ ĐÃ CÓ NGÀY BÀN GIAO
            const deliveryDate =
                String(
                    item.deliveryDate || ""
                ).trim();


            if(deliveryDate === ""){

                return false;

            }


            const project =
                projects.find(

                    projectItem =>

                        String(projectItem.id) ===
                        String(item.projectId)

                );


            const supplier =
                suppliers.find(

                    supplierItem =>

                        String(supplierItem.id) ===
                        String(item.supplierId)

                );


            const projectName =

                project

                ? project.ten || ""

                : "";


            const supplierName =

                supplier

                ? supplier.ten || ""

                : "";


            const documents =
                getDeliveryDocumentText(item);


            const searchText =
                normalizeDeliveryText(`

                    ${item.code || ""}

                    ${item.content || ""}

                    ${documents}

                    ${projectName}

                    ${supplierName}

                `);


            const matchKeyword =

                searchText.includes(
                    keyword
                );


            const matchProject =

                projectId === ""

                ||

                String(item.projectId) ===
                String(projectId);


            const matchSupplier =

                supplierId === ""

                ||

                String(item.supplierId) ===
                String(supplierId);


            const itemPaymentStatus =

                item.paymentStatus

                ||

                "Chưa thanh toán";


            const matchPayment =

                paymentFilter === ""

                ||

                itemPaymentStatus ===
                paymentFilter;


            const matchDateFrom =

                dateFrom === ""

                ||

                deliveryDate >= dateFrom;


            const matchDateTo =

                dateTo === ""

                ||

                deliveryDate <= dateTo;


            return (

                matchKeyword

                &&

                matchProject

                &&

                matchSupplier

                &&

                matchPayment

                &&

                matchDateFrom

                &&

                matchDateTo

            );

        });


    // SẮP XẾP NGÀY BÀN GIAO MỚI NHẤT TRƯỚC
    filteredData.sort(

        (a, b) =>

            String(b.deliveryDate || "")
            .localeCompare(
                String(a.deliveryDate || "")
            )

    );


    renderDeliveryDossier(
        filteredData
    );

}


// =====================================
// HIỂN THỊ HỒ SƠ ĐÃ BÀN GIAO
// =====================================

function renderDeliveryDossier(data){

    const table =
        document.getElementById(
            "deliveryTable"
        );


    if(!table){

        return;

    }


    const deliveredDossiers =

        Array.isArray(data)

        ? data

        : dossiers.filter(item =>

            String(
                item.deliveryDate || ""
            ).trim() !== ""

        );


    const resultCount =
        document.getElementById(
            "deliveryResultCount"
        );


    if(resultCount){

        resultCount.textContent =

            `${deliveredDossiers.length} hồ sơ`;

    }


    table.innerHTML = "";


    if(deliveredDossiers.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="delivery-empty-row"
                >
                    Chưa có hồ sơ đã bàn giao phù hợp
                </td>

            </tr>

        `;

        return;

    }


    deliveredDossiers.forEach(item => {

        const project =
            projects.find(

                projectItem =>

                    String(projectItem.id) ===
                    String(item.projectId)

            );


        const supplier =
            suppliers.find(

                supplierItem =>

                    String(supplierItem.id) ===
                    String(item.supplierId)

            );


        const projectName =

            project

            ? project.ten || ""

            : "Dự án đã xóa";


        const supplierName =

            supplier

            ? supplier.ten || ""

            : "Nhà cung cấp đã xóa";


        const documents =
            getDeliveryDocumentText(item);


        const paymentStatus =

            item.paymentStatus

            ||

            "Chưa thanh toán";


        table.innerHTML += `

            <tr>

                <td>

                    ${escapeDeliveryHtml(
                        item.code || "—"
                    )}

                </td>


                <td>

                    ${escapeDeliveryHtml(
                        projectName
                    )}

                </td>


                <td>

                    ${escapeDeliveryHtml(
                        item.content || "—"
                    )}

                </td>


                <td>

                    ${escapeDeliveryHtml(
                        supplierName
                    )}

                </td>


                <td>

                    ${Number(
                        item.value || 0
                    ).toLocaleString("vi-VN")} đ

                </td>


                <td>

                    ${escapeDeliveryHtml(
                        documents || "—"
                    )}

                </td>


                <td>

                    ${escapeDeliveryHtml(
                        formatDeliveryDate(
                            item.deliveryDate
                        )
                    )}

                </td>


                <td>

                    ${escapeDeliveryHtml(
                        paymentStatus
                    )}

                </td>

            </tr>

        `;

    });

}


// =====================================
// XÓA BỘ LỌC BÀN GIAO
// =====================================

function resetDeliveryDossierFilters(){

    const search =
        document.getElementById(
            "deliverySearch"
        );

    const project =
        document.getElementById(
            "deliveryProjectFilter"
        );

    const supplier =
        document.getElementById(
            "deliverySupplierFilter"
        );

    const payment =
        document.getElementById(
            "deliveryPaymentFilter"
        );

    const dateFrom =
        document.getElementById(
            "deliveryDateFrom"
        );

    const dateTo =
        document.getElementById(
            "deliveryDateTo"
        );


    if(search){
        search.value = "";
    }

    if(project){
        project.value = "";
    }

    if(supplier){
        supplier.value = "";
    }

    if(payment){
        payment.value = "";
    }

    if(dateFrom){
        dateFrom.value = "";
    }

    if(dateTo){
        dateTo.value = "";
    }


    filterDeliveryDossier();

}
// =====================================
// HỖ TRỢ TRANG ĐÃ THANH TOÁN
// =====================================

function normalizePaidText(value){

    return String(value || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


function escapePaidHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


function getPaidDocumentText(item){

    return String(

        item.documents

        ||

        item.additionalDocuments

        ||

        ""

    ).trim();

}


function formatPaidDeliveryDate(date){

    if(!date){

        return "Chưa bàn giao";

    }


    const parts =
        String(date).split("-");


    if(parts.length !== 3){

        return String(date);

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// =====================================
// LOAD DỰ ÁN VÀ NCC VÀO BỘ LỌC
// =====================================
// =====================================
// LOAD DỰ ÁN VÀ NCC VÀO BỘ LỌC
// TRANG ĐÃ THANH TOÁN
// =====================================

function loadPaidDossierFilters(){

    const projectFilter =
        document.getElementById(
            "paidProjectFilter"
        );

    const supplierFilter =
        document.getElementById(
            "paidSupplierFilter"
        );


    // -----------------------------
    // LOAD DỰ ÁN
    // -----------------------------

    if(projectFilter){

        projectFilter.innerHTML = `

            <option value="">
                Tất cả dự án
            </option>

        `;


        projects.forEach(project => {

            const option =
                document.createElement("option");

            option.value =
                String(project.id);

            option.textContent =
                project.ten ||
                project.name ||
                "Dự án không có tên";

            projectFilter.appendChild(option);

        });

    }


    // -----------------------------
    // LOAD NHÀ CUNG CẤP
    // -----------------------------

    if(supplierFilter){

        supplierFilter.innerHTML = `

            <option value="">
                Tất cả nhà cung cấp
            </option>

        `;


        suppliers.forEach(supplier => {

            const option =
                document.createElement("option");

            option.value =
                String(supplier.id);

            option.textContent =
                supplier.ten ||
                supplier.name ||
                "Nhà cung cấp không có tên";

            supplierFilter.appendChild(option);

        });

    }

}

// =====================================
// LỌC HỒ SƠ ĐÃ THANH TOÁN
// =====================================
// =====================================
// LỌC HỒ SƠ ĐÃ THANH TOÁN
// =====================================

function filterPaidDossier(){

    const keyword =
        String(
            document.getElementById(
                "paidSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const selectedProjectId =
        String(
            document.getElementById(
                "paidProjectFilter"
            )?.value || ""
        );


    const selectedSupplierId =
        String(
            document.getElementById(
                "paidSupplierFilter"
            )?.value || ""
        );


    const deliveryFilter =
        document.getElementById(
            "paidDeliveryFilter"
        )?.value || "";


    const fileFilter =
        document.getElementById(
            "paidFileFilter"
        )?.value || "";


    const filteredData =
        dossiers.filter(item => {


            // Chỉ lấy hồ sơ đã thanh toán
            const paymentStatus =
                String(
                    item.paymentStatus || ""
                ).trim();


            if(paymentStatus !== "Đã thanh toán"){

                return false;

            }


            // Hỗ trợ dữ liệu mới và dữ liệu cũ
            const itemProjectId =
                String(
                    item.projectId ||
                    item.project ||
                    ""
                );


            const itemSupplierId =
                String(
                    item.supplierId ||
                    item.supplier ||
                    ""
                );


            const project =
                projects.find(projectItem =>

                    String(projectItem.id) ===
                    itemProjectId

                );


            const supplier =
                suppliers.find(supplierItem =>

                    String(supplierItem.id) ===
                    itemSupplierId

                );


            const projectName =
                project
                    ? project.ten || project.name || ""
                    : "";


            const supplierName =
                supplier
                    ? supplier.ten || supplier.name || ""
                    : "";


            const searchText = `

                ${item.code || ""}

                ${item.content || ""}

                ${projectName}

                ${supplierName}

            `
            .toLowerCase();


            const matchKeyword =
                searchText.includes(keyword);


            const matchProject =

                selectedProjectId === ""

                ||

                itemProjectId ===
                selectedProjectId;


            const matchSupplier =

                selectedSupplierId === ""

                ||

                itemSupplierId ===
                selectedSupplierId;


            const hasDeliveryDate =
                String(
                    item.deliveryDate || ""
                ).trim() !== "";


            let matchDelivery = true;


            if(deliveryFilter === "done"){

                matchDelivery =
                    hasDeliveryDate;

            }


            if(deliveryFilter === "not"){

                matchDelivery =
                    !hasDeliveryDate;

            }


            const itemFileStatus =
                item.fileStatus ||
                "Chưa up";


            const matchFile =

                fileFilter === ""

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


    renderPaidDossier(
        filteredData
    );

}

// =====================================
// HIỂN THỊ HỒ SƠ ĐÃ THANH TOÁN
// =====================================

function renderPaidDossier(data){

    const table =
        document.getElementById(
            "paidTable"
        );


    if(!table){

        return;

    }


    const paidDossiers =

        Array.isArray(data)

        ? data

        : dossiers.filter(item =>

            String(
                item.paymentStatus || ""
            ).trim() === "Đã thanh toán"

        );


    const resultCount =
        document.getElementById(
            "paidResultCount"
        );


    if(resultCount){

        resultCount.textContent =

            `${paidDossiers.length} hồ sơ`;

    }


    table.innerHTML = "";


    if(paidDossiers.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="paid-empty-row"
                >
                    Chưa có hồ sơ đã thanh toán phù hợp
                </td>

            </tr>

        `;

        return;

    }


    paidDossiers.forEach(item => {

        const project =
            projects.find(

                projectItem =>

                    String(projectItem.id) ===
                    String(item.projectId)

            );


        const supplier =
            suppliers.find(

                supplierItem =>

                    String(supplierItem.id) ===
                    String(item.supplierId)

            );


        const projectName =

            project

            ? project.ten || ""

            : "Dự án đã xóa";


        const supplierName =

            supplier

            ? supplier.ten || ""

            : "Nhà cung cấp đã xóa";


        const documents =
            getPaidDocumentText(item);


        const deliveryDate =
            formatPaidDeliveryDate(
                item.deliveryDate
            );


        table.innerHTML += `

            <tr>

                <td>

                    ${escapePaidHtml(
                        item.code || "—"
                    )}

                </td>


                <td>

                    ${escapePaidHtml(
                        projectName
                    )}

                </td>


                <td>

                    ${escapePaidHtml(
                        item.content || "—"
                    )}

                </td>


                <td>

                    ${escapePaidHtml(
                        supplierName
                    )}

                </td>


                <td>

                    ${Number(
                        item.value || 0
                    ).toLocaleString("vi-VN")} đ

                </td>


                <td>

                    ${escapePaidHtml(
                        documents || "—"
                    )}

                </td>


                <td>

                    ${escapePaidHtml(
                        deliveryDate
                    )}

                </td>


                <td>
                    Đã thanh toán
                </td>

            </tr>

        `;

    });

}


// =====================================
// XÓA BỘ LỌC
// =====================================

function resetPaidDossierFilters(){

    const search =
        document.getElementById(
            "paidSearch"
        );

    const project =
        document.getElementById(
            "paidProjectFilter"
        );

    const supplier =
        document.getElementById(
            "paidSupplierFilter"
        );

    const delivery =
        document.getElementById(
            "paidDeliveryFilter"
        );

    const file =
        document.getElementById(
            "paidFileFilter"
        );


    if(search){
        search.value = "";
    }

    if(project){
        project.value = "";
    }

    if(supplier){
        supplier.value = "";
    }

    if(delivery){
        delivery.value = "";
    }

    if(file){
        file.value = "";
    }


    filterPaidDossier();

}
// =====================================
// HỖ TRỢ TRANG HỒ SƠ CẦN BỔ SUNG
// =====================================

function normalizeMissingText(value){

    return String(value || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


function escapeMissingHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// Hỗ trợ cả dữ liệu cũ và dữ liệu mới
function getMissingDocumentText(item){

    return String(

        item.documents

        ||

        item.additionalDocuments

        ||

        ""

    ).trim();

}


function formatMissingDeliveryDate(date){

    if(!date){

        return "Chưa bàn giao";

    }


    const parts =
        String(date).split("-");


    if(parts.length !== 3){

        return String(date);

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// =====================================
// LOAD DỰ ÁN VÀ NCC VÀO BỘ LỌC
// =====================================

function loadMissingDossierFilters(){

    const projectFilter =
        document.getElementById(
            "missingProjectFilter"
        );

    const supplierFilter =
        document.getElementById(
            "missingSupplierFilter"
        );


    // Load dự án
    if(projectFilter){

        projectFilter.innerHTML = `

            <option value="">
                Tất cả dự án
            </option>

        `;


        [...projects]

        .sort((a, b) =>

            String(a.ten || "")
            .localeCompare(
                String(b.ten || ""),
                "vi"
            )

        )

        .forEach(project => {

            const option =
                document.createElement("option");

            option.value =
                String(project.id);

            option.textContent =
                project.ten ||
                "Dự án không có tên";

            projectFilter.appendChild(option);

        });

    }


    // Load Nhà cung cấp
    if(supplierFilter){

        supplierFilter.innerHTML = `

            <option value="">
                Tất cả nhà cung cấp
            </option>

        `;


        [...suppliers]

        .sort((a, b) =>

            String(a.ten || "")
            .localeCompare(
                String(b.ten || ""),
                "vi"
            )

        )

        .forEach(supplier => {

            const option =
                document.createElement("option");

            option.value =
                String(supplier.id);

            option.textContent =
                supplier.ten ||
                "Nhà cung cấp không có tên";

            supplierFilter.appendChild(option);

        });

    }

}


// =====================================
// LỌC HỒ SƠ CẦN BỔ SUNG
// =====================================

function filterMissingDossier(){

    const keyword =
        normalizeMissingText(

            document.getElementById(
                "missingSearch"
            )?.value || ""

        );


    const selectedProjectId =
        String(

            document.getElementById(
                "missingProjectFilter"
            )?.value || ""

        );


    const selectedSupplierId =
        String(

            document.getElementById(
                "missingSupplierFilter"
            )?.value || ""

        );


    const deliveryFilter =
        document.getElementById(
            "missingDeliveryFilter"
        )?.value || "";


    const paymentFilter =
        document.getElementById(
            "missingPaymentFilter"
        )?.value || "";


    const filteredDossiers =
        dossiers.filter(item => {


            // Chỉ lấy hồ sơ có nội dung cần bổ sung
            const missingDocuments =
                getMissingDocumentText(item);


            if(missingDocuments === ""){

                return false;

            }


            const itemProjectId =
                String(
                    item.projectId || ""
                );


            const itemSupplierId =
                String(
                    item.supplierId || ""
                );


            const project =
                projects.find(

                    projectItem =>

                        String(projectItem.id) ===
                        itemProjectId

                );


            const supplier =
                suppliers.find(

                    supplierItem =>

                        String(supplierItem.id) ===
                        itemSupplierId

                );


            const projectName =

                project

                ? project.ten || ""

                : "";


            const supplierName =

                supplier

                ? supplier.ten || ""

                : "";


            const searchText =
                normalizeMissingText(`

                    ${item.code || ""}

                    ${item.content || ""}

                    ${missingDocuments}

                    ${projectName}

                    ${supplierName}

                `);


            const matchKeyword =

                searchText.includes(
                    keyword
                );


            const matchProject =

                selectedProjectId === ""

                ||

                itemProjectId ===
                selectedProjectId;


            const matchSupplier =

                selectedSupplierId === ""

                ||

                itemSupplierId ===
                selectedSupplierId;


            const hasDeliveryDate =

                String(
                    item.deliveryDate || ""
                ).trim() !== "";


            let matchDelivery = true;


            if(deliveryFilter === "done"){

                matchDelivery =
                    hasDeliveryDate;

            }


            if(deliveryFilter === "not"){

                matchDelivery =
                    !hasDeliveryDate;

            }


            const itemPaymentStatus =

                item.paymentStatus

                ||

                "Chưa thanh toán";


            const matchPayment =

                paymentFilter === ""

                ||

                itemPaymentStatus ===
                paymentFilter;


            return (

                matchKeyword

                &&

                matchProject

                &&

                matchSupplier

                &&

                matchDelivery

                &&

                matchPayment

            );

        });


    renderMissingDossier(
        filteredDossiers
    );

}


// =====================================
// HIỂN THỊ HỒ SƠ CẦN BỔ SUNG
// =====================================

function renderMissingDossier(data){

    const table =
        document.getElementById(
            "missingTable"
        );


    if(!table){

        return;

    }


    const missingDossiers =

        Array.isArray(data)

        ? data

        : dossiers.filter(item =>

            getMissingDocumentText(item) !== ""

        );


    const resultCount =
        document.getElementById(
            "missingResultCount"
        );


    if(resultCount){

        resultCount.textContent =

            `${missingDossiers.length} hồ sơ`;

    }


    table.innerHTML = "";


    if(missingDossiers.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="missing-empty-row"
                >
                    Không có hồ sơ cần bổ sung phù hợp
                </td>

            </tr>

        `;

        return;

    }


    missingDossiers.forEach(item => {

        const project =
            projects.find(

                projectItem =>

                    String(projectItem.id) ===
                    String(item.projectId)

            );


        const supplier =
            suppliers.find(

                supplierItem =>

                    String(supplierItem.id) ===
                    String(item.supplierId)

            );


        const projectName =

            project

            ? project.ten || ""

            : "Dự án đã xóa";


        const supplierName =

            supplier

            ? supplier.ten || ""

            : "Nhà cung cấp đã xóa";


        const missingDocuments =
            getMissingDocumentText(item);


        const deliveryDate =
            formatMissingDeliveryDate(
                item.deliveryDate
            );


        const paymentStatus =

            item.paymentStatus

            ||

            "Chưa thanh toán";


        table.innerHTML += `

            <tr>

                <td>
                    ${escapeMissingHtml(
                        item.code || "—"
                    )}
                </td>


                <td>
                    ${escapeMissingHtml(
                        projectName
                    )}
                </td>


                <td>
                    ${escapeMissingHtml(
                        item.content || "—"
                    )}
                </td>


                <td>
                    ${escapeMissingHtml(
                        supplierName
                    )}
                </td>


                <td>
                    ${Number(
                        item.value || 0
                    ).toLocaleString("vi-VN")} đ
                </td>


                <td>
                    ${escapeMissingHtml(
                        missingDocuments
                    )}
                </td>


                <td>
                    ${escapeMissingHtml(
                        deliveryDate
                    )}
                </td>


                <td>
                    ${escapeMissingHtml(
                        paymentStatus
                    )}
                </td>

            </tr>

        `;

    });

}


// =====================================
// XÓA BỘ LỌC
// =====================================

function resetMissingDossierFilters(){

    const search =
        document.getElementById(
            "missingSearch"
        );

    const project =
        document.getElementById(
            "missingProjectFilter"
        );

    const supplier =
        document.getElementById(
            "missingSupplierFilter"
        );

    const delivery =
        document.getElementById(
            "missingDeliveryFilter"
        );

    const payment =
        document.getElementById(
            "missingPaymentFilter"
        );


    if(search){
        search.value = "";
    }

    if(project){
        project.value = "";
    }

    if(supplier){
        supplier.value = "";
    }

    if(delivery){
        delivery.value = "";
    }

    if(payment){
        payment.value = "";
    }


    filterMissingDossier();

}
