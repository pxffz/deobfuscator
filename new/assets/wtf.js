const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const textInput = document.getElementById('text-input');
const deobfBtn = document.getElementById('deobf-btn');
const statusDiv = document.getElementById('status');

// Backend URL (Localhost Port 8000)
const API_URL = 'https://zenith.loophole.site/deobfuscate';

let selectedFile = null;

// Drag and Drop Logic
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'txt' && ext !== 'lua') {
        statusDiv.textContent = "Error: Only .txt or .lua files are allowed.";
        statusDiv.className = 'status-msg error';
        return;
    }
    selectedFile = file;
    textInput.value = `File selected: ${file.name}`;
    textInput.disabled = true;
    statusDiv.textContent = "File ready.";
    statusDiv.className = 'status-msg';
}

deobfBtn.addEventListener('click', async () => {
    let content = "";

    if (selectedFile) {
        content = await readFileContent(selectedFile);
    } else {
        content = textInput.value;
    }

    if (!content.trim()) {
        statusDiv.textContent = "Please provide a file or paste code.";
        statusDiv.className = 'status-msg error';
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: content })
        });

        if (!response.ok) throw new Error("Server processing failed");

        // Download the file blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith_output_${Date.now()}.luac`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        statusDiv.textContent = "Success! File downloaded.";
        statusDiv.className = 'status-msg success';
        
        // Reset after a brief delay
        setTimeout(() => {
            textInput.value = "";
            textInput.disabled = false;
            selectedFile = null;
            fileInput.value = "";
        }, 3000);

    } catch (error) {
        console.error(error);
        statusDiv.textContent = "Backend error. Make sure server is running.";
        statusDiv.className = 'status-msg error';
    } finally {
        setLoading(false);
    }
});

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function setLoading(isLoading) {
    deobfBtn.disabled = isLoading;
    if (isLoading) {
        deobfBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    } else {
        deobfBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Deobfuscate';
    }
}
