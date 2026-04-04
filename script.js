const PROVIDERS = {
    groq: {
        name: "Groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"]
    },
    openai: {
        name: "OpenAI",
        url: "https://api.openai.com/v1/chat/completions",
        models: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"]
    },
    gemini: {
        name: "Google Gemini",
        url: "", // Dynamically defined
        models: ["gemini-1.5-flash", "gemini-1.5-pro"]
    }
};

// Selectors
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    inputText: document.getElementById('inputText'),
    outputText: document.getElementById('outputText'),
    inputCharCount: document.getElementById('inputCharCount'),
    inputWordCount: document.getElementById('inputWordCount'),
    outputWordCount: document.getElementById('outputWordCount'),
    reductionPercent: document.getElementById('reductionPercent'),
    clearBtn: document.getElementById('clearBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    uploadFileBtn: document.getElementById('uploadFileBtn'),
    fileInput: document.getElementById('fileInput'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    summarizeBtn: document.getElementById('summarizeBtn'),
    summaryLength: document.getElementById('summaryLength'),
    summaryTone: document.getElementById('summaryTone'),
    summaryLanguage: document.getElementById('summaryLanguage'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    saveSettings: document.getElementById('saveSettings'),
    apiProvider: document.getElementById('apiProvider'),
    apiKey: document.getElementById('apiKey'),
    apiModel: document.getElementById('apiModel'),
};

// State
let config = {
    theme: 'dark', // default to dark mode for developer / modern feel
    provider: 'groq',
    apiKey: '',
    model: 'llama-3.3-70b-versatile'
};

// Initialize
function init() {
    loadSettings();
    loadWorkspace();
    setupEventListeners();
    updateInputStats();
    updateOutputStats();
    applyTheme(config.theme);
}

// Populate Models Select
function updateModelOptions() {
    const providerId = elements.apiProvider.value;
    const models = PROVIDERS[providerId].models;
    elements.apiModel.innerHTML = '';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        elements.apiModel.appendChild(option);
    });
}

// Local Storage
function loadSettings() {
    const saved = localStorage.getItem('aiSummarizerConfig');
    if (saved) {
        config = { ...config, ...JSON.parse(saved) };
    }
    
    // Validate provider exists, else default to groq
    if (!PROVIDERS[config.provider]) {
        config.provider = 'groq';
        config.model = PROVIDERS['groq'].models[0];
    }

    elements.apiProvider.value = config.provider;
    updateModelOptions();
    
    if (PROVIDERS[config.provider].models.includes(config.model)) {
        elements.apiModel.value = config.model;
    } else {
        elements.apiModel.value = PROVIDERS[config.provider].models[0];
        config.model = elements.apiModel.value;
    }
    
    elements.apiKey.value = config.apiKey;
}

function saveSettings() {
    config.provider = elements.apiProvider.value;
    config.apiKey = elements.apiKey.value;
    config.model = elements.apiModel.value;
    localStorage.setItem('aiSummarizerConfig', JSON.stringify(config));
    elements.settingsModal.classList.add('hidden');
}

function loadWorkspace() {
    elements.inputText.value = localStorage.getItem('aiSummarizerInput') || '';
    elements.outputText.value = localStorage.getItem('aiSummarizerOutput') || '';
    elements.summaryLength.value = localStorage.getItem('aiSummarizerLength') || 'medium';
    elements.summaryTone.value = localStorage.getItem('aiSummarizerTone') || 'neutral';
    elements.summaryLanguage.value = localStorage.getItem('aiSummarizerLanguage') || 'English';
    
    if (elements.outputText.value) {
        updateOutputButtons(false);
    }
}

function saveWorkspace() {
    localStorage.setItem('aiSummarizerInput', elements.inputText.value);
    localStorage.setItem('aiSummarizerOutput', elements.outputText.value);
    localStorage.setItem('aiSummarizerLength', elements.summaryLength.value);
    localStorage.setItem('aiSummarizerTone', elements.summaryTone.value);
    localStorage.setItem('aiSummarizerLanguage', elements.summaryLanguage.value);
}

