import { IAuthenticateGeneric, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';
export declare class transcribeComApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: Icon;
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
}
