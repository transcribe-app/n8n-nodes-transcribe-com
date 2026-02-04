import type {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
} from 'n8n-workflow';
import { IExecuteFunctions, NodeOperationError, NodeApiError, LoggerProxy as Logger, IHttpRequestOptions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

interface ITCRequestOptions {
	url?: string | undefined;
	headers?: IDataObject;
	method?: string;
	body?: FormData;
	json?: boolean;
}

interface ITCResponse {
	status?: string;
	error?: string;
	text?: string;
}

const kTriggerAddOp = "https://ai.transcribe.com/api/v1.1/n8n_node";
// const kTriggerAddOp = "http://localhost:3000/api/v1.1/n8n_node";

export class Transcribecom implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Transcribe.Com',
		name: 'transcribecom',
		icon: 'file:transcribe-com.svg',
		group: [],
		version: 1,
		subtitle: 'Convert audio/video to text',
		description: 'Get transcription of audio of video file',
		defaults: {
			name: 'Transcribe.Com'
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'transcribeComApi',
				required: true,
				testedBy: 'transcribeComApiConnectionTest',
			},
		],
		requestDefaults: {
			baseURL: 'https://ai.transcribe.com/api/1.1/n8n_node',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},

		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the file to transcribe. Usually `data` when coming from another node.',
				placeholder: 'data',
			},
			{
				displayName: 'Audio Language',
				name: 'audioLanguage',
				type: 'options',
				required: true,
				options: [
					{name: 'Dutch',value: 'du'},
					{name: 'English',value: 'en'},
					{name: 'French',value: 'fr'},
					{name: 'German',value: 'de'},
					{name: 'Italian',value: 'it'},
					{name: 'Japanese',value: 'ja'},
					{name: 'Portuguese',value: 'pt'},
					{name: 'Russian',value: 'ru'},
					{name: 'Spanish',value: 'es'},
					{name: 'Traditional Chinese',value: 'zh'},
				],
				default: 'en',
			},
			{
				displayName: 'With Timestamps',
				name: 'withTimestamps',
				type: 'options',
				required: true,
				options: [
					{name: 'YES',value: 'export_timestamps_on'},
					{name: 'NO',value: 'export_timestamps_off'},
				],
				default: 'export_timestamps_on',
			},
			{
				displayName: 'With Speakers',
				name: 'withSpeakers',
				type: 'options',
				required: true,
				options: [
					{name: 'YES',value: 'export_speakers_on'},
					{name: 'NO',value: 'export_speakers_off'},
				],
				default: 'export_speakers_on',
			},

			// // Operation
			// {
			// 	displayName: 'Transcribe',
			// 	name: 'operation',
			// 	type: 'options',
			// 	noDataExpression: true,
			// 	options: [
			// 		{
			// 			name: 'Transcribe Binary Property Input',
			// 			action: 'Transcribe Binary Property Input',
			// 			value: 'get_transcription',
			// 			description: 'Transcribe audio/video file at Binary Property Input',
			// 		},
			// 	],
			// 	default: 'get_transcription',
			// },
		]
	};

	methods = {
		credentialTest: {
			async transcribeComApiConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as IDataObject;
				const apiKey = credentials.apiKey;
				const options: ITCRequestOptions = {
					method: 'POST',
					headers: {
						Accept: 'application/json',
					},
					json: true,
				};
				let response:ITCResponse | null = null;
				try{
					/* eslint-disable */
					// Temporarily disabling due "no-deprecated-workflow-functions"
					// There is a problem in credentials helper class in n8n codebase
					// Issue: https://github.com/n8n-io/n8n/issues/25190
					response = await this.helpers.request(kTriggerAddOp+"?n8n_api_key="+apiKey, options)
					/* eslint-enable */
				} catch (error) {
					this.logger.info('credentialTest: exception:', error);
				}
				// console.log('credentialTest: Debug data:', JSON.stringify(response, null, 2));
				this.logger.info('credentialTest: response:', {json: JSON.stringify(response, null, 2)});
				if(response && response.error == 'n8n_no_audio_data'){
					return {
						status: 'OK',
						message: 'Connection successful',
					};
				}
				return {
					status: 'Error',
					message: 'Invalid Invite Code',
				};
			}
		}
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const item = items[0];
		// const operation = this.getNodeParameter('operation', 0);// get_transcription
		// const input = this.getInputData();
		// console.log('execute Debug data:', JSON.stringify(input.all(), null, 2));
		const returnData = [];
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
		if (!item.binary || !item.binary[binaryPropertyName]) {
			throw new NodeOperationError(this.getNode(), `No binary data property "${binaryPropertyName}" found on item!`);
		}
		const binaryData = item.binary[binaryPropertyName];
		const bufferData = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);
		const binaryMimeType = binaryData.mimeType || 'audio/mpeg';
		const bufferBlob = new Blob([bufferData], { type: binaryMimeType });
		const fileName = binaryData.fileName || 'n8n_audio.mp3';
		// const dataUrl = `data:${binaryMimeType};base64,${binaryData.toString('base64')}`;
		const audioLang = this.getNodeParameter('audioLanguage', 0) as string || "en";
		const audioOptTs = this.getNodeParameter('withTimestamps', 0) as string || "export_timestamps_on";
		const audioOptSp = this.getNodeParameter('withSpeakers', 0) as string || "export_speakers_on";
		// const credentials = await this.getCredentials('transcribeComApi');
		// const apiKey = credentials.apiKey;
		const formData = new FormData();
		formData.append("file_lang", audioLang);
		formData.append("file_name", fileName);
		formData.append("file_template_stamps", audioOptTs == 'export_timestamps_on'?"1":"0");
		formData.append("file_template_speakers", audioOptSp == 'export_speakers_on'?"1":"0");
		formData.append('file_data', bufferBlob, fileName);//{filename: fileName, contentType: binaryMimeType}
		try {
			const options:IHttpRequestOptions = {
				method: 'POST',
				url: kTriggerAddOp,
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				body: formData,
			};
			const response:ITCResponse = await this.helpers.httpRequestWithAuthentication.call(this,'transcribeComApi', options);
			if(!response || response["status"] == 'error'){
				let error_str = 'contact_support';
				if(response && response["error"]){
					error_str = response["error"];
				}
				if(error_str == 'n8n_user_not_found'){
					error_str = 'Transcribe.Com account not found. Check your credentials and Invite code at https://transcribe.com/app';
					Logger.error(error_str, {message: response});
				}
				if(error_str == 'not_enough_time_credits'){
					error_str = "You don't have enough time credits in your Transcribe.Com account. Add more time credits at https://transcribe.com/app";
					Logger.error(error_str, {message: response});
				}
				throw new NodeApiError(this.getNode(), JSON.parse(JSON.stringify(response)), {message: error_str});
			}
			returnData.push({
				json: {
					transcription_status: response.status,
					transcription_text: response.text
				},
			});
		} catch (error) {
			Logger.error('Error starting transcription', { error: error.message });
			throw new NodeApiError(this.getNode(), error);
		}

		return this.prepareOutputData(returnData);
	}
}