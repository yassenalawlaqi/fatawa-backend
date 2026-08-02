"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const backup_service_1 = require("./backup.service");
describe('BackupService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [backup_service_1.BackupService],
        }).compile();
        service = module.get(backup_service_1.BackupService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=backup.service.spec.js.map