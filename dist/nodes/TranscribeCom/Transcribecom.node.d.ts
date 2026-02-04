import type { INodeExecutionData, INodeType, INodeTypeDescription, ICredentialsDecrypted, ICredentialTestFunctions, INodeCredentialTestResult } from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-workflow';
export declare class TranscribeCom implements INodeType {
    description: INodeTypeDescription;
    methods: {
        credentialTest: {
            transcribeComApiConnectionTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
