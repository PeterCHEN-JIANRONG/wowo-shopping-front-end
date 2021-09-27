
// DOM
const orderList = document.querySelector(".js-orderList");
const orderDeleteAll = document.querySelector(".js-orderDeleteAll");

// global variable
const orderUrl = `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`;
const headersData = {
    headers: { //※headers的h必須是小寫，不可以大寫Headers
        Authorization: api_token
    }
}
let orderData = [];


init();

function init() {
    getOrderList();
}


function getOrderList() {
    axios.get(orderUrl, headersData)
        .then(function (response) {
            orderData = response.data.orders;
            orderData.sort((a, b) => b.createdAt - a.createdAt); //訂單排序
            renderOrderList(orderData);
            renderChart(orderData);
        })
        .catch(function (error) {

        })
}

// render 
// render order
function renderOrderList(data) {

    // 訂單無資料
    if (data.length == 0) {
        orderList.innerHTML = `<tr><td colspan="8">無訂單資料</td></tr>`;
        return
    }

    let str = "";
    data.forEach(item => {
        // 每筆訂單的訂購品項HTML
        let productsStr = "";
        item.products.forEach(productItem => {
            productsStr += `<p>${productItem.title}x${productItem.quantity}</p>`
        })
        // 訂單狀態
        let status = item.paid ? "已處理" : "未處理";

        str += `<tr>
        <td>${item.id}</td>
        <td>
            <p>${item.user.name}</p>
            <p>${item.user.tel}</p>
        </td>
        <td>${item.user.address}</td>
        <td>${item.user.email}</td>
        <td>
            ${productsStr}
        </td>
        <td>${timestampToDateTime(item.createdAt)}</td>
        <td class="orderStatus">
            <a href="#" class="orderStatus js-orderStatus" data-id="${item.id}" data-status="${item.paid}">${status}</a>
        </td>
        <td>
            <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除">
        </td>
    </tr>`
    })
    orderList.innerHTML = str;
}

// render C3 chart
function renderChart(data) {
    // 產品銷售資料分類
    let productSellData = {
        category: {},
        products: {}
    };

    data.forEach(item => {
        item.products.forEach(productItem => {
            // 依產品類別歸類[全產品類別營收比重]
            if (productSellData.category[productItem.category] == undefined) {
                productSellData.category[productItem.category] = productItem.price * productItem.quantity;
            } else {
                productSellData.category[productItem.category] += productItem.price * productItem.quantity;
            }

            // 依產品名稱歸類[全品項營收比重]
            if (productSellData.products[productItem.title] == undefined) {
                productSellData.products[productItem.title] = productItem.price * productItem.quantity;
            } else {
                productSellData.products[productItem.title] += productItem.price * productItem.quantity;
            }
        })
    })



    // 組C3 chart要的資料格式
    // 依全產品類別營收比重
    let sellByCategoryData = [];
    let productCategory = Object.keys(productSellData.category);

    productCategory.forEach(key => {
        let ary = [];
        ary.push(key);
        ary.push(productSellData.category[key]);
        sellByCategoryData.push(ary);
    })



    // 依全品項營收比重 
    let sellByProductTitleData = [];
    let productTitles = Object.keys(productSellData.products);

    productTitles.forEach(title => {
        let ary = [];
        ary.push(title);
        ary.push(productSellData.products[title]);
        sellByProductTitleData.push(ary);
    })
    sellByProductTitleData.sort(function (a, b) {
        return b[1] - a[1]  //銷售金額大到小排序
    })

    let sellByProductTitleAddOtherData = [];
    let otherPrice = 0;
    sellByProductTitleData.forEach((item, index) => {
        if (index < 3) {
            sellByProductTitleAddOtherData.push(item)
        } else {
            otherPrice += item[1];
        }
    })
    sellByProductTitleAddOtherData.push(["其他", otherPrice]);


    // render C3 chart
    if (data.length == 0) {
        document.querySelector(".chartCategory").innerHTML = "<div style='text-align: center; color:red'>無訂單資料</div>";
        document.querySelector(".chartProduct").innerHTML = "<div style='text-align: center; color:red'>無訂單資料</div>";
        return
    }

    // chart 全產品類別營收比重
    let chartCategory = c3.generate({
        bindto: '.chartCategory', // HTML 元素綁定
        data: {
            type: "pie",
            columns: sellByCategoryData
        },
        color: {
            pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#301E5F'] //自訂調色盤顏色
        }
    });

    // chart 全品項營收比重
    let chartProduct = c3.generate({
        bindto: '.chartProduct', // HTML 元素綁定
        data: {
            type: "pie",
            columns: sellByProductTitleAddOtherData
        },
        color: {
            pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#301E5F'] //自訂調色盤顏色
        }
    });

}

// 監聽事件
// order status 
orderList.addEventListener("click", function (e) {
    e.preventDefault();
    if (!e.target.classList.contains("js-orderStatus")) {
        return
    }

    // 送出訂單當前狀態的反向
    let status = (e.target.dataset.status == "true") ? false : true;
    let putData = {
        "data": {
            "id": e.target.dataset.id,
            "paid": status
        }
    }
    axios.put(orderUrl, putData, headersData)
        .then(function (response) {

            //若status為false，印出錯誤訊息
            if (response.data.status == false) {
                alert(response.data.message);
                return
            }
            alert("訂單狀態已變更");
            orderData = response.data.orders;
            orderData.sort((a, b) => b.createdAt - a.createdAt); //訂單排序
            renderOrderList(orderData);
            renderChart(orderData);
        })
        .catch(function (error) {
            alert("修改訂單狀態發生錯誤");
        })
})

// delete single order
orderList.addEventListener("click", function (e) {
    e.preventDefault();
    if (!e.target.classList.contains("js-orderDelete")) {
        return
    }

    let orderId = e.target.dataset.id;
    axios.delete(`${orderUrl}/${orderId}`, headersData)
        .then(function (response) {

            //若status為false，印出錯誤訊息
            if (response.data.status == false) {
                alert(response.data.message);
                return
            }

            alert(`單筆訂單已刪除，訂單編號：${orderId}`);
            orderData = response.data.orders;
            orderData.sort((a, b) => b.createdAt - a.createdAt); //訂單排序
            renderOrderList(orderData);
            renderChart(orderData);
        }).catch(function (error) {
            alert("刪除單筆訂單發生錯誤");
        })
})

// delete All order
orderDeleteAll.addEventListener("click", function (e) {
    e.preventDefault();

    //預防點錯DOM element
    if (!e.target.classList.contains("js-orderDeleteAll")) {
        return
    }

    axios.delete(orderUrl, headersData)
        .then(function (response) {


            //若status為false，印出錯誤訊息
            if (response.data.status == false) {
                alert(response.data.message);
                return
            }

            alert(response.data.message);
            orderData = response.data.orders;
            // orderData.sort((a, b) => b.createdAt - a.createdAt); //訂單排序
            renderOrderList(orderData);
            renderChart(orderData);
        }).catch(function (error) {
            alert("刪除全部訂單發生錯誤");
        })
})


// timestamp formate
function timestampToDateTime(timestamp) {
    let time = new Date(timestamp * 1000);
    // return `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()}`
    return time.toLocaleString(); //完整顯示地區時間
}