// =====================================
// LETTER.JS
// Quản lý thư nhận / thư gửi
// =====================================

let letters = [];

let editLetterId = null;


// =====================================
// HÀM HỖ TRỢ LẤY PHẦN TỬ
// =====================================

function getLetterElement(id){

    return document.getElementById(id);

}


// =====================================
// HÀM LẤY GIÁ TRỊ
// =====================================

function getLetterValue(id, defaultValue = ""){

    const element = getLetterElement(id);

    if(!element){

        return defaultValue;

    }

    return element.value;

}


// =====================================
// HÀM GÁN GIÁ TRỊ
// =====================================

function setLetterValue(id, value){

    const element = getLetterElement(id);

    if(element){

        element.value = value ?? "";

    }

}


// =====================================
// LẤY DANH SÁCH NHÀ CUNG CẤP
// =====================================

function getSupplierList(){

    if(
        typeof suppliers !== "undefined"
        &&
        Array.isArray(suppliers)
    ){

        return suppliers;

    }

    return [];

}


// =====================================
// LẤY TÊN NHÀ CUNG CẤP
// =====================================

function getSupplierName(supplierId){

    const supplier = getSupplierList().find(

        item =>

            String(item.id) ===
            String(supplierId)

    );


    if(!supplier){

        return "Nhà cung cấp đã xóa";

    }


    return (

        supplier.ten

        ||

        supplier.name

        ||

        supplier.supplierName

        ||

        "Không có tên"

    );

}


// =====================================
// CHỐNG LỖI KÝ TỰ HTML
// =====================================

