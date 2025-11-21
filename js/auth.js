// js/auth.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const authPath = `${SUPABASE_URL}/auth/v1`;
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

async function signup(email, password, metadata = {}) {
  const res = await fetch(`${authPath}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, password, data: metadata })
  });
  return res.json();
}

async function signin(email, password) {
  const res = await fetch(`${authPath}/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

function saveToken(session) {
  if (!session) return;
  const token = session.access_token || session.accessToken || session.token;
  if (token) localStorage.setItem("sb_token", token);
}

function showMessage(el, text) {
  el.textContent = text;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

// Login page logic
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMsg");

    try {
      const data = await signin(email, password);
      if (data.access_token) {
        saveToken(data);
        window.location.href = "dashboard.html";
      } else {
        showMessage(msg, data.error_description || data.error || "Falha ao autenticar");
      }
    } catch (err) {
      showMessage(msg, "Erro de rede ao tentar logar");
    }
  });
}

// Register page logic
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("registerMsg");

    try {
      const data = await signup(email, password, { name });
      if (data.user || data.id) {
        showMessage(msg, "Cadastro criado. Verifique seu e-mail se necessário.");
        setTimeout(() => (window.location.href = "index.html"), 1400);
      } else if (data.error) {
        showMessage(msg, data.error_description || data.error.message || "Falha no cadastro");
      } else {
        showMessage(msg, "Cadastro enviado. Confira seu e-mail.");
      }
    } catch (err) {
      showMessage(msg, "Erro de rede ao tentar cadastrar");
    }
  });
}

// Export helper for other modules
export function getAuthHeader() {
  const token = localStorage.getItem("sb_token");
  const headers = { apikey: SUPABASE_ANON_KEY };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function signout() {
  localStorage.removeItem("sb_token");
  window.location.href = "index.html";
}