import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Progressive signup: identify with phone OR email, verify with a code, done.
 * Name and "what are you here for?" are captured LATER, never blocking entry.
 * (OTP delivery is stubbed — wired to an SMS/email provider in production.)
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async requestOtp(identifier: { phone?: string; email?: string }) {
    // TODO deliver a real code via SMS/email. For now, always "sent".
    return { sent: true, channel: identifier.phone ? 'sms' : 'email' };
  }

  async verifyOtp(identifier: { phone?: string; email?: string }, _code: string) {
    const where = identifier.phone ? { phone: identifier.phone } : { email: identifier.email };
    const user = await this.prisma.user.upsert({
      where: where as any,
      create: {
        ...identifier,
        phoneVerified: !!identifier.phone,
        emailVerified: !!identifier.email,
        avatarColor: pickColor(),
      },
      update: {
        phoneVerified: identifier.phone ? true : undefined,
        emailVerified: identifier.email ? true : undefined,
      },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET') ?? 'dev-access',
        expiresIn: this.config.get('JWT_ACCESS_TTL') ?? '15m',
      },
    );
    return { user: { id: user.id, name: user.name, role: user.role }, accessToken };
  }

  /** Later: capture name / intent progressively. */
  async completeProfile(userId: string, patch: { name?: string; intent?: string; languages?: string[] }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: patch,
      select: { id: true, name: true, intent: true, languages: true },
    });
  }
}

function pickColor(): string {
  const palette = ['#FF9FB0,#FFC48A', '#8FD6A6,#6FB8D6', '#B9A6F0,#F0A6C8', '#7BC96F,#B0E1A2'];
  return palette[Math.floor(Math.random() * palette.length)];
}
