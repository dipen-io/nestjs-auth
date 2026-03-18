import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T> {
    success: boolean;
    meta: {
        timestamp: string;
        path: string;
    };
    data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> | Promise<Observable<ApiResponse<T>>> {
        const request = context.switchToHttp().getRequest();

        return next.handle().pipe(
            map(data => ({
                success: true,
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                },
                data
            }))
        )
    }
}
