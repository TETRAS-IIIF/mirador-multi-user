import { Test, TestingModule } from '@nestjs/testing';
import { EmailConfirmationController } from './email-confirmation.controller';
import { EmailConfirmationService } from './email-confirmation.service';
import { ConfirmEmailDto } from './dto/ConfirmEmailDto';

describe('EmailConfirmationController', () => {
  let controller: EmailConfirmationController;
  let service: jest.Mocked<EmailConfirmationService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<EmailConfirmationService>> = {
      decodeConfirmationToken: jest.fn(),
      confirmEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailConfirmationController],
      providers: [
        {
          provide: EmailConfirmationService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get(EmailConfirmationController);
    service = module.get(
      EmailConfirmationService,
    ) as jest.Mocked<EmailConfirmationService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('confirm() decodes token then confirms email and returns nothing', async () => {
    const dto: ConfirmEmailDto = { token: 'fake-token' };

    service.decodeConfirmationToken.mockResolvedValue('user@example.com');
    service.confirmEmail.mockResolvedValue(undefined);

    const result = await controller.confirm(dto);

    expect(service.decodeConfirmationToken).toHaveBeenCalledWith('fake-token');
    expect(service.confirmEmail).toHaveBeenCalledWith('user@example.com');
    expect(result).toBeUndefined();
  });
});
