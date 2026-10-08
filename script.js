const SUPABASE_URL = "https://drmhmtjhubswubvlkqvq.supabase.co";
const SUPABASE_KEY = "sb_publishable_xCMcL-qx6NDx7UWW1Dbvmw_j0pk29nP";


// =============================
// BASIC NAVIGATION
// =============================

function teacherLogin() {
    window.location.href = "teacher.html";
}

function studentLogin() {
    window.location.href = "student.html";
}

function loginTeacher() {

    const teacherName =
        document.getElementById("teacherName").value.trim();

    const teacherPassword =
        document.getElementById("teacherPassword").value.trim();

    if (teacherName === "" || teacherPassword === "") {
        alert("Please enter your username and password.");
        return;
    }

    window.location.href = "teacher-dashboard.html";
}

function goHome() {
    window.location.href = "index.html";
}


// =============================
// CREATE SESSION
// =============================

function createSession() {

    const sessionId =
        "SESSION-" + Date.now();

    const session = {
        sessionId: sessionId,
        createdAt: Date.now(),
        status: "Active"
    };

    localStorage.setItem(
        "attendanceSession",
        JSON.stringify(session)
    );

    window.location.href =
        "qr-session.html";
}


// =============================
// VIEW ATTENDANCE
// =============================

function viewAttendance() {

    const session =
        JSON.parse(
            localStorage.getItem("attendanceSession")
        );

    if (!session) {

        alert(
            "No attendance session found."
        );

        return;
    }

    window.location.href =
        "attendance.html?session=" +
        encodeURIComponent(
            session.sessionId
        );
}


// =============================
// END SESSION
// =============================

function endSession() {

    const session =
        JSON.parse(
            localStorage.getItem("attendanceSession")
        );

    if (!session) {

        alert(
            "No attendance session found."
        );

        return;
    }

    if (session.status === "Ended") {

        alert(
            "This attendance session has already ended."
        );

        return;
    }

    session.status = "Ended";

    localStorage.setItem(
        "attendanceSession",
        JSON.stringify(session)
    );

    alert(
        "Attendance session ended successfully."
    );

    const status =
        document.getElementById(
            "dashboardSessionStatus"
        );

    if (status) {
        status.textContent = "Ended";
    }
}


// =============================
// GENERATE QR
// =============================

function generateQR() {

    const qrContainer =
        document.getElementById("qrcode");

    if (!qrContainer) {
        return;
    }

    qrContainer.innerHTML = "";

    const session =
        JSON.parse(
            localStorage.getItem("attendanceSession")
        );

    if (!session) {

        qrContainer.innerHTML =
            "<p>No attendance session found.</p>";

        return;
    }

    const qrTimestamp =
        Date.now();

    const studentURL =
        "https://nibhathaman.github.io/AttendX/student.html" +
        "?session=" +
        encodeURIComponent(session.sessionId) +
        "&time=" +
        qrTimestamp;

    new QRCode(
        qrContainer,
        {
            text: studentURL,
            width: 200,
            height: 200
        }
    );
}


// =============================
// STUDENT LOGIN
// =============================

