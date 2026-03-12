import { ajaxPostData } from "./global.js";

export default function ProductModule() {
  $(document).on("change", ".prd-cate-form .recheck-input, .prd-cate-form .range-input", function (e) {
    e.preventDefault();
    var $this = $(this),
      form = $this.closest("form");
    if ($this.closest(".rang")) {
      $(".range-min").find("input").val("");
    }
    setTimeout(() => {
      form.submit();
    }, 3000);
  });
  $(document).on("click", ".toggle-subcategories", function (e) {
    var parentId = $(this).data("parent-id");
    var $subcategoriesContainer = $("#subcategories-" + parentId);
    $subcategoriesContainer.toggle();
    $(this).find("i").toggleClass("active");
  });
  $(document).ready(function () {
    $(".recheck-input:checked").each(function () {
      var parentId = $(this).closest(".prd-cate-li.parent").find(".toggle-subcategories").data("parent-id");
      var $subcategoriesContainer = $("#subcategories-" + parentId);
      var $toggleIcon = $(this).closest(".prd-cate-li.parent").find(".toggle-subcategories");

      // Mở danh mục con và thêm class 'active' cho phần tử 'i'
      $subcategoriesContainer.show();
      $toggleIcon.addClass("active");
    });
  });
  $(document).on("click", ".cate-head", function (e) {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ a

    // Toggle hiển thị hoặc ẩn phần cate-body
    $(".cate-body").slideToggle();
  });
}

ProductModule();
