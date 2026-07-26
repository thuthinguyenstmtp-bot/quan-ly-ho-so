// =====================================
// BACK4APP CONFIG
// =====================================

window.BACK4APP_CONFIG_READY = false;


if(typeof Parse === "undefined"){

    console.error(
        "❌ Parse SDK chưa được tải."
    );

}else{

    const BACK4APP_APPLICATION_ID =
        "qJcn8ulkSDCPSqsRhZxpBqogflw9bqwDB3llNoyB";

    const BACK4APP_JAVASCRIPT_KEY =
        "iusNDROiEvTAxvSmgvl6LdSN5bBHx2D6SwLg0HPn";


    try{

        Parse.initialize(
            BACK4APP_APPLICATION_ID,
            BACK4APP_JAVASCRIPT_KEY
        );


        Parse.serverURL =
            "https://parseapi.back4app.com/";


        window.BACK4APP_CONFIG_READY =
            true;


        console.log(
            "✅ Back4App config đã chạy."
        );

        console.log(
            "Parse version:",
            Parse.VERSION
        );

        console.log(
            "Server URL:",
            Parse.serverURL
        );

    }catch(error){

        console.error(
            "❌ Lỗi khởi tạo Back4App:",
            error
        );

    }

}
