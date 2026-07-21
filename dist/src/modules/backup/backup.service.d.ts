export declare class BackupService {
    private readonly logger;
    handleDailyBackup(): Promise<void>;
    private enforceRetentionPolicy;
}
