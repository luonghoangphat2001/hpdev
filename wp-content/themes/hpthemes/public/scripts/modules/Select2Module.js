export default function Select2Module() {
  $(document).ready(function () {
    if ($(".re-select-main").length > 0) {
      $(".re-select-main").select2();
    }
  });
}

Select2Module();
