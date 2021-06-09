// DOM
const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const cartList = document.querySelector(".shoppingCart-tableList");
const discardAllBtn = document.querySelector(".discardAllBtn");
const orderBtn = document.querySelector(".orderInfo-btn");
const orderForm = document.querySelector(".orderInfo-form");

// API URL
// 舊domain 7/15關閉
// const cartUrl = `https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/carts`;
// 新domain 6/15啟用
const cartUrl = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`;

// global variable
let productData = [];
let cartData = {};

// 表單欄位規則、約束條件
const constraints = {
    姓名: {
        presence: {
            allowEmpty: false,
            message: "是必填欄位"
        }
    },
    電話: {
        presence: {
            allowEmpty: false,
            message: "是必填欄位"
        },
        length: {
            minimum: 8,
            tooShort: "至少 %{count} 碼"
        }
    },
    Email: {
        presence: {
            allowEmpty: false,
            message: "是必填欄位"
        },
        email: {
            message: "必須是正確的格式(例:apple@gmail.com)"
        }
    },
    寄送地址: {
        presence: {
            allowEmpty: false,
            message: "是必填欄位"
        }
    },
    交易方式: {
        presence: {
            allowEmpty: false,
            message: "是必填欄位"
        }
    }
};

init();

function init() {
    getProductList();
    getCartList();
}


// get list
function getProductList() {
    const url = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`;
    axios.get(url).then(function (response) {
        productData = response.data.products;
        renderProductList(productData);
        renderSelectOption(productData);
    })
}

function getCartList() {
    axios.get(cartUrl).then(response => {
        cartData = response.data;
        renderCartList(cartData.carts, cartData.finalTotal);
    })
}


// render function
// render product list
function renderProductList(data) {
    let str = "";
    data.forEach(item => {
        str += `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}"
            alt="">
        <a href="#" id="addCardBtn" class="js-addCart" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${toThousand(item.origin_price)}</del>
        <p class="nowPrice">NT$${toThousand(item.price)}</p>
    </li>`;
    })
    productList.innerHTML = str;
}

// render select options
function renderSelectOption(data) {
    let str = `<option value="全部" selected>全部</option>`;
    //取得select option
    const options = [...new Set(data.map(item => item.category))];
    options.forEach(item => {
        str += `<option value="${item}">${item}</option>`
    })
    productSelect.innerHTML = str;
}

// render cart list and totalPrice
function renderCartList(data, totalPrice) {
    // 總金額DOM
    const cartTotalPrice = document.querySelector(".shoppingCart-totalPrice");

    // 若購物車無任何商品
    if (data.length == 0 || totalPrice == 0) {
        cartList.innerHTML = `<tr><td>尚未購買任何品項</td></tr>`;
        cartTotalPrice.textContent = `NT$0`
        return
    }

    let str = "";
    data.forEach(item => {
        str += `<tr>
        <td>
            <div class="cardItem-title">
                <img src="${item.product.images}" alt="">
                <p>${item.product.title}</p>
            </div>
        </td>
        <td>NT$${toThousand(item.product.price)}</td>
        <td>${item.quantity}</td>
        <td>NT$${toThousand(item.quantity * item.product.price)}</td>
        <td class="discardBtn">
            <a href="#" class="material-icons js-cartDelete" data-id="${item.id}">
                clear
            </a>
        </td>
    </tr>`;
    })
    cartList.innerHTML = str;
    //總金額
    cartTotalPrice.textContent = `NT$${toThousand(totalPrice)}`
}


// 監聽事件
// select option
productSelect.addEventListener("change", function (e) {
    if (productSelect.value === "全部") {
        renderProductList(productData);
        return
    }
    let newData = productData.filter(item => item.category === productSelect.value);
    renderProductList(newData);
})

