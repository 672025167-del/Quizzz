// =====================================================
// QUIZ KELAS - SCRIPT.JS
// Firebase + QR Code + Timer + Karakter + Ranking
// =====================================================

// ================= FIREBASE CONFIGURATION =================

const firebaseConfig = {
    apiKey: "AIzaSyDfqwQu1JFNRj7rcMFsBs4Cr_4NnYHK7yo",
    authDomain: "josua-41db9.firebaseapp.com",
    databaseURL: "https://josua-41db9-default-rtdb.firebaseio.com",
    projectId: "josua-41db9",
    storageBucket: "josua-41db9.firebasestorage.app",
    messagingSenderId: "648462840825",
    appId: "1:648462840825:web:0f34c202c99a9bbc40c328",
    measurementId: "G-S4MNMV7WYK"
};

let database = null;

try {
    if (typeof firebase !== "undefined") {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
    } else {
        console.error("Firebase SDK tidak termuat.");
    }
} catch (error) {
    console.error("Firebase gagal diinisialisasi:", error);
}

// ================= VARIABLE =================

let quiz = {
    id: "",
    title: "",
    questions: []
};

let currentQuestion = 0;
let selectedAnswer = null;
let participant = "";
let selectedCharacter = "🐱";
let score = 0;
let generatedQuizLink = "";

let timerInterval = null;
let remainingTime = 30;
let answerProcessed = false;

let currentResultListener = null;
let currentResultRef = null;

const MAX_QUESTIONS = 20;
const DEFAULT_TIME = 30;
const MIN_TIME = 5;
const MAX_TIME = 300;


// =====================================================
// TEMPLATE PERTANYAAN
// =====================================================

function buatTemplatePertanyaan(nomor) {
    return `
        <div class="question-box">
            <div class="question-title">
                <h3>Pertanyaan ${nomor}</h3>
                <span class="question-number">Soal ${nomor}</span>
            </div>

            <label>Pertanyaan</label>
            <textarea class="q-text" placeholder="Masukkan pertanyaan..."></textarea>

            <label>Pilihan A</label>
            <input class="q-a" type="text" placeholder="Jawaban A">

            <label>Pilihan B</label>
            <input class="q-b" type="text" placeholder="Jawaban B">

            <label>Pilihan C</label>
            <input class="q-c" type="text" placeholder="Jawaban C">

            <label>Pilihan D</label>
            <input class="q-d" type="text" placeholder="Jawaban D">

            <label>Jawaban Benar</label>
            <select class="q-correct">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>

            <label>⏱️ Waktu Soal (detik)</label>
            <input
                class="q-time time-input"
                type="number"
                min="${MIN_TIME}"
                max="${MAX_TIME}"
                value="${DEFAULT_TIME}"
                placeholder="Contoh: 30"
            >
            <small class="time-help">
                Minimal ${MIN_TIME} detik, maksimal ${MAX_TIME} detik.
            </small>

            <button
                type="button"
                class="danger remove-btn"
                onclick="hapusPertanyaan(this)">
                🗑️ Hapus Pertanyaan
            </button>
        </div>
    `;
}


// =====================================================
// TAMBAH PERTANYAAN
// =====================================================

function tambahPertanyaan() {
    const list = document.getElementById("questionList");

    if (!list) {
        console.error("Elemen #questionList tidak ditemukan.");
        alert("Error: questionList tidak ditemukan di HTML.");
        return;
    }

    const jumlah = list.querySelectorAll(".question-box").length;

    if (jumlah >= MAX_QUESTIONS) {
        alert(`Maksimal ${MAX_QUESTIONS} pertanyaan.`);
        return;
    }

    list.insertAdjacentHTML(
        "beforeend",
        buatTemplatePertanyaan(jumlah + 1)
    );

    nomorUlangPertanyaan();
}


// =====================================================
// HAPUS PERTANYAAN
// =====================================================

function hapusPertanyaan(button) {
    if (!button) return;

    const box = button.closest(".question-box");
    if (box) {
        box.remove();
    }

    nomorUlangPertanyaan();
}


// =====================================================
// NOMOR ULANG PERTANYAAN
// =====================================================

function nomorUlangPertanyaan() {
    document.querySelectorAll(".question-box").forEach((box, index) => {
        const nomor = index + 1;

        const title = box.querySelector("h3");
        const badge = box.querySelector(".question-number");

        if (title) title.textContent = `Pertanyaan ${nomor}`;
        if (badge) badge.textContent = `Soal ${nomor}`;
    });
}