async function loginStudent() {

    const name =
        document.getElementById(
            "studentName"
        ).value.trim();

    const rollNumber =
        document.getElementById(
            "studentRoll"
        ).value.trim();

    const password =
        document.getElementById(
            "studentPassword"
        ).value.trim();

    if (
        name === "" ||
        rollNumber === "" ||
        password === ""
    ) {

        alert(
            "Please enter your name, roll number and password."
        );

        return;
    }

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const sessionId =
        urlParams.get("session");

    const qrTimestamp =
        Number(
            urlParams.get("time")
        );

    if (!sessionId) {

        alert(
            "No attendance session found. Please scan the QR code again."
        );

        return;
    }

    if (
        !qrTimestamp ||
        Date.now() - qrTimestamp > 30000
    ) {

        alert(
            "This QR has expired. Please scan the latest QR."
        );

        return;
    }

    const lockedStudent =
        JSON.parse(
            localStorage.getItem(
                "lockedStudent"
            )
        );

    if (lockedStudent) {

        if (
            lockedStudent.rollNumber !== rollNumber ||
            lockedStudent.password !== password
        ) {

            alert(
                "This device is already linked to another student account."
            );

            return;
        }

    } else {

        const studentData = {
            name: name,
            rollNumber: rollNumber,
            password: password
        };

        localStorage.setItem(
            "lockedStudent",
            JSON.stringify(studentData)
        );

    }

    const alreadyMarked =
        await checkAttendanceAlreadyMarked(
            rollNumber,
            sessionId
        );

    if (alreadyMarked) {

        alert(
            "Attendance already marked for this session."
        );

        return;
    }

    const saved =
        await saveAttendanceToSupabase(
            name,
            rollNumber,
            sessionId
        );

    if (!saved) {

        alert(
            "Attendance could not be saved. Please try again."
        );

        return;
    }

    localStorage.setItem(
        "studentName",
        name
    );

    localStorage.setItem(
        "studentRoll",
        rollNumber
    );

    window.location.href =
        "attendance-success.html";
}


// =============================
// SAVE ATTENDANCE
// =============================

async function saveAttendanceToSupabase(
    name,
    rollNumber,
    sessionId
) {

    const attendanceData = {

        name: name,

        roll_number: rollNumber,

        status: "Present",

        session_id: sessionId,

        attendance_time:
            new Date().toLocaleString()
    };

    try {

        const response =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/attendance",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_KEY,

                        "Prefer":
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            attendanceData
                        )
                }
            );

        if (!response.ok) {

            console.error(
                "Supabase Error:",
                await response.text()
            );

            return false;
        }

        return true;

    } catch (error) {

        console.error(
            "Supabase connection error:",
            error
        );

        return false;
    }
}


// =============================
// CHECK DUPLICATE
// =============================

async function checkAttendanceAlreadyMarked(
    rollNumber,
    sessionId
) {

    try {

        const url =
            SUPABASE_URL +
            "/rest/v1/attendance" +
            "?select=id" +
            "&roll_number=eq." +
            encodeURIComponent(rollNumber) +
            "&session_id=eq." +
            encodeURIComponent(sessionId);

        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_KEY
                    }
                }
            );

        if (!response.ok) {
            return false;
        }

        const data =
            await response.json();

        return data.length > 0;

    } catch (error) {

        console.error(error);

        return false;
    }
}


// =============================
// QR FUNCTIONS
// =============================

function getSessionIdFromQR(decodedText) {

    try {

        const url =
            new URL(decodedText);

        return url.searchParams.get(
            "session"
        );

    } catch (error) {

        console.error(
            "Invalid QR:",
            error
        );

        return null;
    }
}

function getQRTimestamp(decodedText) {

    try {

        const url =
            new URL(decodedText);

        return Number(
            url.searchParams.get("time")
        );

    } catch (error) {

        return null;
    }
}

function isQRExpired(decodedText) {

    const timestamp =
        getQRTimestamp(decodedText);

    if (!timestamp) {
        return true;
    }

    return (
        Date.now() - timestamp
    ) > 30000;
}


// =============================
// CAMERA SCANNER
// =============================

function startScanner() {

    const scanner =
        new Html5Qrcode("reader");

    scanner.start(

        { facingMode: "environment" },

        {
            fps: 10,
            qrbox: 250
        },

        async (decodedText) => {

            await scanner.stop();

            const lockedStudent =
                JSON.parse(
                    localStorage.getItem(
                        "lockedStudent"
                    )
                );

            if (!lockedStudent) {

                alert(
                    "No student account is linked to this device."
                );

                return;
            }

            const sessionId =
                getSessionIdFromQR(
                    decodedText
                );

            if (!sessionId) {

                alert(
                    "Invalid attendance QR code."
                );

                return;
            }

            if (
                isQRExpired(
                    decodedText
                )
            ) {

                alert(
                    "This QR has expired. Please scan the latest QR."
                );

                return;
            }

            const alreadyMarked =
                await checkAttendanceAlreadyMarked(
                    lockedStudent.rollNumber,
                    sessionId
                );

            if (alreadyMarked) {

                alert(
                    "Attendance already marked for this session."
                );

                return;
            }

            const saved =
                await saveAttendanceToSupabase(
                    lockedStudent.name,
                    lockedStudent.rollNumber,
                    sessionId
                );

            if (!saved) {

                alert(
                    "Attendance could not be saved. Please try again."
                );

                return;
            }

            localStorage.setItem(
                "studentName",
                lockedStudent.name
            );

            localStorage.setItem(
                "studentRoll",
                lockedStudent.rollNumber
            );

            window.location.href =
                "attendance-success.html";
        },

        () => {}
    );
}


