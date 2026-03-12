// Toast function
export function toastAction({ type = "info", content = "", duration = 3000 }) {
  const main = document.getElementById("mona-toast");
  if (main) {
    const toast = document.createElement("div");

    // Auto remove toast
    const autoRemoveId = setTimeout(function () {
      main.removeChild(toast);
    }, duration + 1000);

    // Remove toast when clicked
    toast.onclick = function (e) {
      if (e.target.closest(".toast__close")) {
        main.removeChild(toast);
        clearTimeout(autoRemoveId);
      }
    };
    const delay = (duration / 1000).toFixed(2);

    toast.classList.add("toast-wrap", `toast--${type}`);
    toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`;

    toast.innerHTML = `${content}`;
    main.appendChild(toast);
  }
}

// insert html function
export function getErrorMessage($text) {
  var $message = '<div class="toast__icon"><span class="dashicons dashicons-info"></span></div>';
  $message += '<div class="toast__body">';
  $message += '<h3 class="toast__title">Thông báo!</h3>';
  $message += '<p class="toast__msg">' + $text + "</p>";
  $message += "</div>";
  $message += '<div class="toast__close"><span class="dashicons dashicons-no"></span></div>';
  $message += '<div class="progress"></div>';
  return $message;
}

// error message function
export function insertStringValue(objectData) {
  if (!$.isEmptyObject(objectData)) {
    $.each(objectData, function (objKey, objKeyValue) {
      if (objKeyValue != "") {
        $(objKey).html(objKeyValue);
      }
    });
  }
}

export function Noti({ icon = "success", text, title, timer = 4000, redirect = "" }) {
  const mainElement = document.querySelector("body");
  var noti_con = document.querySelector(".noti_con");
  if (!noti_con) {
    var noti_con = document.createElement("div");
    noti_con.setAttribute("class", "noti_con");
    mainElement.appendChild(noti_con);
  }
  var noti_alert = document.createElement("div");
  var noti_icon = document.createElement("div");
  var noti_process = document.createElement("div");
  noti_icon.setAttribute("class", "noti_icon " + icon);
  noti_alert.setAttribute("class", "noti_alert");
  noti_process.setAttribute("class", "progress active " + icon);
  noti_alert.innerHTML =
    '<div class="message"><p class="text1">' + title + '</p><p class="text2">' + text + "</p></div>";
  noti_alert.prepend(noti_icon);
  noti_alert.prepend(noti_process);
  noti_con.prepend(noti_alert);

  if (icon == "success") {
    // noti_icon.style.background = '#00b972';
    noti_icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="14" stroke-dashoffset="14" d="M8 12L11 15L16 10"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="14;0"/></path></g></svg>`;
  } else if (icon == "info") {
    // noti_icon.style.background = '#0395FF';
    noti_icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="20" stroke-dashoffset="20" d="M8.99999 10C8.99999 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 10.9814 14.5288 11.8527 13.8003 12.4C13.0718 12.9473 12.5 13 12 14"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.4s" values="20;0"/></path></g><circle cx="12" cy="17" r="1" fill="currentColor" fill-opacity="0"><animate fill="freeze" attributeName="fill-opacity" begin="1s" dur="0.2s" values="0;1"/></circle></svg>`;
  } else if (icon == "danger" || icon == "error") {
    // noti_icon.style.background = '#FF032C';
    noti_icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="8" stroke-dashoffset="8" d="M12 12L16 16M12 12L8 8M12 12L8 16M12 12L16 8"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="8;0"/></path></g></svg>`;
  } else {
    // noti_icon.style.background = '#00b972';
    noti_icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="14" stroke-dashoffset="14" d="M8 12L11 15L16 10"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="14;0"/></path></g></svg>`;
  }

  setTimeout(() => {
    noti_alert.classList.add("active");
  }, 100);

  setTimeout(() => {
    noti_alert.classList.remove("active");
  }, timer);

  setTimeout(() => {
    noti_alert.remove();
  }, timer + 2000);
}

