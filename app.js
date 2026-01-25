let db;
let currentWorkout = [];
let timerInterval;

const request = indexedDB.open("FitnessDB", 1);
request.onupgradeneeded = e => {
    db = e.target.result;
    db.createObjectStore("circuits", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = e => {
    db = e.target.result;
    renderCircuits();
};

// --- CRUD Operations ---
async function saveCircuit(circuit) {
    const tx = db.transaction("circuits", "readwrite");
    tx.objectStore("circuits").put(circuit);
    await tx.done;
    renderCircuits();
}

function renderCircuits() {
    const container = document.getElementById("circuit-list");
    container.innerHTML = "";
    const tx = db.transaction("circuits", "readonly");
    tx.objectStore("circuits").openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
            const c = cursor.value;
            const div = document.createElement("div");
            div.className = "circuit-card";
            div.innerHTML = `
                <h3>${c.name}</h3>
                <p>${c.steps.length} Steps</p>
                <button onclick="startWorkout(${c.id})">Start</button>
                <button style="background:#cf6679" onclick="deleteCircuit(${c.id})">Delete</button>
            `;
            container.appendChild(div);
            cursor.continue();
        }
    };
}

// --- Timer Logic ---
function startWorkout(id) {
    const tx = db.transaction("circuits", "readonly");
    tx.objectStore("circuits").get(id).onsuccess = e => {
        const circuit = e.target.result;
        const steps = [];
        // Flatten circuit steps into a linear array
        circuit.steps.forEach(s => {
            steps.push({ name: s.label, sec: parseInt(s.time) });
            if (s.rest > 0) steps.push({ name: "Rest", sec: parseInt(s.rest) });
        });
        runStep(steps, 0);
    };
}

function runStep(steps, index) {
    if (index >= steps.length) {
        alert("Workout Complete!");
        document.getElementById("timer-overlay").classList.add("hidden");
        return;
    }

    document.getElementById("timer-overlay").classList.remove("hidden");
    let timeLeft = steps[index].sec;
    document.getElementById("current-task-name").textContent = steps[index].name;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById("big-timer").textContent = `${m}:${s < 10 ? '0' : ''}${s}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            runStep(steps, index + 1);
        }
    }, 1000);
}

// UI Handlers for Modal
document.getElementById("add-circuit-btn").onclick = () => {
    document.getElementById("editor-modal").classList.remove("hidden");
};

document.getElementById("save-circuit").onclick = () => {
    const name = document.getElementById("circuit-name").value;
    // For brevity, we are saving a static example step. 
    // You would normally loop through DOM elements in #steps-container
    const steps = [{ label: "Pushups", time: 30, rest: 10 }, { label: "Squats", time: 30, rest: 0 }];
    saveCircuit({ name, steps });
    document.getElementById("editor-modal").classList.add("hidden");
};

function deleteCircuit(id) {
    const tx = db.transaction("circuits", "readwrite");
    tx.objectStore("circuits").delete(id);
    renderCircuits();
}
