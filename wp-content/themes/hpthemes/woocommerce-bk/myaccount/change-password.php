<div class="acc-pass">
    <p class="fw-7 t24">Thay đổi mật khẩu </p>
    <div class="form-pass mt-24">
        <form action=""  id="f-change-password">
            <div class="form-list row">
                <div class="col form-ip"> <span class="t-text">
                        Mật khẩu cũ </span>
                    <div class="input-pass">
                        <input type="password" name="current-password" required placeholder="Nhập mật khẩu cũ"><i class="fas fa-eye-slash icon seepassJS"></i>
                    </div>
                </div>
                <div class="col form-ip"> <span class="t-text">
                        Mật khẩu mới </span>
                    <div class="input-pass">
                        <input type="password" name="new-pass" required placeholder="Nhập mật khẩu mới"><i class="fas fa-eye-slash icon seepassJS"></i>
                    </div>
                </div>
                <div class="col form-ip"> <span class="t-text">
                        Nhập lại mật khẩu mới </span>
                    <div class="input-pass">
                        <input type="password" required name="new-repass" placeholder="Nhập lạ mật khẩu mới"><i class="fas fa-eye-slash icon seepassJS"></i>
                    </div>
                </div>
            </div>
            <div class="mt-24">
                <button class="btn is-loading-group" type="submit">
                    <span class="inner">Lưu thay đổi</span><i class="fa-light fa-arrow-right icon"></i>
                </button>
                <div class="hp-error-pri"></div>
            </div>
        </form>
    </div>
</div>