function escapeLetterHtml(value){

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// =====================================
// KHỞI TẠO TRANG
// =====================================

function initializeLetterPage(){

    loadLetters();

    loadLetterSupplierOptions();

    resetLetterForm();

    renderLetters();

}


// Cho phép app.js gọi hàm
window.initializeLetterPage =
    initializeLetterPage;


// =====================================
// ĐỌC DỮ LIỆU TỪ LOCALSTORAGE
// =====================================

function loadLetters(){

    try{

        const storedData =
            localStorage.getItem("letters");


        letters = storedData

            ? JSON.parse(storedData)

            : [];


        if(!Array.isArray(letters)){

            letters = [];

        }

    }catch(error){

        console.error(
            "Không đọc được dữ liệu thư:",
            error
        );

        letters = [];

    }

}


// =====================================
// LƯU DỮ LIỆU VÀO LOCALSTORAGE
// =====================================

function saveLettersToStorage(){

    localStorage.setItem(

        "letters",

        JSON.stringify(letters)

    );

}


// =====================================
// LOAD NHÀ CUNG CẤP VÀO DROPDOWN
// =====================================

function loadLetterSupplierOptions(){

    const supplierSelect =
        getLetterElement("letterSupplier");

    const supplierFilter =
        getLetterElement("letterSupplierFilter");

    const supplierList =
        getSupplierList();


    // Giữ lại lựa chọn đang lọc
    const currentFilterValue =
        supplierFilter
        ? supplierFilter.value
        : "";


    // Dropdown trong form
    if(supplierSelect){

        supplierSelect.innerHTML = `

            <option value="">
                -- Chọn nhà cung cấp --
            </option>

        `;


        supplierList.forEach(supplier => {

            const supplierName =

                supplier.ten

                ||

                supplier.name

                ||

                supplier.supplierName

                ||

                "Không có tên";


            supplierSelect.innerHTML += `

                <option value="${supplier.id}">

                    ${escapeLetterHtml(supplierName)}

                </option>

            `;

        });

    }


    // Dropdown bộ lọc
    if(supplierFilter){

        supplierFilter.innerHTML = `

            <option value="">
                Tất cả nhà cung cấp
            </option>

        `;


        supplierList.forEach(supplier => {

            const supplierName =

                supplier.ten

                ||

                supplier.name

                ||

                supplier.supplierName

                ||

                "Không có tên";


            supplierFilter.innerHTML += `

                <option value="${supplier.id}">

                    ${escapeLetterHtml(supplierName)}

                </option>

            `;

        });


        supplierFilter.value =
            currentFilterValue;

    }

}


// =====================================
// LÀM MỚI FORM
// =====================================

function resetLetterForm(){

    editLetterId = null;


    setLetterValue(
        "letterType",
        "Nhận"
    );


    setLetterValue(

        "letterDate",

        new Date()
            .toISOString()
            .split("T")[0]

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


// =====================================
// MỞ POPUP TẠO THƯ
// =====================================

window.openLetterModal = function(){

    const modal =
        getLetterElement("letterModal");


    if(!modal){

        alert(
            "Không tìm thấy form tạo thư."
        );

        console.error(
            "Không tìm thấy id letterModal."
        );

        return;

    }


    // Load lại Nhà cung cấp mới nhất
    loadLetterSupplierOptions();

    resetLetterForm();


    const title =
        getLetterElement("letterModalTitle");


    if(title){

        title.textContent =
            "Tạo thư mới";

    }


    modal.classList.add("show");

    modal.style.display = "flex";

    document.body.style.overflow =
        "hidden";

};


// =====================================
// ĐÓNG POPUP
// =====================================

window.closeLetterModal = function(){

    const modal =
        getLetterElement("letterModal");


    if(!modal){

        return;

    }


    modal.classList.remove("show");

    modal.style.display = "none";

    document.body.style.overflow = "";

};


// =====================================
// LƯU THƯ
// =====================================

window.saveLetter = function(){

    const type =
        getLetterValue(
            "letterType",
            "Nhận"
        );


    const date =
        getLetterValue(
            "letterDate"
        );


    const number =
        getLetterValue(
            "letterNumber"
        )
        .trim();


    const supplierId =
        getLetterValue(
            "letterSupplier"
        );


    const contact =
        getLetterValue(
            "letterContact"
        )
        .trim();


    const subject =
        getLetterValue(
            "letterSubject"
        )
        .trim();


    const note =
        getLetterValue(
            "letterNote"
        )
        .trim();


    // Chỉ sử dụng Bưu điện
    const channel =
        "Bưu điện";


    if(!date){

        alert(
            "Vui lòng chọn ngày nhận/gửi thư."
        );

        return;

    }


    if(!number){

        alert(
            "Vui lòng nhập số thư."
        );

        return;

    }


    if(!supplierId){

        alert(
            "Vui lòng chọn Nhà cung cấp."
        );

        return;

    }


    if(!subject){

        alert(
            "Vui lòng nhập nội dung thư."
        );

        return;

    }


    const letterData = {

        id:

            editLetterId !== null

            ? editLetterId

            : Date.now(),

        type: type,

        date: date,

        number: number,

        supplierId: supplierId,

        channel: channel,

        contact: contact,

        subject: subject,

        note: note

    };


    // Trường hợp sửa
    if(editLetterId !== null){

        const index = letters.findIndex(

            item =>

                String(item.id) ===
                String(editLetterId)

        );


        if(index !== -1){

            letters[index] =
                letterData;

        }else{

            letters.push(
                letterData
            );

        }

    }else{

        // Trường hợp tạo mới
        letters.push(
            letterData
        );

    }


    saveLettersToStorage();

    closeLetterModal();

    resetLetterForm();

    filterLetters();

    alert(
        "Đã lưu thông tin thư."
    );

};


// =====================================
// HIỂN THỊ DANH SÁCH THƯ
// =====================================

function renderLetters(data = letters){

    const table =
        getLetterElement("letterTable");


    if(!table){

        return;

    }


    table.innerHTML = "";


    if(data.length === 0){

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="letter-empty-row"
                >
                    Chưa có dữ liệu thư phù hợp
                </td>

            </tr>

        `;

        return;

    }


    data.forEach(item => {

        const supplierName =
            getSupplierName(
                item.supplierId
            );


        table.innerHTML += `

            <tr>

                <td>

                    ${escapeLetterHtml(
                        item.type || ""
                    )}

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


                <td class="letter-content-cell">

                    ${escapeLetterHtml(
                        item.subject || ""
                    )}

                </td>


                <td>

                    <div class="letter-table-actions">

                        <button
                            type="button"
                            class="letter-edit-button"
                            title="Chỉnh sửa"
                            onclick="editLetter('${item.id}')"
                        >
                            ✏️
                        </button>


                        <button
                            type="button"
                            class="letter-delete-button"
                            title="Xóa"
                            onclick="deleteLetter('${item.id}')"
                        >
                            🗑
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// =====================================
// CHỈNH SỬA THƯ
// =====================================

window.editLetter = function(id){

    const item = letters.find(

        letterItem =>

            String(letterItem.id) ===
            String(id)

    );


    if(!item){

        alert(
            "Không tìm thấy thông tin thư."
        );

        return;

    }


    const modal =
        getLetterElement("letterModal");


    if(!modal){

        alert(
            "Không tìm thấy form chỉnh sửa thư."
        );

        return;

    }


    loadLetterSupplierOptions();


    editLetterId =
        item.id;


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

        "letterSupplier",

        String(
            item.supplierId || ""
        )

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


    modal.classList.add("show");

    modal.style.display = "flex";

    document.body.style.overflow =
        "hidden";

};


// =====================================
// XÓA THƯ
// =====================================

window.deleteLetter = function(id){

    const confirmDelete = confirm(
        "Bạn có chắc chắn muốn xóa thư này?"
    );


    if(!confirmDelete){

        return;

    }


    letters = letters.filter(

        item =>

            String(item.id) !==
            String(id)

    );


    saveLettersToStorage();

    filterLetters();

};


// =====================================
// LỌC THƯ
// =====================================

window.filterLetters = function(){

    const keyword =
        getLetterValue(
            "letterSearch"
        )
        .trim()
        .toLowerCase();


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


    // Kiểm tra ngày bắt đầu và kết thúc
    if(
        dateFrom !== ""
        &&
        dateTo !== ""
        &&
        dateFrom > dateTo
    ){

        const table =
            getLetterElement(
                "letterTable"
            );


        if(table){

            table.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="letter-empty-row"
                    >
                        Từ ngày không được lớn hơn Đến ngày
                    </td>

                </tr>

            `;

        }

        return;

    }


    const filteredData =
        letters.filter(item => {


            const supplierName =
                getSupplierName(
                    item.supplierId
                );


            const searchText = `

                ${item.number || ""}

                ${item.subject || ""}

                ${item.contact || ""}

                ${item.note || ""}

                ${supplierName}

            `.toLowerCase();


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

                String(item.supplierId) ===
                String(supplierId);


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


    renderLetters(
        filteredData
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
        String(date).split("-");


    if(parts.length !== 3){

        return escapeLetterHtml(date);

    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}