export function ajaxPostData(formdata) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: hp_ajax_url.ajaxURL,
      type: "POST",
      processData: false,
      contentType: false,
      data: formdata,
      success: function (result) {
        resolve(result);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

export function apiPostData(path, method, formdata) {
  return new Promise(function (resolve, reject) {
    fetch(hp_ajax_url.apiURL + path, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formdata)),
    })
      .then((response) => resolve(response.json()))
      .catch((error) => resolve(error));
  });
}

export function beforeProcessing(parent) {
  parent.find(".mona-error").fadeOut();
  parent.find(".mona-error-pri").fadeOut();
}

export function isSuccessResult(result) {
  if (
    result.status == 400 ||
    result.code == "rest_invalid_param" ||
    result.code == "mona_get_data_not_found" ||
    result.code == "rest_no_route"
  ) {
    return false;
  } else {
    return true;
  }
}

let debounceTimeout;
export function ajax_qly_change($this, input_number) {
  var miniItem = $this.closest(".mini_cart_item"),
    key = miniItem.data("cart-key"),
    loading = $this.closest(".is-loading-group"),
    price = miniItem.data("price"),
    phamtramtax = miniItem.data("tax"),
    ship = miniItem.data("shipping"),
    subtotal = 0,
    totalCoupon = 0,
    total = 0,
    Taxotal = 0,
    formData = new FormData();

  miniItem.addClass("active");

  $(".mini_cart_item").each(function () {
    var $this = $(this),
      itemSubtotal = $this.hasClass("active") ? parseInt(price) * parseInt(input_number) : $this.data("subtotal"),
      tax = itemSubtotal * (phamtramtax / 100),
      formatteditemSubtotal = formatNumberWithCommas(itemSubtotal);
    subtotal += itemSubtotal;
    Taxotal += tax;
    $this.find(".mona-cart-item-total span bdi").html(formatteditemSubtotal);
  });

  $(".mona-item-coupon").each(function () {
    totalCoupon += $(this).data("coupon");
  });

  total = subtotal + Taxotal + ship - totalCoupon;
  var formattedSubtotal = formatNumberWithCommas(subtotal);
  var formattedTotal = formatNumberWithCommas(total);
  var formattedTaxotal = formatNumberWithCommas(Taxotal);

  $(".mona-subtotal span bdi").html(formattedSubtotal);
  $(".mona-total span bdi").html(formattedTotal);
  $(".mona-tax-total span bdi").html(formattedTaxotal);

  formData.append("action", "m_update_quantity_item");
  formData.append("qty", input_number);
  formData.append("key", key);
  formData.append("security", hp_ajax_url.ajaxNonce);
  clearTimeout(debounceTimeout);

  // Thiết lập timeout mới để thực hiện yêu cầu AJAX
  debounceTimeout = setTimeout(() => {
    loading.addClass("loading");
    ajaxPostData(formData)
      .then(function (result) {
        loading.removeClass("loading");
        if (result.fragments) {
          $.each(result.fragments, function (key, val) {
            $(key).html(val);
            $(key).fadeIn();
          });
          removeFrom();
          // SwiperModule();
        }
        if ($("body").hasClass("woocommerce-checkout")) {
          $(document.body).trigger("update_checkout");
        }
        if ($("body").hasClass("woocommerce-cart")) {
          $(document.body).trigger("wc_update_cart");
        }
      })
      .catch((error) => {
        loading.removeClass("loading");
        Noti({
          text: error,
          title: "Thông báo",
          icon: "danger",
          timer: 2500,
        });
      });
  }, 500);
}

export function formatNumberWithCommas(number) {
  var currencySymbol = $("span.woocommerce-Price-currencySymbol").first().text();
  var formattedNumber = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formattedNumber + '<span class="woocommerce-Price-currencySymbol">' + currencySymbol + "</span>";
}

export function removeFrom() {
  var priceContainer2 = document.querySelector(".mona-product-prcie.price");
  if (priceContainer2) {
    priceContainer2.innerHTML = priceContainer2.innerHTML.replace("From:", "").trim();
  }

  var priceContainers = document.querySelectorAll(".prd-it .b-ctn .is-item-loading");
  if (priceContainers) {
    priceContainers.forEach(function (priceContainer) {
      priceContainer.innerHTML = priceContainer.innerHTML.replace("From:", "").trim();
    });
  }
}
