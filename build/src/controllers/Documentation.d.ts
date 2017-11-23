import { HTTPResponse } from "../types";
export default class DocumentationController {
    private registry;
    private template;
    private dasherizeJSONKeys;
    private templateData;
    constructor(registry: any, apiInfo: any, templatePath?: undefined, dasherizeJSONKeys?: boolean);
    handle(request: any, frameworkReq: any, frameworkRes: any): Promise<HTTPResponse>;
    getTypeInfo(type: any): {
        name: {
            model: string;
            singular: string;
            plural: string;
        };
        defaultIncludes?: string[] | undefined;
        example?: string | undefined;
        description?: string | undefined;
        parentType: string;
        childTypes: string[];
    };
    transformTypeInfo(typeName: any, info: any, request: any, response: any, frameworkReq: any, frameworkRes: any): any;
}
