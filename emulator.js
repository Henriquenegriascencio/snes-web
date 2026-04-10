class SNESEmulator {
    constructor(canvasId, infoId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.infoElement = document.getElementById(infoId);
        
        this.romData = null;
        this.PC = 0; 
        this.isRunning = false;
    }

    // 1. Processa a ROM e limpa o header se necessário
    processROM(arrayBuffer) {
        let data = new Uint8Array(arrayBuffer);
        // Se tiver 512 bytes extras, é header SMC, então cortamos
        this.romData = (data.length % 1024 === 512) ? data.slice(512) : data;
        
        this.identifyGame();
        this.findResetVector();
    }

    // 2. Lê o nome do jogo
    identifyGame() {
        let title = this.decodeTitle(0x7FC0); // Tenta LoROM
        if (!/^[a-zA-Z0-9]/.test(title)) title = this.decodeTitle(0xFFC0); // Tenta HiROM
        this.infoElement.innerHTML = `<strong>Jogo:</strong> ${title.trim()}`;
    }

    decodeTitle(addr) {
        let bytes = this.romData.slice(addr, addr + 21);
        return Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    }

    // 3. Acha onde o código do jogo começa
    findResetVector() {
        const pointer = 0xFFFC; 
        this.PC = (this.romData[pointer + 1] << 8) | this.romData[pointer];
        console.log("Vetor de Reset: " + this.PC.toString(16));
    }

    // 4. A função que estava dando erro (agora dentro da classe)
    renderDebugFrame() {
        const width = 256;
        const height = 224;
        const imgData = this.ctx.createImageData(width, height);
        
        for (let i = 0; i < imgData.data.length; i += 4) {
            const color = Math.random() * 255;
            imgData.data[i] = color;     // R
            imgData.data[i+1] = color;   // G
            imgData.data[i+2] = color;   // B
            imgData.data[i+3] = 255;     // Opacidade
        }
        this.ctx.putImageData(imgData, 0, 0);
    }

    // 5. O loop principal
    mainLoop() {
        if (!this.isRunning) return;

        // Simula o avanço do Program Counter
        this.PC++; 

        // Chama a função de desenho usando o "this." correto
        this.renderDebugFrame(); 
        
        requestAnimationFrame(() => this.mainLoop());
    }

    start() {
        if (!this.romData) {
            alert("Carregue uma ROM primeiro!");
            return;
        }
        this.isRunning = true;
        this.mainLoop();
    }
}

// --- Código de inicialização (fora da classe) ---
const emu = new SNESEmulator('screen', 'gameInfo');
const loader = document.getElementById('romLoader');
const btn = document.getElementById('startBtn');

loader.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const buffer = await file.arrayBuffer();
        emu.processROM(buffer);
        btn.disabled = false;
        btn.innerText = "Ligar Console";
    }
});

btn.addEventListener('click', () => {
    btn.innerText = "Console Rodando...";
    btn.disabled = true;
    emu.start();
});