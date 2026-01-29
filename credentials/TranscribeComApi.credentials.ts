import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TranscribeComApi implements ICredentialType {
	name = 'TranscribeComApi';
	displayName = 'Transcribe.Com API';

	documentationUrl = 'https://github.com/transcribe-app/n8n-nodes-transcribe-com?tab=readme-ov-file#credentials';
	properties: INodeProperties[] = [
		{
			displayName: 'Your Invite Code from Transcribe.com',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
	authenticate = {
		type: 'generic',
		properties: {
			qs: {
				'n8n_api_key': '={{$credentials.apiKey}}'
			}
		},
	} as IAuthenticateGeneric;
}