// Theming
function toggleTheme() {
    config.theme = config.theme === 'light' ? 'dark' : 'light';
    applyTheme(config.theme);
    saveSettings(); // save theme pref
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = elements.themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

// Stats Calculation
function countWords(str) {
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function updateInputStats() {
    const text = elements.inputText.value;
    const chars = text.length;
    const words = countWords(text);
    elements.inputCharCount.textContent = `${chars} characters`;
    elements.inputWordCount.textContent = `${words} words`;
    saveWorkspace();
}

function updateOutputButtons(disabled) {
    elements.copyBtn.disabled = disabled;
    elements.downloadBtn.disabled = disabled;
    elements.regenerateBtn.disabled = disabled;
}

function updateOutputStats() {
    const outText = elements.outputText.value;
    const inText = elements.inputText.value;
    const outWords = countWords(outText);
    const inWords = countWords(inText);
    
    elements.outputWordCount.textContent = `${outWords} words`;
    
    if (inWords > 0 && outWords > 0) {
        const reduction = Math.round(((inWords - outWords) / inWords) * 100);
        elements.reductionPercent.textContent = `Reduction: ${reduction > 0 ? reduction : 0}%`;
    } else {
        elements.reductionPercent.textContent = `Reduction: 0%`;
    }
    
    updateOutputButtons(!outText);
    saveWorkspace();
}

// Event Listeners
function setupEventListeners() {
    elements.apiProvider.addEventListener('change', updateModelOptions);

    elements.inputText.addEventListener('input', debounce(updateInputStats, 300));
    elements.outputText.addEventListener('input', debounce(updateOutputStats, 300));
    
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.remove('hidden');
    });
    
    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.classList.add('hidden');
    });
    
    elements.saveSettings.addEventListener('click', saveSettings);
    
    elements.clearBtn.addEventListener('click', () => {
        elements.inputText.value = '';
        updateInputStats();
    });
    
    elements.pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            elements.inputText.value += text;
            updateInputStats();
        } catch (err) {
            showError('Failed to read clipboard.');
        }
    });

    elements.copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(elements.outputText.value);
            const icon = elements.copyBtn.querySelector('i');
            icon.classList.replace('fa-regular', 'fa-solid');
            icon.classList.replace('fa-copy', 'fa-check');
            elements.copyBtn.style.color = 'var(--success)';
            elements.copyBtn.style.borderColor = 'var(--success)';
            setTimeout(() => {
                icon.classList.replace('fa-solid', 'fa-regular');
                icon.classList.replace('fa-check', 'fa-copy');
                elements.copyBtn.style.color = '';
                elements.copyBtn.style.borderColor = '';
            }, 2000);
        } catch (err) {
            showError('Failed to copy text.');
        }
    });

    elements.downloadBtn.addEventListener('click', () => {
        const text = elements.outputText.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'summary.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    elements.uploadFileBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                elements.inputText.value = event.target.result;
                updateInputStats();
            };
            reader.readAsText(file);
        }
        // clear value so same file can be uploaded again
        e.target.value = '';
    });

    elements.summarizeBtn.addEventListener('click', handleSummarize);
    elements.regenerateBtn.addEventListener('click', handleSummarize); // Regenerate points to same function
    
    elements.summaryLength.addEventListener('change', saveWorkspace);
    elements.summaryTone.addEventListener('change', saveWorkspace);
    elements.summaryLanguage.addEventListener('change', saveWorkspace);
    
    // Close modal on outside click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.add('hidden');
        }
    });
}

// Utility: Debounce
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// API Integration
async function handleSummarize() {
    const text = elements.inputText.value.trim();
    if (!text) {
        showError("Please enter some text to summarize.");
        return;
    }
    
    if (!config.apiKey) {
        showError("API key is missing. Please configure it in Settings.");
        elements.settingsModal.classList.remove('hidden');
        return;
    }

    const length = elements.summaryLength.value;
    const tone = elements.summaryTone.value;
    const lang = elements.summaryLanguage.value;
    
    const prompt = `Summarize the following text in a ${tone} tone with a ${length} length. The language of the response should be ${lang}. Keep it clear and accurate.\n\nText:\n${text}`;

    elements.errorMessage.classList.add('hidden');
    elements.outputText.classList.add('hidden');
    elements.loadingIndicator.classList.remove('hidden');
    elements.summarizeBtn.disabled = true;
    updateOutputButtons(true); // Disable right panel buttons during processing

    try {
        const summary = await callApi(prompt);
        elements.outputText.value = summary;
        elements.outputText.classList.remove('hidden');
        updateOutputStats();
    } catch (error) {
        showError(error.message);
        elements.outputText.classList.remove('hidden');
        if (elements.outputText.value) {
            updateOutputButtons(false);
        }
    } finally {
        elements.loadingIndicator.classList.add('hidden');
        elements.summarizeBtn.disabled = false;
    }
}

async function callApi(prompt) {
    const providerConfig = PROVIDERS[config.provider];

    if (config.provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
        const body = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } else {
        const url = providerConfig.url;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        };
        const body = {
            model: config.model,
            messages: [
                { role: "system", content: "You are a professional text summarization assistant." },
                { role: "user", content: prompt }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
}

function showError(msg) {
    elements.errorText.textContent = msg;
    elements.errorMessage.classList.remove('hidden');
    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000); // hide after 5s
}

// Boot up
init();
