import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // comes from JwtAuthGuard

    if (!user?.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before accessing this resource.'
      );
    }
    return true;
  }
}
