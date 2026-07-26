// =====================================
// AUTH.JS
// Đăng nhập và bảo vệ hệ thống
// =====================================


// =====================================
// HIỂN THỊ THÔNG BÁO ĐĂNG NHẬP
// =====================================

function setLoginMessage(
    message,
    type = "error"
){

    const element =
        document.getElementById(
            "loginMessage"
        );


    if(!element){

        return;

    }


    element.textContent =
        message || "";


    element.classList.remove(
        "success",
        "error"
    );


    if(message){

        element.classList.add(type);

    }

}


// =====================================
// ĐĂNG NHẬP
// =====================================

async function loginToSystem(){

    const usernameInput =
        document.getElementById(
            "loginUsername"
        );


    const passwordInput =
        document.getElementById(
            "loginPassword"
        );


    const loginButton =
        document.getElementById(
            "loginButton"
        );


    const username =
        String(
            usernameInput?.value || ""
        ).trim();


    const password =
        String(
            passwordInput?.value || ""
        );


    if(!username){

        setLoginMessage(
            "Vui lòng nhập tên đăng nhập."
        );

        usernameInput?.focus();

        return;

    }


    if(!password){

        setLoginMessage(
            "Vui lòng nhập mật khẩu."
        );

        passwordInput?.focus();

        return;

    }


    if(
        typeof Parse === "undefined"
        ||
        window.BACK4APP_CONFIG_READY !== true
    ){

        setLoginMessage(
            "Chưa kết nối được với Back4App."
        );

        return;

    }


    try{

        if(loginButton){

            loginButton.disabled =
                true;

            loginButton.textContent =
                "Đang đăng nhập...";

        }


        setLoginMessage("");


        const user =
            await Parse.User.logIn(
                username,
                password
            );


        console.log(
            "Đăng nhập thành công:",
            user.get("username")
        );


        setLoginMessage(
            "Đăng nhập thành công.",
            "success"
        );


        window.location.replace(
            "./index.html"
        );

    }catch(error){

        console.error(
            "Lỗi đăng nhập:",
            error
        );


        let message =
            "Không thể đăng nhập.";


        if(
            error.code === 101
            ||
            error.code === 209
        ){

            message =
                "Tên đăng nhập hoặc mật khẩu không đúng.";

        }else if(error.message){

            message =
                `Không thể đăng nhập: ${error.message}`;

        }


        setLoginMessage(message);


        if(passwordInput){

            passwordInput.value = "";

            passwordInput.focus();

        }

    }finally{

        if(loginButton){

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Đăng nhập";

        }

    }

}


// =====================================
// KIỂM TRA NGƯỜI DÙNG HIỆN TẠI
// =====================================

function getCurrentSystemUser(){

    if(typeof Parse === "undefined"){

        return null;

    }


    return Parse.User.current();

}


// =====================================
// BẢO VỆ TRANG INDEX
// =====================================

function requireSystemLogin(){

    const currentUser =
        getCurrentSystemUser();


    if(!currentUser){

        window.location.replace(
            "./login.html"
        );

        return false;

    }


    document.body
        ?.classList
        .remove(
            "system-auth-pending"
        );


    renderCurrentSystemUser();


    return true;

}


// =====================================
// ĐÃ ĐĂNG NHẬP THÌ KHÔNG Ở LOGIN.HTML
// =====================================

function redirectLoggedInUser(){

    const currentUser =
        getCurrentSystemUser();


    if(currentUser){

        window.location.replace(
            "./index.html"
        );

        return true;

    }


    return false;

}


// =====================================
// HIỂN THỊ TÀI KHOẢN Ở SIDEBAR
// =====================================

function renderCurrentSystemUser(){

    const currentUser =
        getCurrentSystemUser();


    const usernameElement =
        document.getElementById(
            "currentSystemUsername"
        );


    if(
        currentUser
        &&
        usernameElement
    ){

        usernameElement.textContent =

            currentUser.get("username")

            ||

            "Người dùng";

    }

}


// =====================================
// ĐĂNG XUẤT
// =====================================

async function logoutSystem(){

    const confirmed =
        confirm(
            "Bạn có chắc chắn muốn đăng xuất?"
        );


    if(!confirmed){

        return;

    }


    try{

        await Parse.User.logOut();

    }catch(error){

        console.error(
            "Lỗi khi đăng xuất:",
            error
        );

    }finally{

        window.location.replace(
            "./login.html"
        );

    }

}


// =====================================
// ĐƯA HÀM RA WINDOW
// =====================================

window.loginToSystem =
    loginToSystem;

window.logoutSystem =
    logoutSystem;

window.requireSystemLogin =
    requireSystemLogin;

window.redirectLoggedInUser =
    redirectLoggedInUser;

window.getCurrentSystemUser =
    getCurrentSystemUser;
