// import { Noti } from "./global.js";

export default function Cart() {
    $(document).on("click", ".single_add_to_cart_button", function (e) {
      e.preventDefault();
  
      var $thisbutton = $(this);
      if (!$thisbutton.hasClass("disabled")) {
        var $form = $thisbutton.closest("form.cart"),
          id = $thisbutton.val(),
          act = $thisbutton.data("act"),
          product_qty = $form.find("input[name=quantity]").val() || 1,
          product_id = $form.find("input[name=product_id]").val() || id,
          variation_id = $form.find("input[name=variation_id]").val() || 0,
          attributes = {};
  
        $form.find(".variations select").each(function () {
          var attribute_name = $(this).attr("name"),
            attribute_value = $(this).val();
          attributes[attribute_name] = attribute_value;
        });
  
        var data = {
          action: "woocommerce_ajax_add_to_cart",
          act: act,
          product_id: product_id,
          product_sku: "",
          quantity: product_qty,
          variation_id: variation_id,
          attributes: attributes,
        };
  
        $(document.body).trigger("adding_to_cart", [$thisbutton, data]);
  
        $.ajax({
          type: "post",
          url: wc_add_to_cart_params.ajax_url,
          data: data,
          beforeSend: function (response) {
            $thisbutton.removeClass("added").addClass("loading");
          },
          complete: function (response) {
            $thisbutton.addClass("added").removeClass("loading");
          },
          success: function (response) {
            if (response.error && response.product_url) {
              window.location = response.product_url;
              return;
            } else {
              $(document.body).trigger("added_to_cart", [
                response.fragments,
                response.cart_hash,
                $thisbutton,
              ]);
              if (
                response.data != undefined &&
                response.data.redirect != undefined
              ) {
                window.location.href = response.data.redirect;
                Noti({
                  text: response.data.message,
                  title: response.data.title,
                  icon: "success",
                  timer: 2500,
                });
              } else {
                if (response.fragments != undefined) {
                  $.each(response.fragments, function (key, val) {
                    $(key).html(val);
                    $(key).fadeIn();
                  });
                }
                var newDiv = $(
                  '<div id="notiPopup" style="margin-top: 2rem;color: #2bb9c9;font - weight: bold; ">Sản phẩm đã được thêm vào giỏ hàng của bạn</div>'
                );
                $(".acoqvw_quickview_container .prds-bot").append(newDiv);
  
                Noti({
                  text: "Sản phẩm đã được thêm vào giỏ hàng của bạn",
                  title: "Thông báo",
                  icon: "success",
                  timer: 2500,
                });
              }
            }
          },
        });
      } else {
        return false;
      }
    });
  }
  