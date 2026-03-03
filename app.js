const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

function showToast(msg, icon = "success") {
  Toast.fire({
    icon,
    title: msg,
  });
}

function copyToClipboard(text) {
  if (!text) {
    showToast("Không có nội dung để copy", "info");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Đã copy!"))
      .catch(() => showToast("Copy thất bại", "error"));
  } else {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy")
        ? showToast("Đã copy!")
        : showToast("Copy thất bại", "error");
    } finally {
      document.body.removeChild(temp);
    }
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

function displayProductInfo(productInfo) {
  if (!productInfo) {
    $("#product-info-box").removeClass("show");
    return;
  }

  const html = `
                <div style="display: flex; align-items: flex-start; margin-bottom: 1rem;">
                    ${productInfo.imageUrl ? `<img src="${productInfo.imageUrl}" alt="${productInfo.productName || ""}" class="product-image">` : ""}
                    <div class="product-details">
                        <div class="product-name">${productInfo.productName || "N/A"}</div>
                        <div class="product-shop"><i class="fas fa-store mr-1"></i>${productInfo.shopName || "N/A"}</div>
                        <div class="product-price">${formatCurrency(productInfo.price || 0)}</div>
                    </div>
                </div>
                <div class="product-stats">
                    <div class="stat-item">
                        <div class="stat-label">Đã bán</div>
                        <div class="stat-value">${(productInfo.sales || 0).toLocaleString("vi-VN")}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Đánh giá</div>
                        <div class="stat-value">${productInfo.rating || "N/A"} <i class="fas fa-star text-warning"></i></div>
                    </div>
                </div>
                ${
                  productInfo.expected_commission
                    ? `
                <div class="commission-badge">
                    <div class="label">Hoa hồng dự kiến</div>
                    <div class="amount">${formatCurrency(productInfo.expected_commission)}</div>
                </div>
                `
                    : ""
                }
            `;

  $("#product-info-content").html(html);
  $("#product-info-box").addClass("show");
}

// Xử lý nút dán (paste)
$("#btnPaste").on("click", function () {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text) {
          $("#input_url").val(text.trim());
          showToast("Đã dán link!");
          // Tự động submit form sau khi dán thành công
          setTimeout(() => {
            $("#link-form").submit();
          }, 300);
        }
      })
      .catch(() => {
        $("#input_url").focus();
        showToast("Vui lòng dán bằng Ctrl+V", "info");
      });
  } else {
    $("#input_url").focus();
    showToast("Vui lòng dán bằng Ctrl+V", "info");
  }
});

// Xử lý submit form
$("#link-form").on("submit", function (e) {
  e.preventDefault();

  const url = $("#input_url").val().trim();
  if (!url) {
    showToast("Vui lòng nhập link Shopee!", "warning");
    return;
  }

  // Kiểm tra tính hợp lệ của URL
  try {
    new URL(url);
  } catch (e) {
    showToast("Link không hợp lệ!", "error");
    return;
  }

  // Hiển thị trạng thái loading
  $("#btnSubmit").prop("disabled", true);
  $(".btn-text").text("Đang xử lý...");
  $(".spinner").addClass("show");
  $("#result-section").removeClass("show");
  $("#product-info-box").removeClass("show");

  // Lấy affiliate ID ngẫu nhiên từ server
  const affiliateId = "17359460494";

  // Gọi API để tạo link
  const apiUrl = `https://api.hoimagiamgia.com/?url=${encodeURIComponent(url)}&affiliate_id=${encodeURIComponent(affiliateId)}`;

  $.ajax({
    url: apiUrl,
    method: "GET",
    dataType: "json",
    timeout: 30000,
    success: function (response) {
      $("#btnSubmit").prop("disabled", false);
      $(".btn-text").text("Tạo Link Ngay");
      $(".spinner").removeClass("show");

      if (response.success && response.affiliateLink) {
        $("#affiliate-link").text(response.affiliateLink);
        $("#btnCopy").data("link", response.affiliateLink);
        $("#btnBuy").attr("href", response.affiliateLink);
        $("#result-section").addClass("show");
        showToast("Tạo link thành công!");

        // Hiển thị thông tin sản phẩm nếu có
        if (response.productInfo) {
          displayProductInfo(response.productInfo);
        } else {
          $("#product-info-box").removeClass("show");
        }

        // Cuộn đến phần kết quả
        $("html, body").animate(
          {
            scrollTop: $("#result-section").offset().top - 20,
          },
          500,
        );
      } else {
        showToast(response.message || "Có lỗi xảy ra!", "error");
        $("#product-info-box").removeClass("show");
      }
    },
    error: function () {
      $("#btnSubmit").prop("disabled", false);
      $(".btn-text").text("Tạo Link Ngay");
      $(".spinner").removeClass("show");
      showToast("Có lỗi xảy ra!", "error");
      $("#product-info-box").removeClass("show");
    },
  });
});

// Xử lý các nút copy
$("#btnCopy").on("click", function () {
  copyToClipboard($(this).data("link"));
});

$("#btnCopyShare").on("click", function () {
  copyToClipboard($("#shareLink").val());
});
