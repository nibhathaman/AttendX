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


function createSession() {

    const session = {
        sessionId: "SESSION-" + Date.now(),
        createdAt: Date.now(),
        status: "Active"
    };

    // Create a fresh session
    localStorage.setItem(
        "attendanceSession",
        JSON.stringify(session)
    );

    // Clear attendance records from previous session
    localStorage.removeItem("attendanceRecords");

    window.location.href = "qr-session.html";
}

function viewAttendance() {
    window.location.href = "attendance.html";
}

function goHome() {
    window.location.href = "index.html";
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


    // Check if session exists

    if (!session) {

        alert(
            "No attendance session found."
        );

        return;
    }


    // Check if already ended

    if (session.status === "Ended") {

        alert(
            "This attendance session has already ended."
        );

        return;
    }


    // End the session

    session.status = "Ended";

    localStorage.setItem(
        "attendanceSession",
        JSON.stringify(session)
    );


    alert(
        "Attendance session ended successfully."
    );


    // Refresh dashboard information

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
        document.getElementById("qrcode");

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

    // Laptop IP address
    const studentURL =
        "http://192.168.29.159:5500/student.html?session=" +
        session.sessionId;

    new QRCode(qrContainer, {

        text: studentURL,

        width: 200,

        height: 200

    });
}

// -----------------------------
// QR COUNTDOWN
// -----------------------------

if (document.getElementById("timer")) {

    let timeLeft = 30;

    setInterval(function() {

        timeLeft--;

        document.getElementById("timer").textContent =
            "QR changes in " +
            timeLeft +
            " seconds";

        if (timeLeft === 0) {

            timeLeft = 30;

        }

    }, 1000);

}


// -----------------------------
// STUDENT LOGIN
// -----------------------------

function loginStudent() {

    const name =
        document.getElementById("studentName").value.trim();

    const rollNumber =
        document.getElementById("studentRoll").value.trim();

    const password =
        document.getElementById("studentPassword").value.trim();


    // Check empty fields

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


    // Get session ID from QR URL

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const sessionId =
        urlParams.get("session");


    // Check if session exists

    if (!sessionId) {

        alert(
            "No attendance session found. Please scan the QR code again."
        );

        return;
    }


    // Check if a student account is already locked

    const lockedStudent =
        JSON.parse(
            localStorage.getItem("lockedStudent")
        );


    // If account is already locked

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

    }


    // First-time registration

    else {

        const studentData = {

            name: name,

            rollNumber: rollNumber,

            password: password

        };


        localStorage.setItem(
            "lockedStudent",
            JSON.stringify(studentData)
        );


        alert(
            "Your student account has been successfully linked to this device."
        );

    }


    // Save current student details

    localStorage.setItem(
        "studentName",
        name
    );

    localStorage.setItem(
        "studentRoll",
        rollNumber
    );


    // Get attendance records

    let attendanceRecords =
        JSON.parse(
            localStorage.getItem(
                "attendanceRecords"
            )
        ) || [];


    // Check duplicate attendance

    const alreadyMarked =
        attendanceRecords.some(
            record =>
                record.rollNumber === rollNumber &&
                record.sessionId === sessionId
        );


    if (alreadyMarked) {

        alert(
            "Attendance already marked for this session."
        );

        return;
    }


    // Create attendance record

    const attendanceRecord = {

        name: name,

        rollNumber: rollNumber,

        status: "Present",

        sessionId: sessionId,

        qrData:
            window.location.href,

        time:
            new Date().toLocaleString()

    };


    // Save attendance

    attendanceRecords.push(
        attendanceRecord
    );

    localStorage.setItem(
        "attendanceRecords",
        JSON.stringify(
            attendanceRecords
        )
    );


    // Attendance successful

    window.location.href =
        "attendance-success.html";

}
  

// -----------------------------
// GET SESSION ID FROM QR
// -----------------------------

function getSessionIdFromQR(decodedText) {

    const parts =
        decodedText.split("-");

    return parts
        .slice(0, 2)
        .join("-");
}


// -----------------------------
// GET QR TIMESTAMP
// -----------------------------