// =====================================================
// AMBIL DATA PERTANYAAN
// =====================================================

function ambilPertanyaanDariForm() {
    const boxes = document.querySelectorAll(".question-box");
    const questions = [];

    boxes.forEach((box) => {
        let time = parseInt(
            box.querySelector(".q-time")?.value,
            10
        );

        if (!Number.isFinite(time)) {
            time = DEFAULT_TIME;
        }

        time = Math.max(MIN_TIME, Math.min(MAX_TIME, time));

        questions.push({
            question: box.querySelector(".q-text")?.value.trim() || "",
            A: box.querySelector(".q-a")?.value.trim() || "",
            B: box.querySelector(".q-b")?.value.trim() || "",
            C: box.querySelector(".q-c")?.value.trim() || "",
            D: box.querySelector(".q-d")?.value.trim() || "",
            correct: box.querySelector(".q-correct")?.value || "A",
            time: time
        });
    });

    return questions;
}


// =====================================================
// GENERATE QUIZ
// =====================================================

async function generateQuiz() {
    const titleElement = document.getElementById("quizTitle");

    const title = titleElement
        ? titleElement.value.trim() || "Quiz Kelas"
        : "Quiz Kelas";

    const questions = ambilPertanyaanDariForm();

    if (questions.length === 0) {
        alert("Tambahkan minimal 1 pertanyaan.");
        return;
    }

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        if (!q.question || !q.A || !q.B || !q.C || !q.D) {
            alert(`Pertanyaan nomor ${i + 1} belum lengkap.`);
            return;
        }

        if (
            !Number.isFinite(q.time) ||
            q.time < MIN_TIME ||
            q.time > MAX_TIME
        ) {
            alert(
                `Waktu pertanyaan nomor ${i + 1} harus ${MIN_TIME}-${MAX_TIME} detik.`
            );
            return;
        }
    }

    const quizId = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    quiz = {
        id: quizId,
        title: title,
        questions: questions
    };

    try {
        if (!database) {
            throw new Error(
                "Firebase belum terhubung. Pastikan internet aktif dan Firebase SDK termuat."
            );
        }

        await database
            .ref("quizzes/" + quizId)
            .set({
                id: quizId,
                title: title,
                questions: questions,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

        // Link akan mengikuti alamat website yang sedang dibuka.
        const url = new URL(window.location.href);
        url.search = "";
        url.hash = "";
        generatedQuizLink =
            url.toString().replace(/\/$/, "") +
            "?quiz=" +
            encodeURIComponent(quizId);

        const quizCode = document.getElementById("quizCode");
        if (quizCode) {
            quizCode.textContent = quizId;
        }

        const qrContainer = document.getElementById("qrcode");

        if (!qrContainer) {
            throw new Error("Elemen #qrcode tidak ditemukan.");
        }

        qrContainer.innerHTML = "";

        if (typeof QRCode === "undefined") {
            throw new Error(
                "Library QR Code belum termuat. Pastikan internet aktif dan library QRCode ada di index.html."
            );
        }

        new QRCode(qrContainer, {
            text: generatedQuizLink,
            width: 230,
            height: 230,
            correctLevel: QRCode.CorrectLevel.M
        });

        document.getElementById("adminPage")?.classList.add("hidden");
        document.getElementById("qrPage")?.classList.remove("hidden");

        // Peringatan jika dibuka dari file lokal/localhost.
        if (
            window.location.protocol === "file:" ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
        ) {
            alert(
                "Quiz berhasil dibuat!\n\n" +
                "Tapi QR belum bisa dipakai HP lain karena website masih dibuka dari komputer lokal.\n\n" +
                "Upload ke GitHub Pages terlebih dahulu agar QR bisa dipindai mahasiswa."
            );
        } else {
            alert("Quiz berhasil dibuat dan QR Code siap digunakan!");
        }

    } catch (error) {
        console.error("Generate quiz error:", error);
        alert(
            "Gagal membuat quiz.\n\n" +
            error.message
        );
    }
}


// =====================================================
// CEK LINK QUIZ PESERTA
// =====================================================

async function cekLinkQuiz() {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("quiz");

    if (!quizId) {
        return;
    }

    try {
        if (!database) {
            throw new Error(
                "Firebase belum terhubung. Pastikan internet aktif dan Firebase SDK termuat."
            );
        }

        const snapshot = await database
            .ref("quizzes/" + quizId)
            .once("value");

        if (!snapshot.exists()) {
            throw new Error("Quiz tidak ditemukan.");
        }

        const data = snapshot.val();

        quiz = {
            id: data.id || quizId,
            title: data.title || "Quiz Kelas",
            questions: Array.isArray(data.questions)
                ? data.questions
                : Object.values(data.questions || {})
        };

        if (!quiz.questions.length) {
            throw new Error("Quiz tidak memiliki pertanyaan.");
        }

        document.getElementById("joinQuizTitle").textContent = quiz.title;
        document.getElementById("joinQuizCode").textContent = quiz.id;

        document.getElementById("adminPage")?.classList.add("hidden");
        document.getElementById("qrPage")?.classList.add("hidden");
        document.getElementById("dashboardPage")?.classList.add("hidden");
        document.getElementById("resultPage")?.classList.add("hidden");
        document.getElementById("quizPage")?.classList.add("hidden");
        document.getElementById("joinPage")?.classList.remove("hidden");

    } catch (error) {
        console.error("Load quiz error:", error);

        document.getElementById("adminPage")?.classList.add("hidden");
        document.getElementById("joinPage")?.classList.remove("hidden");

        alert(
            "Quiz tidak ditemukan atau gagal dimuat.\n\n" +
            error.message
        );
    }
}


// =====================================================
// PILIH KARAKTER
// =====================================================

function pilihKarakter(button) {
    if (!button) return;

    document
        .querySelectorAll(".character-option")
        .forEach((btn) => {
            btn.classList.remove("selected");
        });

    button.classList.add("selected");

    selectedCharacter =
        button.dataset.character || "🐱";
}


// =====================================================
// MULAI QUIZ
// =====================================================

function mulaiQuiz() {
    const nameElement =
        document.getElementById("participantName");

    participant =
        nameElement?.value.trim() || "";

    if (!participant) {
        alert("Masukkan nama terlebih dahulu.");
        nameElement?.focus();
        return;
    }

    if (participant.length < 2) {
        alert("Nama minimal 2 karakter.");
        nameElement?.focus();
        return;
    }

    const selected =
        document.querySelector(".character-option.selected");

    if (selected) {
        selectedCharacter =
            selected.dataset.character || "🐱";
    }

    currentQuestion = 0;
    selectedAnswer = null;
    score = 0;

    clearTimer();

    document.getElementById("joinPage")?.classList.add("hidden");
    document.getElementById("quizPage")?.classList.remove("hidden");

    tampilkanSoal();
}


// =====================================================
// TAMPILKAN SOAL
// =====================================================

function tampilkanSoal() {
    clearTimer();

    const q = quiz.questions[currentQuestion];

    if (!q) {
        tampilkanHasil();
        return;
    }

    selectedAnswer = null;
    answerProcessed = false;

    const total = quiz.questions.length;

    const counter =
        document.getElementById("questionCounter");

    const liveScore =
        document.getElementById("scoreLive");

    const questionText =
        document.getElementById("questionText");

    const progress =
        document.getElementById("progressBar");

    const answers =
        document.getElementById("answers");

    const next =
        document.getElementById("nextButton");

    if (counter) {
        counter.textContent =
            `Pertanyaan ${currentQuestion + 1} dari ${total}`;
    }

    if (liveScore) {
        liveScore.textContent = `Skor: ${score}`;
    }

    if (questionText) {
        questionText.textContent = q.question || "";
    }

    if (progress) {
        progress.style.width =
            `${((currentQuestion + 1) / total) * 100}%`;
    }

    if (!answers) {
        console.error("Elemen #answers tidak ditemukan.");
        return;
    }

    answers.innerHTML = "";

    ["A", "B", "C", "D"].forEach((huruf) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "answer-option";
        button.textContent =
            `${huruf}. ${q[huruf] || ""}`;

        button.addEventListener("click", () => {
            pilihJawaban(huruf, button);
        });

        answers.appendChild(button);
    });

    if (next) {
        next.disabled = true;
        next.textContent =
            currentQuestion === total - 1
                ? "🏁 Selesai"
                : "Berikutnya ➡️";
    }

    const time =
        parseInt(q.time, 10) || DEFAULT_TIME;

    mulaiTimer(
        Math.max(MIN_TIME, Math.min(MAX_TIME, time))
    );
}


