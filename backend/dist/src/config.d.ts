export declare const config: {
    port: number;
    nodeEnv: string;
    isProduction: boolean;
    isTest: boolean;
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: {
        origin: string;
    };
    idempotency: {
        ttlHours: number;
    };
};
