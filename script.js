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

firebase.initializeApp(firebaseConfig);

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

const MAX_QUESTIONS = 20;


// =====================================================
// TEMPLATE PERTANYAAN
// =====================================================

function buatTemplatePertanyaan(nomor) {

    return `
        <div class="question-box">

            <div class="question-title">

                <h3>
                    Pertanyaan ${nomor}
                </h3>

                <span class="question-number">
                    Soal ${nomor}
                </span>

            </div>


            <label>Pertanyaan</label>

            <textarea
                class="q-text"
                placeholder="Masukkan pertanyaan...">
            </textarea>


            <label>Pilihan A</label>

            <input
                class="q-a"
                type="text"
                placeholder="Jawaban A"
            >


            <label>Pilihan B</label>

            <input
                class="q-b"
                type="text"
                placeholder="Jawaban B"
            >


            <label>Pilihan C</label>

            <input
                class="q-c"
                type="text"
                placeholder="Jawaban C"
            >


            <label>Pilihan D</label>

            <input
                class="q-d"
                type="text"
                placeholder="Jawaban D"
            >


            <label>Jawaban Benar</label>

            <select class="q-correct">

                <option value="A">A</option>

                <option value="B">B</option>

                <option value="C">C</option>

                <option value="D">D</option>

            </select>


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

    const list =
        document.getElementById("questionList");

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

    button
        .closest(".question-box")
        .remove();


    document
        .querySelectorAll(".question-box")
        .forEach((box, index) => {

            box.querySelector("h3")
                .textContent =
                "Pertanyaan " + (index + 1);


            box.querySelector(".question-number")
                .textContent =
                "Soal " + (index + 1);

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

        questions.push({

            question:
                box.querySelector(".q-text")
                    .value
                    .trim(),

            A:
                box.querySelector(".q-a")
                    .value
                    .trim(),

            B:
                box.querySelector(".q-b")
                    .value
                    .trim(),

            C:
                box.querySelector(".q-c")
                    .value
                    .trim(),

            D:
                box.querySelector(".q-d")
                    .value
                    .trim(),

            correct:
                box.querySelector(".q-correct")
                    .value

        });

    });


    return questions;
}


// =====================================================
// GENERATE QUIZ
// =====================================================

async function generateQuiz() {

    const title =
        document
            .getElementById("quizTitle")
            .value
            .trim() || "Quiz Kelas";


    const questions =
        ambilPertanyaanDariForm();


    // Cek jumlah soal

    if (questions.length === 0) {

        alert(
            "Tambahkan minimal 1 pertanyaan."
        );

        return;
    }


    // Cek setiap soal

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

        // Simpan quiz ke Firebase

        await database
            .ref("quizzes/" + quizId)
            .set({

                id: quizId,

                title: title,

                questions: questions,

                createdAt:
                    firebase.database.ServerValue.TIMESTAMP

            });


        // Buat link GitHub Pages

        const baseUrl =
            window.location.origin +
            window.location.pathname;


        generatedQuizLink =
            baseUrl +
            "?quiz=" +
            encodeURIComponent(quizId);


        // Tampilkan kode

        document
            .getElementById("quizCode")
            .textContent =
            quizId;


        // Hapus QR lama

        document
            .getElementById("qrcode")
            .innerHTML = "";


        // Buat QR baru

        new QRCode(

            document.getElementById("qrcode"),

            {

                text: generatedQuizLink,

                width: 230,

                height: 230,

                correctLevel:
                    QRCode.CorrectLevel.M

            }

        );


        // Pindah ke QR Page

        document
            .getElementById("adminPage")
            .classList.add("hidden");


        document
            .getElementById("qrPage")
            .classList.remove("hidden");


        alert(
            "Quiz berhasil dibuat dan disimpan ke Firebase!"
        );


    } catch (error) {

        console.error(error);

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


    // Kalau tidak ada ?quiz=
    // berarti halaman admin

    if (!quizId) {

        return;
    }


    try {

        // Ambil quiz dari Firebase

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


        // Pastikan data valid

        if (
            !quiz.questions ||
            quiz.questions.length === 0
        ) {

            throw new Error(
                "Quiz tidak memiliki pertanyaan."
            );
        }


        // Tampilkan informasi quiz

        document
            .getElementById("joinQuizTitle")
            .textContent =
            quiz.title;


        document
            .getElementById("joinQuizCode")
            .textContent =
            quiz.id;


        // Tampilkan halaman peserta

        document
            .getElementById("adminPage")
            .classList.add("hidden");


        document
            .getElementById("qrPage")
            .classList.add("hidden");


        document
            .getElementById("joinPage")
            .classList.remove("hidden");


    } catch (error) {

        console.error(error);

        alert(
            "Quiz tidak ditemukan.\n\n" +
            error.message
        );
    }
}


// =====================================================
// MULAI QUIZ
// =====================================================

function mulaiQuiz() {

    participant =
        document
            .getElementById("participantName")
            .value
            .trim();


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


    currentQuestion = 0;

    selectedAnswer = null;

    score = 0;


    document
        .getElementById("joinPage")
        .classList.add("hidden");


    document
        .getElementById("quizPage")
        .classList.remove("hidden");


    tampilkanSoal();
}


// =====================================================
// TAMPILKAN SOAL
// =====================================================

function tampilkanSoal() {

    const q =
        quiz.questions[currentQuestion];


    selectedAnswer = null;


    // Counter

    document
        .getElementById("questionCounter")
        .textContent =
        "Pertanyaan " +
        (currentQuestion + 1) +
        " dari " +
        quiz.questions.length;


    // Score

    document
        .getElementById("scoreLive")
        .textContent =
        "Skor: " + score;


    // Pertanyaan

    document
        .getElementById("questionText")
        .textContent =
        q.question;


    // Progress

    document
        .getElementById("progressBar")
        .style.width =
        (
            (currentQuestion + 1) /
            quiz.questions.length *
            100
        ) + "%";


    // Jawaban

    const answers =
        document.getElementById("answers");


    answers.innerHTML = "";


    ["A", "B", "C", "D"]
        .forEach(huruf => {

            const button =
                document.createElement("button");


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
        document.getElementById("nextButton");


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


// =====================================================
// PILIH JAWABAN
// =====================================================

function pilihJawaban(
    huruf,
    button
) {

    selectedAnswer = huruf;


    document
        .querySelectorAll(".answer-option")
        .forEach(btn => {

            btn.classList.remove(
                "selected"
            );

        });


    button.classList.add("selected");


    document
        .getElementById("nextButton")
        .disabled = false;
}


// =====================================================
// SOAL BERIKUTNYA
// =====================================================

function soalBerikutnya() {

    if (!selectedAnswer) {

        alert(
            "Pilih salah satu jawaban."
        );

        return;
    }


    const q =
        quiz.questions[currentQuestion];


    // Cek jawaban

    if (
        selectedAnswer ===
        q.correct
    ) {

        score++;

    }


    currentQuestion++;


    // Kalau sudah selesai

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
// TAMPILKAN HASIL
// =====================================================

async function tampilkanHasil() {

    const total =
        quiz.questions.length;


    const nilai =
        Math.round(
            (score / total) * 100
        );


    // Tampilkan hasil

    document
        .getElementById("quizPage")
        .classList.add("hidden");


    document
        .getElementById("resultPage")
        .classList.remove("hidden");


    document
        .getElementById("resultName")
        .textContent =
        participant;


    document
        .getElementById("finalScore")
        .textContent =
        nilai;


    document
        .getElementById("resultDetail")
        .innerHTML =

        "Benar: <b>" +
        score +
        "</b> dari <b>" +
        total +
        "</b> pertanyaan." +

        "<br>Nilai: <b>" +
        nilai +
        "</b>";


    // Simpan hasil ke Firebase

    try {

        await database
            .ref(
                "results/" +
                quiz.id
            )
            .push({

                name: participant,

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
}


// =====================================================
// DASHBOARD
// =====================================================

function bukaDashboard() {

    document
        .getElementById("qrPage")
        .classList.add("hidden");


    document
        .getElementById("dashboardPage")
        .classList.remove("hidden");


    document
        .getElementById("dashboardTitle")
        .textContent =
        quiz.title;


    document
        .getElementById("dashboardCode")
        .textContent =
        quiz.id;


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
    }


    currentResultListener =
        function(snapshot) {

            const results = [];


            snapshot.forEach(child => {

                const data =
                    child.val();


                results.push({

                    id: child.key,

                    name:
                        data.name ||
                        "Tanpa Nama",

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


            // Urutkan nilai tertinggi

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
        document.getElementById(
            "hasilTable"
        );


    table.innerHTML = "";


    if (results.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="4">

                    Belum ada peserta.

                </td>

            </tr>

        `;

        document
            .getElementById("jumlahPeserta")
            .textContent = "0";


        document
            .getElementById("nilaiTertinggi")
            .textContent = "0";


        return;
    }


    results.forEach(
        (result, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    <b>
                        ${escapeHTML(
                            result.name
                        )}
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


    // Jumlah peserta

    document
        .getElementById("jumlahPeserta")
        .textContent =
        results.length;


    // Nilai tertinggi

    document
        .getElementById("nilaiTertinggi")
        .textContent =
        results[0].score;
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent = text;


    return div.innerHTML;
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

    document
        .getElementById("dashboardPage")
        .classList.add("hidden");


    document
        .getElementById("qrPage")
        .classList.remove("hidden");

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

        /*
         * Kalau halaman dibuka tanpa ?quiz=
         * maka tampil sebagai halaman admin.
         *
         * Kalau dibuka dengan ?quiz=ABC123
         * maka mengambil quiz dari Firebase.
         */

        const params =
            new URLSearchParams(
                window.location.search
            );


        const quizId =
            params.get("quiz");


        if (quizId) {

            cekLinkQuiz();

        } else {

            // Admin mulai dengan 1 pertanyaan

            tambahPertanyaan();

        }

    }
);