// =====================================================
// TIMER
// =====================================================

function mulaiTimer(seconds) {
    clearTimer();

    remainingTime = seconds;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        remainingTime--;

        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearTimer();
            waktuHabis();
        }
    }, 1000);
}


function updateTimerDisplay() {
    const timer =
        document.getElementById("questionTimer");

    const bar =
        document.getElementById("timerBar");

    if (timer) {
        timer.textContent = Math.max(0, remainingTime);
    }

    if (bar) {
        const q = quiz.questions[currentQuestion];

        const totalTime =
            parseInt(q?.time, 10) || DEFAULT_TIME;

        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    (remainingTime / totalTime) * 100
                )
            );

        bar.style.width = percentage + "%";
    }
}


function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


function waktuHabis() {
    if (answerProcessed) return;

    alert(
        `⏰ Waktu untuk pertanyaan ${currentQuestion + 1} habis!`
    );

    // Tidak menjawab = salah.
    prosesJawaban(null);
}


// =====================================================
// PILIH JAWABAN
// =====================================================

function pilihJawaban(huruf, button) {
    if (answerProcessed) return;

    selectedAnswer = huruf;

    document
        .querySelectorAll(".answer-option")
        .forEach((btn) => {
            btn.classList.remove("selected");
        });

    if (button) {
        button.classList.add("selected");
    }

    const next =
        document.getElementById("nextButton");

    if (next) {
        next.disabled = false;
    }
}