function getQRTimestamp(decodedText) {

    const parts =
        decodedText.split("-");

    return Number(
        parts[2]
    );
}


// -----------------------------
// CHECK QR EXPIRY
// -----------------------------

function isQRExpired(decodedText) {

    const qrTimestamp =
        getQRTimestamp(decodedText);

    if (!qrTimestamp) {

        return true;

    }

    const currentTime =
        Date.now();

    const difference =
        currentTime - qrTimestamp;

    return difference > 30000;
}


// -----------------------------
// CAMERA QR SCANNER
// -----------------------------

function startScanner() {

    const scanner =
        new Html5Qrcode("reader");

    scanner.start(

        { facingMode: "environment" },

        {
            fps: 10,
            qrbox: 250
        },

        (decodedText) => {

            scanner.stop();


            const lockedStudent =
                JSON.parse(
                    localStorage.getItem("lockedStudent")
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


            // Check if session exists

            if (!currentSession) {

                alert(
                    "No active attendance session found."
                );

                return;
            }


            // Check if session is still active

            if (currentSession.status !== "Active") {

                alert(
                    "This attendance session has ended."
                );

                return;
            }


            // Get session ID from scanned QR

            const scannedSessionId =
                getSessionIdFromQR(
                    decodedText
                );


            // Check session ID

            if (
                scannedSessionId !==
                currentSession.sessionId
            ) {

                alert(
                    "This QR does not belong to the active attendance session."
                );

                return;
            }


            // Check QR expiry

            if (
                isQRExpired(decodedText)
            ) {

                alert(
                    "This QR has expired. Please scan the latest QR."
                );

                return;
            }


            // Get existing attendance records

            let attendanceRecords =
                JSON.parse(
                    localStorage.getItem(
                        "attendanceRecords"
                    )
                ) || [];


            // Check duplicate attendance

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


            // Create attendance record

            const attendanceRecord = {

                name: name,

                rollNumber: rollNumber,

                status: "Present",

                sessionId:
                    scannedSessionId,

                qrData:
                    decodedText,

                time:
                    new Date().toLocaleString()

            };


            // Save attendance

            attendanceRecords.push(
                attendanceRecord
            );

            localStorage.setItem(
                "attendanceRecords",
                JSON.stringify(
                    attendanceRecords
                )
            );


            // Attendance successful

            window.location.href =
                "attendance-success.html";

        },

        (errorMessage) => {

            // Scanner continues searching

        }

    );

}


// Start camera scanner

if (
    document.getElementById("reader")
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

    .then(decodedText => {

        const lockedStudent =
            JSON.parse(
                localStorage.getItem("lockedStudent")
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


        // Check if session exists

        if (!currentSession) {

            alert(
                "No active attendance session found."
            );

            scanner.clear();

            return;
        }


        // Check if session is still active

        if (currentSession.status !== "Active") {

            alert(
                "This attendance session has ended."
            );

            scanner.clear();

            return;
        }


        // Get session ID from QR

        const scannedSessionId =
            getSessionIdFromQR(
                decodedText
            );


        // Check session ID

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


        // Check QR expiry

        if (
            isQRExpired(decodedText)
        ) {

            alert(
                "This QR has expired. Please scan the latest QR."
            );

            scanner.clear();

            return;
        }


        // Get attendance records

        let attendanceRecords =
            JSON.parse(
                localStorage.getItem(
                    "attendanceRecords"
                )
            ) || [];


        // Check duplicate attendance

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


        // Create attendance record

        const attendanceRecord = {

            name: name,

            rollNumber: rollNumber,

            status: "Present",

            sessionId:
                scannedSessionId,

            qrData:
                decodedText,

            time:
                new Date().toLocaleString()

        };


        // Save attendance

        attendanceRecords.push(
            attendanceRecord
        );

        localStorage.setItem(
            "attendanceRecords",
            JSON.stringify(
                attendanceRecords
            )
        );


        scanner.clear();


        // Attendance successful

        window.location.href =
            "attendance-success.html";

    })

    .catch(error => {

        alert(
            "QR could not be detected. Try a clearer screenshot."
        );

        scanner.clear();

    });

}


// -----------------------------
// -----------------------------
// ATTENDANCE RECORDS
// -----------------------------

if (
    document.getElementById("attendanceList")
) {

    const attendanceRecords =
        JSON.parse(
            localStorage.getItem(
                "attendanceRecords"
            )
        ) || [];


    const currentSession =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );


    const attendanceList =
        document.getElementById(
            "attendanceList"
        );


    // Check if a session exists

    if (!currentSession) {

        attendanceList.innerHTML =
            "<p>No attendance session found.</p>";

    }

    else {

        // Get current session ID

        const currentSessionId =
            currentSession.sessionId;


        // Get only records for current session

        const sessionRecords =
            attendanceRecords.filter(
                record =>
                    record.sessionId ===
                    currentSessionId
            );


        // Check if there are no records

        if (
            sessionRecords.length === 0
        ) {

            attendanceList.innerHTML =
                "<p>No attendance records for this session yet.</p>";

        }

        else {

            let table = `

                <table>

                    <tr>

                        <th>Name</th>

                        <th>Roll Number</th>

                        <th>Status</th>

                        <th>Time</th>

                    </tr>

            `;


            sessionRecords.forEach(
                record => {

                    table += `

                        <tr>

                            <td>
                                ${record.name}
                            </td>

                            <td>
                                ${record.rollNumber}
                            </td>

                            <td>
                                ${record.status}
                            </td>

                            <td>
                                ${record.time}
                            </td>

                        </tr>

                    `;

                }
            );


            table += "</table>";


            attendanceList.innerHTML =
                table;

        }

    }

}

// -----------------------------
// SESSION INFORMATION
// -----------------------------

if (
    document.getElementById("sessionId")
) {

    const currentSession =
        JSON.parse(
            localStorage.getItem(
                "attendanceSession"
            )
        );


    const attendanceRecords =
        JSON.parse(
            localStorage.getItem(
                "attendanceRecords"
            )
        ) || [];


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


    const currentSessionId =
        currentSession
            ? currentSession.sessionId
            : null;


    const sessionRecords =
        attendanceRecords.filter(
            record =>
                record.sessionId ===
                currentSessionId
        );


    document.getElementById(
        "totalPresent"
    ).textContent =
        sessionRecords.length;

}

// -----------------------------
// DOWNLOAD ATTENDANCE REPORT
// -----------------------------

function downloadAttendanceReport() {

    const currentSession =
        JSON.parse(
            localStorage.getItem("attendanceSession")
        );

    const attendanceRecords =
        JSON.parse(
            localStorage.getItem("attendanceRecords")
        ) || [];


    if (!currentSession) {

        alert("No attendance session found.");

        return;
    }


    const sessionRecords =
        attendanceRecords.filter(
            record =>
                record.sessionId ===
                currentSession.sessionId
        );


    if (sessionRecords.length === 0) {

        alert(
            "No attendance records available for this session."
        );

        return;
    }


    // Create CSV content

    let csv =
        "Name,Roll Number,Status,Session ID,Time\n";


    sessionRecords.forEach(record => {

        csv +=
            record.name + "," +
            record.rollNumber + "," +
            record.status + "," +
            record.sessionId + "," +
            record.time + "\n";

    });


    // Create file

    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    // Create download link

    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "AttendX_Attendance_Report.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    // Clean up

    URL.revokeObjectURL(url);

}

// -----------------------------
// TEACHER DASHBOARD INFORMATION
// -----------------------------

if (document.getElementById("dashboardSessionId")) {

    const currentSession =
        JSON.parse(
            localStorage.getItem("attendanceSession")
        );

    const attendanceRecords =
        JSON.parse(
            localStorage.getItem("attendanceRecords")
        ) || [];

    if (currentSession) {

        document.getElementById(
            "dashboardSessionId"
        ).textContent =
            currentSession.sessionId;

        document.getElementById(
            "dashboardSessionStatus"
        ).textContent =
            currentSession.status;

        const sessionRecords =
            attendanceRecords.filter(
                record =>
                    record.sessionId ===
                    currentSession.sessionId
            );

        document.getElementById(
            "dashboardTotalPresent"
        ).textContent =
            sessionRecords.length;

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