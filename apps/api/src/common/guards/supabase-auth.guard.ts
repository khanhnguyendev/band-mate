import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SupabaseService } from '../../supabase/supabase.service'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractToken(request)

    if (!token) throw new UnauthorizedException()

    const user = await this.supabase.getUser(token)

    if (!user) throw new UnauthorizedException()

    // D3: email verification required
    if (!user.email_confirmed_at) {
      throw new UnauthorizedException('Please verify your email before logging in')
    }

    request.user = user
    return true
  }

  private extractToken(request: { headers: Record<string, string> }): string | null {
    const [type, token] = request.headers['authorization']?.split(' ') ?? []
    return type === 'Bearer' ? token : null
  }
}