// =====================================================
// PROSES JAWABAN
// =====================================================

function prosesJawaban(jawaban) {
    if (answerProcessed) return;

    answerProcessed = true;
    clearTimer();

    const q = quiz.questions[currentQuestion];

    if (jawaban && jawaban === q.correct) {
        score++;
    }

    currentQuestion++;

    if (currentQuestion >= quiz.questions.length) {
        tampilkanHasil();
    } else {
        tampilkanSoal();
    }
}


// =====================================================
// SOAL BERIKUTNYA
// =====================================================

function soalBerikutnya() {
    if (answerProcessed) return;

    if (!selectedAnswer) {
        alert("Pilih salah satu jawaban.");
        return;
    }

    prosesJawaban(selectedAnswer);
}


// =====================================================
// TAMPILKAN HASIL
// =====================================================

async function tampilkanHasil() {
    clearTimer();

    const total = quiz.questions.length;

    const nilai =
        total > 0
            ? Math.round((score / total) * 100)
            : 0;

    document.getElementById("quizPage")?.classList.add("hidden");
    document.getElementById("resultPage")?.classList.remove("hidden");

    const resultName =
        document.getElementById("resultName");

    const resultCharacter =
        document.getElementById("resultCharacter");

    const finalScore =
        document.getElementById("finalScore");

    const resultDetail =
        document.getElementById("resultDetail");

    if (resultName) {
        resultName.textContent = participant;
    }

    if (resultCharacter) {
        resultCharacter.textContent = selectedCharacter;
    }

    if (finalScore) {
        finalScore.textContent = nilai;
    }

    if (resultDetail) {
        resultDetail.innerHTML =
            `Benar: <b>${score}</b> dari <b>${total}</b> pertanyaan.` +
            `<br>Nilai: <b>${nilai}</b>` +
            `<br>Karakter: <b>${escapeHTML(selectedCharacter)}</b>`;
    }

    try {
        if (!database) {
            throw new Error(
                "Firebase belum terhubung, jadi hasil belum dapat disimpan."
            );
        }

        await database
            .ref("results/" + quiz.id)
            .push({
                name: participant,
                character: selectedCharacter,
                correct: score,
                total: total,
                score: nilai,
                submittedAt:
                    firebase.database.ServerValue.TIMESTAMP
            });

        console.log("Nilai berhasil dikirim ke Firebase.");

    } catch (error) {
        console.error("Save result error:", error);

        alert(
            "Quiz selesai, tetapi nilai gagal dikirim ke Firebase.\n\n" +
            error.message
        );
    }
}


// =====================================================
// SALIN LINK
// =====================================================

function salinLink() {
    if (!generatedQuizLink) {
        alert("Generate quiz terlebih dahulu.");
        return;
    }

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {
        navigator.clipboard
            .writeText(generatedQuizLink)
            .then(() => {
                alert("Link quiz berhasil disalin!");
            })
            .catch(() => {
                fallbackCopyLink();
            });
    } else {
        fallbackCopyLink();
    }
}


function fallbackCopyLink() {
    prompt(
        "Salin link quiz berikut:",
        generatedQuizLink
    );
}


