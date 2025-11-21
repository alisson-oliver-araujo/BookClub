// js/dashboard.js
import { signout, getAuthHeader } from "./auth.js";
import { fetchList, createRecord, updateRecord, deleteRecord } from "./api.js";

const btnLogout = document.getElementById("btnLogout");
const btnAuthors = document.getElementById("btnAuthors");
const btnBooks = document.getElementById("btnBooks");
const viewAuthors = document.getElementById("viewAuthors");
const viewBooks = document.getElementById("viewBooks");
const msgBox = document.getElementById("msg");

// guard: redireciona se não logado
(function guard() {
  const token = localStorage.getItem("sb_token");
  if (!token && location.pathname.endsWith("dashboard.html")) {
    window.location.href = "index.html";
  }
})();

function showMsg(text, timeout = 2500) {
  msgBox.textContent = text;
  msgBox.classList.remove("hidden");
  setTimeout(() => msgBox.classList.add("hidden"), timeout);
}

// Navegação simples
btnAuthors.addEventListener("click", () => { viewAuthors.classList.remove("hidden"); viewBooks.classList.add("hidden"); viewProfile.classList.add("hidden"); });
btnBooks.addEventListener("click", () => { viewAuthors.classList.add("hidden"); viewBooks.classList.remove("hidden"); viewProfile.classList.add("hidden"); loadBooks(); });
btnLogout.addEventListener("click", () => signout());

// Autores
const openAuthorForm = document.getElementById("openAuthorForm");
const authorFormWrapper = document.getElementById("authorFormWrapper");
const authorForm = document.getElementById("authorForm");
const authorsList = document.getElementById("authorsList");
const cancelAuthor = document.getElementById("cancelAuthor");

openAuthorForm.addEventListener("click", () => {
  authorFormWrapper.classList.toggle("hidden");
  authorForm.reset();
  document.getElementById("authorId").value = "";
});

cancelAuthor.addEventListener("click", () => {
  authorFormWrapper.classList.add("hidden");
  authorForm.reset();
});

async function loadAuthors() {
  authorsList.innerHTML = "";
  const rows = await fetchList("authors", "?order=name.asc");
  if (!Array.isArray(rows)) return;
  rows.forEach(a => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow flex justify-between items-start";
    card.innerHTML = `
      <div>
        <h4 class="font-semibold">${a.name}</h4>
        <p class="text-sm text-slate-600">${a.country || ""} · ${a.birthdate || ""}</p>
        <p class="text-sm mt-2 text-slate-700">${a.bio ? a.bio.slice(0, 120) + (a.bio.length > 120 ? "..." : "") : ""}</p>
      </div>
      <div class="flex flex-col gap-2">
        <button class="editAuthor bg-indigo-600 text-white px-3 py-1 rounded" data-id="${a.id}">Editar</button>
        <button class="delAuthor bg-rose-600 text-white px-3 py-1 rounded" data-id="${a.id}">Excluir</button>
        <button class="viewBooksByAuthor px-3 py-1 border rounded text-sm" data-id="${a.id}">Ver livros</button>
      </div>
    `;
    authorsList.appendChild(card);
  });

  // handlers
  document.querySelectorAll(".editAuthor").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const r = await fetchList("authors", `?id=eq.${id}&limit=1`);
      const a = Array.isArray(r) && r[0];
      if (a) {
        document.getElementById("authorId").value = a.id;
        document.getElementById("authorName").value = a.name || "";
        document.getElementById("authorBio").value = a.bio || "";
        document.getElementById("authorCountry").value = a.country || "";
        document.getElementById("authorBirthdate").value = a.birthdate || "";
        authorFormWrapper.classList.remove("hidden");
      }
    });
  });

  document.querySelectorAll(".delAuthor").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Excluir autor? Esta ação também pode exigir exclusão prévia de livros relacionados.")) return;
      await deleteRecord("authors", id);
      showMsg("Autor excluído");
      loadAuthors();
      loadBooks();
    });
  });

  document.querySelectorAll(".viewBooksByAuthor").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      viewBooks.classList.remove("hidden");
      viewAuthors.classList.add("hidden");
      loadBooks(`?author_id=eq.${id}`);
    });
  });
}

authorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("authorId").value;
  const payload = {
    name: document.getElementById("authorName").value.trim(),
    bio: document.getElementById("authorBio").value.trim(),
    country: document.getElementById("authorCountry").value.trim(),
    birthdate: document.getElementById("authorBirthdate").value || null
  };
  try {
    if (id) {
      await updateRecord("authors", id, payload);
      showMsg("Autor atualizado");
    } else {
      await createRecord("authors", payload);
      showMsg("Autor criado");
    }
    authorForm.reset();
    authorFormWrapper.classList.add("hidden");
    loadAuthors();
    loadBooks();
  } catch {
    showMsg("Erro ao salvar autor");
  }
});

// Livros
const openBookForm = document.getElementById("openBookForm");
const bookFormWrapper = document.getElementById("bookFormWrapper");
const bookForm = document.getElementById("bookForm");
const booksList = document.getElementById("booksList");
const cancelBook = document.getElementById("cancelBook");
const bookAuthorSelect = document.getElementById("bookAuthor");

