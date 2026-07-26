// =====================================
// TEST KẾT NỐI BACK4APP
// =====================================

async function testBack4AppConnection(){

    try{

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
                "Cấu hình Back4App chưa chạy thành công."
            );

        }


        console.log(
            "Đang gửi dữ liệu test lên Back4App..."
        );


        const ConnectionTest =
            Parse.Object.extend(
                "ConnectionTest"
            );


        const testObject =
            new ConnectionTest();


        testObject.set(
            "message",
            "Kết nối thành công"
        );

        testObject.set(
            "testedAt",
            new Date()
        );

        testObject.set(
            "source",
            "QuanLyHoSo"
        );


        const savedObject =
            await testObject.save();


        console.log(
            "Đã lưu object:",
            savedObject.id
        );


        const query =
            new Parse.Query(
                "ConnectionTest"
            );


        const result =
            await query.get(
                savedObject.id
            );


        alert(

            "Kết nối Back4App thành công!\n\n"

            +

            `Object ID: ${result.id}\n`

            +

            `Nội dung: ${result.get("message")}`

        );


    }catch(error){

        console.error(
            "BACK4APP TEST ERROR:",
            error
        );


        alert(

            "Không thể kết nối Back4App.\n\n"

            +

            `Mã lỗi: ${error.code || "Không có"}\n`

            +

            `Nội dung: ${error.message || error}`

        );

    }

}


window.testBack4AppConnection =
    testBack4AppConnection;