// =====================================================
// DASHBOARD
// =====================================================

function bukaDashboard() {
    document.getElementById("qrPage")?.classList.add("hidden");
    document.getElementById("dashboardPage")?.classList.remove("hidden");

    const title =
        document.getElementById("dashboardTitle");

    const code =
        document.getElementById("dashboardCode");

    if (title) title.textContent = quiz.title;
    if (code) code.textContent = quiz.id;

    dengarkanHasil();
}


// =====================================================
// AMBIL HASIL REALTIME
// =====================================================

function dengarkanHasil() {
    if (!quiz.id) return;

    // Matikan listener lama.
    if (currentResultRef && currentResultListener) {
        currentResultRef.off(
            "value",
            currentResultListener
        );
    }

    currentResultRef =
        database.ref("results/" + quiz.id);

    currentResultListener = (snapshot) => {
        const results = [];

        snapshot.forEach((child) => {
            const data = child.val() || {};

            results.push({
                id: child.key,
                name: data.name || "Tanpa Nama",
                character: data.character || "🐱",
                correct: Number(data.correct || 0),
                total: Number(data.total || 0),
                score: Number(data.score || 0),
                submittedAt: data.submittedAt || 0
            });
        });

        results.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            if (b.correct !== a.correct) {
                return b.correct - a.correct;
            }

            return a.submittedAt - b.submittedAt;
        });

        tampilkanRanking(results);
    };

    currentResultRef.on(
        "value",
        currentResultListener
    );
}


// =====================================================
// TAMPILKAN RANKING
// =====================================================

function tampilkanRanking(results) {
    const table =
        document.getElementById("hasilTable");

    if (!table) return;

    table.innerHTML = "";

    if (results.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada peserta.
                </td>
            </tr>
        `;

        document.getElementById("jumlahPeserta").textContent = "0";
        document.getElementById("nilaiTertinggi").textContent = "0";

        return;
    }

    results.forEach((result, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="character-cell">
                ${escapeHTML(result.character)}
            </td>
            <td>
                <b>${escapeHTML(result.name)}</b>
            </td>
            <td>
                ${result.correct}/${result.total}
            </td>
            <td>
                <b>${result.score}</b>
            </td>
        `;

        table.appendChild(row);
    });

    const jumlah =
        document.getElementById("jumlahPeserta");

    const tertinggi =
        document.getElementById("nilaiTertinggi");

    if (jumlah) {
        jumlah.textContent = results.length;
    }

    if (tertinggi) {
        tertinggi.textContent = results[0].score;
    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}


// =====================================================
// HAPUS SEMUA HASIL
// =====================================================

function hapusSemuaHasil() {
    if (!quiz.id) {
        alert("Quiz belum tersedia.");
        return;
    }

    const yakin = confirm(
        "Apakah kamu yakin ingin menghapus SEMUA hasil quiz ini?"
    );

    if (!yakin) return;

    database
        .ref("results/" + quiz.id)
        .remove()
        .then(() => {
            alert("Semua hasil berhasil dihapus.");
        })
        .catch((error) => {
            console.error(error);

            alert(
                "Gagal menghapus hasil:\n" +
                error.message
            );
        });
}


// =====================================================
// KEMBALI KE QR
// =====================================================

function kembaliKeQR() {
    document.getElementById("dashboardPage")?.classList.add("hidden");
    document.getElementById("qrPage")?.classList.remove("hidden");
}


// =====================================================
// KEMBALI BUAT QUIZ
// =====================================================

function kembaliBuatQuiz() {
    clearTimer();

    if (currentResultRef && currentResultListener) {
        currentResultRef.off(
            "value",
            currentResultListener
        );
    }

    window.location.href = window.location.pathname;
}


// =====================================================
// KEMBALI KE AWAL
// =====================================================

function kembaliKeAwal() {
    clearTimer();

    window.location.href = window.location.pathname;
}


// =====================================================
// SAAT HALAMAN DIBUKA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    // Pastikan halaman admin langsung memiliki 1 kotak pertanyaan.
    const questionList = document.getElementById("questionList");
    if (questionList && questionList.querySelectorAll(".question-box").length === 0) {
        tambahPertanyaan();
    }

    // Jika URL memiliki ?quiz=XXXX, buka halaman peserta.
    cekLinkQuiz().catch((error) => {
        console.error("cekLinkQuiz:", error);
    });
});
