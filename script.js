```javascript
const SUPABASE_URL =
    "https://drmhmtjhubswubvlkqvq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_xCMcL-qx6NDx7UWW1Dbvmw_j0pk29nP";


// -----------------------------
// BASIC NAVIGATION
// -----------------------------

function teacherLogin() {
    window.location.href = "teacher.html";
}

function studentLogin() {
    window.location.href = "student.html";
}


// -----------------------------
// TEACHER LOGIN
// -----------------------------

function loginTeacher() {

    const teacherName =
        document.getElementById("teacherName").value.trim();

    const teacherPassword =
        document.getElementById("teacherPassword").value.trim();

    if (teacherName === "" || teacherPassword === "") {

        alert(
            "Please enter your username and password."
        );

        return;
    }

    window.location.href =
        "teacher-dashboard.html";
}


// -----------------------------
// CREATE ATTENDANCE SESSION
// -----------------------------

function createSession() {

    const session = {

        sessionId:
            "SESSION-" + Date.now(),

        createdAt:
            Date.now(),

        status:
            "Active"

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

    window.location.href =
        "attendance.html";
}


// -----------------------------
// GO HOME
// -----------------------------

function goHome() {

    window.location.href =
        "index.html";
}


// -----------------------------
// END ATTENDANCE SESSION
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

    session.status =
        "Ended";

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
// SAVE ATTENDANCE TO SUPABASE
// -----------------------------

async function saveAttendanceToSupabase(
    attendanceRecord
) {

    try {

        const response =
            await fetch(
                SUPABASE_URL +
                "/rest/v1/attendance",
                {

                    method: "POST",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

                        "Authorization":
                            "Bearer " +
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=minimal"

                    },

                    body:
                        JSON.stringify({

                            name:
                                attendanceRecord.name,

                            roll_number:
                                attendanceRecord.rollNumber,

                            status:
                                attendanceRecord.status,

                            session_id:
                                attendanceRecord.sessionId,

                            attendance_time:
                                attendanceRecord.time

                        })

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Supabase attendance error:",
                errorText
            );

            alert(
                "Attendance could not be saved to the database."
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

        alert(
            "Database connection failed."
        );

        return false;
    }
}


// -----------------------------
// QR CODE GENERATION
// -----------------------------

let qrTimerInterval;

function generateQR() {

    const qrContainer =
        document.getElementById(
            "qrcode"
        );

    const timer =
        document.getElementById(
            "timer"
        );

    if (!qrContainer) {
        return;
    }

    const session =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );

    if (!session) {

        qrContainer.innerHTML =
            "<p>No attendance session found.</p>";

        if (timer) {

            timer.innerText =
                "No active session";
        }

        return;
    }


    if (qrTimerInterval) {

        clearInterval(
            qrTimerInterval
        );
    }


    function createNewQR() {

        qrContainer.innerHTML =
            "";

        const qrTimestamp =
            Date.now();


        const qrData =
            session.sessionId +
            "-" +
            qrTimestamp;


        const studentURL =
            "https://nibhathaman.github.io/AttendX/student.html?session=" +
            qrData;


        new QRCode(
            qrContainer,
            {

                text:
                    studentURL,

                width:
                    200,

                height:
                    200

            }
        );


        let secondsLeft =
            30;


        if (timer) {

            timer.innerText =
                "QR changes in " +
                secondsLeft +
                " seconds";
        }


        qrTimerInterval =
            setInterval(
                function () {

                    secondsLeft--;


                    if (timer) {

                        timer.innerText =
                            "QR changes in " +
                            secondsLeft +
                            " seconds";
                    }


                    if (
                        secondsLeft <= 0
                    ) {

                        clearInterval(
                            qrTimerInterval
                        );

                        createNewQR();
                    }

                },
                1000
            );
    }


    createNewQR();
}


// -----------------------------
// STUDENT LOGIN
// -----------------------------

async function loginStudent() {

    const name =
        document
            .getElementById(
                "studentName"
            )
            .value
            .trim();


    const rollNumber =
        document
            .getElementById(
                "studentRoll"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "studentPassword"
            )
            .value
            .trim();


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


    const sessionData =
        urlParams.get(
            "session"
        );


    if (!sessionData) {

        alert(
            "No attendance session found. Please scan the QR code again."
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

            name:
                name,

            rollNumber:
                rollNumber,

            password:
                password

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


    const scannedSessionId =
        getSessionIdFromQR(
            sessionData
        );


    const qrTimestamp =
        getQRTimestamp(
            sessionData
        );


    if (!qrTimestamp) {

        alert(
            "Invalid QR code."
        );

        return;
    }


    if (
        Date.now() -
            qrTimestamp >=
        30000
    ) {

        alert(
            "This QR has expired. Please scan the latest QR."
        );

        return;
    }


    let attendanceRecords =
        JSON.parse(
            localStorage.getItem(
                "attendanceRecords"
            )
        ) || [];


    const alreadyMarked =
        attendanceRecords.some(
            record =>
                record.rollNumber ===
                    rollNumber &&
                record.sessionId ===
                    scannedSessionId
        );


    if (alreadyMarked) {

        alert(
            "Attendance already marked for this session."
        );

        return;
    }


    const attendanceRecord = {

        name:
            name,

        rollNumber:
            rollNumber,

        status:
            "Present",

        sessionId:
            scannedSessionId,

        qrData:
            window.location.href,

        time:
            new Date().toLocaleString()

    };


    // Save to Supabase FIRST

    const saved =
        await saveAttendanceToSupabase(
            attendanceRecord
        );


    if (!saved) {

        return;
    }


    // Save local copy

    attendanceRecords.push(
        attendanceRecord
    );


    localStorage.setItem(
        "attendanceRecords",
        JSON.stringify(
            attendanceRecords
        )
    );


    window.location.href =
        "attendance-success.html";
}


// -----------------------------
// GET SESSION ID FROM QR
// -----------------------------

function getSessionIdFromQR(
    decodedText
) {

    const parts =
        decodedText.split("-");


    return parts
        .slice(0, 2)
        .join("-");
}


// -----------------------------
// GET QR TIMESTAMP
// -----------------------------

function getQRTimestamp(
    decodedText
) {

    const parts =
        decodedText.split("-");


    return Number(
        parts[2]
    );
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


    const difference =
        Date.now() -
        qrTimestamp;


    return difference >=
        30000;
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

        {
            facingMode:
                "environment"
        },

        {

            fps:
                10,

            qrbox:
                250

        },

        async (decodedText) => {

            scanner.stop();


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


            const currentSession =
                JSON.parse(
                    localStorage.getItem(
                        "attendanceSession"
                    )
                );


            if (!currentSession) {

                alert(
                    "No active attendance session found."
                );

                return;
            }


            if (
                currentSession.status !==
                "Active"
            ) {

                alert(
                    "This attendance session has ended."
                );

                return;
            }


            const scannedSessionId =
                getSessionIdFromQR(
                    decodedText
                );


            if (
                scannedSessionId !==
                currentSession.sessionId
            ) {

                alert(
                    "This QR does not belong to the active attendance session."
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


            let attendanceRecords =
                JSON.parse(
                    localStorage.getItem(
                        "attendanceRecords"
                    )
                ) || [];


            const alreadyMarked =
                attendanceRecords.some(
                    record =>
                        record.rollNumber ===
                            rollNumber &&
                        record.sessionId ===
                            scannedSessionId
                );


            if (alreadyMarked) {

                alert(
                    "Attendance already marked for this session."
                );

                return;
            }


            const attendanceRecord = {

                name:
                    name,

                rollNumber:
                    rollNumber,

                status:
                    "Present",

                sessionId:
                    scannedSessionId,

                qrData:
                    decodedText,

                time:
                    new Date().toLocaleString()

            };


            // Save to Supabase

            const saved =
                await saveAttendanceToSupabase(
                    attendanceRecord
                );


            if (!saved) {

                return;
            }


            // Save local copy

            attendanceRecords.push(
                attendanceRecord
            );


            localStorage.setItem(
                "attendanceRecords",
                JSON.stringify(
                    attendanceRecords
                )
            );


            window.location.href =
                "attendance-success.html";

        },

        (errorMessage) => {

            // Scanner continues searching

        }

    );
}


// -----------------------------
// START CAMERA SCANNER
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

function scanQRImage() {

    const fileInput =
        document.getElementById(
            "qrImage"
        );


    if (
        fileInput.files.length ===
        0
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


    scanner
        .scanFile(
            fileInput.files[0],
            true
        )

        .then(
            async decodedText => {

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


                const currentSession =
                    JSON.parse(
                        localStorage.getItem(
                            "attendanceSession"
                        )
                    );


                if (!currentSession) {

                    alert(
                        "No active attendance session found."
                    );

                    scanner.clear();

                    return;
                }


                if (
                    currentSession.status !==
                    "Active"
                ) {

                    alert(
                        "This attendance session has ended."
                    );

                    scanner.clear();

                    return;
                }


                const scannedSessionId =
                    getSessionIdFromQR(
                        decodedText
                    );


                if (
                    scannedSessionId !==
                    currentSession.sessionId
                ) {

                    alert(
                        "This QR does not belong to the active attendance session."
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


                let attendanceRecords =
                    JSON.parse(
                        localStorage.getItem(
                            "attendanceRecords"
                        )
                    ) || [];


                const alreadyMarked =
                    attendanceRecords.some(
                        record =>
                            record.rollNumber ===
                                rollNumber &&
                            record.sessionId ===
                                scannedSessionId
                    );


                if (alreadyMarked) {

                    alert(
                        "Attendance already marked for this session."
                    );

                    scanner.clear();

                    return;
                }


                const attendanceRecord = {

                    name:
                        name,

                    rollNumber:
                        rollNumber,

                    status:
                        "Present",
```
