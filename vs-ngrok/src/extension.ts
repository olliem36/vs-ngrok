import * as vscode from 'vscode';
import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    const ngrokManager = new NgrokManager(context);
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('vs-ngrok.connect', () => ngrokManager.connect()),
        vscode.commands.registerCommand('vs-ngrok.disconnect', () => ngrokManager.disconnect()),
        vscode.commands.registerCommand('vs-ngrok.showStatus', () => ngrokManager.showStatus())
    );
}

export function deactivate() {
    // Cleanup is handled by NgrokManager's dispose method
}

class NgrokManager {
    private statusBarItem: vscode.StatusBarItem;
    private ngrokProcess: ChildProcess | null = null;
    private isConnected: boolean = false;
    private tunnelUrl: string = '';
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'vs-ngrok.showStatus';
        this.updateStatusBar();
        this.statusBarItem.show();
        
        context.subscriptions.push(this.statusBarItem);
        
        // Cleanup on extension deactivation
        context.subscriptions.push({
            dispose: () => this.disconnect()
        });
    }

    private updateStatusBar() {
        const emoji = this.isConnected ? '🟢' : '🔴';
        const tooltip = this.isConnected 
            ? `NGROK Connected: ${this.tunnelUrl}\nClick to show options` 
            : 'NGROK Disconnected\nClick to connect';
        
        this.statusBarItem.text = `${emoji} 🚇`;
        this.statusBarItem.tooltip = tooltip;
    }

    async connect() {
        const config = vscode.workspace.getConfiguration('vs-ngrok');
        const domain = config.get<string>('domain');
        const apiKey = config.get<string>('apiKey');
        const port = config.get<number>('port') || 3000;

        if (!domain || !apiKey) {
            const result = await vscode.window.showErrorMessage(
                'NGROK domain and API key must be configured',
                'Open Settings'
            );
            
            if (result === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'vs-ngrok');
            }
            return;
        }

        try {
            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Connecting to NGROK...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                // Set NGROK auth token
                await this.setAuthToken(apiKey);
                progress.report({ increment: 30 });
                
                // Start NGROK tunnel
                await this.startTunnel(port, domain);
                progress.report({ increment: 60 });
                
                // Verify connection
                await this.verifyConnection();
                progress.report({ increment: 100 });
            });

            this.isConnected = true;
            this.updateStatusBar();
            
            vscode.window.showInformationMessage(
                `NGROK tunnel connected: ${this.tunnelUrl}`,
                'Copy URL'
            ).then(selection => {
                if (selection === 'Copy URL') {
                    vscode.env.clipboard.writeText(this.tunnelUrl);
                    vscode.window.showInformationMessage('URL copied to clipboard');
                }
            });

        } catch (error) {
            this.isConnected = false;
            this.updateStatusBar();
            vscode.window.showErrorMessage(`Failed to connect NGROK: ${error}`);
        }
    }

    private async setAuthToken(apiKey: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const authProcess = spawn('ngrok', ['config', 'add-authtoken', apiKey]);
            
            authProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error('Failed to set NGROK auth token'));
                }
            });
            
            authProcess.on('error', (err) => {
                reject(new Error(`NGROK not found. Please install NGROK: ${err.message}`));
            });
        });
    }

    private async startTunnel(port: number, domain: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Kill any existing process
            if (this.ngrokProcess) {
                this.ngrokProcess.kill();
                this.ngrokProcess = null;
            }

            // Start new tunnel
            this.ngrokProcess = spawn('ngrok', ['http', `--domain=${domain}`, port.toString()]);
            
            this.ngrokProcess.on('error', (err) => {
                reject(new Error(`Failed to start NGROK: ${err.message}`));
            });

            // Give NGROK time to start
            setTimeout(() => {
                if (this.ngrokProcess && !this.ngrokProcess.killed) {
                    this.tunnelUrl = `https://${domain}`;
                    resolve();
                } else {
                    reject(new Error('NGROK process terminated unexpectedly'));
                }
            }, 2000);

            // Handle process termination
            this.ngrokProcess.on('close', (code) => {
                if (this.isConnected) {
                    this.isConnected = false;
                    this.updateStatusBar();
                    vscode.window.showWarningMessage('NGROK tunnel disconnected');
                }
            });
        });
    }

    private async verifyConnection(): Promise<void> {
        try {
            // Try to access NGROK API to verify it's running
            const response = await axios.get('http://localhost:4040/api/tunnels', {
                timeout: 3000
            });
            
            // Check if our tunnel is in the list
            const tunnels = response.data.tunnels || [];
            const activeTunnel = tunnels.find((t: any) => 
                t.config && t.config.addr && t.public_url
            );
            
            if (activeTunnel) {
                this.tunnelUrl = activeTunnel.public_url;
            }
        } catch (error) {
            // API might not be available with custom domains, but tunnel could still be working
            console.log('Could not verify via API, assuming tunnel is active');
        }
    }

    async disconnect() {
        if (this.ngrokProcess && !this.ngrokProcess.killed) {
            this.ngrokProcess.kill();
            this.ngrokProcess = null;
        }
        
        this.isConnected = false;
        this.tunnelUrl = '';
        this.updateStatusBar();
        
        vscode.window.showInformationMessage('NGROK tunnel disconnected');
    }

    async showStatus() {
        if (this.isConnected) {
            const selection = await vscode.window.showQuickPick([
                { label: '$(link) Copy Tunnel URL', value: 'copy' },
                { label: '$(close) Disconnect Tunnel', value: 'disconnect' },
                { label: '$(gear) Open Settings', value: 'settings' }
            ], {
                placeHolder: `Connected to: ${this.tunnelUrl}`
            });

            switch (selection?.value) {
                case 'copy':
                    vscode.env.clipboard.writeText(this.tunnelUrl);
                    vscode.window.showInformationMessage('URL copied to clipboard');
                    break;
                case 'disconnect':
                    await this.disconnect();
                    break;
                case 'settings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'vs-ngrok');
                    break;
            }
        } else {
            const selection = await vscode.window.showQuickPick([
                { label: '$(play) Connect Tunnel', value: 'connect' },
                { label: '$(gear) Open Settings', value: 'settings' }
            ], {
                placeHolder: 'NGROK Disconnected'
            });

            switch (selection?.value) {
                case 'connect':
                    await this.connect();
                    break;
                case 'settings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'vs-ngrok');
                    break;
            }
        }
    }
} 