const SUPABASE_URL = "https://drmhmtjhubswubvlkqvq.supabase.co";
const SUPABASE_KEY = "sb_publishable_xCMcL-qx6NDx7UWW1Dbvmw_j0pk29nP";


// -----------------------------
// BASIC NAVIGATION
// -----------------------------

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


// -----------------------------
// CREATE SESSION
// -----------------------------

function createSession() {

    const session = {

        sessionId: "SESSION-" + Date.now(),

        createdAt: Date.now(),

        status: "Active"

    };

    localStorage.setItem(
        "attendanceSession",
        JSON.stringify(session)
    );

    localStorage.removeItem(
        "attendanceRecords"
    );

    window.location.href =
        "qr-session.html";
}


// -----------------------------
// VIEW ATTENDANCE
// -----------------------------

function viewAttendance() {

    const session =
        JSON.parse(
            localStorage.getItem("attendanceSession")
        );

    if (!session) {
        alert("No attendance session found.");
        return;
    }

    window.location.href =
        "attendance.html?session=" +
        encodeURIComponent(session.sessionId);
}


// -----------------------------
// GO HOME
// -----------------------------

function goHome() {

    window.location.href =
        "index.html";
}


// -----------------------------
// END SESSION
// -----------------------------

function endSession() {

    const session =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
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


    if (
        document.getElementById(
            "dashboardSessionStatus"
        )
    ) {

        document.getElementById(
            "dashboardSessionStatus"
        ).textContent =
            "Ended";

    }
}


// -----------------------------
// QR CODE GENERATION
// -----------------------------

function generateQR() {

    const qrContainer =
        document.getElementById(
            "qrcode"
        );

    if (!qrContainer) {
        return;
    }

    qrContainer.innerHTML = "";

    const session =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );

    if (!session) {

        qrContainer.innerHTML =
            "<p>No attendance session found.</p>";

        return;
    }


    // Keep session ID unchanged
    // Timestamp is added separately

    const qrTimestamp =
        Date.now();


    const studentURL =
        "https://nibhathaman.github.io/AttendX/student.html" +
        "?session=" +
        encodeURIComponent(
            session.sessionId
        ) +
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


// -----------------------------
// STUDENT LOGIN
// -----------------------------

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
        urlParams.get(
            "session"
        );


    const qrTimestamp =
        Number(
            urlParams.get(
                "time"
            )
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
            lockedStudent.rollNumber !==
                rollNumber ||
            lockedStudent.password !==
                password
        ) {

            alert(
                "This device is already linked to another student account."
            );

            return;
        }

    }

    else {

        const studentData = {

            name: name,

            rollNumber: rollNumber,

            password: password

        };


        localStorage.setItem(
            "lockedStudent",
            JSON.stringify(
                studentData
            )
        );


        alert(
            "Your student account has been successfully linked to this device."
        );

    }


    localStorage.setItem(
        "studentName",
        name
    );

    localStorage.setItem(
        "studentRoll",
        rollNumber
    );


    // Check duplicate attendance

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


    // Save attendance

    const saved =
        await saveAttendanceToSupabase(
            name,
            rollNumber,
            sessionId,
            window.location.href
        );


    if (!saved) {

        alert(
            "Attendance could not be saved. Please try again."
        );

        return;
    }


    window.location.href =
        "attendance-success.html";
}


// -----------------------------
// SAVE ATTENDANCE TO SUPABASE
// -----------------------------

async function saveAttendanceToSupabase(
    name,
    rollNumber,
    sessionId,
    qrData
) {
   console.log("SESSION ID BEING SENT:", sessionId);
   const attendanceData = {

    name: name,

    roll_number: rollNumber,

    status: "Present",

    session_id:
        String(sessionId).match(/^SESSION-\d+/)?.[0] || sessionId,

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

            const errorText =
                await response.text();

            console.error(
                "Supabase Error:",
                errorText
            );

            return false;
        }


        return true;

    }

    catch (error) {

        console.error(
            "Supabase connection error:",
            error
        );

        return false;
    }
}


// -----------------------------
// CHECK DUPLICATE ATTENDANCE
// -----------------------------

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
            encodeURIComponent(
                rollNumber
            ) +
            "&session_id=eq." +
            encodeURIComponent(
                sessionId
            );


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

    }

    catch (error) {

        console.error(
            error
        );

        return false;
    }
}


// -----------------------------
// GET SESSION ID FROM QR
// -----------------------------

function getSessionIdFromQR(decodedText) {

    try {

        const url = new URL(decodedText);

        const sessionId =
            url.searchParams.get("session");

        if (!sessionId) {
            return null;
        }

        // Keep only the original session ID
        const match =
            sessionId.match(/^SESSION-\d+/);

        if (!match) {
            return null;
        }

        return match[0];

    }

    catch (error) {

        console.error(
            "Invalid QR:",
            error
        );

        return null;
    }
}

// -----------------------------
// GET QR TIMESTAMP
// -----------------------------

