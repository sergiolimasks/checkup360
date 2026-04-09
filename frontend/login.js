// login.js
const Login = {
  init() {
    const form = document.getElementById('loginForm');
    const err = document.getElementById('loginError');
    form.onsubmit = async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = 'Entrando...';
      try {
        const data = await Api.login(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
        );
        Api.setToken(data.token);
        App.user = data.user;
        App.showApp('dashboard');
      } catch (ex) {
        err.textContent = ex.message;
        err.style.display = 'block';
      }
      btn.disabled = false; btn.textContent = 'Entrar';
    };
  }
};
