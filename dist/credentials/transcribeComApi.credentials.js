"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeComApi = void 0;
class transcribeComApi {
    constructor() {
        this.name = 'transcribeComApi';
        this.displayName = 'Transcribe.Com API';
        this.icon = 'file:transcribe-com.svg';
        this.documentationUrl = 'https://github.com/transcribe-app/n8n-nodes-transcribe-com?tab=readme-ov-file#credentials';
        this.properties = [
            {
                displayName: 'Your Invite Code from Transcribe.com',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                qs: {
                    'n8n_api_key': '={{$credentials.apiKey}}'
                }
            },
        };
    }
}
exports.transcribeComApi = transcribeComApi;
//# sourceMappingURL=transcribeComApi.credentials.js.map