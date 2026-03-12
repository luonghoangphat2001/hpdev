import { beforeProcessing, ajaxPostData, apiPostData, isSuccessResult } from "./global.js";

export default function UsersModule() {
  $(document).on("change", ".monaFieldItem .monaField", function (e) {
    e.preventDefault();
    var $this = jQuery(this);
    var value = jQuery(this).val();
    if (value) {
      $this.closest(".monaFieldItem").find(".mona-error").fadeOut();
    }
  });

  $(document).on("submit", "#formRegister", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);

    beforeProcessing($this);
    processing.addClass("loading");
    apiPostData("UserRegister", "POST", formData)
      .then(function (result) {
        if (isSuccessResult(result)) {
          $this.find(".mona-success-pri").html(result.message);
          $this.find(".mona-success-pri").fadeIn();
          if (result.redirect) {
            window.location.href = result.redirect;
          }
        } else {
          if (result.code == "mona_get_data_not_found" && result.message != "") {
            $this.find(".mona-error-pri").html(result.message);
            $this.find(".mona-error-pri").fadeIn();
          }
          if (result.code == "rest_invalid_param" && result.data && result.data.params) {
            $.each(result.data.params, function (key, val) {
              $this.find(".mona-error-" + key).html(val);
              $this.find(".mona-error-" + key).fadeIn();
            });
          }
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("submit", "#formLogin", function (e) {
    e.preventDefault();
    var $this = $(this);
    console.log("sdv");

    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);

    beforeProcessing($this);
    processing.addClass("loading");
    apiPostData("UserLogin", "POST", formData)
      .then(function (result) {
        if (isSuccessResult(result)) {
          $this.find(".mona-success-pri").html(result.message);
          $this.find(".mona-success-pri").fadeIn();
          if (result.redirect) {
            setTimeout(() => {
              window.location.href = result.redirect;
            }, 1000);
          }
        } else {
          if (result.code == "mona_get_data_not_found" && result.message != "") {
            $this.find(".mona-error-pri").html(result.message);
            $this.find(".mona-error-pri").fadeIn();
          }
          if (result.code == "rest_invalid_param" && result.data && result.data.params) {
            $.each(result.data.params, function (key, val) {
              $this.find(".mona-error-" + key).html(val);
              $this.find(".mona-error-" + key).fadeIn();
            });
          }
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("submit", "#f-forgot-password", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);

    beforeProcessing($this);
    processing.addClass("loading");
    apiPostData("UserForgot", "POST", formData)
      .then(function (result) {
        if (isSuccessResult(result)) {
          $this.find(".mona-success-pri").html(result.message);
          $this.find(".mona-success-pri").fadeIn();
          if (result.redirect) {
            window.location.href = result.redirect;
          }
        } else {
          if (result.code == "mona_get_data_not_found" && result.message != "") {
            $this.find(".mona-error-pri").html(result.message);
            $this.find(".mona-error-pri").fadeIn();
          }
          if (result.code == "rest_invalid_param" && result.data && result.data.params) {
            $.each(result.data.params, function (key, val) {
              $this.find(".mona-error-" + key).html(val);
              $this.find(".mona-error-" + key).fadeIn();
            });
          }
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("submit", "#f-update-password", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);

    beforeProcessing($this);
    processing.addClass("loading");
    apiPostData("UserReset", "POST", formData)
      .then(function (result) {
        if (isSuccessResult(result)) {
          $this.find(".mona-success-pri").html(result.message);
          $this.find(".mona-success-pri").fadeIn();
          if (result.redirect) {
            setTimeout(() => {
              window.location.href = result.redirect;
            }, 1000);
          }
        } else {
          if (result.code == "mona_get_data_not_found" && result.message != "") {
            $this.find(".mona-error-pri").html(result.message);
            $this.find(".mona-error-pri").fadeIn();
          }
          if (result.code == "rest_invalid_param" && result.data && result.data.params) {
            $.each(result.data.params, function (key, val) {
              $this.find(".mona-error-" + key).html(val);
              $this.find(".mona-error-" + key).fadeIn();
            });
          }
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("submit", "#f-change-password", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);
    formData.append("action", "m_a_change_password");
    // beforeProcessing($this);
    processing.addClass("loading");
    ajaxPostData(formData)
      .then(function (result) {
        if (result.success) {
          $this.find(".mona-success-pri").html(result.data.message);
        } else {
          console.log(result);
          $this.find(".mona-error-pri").html(result.data.message);
          $this.find(".mona-error-pri").fadeIn();
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.data.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("submit", "#m-update-account", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);
    formData.append("action", "m_a_edit_account");
    // beforeProcessing($this);
    processing.addClass("loading");
    ajaxPostData(formData)
      .then(function (result) {
        if (result.success) {
          $this.find(".mona-success-pri").html(result.data.message);
          $this.find(".mona-success-pri").fadeIn();
          window.location.reload();
        } else {
          $this.find(".mona-error-pri").html(result.message);
          $this.find(".mona-error-pri").fadeIn();
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("submit", ".m-f-update-address", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.find('button[type="submit"]');
    var formData = new FormData($this[0]);
    formData.append("action", "m_a_update_address");
    // beforeProcessing($this);
    processing.addClass("loading");
    ajaxPostData(formData)
      .then(function (result) {
        if (result.success) {
          $this.find(".mona-success-pri").html(result.data.message);
          $this.find(".mona-success-pri").fadeIn();
          window.location.href = result.data.url;
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("click", ".mona-j-user-default", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this.closest(".is-loading-btn");
    var address = $this.data("address");
    var formData = new FormData();
    formData.append("action", "m_a_update_address_default");
    formData.append("address", address);
    // beforeProcessing($this);
    processing.addClass("loading");
    ajaxPostData(formData)
      .then(function (result) {
        if (result.success) {
          window.location.reload();
        } else {
          $this.find(".mona-error-pri").html(result.message);
          $this.find(".mona-error-pri").fadeIn();
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("click", ".mona-j-delete-address", function (e) {
    e.preventDefault();
    var $this = $(this);
    var processing = $this;
    var address = $this.data("address");
    var formData = new FormData();
    formData.append("action", "m_a_delete_address");
    formData.append("address", address);
    // beforeProcessing($this);
    processing.addClass("loading");
    ajaxPostData(formData)
      .then(function (result) {
        if (result.success) {
          $this.find(".mona-success-pri").html(result.data.message);
          $this.find(".mona-success-pri").fadeIn();
          window.location.href = result.data.url;
        }
        processing.removeClass("loading");
      })
      .catch((error) => {
        $this.find(".mona-error-pri").html(error.message);
        $this.find(".mona-error-pri").fadeIn();
        processing.removeClass("loading");
      });
  });

  $(document).on("click", ".copy-button", function (e) {
    var inputValue = $('input[name="userEmail"]').val();
    $("#passEmail").val(inputValue);
  });

  $(document).on("keyup", 'input[name="userFullName"]', function (e) {
    var inputValue = $(this).val();
    $(".monaHoTen").val(inputValue);
  });

  $(document).on("keyup", 'input[name="userPhone"]', function (e) {
    var inputValue = $(this).val();
    $(".monaSdt").val(inputValue);
  });

  $(document).on("keyup", 'input[name="userEmail"]', function (e) {
    var inputValue = $(this).val();
    $(".monaEmail").val(inputValue);
  });

  $(document).on("keyup", 'input[name="userAddress"]', function (e) {
    var inputValue = $(this).val();
    $(".monaVP").val(inputValue);
  });

  $(document).on("change", "#up-file-avt", function (e) {
    e.preventDefault();

    let $this = $(this);
    let formData = new FormData();
    if ($("#up-file-avt").get(0).files.length !== 0) {
      let fileUploadAvatar = $("#up-file-avt").prop("files")[0];
      formData.append("upload_imgs", fileUploadAvatar);
      formData.append("action", "update_avt");

      $.ajax({
        url: mona_ajax_url.ajaxURL,
        type: "POST", // Corrected 'post' to 'POST'
        data: formData,
        contentType: false, // Let jQuery handle content type
        processData: false, // Don't process the data, let FormData do it
        success: function (result) {
          // Handle success response
        },
        error: function (error) {
          // Handle error
        },
      });
    }
  });
}

UsersModule();