function getQRTimestamp(
    decodedText
) {

    try {

        const url =
            new URL(
                decodedText
            );


        const timestamp =
            url.searchParams.get(
                "time"
            );


        return Number(
            timestamp
        );

    }

    catch (error) {

        return null;
    }
}


// -----------------------------
// CHECK QR EXPIRY
// -----------------------------

function isQRExpired(
    decodedText
) {

    const qrTimestamp =
        getQRTimestamp(
            decodedText
        );


    if (!qrTimestamp) {

        return true;

    }


    return (
        Date.now() -
        qrTimestamp
    ) > 30000;
}


// -----------------------------
// CAMERA QR SCANNER
// -----------------------------

function startScanner() {

    const scanner =
        new Html5Qrcode(
            "reader"
        );


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


            const name =
                lockedStudent.name;

            const rollNumber =
                lockedStudent.rollNumber;


            const scannedSessionId =
                getSessionIdFromQR(
                    decodedText
                );


            if (!scannedSessionId) {

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
                    rollNumber,
                    scannedSessionId
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
                    scannedSessionId,
                    decodedText
                );


            if (!saved) {

                alert(
                    "Attendance could not be saved. Please try again."
                );

                return;
            }


            window.location.href =
                "attendance-success.html";

        },


        (errorMessage) => {

            // Scanner continues searching

        }

    );

}


// -----------------------------
// START SCANNER
// -----------------------------

if (
    document.getElementById(
        "reader"
    )
) {

    startScanner();

}


// -----------------------------
// QR IMAGE SCANNING
// -----------------------------

async function scanQRImage() {

    const fileInput =
        document.getElementById(
            "qrImage"
        );


    if (
        fileInput.files.length === 0
    ) {

        alert(
            "Please select a QR image first."
        );

        return;
    }


    const scanner =
        new Html5Qrcode(
            "reader"
        );


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


            const name =
                lockedStudent.name;

            const rollNumber =
                lockedStudent.rollNumber;


            const scannedSessionId =
                getSessionIdFromQR(
                    decodedText
                );


            if (!scannedSessionId) {

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
                    rollNumber,
                    scannedSessionId
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
                    name,
                    rollNumber,
                    scannedSessionId,
                    decodedText
                );


            if (!saved) {

                alert(
                    "Attendance could not be saved. Please try again."
                );

                scanner.clear();

                return;
            }


            scanner.clear();


            window.location.href =
                "attendance-success.html";

        }
    )

    .catch(
        error => {

            alert(
                "QR could not be detected. Try a clearer screenshot."
            );

            scanner.clear();

        }
    );

}


// -----------------------------
// SESSION INFORMATION
// -----------------------------

if (
    document.getElementById(
        "sessionId"
    )
) {

    const currentSession =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );


    if (currentSession) {

        document.getElementById(
            "sessionId"
        ).textContent =
            currentSession.sessionId;


        document.getElementById(
            "sessionStatus"
        ).textContent =
            currentSession.status;

    }

    else {

        document.getElementById(
            "sessionId"
        ).textContent =
            "No active session";


        document.getElementById(
            "sessionStatus"
        ).textContent =
            "Inactive";

    }

}


// -----------------------------
// DOWNLOAD ATTENDANCE REPORT
// -----------------------------

async function downloadAttendanceReport() {

    const currentSession =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );


    if (!currentSession) {

        alert(
            "No attendance session found."
        );

        return;
    }


    try {

        const url =
            SUPABASE_URL +
            "/rest/v1/attendance" +
            "?select=*" +
            "&session_id=eq." +
            encodeURIComponent(
                currentSession.sessionId
            );


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

            alert(
                "Could not load attendance records."
            );

            return;
        }


        const sessionRecords =
            await response.json();


        if (
            sessionRecords.length === 0
        ) {

            alert(
                "No attendance records available for this session."
            );

            return;
        }


        let csv =
            "Name,Roll Number,Status,Session ID,Time\n";


        sessionRecords.forEach(
            record => {

                csv +=
                    `"${record.name}",` +
                    `"${record.roll_number}",` +
                    `"${record.status}",` +
                    `"${record.session_id}",` +
                    `"${record.attendance_time}"\n`;

            }
        );


        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const urlObject =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            urlObject;


        link.download =
            "AttendX_Attendance_Report.csv";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            urlObject
        );

    }

    catch (error) {

        console.error(
            error
        );

        alert(
            "Could not download attendance report."
        );

    }

}


// -----------------------------
// TEACHER DASHBOARD
// -----------------------------

if (
    document.getElementById(
        "dashboardSessionId"
    )
) {

    const currentSession =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );


    if (currentSession) {

        document.getElementById(
            "dashboardSessionId"
        ).textContent =
            currentSession.sessionId;


        document.getElementById(
            "dashboardSessionStatus"
        ).textContent =
            currentSession.status;

    }

    else {

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


// -----------------------------
// QR COUNTDOWN
// -----------------------------

if (
    document.getElementById(
        "timer"
    )
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


            if (
                timeLeft < 0
            ) {

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
