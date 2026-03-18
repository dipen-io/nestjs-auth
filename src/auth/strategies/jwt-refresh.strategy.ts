// src/auth/strategies/jwt-refresh.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'fallback-secret',
            passReqToCallback: true, // so we can access req.body in validate()
        });
    }

    async validate(req: Request, payload: { sub: string; email: string }) {
        const refreshToken = req.body.refreshToken;
        return { userId: payload.sub, email: payload.email, refreshToken };
    }
}
