import type {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	//IDataObject,
	//JsonObject,
} from 'n8n-workflow';
import { IExecuteFunctions, NodeOperationError, NodeApiError, LoggerProxy as Logger } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

const kTriggerAddOp = "https://ai.transcribe.com/api/v1.1/n8n_node";
// const kTriggerAddOp = "http://localhost:3000/api/v1.1/n8n_node";

export class TranscribeCom implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Transcribe.Com',
		name: 'transcribe-com',
		icon: 'file:transcribe-com.svg',
		group: [],
		version: 1,
		subtitle: 'Convert audio/video to text',
		description: 'Get transcription of audio of video file',
		defaults: {
			name: 'Transcribe.Com',
			color: '#1774FF'
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'TranscribeComApi',
				required: true,
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
					{name: 'English',value: 'en'},
					{name: 'German',value: 'de'},
					{name: 'French',value: 'fr'},
					{name: 'Italian',value: 'it'},
					{name: 'Spanish',value: 'es'},
					{name: 'Portuguese',value: 'pt'},
					{name: 'Dutch',value: 'du'},
					{name: 'Japanese',value: 'ja'},
					{name: 'Traditional Chinese',value: 'zh'},
					{name: 'Russian',value: 'ru'},
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const item = items[0];
		// const operation = this.getNodeParameter('operation', 0);// get_transcription
		// const input = this.getInputData();
		// console.log('Debug data:', JSON.stringify(input.all(), null, 2));
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
		// const credentials = await this.getCredentials('TranscribeComApi');
		// const apiKey = credentials.apiKey;
		const formData = new FormData();
		formData.append("file_lang", audioLang);
		formData.append("file_name", fileName);
		formData.append("file_template_stamps", audioOptTs == 'export_timestamps_on'?"1":"0");
		formData.append("file_template_speakers", audioOptSp == 'export_speakers_on'?"1":"0");
		formData.append('file_data', bufferBlob, fileName);//{filename: fileName, contentType: binaryMimeType}
		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(this,'TranscribeComApi',
			{
				method: 'POST',
				url: kTriggerAddOp,
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				body: formData,
			} as any);
			if(!response || response["status"] == 'error'){
				let error_str = 'contact_support';
				if(response && response["error"]){
					error_str = response["error"];
				}
				if(error_str == 'n8n_user_not_found'){
					Logger.error('Transcribe.Com Account not found. Check your credentials.', response);
				}
				throw new NodeApiError(this.getNode(), response, {message: error_str});
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