openBookForm.addEventListener("click", async () => {
  bookFormWrapper.classList.toggle("hidden");
  bookForm.reset();
  document.getElementById("bookId").value = "";
  await populateAuthorSelect();
});

cancelBook.addEventListener("click", () => {
  bookFormWrapper.classList.add("hidden");
  bookForm.reset();
});

async function populateAuthorSelect() {
  bookAuthorSelect.innerHTML = `<option value="">Selecione</option>`;
  const authors = await fetchList("authors", "?order=name.asc");
  if (!Array.isArray(authors)) return;
  authors.forEach(a => {
    const o = document.createElement("option");
    o.value = a.id;
    o.textContent = a.name;
    bookAuthorSelect.appendChild(o);
  });
}

async function loadBooks(params = "") {
  booksList.innerHTML = "";
  // select traz dados do author via relacionamento manual: select=*,authors(name)
  // Supabase REST não resolve joins automáticos sem views; por isso vamos buscar livros e mapear autores localmente
  const books = await fetchList("books", params ? params : "?order=title.asc");
  const authors = await fetchList("authors", "?order=name.asc");
  const authorsMap = Array.isArray(authors) ? Object.fromEntries(authors.map(a => [a.id, a])) : {};

  if (!Array.isArray(books)) return;
  books.forEach(b => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow flex justify-between items-start";
    const authorName = authorsMap[b.author_id] ? authorsMap[b.author_id].name : "—";
    card.innerHTML = `
      <div>
        <h4 class="font-semibold">${b.title}</h4>
        <p class="text-sm text-slate-600">${authorName} · ${b.published_year || ""}</p>
        <p class="text-sm mt-2 text-slate-700">${b.summary ? b.summary.slice(0, 130) + (b.summary.length > 130 ? "..." : "") : ""}</p>
      </div>
      <div class="flex flex-col gap-2">
        <button class="editBook bg-indigo-600 text-white px-3 py-1 rounded" data-id="${b.id}">Editar</button>
        <button class="delBook bg-rose-600 text-white px-3 py-1 rounded" data-id="${b.id}">Excluir</button>
      </div>
    `;
    booksList.appendChild(card);
  });

  document.querySelectorAll(".editBook").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const r = await fetchList("books", `?id=eq.${id}&limit=1`);
      const b = Array.isArray(r) && r[0];
      if (b) {
        await populateAuthorSelect();
        document.getElementById("bookId").value = b.id;
        document.getElementById("bookTitle").value = b.title || "";
        document.getElementById("bookSummary").value = b.summary || "";
        document.getElementById("bookGenre").value = b.genre || "";
        document.getElementById("bookYear").value = b.published_year || "";
        document.getElementById("bookAuthor").value = b.author_id || "";
        bookFormWrapper.classList.remove("hidden");
        viewBooks.classList.remove("hidden");
        viewAuthors.classList.add("hidden");
      }
    });
  });

  document.querySelectorAll(".delBook").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Excluir livro?")) return;
      await deleteRecord("books", id);
      showMsg("Livro excluído");
      loadBooks();
    });
  });
}

bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("bookId").value;
  const title = document.getElementById("bookTitle").value.trim();
  const summary = document.getElementById("bookSummary").value.trim();
  const genre = document.getElementById("bookGenre").value.trim();
  const yearStr = (document.getElementById("bookYear").value || "").toString().trim();
  const authorId = document.getElementById("bookAuthor").value || null;

  // Validações
  if (!title) {
    showMsg("Título é obrigatório");
    document.getElementById("bookTitle").focus();
    return;
  }

  if (yearStr !== "") {
    // apenas dígitos, sem sinal
    if (!/^\d+$/.test(yearStr)) {
      showMsg("Ano inválido. Use apenas números inteiros não-negativos.");
      document.getElementById("bookYear").focus();
      return;
    }
    const yearNum = Number(yearStr);
    if (!Number.isFinite(yearNum) || yearNum <= 1) {
      showMsg("Ano inválido. Deve ser > 1.");
      document.getElementById("bookYear").focus();
      return;
    }
  }

  const payload = {
    title,
    summary,
    genre,
    published_year: yearStr === "" ? null : Number(yearStr),
    author_id: authorId
  };

  try {
    if (id) {
      await updateRecord("books", id, payload);
      showMsg("Livro atualizado");
    } else {
      await createRecord("books", payload);
      showMsg("Livro criado");
    }
    bookForm.reset();
    bookFormWrapper.classList.add("hidden");
    loadBooks();
  } catch (err) {
    console.error(err);
    showMsg("Erro ao salvar livro");
  }
  // --- sanitize numeric input for published year (remove non-digits as user types)
  const bookYearInput = document.getElementById("bookYear");
  if (bookYearInput) {
    bookYearInput.addEventListener("input", () => {
      // remove tudo que não for dígito (impede sinais, letras, acentos)
      bookYearInput.value = bookYearInput.value.replace(/[^\d]/g, "");
    });
  }
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadAuthors();
  loadBooks();
});