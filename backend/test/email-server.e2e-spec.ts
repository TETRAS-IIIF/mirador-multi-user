import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { EmailServerController } from '../src/utils/email/email.controller';
import { EmailServerService } from '../src/utils/email/email.service';
import { SettingsService } from '../src/BaseEntities/setting/setting.service';

/**
 * HTTP-level test of POST /email-server/test with the real AuthGuard and a
 * real JWT. Mail sending and the admin lookup are mocked, so no database or
 * SMTP server is needed.
 */
describe('POST /email-server/test (e2e)', () => {
  const SECRET = 'e2e-test-secret';
  const ADMIN_ID = 1;
  const USER_ID = 2;

  let app: INestApplication;
  let jwt: JwtService;
  const sendTestMail = jest.fn().mockResolvedValue({ sent: true });
  const isAdmin = jest.fn(async (id: number) => id === ADMIN_ID);

  const tokenFor = (sub: number) =>
    jwt.signAsync({ sub, isEmailConfirmed: true }, { secret: SECRET });

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      controllers: [EmailServerController],
      providers: [
        { provide: EmailServerService, useValue: { sendTestMail } },
        { provide: SettingsService, useValue: { isAdmin } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => sendTestMail.mockClear());

  it('returns 401 without a token', async () => {
    await request(app.getHttpServer()).post('/email-server/test').expect(401);
    expect(sendTestMail).not.toHaveBeenCalled();
  });

  it('returns 401 with an invalid token', async () => {
    await request(app.getHttpServer())
      .post('/email-server/test')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
    expect(sendTestMail).not.toHaveBeenCalled();
  });

  it('returns 403 for a non-admin user', async () => {
    await request(app.getHttpServer())
      .post('/email-server/test')
      .set('Authorization', `Bearer ${await tokenFor(USER_ID)}`)
      .expect(403);
    expect(sendTestMail).not.toHaveBeenCalled();
  });

  it('sends the test mail for an admin', async () => {
    await request(app.getHttpServer())
      .post('/email-server/test')
      .set('Authorization', `Bearer ${await tokenFor(ADMIN_ID)}`)
      .expect(201);
    expect(sendTestMail).toHaveBeenCalledTimes(1);
  });
});
