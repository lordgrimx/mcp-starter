const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('MCP Starter uzantısı aktif!');

    // MCP başlatma komutunu kaydet
    let disposable = vscode.commands.registerCommand('mcp-starter.startMCP', async function () {
        await startMCP();
    });

    context.subscriptions.push(disposable);

    // Uzantı aktifleştiğinde otomatik olarak kodu kontrol et ve MCP başlat
    checkAndStartMCP();
}

function deactivate() {}

/**
 * Başlatma kodunu kontrol et ve MCP başlat
 */
async function checkAndStartMCP() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const text = document.getText();
        
        // Kodda MCP başlatma deseni ara
        if (text.includes('MCP.init') || text.includes('ModelContextProtocol')) {
            await startMCP();
        }
    }
}

/**
 * MCP'yi başlat ve settings.json dosyasını güncelle
 */
async function startMCP() {
    try {
        vscode.window.showInformationMessage('Model Context Protokolleri başlatılıyor...');
        
        // Copilot ayarlarını güncelle
        await updateCopilotSettings();
        
        vscode.window.showInformationMessage('MCP başlatıldı ve Copilot başarıyla yapılandırıldı!');
    } catch (error) {
        vscode.window.showErrorMessage(`MCP başlatılamadı: ${error.message}`);
        console.error(error);
    }
}

/**
 * VS Code Insiders settings.json dosyasını güncelleyerek Copilot'u yapılandır
 */
async function updateCopilotSettings() {
    const settingsPath = 'C:\\Users\\sabri\\AppData\\Roaming\\Code - Insiders\\User\\settings.json';
    
    try {
        // Mevcut ayarları oku
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            const settingsContent = fs.readFileSync(settingsPath, 'utf8');
            settings = JSON.parse(settingsContent);
        }
        
        // Copilot MCP yapılandırmasını ekle veya güncelle
        settings['github.copilot.advanced'] = {
            ...(settings['github.copilot.advanced'] || {}),
            'model': 'gpt-4',
            'protocol': 'mcp',
            'enableMCPSupport': true
        };
        
        // Güncellenmiş ayarları dosyaya yaz
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
        
        vscode.window.showInformationMessage('Copilot ayarları başarıyla güncellendi');
    } catch (error) {
        throw new Error(`settings.json güncellenemedi: ${error.message}`);
    }
}

module.exports = {
    activate,
    deactivate
}
