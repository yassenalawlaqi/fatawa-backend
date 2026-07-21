export interface ExtractionStrategy {
    type: 'api' | 'rss' | 'html';
    url: string;
    extractFn: (data: any) => Promise<any>;
}
export declare class ContentExtractorService {
    private readonly logger;
    private axiosClient;
    constructor();
    extractContent(strategies: ExtractionStrategy[]): Promise<any>;
    extractHtml(html: string, questionSelector: string, answerSelector: string): {
        question: string;
        answer: string;
        rawAnswerHtml: string;
    };
    extractAttachments(html: string, baseUrl: string): {
        type: string;
        url: string;
        title: string;
    }[];
}