// addCart
productList.addEventListener("click", function (e) {
    e.preventDefault();
    if (e.target.getAttribute("class") !== "js-addCart") {
        return
    }
    let productID = e.target.dataset.id; //同 e.target.getAttribute("data-id")
    let numCheck = 1; //產品數量

    // 檢查購物車現有商品數量
    cartData.carts.forEach(item => {
        if (item.product.id === productID) {
            numCheck = item.quantity + 1;
            return
        }
    })
    axios.post(cartUrl, {
        "data": {
            "productId": productID,
            "quantity": numCheck
        }
    }).then(function (response) {
        cartData = response.data;
        renderCartList(cartData.carts, cartData.finalTotal);
        alert("加入購物車成功");
    })

})

// deleteCart
cartList.addEventListener("click", function (e) {
    e.preventDefault();
    // 沒有class 或 class不等於"js-cartDelete"
    if (e.target.getAttribute("class") == null || !e.target.getAttribute("class").includes("js-cartDelete")) {
        return
    }
    let cartID = e.target.dataset.id;
    axios.delete(`${cartUrl}/${cartID}`)
        .then(function (response) {
            //若發現商品已經刪除
            if (!response.data.status) {
                alert(response.data.message);
                return
            }
            alert("商品已刪除");
            cartData = response.data;
            renderCartList(cartData.carts, cartData.finalTotal);
        }).catch(function (response) {
            console.log(response.message);
        });
})

// deleteAllCart
discardAllBtn.addEventListener("click", function (e) {
    e.preventDefault();

    //前端預判購物車無資料的阻擋
    if (cartData.carts.length == 0) {
        alert("購物車尚無任何品項")
        return
    }

    axios.delete(`${cartUrl}`)
        .then(function (response) {
            alert(response.data.message);
            cartData = response.data;
            renderCartList(cartData.carts, cartData.finalTotal);
        }).catch(function (response) {
            //購物車已無資料，後端執行全部刪除的錯誤訊息
            alert("購物車已無任何項目");
        });

})

// 送出購物車資料
orderBtn.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelectorAll("[data-message]").forEach(el => el.textContent = ""); //清除錯誤訊息
    let errorMessage = validate(orderForm, constraints);
    if (errorMessage !== undefined) {
        let errorKeys = Object.keys(errorMessage);
        errorKeys.forEach(item => {
            document.querySelector(`[data-message=${item}]`).textContent = errorMessage[item];
        })
        return //有錯誤訊息不可送出
    }

    if (cartData.carts.length == 0) {
        alert("尚未購買任何項目");
        return
    }

    const customerName = document.querySelector(".js-customerName");
    const customerPhone = document.querySelector(".js-customerPhone");
    const customerEmail = document.querySelector(".js-customerEmail");
    const customerAddress = document.querySelector(".js-customerAddress");
    const tradeWay = document.querySelector(".js-tradeWay");
    let sendData = {
        "data": {
            "user": {
                "name": customerName.value,
                "tel": customerPhone.value,
                "email": customerEmail.value,
                "address": customerAddress.value,
                "payment": tradeWay.value
            }
        }
    }
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`, sendData)
        .then(function (response) {
            alert("送出成功");
            orderForm.reset(); //清空表單資料
            getCartList();  //重新render購物車資料
        }).catch(function (response) {
            alert("送出失敗");
        })
})


// 工具 util function
// toThousand
function toThousand(num) {
    let temp = num.toString().split(".");
    temp[0] = temp[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return temp.join(".");
}



// 填寫預定資料 單筆資料填寫完畢檢查
const inputs = document.querySelectorAll(".orderInfo-input");

inputs.forEach(input => {
    input.addEventListener("blur", function (e) {
        if (input.nextElementSibling) {
            input.nextElementSibling.textContent = "";
        }
        let errorMessage = validate(orderForm, constraints);
        if (errorMessage == undefined) {
            return
        }

        if (errorMessage[e.target.getAttribute("name")] !== undefined) {
            input.nextElementSibling.textContent = errorMessage[e.target.getAttribute("name")];
        };
    })
})

