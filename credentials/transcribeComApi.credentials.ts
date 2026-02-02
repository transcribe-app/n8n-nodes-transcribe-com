import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
	Icon
} from 'n8n-workflow';

export class transcribeComApi implements ICredentialType {
	name = 'transcribeComApi';
	displayName = 'Transcribe.Com API';
	icon: Icon = 'file:transcribe-com.svg';
	documentationUrl = 'https://github.com/transcribe-app/n8n-nodes-transcribe-com?tab=readme-ov-file#credentials';
	properties: INodeProperties[] = [
		{
			displayName: 'Your Invite Code from Transcribe.com',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				'n8n_api_key': '={{$credentials.apiKey}}'
			}
		},
	};
}