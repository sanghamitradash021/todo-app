import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly errorCode: string;
    readonly fields?: string[] | undefined;
    constructor(statusCode: number, errorCode: string, message: string, fields?: string[] | undefined);
}
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map