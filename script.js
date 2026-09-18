// =====================================================
// FIREBASE CONFIGURATION
// =====================================================

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


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();


// =====================================================
// VARIABLE
// =====================================================

let quiz = {
    id: "",
    title: "",
    questions: []
};

let currentQuestion = 0;
let selectedAnswer = null;
let participant = "";
let score = 0;
let generatedQuizLink = "";

let currentResultListener = null;

let questionTimer = null;
let timeLeft = 30;
let selectedCharacter = "🐱";
let questionProcessed = false;

const MAX_QUESTIONS = 20;

const CHARACTERS = [
    "🐱",
    "🐼",
    "🐸",
    "🐨",
    "🦊",
    "🐰",
    "🐯",
    "🐵"
];


// =====================================================
// HELPER
// =====================================================

function el(id) {
    return document.getElementById(id);
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
}


// =====================================================
// TEMPLATE PERTANYAAN
// =====================================================

function buatTemplatePertanyaan(nomor) {

    return `
        <div class="question-box">

            <div class="question-title">
                <h3>Pertanyaan ${nomor}</h3>

                <span class="question-number">
                    Soal ${nomor}
                </span>
            </div>

            <label>Pertanyaan</label>

            <textarea
                class="q-text"
                placeholder="Masukkan pertanyaan..."></textarea>


            <label>Pilihan A</label>

            <input
                class="q-a"
                type="text"
                placeholder="Jawaban A">


            <label>Pilihan B</label>

            <input
                class="q-b"
                type="text"
                placeholder="Jawaban B">


            <label>Pilihan C</label>

            <input
                class="q-c"
                type="text"
                placeholder="Jawaban C">


            <label>Pilihan D</label>

            <input
                class="q-d"
                type="text"
                placeholder="Jawaban D">


            <label>Jawaban Benar</label>

            <select class="q-correct">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>


            <label>Waktu Pertanyaan</label>

            <input
                class="q-time time-input"
                type="number"
                min="5"
                max="300"
                value="30"
                placeholder="30">

            <small class="time-help">
                Masukkan waktu 5 sampai 300 detik.
            </small>


            <button
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

    const list = el("questionList");

    if (!list) {
        console.error("Elemen #questionList tidak ditemukan.");
        return;
    }

    const jumlah =
        list.querySelectorAll(".question-box").length;

    if (jumlah >= MAX_QUESTIONS) {

        alert("Maksimal 20 pertanyaan.");

        return;
    }

    list.insertAdjacentHTML(
        "beforeend",
        buatTemplatePertanyaan(jumlah + 1)
    );
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

    document
        .querySelectorAll(".question-box")
        .forEach((box, index) => {

            const h3 =
                box.querySelector("h3");

            const number =
                box.querySelector(".question-number");

            if (h3) {
                h3.textContent =
                    "Pertanyaan " + (index + 1);
            }

            if (number) {
                number.textContent =
                    "Soal " + (index + 1);
            }
        });
}


// =====================================================
// AMBIL DATA PERTANYAAN
// =====================================================

function ambilPertanyaanDariForm() {

    const boxes =
        document.querySelectorAll(".question-box");

    const questions = [];

    boxes.forEach(box => {

        const timeInput =
            box.querySelector(".q-time");

        let waktu = 30;

        if (timeInput) {
            waktu = parseInt(timeInput.value) || 30;
        }

        if (waktu < 5) {
            waktu = 5;
        }

        if (waktu > 300) {
            waktu = 300;
        }

        questions.push({

            question:
                box.querySelector(".q-text")?.value.trim() || "",

            A:
                box.querySelector(".q-a")?.value.trim() || "",

            B:
                box.querySelector(".q-b")?.value.trim() || "",

            C:
                box.querySelector(".q-c")?.value.trim() || "",

            D:
                box.querySelector(".q-d")?.value.trim() || "",

            correct:
                box.querySelector(".q-correct")?.value || "A",

            time: waktu
        });
    });

    return questions;
}


// =====================================================
// GENERATE QUIZ
// =====================================================

async function generateQuiz() {

    const titleInput = el("quizTitle");

    const title =
        titleInput?.value.trim() || "Quiz Kelas";

    const questions =
        ambilPertanyaanDariForm();


    if (questions.length === 0) {

        alert(
            "Tambahkan minimal 1 pertanyaan."
        );

        return;
    }


    if (questions.length > MAX_QUESTIONS) {

        alert(
            "Maksimal 20 pertanyaan."
        );

        return;
    }


    // Cek setiap pertanyaan

    for (
        let i = 0;
        i < questions.length;
        i++
    ) {

        const q = questions[i];

        if (
            !q.question ||
            !q.A ||
            !q.B ||
            !q.C ||
            !q.D
        ) {

            alert(
                "Pertanyaan nomor " +
                (i + 1) +
                " belum lengkap."
            );

            return;
        }


        if (
            q.time < 5 ||
            q.time > 300
        ) {

            alert(
                "Waktu pertanyaan nomor " +
                (i + 1) +
                " harus antara 5 sampai 300 detik."
            );

            return;
        }
    }


    // Buat ID quiz

    const quizId =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


    quiz = {

        id: quizId,

        title: title,

        questions: questions
    };


    try {

        await database
            .ref("quizzes/" + quizId)
            .set({

                id: quizId,

                title: title,

                questions: questions,

                createdAt:
                    firebase.database.ServerValue.TIMESTAMP
            });


        // Buat link

        const baseUrl =
            window.location.origin +
            window.location.pathname;


        generatedQuizLink =
            baseUrl +
            "?quiz=" +
            encodeURIComponent(quizId);


        // Tampilkan kode

        if (el("quizCode")) {
            el("quizCode").textContent =
                quizId;
        }


        // QR Code

        if (el("qrcode")) {

            el("qrcode").innerHTML = "";

            if (typeof QRCode !== "undefined") {

                new QRCode(
                    el("qrcode"),
                    {
                        text: generatedQuizLink,
                        width: 230,
                        height: 230,
                        correctLevel:
                            QRCode.CorrectLevel.M
                    }
                );

            } else {

                console.warn(
                    "Library QRCode belum dimuat."
                );
            }
        }


        // Pindah halaman

        if (el("adminPage")) {
            el("adminPage")
                .classList.add("hidden");
        }

        if (el("qrPage")) {
            el("qrPage")
                .classList.remove("hidden");
        }


        alert(
            "Quiz berhasil dibuat dan disimpan ke Firebase!"
        );

    } catch (error) {

        console.error(
            "ERROR FIREBASE:",
            error
        );

        alert(
            "Gagal menyimpan quiz ke Firebase.\n\n" +
            error.message
        );
    }
}


// =====================================================
// CEK LINK QUIZ
// =====================================================

async function cekLinkQuiz() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const quizId =
        params.get("quiz");


    if (!quizId) {
        return;
    }


    try {

        const snapshot =
            await database
                .ref("quizzes/" + quizId)
                .once("value");


        if (!snapshot.exists()) {

            throw new Error(
                "Quiz tidak ditemukan."
            );
        }


        quiz = snapshot.val();


        if (
            !quiz.questions ||
            !Array.isArray(quiz.questions) ||
            quiz.questions.length === 0
        ) {

            throw new Error(
                "Quiz tidak memiliki pertanyaan."
            );
        }


        if (el("joinQuizTitle")) {

            el("joinQuizTitle")
                .textContent =
                quiz.title || "Quiz";
        }


        if (el("joinQuizCode")) {

            el("joinQuizCode")
                .textContent =
                quiz.id || quizId;
        }


        if (el("adminPage")) {

            el("adminPage")
                .classList.add("hidden");
        }


        if (el("qrPage")) {

            el("qrPage")
                .classList.add("hidden");
        }


        if (el("joinPage")) {

            el("joinPage")
                .classList.remove("hidden");
        }


        buatPilihanKarakter();

    } catch (error) {

        console.error(error);

        alert(
            "Quiz tidak ditemukan.\n\n" +
            error.message
        );
    }
}


// =====================================================
// PILIHAN KARAKTER
// =====================================================

function buatPilihanKarakter() {

    const joinPage = el("joinPage");

    if (!joinPage) return;


    // Kalau HTML sudah punya character-list,
    // gunakan yang sudah ada.

    let list =
        joinPage.querySelector(".character-list");


    // Kalau belum ada, buat otomatis.

    if (!list) {

        const nameInput =
            el("participantName");

        if (!nameInput) return;


        const parent =
            nameInput.parentElement || joinPage;


        list =
            document.createElement("div");

        list.className =
            "character-list";


        const label =
            document.createElement("label");

        label.textContent =
            "Pilih Karakter";


        parent.appendChild(label);

        parent.appendChild(list);
    }


    list.innerHTML = "";


    CHARACTERS.forEach(character => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "character-option";


        if (character === selectedCharacter) {

            button.classList.add("selected");
        }


        button.textContent =
            character;


        button.dataset.character =
            character;


        button.onclick = function() {

            pilihKarakter(this);
        };


        list.appendChild(button);
    });
}


// =====================================================
// PILIH KARAKTER
// =====================================================

function pilihKarakter(button) {

    if (!button) return;


    selectedCharacter =
        button.dataset.character ||
        button.textContent;


    document
        .querySelectorAll(".character-option")
        .forEach(item => {

            item.classList.remove("selected");
        });


    button.classList.add("selected");
}


// =====================================================
// MULAI QUIZ
// =====================================================

function mulaiQuiz() {

    const nameInput =
        el("participantName");


    participant =
        nameInput?.value.trim() || "";


    if (!participant) {

        alert(
            "Masukkan nama terlebih dahulu."
        );

        return;
    }


    if (participant.length < 2) {

        alert(
            "Nama minimal 2 karakter."
        );

        return;
    }


    // Jangan reset karakter di sini.

    currentQuestion = 0;

    selectedAnswer = null;

    score = 0;

    questionProcessed = false;


    if (el("joinPage")) {

        el("joinPage")
            .classList.add("hidden");
    }


    if (el("quizPage")) {

        el("quizPage")
            .classList.remove("hidden");
    }


    tampilkanSoal();
}


// =====================================================
// TIMER
// =====================================================

function hentikanTimer() {

    if (questionTimer) {

        clearInterval(questionTimer);

        questionTimer = null;
    }
}


function mulaiTimer() {

    hentikanTimer();


    const q =
        quiz.questions[currentQuestion];


    let waktu =
        parseInt(q.time);


    if (
        isNaN(waktu) ||
        waktu < 5
    ) {

        waktu = 30;
    }


    if (waktu > 300) {

        waktu = 300;
    }


    timeLeft = waktu;

    updateTimerDisplay();


    questionTimer =
        setInterval(() => {

            timeLeft--;

            updateTimerDisplay();


            if (timeLeft <= 0) {

                hentikanTimer();

                waktuHabis();
            }

        }, 1000);
}


function updateTimerDisplay() {

    const timer =
        el("questionTimer");


    const timerBar =
        el("timerBar");


    const q =
        quiz.questions[currentQuestion];


    let totalTime =
        parseInt(q?.time) || 30;


    if (timer) {

        timer.textContent =
            timeLeft;
    }


    if (timerBar) {

        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    (timeLeft / totalTime) * 100
                )
            );


        timerBar.style.width =
            percentage + "%";
    }
}


// =====================================================
// WAKTU HABIS
// =====================================================

function waktuHabis() {

    if (questionProcessed) {
        return;
    }


    questionProcessed = true;

    selectedAnswer = null;


    const buttons =
        document.querySelectorAll(
            ".answer-option, .answer-button"
        );


    buttons.forEach(button => {

        button.disabled = true;
    });


    setTimeout(() => {

        prosesJawaban();

    }, 300);
}


// =====================================================
// TAMPILKAN SOAL
// =====================================================

function tampilkanSoal() {

    hentikanTimer();


    const q =
        quiz.questions[currentQuestion];


    if (!q) {

        tampilkanHasil();

        return;
    }


    selectedAnswer = null;

    questionProcessed = false;


    // Counter

    if (el("questionCounter")) {

        el("questionCounter")
            .textContent =
            "Pertanyaan " +
            (currentQuestion + 1) +
            " dari " +
            quiz.questions.length;
    }


    // Score

    if (el("scoreLive")) {

        el("scoreLive")
            .textContent =
            "Skor: " + score;
    }


    // Pertanyaan

    if (el("questionText")) {

        el("questionText")
            .textContent =
            q.question;
    }


    // Progress

    if (el("progressBar")) {

        el("progressBar")
            .style.width =
            (
                (currentQuestion + 1) /
                quiz.questions.length *
                100
            ) + "%";
    }


    // Jawaban

    const answers =
        el("answers");


    if (!answers) {

        console.error(
            "Elemen #answers tidak ditemukan."
        );

        return;
    }


    answers.innerHTML = "";


    ["A", "B", "C", "D"]
        .forEach(huruf => {

            const button =
                document.createElement("button");


            button.type = "button";


            button.className =
                "answer-option";


            button.textContent =
                huruf +
                ". " +
                q[huruf];


            button.onclick =
                function() {

                    pilihJawaban(
                        huruf,
                        button
                    );
                };


            answers.appendChild(button);
        });


    // Tombol berikutnya

    const next =
        el("nextButton");


    if (next) {

        next.disabled = true;


        if (
            currentQuestion ===
            quiz.questions.length - 1
        ) {

            next.textContent =
                "🏁 Selesai";

        } else {

            next.textContent =
                "Berikutnya ➡️";
        }
    }


    // Timer

    mulaiTimer();
}


// =====================================================
// PILIH JAWABAN
// =====================================================

function pilihJawaban(
    huruf,
    button
) {

    if (questionProcessed) {
        return;
    }


    selectedAnswer = huruf;


    document
        .querySelectorAll(
            ".answer-option, .answer-button"
        )
        .forEach(btn => {

            btn.classList.remove(
                "selected"
            );
        });


    if (button) {

        button.classList.add(
            "selected"
        );
    }


    const next =
        el("nextButton");


    if (next) {

        next.disabled = false;
    }
}


// =====================================================
// PROSES JAWABAN
// =====================================================

function prosesJawaban() {

    if (questionProcessed === false) {

        questionProcessed = true;
    }


    hentikanTimer();


    const q =
        quiz.questions[currentQuestion];


    // Jawaban benar

    if (
        selectedAnswer &&
        selectedAnswer === q.correct
    ) {

        score++;
    }


    currentQuestion++;


    if (
        currentQuestion >=
        quiz.questions.length
    ) {

        tampilkanHasil();

    } else {

        tampilkanSoal();
    }
}


// =====================================================
// SOAL BERIKUTNYA
// =====================================================

function soalBerikutnya() {

    if (questionProcessed) {
        return;
    }


    if (!selectedAnswer) {

        alert(
            "Pilih salah satu jawaban."
        );

        return;
    }


    prosesJawaban();
}


// =====================================================
// TAMPILKAN HASIL
// =====================================================

async function tampilkanHasil() {

    hentikanTimer();


    const total =
        quiz.questions.length;


    const nilai =
        total > 0
            ? Math.round(
                (score / total) * 100
            )
            : 0;


    // Pindah halaman

    if (el("quizPage")) {

        el("quizPage")
            .classList.add("hidden");
    }


    if (el("resultPage")) {

        el("resultPage")
            .classList.remove("hidden");
    }


    // Nama

    if (el("resultName")) {

        el("resultName")
            .textContent =
            participant;
    }


    // Karakter

    if (el("resultCharacter")) {

        el("resultCharacter")
            .textContent =
            selectedCharacter;
    }


    // Nilai

    if (el("finalScore")) {

        el("finalScore")
            .textContent =
            nilai;
    }


    // Detail

    if (el("resultDetail")) {

        el("resultDetail")
            .innerHTML =
            "Benar: <b>" +
            score +
            "</b> dari <b>" +
            total +
            "</b> pertanyaan." +
            "<br>Nilai: <b>" +
            nilai +
            "</b>";
    }


    // Simpan ke Firebase

    try {

        await database
            .ref(
                "results/" +
                quiz.id
            )
            .push({

                name: participant,

                character:
                    selectedCharacter,

                correct: score,

                total: total,

                score: nilai,

                submittedAt:
                    firebase.database.ServerValue.TIMESTAMP
            });


        console.log(
            "Nilai berhasil dikirim ke Firebase."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Nilai gagal dikirim ke Firebase.\n\n" +
            error.message
        );
    }
}


// =====================================================
// SALIN LINK
// =====================================================

function salinLink() {

    if (!generatedQuizLink) {

        alert(
            "Generate quiz terlebih dahulu."
        );

        return;
    }


    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        navigator.clipboard
            .writeText(generatedQuizLink)
            .then(() => {

                alert(
                    "Link quiz berhasil disalin!"
                );

            })
            .catch(() => {

                prompt(
                    "Salin link berikut:",
                    generatedQuizLink
                );
            });

    } else {

        prompt(
            "Salin link berikut:",
            generatedQuizLink
        );
    }
}


// =====================================================
// DASHBOARD
// =====================================================

function bukaDashboard() {

    if (el("qrPage")) {

        el("qrPage")
            .classList.add("hidden");
    }


    if (el("dashboardPage")) {

        el("dashboardPage")
            .classList.remove("hidden");
    }


    if (el("dashboardTitle")) {

        el("dashboardTitle")
            .textContent =
            quiz.title;
    }


    if (el("dashboardCode")) {

        el("dashboardCode")
            .textContent =
            quiz.id;
    }


    dengarkanHasil();
}


// =====================================================
// AMBIL HASIL REALTIME
// =====================================================

function dengarkanHasil() {

    const hasilRef =
        database.ref(
            "results/" +
            quiz.id
        );


    // Hentikan listener lama

    if (currentResultListener) {

        hasilRef.off(
            "value",
            currentResultListener
        );

        currentResultListener = null;
    }


    currentResultListener =
        function(snapshot) {

            const results = [];


            snapshot.forEach(child => {

                const data =
                    child.val() || {};


                results.push({

                    id: child.key,

                    name:
                        data.name ||
                        "Tanpa Nama",

                    character:
                        data.character ||
                        "🐱",

                    correct:
                        Number(
                            data.correct || 0
                        ),

                    total:
                        Number(
                            data.total || 0
                        ),

                    score:
                        Number(
                            data.score || 0
                        ),

                    submittedAt:
                        data.submittedAt || 0
                });
            });


            // Nilai tertinggi

            results.sort(
                (a, b) => {

                    if (
                        b.score !==
                        a.score
                    ) {

                        return (
                            b.score -
                            a.score
                        );
                    }


                    return (
                        b.correct -
                        a.correct
                    );
                }
            );


            tampilkanRanking(results);
        };


    hasilRef.on(
        "value",
        currentResultListener
    );
}


// =====================================================
// TAMPILKAN RANKING
// =====================================================

function tampilkanRanking(results) {

    const table =
        el("hasilTable");


    if (!table) {

        console.error(
            "Elemen #hasilTable tidak ditemukan."
        );

        return;
    }


    table.innerHTML = "";


    if (results.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada peserta.
                </td>
            </tr>
        `;


        if (el("jumlahPeserta")) {

            el("jumlahPeserta")
                .textContent = "0";
        }


        if (el("nilaiTertinggi")) {

            el("nilaiTertinggi")
                .textContent = "0";
        }


        return;
    }


    results.forEach(
        (result, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${index + 1}
                </td>

                <td>
                    <span style="font-size:25px;">
                        ${escapeHTML(result.character)}
                    </span>
                </td>

                <td>
                    <b>
                        ${escapeHTML(result.name)}
                    </b>
                </td>

                <td>
                    ${result.correct}
                    /
                    ${result.total}
                </td>

                <td>
                    <b>
                        ${result.score}
                    </b>
                </td>
            `;


            table.appendChild(row);
        }
    );


    if (el("jumlahPeserta")) {

        el("jumlahPeserta")
            .textContent =
            results.length;
    }


    if (el("nilaiTertinggi")) {

        el("nilaiTertinggi")
            .textContent =
            results[0].score;
    }
}


// =====================================================
// HAPUS SEMUA HASIL
// =====================================================

function hapusSemuaHasil() {

    const yakin =
        confirm(
            "Apakah kamu yakin ingin menghapus SEMUA hasil quiz ini?"
        );


    if (!yakin) {
        return;
    }


    database
        .ref(
            "results/" +
            quiz.id
        )
        .remove()

        .then(() => {

            alert(
                "Semua hasil berhasil dihapus."
            );

        })

        .catch(error => {

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

    if (el("dashboardPage")) {

        el("dashboardPage")
            .classList.add("hidden");
    }


    if (el("qrPage")) {

        el("qrPage")
            .classList.remove("hidden");
    }
}


// =====================================================
// KEMBALI BUAT QUIZ
// =====================================================

function kembaliBuatQuiz() {

    window.location.href =
        window.location.pathname;
}


// =====================================================
// KEMBALI KE AWAL
// =====================================================

function kembaliKeAwal() {

    window.location.href =
        window.location.pathname;
}


// =====================================================
// SAAT HALAMAN DIBUKA
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Quiz website berhasil menjalankan JavaScript."
        );


        const params =
            new URLSearchParams(
                window.location.search
            );


        const quizId =
            params.get("quiz");


        if (quizId) {

            // Peserta

            cekLinkQuiz();

        } else {

            // Admin

            const list =
                el("questionList");


            if (
                list &&
                list.querySelectorAll(
                    ".question-box"
                ).length === 0
            ) {

                tambahPertanyaan();
            }
        }
    }
);