if (
    document.getElementById("reader")
) {
    startScanner();
}


// =============================
// IMAGE QR SCANNER
// =============================

async function scanQRImage() {

    const fileInput =
        document.getElementById(
            "qrImage"
        );

    if (
        !fileInput ||
        fileInput.files.length === 0
    ) {

        alert(
            "Please select a QR image first."
        );

        return;
    }

    const scanner =
        new Html5Qrcode("reader");

    scanner.scanFile(
        fileInput.files[0],
        true
    )
    .then(
        async (decodedText) => {

            const lockedStudent =
                JSON.parse(
                    localStorage.getItem(
                        "lockedStudent"
                    )
                );

            if (!lockedStudent) {

                alert(
                    "No student account is linked to this device."
                );

                scanner.clear();

                return;
            }

            const sessionId =
                getSessionIdFromQR(
                    decodedText
                );

            if (!sessionId) {

                alert(
                    "Invalid attendance QR code."
                );

                scanner.clear();

                return;
            }

            if (
                isQRExpired(
                    decodedText
                )
            ) {

                alert(
                    "This QR has expired. Please scan the latest QR."
                );

                scanner.clear();

                return;
            }

            const alreadyMarked =
                await checkAttendanceAlreadyMarked(
                    lockedStudent.rollNumber,
                    sessionId
                );

            if (alreadyMarked) {

                alert(
                    "Attendance already marked for this session."
                );

                scanner.clear();

                return;
            }

            const saved =
                await saveAttendanceToSupabase(
                    lockedStudent.name,
                    lockedStudent.rollNumber,
                    sessionId
                );

            if (!saved) {

                alert(
                    "Attendance could not be saved. Please try again."
                );

                scanner.clear();

                return;
            }

            scanner.clear();

            localStorage.setItem(
                "studentName",
                lockedStudent.name
            );

            localStorage.setItem(
                "studentRoll",
                lockedStudent.rollNumber
            );

            window.location.href =
                "attendance-success.html";
        }
    )
    .catch(
        error => {

            console.error(error);

            alert(
                "QR could not be detected. Try a clearer screenshot."
            );

            scanner.clear();
        }
    );
}


// =============================
// DASHBOARD
// =============================

if (
    document.getElementById(
        "dashboardSessionId"
    )
) {

    const session =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );

    if (session) {

        document.getElementById(
            "dashboardSessionId"
        ).textContent =
            session.sessionId;

        document.getElementById(
            "dashboardSessionStatus"
        ).textContent =
            session.status;

    } else {

        document.getElementById(
            "dashboardSessionId"
        ).textContent =
            "No session";

        document.getElementById(
            "dashboardSessionStatus"
        ).textContent =
            "Inactive";

        document.getElementById(
            "dashboardTotalPresent"
        ).textContent =
            "0";
    }
}


// =============================
// QR COUNTDOWN
// =============================

if (
    document.getElementById("timer")
) {

    let timeLeft = 30;

    document.getElementById(
        "timer"
    ).textContent =
        "QR changes in " +
        timeLeft +
        " seconds";

    setInterval(
        function() {

            timeLeft--;

            if (timeLeft < 0) {
                timeLeft = 30;
            }

            document.getElementById(
                "timer"
            ).textContent =
                "QR changes in " +
                timeLeft +
                " seconds";

        },
        1000
    );
}
