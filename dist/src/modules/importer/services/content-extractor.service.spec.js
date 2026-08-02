"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const content_extractor_service_1 = require("./content-extractor.service");
describe('ContentExtractorService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [content_extractor_service_1.ContentExtractorService],
        }).compile();
        service = module.get(content_extractor_service_1.ContentExtractorService);
        jest.spyOn(service['logger'], 'log').mockImplementation(() => { });
        jest.spyOn(service['logger'], 'warn').mockImplementation(() => { });
        jest.spyOn(service['logger'], 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('extractContent', () => {
        it('should return data from the first successful strategy', async () => {
            jest.spyOn(service['axiosClient'], 'get').mockResolvedValue({ data: 'API Data' });
            const strategies = [
                {
                    type: 'api',
                    url: 'https://example.com/api',
                    extractFn: async (data) => data,
                }
            ];
            const result = await service.extractContent(strategies);
            expect(result).toEqual('API Data');
            expect(service['axiosClient'].get).toHaveBeenCalledWith('https://example.com/api');
        });
        it('should fall back to the next strategy if the first fails', async () => {
            jest.spyOn(service['axiosClient'], 'get')
                .mockRejectedValueOnce(new Error('500 Error'))
                .mockResolvedValueOnce({ data: 'HTML Data' });
            const strategies = [
                {
                    type: 'api',
                    url: 'https://example.com/api',
                    extractFn: async (data) => data,
                },
                {
                    type: 'html',
                    url: 'https://example.com/html',
                    extractFn: async (data) => data,
                }
            ];
            const result = await service.extractContent(strategies);
            expect(result).toBe('HTML Data');
            expect(service['axiosClient'].get).toHaveBeenCalledTimes(2);
            expect(service['axiosClient'].get).toHaveBeenNthCalledWith(1, 'https://example.com/api');
            expect(service['axiosClient'].get).toHaveBeenNthCalledWith(2, 'https://example.com/html');
        });
        it('should throw an error if all strategies fail', async () => {
            jest.spyOn(service['axiosClient'], 'get').mockRejectedValue(new Error('404 Error'));
            const strategies = [
                {
                    type: 'api',
                    url: 'https://example.com/api',
                    extractFn: async (data) => data,
                }
            ];
            await expect(service.extractContent(strategies)).rejects.toThrow('All extraction strategies failed.');
        });
    });
    describe('extractHtml', () => {
        it('should clean and extract question and answer', () => {
            const html = `
        <html>
          <body>
            <div class="question">ما حكم <b>الصلاة</b>؟</div>
            <div class="answer">
              <p>الحمد لله،</p>
              الصلاة واجبة.
            </div>
          </body>
        </html>
      `;
            const result = service.extractHtml(html, '.question', '.answer');
            expect(result.question).toContain('حكم الصلاة');
            expect(result.answer).toContain('الحمد لله');
            expect(result.answer).toContain('الصلاة واجبة');
            expect(result.rawAnswerHtml).toContain('<p>الحمد لله،</p>');
        });
        it('should handle missing elements gracefully', () => {
            const html = '<html><body></body></html>';
            const result = service.extractHtml(html, '.q', '.a');
            expect(result.question).toBe('');
            expect(result.answer).toBe('');
            expect(result.rawAnswerHtml).toBe('');
        });
    });
    describe('extractAttachments', () => {
        it('should extract PDF, audio, and video links', () => {
            const html = `
        <html>
          <body>
            <a href="/files/book.pdf">كتاب مفيد</a>
            <a href="https://example.com/audio.mp3">استماع</a>
            <video>
              <source src="/media/video.mp4" type="video/mp4">
            </video>
            <a href="/other.txt">ملف نصي</a>
          </body>
        </html>
      `;
            const baseUrl = 'https://mysite.com';
            const attachments = service.extractAttachments(html, baseUrl);
            expect(attachments).toHaveLength(3);
            expect(attachments[0]).toEqual({
                type: 'pdf',
                url: 'https://mysite.com/files/book.pdf',
                title: 'كتاب مفيد'
            });
            expect(attachments[1]).toEqual({
                type: 'audio',
                url: 'https://example.com/audio.mp3',
                title: 'ملف صوتي'
            });
            expect(attachments[2]).toEqual({
                type: 'video',
                url: 'https://mysite.com/media/video.mp4',
                title: 'مقطع مرئي'
            });
        });
    });
});
//# sourceMappingURL=content-extractor.service.spec.js.map