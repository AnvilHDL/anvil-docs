// Interactive Anvil Playground Widget for Documentation

class AnvilPlayground {
    constructor(containerId, code, playgroundUrl) {
        this.container = document.getElementById(containerId);
        this.code = code;
        this.playgroundUrl = playgroundUrl || 'https://anvil.capstone.kisp-lab.org';
        this.ws = null;
        this.isRunning = false;
        this.init();
    }

    init() {
        // Create the widget HTML
        this.container.innerHTML = `
            <div class="anvil-playground-widget">
                <div class="anvil-editor-section">
                    <div class="anvil-toolbar">
                        <button class="anvil-run-btn" title="Run this code">▶ Run</button>
                        <button class="anvil-stop-btn" title="Stop execution" style="display: none;">⬛ Stop</button>
                        <button class="anvil-reset-btn" title="Reset to original">↺ Reset</button>
                        <label class="anvil-option">
                            <input type="checkbox" class="anvil-disable-lt">
                            Disable lifetime checks
                        </label>
                        <label class="anvil-option">
                            <span class="anvil-opt-label">Opt Level</span>
                            <select class="anvil-opt-level">
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2" selected>2</option>
                            </select>
                        </label>
                    </div>
                    <textarea class="anvil-code-editor" spellcheck="false"></textarea>
                </div>
                <div class="anvil-output-section">
                    <div class="anvil-output-header">
                        <span class="anvil-tab anvil-tab-active" data-tab="stdout">Standard Output</span>
                        <span class="anvil-tab" data-tab="stderr">Standard Error</span>
                    </div>
                    <div class="anvil-output-content">
                        <pre class="anvil-output anvil-output-active" data-output="stdout"></pre>
                        <pre class="anvil-output" data-output="stderr"></pre>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize CodeMirror for line numbers only
        const editorTextarea = this.container.querySelector('.anvil-code-editor');
        if (typeof CodeMirror !== 'undefined') {
            this.editor = CodeMirror.fromTextArea(editorTextarea, {
                mode: null,  // No syntax highlighting
                theme: 'default',
                lineNumbers: true,
                indentUnit: 4,
                tabSize: 4,
                lineWrapping: true,
                autofocus: false,
                viewportMargin: Infinity,
            });
            this.editor.setValue(this.code);
        } else {
            // Fallback to plain textarea
            editorTextarea.value = this.code;
            this.editor = null;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const runBtn = this.container.querySelector('.anvil-run-btn');
        const stopBtn = this.container.querySelector('.anvil-stop-btn');
        const resetBtn = this.container.querySelector('.anvil-reset-btn');
        const tabs = this.container.querySelectorAll('.anvil-tab');

        runBtn.addEventListener('click', () => this.runCode());
        stopBtn.addEventListener('click', () => this.stopExecution());
        resetBtn.addEventListener('click', () => this.resetCode());

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        const tabs = this.container.querySelectorAll('.anvil-tab');
        const outputs = this.container.querySelectorAll('.anvil-output');

        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('anvil-tab-active');
            } else {
                tab.classList.remove('anvil-tab-active');
            }
        });

        outputs.forEach(output => {
            if (output.dataset.output === tabName) {
                output.classList.add('anvil-output-active');
            } else {
                output.classList.remove('anvil-output-active');
            }
        });
    }

    resetCode() {
        if (this.editor) {
            this.editor.setValue(this.code);
        } else {
            const editor = this.container.querySelector('.anvil-code-editor');
            editor.value = this.code;
        }
    }

    stopExecution() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }
        this.isRunning = false;
        const runBtn = this.container.querySelector('.anvil-run-btn');
        const stopBtn = this.container.querySelector('.anvil-stop-btn');
        runBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
        runBtn.disabled = false;
        runBtn.textContent = '▶ Run';
        
        const stderrOutput = this.container.querySelector('[data-output="stderr"]');
        stderrOutput.textContent += '\n[Execution interrupted by user]';
        this.switchTab('stderr');
    }

    async runCode() {
        const code = this.editor ? this.editor.getValue() : this.container.querySelector('.anvil-code-editor').value;
        const stdoutOutput = this.container.querySelector('[data-output="stdout"]');
        const stderrOutput = this.container.querySelector('[data-output="stderr"]');
        const runBtn = this.container.querySelector('.anvil-run-btn');
        const disableLtChecks = this.container.querySelector('.anvil-disable-lt').checked;
        const optLevel = this.container.querySelector('.anvil-opt-level').value;

        if (!code.trim()) {
            alert('Code is empty!');
            return;
        }

        if (code.length > 32767) {
            alert('Code is too long! (max 32767 characters)');
            return;
        }

        // Clear previous output
        stdoutOutput.textContent = '';
        stderrOutput.textContent = '';

        // Show stop button, hide run button
        const stopBtn = this.container.querySelector('.anvil-stop-btn');
        this.isRunning = true;
        runBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        try {
            await this.executeCode(code, disableLtChecks, optLevel, stdoutOutput, stderrOutput);
        } catch (error) {
            stderrOutput.textContent = `Error: ${error.message}`;
        } finally {
            this.isRunning = false;
            runBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            runBtn.disabled = false;
        }
    }

    executeCode(code, disableLtChecks, optLevel, stdoutOutput, stderrOutput) {
        return new Promise((resolve, reject) => {
            // Close existing WebSocket if any
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }

            // Determine WebSocket URL
            const wsUrl = this.playgroundUrl.replace(/^http/, 'ws') + '/ws/';

            this.ws = new WebSocket(wsUrl);

            const prepareRequest = () => {
                const ltCheck = disableLtChecks ? '1' : '0';
                return ltCheck + String(optLevel) + code;
            };

            let hasError = false;
            let timeout = setTimeout(() => {
                reject(new Error('Execution timeout (20s)'));
                if (this.ws) this.ws.close();
            }, 21000);

            this.ws.onopen = () => {
                this.ws.send(prepareRequest());
            };

            this.ws.onmessage = (event) => {
                const data = event.data;
                if (data.charAt(0) === 'E') {
                    stderrOutput.textContent += data.substring(1);
                    hasError = true;
                    this.switchTab('stderr');
                } else if (data.charAt(0) === 'O') {
                    stdoutOutput.textContent += data.substring(1);
                }

                // Auto-scroll
                stderrOutput.scrollTop = stderrOutput.scrollHeight;
                stdoutOutput.scrollTop = stdoutOutput.scrollHeight;
            };

            this.ws.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error('WebSocket connection failed. Make sure the playground server is running.'));
            };

            this.ws.onclose = () => {
                clearTimeout(timeout);
                resolve();
                if (hasError) {
                    this.switchTab('stderr');
                }
            };
        });
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize all playground widgets on page load
document.addEventListener('DOMContentLoaded', () => {
    const playgroundElements = document.querySelectorAll('.anvil-playground-container');
    playgroundElements.forEach((element) => {
        try {
            const code = JSON.parse(element.dataset.code || '""');
            const playgroundUrl = JSON.parse(element.dataset.playgroundUrl || '"https://anvil.capstone.kisp-lab.org"');
            new AnvilPlayground(element.id, code, playgroundUrl);
        } catch (e) {
            console.error('Failed to initialize playground:', e);
        }
    });
});
